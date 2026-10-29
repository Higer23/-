export const SNAPSHOT_MAX_AGE_MS: number;
export function isSnapshotFresh(fetchedAt: unknown, now?: number, maxAgeMs?: number): boolean;
export function shouldUseSnapshot(forceLive?: boolean): boolean;
export function getSnapshotOrFetchLive<T>(getSnapshot: () => Promise<T | null>, fetchLive: () => Promise<T>, isUsable?: (snapshot: T) => boolean): Promise<T>;
