import test from "node:test";
import assert from "node:assert/strict";
import { coalesceRequest } from "../app/src/lib/request-coalescer.mjs";

test("shares one pending request for the same key", async () => {
  const inFlight = new Map(); let calls = 0; let resolve;
  const request = () => { calls += 1; return new Promise((done) => { resolve = done; }); };
  const first = coalesceRequest(inFlight, "higer23:live", request);
  const second = coalesceRequest(inFlight, "higer23:live", request);
  assert.equal(first, second); await Promise.resolve(); assert.equal(calls, 1);
  resolve({ login: "Higer23" }); assert.deepEqual(await first, { login: "Higer23" });
  await Promise.resolve(); assert.equal(inFlight.size, 0);
});

test("keeps different users and fetch modes isolated", async () => {
  const inFlight = new Map(); const request = async (login) => ({ login });
  const a = coalesceRequest(inFlight, "higer23:live", () => request("Higer23"));
  const b = coalesceRequest(inFlight, "other:live", () => request("other"));
  const c = coalesceRequest(inFlight, "higer23:snapshot", () => request("snapshot"));
  assert.deepEqual(await Promise.all([a, b, c]), [{ login: "Higer23" }, { login: "other" }, { login: "snapshot" }]);
});

test("removes rejected requests so a later call can retry", async () => {
  const inFlight = new Map(); let calls = 0;
  const first = coalesceRequest(inFlight, "higer23:live", async () => { calls += 1; throw new Error("temporary failure"); });
  await assert.rejects(first, { message: "temporary failure" }); await Promise.resolve();
  const second = coalesceRequest(inFlight, "higer23:live", async () => { calls += 1; return "recovered"; });
  assert.equal(await second, "recovered"); assert.equal(calls, 2);
});

test("an older completion cannot remove a newer request", async () => {
  const inFlight = new Map(); let resolveFirst;
  const first = coalesceRequest(inFlight, "key", () => new Promise((resolve) => { resolveFirst = resolve; }));
  await Promise.resolve(); inFlight.delete("key");
  const second = coalesceRequest(inFlight, "key", async () => "new");
  assert.equal(await second, "new"); resolveFirst("old"); assert.equal(await first, "old");
  assert.equal(inFlight.size, 0);
});
