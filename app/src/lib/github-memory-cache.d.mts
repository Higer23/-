export type GithubMemoryCacheEntry<T> = { value: T; expiresAt: number };
export const GITHUB_MEMORY_CACHE_TTL_MS: number;
export function getOrFetchCached<T>(cache: Map<string, GithubMemoryCacheEntry<T>>, key: string, fetcher: () => Promise<T>, options?: { now?: number; ttlMs?: number; skipCache?: boolean; onCacheSet?: (key: string, value: T, expiresAt: number) => void }): Promise<T>;
export function subscribeToCacheChannel<T>(cache: Map<string, GithubMemoryCacheEntry<T>>, channel: { addEventListener: (type: string, listener: (event: any) => void) => void; removeEventListener?: (type: string, listener: (event: any) => void) => void } | null | undefined, isValidEntry: (key: string, value: unknown) => value is T): () => void;
export function publishCacheEntry<T>(channel: { postMessage: (message: unknown) => void } | null | undefined, key: string, value: T, expiresAt: number): void;
