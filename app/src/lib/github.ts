import { CONFIG } from "../config";
import { parseGitHubResponse } from "./github-response.mjs";
import { isGithubProfile, isGithubRepoList } from "./github-payload.mjs";
import { fetchAllGithubPages } from "./github-pagination.mjs";
import { getOptionalContributions } from "./github-contributions.mjs";
import { getSnapshotOrFetchLive } from "./github-cache.mjs";

const API = "https://api.github.com";
const SNAPSHOT_PATH = "data/profile.json";

// Timeout, rate-limit and invalid-response errors. Messages are technical (English);
// the UI wraps them in the localized status text.
async function getJson(url: string): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);
  try {
    const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" }, signal: controller.signal });
    return await parseGitHubResponse(res);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw new Error("GitHub did not respond (timeout)");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}


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

export async function fetchGithub(user: string): Promise<GithubData> {
  return getSnapshotOrFetchLive(
    () => fetchSnapshot(user),
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
  return { profile, repos, contrib };
    },
  );
}
