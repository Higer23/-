# Cloudflare Turnstile entrance check

The React app uses a Turnstile gate and a Cloudflare Worker verification endpoint.

- Public Site Key: configured in `app/src/config.ts`; it is expected to be public.
- Worker endpoint: `https://higer23-turnstile-verify.halilgercek023.workers.dev/api/turnstile/verify`.
- Secret binding: `TURNSTILE_SECRET`, configured as a Worker Secret in Cloudflare. Never commit or paste its value.
- Allowed origin and verified hostname: `https://higer23.github.io` / `higer23.github.io`.

## Security behavior

The Worker should accept only the verification path, require the expected Origin, accept only POST JSON (apart from a valid CORS preflight), cap the request body and token size, and fail closed if the secret is missing. A successful Siteverify response is accepted only when both `success === true` and `hostname === "higer23.github.io"`. The Origin check is an additional browser/CORS restriction, not authentication by itself; the Siteverify hostname check is essential.

The Worker never returns the secret or raw Cloudflare Siteverify diagnostics. Responses use `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and `Vary: Origin`.

## Deployment and testing

1. Deploy `worker/index.js` to the Cloudflare Worker named `higer23-turnstile-verify`.
2. Confirm that `TURNSTILE_SECRET` is configured as a **Secret** binding in that Worker. Do not reveal its value in logs, GitHub, or chat.
3. Confirm the Turnstile widget allows the hostname `higer23.github.io`.
4. Wait for the GitHub Pages workflow to finish after changes to the React gate.
5. Test the live site on mobile and desktop:
   - The gate appears before the app interface.
   - The Continue button stays disabled until the widget provides a token.
   - A successful verification opens the app.
   - An expired token, failed request, wrong hostname, missing secret, or malformed request does not open the app.
   - The Worker root URL returning 404 is expected; the verification endpoint is the path above.

## Limitation

This React gate prevents the main app interface from mounting before successful verification. GitHub Pages still serves the initial HTML and JavaScript; it is not an edge challenge before HTML delivery. A true pre-HTML Cloudflare challenge requires a custom domain proxied through Cloudflare or hosting behind Cloudflare Pages/Workers.
