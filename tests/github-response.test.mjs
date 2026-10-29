import test from "node:test";
import assert from "node:assert/strict";
import { getGitHubRetryDelay, parseGitHubResponse } from "../app/src/lib/github-response.mjs";

function response({ status = 200, ok = status >= 200 && status < 300, headers, json = async () => ({ login: "Higer23" }) } = {}) {
  return { status, ok, headers, json };
}
const headers = (values) => ({ get: (name) => values[name.toLowerCase()] ?? null });

test("parses valid GitHub JSON", async () => {
  assert.deepEqual(await parseGitHubResponse(response()), { login: "Higer23" });
});

test("normalizes invalid JSON into a stable error", async () => {
  await assert.rejects(parseGitHubResponse(response({ json: async () => { throw new SyntaxError("Unexpected token"); } })), { message: "GitHub returned invalid JSON" });
});

test("uses Retry-After seconds for rate-limit guidance", async () => {
  await assert.rejects(parseGitHubResponse(response({ status: 429, ok: false, headers: headers({ "retry-after": "45" }) })), { message: "GitHub rate limit reached, try again in about 45 seconds" });
});

test("uses the primary rate-limit reset timestamp when Retry-After is absent", () => {
  assert.equal(getGitHubRetryDelay(headers({ "x-ratelimit-reset": "1700000060" }), 1700000000000), 60);
});

test("supports HTTP-date Retry-After and ignores malformed headers", () => {
  assert.equal(getGitHubRetryDelay(headers({ "retry-after": "Tue, 14 Nov 2023 22:14:20 GMT" }), 1700000000000), 60);
  assert.equal(getGitHubRetryDelay(headers({ "retry-after": "invalid", "x-ratelimit-reset": "invalid" })), null);
});

test("keeps generic rate-limit guidance when no timing headers exist", async () => {
  await assert.rejects(parseGitHubResponse(response({ status: 403, ok: false })), { message: "GitHub rate limit reached, try again later" });
});

test("preserves missing-profile and other HTTP errors", async () => {
  await assert.rejects(parseGitHubResponse(response({ status: 404, ok: false })), { message: "Profile not found" });
  await assert.rejects(parseGitHubResponse(response({ status: 503, ok: false })), { message: "GitHub request failed (HTTP 503)" });
});

test("rethrows non-JSON parsing failures unchanged", async () => {
  const failure = new Error("stream failed");
  await assert.rejects(parseGitHubResponse(response({ json: async () => { throw failure; } })), (error) => error === failure);
});
