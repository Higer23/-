# -

Personal GitHub profile rating site. Built with React + TypeScript + Tailwind CSS, compiled with Vite and served as a static site on GitHub Pages.

## Structure

```
app/index.html                 Source page (Vite entry)
app/src/main.tsx, App.tsx      App entry and page
app/src/components/            SilkWaves, ShaderCanvas (WebGL), buttons, search, loading, panel, guestbook
app/src/lib/                   GitHub data, useGithub, useReveal
app/src/config.ts              Username, Worker URL
app/src/index.css              Tailwind + design styles
assets/js/score.js             Pure scoring logic (shared by React and tests)
assets/js/utils.js             Helpers for score.js
assets/img/                    Fallback avatar
index.html, assets/index-*     Compiled output (served by GitHub Pages)
tests/score.test.mjs           Unit tests for scoring
worker/                        Cloudflare Worker + D1 schema
robots.txt, sitemap.xml        SEO
```

## Running

- Development: `npm install` then `npm run dev`
- Type check: `npm run typecheck`
- Tests: `npm test` (Node 18+)
- Release: `npm run build` regenerates the root `index.html` and `assets/index-*`. Delete the old `assets/index-*` files and commit the new ones.

## Configuration

Set the Cloudflare Worker URL in the `workerUrl` field in `app/src/config.ts`. If it is empty, the guestbook stays hidden.

## Donations

Open Collective: https://opencollective.com/higer023
GitHub Sponsors: https://github.com/sponsors/Higer023 (must be enabled on the account)
