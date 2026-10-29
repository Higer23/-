/** Return a human-readable retry delay from GitHub's rate-limit headers. */
export function getGitHubRetryDelay(headers, now = Date.now()) {
  const retryAfter = headers?.get?.("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);
    const date = Date.parse(retryAfter);
    if (Number.isFinite(date)) return Math.max(0, Math.ceil((date - now) / 1000));
  }

  const reset = Number(headers?.get?.("x-ratelimit-reset"));
  if (Number.isFinite(reset) && reset > 0) return Math.max(0, Math.ceil(reset - now / 1000));
  return null;
}

/** Parse a GitHub API response into JSON with stable, user-safe error messages. */
export async function parseGitHubResponse(response) {
  if (response.status === 403 || response.status === 429) {
    const delay = getGitHubRetryDelay(response.headers);
    const message = delay === null
      ? "GitHub rate limit reached, try again later"
      : `GitHub rate limit reached, try again in about ${delay} seconds`;
    throw new Error(message);
  }
  if (response.status === 404) throw new Error("Profile not found");
  if (!response.ok) throw new Error(`GitHub request failed (HTTP ${response.status})`);

  try {
    return await response.json();
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error("GitHub returned invalid JSON");
    throw error;
  }
}
