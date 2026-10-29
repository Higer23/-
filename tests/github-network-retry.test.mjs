import test from "node:test";
import assert from "node:assert/strict";
import { fetchWithNetworkRetry } from "../app/src/lib/github-network-retry.mjs";

test("retries transient network TypeErrors with bounded exponential delays", async () => {
  let attempts = 0;
  const delays = [];
  const result = await fetchWithNetworkRetry(async () => {
    attempts += 1;
    if (attempts < 3) throw new TypeError("Failed to fetch");
    return "ok";
  }, { wait: async (ms) => delays.push(ms) });
  assert.equal(result, "ok");
  assert.equal(attempts, 3);
  assert.deepEqual(delays, [250, 500]);
});

test("does not retry aborts or non-network errors", async () => {
  for (const error of [Object.assign(new Error("aborted"), { name: "AbortError" }), new Error("bad response")]) {
    let attempts = 0;
    await assert.rejects(fetchWithNetworkRetry(async () => {
      attempts += 1;
      throw error;
    }, { wait: async () => assert.fail("should not wait") }), error);
    assert.equal(attempts, 1);
  }
});

test("stops after the configured retry limit", async () => {
  let attempts = 0;
  await assert.rejects(fetchWithNetworkRetry(async () => {
    attempts += 1;
    throw new TypeError("offline");
  }, { wait: async () => {}, maxRetries: 1 }), /offline/);
  assert.equal(attempts, 2);
});


test("does not retry network errors after the request signal is aborted", async () => {
  const controller = new AbortController();
  controller.abort();
  let attempts = 0;
  await assert.rejects(fetchWithNetworkRetry(async () => {
    attempts += 1;
    throw new TypeError("network failed after abort");
  }, { signal: controller.signal, wait: async () => assert.fail("must not wait after timeout") }), /network failed after abort/);
  assert.equal(attempts, 1);
});
