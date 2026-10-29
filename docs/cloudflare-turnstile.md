# Cloudflare Turnstile Worker

This document describes the separately deployed Cloudflare Worker at:

`https://higer23-turnstile-verify.halilgercek023.workers.dev/api/turnstile/verify`

**Integration:** `EntranceGate` loads the official Cloudflare Turnstile browser widget, then sends its short-lived token to this Worker. The app opens only after the Worker confirms `success: true`. The existing local interaction challenge remains an additional client-side friction layer, not a substitute for server verification.

## Worker security behavior

The Worker accepts only the verification path, requires an Origin from the explicit production allowlist, accepts only POST JSON (apart from a valid CORS preflight), caps the request body and token size, and fails closed if required configuration is missing. A successful Siteverify response is accepted only when both `success === true` and `hostname === "higer23.github.io"`. The Origin check is an additional browser/CORS restriction, not authentication by itself; the Siteverify hostname check is essential.

The Worker uses a Cloudflare Workers rate-limiting binding named `VERIFY_RATE_LIMITER`:

- Limit: 10 requests per 60 seconds per client IP.
- Key: Cloudflare-provided `CF-Connecting-IP`; client-controlled forwarding headers are not trusted.
- Requests over the limit receive HTTP 429. If the binding is unavailable or errors, the Worker fails closed with HTTP 503.
- CORS preflight requests are not counted.
- Cloudflare's built-in Worker rate limiter is enforced per Cloudflare location and is not a globally exact counter; traffic served in different locations can have separate counters.

## Worker deployment and configuration

1. Install/authenticate Wrangler for the Cloudflare account that owns the Worker.
2. Deploy from the repository root using the checked-in configuration: `npx wrangler deploy --config worker/wrangler.toml`.
3. Confirm `TURNSTILE_SECRET` exists as a **Secret** binding on the `higer23-turnstile-verify` Worker. Set it with `npx wrangler secret put TURNSTILE_SECRET --config worker/wrangler.toml` if it is missing; enter the value only in the interactive prompt.
4. Confirm the `VERIFY_RATE_LIMITER` binding is present with a limit of 10 and period of 60 seconds. It is declared in `worker/wrangler.toml` using namespace ID `1001`; keep that namespace ID stable for this Worker.
5. Confirm the Turnstile widget allows both production hostnames `higer23.github.io` and `me.higer.tech`.
6. Test the Worker endpoint with a real widget token from the allowed hostname before considering the integration operational end-to-end. Do not put secret keys in frontend code, logs, GitHub, or chat.

## Frontend configuration and verification

The public Site Key is configured in `app/src/config.ts`; it is safe to expose in the browser. The widget named `higer23-github-pages` is restricted to the production hostnames `higer23.github.io` and `me.higer.tech`. The Worker secret must be the matching secret for that same widget; changing the frontend Site Key alone is not enough. The `TURNSTILE_SECRET` must remain a Cloudflare Worker Secret and must never be added to frontend code. After creating or rotating the widget, update the Worker secret in the Cloudflare dashboard (Workers & Pages → `higer23-turnstile-verify` → Settings → Variables and Secrets) with the secret belonging to `higer23-github-pages`. Do not commit or share the secret. The frontend CSP in `app/index.html` allows the Turnstile script/frame and the Worker origin.

The gate handles expired widget tokens, verification failures, rate limiting (HTTP 429), temporary Worker errors (HTTP 502/503), and network failures with user-facing messages. Failed requests reset the widget so a fresh token is used for the next attempt. Verify the complete flow in a real browser on the published custom domain (`me.higer.tech`) and GitHub Pages origin; a build alone does not prove that the Turnstile hostname, CSP, CORS, and live secret all work together.

## Hosting limitation

Even after browser-widget integration, GitHub Pages serves the initial HTML and JavaScript before the client gate runs. A client-side gate does not prevent direct asset delivery or protect API/data endpoints by itself. A true edge challenge before HTML delivery requires a custom domain proxied through Cloudflare or hosting behind Cloudflare Pages/Workers. Protect sensitive backend resources independently with server-side authorization.