# Cloudflare Turnstile entrance check

The source includes a Turnstile gate and a verification-only Worker. The gate remains disabled while its public site key and Worker URL are blank, so an unconfigured deployment cannot lock visitors out.

## Activation
1. In Cloudflare Dashboard, create a **Managed** Turnstile widget allowing hostname `higer23.github.io`.
2. Put its public **site key** in `app/src/config.ts` as `turnstileSiteKey`.
3. Deploy `worker/index.js` as a Worker named `higer23-turnstile-verify`.
4. Set the private widget secret using `npx wrangler secret put TURNSTILE_SECRET`; never put it in frontend code.
5. Set `turnstileVerifyUrl` to `https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev/api/turnstile/verify`.
6. Build and publish the Vite app to the GitHub Pages root.

The Worker verifies tokens through Cloudflare Siteverify and stores no messages or IP addresses.

## Deployment limitation
Cloudflare API calls currently return authentication error 10000, including widget creation. The widget and Worker could not be created or deployed automatically. Until a real site key and deployed Worker URL are configured, the gate component remains disabled. A React gate prevents the app UI from mounting, but a strict edge-level challenge before the HTML response requires a Cloudflare-proxied custom domain or an edge-hosted site; the `github.io` hostname itself cannot be put behind your own Cloudflare zone.
