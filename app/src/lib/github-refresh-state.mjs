export function beginGithubFetch<T extends { status: string; data?: { profile?: { login?: string } }; refreshing?: boolean; refreshError?: string }>(previous: T, user: string, forceLive: boolean): T | { status: "loading" } {
  const sameUser = previous.status === "ok" && previous.data?.profile?.login?.toLowerCase() === user.toLowerCase();
  return forceLive && sameUser
    ? { ...previous, refreshing: true, refreshError: undefined } as T
    : { status: "loading" };
}

export function failGithubFetch<T extends { status: string; data?: { profile?: { login?: string } }; refreshing?: boolean; refreshError?: string }>(previous: T, user: string, error: unknown): T | { status: "error"; error: string } {
  const message = error instanceof Error ? error.message : String(error);
  const sameUser = previous.status === "ok" && previous.data?.profile?.login?.toLowerCase() === user.toLowerCase();
  return sameUser
    ? { ...previous, refreshing: false, refreshError: message } as T
    : { status: "error", error: message };
}
