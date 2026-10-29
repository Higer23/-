/** Share an in-flight request for a key, then release it on either outcome. */
export function coalesceRequest(inFlight, key, request) {
  const existing = inFlight.get(key);
  if (existing) return existing;
  const pending = Promise.resolve().then(request);
  inFlight.set(key, pending);
  pending.then(
    () => { if (inFlight.get(key) === pending) inFlight.delete(key); },
    () => { if (inFlight.get(key) === pending) inFlight.delete(key); },
  );
  return pending;
}
