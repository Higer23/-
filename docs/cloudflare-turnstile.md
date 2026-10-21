# Cloudflare Turnstile entrance check

The React app includes a Turnstile gate and a verification-only Cloudflare Worker. The public Site Key is configured in `app/src/config.ts`. The private Secret Key must never be committed to GitHub, placed in frontend code, or pasted into chat.

## Remaining activation steps

1. In Cloudflare Turnstile, rotate the secret key that was shared in chat, then use the newly generated secret.
2. Deploy `worker/index.js` using `worker/wrangler.toml` as the Worker named `higer23-turnstile-verify`.
3. In the Cloudflare dashboard, open that Worker and add a **Secret** named `TURNSTILE_SECRET` with the newly rotated Turnstile secret. Do not add it as a plain variable and do not commit it to Git.
   - CLI alternative from the `worker/` directory: `npx wrangler secret put TURNSTILE_SECRET`. Paste the rotated value only into the terminal prompt.
4. Copy the deployed Worker URL, then set `turnstileVerifyUrl` in `app/src/config.ts` to `https://<your-worker-subdomain>.workers.dev/api/turnstile/verify`.
5. Build and publish the Vite app to the GitHub Pages root. The current repository has no `.github/workflows` directory, so do not assume a source change automatically rebuilds the live site.
6. Test the live site and confirm the Turnstile analytics show successful Siteverify requests.

## Important limitations

- The widget must allow the hostname `higer23.github.io`.
- The Worker accepts requests only from `https://higer23.github.io` and validates tokens with Cloudflare Siteverify.
- The React gate prevents the app UI from mounting until verification, but it cannot block the initial HTML response from GitHub Pages. A Cloudflare challenge before HTML delivery requires a custom domain proxied through Cloudflare or hosting the site on Cloudflare Pages/Workers.
- Until the Worker is deployed and `turnstileVerifyUrl` is configured, the gate intentionally remains disabled so the site does not lock visitors out.
