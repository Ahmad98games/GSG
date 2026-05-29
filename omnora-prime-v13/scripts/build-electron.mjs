import { execSync } from 'child_process';

let buildFailed = false;

try {
  console.log('[Electron Build] Starting Next.js standalone compilation...');
  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_PUBLIC_PLATFORM: 'electron',
      NEXT_PUBLIC_SUPABASE_URL: 'https://dummy.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'dummy',
      SUPABASE_SERVICE_ROLE_KEY: 'dummy'
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
