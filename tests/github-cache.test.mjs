import test from "node:test";
import assert from "node:assert/strict";
import { getSnapshotOrFetchLive, isSnapshotFresh, shouldUseSnapshot, SNAPSHOT_MAX_AGE_MS } from "../app/src/lib/github-cache.mjs";

const now = Date.parse("2026-10-29T12:00:00.000Z");

test("accepts snapshots inside the freshness window", () => {
  assert.equal(isSnapshotFresh(new Date(now - 60_000).toISOString(), now), true);
  assert.equal(isSnapshotFresh(new Date(now - SNAPSHOT_MAX_AGE_MS).toISOString(), now), true);
});

test("rejects stale, missing, malformed, and future timestamps", () => {
  assert.equal(isSnapshotFresh(new Date(now - SNAPSHOT_MAX_AGE_MS - 1).toISOString(), now), false);
  assert.equal(isSnapshotFresh(undefined, now), false);
  assert.equal(isSnapshotFresh("not-a-date", now), false);
  assert.equal(isSnapshotFresh(new Date(now + 1).toISOString(), now), false);
});

test("uses a fresh snapshot without requesting live data", async () => {
  const snapshot = { fetchedAt: new Date(now - 1_000).toISOString(), profile: { login: "octocat" } };
  let liveCalls = 0;
  const result = await getSnapshotOrFetchLive(async () => snapshot, async () => { liveCalls += 1; return {}; }, (value) => isSnapshotFresh(value.fetchedAt, now));
  assert.equal(result, snapshot);
  assert.equal(liveCalls, 0);
});

test("falls back to live data when the snapshot is stale", async () => {
  const snapshot = { fetchedAt: new Date(now - SNAPSHOT_MAX_AGE_MS - 1).toISOString() };
  const live = { profile: { login: "octocat" }, repos: [], contrib: null };
  let liveCalls = 0;
  const result = await getSnapshotOrFetchLive(async () => snapshot, async () => { liveCalls += 1; return live; }, (value) => isSnapshotFresh(value.fetchedAt, now));
  assert.equal(result, live);
  assert.equal(liveCalls, 1);
});

test("falls back to live data when snapshot is missing", async () => {
  const live = { profile: { login: "octocat" }, repos: [], contrib: null };
  const result = await getSnapshotOrFetchLive(async () => null, async () => live);
  assert.equal(result, live);
});

test("falls back to live data when snapshot loading rejects", async () => {
  const live = { profile: { login: "octocat" }, repos: [], contrib: null };
  const result = await getSnapshotOrFetchLive(async () => { throw new Error("snapshot parse failure"); }, async () => live);
  assert.equal(result, live);
});

test("propagates live API errors when no usable snapshot exists", async () => {
  const error = new Error("GitHub unavailable");
  await assert.rejects(getSnapshotOrFetchLive(async () => null, async () => { throw error; }), error);
});

test("manual refresh bypasses the prebuilt snapshot", () => {
  assert.equal(shouldUseSnapshot(false), true);
  assert.equal(shouldUseSnapshot(undefined), true);
  assert.equal(shouldUseSnapshot(true), false);
});
