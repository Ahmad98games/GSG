# Cloudflare deployment (Noxis Hub)

## If nothing builds when you push

### A) GitHub Actions (recommended)

1. Open **[GSG Actions](https://github.com/Ahmad98games/GSG/actions)** → workflow **Deploy to Cloudflare**.
2. If you see **no runs**, pushes may not be on `main` — merge to `main` and push.
3. If runs **fail immediately**, add these secrets:  
   **[Settings → Secrets and variables → Actions](https://github.com/Ahmad98games/GSG/settings/secrets/actions)**

   | Secret | How to get it |
   |--------|----------------|
   | `CLOUDFLARE_API_TOKEN` | [Create API token](https://dash.cloudflare.com/profile/api-tokens) → **Edit Cloudflare Workers** template, or custom with **Account → Cloudflare Pages → Edit** + **Workers Scripts → Edit** |
   | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → right sidebar |

4. Optional repository **variable** (not secret): `CLOUDFLARE_PAGES_PROJECT` = your Pages project name (default: `noxishub`).

5. Trigger manually: Actions → **Deploy to Cloudflare** → **Run workflow**.

### B) Cloudflare Workers Builds (your current setup)

Your logs show: **Deploy command** = `npx wrangler deploy`.

That only works if `wrangler.toml` has a `[build]` block (restored) so `omnora-prime-v13/out` is created before upload.

| Setting | Value |
|---------|--------|
| Root directory | `/` (repo root) |
| Deploy command | `npx wrangler deploy` |
| (optional) Build command | leave empty — wrangler `[build]` runs `cd omnora-prime-v13 && npm install && npm run build` |

Use **npm** (root now has `package-lock.json` + `wrangler` devDependency) — not an empty bun install.

### C) Cloudflare Pages dashboard (Git auto-build alternative)

| Setting | Value |
|---------|--------|
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `omnora-prime-v13/out` |
| Node version | `20` |

Environment variables (Pages → Settings → Environment variables):

- `CLOUDFLARE_DEPLOY` = `true`
- `NEXT_PUBLIC_CLOUDFLARE_DEPLOY` = `true`
- `NODE_VERSION` = `20`

### D) Deploy from your PC

```bash
# From repo root (new_system)
npm run build
npx wrangler pages deploy omnora-prime-v13/out --project-name=noxishub
# Or Workers:
npx wrangler deploy
```

Requires `npx wrangler login` or `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` env vars.

## After deploy

Hard-refresh the site (Ctrl+Shift+R) or **Caching → Purge everything** once.
