# Cloudflare deployment (Noxis Hub)

## Why pushes did not start a Cloudflare build

1. **No workflow at repo root** — GitHub only runs `/.github/workflows/*.yml`. Workflows under `omnora-prime-v13/.github/` are **ignored**. Use **`/.github/workflows/deploy-cloudflare.yml`** (added) so every `main` push deploys via Wrangler.
2. **GitHub secrets required** — In [github.com/Ahmad98games/GSG/settings/secrets/actions](https://github.com/Ahmad98games/GSG/settings/secrets/actions) add:
   - `CLOUDFLARE_API_TOKEN` — [Cloudflare dashboard → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens) → Create token → **Edit Cloudflare Workers** template (or custom: Account + Workers Scripts + Workers Assets write).
   - `CLOUDFLARE_ACCOUNT_ID` — [Cloudflare dashboard](https://dash.cloudflare.com/) → right sidebar on any zone/account page.
3. **Pages Git integration (optional)** — If you also connected **Cloudflare Pages** to GitHub in the dashboard, either use Pages **or** this GitHub Action + Workers — not two conflicting setups on the same hostname. For Pages-only: Production branch **`main`**, root directory **`.`** (repo root), build command:
   ```bash
   cd omnora-prime-v13 && npm install --legacy-peer-deps && CLOUDFLARE_DEPLOY=true npm run build
   ```
   Output directory: **`omnora-prime-v13/out`**

## Why the site looked unchanged after an old “successful” build

1. **Production branch** — Deploy from **`main`** only.
2. **Static output** — `wrangler.toml` serves `./omnora-prime-v13/out` (requires `CLOUDFLARE_DEPLOY=true` during build).
3. **HTML cache** — `omnora-prime-v13/public/_headers` forces revalidation on `/` and HTML.

## Deploy checklist

```bash
cd omnora-prime-v13 && npm run build   # local verify → produces out/
git push origin main                   # triggers Deploy to Cloudflare workflow
```

Check runs: [github.com/Ahmad98games/GSG/actions](https://github.com/Ahmad98games/GSG/actions) → **Deploy to Cloudflare**.

Manual deploy from your machine (if secrets are set locally):

```bash
npx wrangler deploy
```

After deploy, hard-refresh (Ctrl+Shift+R) or purge cache once if you still see the old page.
