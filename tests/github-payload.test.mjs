import test from "node:test";
import assert from "node:assert/strict";
import { isGithubProfile, isGithubRepoList } from "../app/src/lib/github-payload.mjs";

const validRepo = {
  full_name: "octocat/hello-world",
  fork: false,
  stargazers_count: 12,
  pushed_at: "2026-10-01T12:00:00Z",
  language: "TypeScript",
  description: "Example repository",
};

test("accepts a valid profile and compares login case-insensitively", () => {
  assert.equal(isGithubProfile({ login: "OctoCat" }), true);
  assert.equal(isGithubProfile({ login: "OctoCat" }, "octocat"), true);
  assert.equal(isGithubProfile({ login: "someone-else" }, "octocat"), false);
});

test("rejects missing or malformed profile objects", () => {
  for (const value of [null, undefined, [], {}, { login: "" }, { login: 42 }]) {
    assert.equal(isGithubProfile(value), false);
  }
});

test("accepts empty and well-formed repository lists", () => {
  assert.equal(isGithubRepoList([]), true);
  assert.equal(isGithubRepoList([validRepo]), true);
  assert.equal(isGithubRepoList([{ ...validRepo, language: null, description: null, pushed_at: null }]), true);
});

test("rejects repository lists containing malformed entries", () => {
  for (const value of [null, {}, [null], [{}], [{ ...validRepo, fork: "false" }], [{ ...validRepo, stargazers_count: "12" }], [{ ...validRepo, stargazers_count: -1 }], [{ ...validRepo, pushed_at: 12 }], [{ ...validRepo, language: 7 }]]) {
    assert.equal(isGithubRepoList(value), false);
  }
});
