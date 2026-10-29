import { CONFIG } from "../config";

const API = "https://api.github.com";
const SNAPSHOT_PATH = "data/profile.json";

// Timeout, rate-limit and invalid-response errors. Messages are technical (English);
// the UI wraps them in the localized status text.
async function getJson(url: string): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);
  try {
    const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" }, signal: controller.signal });
    if (res.status === 403 || res.status === 429) throw new Error("GitHub rate limit reached, try again later");
    if (res.status === 404) throw new Error("Profile not found");
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw new Error("GitHub did not respond (timeout)");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Contribution data comes from a third-party service; failures degrade gracefully.
async function getContributions(user: string) {
  try {
    const data = await getJson(`https://github-contributions-api.jogruber.de/v4/${user}?y=last`);
    return Array.isArray(data.contributions) ? data : null;
  } catch {
    return null;
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
    typeof value.profile?.login === "string" &&
    Array.isArray(value.repos) &&
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
  const snapshot = await fetchSnapshot(user);
  if (snapshot) return snapshot;

  // Live fallback when the snapshot is missing or invalid.
  const profile = await getJson(`${API}/users/${user}`);
  if (!profile || !profile.login) throw new Error("Invalid profile data");

  // GitHub paginates repository lists at 100 items. Continue until the final
  // page so the displayed star total covers every public repository.
  // Contribution data is optional and comes from a separate service. Start it
  // while paginating GitHub repositories so its latency does not extend the
  // critical path. getContributions already degrades gracefully on failure.
  const contribPromise = getContributions(user);
  const repos: any[] = [];
  for (let page = 1; page <= 10; page += 1) {
    const batch = await getJson(`${API}/users/${user}/repos?per_page=100&sort=pushed&page=${page}`);
    if (!Array.isArray(batch)) throw new Error("Invalid repository data");
    repos.push(...batch);
    if (batch.length < 100) break;
    if (page === 10) {
      throw new Error("Repository list exceeds the supported 1000-item limit");
    }
  }
  const contrib = await contribPromise;
  return { profile, repos, contrib };
}
