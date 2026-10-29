import test from "node:test";
import assert from "node:assert/strict";
import { getOrFetchCached, GITHUB_MEMORY_CACHE_TTL_MS, GITHUB_MEMORY_CACHE_MAX_ENTRIES, setCacheEntry, subscribeToCacheChannel, publishCacheEntry } from "../app/src/lib/github-memory-cache.mjs";

test("reuses a completed value during the short TTL", async () => {
  const cache = new Map(); let calls = 0;
  const fetcher = async () => ({ version: ++calls });
  const first = await getOrFetchCached(cache, "higer23", fetcher, { now: 1000 });
  const second = await getOrFetchCached(cache, "higer23", fetcher, { now: 1000 + GITHUB_MEMORY_CACHE_TTL_MS - 1 });
  assert.equal(first, second); assert.equal(calls, 1);
});

test("expires cached values and fetches fresh data", async () => {
  const cache = new Map(); let calls = 0;
  const fetcher = async () => ({ version: ++calls });
  await getOrFetchCached(cache, "user", fetcher, { now: 1000, ttlMs: 50 });
  const fresh = await getOrFetchCached(cache, "user", fetcher, { now: 1050, ttlMs: 50 });
  assert.deepEqual(fresh, { version: 2 }); assert.equal(calls, 2);
});

test("force refresh bypasses a cached value but replaces it on success", async () => {
  const cache = new Map(); let calls = 0;
  const fetcher = async () => ({ version: ++calls });
  await getOrFetchCached(cache, "user", fetcher, { now: 1000 });
  const forced = await getOrFetchCached(cache, "user", fetcher, { now: 1001, skipCache: true });
  const next = await getOrFetchCached(cache, "user", fetcher, { now: 1002 });
  assert.deepEqual(forced, { version: 2 }); assert.equal(next, forced); assert.equal(calls, 2);
});

test("does not cache failed fetches", async () => {
  const cache = new Map(); let calls = 0;
  await assert.rejects(getOrFetchCached(cache, "user", async () => { calls += 1; throw new Error("offline"); }), { message: "offline" });
  const value = await getOrFetchCached(cache, "user", async () => { calls += 1; return "recovered"; });
  assert.equal(value, "recovered"); assert.equal(calls, 2);
});

test("keeps different profile keys isolated", async () => {
  const cache = new Map();
  const [a, b] = await Promise.all([
    getOrFetchCached(cache, "alice", async () => "A"),
    getOrFetchCached(cache, "bob", async () => "B"),
  ]);
  assert.equal(a, "A"); assert.equal(b, "B"); assert.equal(cache.size, 2);
});


test("publishes a completed cache entry to sibling tabs", async () => {
  const listeners = new Set(); const messages = [];
  const channel = { addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn), postMessage: (message) => { messages.push(message); for (const fn of listeners) fn({ data: message }); } };
  const cache = new Map();
  subscribeToCacheChannel(cache, channel, (key, value) => key === "alice" && value?.profile === "alice");
  const value = { profile: "alice" };
  publishCacheEntry(channel, "alice", value, Date.now() + 10_000);
  assert.equal(messages.length, 1); assert.equal(cache.get("alice").value, value);
});

test("ignores invalid, expired and unrelated broadcast messages", () => {
  const listeners = new Set(); const channel = { addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) };
  const cache = new Map(); subscribeToCacheChannel(cache, channel, (key, value) => key === "alice" && value === "valid");
  const send = (data) => { for (const fn of listeners) fn({ data }); };
  send({ type: "other", key: "alice", value: "valid", expiresAt: Date.now() + 1000 });
  send({ type: "github-profile-cache", key: "bob", value: "valid", expiresAt: Date.now() + 1000 });
  send({ type: "github-profile-cache", key: "alice", value: "invalid", expiresAt: Date.now() + 1000 });
  send({ type: "github-profile-cache", key: "alice", value: "valid", expiresAt: Date.now() - 1 });
  assert.equal(cache.size, 0);
});


test("does not let an older in-flight tab overwrite a newer refresh", () => {
  const listeners = new Set(); const channel = { addEventListener: (_, fn) => listeners.add(fn) };
  const cache = new Map([["alice", { value: "new", expiresAt: 5000 }]]);
  subscribeToCacheChannel(cache, channel, (key, value) => key === "alice" && typeof value === "string");
  for (const fn of listeners) fn({ data: { type: "github-profile-cache", key: "alice", value: "old", expiresAt: 4000 } });
  assert.equal(cache.get("alice").value, "new");
});


test("bounds cache size and evicts the least recently used profile", async () => {
  const cache = new Map();
  for (let i = 0; i < GITHUB_MEMORY_CACHE_MAX_ENTRIES; i += 1) {
    setCacheEntry(cache, `user-${i}`, i, 10_000);
  }
  await getOrFetchCached(cache, "user-0", async () => -1, { now: 1 });
  setCacheEntry(cache, "new-user", "new", 10_000);
  assert.equal(cache.size, GITHUB_MEMORY_CACHE_MAX_ENTRIES);
  assert.equal(cache.has("user-0"), true);
  assert.equal(cache.has("user-1"), false);
  assert.equal(cache.has("new-user"), true);
});

test("applies the same cache bound to entries received from another tab", () => {
  const listeners = new Set();
  const channel = { addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) };
  const cache = new Map();
  subscribeToCacheChannel(cache, channel, () => true);
  for (let i = 0; i <= GITHUB_MEMORY_CACHE_MAX_ENTRIES; i += 1) {
    for (const fn of listeners) fn({ data: { type: "github-profile-cache", key: `remote-${i}`, value: i, expiresAt: Date.now() + 10_000 } });
  }
  assert.equal(cache.size, GITHUB_MEMORY_CACHE_MAX_ENTRIES);
  assert.equal(cache.has("remote-0"), false);
  assert.equal(cache.has(`remote-${GITHUB_MEMORY_CACHE_MAX_ENTRIES}`), true);
});


test("starts the cache TTL after a slow fetch completes", async () => {
  const cache = new Map();
  let clock = 1_000;
  const value = await getOrFetchCached(cache, "slow-user", async () => {
    clock = 8_000;
    return "fresh";
  }, { now: () => clock, ttlMs: 500 });
  assert.equal(value, "fresh");
  assert.equal(cache.get("slow-user").expiresAt, 8_500);
  const reused = await getOrFetchCached(cache, "slow-user", async () => "unexpected", {
    now: () => 8_499,
    ttlMs: 500,
  });
  assert.equal(reused, "fresh");
});
