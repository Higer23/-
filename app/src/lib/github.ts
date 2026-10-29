import { CONFIG } from "../config";
import { parseGitHubResponse } from "./github-response.mjs";
import { isGithubProfile, isGithubRepoList } from "./github-payload.mjs";
import { fetchAllGithubPages } from "./github-pagination.mjs";
import { getOptionalContributions } from "./github-contributions.mjs";
import { getSnapshotOrFetchLive, isSnapshotFresh, shouldUseSnapshot } from "./github-cache.mjs";
import { coalesceRequest } from "./request-coalescer.mjs";
import { getOrFetchCached, publishCacheEntry, subscribeToCacheChannel } from "./github-memory-cache.mjs";
import { formatRateLimitWait, getRateLimitWaitMs, updateRateLimitState } from "./github-rate-limit.mjs";
import { recordGithubRequest, getGithubRequestMetrics } from "./github-request-metrics.mjs";
import { fetchWithNetworkRetry } from "./github-network-retry.mjs";

const API = "https://api.github.com";
const SNAPSHOT_PATH = "data/profile.json";

// Timeout, rate-limit and invalid-response errors. Messages are technical (English);
// the UI wraps them in the localized status text.
const githubRateLimit = { remaining: null as number | null, resetAt: null as number | null };

async function getJson(url: string): Promise<any> {
  const waitMs = getRateLimitWaitMs(githubRateLimit);
  if (waitMs > 0) throw new Error(formatRateLimitWait(waitMs));
  const controller = new AbortController();
  const startedAt = Date.now();
  const timer = setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);
  let status: number | null = null;
  let remaining: number | null = null;
  let outcome: "success" | "http_error" | "network_error" = "network_error";
  try {
    const res = await fetchWithNetworkRetry(() => fetch(url, { headers: { Accept: "application/vnd.github+json" }, signal: controller.signal }));
    status = res.status;
    updateRateLimitState(githubRateLimit, res.headers);
    const rawRemaining = res.headers.get("x-ratelimit-remaining");
    remaining = rawRemaining !== null && /^\d+$/.test(rawRemaining) ? Number(rawRemaining) : null;
    const data = await parseGitHubResponse(res);
    outcome = "success";
    return data;
  } catch (err) {
    if (status !== null) outcome = "http_error";
    if (err instanceof Error && err.name === "AbortError") throw new Error("GitHub did not respond (timeout)");
    throw err;
  } finally {
    recordGithubRequest(url, { status, remaining, outcome, durationMs: Date.now() - startedAt });
    clearTimeout(timer);
  }
}


export { getGithubRequestMetrics };

export type GithubData = {
  fetchedAt?: string;
  profile: any;
  repos: any[];
  contrib: { contributions: { date: string; count: number }[] } | null;
};

function isGithubData(value: any): value is GithubData {
  return (
    !!value &&
    isGithubProfile(value.profile) &&
    isGithubRepoList(value.repos) &&
    (value.contrib === null || Array.isArray(value.contrib?.contributions))
  );
}

// Pre-built snapshot written by GitHub Actions (scripts/build-profile.mjs).
// Reading it first avoids browser calls to the GitHub API and its rate limits.
async function fetchSnapshot(user: string): Promise<GithubData | null> {
  try {
    const res = await fetch(new URL(SNAPSHOT_PATH, document.baseURI).toString(), { cache: "no-cache" });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data;
    if (!isGithubData(data) || data.profile.login.toLowerCase() !== user.toLowerCase()) return null;
    return { ...data, fetchedAt: typeof json.fetchedAt === "string" ? json.fetchedAt : undefined };
  } catch {
    return null;
  }
}

const inFlightRequests = new Map<string, Promise<GithubData>>();
const profileCache = new Map<string, { value: GithubData; expiresAt: number }>();
const profileCacheChannel = typeof BroadcastChannel === "undefined"
  ? null
  : (() => { try { return new BroadcastChannel("github-profile-cache-v1"); } catch { return null; } })();
subscribeToCacheChannel(profileCache, profileCacheChannel, (key, value): value is GithubData =>
  isGithubData(value) && value.profile.login.toLowerCase() === key,
);

export function fetchGithub(user: string, options: { forceLive?: boolean } = {}): Promise<GithubData> {
  const normalizedUser = user.trim().toLowerCase();
  const mode = options.forceLive ? "live" : "snapshot";
  return coalesceRequest(inFlightRequests, `${normalizedUser}:${mode}`, () => getOrFetchCached(profileCache, normalizedUser, () => getSnapshotOrFetchLive(
    () => shouldUseSnapshot(options.forceLive) ? fetchSnapshot(user) : Promise.resolve(null),
    async () => {
  // Live fallback when the snapshot is missing or invalid.
  const profile = await getJson(`${API}/users/${user}`);
  if (!isGithubProfile(profile, user)) throw new Error("Invalid profile data");

  // GitHub paginates repository lists at 100 items. Continue until the final
  // page so the displayed star total covers every public repository.
  // Contribution data is optional and comes from a separate service. Start it
  // while paginating GitHub repositories so its latency does not extend the
  // critical path. getContributions already degrades gracefully on failure.
  const contribPromise = getOptionalContributions(user, getJson);
  const repos = await fetchAllGithubPages(
    (page) => getJson(`${API}/users/${user}/repos?per_page=100&sort=pushed&page=${page}`),
    isGithubRepoList,
  );
  const contrib = await contribPromise;
  return { profile, repos, contrib, fetchedAt: new Date().toISOString() };
    },
    (snapshot) => "fetchedAt" in snapshot && isSnapshotFresh(snapshot.fetchedAt),
  ), {
    skipCache: options.forceLive === true,
    onCacheSet: (key, value, expiresAt) => publishCacheEntry(profileCacheChannel, key, value, expiresAt),
  }));
}
