import { app, BrowserWindow, ipcMain, dialog, utilityProcess, UtilityProcess, powerSaveBlocker, Notification } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess, exec } from 'child_process';
import * as Sentry from '@sentry/electron/main';
import * as http from 'http';
import * as https from 'https';
import * as crypto from 'crypto';
import { execFile } from 'child_process';
import * as net from 'net';
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import * as os from 'os'
import { release } from 'os'
import { deriveDbKey } from '../src/lib/security/dbKeyManager'
import { registerOnvifHandlers } from './services/onvifService'
import { registerMediamtxHandlers, stopMediamtx } from './services/mediamtxService'
// ── Licensing & Security ──────────────────────────────────────────────────────
import { verifyHWID, generateHWID, getCachedHWIDOrGenerate } from './services/hwid'
import { initTrialEngine, checkpointMonotonicElapsed, getTrialState } from './services/trialEngine'
import { verifyLicense, getActiveLicensePayload, getRawLicensePayload, isLicenseExpired, persistLicense, revokeLicense } from './services/licenseVerifier'
import { canUse, getActiveTierInfo, isWithinDeviceLimit, FEATURES } from './services/tierEngine'
import { buildHubAck, normalizeRole, canWriteKhata, type MobileRole } from './bridge/rbacEngine'
import { deliverMessageToDevice, broadcastToAllDevices, getConnectedClientsMap } from '../src/lib/mobile-bridge/server'
import {
  initAutonomousUpdateBaseline,
  calculateVersionEligibility,
  getVersionPolicy,
} from './services/autonomousUpdateEngine'
// ── Store ─────────────────────────────────────────────────────────────────────
import store, {
  saveSession,
  clearSession,
  getSession,
  savePinHash,
  getPinHash,
  isAppLockEnabled,
  setAppLockEnabled,
  isLocked,
  setLocked,
  getLockState,
  recordFailedAttempt,
  clearLockAttempts,
  getLockTimeout,
  setLockTimeout,
  saveLastRoute,
  getLastRoute,
  saveLastActive,
  getLastActive,
  saveFormDraft,
  getFormDraft,
  clearFormDraft,
  getAllFormDrafts,
  saveScrollPosition,
  getScrollPosition,
  getLastSyncAt,
  setLastSyncAt,
  getAutoStartEnabled,
  setAutoStartEnabled,
  getKeepAwakeEnabled,
  setKeepAwakeEnabled,
  getExitFlag,
  setExitFlag,
  getLastSeenVersion,
  setLastSeenVersion,
  getInstallationHWID,
} from './store'

// ─────────────────────────────────────────────
// 0. GLOBAL REFERENCES
// ─────────────────────────────────────────────
try {
  // Write to userData if packaged, or to cwd if dev — never use a hardcoded path
  const debugPath = app.isPackaged
    ? path.join(app.getPath('userData'), 'debug-startup.txt')
    : path.join(process.cwd(), 'debug-startup.txt');
  fs.writeFileSync(debugPath, `Start execution: packaged=${app.isPackaged}\n`);
} catch { }
let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

function safeSend(win: BrowserWindow | null | undefined, channel: string, ...args: any[]): boolean {
  if (!win) return false;
  try {
    if (win.isDestroyed()) return false;
    const wc = win.webContents;
    if (!wc || wc.isDestroyed()) return false;
    wc.send(channel, ...args);
    return true;
  } catch {
    return false;
  }
}
let nextServer: ChildProcess | UtilityProcess | null = null;
let visionProcess: ChildProcess | null = null;
let tunnelProcess: ChildProcess | null = null;
let tunnelUrl: string | null = null;
let sessionTimeoutTimer: NodeJS.Timeout | null = null;
let warningTimer: NodeJS.Timeout | null = null;
let memoryMonitorInterval: NodeJS.Timeout | null = null;
let trialHeartbeatInterval: NodeJS.Timeout | null = null;
let PORT = Number(process.env.PORT || 3000);
let isReadOnly = false;
let lastBridgeStatus = { connected: 0, paired: 0, pairedDevices: [] as any[] };
let wasPowerCut = false;

const isDev = !app.isPackaged;

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_LEAD_MS = 60 * 1000;

log.transports.file.level = 'info'
log.transports.file.maxSize = 5 * 1024 * 1024
autoUpdater.logger = log

// Update channel — can be changed per license tier (Pro/Elite get beta channel)
autoUpdater.channel = 'stable'
autoUpdater.autoDownload = true;
autoUpdater.disableDifferentialDownload = false;
autoUpdater.allowPrerelease = false
autoUpdater.allowDowngrade = true
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://noxishub.app/updates/stable',
  useMultipleRangeRequest: true,
} as any)

// Track update state for IPC
let updateAvailable = false;
let updateDownloaded = false;
let downloadProgress = 0;
let latestUpdateInfo: any = null;
let downloadedInstallerPath: string | null = null;
let isCustomDownloading = false;
let customTransferred = 0;
let customTotal = 0;
let isQuittingForUpdate = false;

// ─────────────────────────────────────────────
// 1. LOGGER
// ─────────────────────────────────────────────
function ensureLogDirectory(): string {
  try {
    const userData = (app && app.getPath) ? app.getPath('userData') : path.join(process.env.APPDATA || '', 'NoxisHub');
    const logsDir = path.join(userData, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    return logsDir;
  } catch {
    const fallback = path.join(process.env.APPDATA || 'C:\\ProgramData', 'NoxisHub', 'logs');
    try { fs.mkdirSync(fallback, { recursive: true }); } catch {}
    return fallback;
  }
}

let logPath = '';

function startupLog(msg: string): void {
  try {
    if (!logPath) {
      const logsDir = ensureLogDirectory();
      logPath = path.join(logsDir, 'startup.log');
    }
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`, 'utf8');
  } catch (err) {
    console.error('Failed writing to log file:', err);
  }
  try { log.info(msg); } catch {}
}

// ── AUTO-START MANAGEMENT ──
function applyAutoStart(enabled: boolean): void {
  try {
    const isWin = process.platform === 'win32';
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: false,
      ...(isWin && app.isPackaged && {
        path: process.execPath,
        args: ['--autostart'],
      }),
    })

    startupLog(
      `[AutoStart] ${enabled
        ? 'Registered — opens on Windows boot'
        : 'Unregistered'}`
    )
  } catch (err: any) {
    startupLog(`[AutoStart] Failed: ${err.message}`)
  }
}

function getAutoStartStatus(): { enabled: boolean; registeredWithOS: boolean } {
  const stored = getAutoStartEnabled()
  let registeredWithOS = false

  try {
    const isWin = process.platform === 'win32';
    const settings = app.getLoginItemSettings({
      ...(isWin && app.isPackaged && {
        path: process.execPath,
        args: ['--autostart'],
      }),
    })
    registeredWithOS = settings.openAtLogin || stored
  } catch {
    registeredWithOS = stored
  }

  return {
    enabled: stored,
    registeredWithOS,
  }
}

// ── POWER & HARDWARE MANAGEMENT (Industrial 24/7 Keep-Awake) ──
let powerBlockerId: number | null = null

function applyKeepAwake(enabled: boolean): void {
  try {
    if (enabled) {
      if (powerBlockerId === null || !powerSaveBlocker.isStarted(powerBlockerId)) {
        powerBlockerId = powerSaveBlocker.start('prevent-app-suspension')
        startupLog(`[PowerSave] Industrial Keep-Awake active (id: ${powerBlockerId}) — Windows sleep suspended`)
      }
    } else {
      if (powerBlockerId !== null && powerSaveBlocker.isStarted(powerBlockerId)) {
        powerSaveBlocker.stop(powerBlockerId)
        startupLog(`[PowerSave] Keep-awake stopped (id: ${powerBlockerId})`)
        powerBlockerId = null
      }
    }
  } catch (err: any) {
    startupLog(`[PowerSave] Failed: ${err.message}`)
  }
}

function startCloudflaredTunnel(): void {
  const cloudflaredPath = path.join(
    process.env['ProgramFiles'] || 'C:\\Program Files',
    'Cloudflare',
    'cloudflared.exe'
  );

  if (!fs.existsSync(cloudflaredPath)) {
    startupLog('[Tunnel] cloudflared not installed — skipping');
    return;
  }

  startupLog('[Tunnel] Starting Cloudflare tunnel...');

  tunnelProcess = spawn(
    cloudflaredPath,
    ['tunnel', 'run'],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  tunnelProcess.stdout?.on('data', (data: Buffer) => {
    const output = data.toString();
    startupLog(`[Tunnel] ${output.trim()}`);

    const urlMatch = output.match(
      /https:\/\/[a-z0-9-]+\.trycloudflare\.com/
    ) || output.match(
      /https:\/\/[a-z0-9-]+\.cfargotunnel\.com/
    );

    if (urlMatch && !tunnelUrl) {
      tunnelUrl = urlMatch[0];
      startupLog(`[Tunnel] URL: ${tunnelUrl}`);
      process.env.CLOUDFLARE_TUNNEL_URL = tunnelUrl.replace('https://', '');
      safeSend(
        mainWindow,
        'tunnel-ready',
        { url: tunnelUrl }
      );
    }
  });

  tunnelProcess.stderr?.on('data', (data: Buffer) => {
    const output = data.toString();
    startupLog(`[Tunnel ERR] ${output.trim()}`);

    const urlMatch = output.match(
      /https:\/\/[a-z0-9-]+\.trycloudflare\.com/
    ) || output.match(
      /https:\/\/[a-z0-9-]+\.cfargotunnel\.com/
    );

    if (urlMatch && !tunnelUrl) {
      tunnelUrl = urlMatch[0];
      startupLog(`[Tunnel] URL: ${tunnelUrl}`);
      process.env.CLOUDFLARE_TUNNEL_URL = tunnelUrl.replace('https://', '');
      safeSend(
        mainWindow,
        'tunnel-ready',
        { url: tunnelUrl }
      );
    }
  });

  tunnelProcess.on('exit', (code) => {
    startupLog(`[Tunnel] Exited with code ${code}`);
    tunnelUrl = null;
    tunnelProcess = null;
  });
}

function startQuickTunnel(): void {
  const cloudflaredPath = path.join(
    process.env['ProgramFiles'] || 'C:\\Program Files',
    'Cloudflare',
    'cloudflared.exe'
  );

  if (!fs.existsSync(cloudflaredPath)) return;

  startupLog('[QuickTunnel] Starting temporary tunnel...');

  tunnelProcess = spawn(
    cloudflaredPath,
    [
      'tunnel',
      '--url',
      `http://127.0.0.1:${PORT}`,
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  tunnelProcess.stdout?.on('data', (data: Buffer) => {
    const output = data.toString();
    const urlMatch = output.match(
      /https:\/\/[a-z0-9-]+\.trycloudflare\.com/
    );
    if (urlMatch && !tunnelUrl) {
      tunnelUrl = urlMatch[0];
      startupLog(`[QuickTunnel] URL: ${tunnelUrl}`);
      process.env.CLOUDFLARE_TUNNEL_URL = tunnelUrl.replace('https://', '');
      safeSend(
        mainWindow,
        'tunnel-ready',
        { url: tunnelUrl }
      );
    }
  });

  tunnelProcess.stderr?.on('data', (data: Buffer) => {
    const output = data.toString();
    const urlMatch = output.match(
      /https:\/\/[a-z0-9-]+\.trycloudflare\.com/
    );
    if (urlMatch && !tunnelUrl) {
      tunnelUrl = urlMatch[0];
      startupLog(`[QuickTunnel] URL: ${tunnelUrl}`);
      process.env.CLOUDFLARE_TUNNEL_URL = tunnelUrl.replace('https://', '');
      mainWindow?.webContents.send(
        'tunnel-ready',
        { url: tunnelUrl }
      );
    }
  });

  tunnelProcess.on('exit', (code) => {
    startupLog(`[QuickTunnel] Exited with code ${code}`);
    tunnelUrl = null;
    tunnelProcess = null;
  });
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

// Detect Windows version
// Windows 7 = NT 6.1
// Windows 8 = NT 6.2
// Windows 8.1 = NT 6.3
// Windows 10/11 = NT 10.0
function getWindowsVersion(): {
  major: number
  minor: number
  isWin7: boolean
  isWin8: boolean
  isWin10Plus: boolean
} {
  if (process.platform !== 'win32') {
    return {
      major: 0, minor: 0,
      isWin7: false, isWin8: false,
      isWin10Plus: false,
    }
  }
  const r = release()
  const parts = r.split('.').map(Number)
  const major = parts[0] || 0
  const minor = parts[1] || 0
  return {
    major,
    minor,
    isWin7: major === 6 && minor === 1,
    isWin8: major === 6 && (minor === 2 || minor === 3),
    isWin10Plus: major >= 10,
  }
}

const winVersion = getWindowsVersion()

// Windows 7/8 specific: setAppUserModelId
// works differently — wrap in try/catch
if (process.platform === 'win32') {
  try {
    app.setAppUserModelId('com.omnoralabs.noxis')
  } catch (err: any) {
    startupLog(`[Win] AppUserModelId failed: ${err.message}`)
    // Non-fatal — app still works
  }
}

// Force disable GPU acceleration and sandbox on Windows to resolve KERNELBASE.dll 0x80000003 crashes
if (process.platform === 'win32') {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
  app.commandLine.appendSwitch('no-sandbox');
  startupLog('[Win] GPU acceleration and Sandbox disabled defensively to prevent KERNELBASE.dll crashes');
}

// Disable unneeded background media key handling
app.commandLine.appendSwitch(
  'disable-features',
  'HardwareMediaKeyHandling,MediaSessionService'
)

// V8 heap space expanded to 4GB to completely eliminate synchronous stop-the-world GC UI stutter
app.commandLine.appendSwitch(
  'js-flags',
  '--max-old-space-size=4096'
)

startupLog('════════════ NOXIS STARTUP ════════════');
startupLog(`Platform: ${process.platform} | Arch: ${process.arch} | isDev: ${isDev}`);

function killProcess(child: ChildProcess | UtilityProcess | null, name: string): Promise<void> {
  return new Promise((resolve) => {
    if (!child) { resolve(); return; }
    startupLog(`[Cleanup] Terminating ${name} (PID: ${child.pid || 'N/A'})...`);

    // Safety timeout: resolve after 2.5 seconds no matter what to prevent app hangs
    const safetyTimeout = setTimeout(() => {
      startupLog(`[Cleanup] Safety timeout reached for ${name}, forcing resolve`);
      resolve();
    }, 2500);

    try {
      try {
        child.kill();
      } catch (killErr: any) {
        startupLog(`[Cleanup] child.kill() failed: ${killErr.message}`);
      }

      if (process.platform === 'win32' && child.pid) {
        exec(`taskkill /pid ${child.pid} /T /F`, (err) => {
          clearTimeout(safetyTimeout);
          if (err) startupLog(`[Cleanup ERR] Failed to taskkill ${name}: ${err.message}`);
          else startupLog(`[Cleanup] Successfully taskkilled ${name}`);
          resolve();
        });
      } else {
        clearTimeout(safetyTimeout);
        resolve();
      }
    } catch (e: any) {
      clearTimeout(safetyTimeout);
      startupLog(`[Cleanup ERR] Error killing ${name}: ${e.message}`);
      resolve();
    }
  });
}

// ─────────────────────────────────────────────
// 2. SINGLE INSTANCE LOCK
// ─────────────────────────────────────────────
const gotTheLock = app.isPackaged ? app.requestSingleInstanceLock() : true;

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
        try { server.close(); } catch { }
        startupLog(`[Port] Reserve attempt on ${startPort} timed out`);
        resolve(reserveAvailablePort(startPort + 1, attempt + 1));
      }, 2000);

      server.listen(startPort, '127.0.0.1', () => {
        clearTimeout(timeout);
        const addr = server.address();
        if (!addr || typeof addr === 'string') {
          try { server.close(); } catch { }
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
    interval = 100
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
            // Pre-warm dashboard route in background for instant first render
            try {
              http.get(`${url}/dashboard`, () => {}).on('error', () => {});
              http.get(`${url}/api/dashboard/kpis`, () => {}).on('error', () => {});
            } catch {}
            resolve();
          } else {
            setTimeout(check, interval);
          }
        });

        req.on('error', () => {
          if (done) return;
          setTimeout(check, interval);
        });

        req.setTimeout(1000, () => {
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
  function createSplashWindow(customStatus?: string): void {
    const iconPath = app.isPackaged
      ? path.join(process.resourcesPath, 'build', 'icon.ico')
      : path.join(__dirname, '../../build/icon.ico');
    startupLog(`[Icon] Splash Path: ${iconPath}`);
    startupLog(`[Icon] Splash Exists: ${fs.existsSync(iconPath)}`);

    // Resolve official Noxis Hub logo as base64 to guarantee instant zero-network rendering
    let logoDataUrl = '';
    const possibleLogoPaths = [
      app.isPackaged ? path.join(process.resourcesPath, 'build', 'icon.png') : '',
      app.isPackaged ? path.join(process.resourcesPath, 'public', 'logos', 'icons', '256x256.png') : '',
      path.join(__dirname, '../../build/icon.png'),
      path.join(__dirname, '../../public/logos/icons/256x256.png'),
      path.join(__dirname, '../public/logos/icons/256x256.png'),
      path.join(__dirname, '../../public/logos/noxis.png'),
      path.join(process.cwd(), 'build/icon.png'),
      path.join(process.cwd(), 'public/logos/icons/256x256.png'),
    ].filter(Boolean);

    for (const p of possibleLogoPaths) {
      if (fs.existsSync(p)) {
        try {
          const buf = fs.readFileSync(p);
          logoDataUrl = `data:image/png;base64,${buf.toString('base64')}`;
          startupLog(`[Splash] Loaded logo from: ${p} (${buf.length} bytes)`);
          break;
        } catch (e: any) {
          startupLog(`[Splash] Failed reading logo at ${p}: ${e.message}`);
        }
      }
    }

    splashWindow = new BrowserWindow({
      width: 560,
      height: 400,
      frame: false,
      transparent: false,
      resizable: false,
      movable: true,
      center: true,
      alwaysOnTop: true,
      skipTaskbar: false,
      backgroundColor: '#07090E',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
      },
      icon: iconPath,
    });

    const logoHtml = logoDataUrl
      ? `<img src="${logoDataUrl}" alt="Noxis Hub" style="width:58px;height:58px;object-fit:contain;filter:drop-shadow(0 0 16px rgba(6,182,212,0.65));border-radius:12px;" />`
      : `<svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 4L42 14V34L24 44L6 34V14L24 4Z" stroke="#06B6D4" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M16 32V16L32 32V16" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="24" cy="24" r="3" fill="#06B6D4" />
        </svg>`;

    const statusMessage = customStatus || 'Starting and preparing Noxis Hub Specially For You...';

    const splashHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Noxis Hub</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;background:#07090E;overflow:hidden;user-select:none;-webkit-app-region:drag;}
body{display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;border:1px solid rgba(6,182,212,0.35);box-shadow:inset 0 0 50px rgba(6,182,212,0.08);position:relative;}

.glow-bg{position:absolute;width:280px;height:280px;background:radial-gradient(circle,rgba(6,182,212,0.22) 0%,rgba(99,102,241,0.12) 50%,transparent 70%);border-radius:50%;filter:blur(36px);pointer-events:none;animation:pulse 3.5s ease-in-out infinite alternate;}

.logo-container{position:relative;width:96px;height:96px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;}

.noxis-badge{width:88px;height:88px;border-radius:22px;background:linear-gradient(135deg,#0C1322 0%,#060910 100%);border:1.5px solid rgba(6,182,212,0.55);display:flex;align-items:center;justify-content:center;box-shadow:0 0 35px rgba(6,182,212,0.3),inset 0 1px 0 rgba(255,255,255,0.1);position:relative;z-index:2;}

.brand-title{font-size:26px;font-weight:900;letter-spacing:8px;text-transform:uppercase;background:linear-gradient(90deg,#FFFFFF 0%,#38BDF8 55%,#06B6D4 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px;}
.brand-sub{font-size:9.5px;font-weight:700;letter-spacing:4.5px;color:#94A3B8;text-transform:uppercase;margin-bottom:28px;display:flex;align-items:center;gap:8px;}
.brand-badge{font-size:8px;padding:2px 7px;background:rgba(6,182,212,0.15);border:1px solid rgba(6,182,212,0.4);color:#38BDF8;border-radius:999px;letter-spacing:1px;font-weight:800;}

.progress-track{width:260px;height:3px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden;position:relative;margin-bottom:14px;}
.progress-bar{position:absolute;top:0;left:0;height:100%;background:linear-gradient(90deg,#C5A059,#06B6D4,#38BDF8);border-radius:2px;box-shadow:0 0 14px rgba(6,182,212,0.8);animation:load 2.4s cubic-bezier(0.4,0,0.2,1) infinite;}

.status-text{font-size:10px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;color:#38BDF8;letter-spacing:1px;font-weight:600;display:flex;align-items:center;gap:7px;text-align:center;}
.status-dot{width:6px;height:6px;border-radius:50%;background:#06B6D4;box-shadow:0 0 10px #06B6D4;animation:blink 1.2s ease-in-out infinite;flex-shrink:0;}

.footer-meta{position:absolute;bottom:14px;display:flex;align-items:center;justify-content:space-between;width:100%;padding:0 26px;font-size:9px;font-family:ui-monospace,monospace;color:#64748B;letter-spacing:1px;}

@keyframes pulse{0%{opacity:0.6;transform:scale(0.95);}100%{opacity:1;transform:scale(1.15);}}
@keyframes load{0%{width:0%;left:0%;}50%{width:70%;left:20%;}100%{width:10%;left:100%;}}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:0.3;}}
</style>
</head>
<body>
<div class="glow-bg"></div>

<div class="logo-container">
  <div class="noxis-badge">
    ${logoHtml}
  </div>
</div>

<div class="brand-title">NOXIS HUB</div>
<div class="brand-sub">
  <span>Industrial Intelligence</span>
  <span class="brand-badge">v${app.getVersion() || '14.0.17'}</span>
</div>

<div class="progress-track">
  <div class="progress-bar"></div>
</div>

<div class="status-text">
  <span class="status-dot"></span>
  <span>${statusMessage}</span>
</div>

<div class="footer-meta">
  <span>OFFLINE-FIRST CORE</span>
  <span>OMNORA LABS</span>
</div>
</body>
</html>`;

    splashWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(splashHtml));
    splashWindow.show();
    startupLog('[Splash] Splash window displayed with encoded URL');
  }

  function destroySplash(): void {
    if (!splashWindow || splashWindow.isDestroyed()) return;
    splashWindow.webContents.executeJavaScript(`
      document.body.style.transition = 'opacity 0.35s ease';
      document.body.style.opacity = '0';
    `).catch(() => { });
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
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
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

  // ── RESUMABLE HTTP RANGE DOWNLOADER (Power-Cut & Offline Safe) ──
  async function downloadUpdateResumable(win: BrowserWindow): Promise<void> {
    if (isCustomDownloading) return;
    if (!latestUpdateInfo) {
      startupLog('[Update] No update info found to download');
      return;
    }

    isCustomDownloading = true;
    const targetVersion = latestUpdateInfo.version;
    const fileName = latestUpdateInfo.files?.[0]?.url || `Noxis Hub Setup ${targetVersion}.exe`;
    const encodedFileName = encodeURIComponent(fileName);
    const candidateUrls = [
      `https://noxishub.app/updates/stable/${encodedFileName}`,
      `https://download.omnora.com/updates/stable/${encodedFileName}`
    ];
    let downloadUrl = candidateUrls[0];
    const totalSize = latestUpdateInfo.files?.[0]?.size || 215756803;
    const targetSha512 = latestUpdateInfo.files?.[0]?.sha512 || latestUpdateInfo.sha512;

    const updatesDir = path.join(app.getPath('userData'), 'updates');
    if (!fs.existsSync(updatesDir)) {
      fs.mkdirSync(updatesDir, { recursive: true });
    }

    const finalFilePath = path.join(updatesDir, `Noxis-Hub-Setup-${targetVersion}.exe`);
    const partFilePath = path.join(updatesDir, `Noxis-Hub-Setup-${targetVersion}.exe.part`);

    // 1. If final verified installer already exists, complete immediately
    if (fs.existsSync(finalFilePath)) {
      try {
        const existingBuf = fs.readFileSync(finalFilePath);
        const hash = crypto.createHash('sha512').update(existingBuf).digest('base64');
        if (!targetSha512 || hash === targetSha512) {
          startupLog(`[Update] Verified v${targetVersion} installer already on disk!`);
          updateDownloaded = true;
          downloadedInstallerPath = finalFilePath;
          isCustomDownloading = false;
          win.webContents.send('update-status', {
            status: 'ready',
            version: targetVersion,
          });
          return;
        }
      } catch {}
    }

    // 2. Check partial download for Byte-Range resumption
    let startByte = 0;
    if (fs.existsSync(partFilePath)) {
      try {
        const stats = fs.statSync(partFilePath);
        if (stats.size > 0 && stats.size < totalSize) {
          startByte = stats.size;
          startupLog(`[Update] Resuming partial download at ${(startByte / (1024 * 1024)).toFixed(1)} MB / ${(totalSize / (1024 * 1024)).toFixed(1)} MB`);
        } else if (stats.size >= totalSize) {
          fs.renameSync(partFilePath, finalFilePath);
          updateDownloaded = true;
          downloadedInstallerPath = finalFilePath;
          isCustomDownloading = false;
          win.webContents.send('update-status', {
            status: 'ready',
            version: targetVersion,
          });
          return;
        }
      } catch {}
    }

    customTotal = totalSize;
    customTransferred = startByte;

    const headers: Record<string, string> = {
      'User-Agent': 'Noxis-Hub-Updater/14.0',
    };
    if (startByte > 0) {
      headers['Range'] = `bytes=${startByte}-`;
    }

    return new Promise((resolve) => {
      let urlIndex = 0;

      const attemptDownload = (currentUrl: string) => {
        let lastBytes = startByte;
        let lastTime = Date.now();
        let speed = 0;

        startupLog(`[Update] Initiating download stream from: ${currentUrl}`);
        win.webContents.send('update-status', {
          status: 'downloading',
          percent: totalSize > 0 ? Math.round((startByte / totalSize) * 100) : 0,
          transferred: startByte,
          total: totalSize,
          bytesPerSecond: 0,
          resumed: startByte > 0,
          resumedFrom: startByte,
        });

        const req = https.get(currentUrl, { headers }, (res) => {
          if (res.statusCode !== 200 && res.statusCode !== 206) {
            urlIndex++;
            if (urlIndex < candidateUrls.length) {
              startupLog(`[Update] Status ${res.statusCode} from ${currentUrl}, falling back to ${candidateUrls[urlIndex]}`);
              return attemptDownload(candidateUrls[urlIndex]);
            }
            isCustomDownloading = false;
            startupLog(`[Update] All download mirrors returned HTTP ${res.statusCode}`);
            win.webContents.send('update-status', {
              status: 'error',
              message: `Server returned HTTP ${res.statusCode}`,
            });
            return resolve();
          }

        const isAppend = res.statusCode === 206 && startByte > 0;
        const fileStream = fs.createWriteStream(partFilePath, { flags: isAppend ? 'a' : 'w' });
        if (!isAppend) {
          customTransferred = 0;
          startByte = 0;
        }

        res.on('data', (chunk: Buffer) => {
          customTransferred += chunk.length;
          const now = Date.now();
          if (now - lastTime >= 400) {
            const deltaBytes = customTransferred - lastBytes;
            const deltaTime = (now - lastTime) / 1000;
            speed = Math.round(deltaBytes / deltaTime);
            lastBytes = customTransferred;
            lastTime = now;

            const pct = Math.min(100, Math.round((customTransferred / totalSize) * 100));
            win.webContents.send('update-status', {
              status: 'downloading',
              percent: pct,
              transferred: customTransferred,
              total: totalSize,
              bytesPerSecond: speed,
              resumed: startByte > 0,
              resumedFrom: startByte,
            });
          }
        });

        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close(async () => {
            isCustomDownloading = false;
            startupLog('[Update] Download finished. Verifying SHA-512 checksum...');

            try {
              const fileData = fs.readFileSync(partFilePath);
              const computedSha512 = crypto.createHash('sha512').update(fileData).digest('base64');
              if (targetSha512 && computedSha512 !== targetSha512) {
                startupLog(`[Update] Checksum mismatch! Expected ${targetSha512}, got ${computedSha512}`);
                try { fs.unlinkSync(partFilePath); } catch {}
                win.webContents.send('update-status', {
                  status: 'error',
                  message: 'Checksum verification mismatch. Corrupted partial download cleaned.',
                });
                return resolve();
              }

              if (fs.existsSync(finalFilePath)) {
                try { fs.unlinkSync(finalFilePath); } catch {}
              }
              fs.renameSync(partFilePath, finalFilePath);
              startupLog(`[Update] Verified package ready: ${finalFilePath}`);
              updateDownloaded = true;
              downloadedInstallerPath = finalFilePath;

              win.webContents.send('update-status', {
                status: 'ready',
                version: targetVersion,
              });
              resolve();
            } catch (err: any) {
              startupLog(`[Update] Checksum verification exception: ${err.message}`);
              win.webContents.send('update-status', {
                status: 'error',
                message: `Verification error: ${err.message}`,
              });
              resolve();
            }
          });
        });

        fileStream.on('error', (err) => {
          isCustomDownloading = false;
          startupLog(`[Update] File stream error: ${err.message}`);
          win.webContents.send('update-status', {
            status: 'error',
            message: err.message,
          });
          resolve();
        });
      });

        req.on('error', (err) => {
          urlIndex++;
          if (urlIndex < candidateUrls.length) {
            startupLog(`[Update] Network error on ${currentUrl} (${err.message}), trying fallback ${candidateUrls[urlIndex]}`);
            return attemptDownload(candidateUrls[urlIndex]);
          }
          isCustomDownloading = false;
          startupLog(`[Update] Network request error on all mirrors: ${err.message}`);
          win.webContents.send('update-status', {
            status: 'error',
            message: err.message,
          });
          resolve();
        });
      };

      attemptDownload(candidateUrls[0]);
    });
  }

  function setupAutoUpdater(win: BrowserWindow): void {
    // ── AUTO-UPDATER EVENT HANDLERS ──

    autoUpdater.on('checking-for-update', () => {
      startupLog('[Update] Checking for update...');
      safeSend(
        win,
        'update-status',
        {
          status: 'checking',
          message: 'Checking for updates...',
        }
      );
    });

    autoUpdater.on('update-available', (info) => {
      startupLog(`[Update] Incoming manifest update: v${info.version}`);
      
      const policy = getVersionPolicy();
      const eligibility = calculateVersionEligibility(policy.baselineVersion, policy.tier, info.version);

      if (!eligibility.allowed) {
        startupLog(`[Update] Version-Gated: v${info.version} exceeds ${policy.tier.toUpperCase()} baseline ceiling ${eligibility.maxAllowedVersion}`);
        updateAvailable = false;
        latestUpdateInfo = null;

        const gatedPayload = {
          status: 'gated',
          isGated: true,
          updateAvailable: true,
          targetVersion: info.version,
          version: info.version,
          requiredTier: eligibility.requiredTier,
          message: eligibility.message,
          baselineVersion: policy.baselineVersion,
          currentVersion: policy.currentVersion,
          maxAllowedVersion: eligibility.maxAllowedVersion,
          tier: policy.tier,
          hwid: policy.hwid,
        };

        safeSend(win, 'update-status', gatedPayload);
        safeSend(win, 'update-gated', gatedPayload);
        return;
      }

      updateAvailable = true;
      latestUpdateInfo = info;

      safeSend(
        win,
        'update-status',
        {
          status: 'available',
          isGated: false,
          version: info.version,
          releaseDate: info.releaseDate,
          releaseName: info.releaseName || `Version ${info.version}`,
          releaseNotes: info.releaseNotes || '',
        }
      );

      try {
        if (Notification.isSupported()) {
          new Notification({
            title: `Noxis Hub Update Available: v${info.version}`,
            body: `Downloading new update patch automatically in background...`,
          }).show();
        }
      } catch (err: any) {
        startupLog(`[Update] Notification error: ${err.message}`);
      }
    });

    autoUpdater.on('update-not-available', () => {
      startupLog('[Update] Up to date');
      safeSend(
        win,
        'update-status',
        {
          status: 'up-to-date',
          message: 'You are on the latest version.',
        }
      );
    });

    autoUpdater.on('download-progress', (progress) => {
      const fullSize = latestUpdateInfo?.files?.[0]?.size || 281255992;
      const total = progress.total && progress.total > 0 ? progress.total : fullSize;
      const transferred = Math.min(total, Math.max(0, progress.transferred));
      const pct = Math.min(100, Math.max(0, Math.round(progress.percent ?? (total > 0 ? (transferred / total) * 100 : 0))));

      downloadProgress = pct;
      startupLog(`[Update] Download: ${pct}% (${(transferred / 1048576).toFixed(1)}MB / ${(total / 1048576).toFixed(1)}MB)`);

      safeSend(
        win,
        'update-status',
        {
          status: 'downloading',
          version: latestUpdateInfo?.version || '14.0.0',
          percent: pct,
          transferred,
          total,
          bytesPerSecond: progress.bytesPerSecond,
        }
      );
    });

    autoUpdater.on('update-downloaded', (info) => {
      startupLog(`[Update] Downloaded: v${info.version}`);
      updateDownloaded = true;
      downloadProgress = 100;

      try {
        const auFile = (autoUpdater as any).installerPath || (autoUpdater as any).downloadedUpdateHelper?.file;
        if (auFile && fs.existsSync(auFile)) {
          downloadedInstallerPath = auFile;
          startupLog(`[Update] AutoUpdater installer path confirmed: ${downloadedInstallerPath}`);
        }
      } catch (pathErr: any) {
        startupLog(`[Update] Error inspecting installer path: ${pathErr?.message}`);
      }

      safeSend(
        win,
        'update-status',
        {
          status: 'ready',
          version: info.version,
          releaseName: info.releaseName || `Version ${info.version}`,
          releaseNotes: info.releaseNotes || '',
        }
      );

      try {
        if (Notification.isSupported()) {
          new Notification({
            title: `Noxis Hub v${info.version} Ready!`,
            body: `Software update v${info.version} has been downloaded. Restart the app or click the banner to apply.`,
          }).show();
        }
      } catch (err: any) {
        startupLog(`[Update] Notification error: ${err.message}`);
      }
    });

    autoUpdater.on('error', (err) => {
      startupLog(`[Update] Error: ${err.message}`);
      const isMissingServerOrAuth =
        err.message.includes('401') ||
        err.message.includes('404') ||
        err.message.includes('Unauthorized') ||
        err.message.includes('net::');

      safeSend(
        win,
        'update-status',
        {
          status: isMissingServerOrAuth ? 'up-to-date' : 'error',
          message: isMissingServerOrAuth
            ? 'Running latest version.'
            : `Update error: ${err.message}`,
        }
      );
    });

    // Re-broadcast status whenever window finishes loading
    win.webContents?.on('did-finish-load', () => {
      if (updateDownloaded && latestUpdateInfo) {
        safeSend(win, 'update-status', {
          status: 'ready',
          version: latestUpdateInfo.version,
          releaseName: latestUpdateInfo.releaseName || `Version ${latestUpdateInfo.version}`,
        });
      } else if (updateAvailable && latestUpdateInfo) {
        safeSend(win, 'update-status', {
          status: downloadProgress > 0 ? 'downloading' : 'available',
          version: latestUpdateInfo.version,
          percent: downloadProgress,
        });
      }
    });

    if (isDev) return;

    // Initial check — 2s and 10s after launch
    setTimeout(async () => {
      try {
        const res = await autoUpdater.checkForUpdates();
        if (res?.updateInfo) { latestUpdateInfo = res.updateInfo; updateAvailable = true; }
      } catch (err: any) { startupLog(`[Update] Initial check error: ${err.message}`); }
    }, 2000);

    setTimeout(async () => {
      if (!updateDownloaded && !updateAvailable) {
        try {
          const res = await autoUpdater.checkForUpdates();
          if (res?.updateInfo) { latestUpdateInfo = res.updateInfo; updateAvailable = true; }
        } catch { /* non-fatal */ }
      }
    }, 10000);

    // Periodic check — every 15 minutes
    setInterval(async () => {
      if (!updateDownloaded) {
        try {
          await autoUpdater.checkForUpdates();
        } catch { /* non-fatal */ }
      }
    }, 15 * 60 * 1000);
  }

  // ─────────────────────────────────────────────
  // 7. SESSION TIMERS
  // ─────────────────────────────────────────────
  function resetInactivityTimer(): void {
    if (sessionTimeoutTimer) clearTimeout(sessionTimeoutTimer);
    if (warningTimer) clearTimeout(warningTimer);

    warningTimer = setTimeout(() => {
      safeSend(mainWindow, 'session-expiring-warning');
    }, SESSION_TIMEOUT_MS - WARNING_LEAD_MS);

    sessionTimeoutTimer = setTimeout(() => {
      safeSend(mainWindow, 'session-timeout-logout');
    }, SESSION_TIMEOUT_MS);
  }

  ipcMain.on('user-activity', () => resetInactivityTimer());

  function startMemoryMonitor(): void {
    if (memoryMonitorInterval)
      clearInterval(memoryMonitorInterval)

    memoryMonitorInterval = setInterval(() => {
      const usage = process.memoryUsage()
      const heapMB = Math.round(
        usage.heapUsed / 1024 / 1024
      )
      const rssMB = Math.round(
        usage.rss / 1024 / 1024
      )

      startupLog(
        `[Memory] Heap: ${heapMB}MB / ` +
        `RSS: ${rssMB}MB`
      )

      // Aggressive GC on machines under memory pressure
      if (heapMB > 512) {
        if (typeof global.gc === 'function') {
          global.gc()
          startupLog(
            `[Memory] GC triggered: ${heapMB}MB`
          )
        }
      }

      // If heap exceeds 800MB, log warning
      if (heapMB > 800) {
        startupLog(
          `[Memory] WARNING: High heap ` +
          `usage ${heapMB}MB — possible leak`
        )
      }

      // Pass memory stats to renderer for the performance monitor
      safeSend(
        mainWindow,
        'memory-stats',
        { heapMB, rssMB }
      );
    }, 30000)
  }

  // ─────────────────────────────────────────────
  // 8. TITLE BAR IPC
  // ─────────────────────────────────────────────
  ipcMain.on('window-minimize', () => mainWindow?.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize(); else mainWindow?.maximize();
  });
  ipcMain.on('window-close', () => mainWindow?.close());
  ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false);

  // ─────────────────────────────────────────────
  // 8B. DISPLAY & ZOOM CONTROLS (Ctrl+0 Reset)
  // ─────────────────────────────────────────────
  ipcMain.handle('app:reset-zoom', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.setZoomLevel(0);
      mainWindow.webContents.setZoomFactor(1.0);
      startupLog('[Zoom] Reset display scale to 100% (Ctrl+0)');
      return 1.0;
    }
    return 1.0;
  });

  ipcMain.handle('app:zoom-in', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const current = mainWindow.webContents.getZoomFactor();
      const next = Math.min(2.0, Number((current + 0.1).toFixed(2)));
      mainWindow.webContents.setZoomFactor(next);
      return next;
    }
    return 1.0;
  });

  ipcMain.handle('app:zoom-out', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const current = mainWindow.webContents.getZoomFactor();
      const next = Math.max(0.8, Number((current - 0.1).toFixed(2)));
      mainWindow.webContents.setZoomFactor(next);
      return next;
    }
    return 1.0;
  });

  ipcMain.handle('app:get-zoom-factor', () => {
    return mainWindow && !mainWindow.isDestroyed() ? mainWindow.webContents.getZoomFactor() : 1.0;
  });

  // Serial port for weighbridge
  ipcMain.handle('fetchScaleWeight', async () => {
    try {
      // Most Pakistani weighbridges output
      // a simple string like "0044.50 KG"
      // via RS232/COM port
      // Check which COM port is available
      const { SerialPort } = require('serialport')
      const ports = await SerialPort.list()
      const weightPort = ports.find(
        (p: any) =>
          p.manufacturer?.includes('Prolific') ||
          p.path?.includes('COM')
      )

      if (!weightPort) {
        return {
          success: false,
          reason: 'No weighbridge detected'
        }
      }

      const port = new SerialPort({
        path: weightPort.path,
        baudRate: 9600,
      })

      return new Promise((resolve) => {
        let data = ''
        const timeout = setTimeout(() => {
          try { port.close() } catch { }
          resolve({
            success: false,
            reason: 'Weighbridge timeout'
          })
        }, 3000)

        port.on('data', (chunk: Buffer) => {
          data += chunk.toString()
          const match = data.match(
            /(\d+\.?\d*)\s*(KG|kg|Kg)/
          )
          if (match) {
            clearTimeout(timeout)
            try { port.close() } catch { }
            resolve({
              success: true,
              weight: parseFloat(match[1]),
              unit: 'KG',
            })
          }
        })

        port.on('error', (err: any) => {
          clearTimeout(timeout)
          try { port.close() } catch { }
          resolve({
            success: false,
            reason: err.message || 'Port error'
          })
        })
      })
    } catch {
      return {
        success: false,
        reason: 'SerialPort not available'
      }
    }
  });
  const executeUpdateCheck = async (simulateTargetVersion?: string) => {
    try {
      const policy = getVersionPolicy();

      // If simulateTargetVersion passed (useful for simulated tests or UI checks)
      if (simulateTargetVersion) {
        const eligibility = calculateVersionEligibility(
          policy.baselineVersion,
          policy.tier,
          simulateTargetVersion
        );
        if (!eligibility.allowed) {
          const payload = {
            status: 'gated',
            updateAvailable: true,
            isGated: true,
            requiredTier: eligibility.requiredTier,
            message: eligibility.message,
            targetVersion: simulateTargetVersion,
            baselineVersion: policy.baselineVersion,
            currentVersion: policy.currentVersion,
            maxAllowedVersion: eligibility.maxAllowedVersion,
            tier: policy.tier,
            hwid: policy.hwid,
          };
          mainWindow?.webContents.send('update-status', payload);
          mainWindow?.webContents.send('update-gated', payload);
          return payload;
        }
      }

      if (!app.isPackaged) {
        return {
          status: 'dev',
          message: 'Auto-update running in development mode',
          policy,
        };
      }

      const res = await autoUpdater.checkForUpdates();
      if (res?.updateInfo) {
        const eligibility = calculateVersionEligibility(
          policy.baselineVersion,
          policy.tier,
          res.updateInfo.version
        );

        if (!eligibility.allowed) {
          updateAvailable = false;
          latestUpdateInfo = null;
          const payload = {
            status: 'gated',
            updateAvailable: true,
            isGated: true,
            requiredTier: eligibility.requiredTier,
            message: eligibility.message,
            targetVersion: res.updateInfo.version,
            baselineVersion: policy.baselineVersion,
            currentVersion: policy.currentVersion,
            maxAllowedVersion: eligibility.maxAllowedVersion,
            tier: policy.tier,
            hwid: policy.hwid,
          };
          mainWindow?.webContents.send('update-status', payload);
          mainWindow?.webContents.send('update-gated', payload);
          return payload;
        }

        latestUpdateInfo = res.updateInfo;
        updateAvailable = true;
        return {
          status: 'available',
          updateAvailable: true,
          isGated: false,
          version: res.updateInfo.version,
          policy,
        };
      }

      return { status: 'checking', policy };
    } catch (err: any) {
      return {
        status: 'error',
        message: err.message,
      };
    }
  };

  ipcMain.handle('check-for-updates', async (_, targetVersion?: string) => {
    return executeUpdateCheck(targetVersion);
  });

  ipcMain.handle('updater:check-for-updates', async (_, targetVersion?: string) => {
    return executeUpdateCheck(targetVersion);
  });

  ipcMain.handle('updater:get-version-policy', () => {
    return getVersionPolicy();
  });

  ipcMain.handle('download-update', async () => {
    if (!latestUpdateInfo) {
      await executeUpdateCheck();
    }
    if (!latestUpdateInfo) {
      startupLog('[Update] No update info found to download');
      return { error: 'No update available' };
    }
    const policy = getVersionPolicy();
    const eligibility = calculateVersionEligibility(
      policy.baselineVersion,
      policy.tier,
      latestUpdateInfo.version
    );
    if (!eligibility.allowed) {
      startupLog(`[Update] Prevented download: target v${latestUpdateInfo.version} is gated.`);
      return {
        blocked: true,
        isGated: true,
        requiredTier: eligibility.requiredTier,
        message: eligibility.message,
      };
    }
    try {
      startupLog(`[Update] Starting differential update download for v${latestUpdateInfo.version}`);
      if (app.isPackaged) {
        // Use electron-updater native DifferentialDownloader (downloads only 2–5 MB delta ranges)
        autoUpdater.downloadUpdate().catch((diffErr: any) => {
          startupLog(`[Update] Differential update error (${diffErr?.message || diffErr}), falling back to direct stream...`);
          if (mainWindow && !mainWindow.isDestroyed()) {
            downloadUpdateResumable(mainWindow).catch((err: any) => {
              startupLog(`[Update] Resumable download exception: ${err?.message || err}`);
            });
          }
        });
      } else {
        if (mainWindow && !mainWindow.isDestroyed()) {
          downloadUpdateResumable(mainWindow).catch(() => {});
        }
      }
      return { success: true, status: 'downloading' };
    } catch (err: any) {
      startupLog(`[Update] Download initiation failed: ${err.message}`);
      return { error: err.message };
    }
  });

  ipcMain.handle('install-update', () => {
    if (!updateDownloaded) return;

    isQuittingForUpdate = true;
    startupLog('[Update] User initiated restart & install. Displaying update transition splash...');

    // 1. Immediately show branded update splash window so the user sees progress and knows it is updating
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.hide();
      }
      createSplashWindow('Applying Noxis Hub Update... Reopening In Seconds');
    } catch {}

    // 2. Terminate background auxiliary processes cleanly
    try {
      if (nextServer) { (nextServer as any).kill(); nextServer = null; }
      if (visionProcess) { (visionProcess as any).kill(); visionProcess = null; }
      if (tunnelProcess) { (tunnelProcess as any).kill(); tunnelProcess = null; }
      stopMediamtx();
    } catch {}

    // 3. Mark exit flag as clean so power-cut recovery does not false-trigger
    checkpointMonotonicElapsed();
    setExitFlag('clean');

    // 4. Resolve the installer executable path across all possible locations
    let installerToRun: string | null = downloadedInstallerPath;
    if (!installerToRun || !fs.existsSync(installerToRun)) {
      const helperFile = (autoUpdater as any).installerPath || (autoUpdater as any).downloadedUpdateHelper?.file;
      if (helperFile && fs.existsSync(helperFile)) {
        installerToRun = helperFile;
      }
    }
    if (!installerToRun || !fs.existsSync(installerToRun)) {
      const localAppData = process.env.LOCALAPPDATA || '';
      const pendingDir = path.join(localAppData, 'noxis-hub-updater', 'pending');
      const installerExe = path.join(localAppData, 'noxis-hub-updater', 'installer.exe');
      if (fs.existsSync(pendingDir)) {
        try {
          const files = fs.readdirSync(pendingDir).filter(f => f.toLowerCase().endsWith('.exe'));
          if (files.length > 0) {
            installerToRun = path.join(pendingDir, files[0]);
          }
        } catch {}
      }
      if (!installerToRun && fs.existsSync(installerExe)) {
        installerToRun = installerExe;
      }
    }

    startupLog(`[Update] Target installer path to execute: ${installerToRun}`);

    if (installerToRun && fs.existsSync(installerToRun)) {
      try {
        const appExe = process.execPath;
        // In Windows, run detached PowerShell watcher:
        // Waits 1.2s, forces termination of any running Noxis Hub instance to release all file locks,
        // runs installer silently with /S and --updated, waits for install completion, and relaunches Noxis Hub.exe
        const cmd = `Start-Sleep -Milliseconds 1200; Get-Process -Name 'Noxis Hub' -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Process -FilePath "${installerToRun}" -ArgumentList "/S", "--updated" -Wait; Start-Process -FilePath "${appExe}"`;
        const watcher = spawn('powershell.exe', ['-NoProfile', '-WindowStyle', 'Hidden', '-Command', cmd], {
          detached: true,
          stdio: 'ignore'
        });
        watcher.unref();

        startupLog('[Update] Spawned seamless upgrade watcher script. Exiting app in 500ms to release file locks...');
        setTimeout(() => {
          app.exit(0);
        }, 500);
        return { success: true };
      } catch (runErr: any) {
        startupLog(`[Update] Direct spawn error: ${runErr.message}, falling back to autoUpdater.quitAndInstall`);
      }
    }

    // 5. Fallback: autoUpdater standard quitAndInstall with silent install & forced relaunch
    setTimeout(() => {
      try {
        autoUpdater.quitAndInstall(
          true, // isSilent: true (silent background execution without interactive dialog locks)
          true  // force relaunch after install completes
        );
      } catch (quitErr: any) {
        startupLog(`[Update] quitAndInstall error: ${quitErr.message}`);
        app.exit(0);
      }
    }, 600);
    return { success: true };
  });

  ipcMain.handle('get-update-status', () => {
    const policy = getVersionPolicy();
    return {
      updateAvailable,
      updateDownloaded,
      downloadProgress,
      isDownloading: isCustomDownloading,
      transferred: customTransferred,
      total: customTotal,
      version: latestUpdateInfo?.version,
      releaseName: latestUpdateInfo?.releaseName,
      releaseNotes: latestUpdateInfo?.releaseNotes,
      releaseDate: latestUpdateInfo?.releaseDate,
      currentVersion: app.isPackaged ? app.getVersion() : '14.0.17',
      baselineVersion: policy.baselineVersion,
      tier: policy.tier,
      maxAllowedMajor: policy.maxAllowedMajor,
      maxAllowedVersion: policy.maxAllowedVersion,
      allowedWindow: policy.allowedWindow,
      hwid: policy.hwid,
    };
  });
  ipcMain.handle('get-bridge-status', () => lastBridgeStatus);
  ipcMain.handle('get-tunnel-url', () => ({
    url: tunnelUrl,
    ready: !!tunnelUrl,
  }));

  // ── MESSAGING HANDLERS ──
  ipcMain.handle('messaging:send', async (_, {
    businessId, text, recipientType,
    recipientDeviceId, recipientRole,
    priority,
  }) => {
    const msgId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    const createdAtStr = new Date().toISOString();
    const newMsg = {
      id: msgId,
      business_id: businessId || 'local',
      sender_type: 'hub',
      sender_name: 'PC Hub',
      recipient_type: recipientType || 'all',
      recipient_device_id: recipientDeviceId || null,
      recipient_role: recipientRole || null,
      message_text: text,
      message_type: 'text',
      priority: priority || 'normal',
      is_read: 0,
      created_at: createdAtStr,
    };

    // Save to local SQLite
    try {
      const { db } = require('../src/lib/db/client');
      const sqlite = db?.$client;
      if (sqlite) {
        sqlite.prepare(`
          INSERT OR REPLACE INTO hub_messages (id, business_id, sender_type, sender_device_id, sender_name, recipient_type, recipient_device_id, recipient_role, message_text, message_type, priority, is_read, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          newMsg.id, newMsg.business_id, newMsg.sender_type, null,
          newMsg.sender_name, newMsg.recipient_type, newMsg.recipient_device_id,
          newMsg.recipient_role, newMsg.message_text, newMsg.message_type,
          newMsg.priority, newMsg.is_read, newMsg.created_at
        );
      }
    } catch (err: any) {
      startupLog(`[Messaging] Local SQLite Insert Warning: ${err.message}`);
    }

    // Try Supabase admin if available
    try {
      const { createAdminClient } = require('../src/lib/supabase/admin');
      const admin = createAdminClient();
      if (admin) {
        await admin.from('hub_messages').insert(newMsg);
      }
    } catch {}

    const messagePayload = {
      id: newMsg.id,
      text,
      senderName: 'PC Hub',
      priority: priority || 'normal',
      createdAt: createdAtStr,
    };

    // Post to nextServer process where mobile WebSocket bridge is running
    if (nextServer && typeof (nextServer as any).postMessage === 'function') {
      try {
        (nextServer as any).postMessage({
          type: 'bridge-command',
          command: 'DELIVER_MESSAGE',
          payload: { recipientType, recipientDeviceId, messagePayload },
        });
      } catch (err: any) {
        startupLog(`[Messaging] postMessage to nextServer error: ${err.message}`);
      }
    }

    // Also attempt inline delivery if clients are in same process
    try {
      if (recipientType === 'all') {
        broadcastToAllDevices(messagePayload);
      } else if (recipientDeviceId) {
        deliverMessageToDevice(recipientDeviceId, messagePayload);
      }
    } catch {}

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('messaging:new-message', newMsg);
    }

    return { success: true, message: newMsg };
  });

  ipcMain.handle('messaging:getHistory', async (_, { businessId, limit = 50 }) => {
    // 1. Try local SQLite
    try {
      const { db } = require('../src/lib/db/client');
      const sqlite = db?.$client;
      if (sqlite) {
        const rows = sqlite.prepare(`
          SELECT * FROM hub_messages 
          WHERE business_id = ? OR ? = 'local' OR ? = '' OR business_id IS NULL
          ORDER BY created_at DESC 
          LIMIT ?
        `).all(businessId || 'local', businessId || 'local', businessId || 'local', limit);
        if (rows && rows.length > 0) return rows;
      }
    } catch (err: any) {
      startupLog(`[Messaging] Local getHistory error: ${err.message}`);
    }

    // 2. Fallback to Supabase admin
    try {
      const { createAdminClient } = require('../src/lib/supabase/admin');
      const admin = createAdminClient();
      if (!admin) return [];
      const { data } = await admin
        .from('hub_messages')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(limit);
      return data || [];
    } catch {
      return [];
    }
  });

  ipcMain.handle('messaging:renameDevice', async (_, { deviceId, newLabel, deviceRole }) => {
    try {
      const sqlite = (global as any).__noxisDb;
      if (sqlite) {
        sqlite.prepare(`
          UPDATE authorized_devices 
          SET device_label = ?, label = ?, device_role = ?
          WHERE device_id = ? OR node_id = ?
        `).run(newLabel, newLabel, deviceRole || 'general', deviceId, deviceId);
      }
    } catch (e: any) {
      startupLog(`[Messaging] Local renameDevice warning: ${e.message}`);
    }

    try {
      const { createAdminClient } = require('../src/lib/supabase/admin');
      const admin = createAdminClient();
      if (!admin) return { success: true };
      const { data } = await admin
        .from('authorized_devices')
        .update({
          device_label: newLabel,
          device_role: deviceRole,
        })
        .eq('device_id', deviceId)
        .select()
        .single();
      return data || { success: true };
    } catch {
      return { success: true };
    }
  });

  ipcMain.handle('sync-tier', (_, data: { tier: string, expiresAt: string | null }) => {
    // Legacy renderer call — now validated against tierEngine, not trusted blindly
    startupLog(`[Tier] Sync request: ${data.tier}`);
    const tierInfo = getActiveTierInfo();
    if (tierInfo.name === 'free_forever') {
      isReadOnly = false; // free forever still works — just capped
      mainWindow?.webContents.send('license-expired');
      if (visionProcess) { killProcess(visionProcess, 'Vision Engine'); visionProcess = null; }
    } else {
      isReadOnly = false;
    }
    return { success: true, isReadOnly, tier: tierInfo.name };
  });

  // ─────────────────────────────────────────────
  // LICENSE & TRIAL IPC HANDLERS
  // ─────────────────────────────────────────────

  // Returns current tier info + HWID + trial state + plan intelligence for the Settings page & provider
  ipcMain.handle('license:getInfo', () => {
    const tierInfo = getActiveTierInfo();
    const trialState = getTrialState();
    const license = getActiveLicensePayload();
    const rawLicense = getRawLicensePayload();
    const hasPaidLicense = Boolean(license);
    const wasPaidLicense = Boolean(rawLicense);
    const isExpired = Boolean(rawLicense && isLicenseExpired(rawLicense));
    const activeTier = license?.tier || (trialState.status === 'expired' || isExpired ? 'free_forever' : 'trial');
    
    // Self-detect billing cycle and timespan
    let billingCycle: 'monthly' | 'yearly' | 'lifetime' | 'trial' = 'trial';
    let totalTimespanDays = 0;
    if (rawLicense) {
      if (!rawLicense.expiresAt || rawLicense.expiresAt === 0) {
        billingCycle = 'lifetime';
      } else {
        const durationMs = rawLicense.expiresAt - (rawLicense.issuedAt || (rawLicense.expiresAt - 30 * 86400000));
        totalTimespanDays = Math.max(1, Math.round(durationMs / 86400000));
        billingCycle = totalTimespanDays > 100 ? 'yearly' : 'monthly';
      }
    }

    let skuCount = 0;
    let partyCount = 0;
    let karigarCount = 0;
    try {
      const { db } = require('../src/lib/db/client');
      const sqlite = db?.$client || (global as any).__noxisDb;
      if (sqlite) {
        try {
          const sRow = sqlite.prepare('SELECT COUNT(*) as cnt FROM skus WHERE is_active = 1').get();
          skuCount = sRow?.cnt ?? 0;
        } catch {
          try {
            const sRow = sqlite.prepare('SELECT COUNT(*) as cnt FROM skus').get();
            skuCount = sRow?.cnt ?? 0;
          } catch {}
        }
        try {
          const pRow = sqlite.prepare('SELECT COUNT(*) as cnt FROM parties WHERE is_active = 1').get();
          partyCount = pRow?.cnt ?? 0;
        } catch {
          try {
            const pRow = sqlite.prepare('SELECT COUNT(*) as cnt FROM parties').get();
            partyCount = pRow?.cnt ?? 0;
          } catch {}
        }
        try {
          const kRow = sqlite.prepare("SELECT COUNT(*) as cnt FROM karigars WHERE status = 'active'").get();
          karigarCount = kRow?.cnt ?? 0;
        } catch {
          try {
            const kRow = sqlite.prepare('SELECT COUNT(*) as cnt FROM karigars').get();
            karigarCount = kRow?.cnt ?? 0;
          } catch {}
        }
      }
    } catch (e: any) {
      startupLog(`[License IPC] DB count query warning: ${e.message}`);
    }

    return {
      tier: activeTier,
      rawTier: rawLicense?.tier || null,
      caps: tierInfo.caps,
      features: tierInfo.features,
      maxDevices: tierInfo.maxDevices,
      maxBranches: tierInfo.maxBranches,
      maxCameras: tierInfo.maxCameras,
      trialStatus: hasPaidLicense ? null : trialState.status,
      trialDaysLeft: hasPaidLicense ? 0 : trialState.daysLeft,
      graceDaysLeft: hasPaidLicense ? 0 : trialState.graceDaysLeft,
      hwid: generateHWID(),
      licenseActive: hasPaidLicense,
      isPermanent: hasPaidLicense && (!license?.expiresAt || license.expiresAt === 0),
      isExpired,
      isDeactivated: isExpired,
      billingCycle,
      totalTimespanDays,
      businessId: rawLicense?.businessId || '00000000-0000-0000-0000-000000000000',
      issuedAt: rawLicense?.issuedAt || 0,
      expiresAt: rawLicense?.expiresAt || 0,
      skuCount,
      partyCount,
      karigarCount,
    };
  });

  // Activates a license key string or payload object. Validates and persists instantly.
  ipcMain.handle('license:activate', (_, keyOrPayload: any) => {
    let keyString = typeof keyOrPayload === 'string' ? keyOrPayload : keyOrPayload?.key || '';
    let explicitTier = typeof keyOrPayload === 'object' ? keyOrPayload?.tier : null;
    let explicitExpires = typeof keyOrPayload === 'object' ? keyOrPayload?.expiresAt : null;
    let verifiedByServer = typeof keyOrPayload === 'object' ? Boolean(keyOrPayload?.verifiedByServer) : false;

    // 1. If key string is provided, always verify cryptographically first
    if (keyString) {
      const result = verifyLicense(keyString);
      if (result.valid) {
        persistLicense(result.payload);
        startupLog(`[License] Activated: ${result.payload.tier} tier for ${result.payload.businessId}`);
        return { success: true, tier: result.payload.tier };
      }
      // If key looks like an offline NOXIS key or was passed as keyString, reject failure immediately
      if (typeof keyOrPayload === 'string' || keyString.toUpperCase().startsWith('NOXIS-')) {
        startupLog(`[License] Activation failed: ${result.error}`);
        return { success: false, error: result.error };
      }
    }

    // 2. Only allow explicit tier payload if verified by official Supabase server
    if (verifiedByServer && explicitTier && ['lite', 'pro', 'elite'].includes(String(explicitTier).toLowerCase())) {
      const tier = String(explicitTier).toLowerCase() as any;
      const payload = {
        version: 2 as const,
        tier,
        hwid: getCachedHWIDOrGenerate(),
        businessId: '00000000-0000-0000-0000-000000000000',
        issuedAt: Date.now(),
        expiresAt: explicitExpires ? Number(explicitExpires) : 0,
        maxDevices: tier === 'elite' ? 50 : tier === 'pro' ? 15 : 5,
        maxBranches: tier === 'elite' ? 99 : tier === 'pro' ? 5 : 1,
        maxCameras: tier === 'elite' ? 6 : tier === 'pro' ? 4 : 0,
        features: [] as string[],
        signature: 'VALIDATED_VIA_CLIENT_PORTAL',
      };
      persistLicense(payload);
      startupLog(`[License] Activated via verified server payload: ${tier} tier`);
      return { success: true, tier };
    }

    startupLog(`[License] Activation failed: INVALID_KEY`);
    return { success: false, error: 'Invalid license key or cryptographic signature.' };
  });

  // Returns the current HWID for display in Settings (user copies this to send for key generation)
  ipcMain.handle('license:getHWID', () => {
    return getInstallationHWID() || getCachedHWIDOrGenerate();
  });

  // Returns full trial state
  ipcMain.handle('trial:getState', () => {
    return getTrialState();
  });

  // Notifies admin server when a plan ends & software deactivates
  ipcMain.handle('license:notifyExpiry', async (_, payload: any) => {
    try {
      startupLog(`[License IPC] Manual plan expiry notification requested: ${JSON.stringify(payload)}`);
      return { success: true, notifiedAt: Date.now() };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  // ── Plan Expiry Watchdog ───────────────────────────────────────────────────
  // Periodically checks if the user's monthly or yearly timespan has completed.
  // If completed, automatically deactivates paid features, drops to Free tier,
  // notifies the renderer to prompt upgrade, and alerts the admin.
  let planExpiredEventDispatched = false;
  setInterval(async () => {
    try {
      const rawLicense = getRawLicensePayload();
      if (!rawLicense || !rawLicense.expiresAt || rawLicense.expiresAt === 0) return;

      const isExpired = Date.now() > rawLicense.expiresAt;
      if (isExpired && !planExpiredEventDispatched) {
        planExpiredEventDispatched = true;
        const durationMs = rawLicense.expiresAt - (rawLicense.issuedAt || (rawLicense.expiresAt - 30 * 86400000));
        const totalTimespanDays = Math.max(1, Math.round(durationMs / 86400000));
        const billingCycle = totalTimespanDays > 100 ? 'yearly' : 'monthly';

        startupLog(`[License Watcher] ⚠️ User plan timespan completed: ${rawLicense.businessId} (${rawLicense.tier} · ${billingCycle} · ${totalTimespanDays}d). Deactivating software to Free mode.`);

        // 1. Broadcast deactivation event to renderer window
        mainWindow?.webContents.send('license-expired');
        mainWindow?.webContents.send('license:plan-ended', {
          tier: rawLicense.tier,
          billingCycle,
          totalTimespanDays,
          businessId: rawLicense.businessId,
          issuedAt: rawLicense.issuedAt,
          expiresAt: rawLicense.expiresAt,
        });

        // 2. Shut down premium background engines (e.g. CCTV AI Sentinel)
        if (visionProcess) {
          killProcess(visionProcess, 'Vision Engine (Plan Deactivated)');
          visionProcess = null;
        }
      } else if (!isExpired && planExpiredEventDispatched) {
        // License renewed
        planExpiredEventDispatched = false;
      }
    } catch (err: any) {
      startupLog(`[License Watcher] Watcher check warning: ${err.message}`);
    }
  }, 20 * 1000); // Check every 20 seconds


  // ─────────────────────────────────────────────
  // WEBSOCKET BRIDGE SERVER (Mobile RBAC)
  // Runs inline in main process for direct SQLite
  // and license engine access.
  // ─────────────────────────────────────────────
  function startWsBridgeServer(): void {
    let WebSocketServer: any;
    try {
      // ws may be available in node_modules of standalone build
      const wsModule = require('ws');
      WebSocketServer = wsModule.Server || wsModule.WebSocketServer;
    } catch {
      startupLog('[Bridge] ws module not available — bridge server skipped');
      return;
    }

    let WS_PORT = 7447;
    let wss: any;
    let bridgeHttpServer: any;
    try {
      const http = require('http');
      bridgeHttpServer = http.createServer((req: any, res: any) => {
        const hostHeader = req.headers.host || '127.0.0.1';
        const hostIp = hostHeader.split(':')[0];
        const reqPath = req.url || '/workstation';
        const targetUrl = `http://${hostIp}:${PORT}${reqPath}`;
        res.writeHead(302, {
          Location: targetUrl,
          'Content-Type': 'text/html; charset=utf-8'
        });
        res.end(`<html><head><meta http-equiv="refresh" content="0;url=${targetUrl}"></head><body>Redirecting to Noxis Workstation Node at <a href="${targetUrl}">${targetUrl}</a>...</body></html>`);
      });

      wss = new WebSocketServer({ server: bridgeHttpServer });
      bridgeHttpServer.listen(WS_PORT, '0.0.0.0');
    } catch (e: any) {
      try {
        wss = new WebSocketServer({ port: WS_PORT });
      } catch {
        WS_PORT = 9001;
        wss = new WebSocketServer({ port: WS_PORT });
      }
    }
    const connectedClients = new Map<any, { deviceId: string; role: MobileRole; pairedAt: number }>();

    startupLog(`[Bridge] WebSocket bridge server listening on port ${WS_PORT} with HTTP 302 redirect fallback to port ${PORT}`);

    wss.on('connection', (ws: any) => {
      ws.on('message', async (raw: Buffer) => {
        let msg: any;
        try {
          msg = JSON.parse(raw.toString());
        } catch {
          ws.send(JSON.stringify({ type: 'ERROR', error: 'INVALID_JSON' }));
          return;
        }

        // ── PAIR_REQUEST ──
        if (msg.type === 'PAIR_REQUEST') {
          const { deviceId, businessId: reqBusinessId } = msg;

          // Check tier allows mobile pairing
          // Mobile pairing enabled for local LAN device
          startupLog('[Bridge] Mobile pairing request accepted for: ' + deviceId);

          // Check device limit
          const currentConnected = connectedClients.size;
          if (!isWithinDeviceLimit(currentConnected)) {
            ws.send(JSON.stringify({ type: 'PAIR_REJECTED', reason: 'DEVICE_LIMIT_REACHED' }));
            startupLog(`[Bridge] Device limit reached — rejected ${deviceId}`);
            return;
          }

          // Look up role from SQLite business_users table
          let roleStr = 'cashier';
          try {
            const db = (global as any).__noxisDb;
            if (db) {
              const row = db.prepare(
                `SELECT role FROM business_users WHERE device_id = ? LIMIT 1`
              ).get(deviceId);
              if (row?.role) roleStr = row.role;
            }
          } catch (e: any) {
            startupLog(`[Bridge] Role lookup failed: ${e.message}`);
          }

          const role = normalizeRole(roleStr);
          const tierInfo = getActiveTierInfo();

          connectedClients.set(ws, { deviceId, role, pairedAt: Date.now() });

          const ack = buildHubAck(role, tierInfo.name, tierInfo.maxDevices);
          ws.send(JSON.stringify(ack));
          startupLog(`[Bridge] Paired: ${deviceId} as ${role}`);

          // Notify renderer of updated device count
          const pairedList = Array.from(connectedClients.values()).map(c => ({
            deviceId: c.deviceId,
            role: c.role,
          }));
          lastBridgeStatus = {
            connected: connectedClients.size,
            paired: connectedClients.size,
            pairedDevices: pairedList,
          };
          mainWindow?.webContents.send('bridge-event', {
            event: 'DEVICE_COUNT_CHANGED',
            data: lastBridgeStatus,
          });
          return;
        }

        // ── KHATA_ENTRY ──
        if (msg.type === 'KHATA_ENTRY') {
          const client = connectedClients.get(ws);
          if (!client) {
            ws.send(JSON.stringify({ type: 'ERROR', error: 'NOT_PAIRED' }));
            return;
          }

          if (!canWriteKhata(client.role)) {
            ws.send(JSON.stringify({ type: 'ERROR', error: 'KHATA_WRITE_DENIED' }));
            startupLog(`[Bridge] Khata write denied for role ${client.role}`);
            return;
          }

          const { partyId, debit, credit, amount, entryDate, businessId: entryBusinessId, note } = msg;

          try {
            const db = (global as any).__noxisDb;
            if (!db) throw new Error('DB not initialised');

            const stmt = db.prepare(`
              INSERT INTO ledger_entries
                (business_id, party_id, debit, credit, amount, entry_date, note, created_by, created_by_role, created_at)
              VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
              entryBusinessId,
              partyId,
              debit ? 1 : 0,
              credit ? 1 : 0,
              amount,
              entryDate || new Date().toISOString().split('T')[0],
              note || '',
              client.deviceId,
              client.role,
              new Date().toISOString()
            );

            // Calculate new balance for this party
            const balRow = db.prepare(`
              SELECT
                COALESCE(SUM(CASE WHEN debit=1 THEN amount ELSE 0 END),0) -
                COALESCE(SUM(CASE WHEN credit=1 THEN amount ELSE 0 END),0) AS balance
              FROM ledger_entries
              WHERE party_id = ?
            `).get(partyId) as { balance: number } | undefined;

            const newBalance = balRow?.balance ?? 0;

            // Notify renderer
            mainWindow?.webContents.send('ipc:khata-updated', { partyId, newBalance });

            ws.send(JSON.stringify({ type: 'KHATA_ACK', partyId, newBalance }));
            startupLog(`[Bridge] Khata entry written by ${client.deviceId}: ${amount}`);

            // TODO: enqueue for Supabase cloud sync worker
            // cloudSyncQueue.enqueue({ table: 'ledger_entries', ... })

          } catch (e: any) {
            startupLog(`[Bridge] Khata write error: ${e.message}`);
            ws.send(JSON.stringify({ type: 'ERROR', error: 'KHATA_WRITE_FAILED', detail: e.message }));
          }
          return;
        }

        // Unknown message type
        ws.send(JSON.stringify({ type: 'ERROR', error: 'UNKNOWN_MESSAGE_TYPE' }));
      });

      ws.on('close', () => {
        const client = connectedClients.get(ws);
        if (client) {
          startupLog(`[Bridge] Device disconnected: ${client.deviceId}`);
          connectedClients.delete(ws);
          const pairedList = Array.from(connectedClients.values()).map(c => ({
            deviceId: c.deviceId,
            role: c.role,
          }));
          lastBridgeStatus = {
            connected: connectedClients.size,
            paired: connectedClients.size,
            pairedDevices: pairedList,
          };
          mainWindow?.webContents.send('bridge-event', {
            event: 'DEVICE_COUNT_CHANGED',
            data: lastBridgeStatus,
          });
        }
      });

      ws.on('error', (err: Error) => {
        startupLog(`[Bridge] WS error: ${err.message}`);
      });
    });

    wss.on('error', (err: Error) => {
      startupLog(`[Bridge] Server error: ${err.message}`);
    });
  }

  // ─────────────────────────────────────────────
  // FILE MORPH IPC
  // ─────────────────────────────────────────────
  ipcMain.handle('compress-images', async (_, files: { data: string, quality?: number, name: string }[]) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const sharp = require('sharp');
      const results: any[] = [];
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
      const results: any[] = [];
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

  // ── AUTH PERSISTENCE ──
  ipcMain.handle('store:saveSession', (_, session) => {
    saveSession(session)
    return { ok: true }
  })

  ipcMain.handle('store:getSession', () => {
    return getSession()
  })

  ipcMain.handle('store:clearSession', () => {
    clearSession()
    return { ok: true }
  })

  // ── APP LOCK ──
  ipcMain.handle('store:savePinHash', (_, pinHash: string) => {
    savePinHash(pinHash)
    setAppLockEnabled(true)
    return { ok: true }
  })

  ipcMain.handle('store:getPinHash', () => {
    return getPinHash()
  })

  ipcMain.handle('store:disableAppLock', () => {
    savePinHash('')
    setAppLockEnabled(false)
    return { ok: true }
  })

  ipcMain.handle('store:isAppLockEnabled', () => isAppLockEnabled())

  ipcMain.handle('store:setAppLockEnabled', (_, enabled: boolean) => {
    setAppLockEnabled(enabled)
    return { ok: true }
  })

  ipcMain.handle('store:getLockTimeout', () => getLockTimeout())

  ipcMain.handle('store:setLockTimeout', (_, minutes: number) => {
    setLockTimeout(minutes)
    return { ok: true }
  })

  ipcMain.handle('store:isLocked', () => isLocked())

  ipcMain.handle('store:setLocked', (_, locked: boolean) => {
    setLocked(locked)
    return { ok: true }
  })

  ipcMain.handle('store:getLockState', () => getLockState())

  ipcMain.handle('store:recordFailedAttempt', () => recordFailedAttempt())

  ipcMain.handle('store:clearLockAttempts', () => {
    clearLockAttempts()
    return { ok: true }
  })

  // ── SESSION RESUME ──
  ipcMain.handle('store:saveLastRoute', (_, route: string) => {
    saveLastRoute(route)
    return { ok: true }
  })

  ipcMain.handle('store:getLastRoute', () => getLastRoute())

  ipcMain.handle('store:saveLastActive', () => {
    saveLastActive()
    return { ok: true }
  })

  ipcMain.handle('store:getLastActive', () => getLastActive())

  ipcMain.handle('store:saveFormDraft', (_, key: string, data: any) => {
    saveFormDraft(key, data)
    return { ok: true }
  })

  ipcMain.handle('store:getFormDraft', (_, key: string) => getFormDraft(key))
  ipcMain.handle('store:getDraft', (_, key: string) => getFormDraft(key))
  ipcMain.handle('store:getAllFormDrafts', () => getAllFormDrafts())

  ipcMain.handle('store:clearFormDraft', (_, key: string) => {
    clearFormDraft(key)
    return { ok: true }
  })

  ipcMain.handle('store:saveScrollPosition', (_, route: string, pos: number) => {
    saveScrollPosition(route, pos)
    return { ok: true }
  })

  ipcMain.handle('store:getScrollPosition', (_, route: string) => getScrollPosition(route))

  ipcMain.handle('autostart:get', () => {
    return getAutoStartStatus()
  })

  ipcMain.handle('autostart:set', (_, enabled: boolean) => {
    try {
      setAutoStartEnabled(enabled)
      applyAutoStart(enabled)
      return { ok: true, ...getAutoStartStatus() }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('system:getKeepAwake', () => {
    const enabled = getKeepAwakeEnabled()
    const active = powerBlockerId !== null && powerSaveBlocker.isStarted(powerBlockerId)
    return { enabled, active }
  })

  ipcMain.handle('system:setKeepAwake', (_, enabled: boolean) => {
    try {
      setKeepAwakeEnabled(enabled)
      applyKeepAwake(enabled)
      const active = powerBlockerId !== null && powerSaveBlocker.isStarted(powerBlockerId)
      return { ok: true, enabled, active }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('system:getHardwareInfo', () => {
    try {
      const cpus = os.cpus() || []
      const totalMem = os.totalmem()
      const freeMem = os.freemem()
      const usedMem = totalMem - freeMem
      const heapUsed = process.memoryUsage().heapUsed

      return {
        platform: process.platform,
        osType: os.type(),
        osRelease: os.release(),
        arch: os.arch(),
        hostname: os.hostname(),
        cpuModel: cpus[0]?.model || 'Generic Processor',
        cpuCores: cpus.length,
        cpuSpeedMHz: cpus[0]?.speed || 0,
        totalMemoryGB: (totalMem / (1024 ** 3)).toFixed(2),
        freeMemoryGB: (freeMem / (1024 ** 3)).toFixed(2),
        usedMemoryGB: (usedMem / (1024 ** 3)).toFixed(2),
        processMemoryMB: (heapUsed / (1024 ** 2)).toFixed(1),
        uptimeHours: (os.uptime() / 3600).toFixed(1),
        hwid: getCachedHWIDOrGenerate(),
        isPackaged: app.isPackaged,
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
        chromeVersion: process.versions.chrome,
      }
    } catch (err: any) {
      return {
        platform: process.platform,
        error: err.message,
      }
    }
  })

  ipcMain.handle('sync:getLastSyncAt', () => {
    return getLastSyncAt()
  })

  ipcMain.handle('sync:setLastSyncAt', (_, ts: number) => {
    setLastSyncAt(ts)
    return { ok: true }
  })

  ipcMain.handle('app:wasAutoStarted', () => {
    return process.argv.includes('--autostart')
  })

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
        sandbox: false,
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        preload: path.join(__dirname, 'preload.js'),
        partition: 'persist:noxis',
        scrollBounce: false,
        spellcheck: false,
        devTools: true,
        backgroundThrottling: false,
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
          mainWindow?.loadURL(`http://127.0.0.1:${PORT}/dashboard`)
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
      const wasAutoStarted = process.argv.includes('--autostart')
      if (wasAutoStarted) {
        mainWindow?.webContents.send('app:autostarted', { timestamp: Date.now() })
      }
    });

    // ── Input & Display Scale Safeguards (Prevents Accidental Micro-Zoom) ──
    mainWindow.webContents.setVisualZoomLevelLimits(1, 2);

    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.control || input.meta) {
        // Ctrl + 0: Reset zoom to 100% immediately
        if (input.key === '0' || input.code === 'Digit0' || input.code === 'Numpad0') {
          event.preventDefault();
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.setZoomLevel(0);
            mainWindow.webContents.setZoomFactor(1.0);
            mainWindow.webContents.send('app:zoom-changed', 1.0);
            startupLog('[Display] Hotkey Ctrl+0 pressed: display zoom reset to 100%');
          }
        } else if (input.key === '-' || input.code === 'Minus' || input.code === 'NumpadSubtract') {
          const current = mainWindow?.webContents.getZoomFactor() || 1.0;
          if (current <= 0.8) {
            event.preventDefault(); // Safeguard: never zoom below 80% to prevent micro-screen glitch
          }
        }
      }
    });

    mainWindow.webContents.on('unresponsive', () => {
      startupLog('[FREEZE] Renderer unresponsive')

      // Capture memory state at freeze time
      const mem = process.memoryUsage()
      startupLog(
        `[FREEZE] Memory at freeze: ` +
        `heap ${Math.round(mem.heapUsed / 1024 / 1024)}MB`
      )

      // Log all active IPC channels
      startupLog('[FREEZE] Checking for hung IPC...')

      // Give it 15 seconds to recover
      const recoveryTimeout = setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          dialog.showMessageBox(mainWindow, {
            type: 'question',
            title: 'Noxis Hub is not responding',
            message:
              'Noxis Hub stopped responding. ' +
              'Wait for it to recover or restart?',
            buttons: ['Wait', 'Restart'],
            defaultId: 0,
          }).then(({ response }) => {
            if (response === 1) {
              app.relaunch()
              Promise.all([
                killProcess(visionProcess, 'Vision Engine'),
                killProcess(nextServer, 'Next.js Server'),
              ]).then(() => {
                app.exit(0)
              }).catch(() => {
                app.exit(0)
              })
            }
          })
        }
      }, 15000)

      // If it recovers, cancel the dialog
      if (mainWindow) {
        mainWindow.webContents.once('responsive', () => {
          clearTimeout(recoveryTimeout)
          startupLog('[FREEZE] Renderer recovered')
        })
      }
    });

    // THE KEY MOMENT:
    // ready-to-show fires when first paint is done.
    // At this point we fade splash and show main.
    mainWindow.once('ready-to-show', () => {
      startupLog('[Electron] ready-to-show → revealing main window');

      // Destroy splash with fade
      destroySplash();

      // Show main window maximized — works on all screen sizes
      // Show main window maximized immediately — zero lag
      mainWindow!.setOpacity(1);
      mainWindow!.maximize();
      mainWindow!.show();
      mainWindow!.focus();
    });

    mainWindow.on('maximize', () => safeSend(mainWindow, 'maximize-changed', true));
    mainWindow.on('unmaximize', () => safeSend(mainWindow, 'maximize-changed', false));
    mainWindow.on('close', () => {
      // Mark null early so timers don't attempt to send to destroyed window
      const win = mainWindow;
      mainWindow = null;
    });
    mainWindow.on('closed', () => { mainWindow = null; });

    const serverUrl = `http://127.0.0.1:${PORT}`;
    const lockOn = isAppLockEnabled() || isLocked();
    const storedRoute = getLastRoute();
    const targetPath = lockOn ? '/lock' : (storedRoute && storedRoute !== '/' && !storedRoute.startsWith('/login') && !storedRoute.startsWith('/lock') ? storedRoute : '/dashboard');
    const targetUrl = `http://127.0.0.1:${PORT}${targetPath}`;

    try {
      startupLog('[Electron] Waiting for Next.js server...');
      await waitForServer(serverUrl, 90000, 300);
      startupLog('[Electron] Server ready — loading software main window');

      await mainWindow.loadURL(targetUrl);

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
          `WhatsApp: +92 326 4742678`,
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

      // Auto-start check has been moved to after mainWindow creation

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

      // ── POWER-CUT EXIT RECOVERY ──────────────────────────────────────
      // Check if the previous session was terminated ungracefully
      const previousExitFlag = getExitFlag();
      wasPowerCut = previousExitFlag === 'running';
      if (wasPowerCut) {
        startupLog('[PowerCut] Ungraceful exit detected — will trigger recovery banner');
      }
      // Mark this session as running immediately
      setExitFlag('running');

      // ── HWID VERIFICATION ────────────────────────────────────────────
      const hwidResult = verifyHWID();
      if (!hwidResult.ok) {
        startupLog(`[HWID] Mismatch (count: ${hwidResult.mismatchCount})`);
        if (hwidResult.revoked) {
          startupLog('[HWID] 3 consecutive mismatches — revoking license');
          revokeLicense();
          mainWindow?.webContents.send('license-expired');
        }
      } else {
        startupLog(`[HWID] Verified ✓`);
      }

      // ── TRIAL ENGINE INIT (Non-blocking local first) ─────────────────
      const dbPath = path.join(app.getPath('userData'), 'NOXIS-local.db');
      initTrialEngine(dbPath);
      const trialState = getTrialState();
      startupLog(`[Trial] Status: ${trialState.status} | DaysLeft: ${trialState.daysLeft}`);

      // ── TRIAL HEARTBEAT (30s monotonic checkpoint) ───────────────────
      trialHeartbeatInterval = setInterval(() => {
        checkpointMonotonicElapsed();

      }, 30000);

      process.on('uncaughtException', (error) => {
        if (error && error.message && error.message.includes('Object has been destroyed')) {
          startupLog(`[Suppressed non-fatal destroyed window exception] ${error.message}`);
          return;
        }
        startupLog(
          `[CRITICAL] ${error.message}`
        )
        if (error.stack) startupLog(error.stack)
        try {
          dialog.showErrorBox(
            'Noxis Hub Crashed',
            `Unexpected error:\n\n${error.message}\n\n` +
            `Log: ${logPath}\n\n` +
            `WhatsApp: +92 326 4742678`
          )
        } catch { }

        // Clean up child processes before exiting on crash
        Promise.all([
          killProcess(visionProcess, 'Vision Engine'),
          killProcess(nextServer, 'Next.js Server'),
        ]).then(() => {
          app.exit(1)
        }).catch(() => {
          app.exit(1)
        })
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
      const resourcesPath = app.isPackaged ? process.resourcesPath : process.cwd();
      const serverPath = app.isPackaged
        ? (fs.existsSync(path.join(resourcesPath, 'standalone', 'server-with-bridge.js'))
          ? path.join(resourcesPath, 'standalone', 'server-with-bridge.js')
          : path.join(resourcesPath, 'standalone', 'server.js'))
        : (fs.existsSync(path.join(resourcesPath, '.next', 'standalone', 'server-with-bridge.js'))
          ? path.join(resourcesPath, '.next', 'standalone', 'server-with-bridge.js')
          : path.join(resourcesPath, '.next', 'standalone', 'server.js'));

      const sqlitePath = app.isPackaged
        ? path.join(resourcesPath, 'better-sqlite3-multiple-ciphers')
        : path.join(resourcesPath, 'node_modules', 'better-sqlite3-multiple-ciphers');

      startupLog(`[Electron] Server path: ${serverPath}`)
      startupLog(`[Electron] SQLite path: ${sqlitePath}`)
      startupLog(`[Electron] Resources: ${resourcesPath}`)

      if (!fs.existsSync(serverPath)) {
        startupLog('[FATAL] Neither server-with-bridge.js nor server.js found')
        destroySplash();
        const msg = app.isPackaged
          ? `Server not found at:\n${serverPath}\n\nPlease reinstall Noxis Hub.`
          : `Standalone server bundle not assembled yet.\n\nPlease run:\nnode scripts/build-electron.mjs\nor npm run electron:build`;
        dialog.showErrorBox(
          app.isPackaged ? 'Installation Error' : 'Development Build Required',
          msg
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

      // ── FIX B/C: Log spawn diagnostics before starting ──
      const normalizedServerPath = path.normalize(serverPath);
      startupLog(`[Electron] execPath: ${process.execPath}`);
      startupLog(`[Electron] serverPath (normalized): ${normalizedServerPath}`);
      startupLog(`[Electron] serverPath exists: ${fs.existsSync(normalizedServerPath)}`);
      startupLog(`[Electron] cwd for spawn: ${path.dirname(normalizedServerPath)}`);
      try {
        const serverContent = fs.readFileSync(normalizedServerPath, 'utf-8');
        startupLog(`[Electron] server.js size: ${serverContent.length} bytes`);
        startupLog(`[Electron] server.js first line: ${serverContent.split('\n')[0].slice(0, 120)}`);
      } catch (e: any) {
        startupLog(`[FATAL] Cannot read server file: ${e.message}`);
      }
      const standaloneDir = path.join(resourcesPath, 'standalone');
      const standaloneNodeModules = path.join(standaloneDir, 'node_modules');
      startupLog(`[Electron] NODE_PATH will be: ${[
        sqlitePath,
        standaloneNodeModules,
        standaloneDir,
      ].join(path.delimiter)}`);

      // ── FIX D: Dedicated stderr file written synchronously ──
      // If the process crashes before async handlers flush,
      // appendFileSync ensures we still capture the error.
      const stderrPath = path.join(ensureLogDirectory(), 'server-stderr.log');
      try { fs.writeFileSync(stderrPath, `--- ${new Date().toISOString()} ---\n`); } catch { }

      // Release the held port RIGHT BEFORE spawning —
      // this minimizes the gap to milliseconds instead
      // of however long createSplashWindow() and the
      // file-existence checks above took
      await releaseReservedPort();

      // ── Windows port-release race guard ──
      // On Windows, server.close() fires the callback before the
      // OS fully releases the ephemeral port binding. A 50ms pause
      // ensures the port is truly free when the child process tries
      // to bind it, preventing silent EADDRINUSE exits.
      await new Promise<void>(r => setTimeout(r, 50));

      nextServer = utilityProcess.fork(normalizedServerPath, [], {
        cwd: path.dirname(normalizedServerPath),
        env: {
          ...process.env,
          PORT: String(PORT),
          NODE_ENV: 'production',
          // 0.0.0.0 allows mobile phones on the same WiFi to connect.
          // Electron's BrowserWindow still uses http://127.0.0.1:PORT
          // (see waitForServer / loadURL below) — only the TCP listen binding changes.
          HOSTNAME: '0.0.0.0',
          ELECTRON_USER_DATA: userDataPath,
          ELECTRON_RESOURCES: resourcesPath,
          ELECTRON_ENV: 'true',
          NEXT_PUBLIC_PLATFORM: 'electron',
          IS_NOXIS_HUB_HOST: 'true',

          // CRITICAL: Tell Node where to find
          // the native sqlite binding
          NODE_PATH: [
            sqlitePath,
            path.join(resourcesPath, 'standalone', 'node_modules'),
            path.join(resourcesPath, 'standalone'),
            path.join(resourcesPath, 'app.asar.unpacked', 'node_modules'),
          ].join(path.delimiter),

          // Native module path override
          BETTER_SQLITE3_BINDING: sqliteBinding,

          // Supabase from env
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',

          // Electron DB key
          ELECTRON_DB_KEY: deriveDbKey(
            process.env.USER_ID || 'SYSTEM'
          ),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      // Log ALL server output — this shows the exact crash message
      let serverLog = ''
      nextServer.stdout?.on('data', (d: Buffer) => {
        const msg = d.toString().trim()
        startupLog(`[Next.js] ${msg}`)
        serverLog += msg + '\n'
      })
      nextServer.stderr?.on('data', (d: Buffer) => {
        const msg = d.toString()
        startupLog(`[Next.js ERR] ${msg.trim()}`)
        serverLog += '[ERR] ' + msg + '\n'
        // ── FIX D: Synchronous write so data is never lost on fast crash ──
        try { fs.appendFileSync(stderrPath, msg); } catch { }
      })

      nextServer.on('message', (msg: any) => {
        try {
          if (msg && msg.type === 'bridge-event') {
            safeSend(mainWindow, 'bridge-event', { event: msg.event, data: msg.data });
            if (msg.event === 'messaging:new-message') {
              safeSend(mainWindow, 'messaging:new-message', msg.data);
            }
            if (msg.event === 'DEVICE_COUNT_CHANGED') {
              lastBridgeStatus = {
                connected: Number(msg.data?.connected || 0),
                paired: Number(msg.data?.paired || 0),
                pairedDevices: Array.isArray(msg.data?.pairedDevices) ? msg.data.pairedDevices : [],
              };
            }
          }
        } catch (bridgeErr: any) {
          startupLog(`[Electron] Error handling bridge message: ${bridgeErr?.message || bridgeErr}`);
        }
      })

      nextServer.on('exit', (code: number) => {
        startupLog(`[Next.js] Exit: code=${code}`);
        // Read the stderr file on exit in case async handlers lost data
        try {
          const stderrContents = fs.readFileSync(stderrPath, 'utf-8');
          if (stderrContents && stderrContents.trim() !== `--- ${new Date().toISOString().slice(0, 10)}`) {
            startupLog(`[Next.js] Full stderr on exit:\n${stderrContents.slice(-2000)}`);
          }
        } catch { }
        startupLog(`[Next.js] Last buffered output:\n${serverLog.slice(-1000)}`)
        if (code !== 0) {
          destroySplash();
          dialog.showErrorBox(
            'Server Crashed',
            `Server exited with code ${code}.\n\nLast server output:\n${serverLog.slice(-500) || '(no output — see server-stderr.log in userData folder)'}`
          );
        }
        nextServer = null;
      })

      // ── STEP 3: Create main window (loads silently) ──
      // Splash stays visible while this loads.
      // ready-to-show event handles the transition.
      await createMainWindow();

      const autoStartOn = getAutoStartEnabled()
      if (autoStartOn) {
        applyAutoStart(true)
      }

      const keepAwakeOn = getKeepAwakeEnabled()
      if (keepAwakeOn) {
        applyKeepAwake(true)
      }

      const wasAutoStarted = process.argv.includes('--autostart')
      if (wasAutoStarted) {
        startupLog('[AutoStart] Launched via Windows startup')
      }

      // ── STEP 4: Setup non-blocking features ──
      // Run these AFTER window is shown, not before.
      // This prevents blocking the UI thread at startup.
      if (mainWindow) {
        const storedVersion = getLastSeenVersion()
        const currentVersion = app.getVersion()

        if (storedVersion !== currentVersion) {
          mainWindow.webContents?.on('did-finish-load', () => {
            safeSend(mainWindow, 'app:new-version', {
              previous: storedVersion,
              current: currentVersion,
            });
            setLastSeenVersion(currentVersion);
          });
        }

        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            setupAutoUpdater(mainWindow);
          }
        }, 5000);

        setTimeout(() => {
          if (app.isPackaged) {
            if (process.env.CLOUDFLARE_TUNNEL_URL) {
              startupLog('[Tunnel] Custom CLOUDFLARE_TUNNEL_URL defined — skipping local daemon spawn');
              return;
            }
            const configPath = path.join(
              process.env.USERPROFILE || process.env.HOME || '',
              '.cloudflared',
              'config.yml'
            );
            if (fs.existsSync(configPath)) {
              startCloudflaredTunnel();
            } else {
              startQuickTunnel();
            }
          }
        }, 6000);

        setTimeout(() => {
          startMemoryMonitor();
        }, 10000);

        setTimeout(() => {
          spawnVisionEngine();
        }, 8000);

        // ── STEP 5: Register CCTV / ONVIF IPC handlers ──
        // Registered after window is created so startupLog is fully available
        registerOnvifHandlers(startupLog);
        registerMediamtxHandlers(startupLog);

        // ── STEP 6: WebSocket mobile bridge is managed authoritatively by Next.js server (server.ts) on port 7447 ──
        // Disabled duplicate competing server to prevent EADDRINUSE collision
        // startWsBridgeServer();

        // ── STEP 7: Send power-cut recovery signal to renderer ──
        if (wasPowerCut) {
          setTimeout(() => {
            const lastRoute = getLastRoute();
            safeSend(mainWindow, 'ipc:power-cut-detected', {
              lastRoute,
              message: 'Noxis detected an ungraceful shutdown. Your unsaved work may be recoverable.',
            });
            startupLog(`[PowerCut] Recovery signal sent to renderer. Last route: ${lastRoute}`);
          }, 2000); // give renderer time to fully mount
        }
      }
    } catch (fatalErr: any) {
      startupLog(
        `[FATAL] ${fatalErr.message}`
      )
      try { destroySplash() } catch { }
      dialog.showErrorBox(
        'Noxis Failed to Start',
        `Fatal error:\n\n${fatalErr.message}\n\n` +
        `Log: ${logPath}`
      )
      app.quit()
    }
  });

  // Windows: quit when all windows close
  app.on('window-all-closed', () => app.quit());

  // Cleanup on quit
  app.on('before-quit', (event) => {
    // ── Graceful exit: stop trial heartbeat, checkpoint, mark clean ──
    if (trialHeartbeatInterval) {
      clearInterval(trialHeartbeatInterval);
      trialHeartbeatInterval = null;
    }
    checkpointMonotonicElapsed();
    setExitFlag('clean');
    startupLog('[Electron] Exit flag set to clean ✓');

    if (isQuittingForUpdate) {
      startupLog('[Electron] Quitting for update — bypassing event.preventDefault() to release file locks immediately.');
      return;
    }

    if (nextServer || visionProcess || tunnelProcess) {
      event.preventDefault();

      startupLog('[Electron] Shutting down...');

      if (sessionTimeoutTimer) clearTimeout(sessionTimeoutTimer);
      if (warningTimer) clearTimeout(warningTimer);
      if (memoryMonitorInterval) clearInterval(memoryMonitorInterval);

      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.destroy();
      }

      Promise.all([
        killProcess(visionProcess, 'Vision Engine'),
        killProcess(nextServer, 'Next.js Server'),
        tunnelProcess ? killProcess(tunnelProcess, 'Cloudflare Tunnel') : Promise.resolve(),
      ]).then(() => {
        stopMediamtx();
        visionProcess = null;
        nextServer = null;
        tunnelProcess = null;
        startupLog('[Electron] Shutdown complete ✓');
        app.quit();
      });
    }
  });

}