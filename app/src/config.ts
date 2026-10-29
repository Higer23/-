export const CONFIG = {
  user: "Higer23",
  turnstile: {
    siteKey: "0x4AAAAAAFefxVQuDmaf4QKI",
    verifyUrl: "https://higer23-turnstile-verify.halilgercek023.workers.dev/api/turnstile/verify",
  },
  requestTimeoutMs: 8000,
  gate: {
    minFillMs: 1500,
    sliderMinMs: 250,
    sliderMaxMs: 20000,
    sliderDonePct: 90,
    minInteractions: 8,
    maxFailsBeforeLock: 3,
    lockBaseMs: 30_000,
    lockMaxMs: 30 * 60_000,
    passTtlMs: 2 * 60 * 60 * 1000,
    storeKey: "gate-v2-state",
    passKey: "gate-v2-pass",
  },
} as const;
