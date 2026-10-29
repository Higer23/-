export function getSnapshotOrFetchLive<T>(getSnapshot: () => Promise<T | null>, fetchLive: () => Promise<T>): Promise<T>;
