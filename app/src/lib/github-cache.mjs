/** Snapshot freshness window; the profile snapshot workflow runs daily. */
export const SNAPSHOT_MAX_AGE_MS = 36 * 60 * 60 * 1000;

export function isSnapshotFresh(fetchedAt, now = Date.now(), maxAgeMs = SNAPSHOT_MAX_AGE_MS) {
  if (typeof fetchedAt !== "string" || !fetchedAt.trim()) return false;
  const timestamp = Date.parse(fetchedAt);
  if (!Number.isFinite(timestamp)) return false;
  const age = now - timestamp;
  return age >= 0 && age <= maxAgeMs;
}

/** Prefer a usable snapshot; fall back to live loading when unavailable or stale. */
export async function getSnapshotOrFetchLive(getSnapshot, fetchLive, isUsable = (snapshot) => snapshot != null) {
  let snapshot = null;
  try {
    snapshot = await getSnapshot();
  } catch {
    // A cache/snapshot failure must not block the live source.
  }
  if (snapshot != null && isUsable(snapshot)) return snapshot;
  return fetchLive();
}
