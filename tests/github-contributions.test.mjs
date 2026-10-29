import test from "node:test";
import assert from "node:assert/strict";
import { getOptionalContributions } from "../app/src/lib/github-contributions.mjs";

const endpoint = "https://github-contributions-api.jogruber.de/v4/octocat?y=last";

test("returns valid contribution data from the optional service", async () => {
  const payload = { contributions: [{ date: "2026-10-28", count: 4 }] };
  const urls = [];
  const result = await getOptionalContributions("octocat", async (url) => { urls.push(url); return payload; });
  assert.equal(result, payload);
  assert.deepEqual(urls, [endpoint]);
});

test("returns null for malformed contribution responses", async () => {
  for (const payload of [null, {}, { contributions: null }, { contributions: "not-an-array" }]) {
    assert.equal(await getOptionalContributions("octocat", async () => payload), null);
  }
});

test("returns null when the optional contribution service rejects", async () => {
  const result = await getOptionalContributions("octocat", async () => { throw new Error("service unavailable"); });
  assert.equal(result, null);
});

test("keeps contribution failures isolated from the caller's primary data flow", async () => {
  const profile = { login: "octocat" };
  const repos = [{ full_name: "octocat/hello", stargazers_count: 2 }];
  const contribPromise = getOptionalContributions("octocat", async () => { throw new Error("timeout"); });
  const primary = { profile, repos };
  const contrib = await contribPromise;
  assert.deepEqual(primary, { profile, repos });
  assert.equal(contrib, null);
});
