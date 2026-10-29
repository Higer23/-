export function beginGithubFetch(previous, user, forceLive) {
  const sameUser = previous.status === "ok" && previous.data?.profile?.login?.toLowerCase() === user.toLowerCase();
  return forceLive && sameUser
    ? { ...previous, refreshing: true, refreshError: undefined }
    : { status: "loading" };
}

export function failGithubFetch(previous, user, error) {
  const message = error instanceof Error ? error.message : String(error);
  const sameUser = previous.status === "ok" && previous.data?.profile?.login?.toLowerCase() === user.toLowerCase();
  return sameUser
    ? { ...previous, refreshing: false, refreshError: message }
    : { status: "error", error: message };
}
