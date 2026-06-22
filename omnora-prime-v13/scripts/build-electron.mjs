import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load local environment variables so Next.js can embed the actual Supabase URL/keys into the client bundle at build-time.
dotenv.config({ path: '.env.local' });

let buildFailed = false;

try {
  console.log('[Electron Build] Starting Next.js standalone compilation...');
  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_PUBLIC_PLATFORM: 'electron'
    }
  });
  console.log('[Electron Build] Next.js compilation completed successfully ✓');

  // Copy subpath wrappers from node_modules/next to .next/standalone/node_modules/next
  const srcDir = path.join(process.cwd(), 'node_modules', 'next');
  const destDir = path.join(process.cwd(), '.next', 'standalone', 'node_modules', 'next');

  if (fs.existsSync(srcDir) && fs.existsSync(destDir)) {
    console.log('[Electron Build] Copying next subpath wrappers...');
    const files = fs.readdirSync(srcDir);
    let copiedCount = 0;
    for (const file of files) {
      if (file.endsWith('.js')) {
        const srcFile = path.join(srcDir, file);
        const destFile = path.join(destDir, file);
        fs.copyFileSync(srcFile, destFile);
        copiedCount++;
      }
    }
    console.log(`[Electron Build] Successfully copied ${copiedCount} subpath wrappers.`);
  } else {
    console.warn(`[Electron Build] Warning: Could not locate next package at ${srcDir} or dest ${destDir}`);
  }
} catch (err) {
  console.error('[Electron Build] Compilation failed:', err.message);
  buildFailed = true;
}

if (buildFailed) {
  process.exit(1);
}
