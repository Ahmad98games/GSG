"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
const Sentry = __importStar(require("@sentry/electron/main"));
const http = __importStar(require("http"));
const net = __importStar(require("net"));
const electron_updater_1 = require("electron-updater");
const electron_log_1 = __importDefault(require("electron-log"));
const os_1 = require("os");
const dbKeyManager_1 = require("../src/lib/security/dbKeyManager");
const onvifService_1 = require("./services/onvifService");
const mediamtxService_1 = require("./services/mediamtxService");
// ─────────────────────────────────────────────
// 0. GLOBAL REFERENCES
// ─────────────────────────────────────────────
try {
    // Write to userData if packaged, or to cwd if dev — never use a hardcoded path
    const debugPath = electron_1.app.isPackaged
        ? path.join(electron_1.app.getPath('userData'), 'debug-startup.txt')
        : path.join(process.cwd(), 'debug-startup.txt');
    fs.writeFileSync(debugPath, `Start execution: packaged=${electron_1.app.isPackaged}\n`);
}
catch { }
let mainWindow = null;
let splashWindow = null;
let nextServer = null;
let visionProcess = null;
let tunnelProcess = null;
let tunnelUrl = null;
let sessionTimeoutTimer = null;
let warningTimer = null;
let memoryMonitorInterval = null;
let PORT = Number(process.env.PORT || 3000);
let isReadOnly = false;
let lastBridgeStatus = { connected: 0, paired: 0, pairedDevices: [] };
const isDev = !electron_1.app.isPackaged;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_LEAD_MS = 60 * 1000;
electron_log_1.default.transports.file.level = 'info';
electron_log_1.default.transports.file.maxSize = 5 * 1024 * 1024;
electron_updater_1.autoUpdater.logger = electron_log_1.default;
// Update channel — can be changed per license tier (Pro/Elite get beta channel)
electron_updater_1.autoUpdater.channel = 'stable';
electron_updater_1.autoUpdater.autoDownload = false;
// We download manually so we can show progress to the user
electron_updater_1.autoUpdater.allowPrerelease = false;
// Track update state for IPC
let updateAvailable = false;
let updateDownloaded = false;
let downloadProgress = 0;
// ─────────────────────────────────────────────
// 1. LOGGER
// ─────────────────────────────────────────────
let logPath = '';
function startupLog(msg) {
    try {
        if (!logPath) {
            logPath = path.join(electron_1.app.getPath('userData'), 'startup.log');
        }
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
    }
    catch { /* userData not ready yet */ }
    electron_log_1.default.info(msg);
}
function startCloudflaredTunnel() {
    const cloudflaredPath = path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Cloudflare', 'cloudflared.exe');
    if (!fs.existsSync(cloudflaredPath)) {
        startupLog('[Tunnel] cloudflared not installed — skipping');
        return;
    }
    startupLog('[Tunnel] Starting Cloudflare tunnel...');
    tunnelProcess = (0, child_process_1.spawn)(cloudflaredPath, ['tunnel', 'run'], {
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    tunnelProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        startupLog(`[Tunnel] ${output.trim()}`);
        const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/) || output.match(/https:\/\/[a-z0-9-]+\.cfargotunnel\.com/);
        if (urlMatch && !tunnelUrl) {
            tunnelUrl = urlMatch[0];
            startupLog(`[Tunnel] URL: ${tunnelUrl}`);
            process.env.CLOUDFLARE_TUNNEL_URL = tunnelUrl.replace('https://', '');
            mainWindow?.webContents.send('tunnel-ready', { url: tunnelUrl });
        }
    });
    tunnelProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        startupLog(`[Tunnel ERR] ${output.trim()}`);
        const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/) || output.match(/https:\/\/[a-z0-9-]+\.cfargotunnel\.com/);
        if (urlMatch && !tunnelUrl) {
            tunnelUrl = urlMatch[0];
            startupLog(`[Tunnel] URL: ${tunnelUrl}`);
            process.env.CLOUDFLARE_TUNNEL_URL = tunnelUrl.replace('https://', '');
            mainWindow?.webContents.send('tunnel-ready', { url: tunnelUrl });
        }
    });
    tunnelProcess.on('exit', (code) => {
        startupLog(`[Tunnel] Exited with code ${code}`);
        tunnelUrl = null;
        tunnelProcess = null;
    });
}
function startQuickTunnel() {
    const cloudflaredPath = path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Cloudflare', 'cloudflared.exe');
    if (!fs.existsSync(cloudflaredPath))
        return;
    startupLog('[QuickTunnel] Starting temporary tunnel...');
    tunnelProcess = (0, child_process_1.spawn)(cloudflaredPath, [
        'tunnel',
        '--url',
        `http://127.0.0.1:${PORT}`,
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    tunnelProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
        if (urlMatch && !tunnelUrl) {
            tunnelUrl = urlMatch[0];
            startupLog(`[QuickTunnel] URL: ${tunnelUrl}`);
            process.env.CLOUDFLARE_TUNNEL_URL = tunnelUrl.replace('https://', '');
            mainWindow?.webContents.send('tunnel-ready', { url: tunnelUrl });
        }
    });
    tunnelProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
        if (urlMatch && !tunnelUrl) {
            tunnelUrl = urlMatch[0];
            startupLog(`[QuickTunnel] URL: ${tunnelUrl}`);
            process.env.CLOUDFLARE_TUNNEL_URL = tunnelUrl.replace('https://', '');
            mainWindow?.webContents.send('tunnel-ready', { url: tunnelUrl });
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
function loadEnvFile(filePath) {
    try {
        if (!fs.existsSync(filePath))
            return;
        const content = fs.readFileSync(filePath, 'utf-8');
        content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#'))
                return;
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex === -1)
                return;
            const key = trimmed.slice(0, eqIndex).trim();
            let value = trimmed.slice(eqIndex + 1).trim();
            // Strip surrounding quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            if (key && !process.env[key]) {
                process.env[key] = value;
            }
        });
    }
    catch (err) {
        startupLog(`[ENV] Failed to load ${filePath}: ${err.message}`);
    }
}
// Detect Windows version
// Windows 7 = NT 6.1
// Windows 8 = NT 6.2
// Windows 8.1 = NT 6.3
// Windows 10/11 = NT 10.0
function getWindowsVersion() {
    if (process.platform !== 'win32') {
        return {
            major: 0, minor: 0,
            isWin7: false, isWin8: false,
            isWin10Plus: false,
        };
    }
    const r = (0, os_1.release)();
    const parts = r.split('.').map(Number);
    const major = parts[0] || 0;
    const minor = parts[1] || 0;
    return {
        major,
        minor,
        isWin7: major === 6 && minor === 1,
        isWin8: major === 6 && (minor === 2 || minor === 3),
        isWin10Plus: major >= 10,
    };
}
const winVersion = getWindowsVersion();
// Windows 7/8 specific: setAppUserModelId
// works differently — wrap in try/catch
if (process.platform === 'win32') {
    try {
        electron_1.app.setAppUserModelId('com.omnoralabs.noxis');
    }
    catch (err) {
        startupLog(`[Win] AppUserModelId failed: ${err.message}`);
        // Non-fatal — app still works
    }
}
// Force disable GPU acceleration and sandbox on Windows to resolve KERNELBASE.dll 0x80000003 crashes
if (process.platform === 'win32') {
    electron_1.app.disableHardwareAcceleration();
    electron_1.app.commandLine.appendSwitch('disable-gpu');
    electron_1.app.commandLine.appendSwitch('disable-gpu-sandbox');
    electron_1.app.commandLine.appendSwitch('no-sandbox');
    startupLog('[Win] GPU acceleration and Sandbox disabled defensively to prevent KERNELBASE.dll crashes');
}
// On older GPUs/drivers, disable hardware acceleration entirely or features
// to prevent black screen issues
electron_1.app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling,MediaSessionService');
// V8 heap space flags to prevent OOMs on low-RAM machines:
electron_1.app.commandLine.appendSwitch('--max-old-space-size', '512');
electron_1.app.commandLine.appendSwitch('--js-flags', '--max-old-space-size=512');
startupLog('════════════ NOXIS STARTUP ════════════');
startupLog(`Platform: ${process.platform} | Arch: ${process.arch} | isDev: ${isDev}`);
function killProcess(child, name) {
    return new Promise((resolve) => {
        if (!child) {
            resolve();
            return;
        }
        startupLog(`[Cleanup] Terminating ${name} (PID: ${child.pid || 'N/A'})...`);
        // Safety timeout: resolve after 2.5 seconds no matter what to prevent app hangs
        const safetyTimeout = setTimeout(() => {
            startupLog(`[Cleanup] Safety timeout reached for ${name}, forcing resolve`);
            resolve();
        }, 2500);
        try {
            try {
                child.kill();
            }
            catch (killErr) {
                startupLog(`[Cleanup] child.kill() failed: ${killErr.message}`);
            }
            if (process.platform === 'win32' && child.pid) {
                (0, child_process_1.exec)(`taskkill /pid ${child.pid} /T /F`, (err) => {
                    clearTimeout(safetyTimeout);
                    if (err)
                        startupLog(`[Cleanup ERR] Failed to taskkill ${name}: ${err.message}`);
                    else
                        startupLog(`[Cleanup] Successfully taskkilled ${name}`);
                    resolve();
                });
            }
            else {
                clearTimeout(safetyTimeout);
                resolve();
            }
        }
        catch (e) {
            clearTimeout(safetyTimeout);
            startupLog(`[Cleanup ERR] Error killing ${name}: ${e.message}`);
            resolve();
        }
    });
}
// ─────────────────────────────────────────────
// 2. SINGLE INSTANCE LOCK
// ─────────────────────────────────────────────
const gotTheLock = electron_1.app.requestSingleInstanceLock();
if (!gotTheLock) {
    electron_1.app.on('ready', () => {
        electron_1.dialog.showErrorBox('Noxis Hub Already Running', 'An instance of Noxis Hub is already active.\n\nCheck your system tray or Task Manager and close it first.');
        electron_1.app.quit();
    });
}
else {
    electron_1.app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized())
                mainWindow.restore();
            mainWindow.focus();
        }
    });
    // ─────────────────────────────────────────────
    // 3. HELPERS
    // ─────────────────────────────────────────────
    let portHolder = null;
    function reserveAvailablePort(startPort, attempt = 0) {
        return new Promise((resolve, reject) => {
            if (attempt > 20) {
                reject(new Error('Could not find an available port after 20 attempts'));
                return;
            }
            const server = net.createServer();
            const timeout = setTimeout(() => {
                try {
                    server.close();
                }
                catch { }
                startupLog(`[Port] Reserve attempt on ${startPort} timed out`);
                resolve(reserveAvailablePort(startPort + 1, attempt + 1));
            }, 2000);
            server.listen(startPort, '127.0.0.1', () => {
                clearTimeout(timeout);
                const addr = server.address();
                if (!addr || typeof addr === 'string') {
                    try {
                        server.close();
                    }
                    catch { }
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
    function releaseReservedPort() {
        return new Promise((resolve) => {
            if (portHolder) {
                try {
                    portHolder.close(() => {
                        portHolder = null;
                        resolve();
                    });
                }
                catch {
                    portHolder = null;
                    resolve();
                }
            }
            else {
                resolve();
            }
        });
    }
    function waitForServer(url, timeout = 90000, interval = 1000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            let done = false;
            const check = () => {
                if (done)
                    return;
                if (Date.now() - start > timeout) {
                    done = true;
                    reject(new Error(`Server did not start within ${timeout / 1000}s`));
                    return;
                }
                const req = http.get(url, (res) => {
                    if (done)
                        return;
                    if (res.statusCode) {
                        done = true;
                        resolve();
                    }
                    else {
                        setTimeout(check, interval);
                    }
                });
                req.on('error', (err) => {
                    if (done)
                        return;
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
    function createSplashWindow() {
        const iconPath = electron_1.app.isPackaged
            ? path.join(process.resourcesPath, 'build', 'icon.ico')
            : path.join(__dirname, '../../build/icon.ico');
        startupLog(`[Icon] Splash Path: ${iconPath}`);
        startupLog(`[Icon] Splash Exists: ${fs.existsSync(iconPath)}`);
        splashWindow = new electron_1.BrowserWindow({
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
                sandbox: false,
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
    function destroySplash() {
        if (!splashWindow || splashWindow.isDestroyed())
            return;
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
    function spawnVisionEngine() {
        if (isDev) {
            startupLog('[Vision] Skipped in dev mode');
            return;
        }
        if (isReadOnly) {
            startupLog('[Vision] Blocked: Read-Only mode');
            return;
        }
        const visionScriptPath = path.join(process.resourcesPath, 'vision', 'vision_engine.py');
        if (!fs.existsSync(visionScriptPath)) {
            startupLog(`[Vision] Script not found at ${visionScriptPath} — skipping`);
            return;
        }
        const configPath = path.join(electron_1.app.getPath('userData'), 'cameras.json');
        visionProcess = (0, child_process_1.spawn)('python', [visionScriptPath, '--config', configPath], {
            env: {
                ...process.env,
                NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
                SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
            },
        });
        visionProcess.on('error', (err) => startupLog(`[Vision] Spawn error: ${err.message}`));
        visionProcess.stdout?.on('data', (d) => startupLog(`[Vision] ${d.toString().trim()}`));
        visionProcess.stderr?.on('data', (d) => startupLog(`[Vision ERR] ${d.toString().trim()}`));
        visionProcess.on('exit', (code) => { startupLog(`[Vision] Exited: ${code}`); visionProcess = null; });
    }
    // ─────────────────────────────────────────────
    // 6. AUTO UPDATER
    // ─────────────────────────────────────────────
    function setupAutoUpdater(win) {
        // ── AUTO-UPDATER EVENT HANDLERS ──
        electron_updater_1.autoUpdater.on('checking-for-update', () => {
            startupLog('[Update] Checking for update...');
            win.webContents.send('update-status', {
                status: 'checking',
                message: 'Checking for updates...',
            });
        });
        electron_updater_1.autoUpdater.on('update-available', (info) => {
            startupLog(`[Update] Update available: v${info.version}`);
            updateAvailable = true;
            win.webContents.send('update-status', {
                status: 'available',
                version: info.version,
                releaseDate: info.releaseDate,
                releaseName: info.releaseName || `Version ${info.version}`,
                releaseNotes: info.releaseNotes || '',
            });
        });
        electron_updater_1.autoUpdater.on('update-not-available', () => {
            startupLog('[Update] Up to date');
            win.webContents.send('update-status', {
                status: 'up-to-date',
                message: 'You are on the latest version.',
            });
        });
        electron_updater_1.autoUpdater.on('download-progress', (progress) => {
            downloadProgress = progress.percent;
            startupLog(`[Update] Download: ${progress.percent.toFixed(1)}%`);
            win.webContents.send('update-status', {
                status: 'downloading',
                percent: progress.percent,
                transferred: progress.transferred,
                total: progress.total,
                bytesPerSecond: progress.bytesPerSecond,
            });
        });
        electron_updater_1.autoUpdater.on('update-downloaded', (info) => {
            startupLog(`[Update] Downloaded: v${info.version}`);
            updateDownloaded = true;
            win.webContents.send('update-status', {
                status: 'ready',
                version: info.version,
            });
        });
        electron_updater_1.autoUpdater.on('error', (err) => {
            startupLog(`[Update] Error: ${err.message}`);
            win.webContents.send('update-status', {
                status: 'error',
                message: err.message.includes('net::')
                    ? 'No internet connection. Update check skipped.'
                    : `Update error: ${err.message}`,
            });
        });
        if (isDev)
            return;
        // Initial check — 5 seconds after launch
        setTimeout(async () => {
            try {
                await electron_updater_1.autoUpdater.checkForUpdates();
            }
            catch { /* non-fatal */ }
        }, 5000);
        // Periodic check — every 4 hours
        setInterval(async () => {
            if (!updateDownloaded) {
                try {
                    await electron_updater_1.autoUpdater.checkForUpdates();
                }
                catch { /* non-fatal */ }
            }
        }, 4 * 60 * 60 * 1000);
    }
    // ─────────────────────────────────────────────
    // 7. SESSION TIMERS
    // ─────────────────────────────────────────────
    function resetInactivityTimer() {
        if (sessionTimeoutTimer)
            clearTimeout(sessionTimeoutTimer);
        if (warningTimer)
            clearTimeout(warningTimer);
        warningTimer = setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed())
                mainWindow.webContents.send('session-expiring-warning');
        }, SESSION_TIMEOUT_MS - WARNING_LEAD_MS);
        sessionTimeoutTimer = setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed())
                mainWindow.webContents.send('session-timeout-logout');
        }, SESSION_TIMEOUT_MS);
    }
    electron_1.ipcMain.on('user-activity', () => resetInactivityTimer());
    function startMemoryMonitor() {
        if (memoryMonitorInterval)
            clearInterval(memoryMonitorInterval);
        memoryMonitorInterval = setInterval(() => {
            const usage = process.memoryUsage();
            const heapMB = Math.round(usage.heapUsed / 1024 / 1024);
            const rssMB = Math.round(usage.rss / 1024 / 1024);
            startupLog(`[Memory] Heap: ${heapMB}MB / ` +
                `RSS: ${rssMB}MB`);
            // Aggressive GC on machines under memory pressure
            if (heapMB > 512) {
                if (typeof global.gc === 'function') {
                    global.gc();
                    startupLog(`[Memory] GC triggered: ${heapMB}MB`);
                }
            }
            // If heap exceeds 800MB, log warning
            if (heapMB > 800) {
                startupLog(`[Memory] WARNING: High heap ` +
                    `usage ${heapMB}MB — possible leak`);
            }
            // Pass memory stats to renderer for the performance monitor
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('memory-stats', { heapMB, rssMB });
            }
        }, 30000);
    }
    // ─────────────────────────────────────────────
    // 8. TITLE BAR IPC
    // ─────────────────────────────────────────────
    electron_1.ipcMain.on('window-minimize', () => mainWindow?.minimize());
    electron_1.ipcMain.on('window-maximize', () => {
        if (mainWindow?.isMaximized())
            mainWindow.unmaximize();
        else
            mainWindow?.maximize();
    });
    electron_1.ipcMain.on('window-close', () => mainWindow?.close());
    electron_1.ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false);
    electron_1.ipcMain.handle('check-for-updates', async () => {
        try {
            // Don't check in development
            if (!electron_1.app.isPackaged) {
                return {
                    status: 'dev',
                    message: 'Auto-update disabled in development'
                };
            }
            await electron_updater_1.autoUpdater.checkForUpdates();
            return { status: 'checking' };
        }
        catch (err) {
            return {
                status: 'error',
                message: err.message
            };
        }
    });
    electron_1.ipcMain.handle('download-update', async () => {
        if (!updateAvailable)
            return;
        try {
            await electron_updater_1.autoUpdater.downloadUpdate();
        }
        catch (err) {
            startupLog(`[Update] Download failed: ${err.message}`);
        }
    });
    electron_1.ipcMain.handle('install-update', () => {
        if (!updateDownloaded)
            return;
        // Let app finish current operations then quit and install
        setImmediate(() => {
            electron_updater_1.autoUpdater.quitAndInstall(false, // don't run installer silently
            true // restart after install
            );
        });
    });
    electron_1.ipcMain.handle('get-update-status', () => ({
        updateAvailable,
        updateDownloaded,
        downloadProgress,
        currentVersion: electron_1.app.getVersion(),
    }));
    electron_1.ipcMain.handle('set-update-channel', (_, channel) => {
        electron_updater_1.autoUpdater.channel = channel;
        startupLog(`[Update] Channel changed to: ${channel}`);
    });
    electron_1.ipcMain.handle('get-bridge-status', () => lastBridgeStatus);
    electron_1.ipcMain.handle('get-tunnel-url', () => ({
        url: tunnelUrl,
        ready: !!tunnelUrl,
    }));
    electron_1.ipcMain.handle('sync-tier', (_, data) => {
        startupLog(`[Tier] Sync: ${data.tier} (Expires: ${data.expiresAt || 'Never'})`);
        if (data.expiresAt && new Date() > new Date(data.expiresAt)) {
            isReadOnly = true;
            startupLog('[Security] License expired — Read-Only mode');
            mainWindow?.webContents.send('license-expired');
            if (visionProcess) {
                killProcess(visionProcess, 'Vision Engine');
                visionProcess = null;
            }
        }
        else {
            isReadOnly = false;
        }
        return { success: true, isReadOnly };
    });
    // ─────────────────────────────────────────────
    // FILE MORPH IPC
    // ─────────────────────────────────────────────
    electron_1.ipcMain.handle('compress-images', async (_, files) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
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
        }
        catch (error) {
            startupLog(`[FileMorph] Compression error: ${error.message}`);
            throw error;
        }
    });
    electron_1.ipcMain.handle('convert-heic', async (_, files) => {
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
        }
        catch (error) {
            startupLog(`[FileMorph] HEIC error: ${error.message}`);
            throw error;
        }
    });
    electron_1.ipcMain.handle('get-app-data-path', () => electron_1.app.getPath('userData'));
    // ─────────────────────────────────────────────
    // 9. MAIN WINDOW CREATION
    // Splash is already visible. Main window
    // loads silently behind it. When ready,
    // splash fades out and main slides in.
    // ─────────────────────────────────────────────
    async function createMainWindow() {
        const iconPath = electron_1.app.isPackaged
            ? path.join(process.resourcesPath, 'build', 'icon.ico')
            : path.join(__dirname, '../../build/icon.ico');
        startupLog(`[Icon] Main Path: ${iconPath}`);
        startupLog(`[Icon] Main Exists: ${fs.existsSync(iconPath)}`);
        mainWindow = new electron_1.BrowserWindow({
            width: 1400,
            height: 900,
            minWidth: 1024,
            minHeight: 768,
            show: false, // hidden until fully loaded
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
                    mainWindow?.loadURL(`http://127.0.0.1:${PORT}`)
                        .catch(e => startupLog(`[Electron] Retry error: ${e.message}`));
                }, 2000);
            }
            else {
                startupLog('[Electron] Max retries reached');
                destroySplash();
                electron_1.dialog.showErrorBox('Page Load Failed', `Could not load the app.\n\nCheck logs at:\n${logPath}`);
                electron_1.app.quit();
            }
        });
        mainWindow.webContents.on('did-finish-load', () => {
            startupLog('[Electron] Page loaded successfully ✓');
            loadRetries = 0;
        });
        mainWindow.webContents.on('unresponsive', () => {
            startupLog('[FREEZE] Renderer unresponsive');
            // Capture memory state at freeze time
            const mem = process.memoryUsage();
            startupLog(`[FREEZE] Memory at freeze: ` +
                `heap ${Math.round(mem.heapUsed / 1024 / 1024)}MB`);
            // Log all active IPC channels
            startupLog('[FREEZE] Checking for hung IPC...');
            // Give it 15 seconds to recover
            const recoveryTimeout = setTimeout(() => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    electron_1.dialog.showMessageBox(mainWindow, {
                        type: 'question',
                        title: 'Noxis Hub is not responding',
                        message: 'Noxis Hub stopped responding. ' +
                            'Wait for it to recover or restart?',
                        buttons: ['Wait', 'Restart'],
                        defaultId: 0,
                    }).then(({ response }) => {
                        if (response === 1) {
                            electron_1.app.relaunch();
                            Promise.all([
                                killProcess(visionProcess, 'Vision Engine'),
                                killProcess(nextServer, 'Next.js Server'),
                            ]).then(() => {
                                electron_1.app.exit(0);
                            }).catch(() => {
                                electron_1.app.exit(0);
                            });
                        }
                    });
                }
            }, 15000);
            // If it recovers, cancel the dialog
            if (mainWindow) {
                mainWindow.webContents.once('responsive', () => {
                    clearTimeout(recoveryTimeout);
                    startupLog('[FREEZE] Renderer recovered');
                });
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
            mainWindow.setOpacity(0);
            mainWindow.maximize();
            mainWindow.show();
            mainWindow.focus();
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
        mainWindow.on('maximize', () => mainWindow?.webContents.send('maximize-changed', true));
        mainWindow.on('unmaximize', () => mainWindow?.webContents.send('maximize-changed', false));
        mainWindow.on('closed', () => { mainWindow = null; });
        const url = `http://127.0.0.1:${PORT}`;
        try {
            startupLog('[Electron] Waiting for Next.js server...');
            await waitForServer(url, 90000, 300);
            startupLog('[Electron] Server ready — loading main window');
            await mainWindow.loadURL(url);
            if (isDev) {
                mainWindow.webContents.openDevTools();
            }
        }
        catch (err) {
            startupLog(`[Electron] Server failed to start: ${err.message}`);
            destroySplash();
            electron_1.dialog.showMessageBoxSync({
                type: 'error',
                title: 'Noxis Failed to Start',
                message: 'The app server could not start.',
                detail: `Log file:\n${logPath}\n\n` +
                    `Try restarting Noxis. If this persists:\n` +
                    `WhatsApp: +92 326 4742678`,
                buttons: ['OK'],
            });
            electron_1.app.quit();
        }
    }
    // ─────────────────────────────────────────────
    // 10. APP LIFECYCLE
    // ─────────────────────────────────────────────
    electron_1.app.whenReady().then(async () => {
        try {
            // Load env from all possible locations (inline parser — no dotenv dependency)
            loadEnvFile(path.join(__dirname, '../../.env'));
            loadEnvFile(path.join(process.resourcesPath, '.env'));
            loadEnvFile(path.join(path.dirname(electron_1.app.getPath('exe')), '.env'));
            loadEnvFile(path.join(electron_1.app.getPath('userData'), '.env'));
            startupLog(`[ENV] SUPABASE_URL: ${!!process.env.NEXT_PUBLIC_SUPABASE_URL}`);
            startupLog(`[ENV] SERVICE_ROLE: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);
            const missing = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
                .filter(k => !process.env[k]);
            if (missing.length > 0) {
                electron_1.dialog.showErrorBox('Missing Configuration', `Required env vars missing:\n\n  ${missing.join('\n  ')}\n\n` +
                    `Place a .env file next to Noxis.exe`);
                electron_1.app.quit();
                return;
            }
            if (process.env.SENTRY_DSN) {
                Sentry.init({ dsn: process.env.SENTRY_DSN });
            }
            process.on('uncaughtException', (error) => {
                startupLog(`[CRITICAL] ${error.message}`);
                if (error.stack)
                    startupLog(error.stack);
                try {
                    electron_1.dialog.showErrorBox('Noxis Hub Crashed', `Unexpected error:\n\n${error.message}\n\n` +
                        `Log: ${logPath}\n\n` +
                        `WhatsApp: +92 326 4742678`);
                }
                catch { }
                // Clean up child processes before exiting on crash
                Promise.all([
                    killProcess(visionProcess, 'Vision Engine'),
                    killProcess(nextServer, 'Next.js Server'),
                ]).then(() => {
                    electron_1.app.exit(1);
                }).catch(() => {
                    electron_1.app.exit(1);
                });
            });
            process.on('unhandledRejection', (reason) => {
                startupLog(`[CRITICAL] Unhandled rejection: ${reason}`);
                Sentry.captureException(reason instanceof Error ? reason : new Error(String(reason)));
            });
            // Defensive: if a previous Noxis instance
            // crashed and left its Next.js server alive
            // on a fixed port, kill anything actually
            // listening there before we try to bind
            async function killAnyProcessOnPort(port) {
                if (process.platform !== 'win32')
                    return;
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
                        (0, child_process_1.exec)(`netstat -ano | findstr :${port}`, (err, stdout) => {
                            clearTimeout(safetyTimeout);
                            try {
                                if (err || !stdout) {
                                    resolve();
                                    return;
                                }
                                const lines = stdout.split('\n').filter(Boolean);
                                const pids = new Set();
                                lines.forEach(line => {
                                    const parts = line.trim().split(/\s+/);
                                    const pid = parts[parts.length - 1];
                                    if (pid &&
                                        /^\d+$/.test(pid) &&
                                        pid !== '0' &&
                                        pid !== process.pid.toString()) {
                                        pids.add(pid);
                                    }
                                });
                                if (pids.size === 0) {
                                    resolve();
                                    return;
                                }
                                startupLog(`[Port] Found ${pids.size} process(es) on port ${port}, clearing...`);
                                let remaining = pids.size;
                                let settled = false;
                                const finish = () => {
                                    if (settled)
                                        return;
                                    settled = true;
                                    resolve();
                                };
                                pids.forEach(pid => {
                                    try {
                                        (0, child_process_1.exec)(`taskkill /pid ${pid} /F`, () => {
                                            remaining--;
                                            if (remaining <= 0)
                                                finish();
                                        });
                                    }
                                    catch {
                                        remaining--;
                                        if (remaining <= 0)
                                            finish();
                                    }
                                });
                            }
                            catch (innerErr) {
                                startupLog(`[Port] Parse error: ${innerErr.message}, continuing`);
                                resolve();
                            }
                        });
                    }
                    catch (execErr) {
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
            const resourcesPath = electron_1.app.isPackaged ? process.resourcesPath : process.cwd();
            const serverPath = electron_1.app.isPackaged
                ? (fs.existsSync(path.join(resourcesPath, 'standalone', 'server-with-bridge.js'))
                    ? path.join(resourcesPath, 'standalone', 'server-with-bridge.js')
                    : path.join(resourcesPath, 'standalone', 'server.js'))
                : (fs.existsSync(path.join(resourcesPath, '.next', 'standalone', 'server-with-bridge.js'))
                    ? path.join(resourcesPath, '.next', 'standalone', 'server-with-bridge.js')
                    : path.join(resourcesPath, '.next', 'standalone', 'server.js'));
            const sqlitePath = electron_1.app.isPackaged
                ? path.join(resourcesPath, 'better-sqlite3-multiple-ciphers')
                : path.join(resourcesPath, 'node_modules', 'better-sqlite3-multiple-ciphers');
            startupLog(`[Electron] Server path: ${serverPath}`);
            startupLog(`[Electron] SQLite path: ${sqlitePath}`);
            startupLog(`[Electron] Resources: ${resourcesPath}`);
            if (!fs.existsSync(serverPath)) {
                startupLog('[FATAL] Neither server-with-bridge.js nor server.js found');
                destroySplash();
                electron_1.dialog.showErrorBox('Installation Error', `Server not found at:\n${serverPath}\n\nPlease reinstall Noxis.`);
                electron_1.app.quit();
                return;
            }
            // Check SQLite binding exists (check both node-gyp build and prebuilds layout)
            let sqliteBinding = path.join(sqlitePath, 'build', 'Release', 'better_sqlite3.node');
            if (!fs.existsSync(sqliteBinding)) {
                sqliteBinding = path.join(sqlitePath, 'prebuilds', `win32-x64`, `node.napi.node`);
            }
            const sqliteExists = fs.existsSync(sqliteBinding);
            startupLog(`[Electron] SQLite binding exists: ${sqliteExists}`);
            if (!sqliteExists) {
                startupLog(`[WARN] SQLite binding not found at ${sqliteBinding}`);
                startupLog(`[WARN] Listing sqlite dir:`);
                try {
                    const listDir = (dir, depth = 0) => {
                        if (depth > 3)
                            return;
                        fs.readdirSync(dir).forEach(f => {
                            startupLog(`${'  '.repeat(depth)}${f}`);
                            const full = path.join(dir, f);
                            if (fs.statSync(full).isDirectory()) {
                                listDir(full, depth + 1);
                            }
                        });
                    };
                    listDir(sqlitePath);
                }
                catch (e) {
                    startupLog(`[WARN] Could not list: ${e.message}`);
                }
            }
            const userDataPath = electron_1.app.getPath('userData');
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
            }
            catch (e) {
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
            const stderrPath = path.join(userDataPath, 'server-stderr.log');
            try {
                fs.writeFileSync(stderrPath, `--- ${new Date().toISOString()} ---\n`);
            }
            catch { }
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
            await new Promise(r => setTimeout(r, 50));
            nextServer = electron_1.utilityProcess.fork(normalizedServerPath, [], {
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
                    ELECTRON_DB_KEY: (0, dbKeyManager_1.deriveDbKey)(process.env.USER_ID || 'SYSTEM'),
                },
                stdio: ['ignore', 'pipe', 'pipe'],
            });
            // Log ALL server output — this shows the exact crash message
            let serverLog = '';
            nextServer.stdout?.on('data', (d) => {
                const msg = d.toString().trim();
                startupLog(`[Next.js] ${msg}`);
                serverLog += msg + '\n';
            });
            nextServer.stderr?.on('data', (d) => {
                const msg = d.toString();
                startupLog(`[Next.js ERR] ${msg.trim()}`);
                serverLog += '[ERR] ' + msg + '\n';
                // ── FIX D: Synchronous write so data is never lost on fast crash ──
                try {
                    fs.appendFileSync(stderrPath, msg);
                }
                catch { }
            });
            nextServer.on('message', (msg) => {
                if (msg && msg.type === 'bridge-event') {
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.send('bridge-event', { event: msg.event, data: msg.data });
                    }
                    if (msg.event === 'DEVICE_COUNT_CHANGED') {
                        lastBridgeStatus = {
                            connected: msg.data.connected,
                            paired: msg.data.paired,
                            pairedDevices: msg.data.pairedDevices || [],
                        };
                    }
                }
            });
            nextServer.on('exit', (code) => {
                startupLog(`[Next.js] Exit: code=${code}`);
                // Read the stderr file on exit in case async handlers lost data
                try {
                    const stderrContents = fs.readFileSync(stderrPath, 'utf-8');
                    if (stderrContents && stderrContents.trim() !== `--- ${new Date().toISOString().slice(0, 10)}`) {
                        startupLog(`[Next.js] Full stderr on exit:\n${stderrContents.slice(-2000)}`);
                    }
                }
                catch { }
                startupLog(`[Next.js] Last buffered output:\n${serverLog.slice(-1000)}`);
                if (code !== 0) {
                    destroySplash();
                    electron_1.dialog.showErrorBox('Server Crashed', `Server exited with code ${code}.\n\nLast server output:\n${serverLog.slice(-500) || '(no output — see server-stderr.log in userData folder)'}`);
                }
                nextServer = null;
            });
            // ── STEP 3: Create main window (loads silently) ──
            // Splash stays visible while this loads.
            // ready-to-show event handles the transition.
            await createMainWindow();
            // ── STEP 4: Setup non-blocking features ──
            // Run these AFTER window is shown, not before.
            // This prevents blocking the UI thread at startup.
            if (mainWindow) {
                setTimeout(() => {
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        setupAutoUpdater(mainWindow);
                    }
                }, 5000);
                setTimeout(() => {
                    if (electron_1.app.isPackaged) {
                        if (process.env.CLOUDFLARE_TUNNEL_URL) {
                            startupLog('[Tunnel] Custom CLOUDFLARE_TUNNEL_URL defined — skipping local daemon spawn');
                            return;
                        }
                        const configPath = path.join(process.env.USERPROFILE || process.env.HOME || '', '.cloudflared', 'config.yml');
                        if (fs.existsSync(configPath)) {
                            startCloudflaredTunnel();
                        }
                        else {
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
                (0, onvifService_1.registerOnvifHandlers)(startupLog);
                (0, mediamtxService_1.registerMediamtxHandlers)(startupLog);
            }
        }
        catch (fatalErr) {
            startupLog(`[FATAL] ${fatalErr.message}`);
            try {
                destroySplash();
            }
            catch { }
            electron_1.dialog.showErrorBox('Noxis Failed to Start', `Fatal error:\n\n${fatalErr.message}\n\n` +
                `Log: ${logPath}`);
            electron_1.app.quit();
        }
    });
    // Windows: quit when all windows close
    electron_1.app.on('window-all-closed', () => electron_1.app.quit());
    // Cleanup on quit
    electron_1.app.on('before-quit', (event) => {
        if (nextServer || visionProcess || tunnelProcess) {
            event.preventDefault();
            startupLog('[Electron] Shutting down...');
            if (sessionTimeoutTimer)
                clearTimeout(sessionTimeoutTimer);
            if (warningTimer)
                clearTimeout(warningTimer);
            if (memoryMonitorInterval)
                clearInterval(memoryMonitorInterval);
            if (splashWindow && !splashWindow.isDestroyed()) {
                splashWindow.destroy();
            }
            Promise.all([
                killProcess(visionProcess, 'Vision Engine'),
                killProcess(nextServer, 'Next.js Server'),
                tunnelProcess ? killProcess(tunnelProcess, 'Cloudflare Tunnel') : Promise.resolve(),
            ]).then(() => {
                (0, mediamtxService_1.stopMediamtx)();
                visionProcess = null;
                nextServer = null;
                tunnelProcess = null;
                startupLog('[Electron] Shutdown complete ✓');
                electron_1.app.quit();
            });
        }
    });
}
