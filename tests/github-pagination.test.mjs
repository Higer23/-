import test from "node:test";
import assert from "node:assert/strict";
import { fetchAllGithubPages } from "../app/src/lib/github-pagination.mjs";

const page = (count, offset = 0) => Array.from({ length: count }, (_, i) => offset + i);

test("pagination combines full pages and stops on the first short page", async () => {
  const requested = [];
  const result = await fetchAllGithubPages(async (n) => {
    requested.push(n);
    return n === 1 ? page(3, 0) : page(2, 3);
  }, Array.isArray, 3, 4);
  assert.deepEqual(result, [0, 1, 2, 3, 4]);
  assert.deepEqual(requested, [1, 2]);
});

test("pagination handles an empty first page without requesting another", async () => {
  const requested = [];
  const result = await fetchAllGithubPages(async (n) => { requested.push(n); return []; }, Array.isArray, 3, 4);
  assert.deepEqual(result, []);
  assert.deepEqual(requested, [1]);
});

test("pagination rejects malformed pages instead of returning partial results", async () => {
  await assert.rejects(
    fetchAllGithubPages(async (n) => n === 1 ? [1, 2, 3] : null, Array.isArray, 3, 4),
    /Invalid repository data/,
  );
});

test("pagination fails explicitly when the final allowed page is full", async () => {
  const requested = [];
  await assert.rejects(
    fetchAllGithubPages(async (n) => { requested.push(n); return page(3, (n - 1) * 3); }, Array.isArray, 3, 2),
    /supported 6-item limit/,
  );
  assert.deepEqual(requested, [1, 2]);
});

test("pagination accepts a full final page when it is followed by a short page", async () => {
  const result = await fetchAllGithubPages(async (n) => n === 1 ? page(3) : page(1, 3), Array.isArray, 3, 2);
  assert.deepEqual(result, [0, 1, 2, 3]);
});
