/** Prefer validated snapshot data; fall back to live loading when it is unavailable. */
export async function getSnapshotOrFetchLive<T>(
  getSnapshot: () => Promise<T | null>,
  fetchLive: () => Promise<T>,
): Promise<T> {
  let snapshot: T | null = null;
  try {
    snapshot = await getSnapshot();
  } catch {
    // A cache/snapshot failure must not block the live source.
  }
  return snapshot ?? fetchLive();
}
