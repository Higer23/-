export const CONFIG = {
  user: "Higer23",
  // Public Turnstile site key; never put the private secret here.
  turnstileSiteKey: "",
  // URL of the deployed Worker endpoint that verifies tokens server-side.
  turnstileVerifyUrl: "",
  requestTimeoutMs: 8000,
} as const;
