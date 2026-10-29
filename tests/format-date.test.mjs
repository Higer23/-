import test from "node:test";
import assert from "node:assert/strict";
import { formatFetchedAt } from "../app/src/lib/format-date.mjs";

const timestamp = "2026-10-29T12:34:00.000Z";

test("formats timestamps with the requested locale and timezone", () => {
  assert.equal(formatFetchedAt(timestamp, "en-US", { timeZone: "UTC" }), "Oct 29, 2026, 12:34 PM");
  assert.equal(formatFetchedAt(timestamp, "de-DE", { timeZone: "UTC" }), "29.10.2026, 12:34");
  assert.equal(formatFetchedAt(timestamp, "tr-TR", { timeZone: "UTC" }), "29 Eki 2026 12:34");
});

test("returns null for missing or malformed timestamps", () => {
  assert.equal(formatFetchedAt(undefined, "en-US"), null);
  assert.equal(formatFetchedAt("", "en-US"), null);
  assert.equal(formatFetchedAt("not-a-timestamp", "en-US"), null);
});

test("returns null for an invalid locale instead of crashing the UI", () => {
  assert.equal(formatFetchedAt(timestamp, "not_a_locale"), null);
});
