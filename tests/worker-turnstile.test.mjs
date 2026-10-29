import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.js";

const ORIGIN = "https://higer23.github.io";
const URL = "https://verify.example/api/turnstile/verify";
const ENV = { TURNSTILE_SECRET: "test-secret" };

function request({ method = "POST", path = "/api/turnstile/verify", origin = ORIGIN, headers = {}, body = '{"token":"test-token"}' } = {}) {
  const requestHeaders = new Headers(headers);
  if (origin !== null) requestHeaders.set("Origin", origin);
  if (body !== null && !requestHeaders.has("Content-Type")) requestHeaders.set("Content-Type", "application/json");
  return new Request(new URL(path, URL), { method, headers: requestHeaders, body: method === "GET" || method === "HEAD" ? undefined : body });
}

async function responseBody(response) {
  return response.json();
}

test("rejects paths outside the verification endpoint", async () => {
  const response = await worker.fetch(request({ path: "/other" }), ENV);
  assert.equal(response.status, 404);
});

test("rejects requests from unapproved origins", async () => {
  const response = await worker.fetch(request({ origin: "https://attacker.example" }), ENV);
  assert.equal(response.status, 403);
  assert.deepEqual(await responseBody(response), { error: "Origin not allowed" });
});

test("answers CORS preflight without contacting the verification service", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => assert.fail("preflight must not call fetch");
  try {
    const response = await worker.fetch(request({ method: "OPTIONS", body: null }), ENV);
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), ORIGIN);
    assert.equal(response.headers.get("Access-Control-Allow-Methods"), "POST, OPTIONS");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects unsupported methods and content types", async () => {
  const methodResponse = await worker.fetch(request({ method: "GET", body: null }), ENV);
  assert.equal(methodResponse.status, 405);
  const typeResponse = await worker.fetch(request({ headers: { "Content-Type": "text/plain" } }), ENV);
  assert.equal(typeResponse.status, 415);
});

test("rejects malformed, oversized, and missing-token payloads", async () => {
  const malformed = await worker.fetch(request({ body: "{" }), ENV);
  assert.equal(malformed.status, 400);
  const oversized = await worker.fetch(request({ body: JSON.stringify({ token: "x".repeat(4097) }) }), ENV);
  assert.equal(oversized.status, 413);
  const missing = await worker.fetch(request({ body: JSON.stringify({ token: " " }) }), ENV);
  assert.equal(missing.status, 400);
});

test("reports missing server-side secret without making an outbound request", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => assert.fail("missing configuration must not call fetch");
  try {
    const response = await worker.fetch(request(), {});
    assert.equal(response.status, 503);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("verifies the token, checks hostname, and applies an outbound timeout", async () => {
  const originalFetch = globalThis.fetch;
  let outbound;
  globalThis.fetch = async (url, options) => {
    outbound = { url, options };
    return Response.json({ success: true, hostname: "higer23.github.io" });
  };
  try {
    const response = await worker.fetch(request(), ENV);
    assert.equal(response.status, 200);
    assert.deepEqual(await responseBody(response), { success: true });
    assert.equal(outbound.url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
    assert.equal(outbound.options.method, "POST");
    assert.equal(outbound.options.body.get("secret"), ENV.TURNSTILE_SECRET);
    assert.equal(outbound.options.body.get("response"), "test-token");
    assert.ok(outbound.options.signal instanceof AbortSignal);
    assert.equal(outbound.options.signal.aborted, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects a successful verification response for the wrong hostname", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ success: true, hostname: "attacker.example" });
  try {
    const response = await worker.fetch(request(), ENV);
    assert.equal(response.status, 403);
    assert.deepEqual(await responseBody(response), { success: false });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("maps upstream HTTP and network failures to gateway errors", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(null, { status: 503 });
    const httpFailure = await worker.fetch(request(), ENV);
    assert.equal(httpFailure.status, 502);

    globalThis.fetch = async () => { throw new TypeError("offline"); };
    const networkFailure = await worker.fetch(request(), ENV);
    assert.equal(networkFailure.status, 502);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
