/** Fetch a paginated collection until a short page or the configured safety cap. */
export async function fetchAllGithubPages(fetchPage, isValidPage, pageSize = 100, maxPages = 10) {
  const items = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const batch = await fetchPage(page);
    if (!isValidPage(batch)) throw new Error("Invalid repository data");
    items.push(...batch);
    if (batch.length < pageSize) return items;
    if (page === maxPages) {
      throw new Error(`Repository list exceeds the supported ${pageSize * maxPages}-item limit`);
    }
  }
  return items;
}
