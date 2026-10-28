import { readFile, writeFile, mkdir } from "node:fs/promises";
import { computeScore } from "../app/src/lib/score.js";

const USER = process.env.GH_USER || "Higer23";
const TOKEN = process.env.GITHUB_TOKEN;
const OUT = "app/public/data/profile.json";

if (!TOKEN) {
  console.error("GITHUB_TOKEN is required");
  process.exit(1);
}

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${TOKEN}`,
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "profile-snapshot",
};

// Only the fields the UI and score.js actually read, so the snapshot stays small.
const PROFILE_KEYS = ["login", "name", "avatar_url", "bio", "blog", "location", "company", "followers", "public_repos", "created_at", "html_url"];
const REPO_KEYS = ["name", "full_name", "html_url", "description", "fork", "language", "stargazers_count", "pushed_at"];

const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k] ?? null]));

async function rest(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub ${res.status} on ${path}`);
  return res.json();
}

async function fetchRepos() {
  const repos = [];
  for (let page = 1; page <= 10; page += 1) {
    const batch = await rest(`/users/${USER}/repos?per_page=100&sort=pushed&page=${page}`);
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos;
}

// Replaces the third-party contributions service with the official GraphQL calendar.
async function fetchContributions() {
  const to = new Date();
  const from = new Date(to.getTime() - 365 * 86400000);
  const query = `query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar { weeks { contributionDays { date contributionCount } } }
      }
    }
  }`;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { login: USER, from: from.toISOString(), to: to.toISOString() } }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(`GraphQL failed: ${JSON.stringify(json.errors ?? res.status)}`);
  const weeks = json.data.user.contributionsCollection.contributionCalendar.weeks;
  const contributions = weeks
    .flatMap((w) => w.contributionDays)
    .map((d) => ({ date: d.date, count: d.contributionCount }));
  return { contributions };
}

const rawProfile = await rest(`/users/${USER}`);
const rawRepos = await fetchRepos();

let contrib = null;
try {
  contrib = await fetchContributions();
} catch (e) {
  console.warn(`contributions skipped: ${e.message}`);
}

const data = {
  profile: pick(rawProfile, PROFILE_KEYS),
  repos: rawRepos.map((r) => pick(r, REPO_KEYS)),
  contrib,
};

let previous = null;
try {
  previous = JSON.parse(await readFile(OUT, "utf8")).data;
} catch {
  previous = null;
}
if (JSON.stringify(previous) === JSON.stringify(data)) {
  console.log("snapshot unchanged");
  process.exit(0);
}

const result = computeScore({ profile: data.profile, repos: data.repos, contrib: data.contrib });
await mkdir("app/public/data", { recursive: true });
await writeFile(OUT, JSON.stringify({ fetchedAt: new Date().toISOString(), data }, null, 2) + "\n");
console.log(`snapshot written: score ${result.score} (${result.grade})`);
