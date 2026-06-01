# Cloudflare deployment (Noxis Hub)

## Why the site looked unchanged after a “successful” build

1. **Production branch** — Cloudflare Pages/Workers must deploy from **`main`**. Landing redesigns were on `temp-emergency-branch`; `main` still served the old `LandingClient` (particles, scroll morph, etc.) until merged.
2. **Static output** — `wrangler.toml` serves `./omnora-prime-v13/out`. The app only writes there when `CLOUDFLARE_DEPLOY=true` (set in `npm run build` → `scripts/build-static.mjs` and in `wrangler.toml` `[build].command`).
3. **HTML cache** — `omnora-prime-v13/public/_headers` sets `Cache-Control: max-age=0, must-revalidate` on `/` and HTML so edge cache does not serve an old homepage.

## Deploy checklist

```bash
cd omnora-prime-v13 && npm run build   # produces out/
git push origin main                   # Cloudflare should track main
```

In the Cloudflare dashboard: **Workers & Pages → your project → Settings → Builds** — confirm **Production branch = `main`** and build command matches `wrangler.toml`.

After deploy, hard-refresh (Ctrl+Shift+R) or purge cache once if you still see the old page.
