import test from "node:test";
import assert from "node:assert/strict";
import { formatRateLimitWait, getRateLimitWaitMs, updateRateLimitState } from "../app/src/lib/github-rate-limit.mjs";

const makeHeaders = (values) => ({ get: (name) => values[name] ?? null });

test("records the primary rate-limit budget from GitHub headers", () => {
  const state = { remaining: null, resetAt: null };
  updateRateLimitState(state, makeHeaders({ "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1700000060" }));
  assert.deepEqual(state, { remaining: 0, resetAt: 1700000060000 });
});

test("returns the remaining wait while the exhausted window is active", () => {
  const state = { remaining: 0, resetAt: 1700000060000 };
  assert.equal(getRateLimitWaitMs(state, 1700000000000), 60000);
  assert.equal(formatRateLimitWait(60000), "GitHub rate limit reached, try again in about 60 seconds");
});

test("clears an exhausted budget after its reset time", () => {
  const state = { remaining: 0, resetAt: 1000 };
  assert.equal(getRateLimitWaitMs(state, 1000), 0);
  assert.deepEqual(state, { remaining: null, resetAt: null });
});

test("does not overwrite known budget when headers are absent or malformed", () => {
  const state = { remaining: 0, resetAt: 5000 };
  updateRateLimitState(state, makeHeaders({ "x-ratelimit-remaining": "unknown" }));
  assert.deepEqual(state, { remaining: 0, resetAt: 5000 });
});

test("does not block requests when the budget is unknown or positive", () => {
  assert.equal(getRateLimitWaitMs({ remaining: null, resetAt: null }, 0), 0);
  assert.equal(getRateLimitWaitMs({ remaining: 12, resetAt: 1000 }, 0), 0);
});
