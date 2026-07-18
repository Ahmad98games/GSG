import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const ROOT = process.cwd();
const STANDALONE = path.join(ROOT, '.next', 'standalone');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`[Electron Build] Skip missing: ${src}`);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
}

function copyNextSubpathWrappers() {
  const srcDir = path.join(ROOT, 'node_modules', 'next');
  const destDir = path.join(STANDALONE, 'node_modules', 'next');
  if (!fs.existsSync(srcDir) || !fs.existsSync(destDir)) {
    console.warn('[Electron Build] Could not copy next subpath wrappers');
    return;
  }
  let copied = 0;
  for (const file of fs.readdirSync(srcDir)) {
    if (file.endsWith('.js')) {
      fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
      copied++;
    }
  }
  console.log(`[Electron Build] Copied ${copied} next subpath wrappers`);
}

function prepareStandaloneBundle() {
  console.log('[Electron Build] Preparing standalone bundle for packaging...');

  // Next.js does not copy static assets into standalone — required at runtime
  copyDir(
    path.join(ROOT, '.next', 'static'),
    path.join(STANDALONE, '.next', 'static')
  );

  // Public assets for /public routes
  copyDir(path.join(ROOT, 'public'), path.join(STANDALONE, 'public'));

  // DB migrations for SQLite bootstrap
  copyDir(
    path.join(ROOT, 'src', 'lib', 'db', 'migrations'),
    path.join(STANDALONE, 'src', 'lib', 'db', 'migrations')
  );

  copyNextSubpathWrappers();

  // Bridge entry copied by electron-builder.yml from project root
  const bridgeSrc = path.join(ROOT, 'server-with-bridge.js');
  const bridgeDest = path.join(STANDALONE, 'server-with-bridge.js');
  if (fs.existsSync(bridgeSrc)) {
    fs.copyFileSync(bridgeSrc, bridgeDest);
    console.log('[Electron Build] server-with-bridge.js copied into standalone');
  } else {
    console.warn('[Electron Build] server-with-bridge.js missing at project root');
  }
}

let buildFailed = false;

try {
  console.log('[Electron Build] Starting Next.js standalone compilation...');
  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_PUBLIC_PLATFORM: 'electron',
    },
  });
  console.log('[Electron Build] Next.js compilation completed successfully ✓');
  prepareStandaloneBundle();
} catch (err) {
  console.error('[Electron Build] Compilation failed:', err.message);
  buildFailed = true;
}

if (buildFailed) {
  process.exit(1);
}
