/** Retry only transient fetch-level network failures; never retry aborts/timeouts. */
export async function fetchWithNetworkRetry(fetcher, options = {}) {
  const maxRetries = Math.max(0, Math.min(2, options.maxRetries ?? 2));
  const wait = options.wait ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await fetcher();
    } catch (error) {
      if (options.signal?.aborted || error?.name === "AbortError" || !(error instanceof TypeError) || attempt >= maxRetries) {
        throw error;
      }
      await wait(250 * (2 ** attempt));
    }
  }
}
