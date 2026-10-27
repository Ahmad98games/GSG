/**
 * ============================================================================
 * Noxis Hub — Companion Mobile App On-Demand Background Cacher
 * Ensures the Android APK is available locally on the counter PC for offline
 * Wi-Fi mobile pairing, without bloating the desktop installer with 250MB!
 * ============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const CLOUDFLARE_APK_URL = 'https://pub-8c464d0d92ff44abbf70c58c362ad258.r2.dev/noxis-preview.apk';

let isCachingInProgress = false;

export function initCompanionAppCacher(publicDir?: string): void {
  // Wait 15 seconds after app startup so counter operations get 100% priority
  setTimeout(() => {
    cacheCompanionAppSilently(publicDir).catch(() => {});
  }, 15000);
}

export async function cacheCompanionAppSilently(customPublicDir?: string): Promise<boolean> {
  if (isCachingInProgress) return false;

  const baseDir = customPublicDir || path.join(process.cwd(), 'public');
  const downloadsDir = path.join(baseDir, 'downloads');
  const targetApkPath = path.join(downloadsDir, 'noxis-preview.apk');

  // If already present on disk and > 10MB, no need to download
  if (fs.existsSync(targetApkPath)) {
    try {
      const stats = fs.statSync(targetApkPath);
      if (stats.size > 10 * 1024 * 1024) {
        return true;
      }
    } catch {}
  }

  isCachingInProgress = true;

  try {
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    const tempApkPath = path.join(downloadsDir, `noxis-preview.apk.tmp-${Date.now()}`);

    console.log('[CompanionAppCacher] Silently caching companion mobile APK for offline local Wi-Fi sharing...');

    const success = await new Promise<boolean>((resolve) => {
      const req = https.get(CLOUDFLARE_APK_URL, { timeout: 60000 }, (res) => {
        if (res.statusCode !== 200) {
          req.destroy();
          resolve(false);
          return;
        }

        const fileStream = fs.createWriteStream(tempApkPath);
        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close(() => {
            try {
              if (fs.existsSync(tempApkPath) && fs.statSync(tempApkPath).size > 10 * 1024 * 1024) {
                fs.renameSync(tempApkPath, targetApkPath);
                console.log('[CompanionAppCacher] ✓ Mobile companion APK cached successfully for offline local Wi-Fi.');
                resolve(true);
              } else {
                if (fs.existsSync(tempApkPath)) fs.unlinkSync(tempApkPath);
                resolve(false);
              }
            } catch {
              resolve(false);
            }
          });
        });

        fileStream.on('error', () => {
          try {
            if (fs.existsSync(tempApkPath)) fs.unlinkSync(tempApkPath);
          } catch {}
          resolve(false);
        });
      });

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });

    return success;
  } catch (err: any) {
    console.warn('[CompanionAppCacher] Background cache deferred (offline or unreachable):', err?.message || err);
    return false;
  } finally {
    isCachingInProgress = false;
  }
}
