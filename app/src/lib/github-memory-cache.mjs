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
  cache.set(key, { value, expiresAt: now + ttlMs });
  return value;
}
