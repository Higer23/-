/** Fetch optional contribution data without allowing a third-party outage to fail profile loading. */
export async function getOptionalContributions(user, requestJson) {
  try {
    const data = await requestJson(`https://github-contributions-api.jogruber.de/v4/${user}?y=last`);
    return Array.isArray(data?.contributions) ? data : null;
  } catch {
    return null;
  }
}
