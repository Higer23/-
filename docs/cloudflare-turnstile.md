# Cloudflare Turnstile Worker

This document describes the separately deployed Cloudflare Worker at:

`https://higer23-turnstile-verify.halilgercek023.workers.dev/api/turnstile/verify`

**Important integration status:** the current React app's `EntranceGate` is a local interaction/challenge gate (`app/src/components/EntranceGate.tsx`). It does not load the Cloudflare Turnstile browser widget and does not call this Worker. The Worker is deployed and configured, but it is not currently part of the app's verification flow. The local gate is a client-side friction mechanism, not a server-verifiable security boundary. Do not describe it as Cloudflare Turnstile or rely on it to protect private resources.

## Worker security behavior

The Worker accepts only the verification path, requires the expected Origin, accepts only POST JSON (apart from a valid CORS preflight), caps the request body and token size, and fails closed if required configuration is missing. A successful Siteverify response is accepted only when both `success === true` and `hostname === "higer23.github.io"`. The Origin check is an additional browser/CORS restriction, not authentication by itself; the Siteverify hostname check is essential.

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
5. Confirm the Turnstile widget allows hostname `higer23.github.io`.
6. Test the Worker endpoint with a real widget token from the allowed hostname before considering the integration operational end-to-end. Do not put secret keys in frontend code, logs, GitHub, or chat.

## Remaining integration work

To make the app use Cloudflare Turnstile, a follow-up change must add the public Turnstile Site Key to frontend configuration, load/render the official browser widget in the gate, send its short-lived token to the Worker endpoint, and open the app only after the Worker returns a successful verification. Handle expired/duplicate tokens and HTTP 429/503 with clear user-facing messages and a safe retry path. The Site Key is public; the `TURNSTILE_SECRET` must remain a Worker Secret. Add automated tests for the client verification flow and verify it in a real browser on the published GitHub Pages origin.

## Hosting limitation

Even after browser-widget integration, GitHub Pages serves the initial HTML and JavaScript before the client gate runs. A client-side gate does not prevent direct asset delivery or protect API/data endpoints by itself. A true edge challenge before HTML delivery requires a custom domain proxied through Cloudflare or hosting behind Cloudflare Pages/Workers. Protect sensitive backend resources independently with server-side authorization.