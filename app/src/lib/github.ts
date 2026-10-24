import { CONFIG } from "../config";

const API = "https://api.github.com";

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

export async function fetchGithub(user: string) {
  const profile = await getJson(`${API}/users/${user}`);
  if (!profile || !profile.login) throw new Error("Invalid profile data");

  // GitHub paginates repository lists at 100 items. Continue until the final
  // page so the displayed star total covers every public repository.
  const repos: any[] = [];
  for (let page = 1; page <= 10; page += 1) {
    const batch = await getJson(
      `${API}/users/${user}/repos?per_page=100&sort=pushed&page=${page}`,
    );
    if (!Array.isArray(batch)) throw new Error("Invalid repository data");
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  const contrib = await getContributions(user);
  return { profile, repos, contrib };
}
