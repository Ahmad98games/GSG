import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

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
} catch (err) {
  console.error('[Electron Build] Compilation failed:', err.message);
  buildFailed = true;
}

if (buildFailed) {
  process.exit(1);
}
