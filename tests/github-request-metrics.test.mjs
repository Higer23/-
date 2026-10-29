import test from "node:test";
import assert from "node:assert/strict";
import { classifyGithubEndpoint, getGithubRequestMetrics, recordGithubRequest, resetGithubRequestMetrics } from "../app/src/lib/github-request-metrics.mjs";

test("classifies GitHub routes without retaining usernames or query strings", () => {
  assert.equal(classifyGithubEndpoint("https://api.github.com/users/private-name"), "user_profile");
  assert.equal(classifyGithubEndpoint("https://api.github.com/users/private-name/repos?page=2"), "user_repositories");
  assert.equal(classifyGithubEndpoint("https://api.github.com/users/private-name/events/public"), "user_public_events");
  assert.equal(classifyGithubEndpoint("https://api.github.com/repos/a/b"), "other");
  assert.equal(classifyGithubEndpoint("https://api.github.com/graphql"), "graphql");
});

test("aggregates success and failure counts with bounded, non-identifying details", () => {
  resetGithubRequestMetrics();
  recordGithubRequest("https://api.github.com/users/alice", { status: 200, remaining: 4999, outcome: "success", durationMs: 42 });
  recordGithubRequest("https://api.github.com/users/bob", { status: 403, remaining: 0, outcome: "http_error", durationMs: 9 });
  const metrics = getGithubRequestMetrics();
  assert.deepEqual(metrics.user_profile, { requests: 2, successes: 1, errors: 1, lastStatus: 403, lastRemaining: 0, lastDurationMs: 9, lastRequestedAt: metrics.user_profile.lastRequestedAt });
  assert.equal(JSON.stringify(metrics).includes("alice"), false);
  assert.equal(JSON.stringify(metrics).includes("bob"), false);
  assert.equal(Object.keys(metrics).length, 1);
});

test("returns defensive snapshots and accepts network failures without a status", () => {
  resetGithubRequestMetrics();
  recordGithubRequest("not a url", { outcome: "network_error", durationMs: 3 });
  const snapshot = getGithubRequestMetrics();
  snapshot.other.requests = 999;
  assert.equal(getGithubRequestMetrics().other.requests, 1);
  assert.equal(getGithubRequestMetrics().other.lastStatus, null);
});
