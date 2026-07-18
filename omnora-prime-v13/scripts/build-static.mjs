import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const appPath = path.join(process.cwd(), 'src/app');
const tempPath = path.join(process.cwd(), 'app-temp');

const PUBLIC_DIRECTORIES = ['download', 'pricing', 'privacy', 'docs', 'blog', 'reviews', 'file-morph', 'terms', 'refund', 'about', 'dashboard'];
let hiddenDirs = [];

let buildFailed = false;

// ── Restore hidden dirs on any exit (Ctrl-C, SIGTERM, crash) ─────────────────
function restoreHiddenDirs() {
  if (hiddenDirs.length === 0) return;
  console.log('[Build] Restoring hidden directories (signal/exit handler)...');
  for (const dir of hiddenDirs) {
    try {
      const source = path.join(tempPath, dir);
      const dest = path.join(appPath, dir);
      if (fs.existsSync(source)) {
        robustRmSync(dest);
        fs.cpSync(source, dest, { recursive: true });
        robustRmSync(source);
      }
    } catch (e) {
      console.error(`[Build] Failed to restore ${dir}:`, e.message);
    }
  }
  hiddenDirs = [];
  robustRmSync(tempPath);
}

process.on('SIGINT',  () => { restoreHiddenDirs(); process.exit(130); });
process.on('SIGTERM', () => { restoreHiddenDirs(); process.exit(143); });
process.on('exit',    () => { restoreHiddenDirs(); });


function robustRmSync(targetPath) {
  let attempts = 10;
  while (attempts > 0) {
    try {
      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      }
      return;
    } catch (err) {
      if ((err.code === 'EPERM' || err.code === 'EBUSY') && attempts > 1) {
        attempts--;
        // Synchronous sleep for 200ms
        const limit = Date.now() + 200;
        while (Date.now() < limit) {}
      } else {
        throw err;
      }
    }
  }
}

try {
  // Ensure tempPath exists and is clean
  robustRmSync(tempPath);
  fs.mkdirSync(tempPath);

  // Find all directories inside src/app that should be hidden
  const files = fs.readdirSync(appPath);
  for (const file of files) {
    const fullPath = path.join(appPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!PUBLIC_DIRECTORIES.includes(file)) {
        console.log(`[Build] Temporarily hiding directory: ${file}`);
        const dest = path.join(tempPath, file);
        fs.cpSync(fullPath, dest, { recursive: true });
        robustRmSync(fullPath);
        hiddenDirs.push(file);
      }
    }
  }

  console.log('[Build] Starting Next.js compilation...');
  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      CLOUDFLARE_DEPLOY: 'true',
      NEXT_PUBLIC_CLOUDFLARE_DEPLOY: 'true',
      NEXT_PUBLIC_SUPABASE_URL: 'https://dummy.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'dummy',
      SUPABASE_SERVICE_ROLE_KEY: 'dummy'
    }
  });
} catch (err) {
  console.error('[Build] Compilation failed:', err.message);
  buildFailed = true;
} finally {
  // Restore is handled by process.on('exit') handler above.
  // Call explicitly here in case the exit handler runs too late.
  restoreHiddenDirs();
}

if (buildFailed) {
  process.exit(1);
}


