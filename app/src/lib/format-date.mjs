/** Format a server timestamp using the viewer's locale and local time zone. */
export function formatFetchedAt(value, locale, options = {}) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      ...options,
    }).format(date);
  } catch {
    return null;
  }
}
