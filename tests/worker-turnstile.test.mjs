import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.js";

const ORIGIN = "https://higer23.github.io";
const BASE_URL = "https://verify.example/api/turnstile/verify";
const CLIENT_IP = "192.0.2.10";
function createLimiter(result = { success: true }) {
  const calls = [];
  return {
    calls,
    async limit(input) {
      calls.push(input);
      return result;
    },
  };
}
const ENV = { TURNSTILE_SECRET: "test-secret", VERIFY_RATE_LIMITER: createLimiter() };

function request({ method = "POST", path = "/api/turnstile/verify", origin = ORIGIN, headers = {}, body = '{"token":"test-token"}' } = {}) {
  const requestHeaders = new Headers(headers);
  if (origin !== null) requestHeaders.set("Origin", origin);
  if (method === "POST") requestHeaders.set("CF-Connecting-IP", CLIENT_IP);
  if (body !== null && !requestHeaders.has("Content-Type")) requestHeaders.set("Content-Type", "application/json");
  return new Request(new URL(path, BASE_URL), { method, headers: requestHeaders, body: method === "GET" || method === "HEAD" ? undefined : body });
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

test("answers CORS preflight without contacting the verification service or rate limiter", async () => {
  const limiter = createLimiter();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => assert.fail("preflight must not call fetch");
  try {
    const response = await worker.fetch(request({ method: "OPTIONS", body: null }), { VERIFY_RATE_LIMITER: limiter });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), ORIGIN);
    assert.equal(response.headers.get("Access-Control-Allow-Methods"), "POST, OPTIONS");
    assert.equal(limiter.calls.length, 0);
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

test("rejects requests when the rate-limit binding or trusted client IP is missing", async () => {
  const noBinding = await worker.fetch(request(), { TURNSTILE_SECRET: "test-secret" });
  assert.equal(noBinding.status, 503);
  const noIpRequest = new Request(BASE_URL, {
    method: "POST",
    headers: { Origin: ORIGIN, "Content-Type": "application/json" },
    body: '{"token":"test-token"}',
  });
  const noIp = await worker.fetch(noIpRequest, ENV);
  assert.equal(noIp.status, 503);
});

test("blocks requests rejected by the per-IP rate limiter", async () => {
  const limiter = createLimiter({ success: false });
  const response = await worker.fetch(request(), { ...ENV, VERIFY_RATE_LIMITER: limiter });
  assert.equal(response.status, 429);
  assert.deepEqual(await responseBody(response), {
    success: false,
    error: "Too many verification attempts",
  });
  assert.deepEqual(limiter.calls, [{ key: CLIENT_IP }]);
});

test("fails closed when the rate limiter throws", async () => {
  const limiter = { async limit() { throw new Error("internal binding detail"); } };
  const response = await worker.fetch(request(), { ...ENV, VERIFY_RATE_LIMITER: limiter });
  assert.equal(response.status, 503);
  assert.deepEqual(await responseBody(response), {
    success: false,
    error: "Verification temporarily unavailable",
  });
});

test("rejects malformed, oversized, and missing-token payloads", async () => {
  const malformed = await worker.fetch(request({ body: "{" }), ENV);
  assert.equal(malformed.status, 400);
  const oversized = await worker.fetch(request({ body: JSON.stringify({ token: "x".repeat(4097) }) }), ENV);
  assert.equal(oversized.status, 413);
  const missing = await worker.fetch(request({ body: JSON.stringify({ token: " " }) }), ENV);
  assert.equal(missing.status, 400);
});

test("rejects chunked oversized bodies without relying on Content-Length", async () => {
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{"token":"'));
      controller.enqueue(new Uint8Array(4096));
    },
    cancel() {
      cancelled = true;
    },
  });
  const streamedRequest = new Request(BASE_URL, {
    method: "POST",
    headers: { Origin: ORIGIN, "Content-Type": "application/json", "CF-Connecting-IP": CLIENT_IP },
    body: stream,
    duplex: "half",
  });
  const response = await worker.fetch(streamedRequest, ENV);
  assert.equal(response.status, 413);
  assert.equal(cancelled, true);
});

test("returns a generic client error when the request stream fails", async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.error(new Error("sensitive internal stream detail"));
    },
  });
  const failedRequest = new Request(BASE_URL, {
    method: "POST",
    headers: { Origin: ORIGIN, "Content-Type": "application/json", "CF-Connecting-IP": CLIENT_IP },
    body: stream,
    duplex: "half",
  });
  const response = await worker.fetch(failedRequest, ENV);
  assert.equal(response.status, 400);
  assert.deepEqual(await responseBody(response), { error: "Invalid JSON body" });
});

test("rejects invalid UTF-8 as a malformed body", async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array([0xc3, 0x28]));
      controller.close();
    },
  });
  const invalidRequest = new Request(BASE_URL, {
    method: "POST",
    headers: { Origin: ORIGIN, "Content-Type": "application/json", "CF-Connecting-IP": CLIENT_IP },
    body: stream,
    duplex: "half",
  });
  const response = await worker.fetch(invalidRequest, ENV);
  assert.equal(response.status, 400);
});

test("reports missing server-side secret without making an outbound request", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => assert.fail("missing configuration must not call fetch");
  try {
    const response = await worker.fetch(request(), { VERIFY_RATE_LIMITER: createLimiter() });
    assert.equal(response.status, 503);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("verifies the token, checks hostname, and applies an outbound timeout", async () => {
  const originalFetch = globalThis.fetch;
  const limiter = createLimiter();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
    return Response.json({ success: true, hostname: "higer23.github.io" });
  };
  try {
    const response = await worker.fetch(request(), { ...ENV, VERIFY_RATE_LIMITER: limiter });
    assert.equal(response.status, 200);
    assert.deepEqual(await responseBody(response), { success: true });
    assert.deepEqual(limiter.calls, [{ key: CLIENT_IP }]);
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

test("does not expose upstream response parsing errors", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("internal upstream detail", { status: 200 });
  try {
    const response = await worker.fetch(request(), ENV);
    assert.equal(response.status, 502);
    assert.deepEqual(await responseBody(response), {
      success: false,
      error: "Verification failed",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
