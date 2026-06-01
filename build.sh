#!/usr/bin/env bash
# Cloudflare Pages (Git-connected) build — run from repo root.
set -euo pipefail
cd "$(dirname "$0")/omnora-prime-v13"
export CLOUDFLARE_DEPLOY=true
export NEXT_PUBLIC_CLOUDFLARE_DEPLOY=true
export CI=true
export CF_PAGES=1
export NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://placeholder.supabase.co}"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-placeholder}"
export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-placeholder}"
npm ci --legacy-peer-deps
npm run build
echo "Build OK: $(dirname "$PWD")/omnora-prime-v13/out"
