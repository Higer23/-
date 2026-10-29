/** Snapshot freshness window; the profile snapshot workflow runs daily. */
export const SNAPSHOT_MAX_AGE_MS = 36 * 60 * 60 * 1000;
export function isSnapshotFresh(fetchedAt, now = Date.now(), maxAgeMs = SNAPSHOT_MAX_AGE_MS) {
  if (typeof fetchedAt !== "string" || !fetchedAt.trim()) return false;
  const timestamp = Date.parse(fetchedAt);
  if (!Number.isFinite(timestamp)) return false;
  const age = now - timestamp;
  return age >= 0 && age <= maxAgeMs;
}
export function shouldUseSnapshot(forceLive) { return forceLive !== true; }
export async function getSnapshotOrFetchLive(getSnapshot, fetchLive, isUsable = (snapshot) => snapshot != null) {
  let snapshot = null;
  try { snapshot = await getSnapshot(); } catch { /* Continue with live data. */ }
  if (snapshot != null && isUsable(snapshot)) return snapshot;
  return fetchLive();
}
