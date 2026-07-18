/**
 * Noxis Hub — Electron Build Script
 *
 * Runs `next build` in standalone mode, then copies all required
 * assets into .next/standalone so electron-builder can package them.
 *
 * Failure hardening:
 * - .env.local is optional (missing = warning, not crash)
 * - BUILD env vars are injected explicitly so next.config.ts always
 *   picks `output: 'standalone'`, regardless of shell environment
 * - All copy steps use warn-on-missing (not throw) so a single missing
 *   optional asset doesn't abort the whole build
 * - Exit code 1 is only emitted AFTER cleanup
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Load .env.local if it exists — but NEVER crash if it doesn't
try {
  const dotenv = await import('dotenv');
  dotenv.config({ path: '.env.local' });
} catch {
  console.warn('[Electron Build] dotenv not available or .env.local missing — continuing without it');
}

const ROOT = process.cwd();
const STANDALONE = path.join(ROOT, '.next', 'standalone');

// ── Helper: copy dir (warn if missing, never throw) ──────────────────────────
function copyDir(src, dest, { required = false } = {}) {
  if (!fs.existsSync(src)) {
    if (required) {
      console.error(`[Electron Build] ✗ REQUIRED dir missing: ${src}`);
      throw new Error(`Required source directory not found: ${src}`);
    }
    console.warn(`[Electron Build] ⚠ Skipping missing optional dir: ${src}`);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
  console.log(`[Electron Build] ✓ Copied ${path.relative(ROOT, src)} → ${path.relative(ROOT, dest)}`);
}

// ── Helper: copy single file (warn if missing, never throw) ──────────────────
function copyFile(src, dest, { required = false } = {}) {
  if (!fs.existsSync(src)) {
    if (required) {
      console.error(`[Electron Build] ✗ REQUIRED file missing: ${src}`);
      throw new Error(`Required source file not found: ${src}`);
    }
    console.warn(`[Electron Build] ⚠ Skipping missing optional file: ${src}`);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`[Electron Build] ✓ Copied ${path.relative(ROOT, src)} → ${path.relative(ROOT, dest)}`);
}

// ── Copy next subpath wrapper .js files into standalone ──────────────────────
function copyNextSubpathWrappers() {
  const srcDir = path.join(ROOT, 'node_modules', 'next');
  const destDir = path.join(STANDALONE, 'node_modules', 'next');
  if (!fs.existsSync(srcDir) || !fs.existsSync(destDir)) {
    console.warn('[Electron Build] ⚠ Could not copy next subpath wrappers (dirs missing)');
    return;
  }
  let copied = 0;
  for (const file of fs.readdirSync(srcDir)) {
    if (file.endsWith('.js')) {
      fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
      copied++;
    }
  }
  console.log(`[Electron Build] ✓ Copied ${copied} next subpath wrappers`);
}

// ── Assemble the standalone bundle ───────────────────────────────────────────
function prepareStandaloneBundle() {
  console.log('\n[Electron Build] Assembling standalone bundle...');

  // 1. Static assets (required by server at runtime)
  copyDir(
    path.join(ROOT, '.next', 'static'),
    path.join(STANDALONE, '.next', 'static'),
    { required: true }
  );

  // 2. Public folder
  copyDir(path.join(ROOT, 'public'), path.join(STANDALONE, 'public'));

  // 3. DB migrations
  copyDir(
    path.join(ROOT, 'src', 'lib', 'db', 'migrations'),
    path.join(STANDALONE, 'src', 'lib', 'db', 'migrations')
  );

  // 4. Next.js subpath wrappers (headers.js, etc.)
  copyNextSubpathWrappers();

  // 5. Mobile WebSocket bridge server
  copyFile(
    path.join(ROOT, 'server-with-bridge.js'),
    path.join(STANDALONE, 'server-with-bridge.js'),
    { required: true }
  );

  console.log('\n[Electron Build] ✓ Bundle assembly complete\n');
}

// ── Main build ────────────────────────────────────────────────────────────────
let buildFailed = false;

try {
  console.log('\n[Electron Build] ══════════════════════════════════════════');
  console.log('[Electron Build] Starting Next.js standalone compilation...');
  console.log('[Electron Build] ══════════════════════════════════════════\n');

  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      // CRITICAL: These two flags must BOTH be set so next.config.ts
      // correctly resolves `output: 'standalone'` instead of 'export'.
      NEXT_PUBLIC_PLATFORM: 'electron',
      NODE_ENV: 'production',
      // Ensure Supabase vars are set (standalone build still needs them for
      // route analysis even though the running server reads them at runtime)
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    },
  });

  console.log('\n[Electron Build] ✓ Next.js compilation complete');
  prepareStandaloneBundle();

} catch (err) {
  console.error('\n[Electron Build] ✗ BUILD FAILED:', err.message);
  buildFailed = true;
}

if (buildFailed) {
  console.error('\n[Electron Build] ══════════════════════════════════════════');
  console.error('[Electron Build] BUILD FAILED — fix the errors above then re-run:');
  console.error('[Electron Build]   npm run electron:build');
  console.error('[Electron Build] ══════════════════════════════════════════\n');
  process.exit(1);
}
