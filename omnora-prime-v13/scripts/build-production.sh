#!/bin/bash
# scripts/build-production.sh — Noxis v13.0

# 1. Validate environment
echo "Validating production environment..."
required_vars=(WIN_CERT_PATH WIN_CERT_PASS SUPABASE_URL SUPABASE_ANON_KEY HUB_JWT_SECRET)
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "ERROR: Required environment variable $var is not set."
    exit 1
  fi
done

# 2. Clean environment
echo "Cleaning previous build artifacts..."
rm -rf dist/
rm -rf .next/
rm -rf out/

# 3. Build Web/Next.js Layer
echo "Building Next.js production bundle..."
export NODE_ENV=production
npm run build

# 4. Build/Package Electron App
echo "Packaging Electron executable (NSIS)..."
# Note: electron-builder will read the WIN_CERT_PATH from env automatically
npx electron-builder --win --publish=never

# 5. Integrity Check
echo "------------------------------------------------"
echo "Build Complete. Verifying integrity..."
ls -lh dist/*.exe

echo "SHA256 Checksum:"
sha256sum dist/*.exe || echo "sha256sum command not found, skipping checksum."
echo "------------------------------------------------"

