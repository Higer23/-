export function fetchWithNetworkRetry<T>(fetcher: () => Promise<T>, options?: { maxRetries?: number; wait?: (milliseconds: number) => Promise<void> }): Promise<T>;
