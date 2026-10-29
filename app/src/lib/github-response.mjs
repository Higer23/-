/** Parse a GitHub API response into JSON with stable, user-safe error messages. */
export async function parseGitHubResponse(response) {
  if (response.status === 403 || response.status === 429) {
    throw new Error("GitHub rate limit reached, try again later");
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
