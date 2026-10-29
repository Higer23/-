/** Track GitHub's primary REST API budget from response headers. */
export function updateRateLimitState(state, headers) {
  const remainingRaw = headers?.get?.("x-ratelimit-remaining");
  const resetRaw = headers?.get?.("x-ratelimit-reset");
  const remaining = Number(remainingRaw);
  const resetSeconds = Number(resetRaw);
  if (remainingRaw == null || !Number.isInteger(remaining) || remaining < 0) return state;
  state.remaining = remaining;
  state.resetAt = Number.isFinite(resetSeconds) && resetSeconds > 0 ? resetSeconds * 1000 : null;
  return state;
}

export function getRateLimitWaitMs(state, now = Date.now()) {
  if (!state || state.remaining !== 0) return 0;
  if (!Number.isFinite(state.resetAt) || state.resetAt <= now) {
    state.remaining = null;
    state.resetAt = null;
    return 0;
  }
  return Math.max(0, state.resetAt - now);
}

export function formatRateLimitWait(waitMs) {
  const seconds = Math.ceil(waitMs / 1000);
  return `GitHub rate limit reached, try again in about ${seconds} seconds`;
}
