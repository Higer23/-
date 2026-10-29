import test from "node:test";
import assert from "node:assert/strict";
import { getSnapshotOrFetchLive } from "../app/src/lib/github-cache.mjs";

test("uses a valid snapshot without requesting live data", async () => {
  const snapshot = { profile: { login: "octocat" }, repos: [], contrib: null };
  let liveCalls = 0;
  const result = await getSnapshotOrFetchLive(async () => snapshot, async () => { liveCalls += 1; return snapshot; });
  assert.equal(result, snapshot);
  assert.equal(liveCalls, 0);
});

test("falls back to live data when snapshot is missing", async () => {
  const live = { profile: { login: "octocat" }, repos: [{ full_name: "octocat/demo" }], contrib: null };
  let liveCalls = 0;
  const result = await getSnapshotOrFetchLive(async () => null, async () => { liveCalls += 1; return live; });
  assert.equal(result, live);
  assert.equal(liveCalls, 1);
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
