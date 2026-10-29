import test from "node:test";
import assert from "node:assert/strict";
import { parseGitHubResponse } from "../app/src/lib/github-response.mjs";

function response({ status = 200, ok = status >= 200 && status < 300, json = async () => ({ login: "Higer23" }) } = {}) {
  return { status, ok, json };
}

test("parses valid GitHub JSON", async () => {
  assert.deepEqual(await parseGitHubResponse(response()), { login: "Higer23" });
});

test("normalizes invalid JSON into a stable error", async () => {
  await assert.rejects(
    parseGitHubResponse(response({ json: async () => { throw new SyntaxError("Unexpected token"); } })),
    { message: "GitHub returned invalid JSON" },
  );
});

test("preserves rate-limit and missing-profile errors", async () => {
  await assert.rejects(parseGitHubResponse(response({ status: 403, ok: false })), { message: "GitHub rate limit reached, try again later" });
  await assert.rejects(parseGitHubResponse(response({ status: 429, ok: false })), { message: "GitHub rate limit reached, try again later" });
  await assert.rejects(parseGitHubResponse(response({ status: 404, ok: false })), { message: "Profile not found" });
});

test("reports other HTTP failures with their status", async () => {
  await assert.rejects(parseGitHubResponse(response({ status: 503, ok: false })), { message: "GitHub request failed (HTTP 503)" });
});

test("rethrows non-JSON parsing failures unchanged", async () => {
  const failure = new Error("stream failed");
  await assert.rejects(parseGitHubResponse(response({ json: async () => { throw failure; } })), (error) => error === failure);
});
