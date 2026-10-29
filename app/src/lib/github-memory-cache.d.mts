export type GithubMemoryCacheEntry<T> = { value: T; expiresAt: number };
export const GITHUB_MEMORY_CACHE_TTL_MS: number;
export function getOrFetchCached<T>(cache: Map<string, GithubMemoryCacheEntry<T>>, key: string, fetcher: () => Promise<T>, options?: { now?: number; ttlMs?: number; skipCache?: boolean }): Promise<T>;
