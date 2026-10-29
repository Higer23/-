/** Runtime shape guards for data received from GitHub or the generated snapshot. */
export function isGithubProfile(value, expectedLogin) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (typeof value.login !== "string" || value.login.trim() === "") return false;
  if (expectedLogin && value.login.toLowerCase() !== expectedLogin.toLowerCase()) return false;
  return true;
}

export function isGithubRepoList(value) {
  return Array.isArray(value) && value.every((repo) => {
    if (!repo || typeof repo !== "object" || Array.isArray(repo)) return false;
    return typeof repo.full_name === "string" &&
      typeof repo.fork === "boolean" &&
      Number.isFinite(repo.stargazers_count) && repo.stargazers_count >= 0 &&
      (typeof repo.pushed_at === "string" || repo.pushed_at === null) &&
      (typeof repo.language === "string" || repo.language === null) &&
      (typeof repo.description === "string" || repo.description === null);
  });
}
