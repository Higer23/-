import test from "node:test";
import assert from "node:assert/strict";
import { beginGithubFetch, failGithubFetch } from "../app/src/lib/github-refresh-state.mjs";

const profileState = () => ({
  status: "ok",
  data: { profile: { login: "Higer23" }, repos: [{ name: "demo" }] },
  result: { score: 87 },
});

test("manual refresh keeps the same user's last successful data visible", () => {
  const previous = profileState();
  const next = beginGithubFetch(previous, "higer23", true);
  assert.equal(next.status, "ok");
  assert.equal(next.refreshing, true);
  assert.equal(next.data, previous.data);
  assert.equal(next.result, previous.result);
  assert.equal(next.refreshError, undefined);
});

test("initial load and profile changes do not expose another user's data", () => {
  assert.deepEqual(beginGithubFetch({ status: "loading" }, "Higer23", true), { status: "loading" });
  assert.deepEqual(beginGithubFetch(profileState(), "someone-else", true), { status: "loading" });
  assert.deepEqual(beginGithubFetch(profileState(), "Higer23", false), { status: "loading" });
});

test("refresh failure preserves same-user data and records the error", () => {
  const previous = { ...profileState(), refreshing: true };
  const next = failGithubFetch(previous, "higer23", new Error("API unavailable"));
  assert.equal(next.status, "ok");
  assert.equal(next.refreshing, false);
  assert.equal(next.refreshError, "API unavailable");
  assert.equal(next.data, previous.data);
});

test("initial load or a different user's failure becomes a normal error", () => {
  assert.deepEqual(failGithubFetch({ status: "loading" }, "Higer23", "network down"), {
    status: "error", error: "network down",
  });
  assert.deepEqual(failGithubFetch(profileState(), "someone-else", new Error("not found")), {
    status: "error", error: "not found",
  });
});
