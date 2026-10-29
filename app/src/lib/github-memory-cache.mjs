/** Short-lived in-memory cache for completed profile reads. */
export const GITHUB_MEMORY_CACHE_TTL_MS = 30_000;
export const GITHUB_MEMORY_CACHE_MAX_ENTRIES = 50;

export function setCacheEntry(cache, key, value, expiresAt, maxEntries = GITHUB_MEMORY_CACHE_MAX_ENTRIES) {
  cache.delete(key);
  cache.set(key, { value, expiresAt });
  while (cache.size > Math.max(1, maxEntries)) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) break;
    cache.delete(oldestKey);
  }
}

export async function getOrFetchCached(cache, key, fetcher, options = {}) {
  const now = options.now ?? Date.now();
  const ttlMs = options.ttlMs ?? GITHUB_MEMORY_CACHE_TTL_MS;
  const skipCache = options.skipCache === true;
  const cached = cache.get(key);
  if (!skipCache && cached && cached.expiresAt > now) {
    cache.delete(key);
    cache.set(key, cached);
    return cached.value;
  }
  if (cached && cached.expiresAt <= now) cache.delete(key);

  const value = await fetcher();
  const expiresAt = now + ttlMs;
  setCacheEntry(cache, key, value, expiresAt);
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
      setCacheEntry(cache, message.key, message.value, message.expiresAt);
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
