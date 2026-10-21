export const CONFIG = {
  user: "Higer23",
  // Public Turnstile site key. Never put the private secret here.
  turnstileSiteKey: "0x4AAAAAAFefxVQuDmaf4QKI",
  // Cloudflare Worker endpoint used to verify Turnstile tokens.
  turnstileVerifyUrl: "https://higer23-turnstile-verify.halilgercek023.workers.dev/api/turnstile/verify",
  requestTimeoutMs: 8000,
} as const;
