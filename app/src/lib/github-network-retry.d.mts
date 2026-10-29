export function fetchWithNetworkRetry<T>(fetcher: () => Promise<T>, options?: { maxRetries?: number; wait?: (milliseconds: number) => Promise<void>; signal?: AbortSignal }): Promise<T>;
