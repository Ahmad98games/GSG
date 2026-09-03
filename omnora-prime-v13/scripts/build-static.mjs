import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const appPath = path.join(process.cwd(), 'src/app');
const tempPath = path.join(process.cwd(), 'app-temp');

const PUBLIC_DIRECTORIES = ['features', 'download', 'pricing', 'privacy', 'docs', 'blog', 'reviews', 'file-morph', 'terms', 'refund', 'about', 'industries', 'changelog', 'compare'];
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

  // Move non-public directories to tempPath during static export
  const allEntries = fs.readdirSync(appPath);
  for (const entry of allEntries) {
    const entryPath = path.join(appPath, entry);
    if (fs.statSync(entryPath).isDirectory()) {
      if (!PUBLIC_DIRECTORIES.includes(entry)) {
        const dest = path.join(tempPath, entry);
        fs.cpSync(entryPath, dest, { recursive: true });
        robustRmSync(entryPath);
        hiddenDirs.push(entry);
      }
    }
  }

  console.log('[Build] Starting Next.js compilation...');
  execSync('npx next build --webpack', {
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

  // Ensure _buildManifest.js and _ssgManifest.js exist in all static build ID folders
  ensureManifestFiles(path.join(process.cwd(), 'out', '_next', 'static'));
  ensureManifestFiles(path.join(process.cwd(), '.next', 'static'));

  // Bundle Cloudflare Pages / Worker entry
  try {
    const esbuild = await import('esbuild');
    const workerSrc = path.join(process.cwd(), 'src/cloudflare-worker.ts');
    const workerOut = path.join(process.cwd(), 'out/_worker.js');
    const workerDedicated = path.join(process.cwd(), 'worker/index.js');
    if (fs.existsSync(workerSrc)) {
      console.log('[Build] Compiling Cloudflare Worker entry...');
      fs.mkdirSync(path.dirname(workerDedicated), { recursive: true });
      esbuild.buildSync({
        entryPoints: [workerSrc],
        bundle: true,
        outfile: workerDedicated,
        format: 'esm',
        target: 'es2022',
        platform: 'browser',
        minify: true,
        treeShaking: true,
      });

      // Also copy to out/_worker.js for Pages Advanced Mode compatibility
      fs.copyFileSync(workerDedicated, workerOut);

      // Ensure .assetsignore exists in out/ to prevent uploading _worker.js as a public static asset
      fs.writeFileSync(path.join(process.cwd(), 'out/.assetsignore'), '_worker.js\n', 'utf8');

      console.log('[Build] Cloudflare Worker bundled successfully.');
    }
  } catch (workerErr) {
    console.warn('[Build] Warning: Failed to bundle _worker.js:', workerErr.message);
  }
} catch (err) {
  console.error('[Build] Compilation failed:', err.message);
  buildFailed = true;
} finally {
  // Restore is handled by process.on('exit') handler above.
  // Call explicitly here in case the exit handler runs too late.
  restoreHiddenDirs();
}

function ensureManifestFiles(staticDir) {
  if (!fs.existsSync(staticDir)) return;
  try {
    const items = fs.readdirSync(staticDir);
    const buildManifestContent = `self.__BUILD_MANIFEST = {
  __rewrites: { beforeFiles: [], afterFiles: [], fallback: [] },
  "/": ["static/chunks/main.js"],
  "/_error": ["static/chunks/pages/_error.js"],
  sortedPages: ["/", "/_app", "/_error"]
};
self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB();`;

    const ssgManifestContent = `self.__SSG_MANIFEST = new Set();
self.__SSG_MANIFEST_CB && self.__SSG_MANIFEST_CB();`;

    for (const item of items) {
      const itemPath = path.join(staticDir, item);
      if (fs.statSync(itemPath).isDirectory() && item !== 'chunks' && item !== 'css' && item !== 'media') {
        const buildManifestPath = path.join(itemPath, '_buildManifest.js');
        const ssgManifestPath = path.join(itemPath, '_ssgManifest.js');

        if (!fs.existsSync(buildManifestPath)) {
          fs.writeFileSync(buildManifestPath, buildManifestContent, 'utf8');
          console.log(`[Build] ✓ Created missing manifest: ${buildManifestPath}`);
        }
        if (!fs.existsSync(ssgManifestPath)) {
          fs.writeFileSync(ssgManifestPath, ssgManifestContent, 'utf8');
          console.log(`[Build] ✓ Created missing manifest: ${ssgManifestPath}`);
        }
      }
    }
  } catch (e) {
    console.warn(`[Build] Warning ensuring manifests in ${staticDir}:`, e.message);
  }
}

if (buildFailed) {
  process.exit(1);
}


