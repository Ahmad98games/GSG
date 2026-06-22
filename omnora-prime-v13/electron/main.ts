import { app, BrowserWindow, ipcMain, dialog, utilityProcess, UtilityProcess } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess, exec } from 'child_process';
import * as Sentry from '@sentry/electron/main';
import * as http from 'http';
import * as net from 'net';
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import { deriveDbKey } from '../src/lib/security/dbKeyManager'

// ─────────────────────────────────────────────
// 0. GLOBAL REFERENCES
// ─────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let nextServer: ChildProcess | UtilityProcess | null = null;
let visionProcess: ChildProcess | null = null;
let sessionTimeoutTimer: NodeJS.Timeout | null = null;
let warningTimer: NodeJS.Timeout | null = null;
let memoryMonitorInterval: NodeJS.Timeout | null = null;
let PORT = Number(process.env.PORT || 3000);
let isReadOnly = false;

const isDev = !app.isPackaged;

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_LEAD_MS    = 60 * 1000;

log.transports.file.level = 'info'
log.transports.file.maxSize = 5 * 1024 * 1024
autoUpdater.logger = log

autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'omnoralabs',
  repo: 'noxis-releases',
  private: false
})

const CHECK_INTERVAL = 4 * 60 * 60 * 1000

// ─────────────────────────────────────────────
// 1. LOGGER
// ─────────────────────────────────────────────
let logPath = '';

function startupLog(msg: string): void {
  try {
    if (!logPath) {
      logPath = path.join(app.getPath('userData'), 'startup.log');
    }
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
  } catch { /* userData not ready yet */ }
  log.info(msg);
}

// ─────────────────────────────────────────────
// INLINE ENV LOADER (replaces dotenv dependency)
// Reads KEY=VALUE lines from a file into process.env.
// Does NOT overwrite values already set by the OS.
// ─────────────────────────────────────────────
function loadEnvFile(filePath: string): void {
  try {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) return;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      // Strip surrounding quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    });
  } catch (err: any) {
    startupLog(`[ENV] Failed to load ${filePath}: ${err.message}`);
  }
}

if (process.platform === 'win32') {
  app.setAppUserModelId('com.omnoralabs.noxis');
}

// Disable hardware acceleration to prevent GPU process crashes on certain Windows systems/drivers
app.disableHardwareAcceleration();

startupLog('════════════ NOXIS STARTUP ════════════');
startupLog(`Platform: ${process.platform} | Arch: ${process.arch} | isDev: ${isDev}`);

function killProcess(child: ChildProcess | UtilityProcess | null, name: string): Promise<void> {
  return new Promise((resolve) => {
    if (!child) { resolve(); return; }
    startupLog(`[Cleanup] Terminating ${name} (PID: ${child.pid})...`);
    try {
      if (process.platform === 'win32') {
        exec(`taskkill /pid ${child.pid} /T /F`, (err) => {
          if (err) startupLog(`[Cleanup ERR] Failed to taskkill ${name}: ${err.message}`);
          else startupLog(`[Cleanup] Successfully taskkilled ${name}`);
          resolve();
        });
      } else {
        child.kill('SIGKILL');
        resolve();
      }
    } catch (e: any) {
      startupLog(`[Cleanup ERR] Error killing ${name}: ${e.message}`);
      resolve();
    }
  });
}

// ─────────────────────────────────────────────
// 2. SINGLE INSTANCE LOCK
// ─────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.on('ready', () => {
    dialog.showErrorBox(
      'Noxis Hub Already Running',
      'An instance of Noxis Hub is already active.\n\nCheck your system tray or Task Manager and close it first.'
    );
    app.quit();
  });
} else {

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // ─────────────────────────────────────────────
  // 3. HELPERS
  // ─────────────────────────────────────────────
  let portHolder: net.Server | null = null;

  function reserveAvailablePort(startPort: number, attempt = 0): Promise<number> {
    return new Promise((resolve, reject) => {
      if (attempt > 20) {
        reject(new Error('Could not find an available port after 20 attempts'));
        return;
      }

      const server = net.createServer();
      const timeout = setTimeout(() => {
        try { server.close(); } catch {}
        startupLog(`[Port] Reserve attempt on ${startPort} timed out`);
        resolve(reserveAvailablePort(startPort + 1, attempt + 1));
      }, 2000);

      server.listen(startPort, '127.0.0.1', () => {
        clearTimeout(timeout);
        const addr = server.address();
        if (!addr || typeof addr === 'string') {
          try { server.close(); } catch {}
          resolve(reserveAvailablePort(startPort + 1, attempt + 1));
          return;
        }
        portHolder = server;
        resolve(addr.port);
      });

      server.on('error', () => {
        clearTimeout(timeout);
        resolve(reserveAvailablePort(startPort + 1, attempt + 1));
      });
    });
  }

  function releaseReservedPort(): Promise<void> {
    return new Promise((resolve) => {
      if (portHolder) {
        try {
          portHolder.close(() => {
            portHolder = null;
            resolve();
          });
        } catch {
          portHolder = null;
          resolve();
        }
      } else {
        resolve();
      }
    });
  }

  function waitForServer(
    url: string,
    timeout = 90000,
    interval = 1000
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      let done = false;

      const check = () => {
        if (done) return;
        if (Date.now() - start > timeout) {
          done = true;
          reject(new Error(`Server did not start within ${timeout / 1000}s`));
          return;
        }

        const req = http.get(url, (res) => {
          if (done) return;
          if (res.statusCode) {
            done = true;
            resolve();
          } else {
            setTimeout(check, interval);
          }
        });

        req.on('error', (err: any) => {
          if (done) return;
          startupLog(`[Health Check ERR] ${err.message} (${err.code || 'NO_CODE'})`);
          setTimeout(check, interval);
        });

        req.setTimeout(2000, () => {
          req.destroy();
        });
      };

      check();
    });
  }

  // ─────────────────────────────────────────────
  // 4. SPLASH WINDOW
  // Creates a small centered branded window
  // that shows instantly before main loads.
  // ─────────────────────────────────────────────
  function createSplashWindow(): void {
    const iconPath = app.isPackaged
      ? path.join(process.resourcesPath, 'build', 'icon.ico')
      : path.join(__dirname, '../../build/icon.ico');
    startupLog(`[Icon] Splash Path: ${iconPath}`);
    startupLog(`[Icon] Splash Exists: ${fs.existsSync(iconPath)}`);

    splashWindow = new BrowserWindow({
      width: 420,
      height: 300,
      frame: false,
      transparent: false,
      resizable: false,
      movable: false,
      center: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      backgroundColor: '#070809',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
      icon: iconPath,
    });

    const splashHtml = `data:text/html,<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;background:#070809;overflow:hidden;}
body{display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;}
.logo-ring{width:72px;height:72px;border-radius:18px;background:linear-gradient(135deg,#1A1D21 0%,#0F1114 100%);border:1.5px solid rgba(96,165,250,0.25);display:flex;align-items:center;justify-content:center;margin-bottom:22px;box-shadow:0 0 40px rgba(96,165,250,0.12);}
.logo-ring img{width:42px;height:42px;object-fit:contain;}
.logo-fallback{width:42px;height:42px;display:flex;align-items:center;justify-content:center;color:#60A5FA;font-size:22px;font-weight:800;letter-spacing:-1px;}
.wordmark{color:#FFFFFF;font-size:18px;font-weight:700;letter-spacing:6px;text-transform:uppercase;margin-bottom:6px;}
.tagline{color:#374151;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin-bottom:32px;}
.progress-track{width:160px;height:2px;background:#111418;border-radius:1px;overflow:hidden;}
.progress-bar{height:100%;background:linear-gradient(90deg,#3B82F6,#60A5FA);border-radius:1px;animation:prog 2s cubic-bezier(0.4,0,0.2,1) infinite;}
@keyframes prog{0%{width:0%;margin-left:0%;}50%{width:60%;margin-left:20%;}100%{width:0%;margin-left:100%;}}
.version{position:absolute;bottom:18px;color:#1F2937;font-size:9px;letter-spacing:2px;text-transform:uppercase;}
.dots{display:flex;gap:4px;margin-top:16px;}
.dot{width:4px;height:4px;border-radius:50%;background:#1F2937;animation:dot 1.4s ease-in-out infinite;}
.dot:nth-child(1){animation-delay:0s;}
.dot:nth-child(2){animation-delay:0.2s;}
.dot:nth-child(3){animation-delay:0.4s;}
@keyframes dot{0%,80%,100%{background:#1F2937;}40%{background:#3B82F6;}}
</style>
</head>
<body>
<div class="logo-ring">
  <img src="./logos/noxis.png" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
  <div class="logo-fallback" style="display:none;">N</div>
</div>
<div class="wordmark">Noxis</div>
<div class="tagline">Industrial ERP</div>
<div class="progress-track"><div class="progress-bar"></div></div>
<div class="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
<div class="version">v13.1 &nbsp;·&nbsp; Omnora Labs</div>
</body>
</html>`;

    splashWindow.loadURL(splashHtml);
    splashWindow.show();
    startupLog('[Splash] Splash window displayed');
  }

  function destroySplash(): void {
    if (!splashWindow || splashWindow.isDestroyed()) return;
    splashWindow.webContents.executeJavaScript(`
      document.body.style.transition = 'opacity 0.35s ease';
      document.body.style.opacity = '0';
    `).catch(() => {});
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.destroy();
        splashWindow = null;
        startupLog('[Splash] Splash destroyed');
      }
    }, 380);
  }

  // ─────────────────────────────────────────────
  // 5. VISION ENGINE
  // ─────────────────────────────────────────────
  function spawnVisionEngine(): void {
    if (isDev) { startupLog('[Vision] Skipped in dev mode'); return; }
    if (isReadOnly) { startupLog('[Vision] Blocked: Read-Only mode'); return; }

    const visionScriptPath = path.join(process.resourcesPath, 'vision', 'vision_engine.py');
    if (!fs.existsSync(visionScriptPath)) {
      startupLog(`[Vision] Script not found at ${visionScriptPath} — skipping`);
      return;
    }

    const configPath = path.join(app.getPath('userData'), 'cameras.json');
    visionProcess = spawn('python', [visionScriptPath, '--config', configPath], {
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL:  process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
      },
    });

    visionProcess.on('error', (err) => startupLog(`[Vision] Spawn error: ${err.message}`));
    visionProcess.stdout?.on('data', (d: Buffer) => startupLog(`[Vision] ${d.toString().trim()}`));
    visionProcess.stderr?.on('data', (d: Buffer) => startupLog(`[Vision ERR] ${d.toString().trim()}`));
    visionProcess.on('exit', (code) => { startupLog(`[Vision] Exited: ${code}`); visionProcess = null; });
  }

  // ─────────────────────────────────────────────
  // 6. AUTO UPDATER
  // ─────────────────────────────────────────────
  function setupAutoUpdater(win: BrowserWindow): void {
    if (isDev) return;

    autoUpdater.on('checking-for-update', () => startupLog('[Update] Checking...'));
    autoUpdater.on('update-available', (info) => {
      startupLog(`[Update] Available: ${info.version}`);
      win.webContents.send('update-available', info);
    });
    autoUpdater.on('update-not-available', () => startupLog('[Update] Up to date'));
    autoUpdater.on('download-progress', (p) => {
      startupLog(`[Update] Download: ${Math.round(p.percent)}%`);
      win.webContents.send('update-progress', p);
    });
    autoUpdater.on('update-downloaded', (info) => {
      startupLog(`[Update] Downloaded: ${info.version}`);
      win.webContents.send('update-downloaded', info);
    });
    autoUpdater.on('error', (err) => startupLog(`[Update] Error: ${err.message}`));

    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(e => startupLog(`[Update] Check failed: ${e}`));
    }, 30000);

    setInterval(() => {
      autoUpdater.checkForUpdates().catch(e => startupLog(`[Update] Check failed: ${e}`));
    }, CHECK_INTERVAL);
  }

  // ─────────────────────────────────────────────
  // 7. SESSION TIMERS
  // ─────────────────────────────────────────────
  function resetInactivityTimer(): void {
    if (sessionTimeoutTimer) clearTimeout(sessionTimeoutTimer);
    if (warningTimer)        clearTimeout(warningTimer);

    warningTimer = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed())
        mainWindow.webContents.send('session-expiring-warning');
    }, SESSION_TIMEOUT_MS - WARNING_LEAD_MS);

    sessionTimeoutTimer = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed())
        mainWindow.webContents.send('session-timeout-logout');
    }, SESSION_TIMEOUT_MS);
  }

  ipcMain.on('user-activity', () => resetInactivityTimer());

  function startMemoryMonitor(): void {
    if (memoryMonitorInterval) clearInterval(memoryMonitorInterval);
    memoryMonitorInterval = setInterval(() => {
      const heapMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      if (heapMB > 800) {
        if (typeof global.gc === 'function') global.gc();
        startupLog(`[Memory] GC triggered: ${heapMB}MB`);
      }
    }, 30000);
  }

  // ─────────────────────────────────────────────
  // 8. TITLE BAR IPC
  // ─────────────────────────────────────────────
  ipcMain.on('window-minimize', () => BrowserWindow.getFocusedWindow()?.minimize());
  ipcMain.on('window-maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win?.isMaximized()) win.unmaximize(); else win?.maximize();
  });
  ipcMain.on('window-close', () => BrowserWindow.getFocusedWindow()?.close());
  ipcMain.handle('window-is-maximized', () => BrowserWindow.getFocusedWindow()?.isMaximized() ?? false);
  ipcMain.handle('check-for-updates', async () => autoUpdater.checkForUpdates());
  ipcMain.handle('install-update', () => autoUpdater.quitAndInstall(false, true));

  ipcMain.handle('sync-tier', (_, data: { tier: string, expiresAt: string | null }) => {
    startupLog(`[Tier] Sync: ${data.tier} (Expires: ${data.expiresAt || 'Never'})`);
    if (data.expiresAt && new Date() > new Date(data.expiresAt)) {
      isReadOnly = true;
      startupLog('[Security] License expired — Read-Only mode');
      mainWindow?.webContents.send('license-expired');
      if (visionProcess) { killProcess(visionProcess, 'Vision Engine'); visionProcess = null; }
    } else {
      isReadOnly = false;
    }
    return { success: true, isReadOnly };
  });

  // ─────────────────────────────────────────────
  // FILE MORPH IPC
  // ─────────────────────────────────────────────
  ipcMain.handle('compress-images', async (_, files: { data: string, quality?: number, name: string }[]) => {
    try {
      const sharp = require('sharp');
      const results = [];
      for (const file of files) {
        const buffer = Buffer.from(file.data, 'base64');
        const compressed = await sharp(buffer).jpeg({ quality: file.quality || 75, progressive: true }).toBuffer();
        results.push({
          name: file.name.replace(/\.[^.]+$/, '.jpg'),
          data: compressed.toString('base64'),
          originalSize: buffer.length,
          compressedSize: compressed.length,
        });
      }
      return results;
    } catch (error: any) {
      startupLog(`[FileMorph] Compression error: ${error.message}`);
      throw error;
    }
  });

  ipcMain.handle('convert-heic', async (_, files: { data: string, quality?: number, name: string }[]) => {
    try {
      const heicConvert = require('heic-convert');
      const results = [];
      for (const file of files) {
        const buffer = Buffer.from(file.data, 'base64');
        const output = await heicConvert({ buffer, format: 'JPEG', quality: (file.quality || 90) / 100 });
        results.push({
          name: file.name.replace(/\.heic$/i, '.jpg'),
          data: Buffer.from(output).toString('base64'),
          size: output.byteLength,
        });
      }
      return results;
    } catch (error: any) {
      startupLog(`[FileMorph] HEIC error: ${error.message}`);
      throw error;
    }
  });

  ipcMain.handle('get-app-data-path', () => app.getPath('userData'));

  // ─────────────────────────────────────────────
  // 9. MAIN WINDOW CREATION
  // Splash is already visible. Main window
  // loads silently behind it. When ready,
  // splash fades out and main slides in.
  // ─────────────────────────────────────────────
  async function createMainWindow(): Promise<void> {
    const iconPath = app.isPackaged
      ? path.join(process.resourcesPath, 'build', 'icon.ico')
      : path.join(__dirname, '../../build/icon.ico');
    startupLog(`[Icon] Main Path: ${iconPath}`);
    startupLog(`[Icon] Main Exists: ${fs.existsSync(iconPath)}`);

    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1024,
      minHeight: 768,
      show: false,            // hidden until fully loaded
      frame: false,
      titleBarStyle: 'hidden',
      transparent: false,
      backgroundColor: '#070809',
      center: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        preload: path.join(__dirname, 'preload.js'),
        partition: 'persist:noxis',
      },
      icon: iconPath,
    });

    // Track load retries for transient failures
    let loadRetries = 0;

    mainWindow.webContents.on('did-fail-load', (_e, errorCode, errorDesc) => {
      startupLog(`[Electron] did-fail-load: ${errorCode} ${errorDesc}`);
      if (loadRetries < 5) {
        loadRetries++;
        startupLog(`[Electron] Retrying load (${loadRetries}/5)...`);
        setTimeout(() => {
          mainWindow?.loadURL(`http://127.0.0.1:${PORT}`)
            .catch(e => startupLog(`[Electron] Retry error: ${e.message}`));
        }, 2000);
      } else {
        startupLog('[Electron] Max retries reached');
        destroySplash();
        dialog.showErrorBox(
          'Page Load Failed',
          `Could not load the app.\n\nCheck logs at:\n${logPath}`
        );
        app.quit();
      }
    });

    mainWindow.webContents.on('did-finish-load', () => {
      startupLog('[Electron] Page loaded successfully ✓');
      loadRetries = 0;
    });

    // THE KEY MOMENT:
    // ready-to-show fires when first paint is done.
    // At this point we fade splash and show main.
    mainWindow.once('ready-to-show', () => {
      startupLog('[Electron] ready-to-show → revealing main window');

      // Destroy splash with fade
      destroySplash();

      // Show main window with smooth opacity animation
      mainWindow!.setOpacity(0);
      mainWindow!.show();
      mainWindow!.focus();

      // Fade in over 300ms
      let opacity = 0;
      const fadeIn = setInterval(() => {
        opacity += 0.08;
        if (opacity >= 1) {
          opacity = 1;
          clearInterval(fadeIn);
        }
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.setOpacity(opacity);
        }
      }, 16); // ~60fps
    });

    mainWindow.on('maximize',   () => mainWindow?.webContents.send('maximize-changed', true));
    mainWindow.on('unmaximize', () => mainWindow?.webContents.send('maximize-changed', false));
    mainWindow.on('closed',     () => { mainWindow = null; });

    const url = `http://127.0.0.1:${PORT}`;

    try {
      startupLog('[Electron] Waiting for Next.js server...');
      await waitForServer(url, 90000, 300);
      startupLog('[Electron] Server ready — loading main window');

      await mainWindow.loadURL(url);

      if (isDev) {
        mainWindow.webContents.openDevTools();
      }

    } catch (err: any) {
      startupLog(`[Electron] Server failed to start: ${err.message}`);
      destroySplash();
      dialog.showMessageBoxSync({
        type: 'error',
        title: 'Noxis Failed to Start',
        message: 'The app server could not start.',
        detail:
          `Log file:\n${logPath}\n\n` +
          `Try restarting Noxis. If this persists:\n` +
          `WhatsApp: +92 333 435 5475`,
        buttons: ['OK'],
      });
      app.quit();
    }
  }

  // ─────────────────────────────────────────────
  // 10. APP LIFECYCLE
  // ─────────────────────────────────────────────
  app.whenReady().then(async () => {
    try {
      // Load env from all possible locations (inline parser — no dotenv dependency)
      loadEnvFile(path.join(__dirname, '../../.env'));
      loadEnvFile(path.join(process.resourcesPath, '.env'));
      loadEnvFile(path.join(path.dirname(app.getPath('exe')), '.env'));
      loadEnvFile(path.join(app.getPath('userData'), '.env'));

      startupLog(`[ENV] SUPABASE_URL: ${!!process.env.NEXT_PUBLIC_SUPABASE_URL}`);
      startupLog(`[ENV] SERVICE_ROLE: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);

      const missing = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
        .filter(k => !process.env[k]);

      if (missing.length > 0) {
        dialog.showErrorBox(
          'Missing Configuration',
          `Required env vars missing:\n\n  ${missing.join('\n  ')}\n\n` +
          `Place a .env file next to Noxis.exe`
        );
        app.quit();
        return;
      }

      if (process.env.SENTRY_DSN) {
        Sentry.init({ dsn: process.env.SENTRY_DSN });
      }

      process.on('uncaughtException', (error) => {
        startupLog(`[CRITICAL] ${error.message}`);
        if (error.stack) startupLog(error.stack);
        Sentry.captureException(error);
      });

      process.on('unhandledRejection', (reason) => {
        startupLog(`[CRITICAL] Unhandled rejection: ${reason}`);
        Sentry.captureException(reason instanceof Error ? reason : new Error(String(reason)));
      });

      // Defensive: if a previous Noxis instance
      // crashed and left its Next.js server alive
      // on a fixed port, kill anything actually
      // listening there before we try to bind
      async function killAnyProcessOnPort(port: number): Promise<void> {
        if (process.platform !== 'win32') return;

        return new Promise((resolve) => {
          // Hard safety timeout — if this takes
          // more than 3 seconds for any reason,
          // give up and continue startup rather
          // than risk hanging forever
          const safetyTimeout = setTimeout(() => {
            startupLog('[Port] Clear check timed out, continuing anyway');
            resolve();
          }, 3000);

          try {
            exec(
              `netstat -ano | findstr :${port}`,
              (err, stdout) => {
                clearTimeout(safetyTimeout);
                try {
                  if (err || !stdout) { resolve(); return; }
                  const lines = stdout.split('\n').filter(Boolean);
                  const pids = new Set<string>();
                  lines.forEach(line => {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    if (
                      pid && 
                      /^\d+$/.test(pid) && 
                      pid !== '0' && 
                      pid !== process.pid.toString()
                    ) {
                      pids.add(pid);
                    }
                  });
                  if (pids.size === 0) { resolve(); return; }
                  startupLog(`[Port] Found ${pids.size} process(es) on port ${port}, clearing...`);
                  let remaining = pids.size;
                  let settled = false;
                  const finish = () => {
                    if (settled) return;
                    settled = true;
                    resolve();
                  };
                  pids.forEach(pid => {
                    try {
                      exec(`taskkill /pid ${pid} /F`, () => {
                        remaining--;
                        if (remaining <= 0) finish();
                      });
                    } catch {
                      remaining--;
                      if (remaining <= 0) finish();
                    }
                  });
                } catch (innerErr: any) {
                  startupLog(`[Port] Parse error: ${innerErr.message}, continuing`);
                  resolve();
                }
              }
            );
          } catch (execErr: any) {
            clearTimeout(safetyTimeout);
            startupLog(`[Port] Exec error: ${execErr.message}, continuing`);
            resolve();
          }
        });
      }

      await killAnyProcessOnPort(PORT);

      // Find port
      PORT = await reserveAvailablePort(PORT);
      startupLog(`[Electron] Port: ${PORT}`);

    // ── STEP 1: Show splash immediately ──
    // User sees branded screen within ~200ms
    createSplashWindow();

    // ── STEP 2: Spawn Next.js server (production) ──
    if (!isDev) {
      // Prefer server-with-bridge.js (includes mobile WebSocket bridge).
      // Falls back to plain server.js if bridge wrapper is absent
      // (e.g. after a partial build) — desktop ERP still works.
      const bridgeServerPath = path.join(
        process.resourcesPath,
        'standalone',
        'server-with-bridge.js'
      )
      const serverPath = fs.existsSync(bridgeServerPath)
        ? bridgeServerPath
        : path.join(process.resourcesPath, 'standalone', 'server.js')

      // The native sqlite binding path
      const sqlitePath = path.join(
        process.resourcesPath,
        'better-sqlite3-multiple-ciphers'
      )

      startupLog(`[Electron] Server path: ${serverPath}`)
      startupLog(`[Electron] SQLite path: ${sqlitePath}`)
      startupLog(`[Electron] Resources: ${process.resourcesPath}`)

      if (!fs.existsSync(serverPath)) {
        startupLog('[FATAL] Neither server-with-bridge.js nor server.js found')
        destroySplash();
        dialog.showErrorBox(
          'Installation Error',
          `Server not found at:\n${serverPath}\n\nPlease reinstall Noxis.`
        )
        app.quit()
        return
      }

      // Check SQLite binding exists (check both node-gyp build and prebuilds layout)
      let sqliteBinding = path.join(
        sqlitePath,
        'build',
        'Release',
        'better_sqlite3.node'
      )
      if (!fs.existsSync(sqliteBinding)) {
        sqliteBinding = path.join(
          sqlitePath,
          'prebuilds',
          `win32-x64`,
          `node.napi.node`
        )
      }
      const sqliteExists = fs.existsSync(sqliteBinding)
      startupLog(`[Electron] SQLite binding exists: ${sqliteExists}`)
      if (!sqliteExists) {
        startupLog(`[WARN] SQLite binding not found at ${sqliteBinding}`)
        startupLog(`[WARN] Listing sqlite dir:`)
        try {
          const listDir = (dir: string, depth = 0) => {
            if (depth > 3) return
            fs.readdirSync(dir).forEach(f => {
              startupLog(
                `${'  '.repeat(depth)}${f}`
              )
              const full = path.join(dir, f)
              if (fs.statSync(full).isDirectory()) {
                listDir(full, depth + 1)
              }
            })
          }
          listDir(sqlitePath)
        } catch (e: any) {
          startupLog(`[WARN] Could not list: ${e.message}`)
        }
      }

      const userDataPath = app.getPath('userData');
      fs.mkdirSync(userDataPath, { recursive: true });

      // Release the held port RIGHT BEFORE spawning —
      // this minimizes the gap to milliseconds instead
      // of however long createSplashWindow() and the
      // file-existence checks above took
      await releaseReservedPort();

      nextServer = utilityProcess.fork(serverPath, [], {
        cwd: path.dirname(serverPath),
        env: {
          ...process.env,
          PORT:                 String(PORT),
          NODE_ENV:             'production',
          // 0.0.0.0 allows mobile phones on the same WiFi to connect.
          // Electron's BrowserWindow still uses http://127.0.0.1:PORT
          // (see waitForServer / loadURL below) — only the TCP listen binding changes.
          HOSTNAME:             '0.0.0.0',
          ELECTRON_USER_DATA:   userDataPath,
          ELECTRON_RESOURCES:   process.resourcesPath,

          // CRITICAL: Tell Node where to find
          // the native sqlite binding
          NODE_PATH: [
            sqlitePath,
            path.join(process.resourcesPath, 'app.asar', 'node_modules'),
            path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules'),
            path.join(process.resourcesPath, 'standalone', 'node_modules'),
            path.join(process.resourcesPath, 'standalone'),
          ].join(path.delimiter),

          // Native module path override
          BETTER_SQLITE3_BINDING: sqliteBinding,

          // Supabase from env
          NEXT_PUBLIC_SUPABASE_URL:  process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',

          // Electron DB key
          ELECTRON_DB_KEY: deriveDbKey(
            process.env.USER_ID || 'SYSTEM'
          ),
        },
        stdio: 'pipe',
      })

      // Log ALL server output — this shows the exact crash message
      let serverLog = ''
      nextServer.stdout?.on('data', (d: Buffer) => {
        const msg = d.toString().trim()
        startupLog(`[Next.js] ${msg}`)
        serverLog += msg + '\n'
      })
      nextServer.stderr?.on('data', (d: Buffer) => {
        const msg = d.toString().trim()
        startupLog(`[Next.js ERR] ${msg}`)
        serverLog += '[ERR] ' + msg + '\n'
      })

      nextServer.on('exit', (code) => {
        startupLog(`[Next.js] Exit code: ${code}`)
        startupLog(`[Next.js] Last output:\n${serverLog.slice(-1000)}`)
        if (code !== 0 && code !== null) {
          destroySplash();
          dialog.showErrorBox(
            'Server Crashed',
            `Server exited with code ${code}.\n\nLast server output:\n${serverLog.slice(-500)}`
          );
        }
        nextServer = null;
      })
    } else {
      await releaseReservedPort();
    }

    // ── STEP 3: Create main window (loads silently) ──
    // Splash stays visible while this loads.
    // ready-to-show event handles the transition.
    await createMainWindow();

    // ── STEP 4: Setup non-blocking features ──
    // Run these AFTER window is shown, not before.
    // This prevents blocking the UI thread at startup.
    if (mainWindow) {
      // Delay non-critical setup to keep UI responsive
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          setupAutoUpdater(mainWindow);
        }
      }, 5000);

      setTimeout(() => {
        startMemoryMonitor();
      }, 10000);

      setTimeout(() => {
        spawnVisionEngine();
      }, 8000);
    }
    } catch (fatalErr: any) {
      startupLog(`[FATAL STARTUP ERROR] ${fatalErr.message}`);
      if (fatalErr.stack) startupLog(fatalErr.stack);
      try {
        destroySplash();
      } catch {}
      dialog.showErrorBox(
        'Noxis Failed to Start',
        `A fatal error occurred during startup:\n\n${fatalErr.message}\n\n` +
        `Log file:\n${logPath}\n\n` +
        `WhatsApp: +92 333 435 5475`
      );
      app.quit();
    }
  });

  // Windows: quit when all windows close
  app.on('window-all-closed', () => app.quit());

  // Cleanup on quit
  app.on('before-quit', (event) => {
    if (nextServer || visionProcess) {
      event.preventDefault();

      startupLog('[Electron] Shutting down...');

      if (sessionTimeoutTimer) clearTimeout(sessionTimeoutTimer);
      if (warningTimer)        clearTimeout(warningTimer);
      if (memoryMonitorInterval) clearInterval(memoryMonitorInterval);

      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.destroy();
      }

      Promise.all([
        killProcess(visionProcess, 'Vision Engine'),
        killProcess(nextServer, 'Next.js Server'),
      ]).then(() => {
        visionProcess = null;
        nextServer = null;
        startupLog('[Electron] Shutdown complete ✓');
        app.quit();
      });
    }
  });

}