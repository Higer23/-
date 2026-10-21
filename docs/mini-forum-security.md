# Mini forum security and deployment notes

The forum API is a Cloudflare Worker backed by D1. The static site is GitHub Pages.

## Security implemented in source

- Server-side administrator password check for delete and IP-ban actions.
- Administrator password is expected as the encrypted Worker secret `ADMIN_PASSWORD`; it is not embedded in client JavaScript or committed to Git.
- Exact-origin CORS allowlist (`ALLOWED_ORIGIN`), with the GitHub Pages origin as the default.
- IP addresses are SHA-256 hashed before storage; raw IP addresses are not stored in the forum tables.
- Per-IP limit of five new messages per 60 seconds.
- 40-character name and 500-character message limits, JSON request body limit, parameterized SQL, no-store responses, generic server errors.
- Messages are rendered as React text, not interpreted as HTML.

## Required deployment bindings

1. Create a Cloudflare D1 database named `higer-guestbook`.
2. Apply `schema.sql` to that database.
3. Replace `REPLACE_WITH_D1_ID` in `wrangler.toml` with the real D1 database ID.
4. Set the Worker secret `ADMIN_PASSWORD` to a newly rotated, unique password. Do not reuse a password already shared in a chat.
5. Deploy `worker/index.js` with Wrangler.
6. Set `app/src/config.ts` `workerUrl` to the actual deployed Worker URL, rebuild the Vite app, and publish the generated site files.

## Important

A GitHub Pages-only site cannot securely delete database rows or block IP addresses. Those actions require a live server API. The source code in this directory does not mean the API is deployed or configured. Do not announce the moderation features as live until the Worker and D1 binding have been deployed and tested.
