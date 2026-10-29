# Cloudflare Turnstile entrance check

The React app uses a Turnstile gate and a Cloudflare Worker verification endpoint.

- Public Site Key: configured in `app/src/config.ts`; it is expected to be public.
- Worker endpoint: `https://higer23-turnstile-verify.halilgercek023.workers.dev/api/turnstile/verify`.
- Secret binding: `TURNSTILE_SECRET`, configured as a Worker Secret in Cloudflare. Never commit or paste its value.
- Allowed origin and verified hostname: `https://higer23.github.io` / `higer23.github.io`.

## Security behavior

The Worker accepts only the verification path, requires the expected Origin, accepts only POST JSON (apart from a valid CORS preflight), caps the request body and token size, and fails closed if required configuration is missing. A successful Siteverify response is accepted only when both `success === true` and `hostname === "higer23.github.io"`. The Origin check is an additional browser/CORS restriction, not authentication by itself; the Siteverify hostname check is essential.

The Worker also uses a Cloudflare Workers rate-limiting binding named `VERIFY_RATE_LIMITER`:

- Limit: 10 requests per 60 seconds per client IP.
- Key: Cloudflare-provided `CF-Connecting-IP`; client-controlled forwarding headers are not trusted.
- Requests over the limit receive HTTP 429. If the binding is unavailable or errors, the Worker fails closed with HTTP 503.
- CORS preflight requests are not counted.
- Cloudflare's built-in Worker rate limiter is enforced per Cloudflare location and is not a globally exact counter; traffic served in different locations can have separate counters.

## Deployment and configuration

1. Install/authenticate Wrangler for the Cloudflare account that owns the Worker.
2. Deploy from the repository root using the checked-in configuration: `npx wrangler deploy --config worker/wrangler.toml`.
3. Confirm `TURNSTILE_SECRET` exists as a **Secret** binding on the `higer23-turnstile-verify` Worker. Set it with `npx wrangler secret put TURNSTILE_SECRET --config worker/wrangler.toml` if it is missing; enter the value only in the interactive prompt.
4. Confirm the `VERIFY_RATE_LIMITER` binding is present with a limit of 10 and period of 60 seconds. It is declared in `worker/wrangler.toml` using namespace ID `1001`; keep that namespace ID stable for this Worker.
5. Confirm the Turnstile widget allows hostname `higer23.github.io`.
6. Wait for the GitHub Pages workflow to finish after changes to the React gate.
7. Test the live site on mobile and desktop:
   - The gate appears before the app interface.
   - The Continue button stays disabled until the widget provides a token.
   - A successful verification opens the app.
   - An expired token, failed request, wrong hostname, missing secret, rate-limited request, or malformed request does not open the app.
   - The Worker root URL returning 404 is expected; the verification endpoint is the path above.

## Limitation

This React gate prevents the main app interface from mounting before successful verification. GitHub Pages still serves the initial HTML and JavaScript; it is not an edge challenge before HTML delivery. A true pre-HTML Cloudflare challenge requires a custom domain proxied through Cloudflare or hosting behind Cloudflare Pages/Workers.