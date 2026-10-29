/** In-memory, privacy-safe diagnostics for GitHub REST requests. */
const metrics = new Map();

export function classifyGithubEndpoint(input) {
  let pathname;
  try { pathname = new URL(input, "https://api.github.com").pathname.replace(/\/+$/, ""); }
  catch { return "other"; }
  if (pathname === "/graphql") return "graphql";
  if (/^\/users\/[^/]+\/repos$/.test(pathname)) return "user_repositories";
  if (/^\/users\/[^/]+\/events\/public$/.test(pathname)) return "user_public_events";
  if (/^\/users\/[^/]+$/.test(pathname)) return "user_profile";
  return "other";
}

export function recordGithubRequest(input, { status = null, remaining = null, outcome = "network_error", durationMs = 0 } = {}) {
  const endpoint = classifyGithubEndpoint(input);
  let entry = metrics.get(endpoint);
  if (!entry) {
    entry = { requests: 0, successes: 0, errors: 0, lastStatus: null, lastRemaining: null, lastDurationMs: null, lastRequestedAt: null };
    metrics.set(endpoint, entry);
  }
  entry.requests += 1;
  if (outcome === "success") entry.successes += 1;
  else entry.errors += 1;
  entry.lastStatus = Number.isInteger(status) ? status : null;
  entry.lastRemaining = Number.isInteger(remaining) && remaining >= 0 ? remaining : null;
  entry.lastDurationMs = Number.isFinite(durationMs) ? Math.max(0, durationMs) : null;
  entry.lastRequestedAt = Date.now();
}

export function getGithubRequestMetrics() {
  return Object.fromEntries([...metrics.entries()].map(([endpoint, entry]) => [endpoint, { ...entry }]));
}

export function resetGithubRequestMetrics() {
  metrics.clear();
}
