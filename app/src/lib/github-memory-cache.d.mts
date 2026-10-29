/** Short-lived in-memory cache for completed profile reads. */
export const GITHUB_MEMORY_CACHE_TTL_MS = 30_000;

export async function getOrFetchCached(cache, key, fetcher, options = {}) {
  const now = options.now ?? Date.now();
  const ttlMs = options.ttlMs ?? GITHUB_MEMORY_CACHE_TTL_MS;
  const skipCache = options.skipCache === true;
  const cached = cache.get(key);
  if (!skipCache && cached && cached.expiresAt > now) return cached.value;
  if (cached && cached.expiresAt <= now) cache.delete(key);

  const value = await fetcher();
  const expiresAt = now + ttlMs;
  cache.set(key, { value, expiresAt });
  options.onCacheSet?.(key, value, expiresAt);
  return value;
}


/** Share completed cache entries with sibling tabs without persistent storage. */
export function subscribeToCacheChannel(cache, channel, isValidEntry) {
  if (!channel?.addEventListener) return () => {};
  const onMessage = (event) => {
    const message = event?.data;
    if (!message || message.type !== "github-profile-cache" || typeof message.key !== "string" ||
        typeof message.expiresAt !== "number" || message.expiresAt <= Date.now() ||
        !isValidEntry(message.key, message.value)) return;
    const current = cache.get(message.key);
    if (!current || message.expiresAt > current.expiresAt) {
      cache.set(message.key, { value: message.value, expiresAt: message.expiresAt });
    }
  };
  channel.addEventListener("message", onMessage);
  return () => channel.removeEventListener?.("message", onMessage);
}

export function publishCacheEntry(channel, key, value, expiresAt) {
  try {
    channel?.postMessage?.({ type: "github-profile-cache", key, value, expiresAt });
  } catch {
    // Broadcast failures must never break profile loading.
  }
}

export function setCacheEntry<T>(cache: Map<string, GithubMemoryCacheEntry<T>>, key: string, value: T, expiresAt: number, maxEntries?: number): void;
