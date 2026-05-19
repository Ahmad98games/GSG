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
const dotenv = __importStar(require("dotenv"));
const child_process_1 = require("child_process");
const Sentry = __importStar(require("@sentry/electron/main"));
const http = __importStar(require("http"));
const net = __importStar(require("net"));
const electron_updater_1 = require("electron-updater");
const electron_log_1 = __importDefault(require("electron-log"));
const dbKeyManager_1 = require("../src/lib/security/dbKeyManager");
// ─────────────────────────────────────────────
// 0. GLOBAL REFERENCES
// ─────────────────────────────────────────────
let mainWindow = null;
let nextServer = null;
let visionProcess = null;
let sessionTimeoutTimer = null;
let warningTimer = null;
let PORT = Number(process.env.PORT || 3000);
let isReadOnly = false;
const isDev = !electron_1.app.isPackaged;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_LEAD_MS = 60 * 1000;
// Configure logging
electron_log_1.default.transports.file.level = 'info';
electron_log_1.default.transports.file.maxSize = 5 * 1024 * 1024; // 5MB
electron_updater_1.autoUpdater.logger = electron_log_1.default;
// Configure update server
electron_updater_1.autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'omnoralabs', // your GitHub username
    repo: 'noxis-releases', // public repo for releases
    private: false
});
// Check for updates every 4 hours
const CHECK_INTERVAL = 4 * 60 * 60 * 1000;
// ─────────────────────────────────────────────
// 1. LOGGER
// ─────────────────────────────────────────────
let logPath = '';
/**
 * Internal logger that preserves original behavior while using electron-log
 */
function startupLog(msg) {
    try {
        if (!logPath) {
            logPath = path.join(electron_1.app.getPath('userData'), 'startup.log');
        }
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
    }
    catch {
        // userData not ready yet
    }
    electron_log_1.default.info(msg); // use electron-log instead of console.log
}
startupLog('════════════ NOXIS STARTUP ════════════');
startupLog(`Platform: ${process.platform} | Arch: ${process.arch} | isDev: ${isDev}`);
/**
 * Safely and recursively terminates a child process and all of its spawned children.
 * Crucial on Windows to prevent lingering standalone Next.js server zombie processes.
 */
function killProcess(child, name) {
    if (!child)
        return;
    startupLog(`[Cleanup] Terminating ${name} (PID: ${child.pid})...`);
    try {
        if (process.platform === 'win32') {
            (0, child_process_1.exec)(`taskkill /pid ${child.pid} /T /F`, (err) => {
                if (err) {
                    startupLog(`[Cleanup ERR] Failed to taskkill ${name}: ${err.message}`);
                }
                else {
                    startupLog(`[Cleanup] Successfully taskkilled ${name}`);
                }
            });
        }
        else {
            child.kill('SIGKILL');
        }
    }
    catch (e) {
        startupLog(`[Cleanup ERR] Error killing ${name}: ${e.message}`);
    }
}
// ─────────────────────────────────────────────
// 2. SINGLE INSTANCE LOCK
// ─────────────────────────────────────────────
const gotTheLock = electron_1.app.requestSingleInstanceLock();
if (!gotTheLock) {
    // Defer dialog until app is ready — calling it before ready crashes on Windows
    electron_1.app.on('ready', () => {
        electron_1.dialog.showErrorBox('Noxis Hub Already Running', 'An instance of Noxis Hub is already active.\n\nCheck your system tray or Task Manager and close it first.');
        electron_1.app.quit();
    });
}
else {
    // Bring existing window to front if user launches a second instance
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
    /** Find a free TCP port starting from startPort */
    function findAvailablePort(startPort) {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.listen(startPort, '127.0.0.1', () => {
                const { port } = server.address();
                server.close(() => resolve(port));
            });
            server.on('error', () => resolve(findAvailablePort(startPort + 1)));
        });
    }
    /**
     * Poll http://127.0.0.1:PORT until Next.js responds.
     * Always uses 127.0.0.1 — on Windows, 'localhost' can resolve to
     * IPv6 ::1 which the server is NOT bound to, causing silent failures.
     */
    function waitForNextJS(port, maxAttempts = 60) {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const check = () => {
                attempts++;
                startupLog(`[Health] Attempt ${attempts}/${maxAttempts} → http://127.0.0.1:${port}`);
                const req = http.get(`http://127.0.0.1:${port}`, (res) => {
                    if ([200, 302, 307].includes(res.statusCode ?? 0)) {
                        startupLog(`[Health] Next.js ready ✓ (${res.statusCode})`);
                        resolve();
                    }
                    else {
                        retry();
                    }
                    res.resume(); // drain socket to free connection
                });
                req.setTimeout(1500, () => { req.destroy(); retry(); });
                req.on('error', retry);
            };
            const retry = () => {
                if (attempts >= maxAttempts) {
                    reject(new Error(`Next.js did not start after ${maxAttempts}s on port ${port}`));
                }
                else {
                    setTimeout(check, 1000);
                }
            };
            check();
        });
    }
    // ─────────────────────────────────────────────
    // 4. VISION ENGINE  (production-only)
    // ─────────────────────────────────────────────
    function spawnVisionEngine() {
        if (isDev) {
            startupLog('[Vision] Skipped in dev mode');
            return;
        }
        if (isReadOnly) {
            startupLog('[Vision] Blocked: System in Read-Only mode (License Expired)');
            return;
        }
        const visionScriptPath = path.join(process.resourcesPath, 'vision', 'vision_engine.py');
        if (!fs.existsSync(visionScriptPath)) {
            startupLog(`[Vision] Script not found at ${visionScriptPath} — skipping`);
            return;
        }
        const configPath = path.join(electron_1.app.getPath('userData'), 'cameras.json');
        // Windows always uses 'python' (not python3)
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
        visionProcess.on('exit', (code) => {
            startupLog(`[Vision] Exited with code ${code}`);
            visionProcess = null;
        });
    }
    function setupAutoUpdater(mainWindow) {
        // Don't check in development
        if (isDev)
            return;
        electron_updater_1.autoUpdater.on('checking-for-update', () => {
            startupLog('[Update] Checking for update...');
        });
        electron_updater_1.autoUpdater.on('update-available', (info) => {
            startupLog(`[Update] Update available: ${info.version}`);
            // Notify renderer — show subtle banner
            mainWindow.webContents.send('update-available', info);
        });
        electron_updater_1.autoUpdater.on('update-not-available', () => {
            startupLog('[Update] Up to date');
        });
        electron_updater_1.autoUpdater.on('download-progress', (progress) => {
            startupLog(`[Update] Download: ${Math.round(progress.percent)}%`);
            mainWindow.webContents.send('update-progress', progress);
        });
        electron_updater_1.autoUpdater.on('update-downloaded', (info) => {
            startupLog(`[Update] Update downloaded: ${info.version}`);
            mainWindow.webContents.send('update-downloaded', info);
        });
        electron_updater_1.autoUpdater.on('error', (err) => {
            startupLog(`[Update] Error: ${err.message}`);
            // Silent fail — never crash over update error
        });
        // Check on startup (after 30 second delay)
        setTimeout(() => {
            electron_updater_1.autoUpdater.checkForUpdates()
                .catch(err => startupLog(`[Update] Check failed: ${err}`));
        }, 30000);
        // Check every 4 hours
        setInterval(() => {
            electron_updater_1.autoUpdater.checkForUpdates()
                .catch(err => startupLog(`[Update] Check failed: ${err}`));
        }, CHECK_INTERVAL);
    }
    // ─────────────────────────────────────────────
    // 5. SESSION / INACTIVITY TIMERS
    // ─────────────────────────────────────────────
    function resetInactivityTimer() {
        if (sessionTimeoutTimer)
            clearTimeout(sessionTimeoutTimer);
        if (warningTimer)
            clearTimeout(warningTimer);
        warningTimer = setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('session-expiring-warning');
            }
        }, SESSION_TIMEOUT_MS - WARNING_LEAD_MS);
        sessionTimeoutTimer = setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('session-timeout-logout');
            }
        }, SESSION_TIMEOUT_MS);
    }
    electron_1.ipcMain.on('user-activity', () => resetInactivityTimer());
    // ─────────────────────────────────────────────
    // 6. TITLE BAR IPC
    // ─────────────────────────────────────────────
    electron_1.ipcMain.on('window-minimize', () => {
        electron_1.BrowserWindow.getFocusedWindow()?.minimize();
    });
    electron_1.ipcMain.on('window-maximize', () => {
        const win = electron_1.BrowserWindow.getFocusedWindow();
        if (win?.isMaximized())
            win.unmaximize();
        else
            win?.maximize();
    });
    electron_1.ipcMain.on('window-close', () => {
        electron_1.BrowserWindow.getFocusedWindow()?.close();
    });
    // handle (async) instead of returnValue — safer for IPC
    electron_1.ipcMain.handle('window-is-maximized', () => {
        return electron_1.BrowserWindow.getFocusedWindow()?.isMaximized() ?? false;
    });
    // IPC for manual check and install
    electron_1.ipcMain.handle('check-for-updates', async () => {
        return electron_updater_1.autoUpdater.checkForUpdates();
    });
    electron_1.ipcMain.handle('install-update', () => {
        electron_updater_1.autoUpdater.quitAndInstall(false, true);
    });
    electron_1.ipcMain.handle('sync-tier', (_, data) => {
        startupLog(`[Tier] Sync: ${data.tier} (Expires: ${data.expiresAt || 'Never'})`);
        if (data.expiresAt && new Date() > new Date(data.expiresAt)) {
            isReadOnly = true;
            startupLog("[Security] License expired. Enabling Read-Only mode.");
            mainWindow?.webContents.send('license-expired');
            if (visionProcess) {
                startupLog("[Vision] Terminating background processes...");
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
    // FILE MORPH IPC HANDLERS (Local Processing)
    // ─────────────────────────────────────────────
    electron_1.ipcMain.handle('compress-images', async (_, files) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const sharp = require('sharp');
            const results = [];
            for (const file of files) {
                const buffer = Buffer.from(file.data, 'base64');
                const compressed = await sharp(buffer)
                    .jpeg({ quality: file.quality || 75, progressive: true })
                    .toBuffer();
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
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const heicConvert = require('heic-convert');
            const results = [];
            for (const file of files) {
                const buffer = Buffer.from(file.data, 'base64');
                const output = await heicConvert({
                    buffer,
                    format: 'JPEG',
                    quality: (file.quality || 90) / 100
                });
                results.push({
                    name: file.name.replace(/\.heic$/i, '.jpg'),
                    data: Buffer.from(output).toString('base64'),
                    size: output.byteLength
                });
            }
            return results;
        }
        catch (error) {
            startupLog(`[FileMorph] HEIC conversion error: ${error.message}`);
            throw error;
        }
    });
    // ─────────────────────────────────────────────
    // 7. WINDOW CREATION
    // ─────────────────────────────────────────────
    async function createWindow() {
        mainWindow = new electron_1.BrowserWindow({
            width: 1400,
            height: 900,
            minWidth: 1024,
            minHeight: 768,
            show: false, // revealed only after ready-to-show
            frame: false,
            titleBarStyle: 'hidden',
            transparent: false,
            backgroundColor: '#121417',
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
            icon: path.join(__dirname, '../public/logos/noxis.png'),
        });
        // Show only when the first frame is painted — no blank flash
        mainWindow.once('ready-to-show', () => {
            startupLog('[Electron] ready-to-show — displaying window');
            mainWindow?.show();
            mainWindow?.focus();
        });
        // Auto-retry on load failure (transient port/timing issues)
        let loadRetries = 0;
        mainWindow.webContents.on('did-fail-load', (_e, errorCode, errorDesc) => {
            startupLog(`[Electron] did-fail-load: ${errorCode} ${errorDesc}`);
            if (loadRetries < 5) {
                loadRetries++;
                startupLog(`[Electron] Retrying load (${loadRetries}/5)...`);
                setTimeout(() => {
                    mainWindow?.loadURL(`http://127.0.0.1:${PORT}`).catch((e) => startupLog(`[Electron] Retry loadURL error: ${e.message}`));
                }, 2000);
            }
            else {
                startupLog('[Electron] Max retries reached — giving up');
                electron_1.dialog.showErrorBox('Page Load Failed', `Could not load the app from http://127.0.0.1:${PORT}\n\nCheck logs at:\n${logPath}`);
                electron_1.app.quit();
            }
        });
        mainWindow.webContents.on('did-finish-load', () => {
            startupLog('[Electron] Page loaded successfully ✓');
            loadRetries = 0;
        });
        mainWindow.on('maximize', () => mainWindow?.webContents.send('maximize-changed', true));
        mainWindow.on('unmaximize', () => mainWindow?.webContents.send('maximize-changed', false));
        mainWindow.on('closed', () => { mainWindow = null; });
        const url = `http://127.0.0.1:${PORT}`;
        if (isDev) {
            startupLog(`[Electron] Dev mode — loading ${url}`);
            await mainWindow.loadURL(url).catch((e) => startupLog(`[Electron] Dev loadURL error: ${e.message}`));
            mainWindow.webContents.openDevTools();
        }
        else {
            // Server is already confirmed ready before createWindow() is called
            startupLog(`[Electron] Loading ${url}`);
            await mainWindow.loadURL(url).catch((e) => startupLog(`[Electron] loadURL error: ${e.message}`));
        }
    }
    // ─────────────────────────────────────────────
    // 8. APP LIFECYCLE
    // ─────────────────────────────────────────────
    electron_1.app.whenReady().then(async () => {
        // ── Load .env from all likely Windows locations ──
        dotenv.config(); // dev: project root
        dotenv.config({ path: path.join(process.resourcesPath, '.env') }); // resources\.env
        dotenv.config({ path: path.join(path.dirname(electron_1.app.getPath('exe')), '.env') }); // next to .exe
        dotenv.config({ path: path.join(electron_1.app.getPath('userData'), '.env') }); // AppData override
        startupLog(`[ENV] NEXT_PUBLIC_SUPABASE_URL present:    ${!!process.env.NEXT_PUBLIC_SUPABASE_URL}`);
        startupLog(`[ENV] SUPABASE_SERVICE_ROLE_KEY present: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);
        startupLog(`[ENV] SENTRY_DSN present:                ${!!process.env.SENTRY_DSN}`);
        // ── Validate required env vars BEFORE spawning anything ──
        const REQUIRED_ENV = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
        const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
        if (missing.length > 0) {
            electron_1.dialog.showErrorBox('Missing Configuration', `The following required environment variables are missing:\n\n` +
                `  ${missing.join('\n  ')}\n\n` +
                `Place a .env file in one of these locations:\n` +
                `  • Next to Noxis.exe\n` +
                `  • ${process.resourcesPath}\\.env\n` +
                `  • ${electron_1.app.getPath('userData')}\\.env`);
            electron_1.app.quit();
            return;
        }
        // ── Sentry (after env is loaded) ──
        if (process.env.SENTRY_DSN) {
            Sentry.init({ dsn: process.env.SENTRY_DSN });
        }
        process.on('uncaughtException', (error) => {
            startupLog(`[CRITICAL] Uncaught Exception: ${error.message}`);
            if (error.stack)
                startupLog(error.stack);
            Sentry.captureException(error);
            // Don't quit immediately — let Sentry flush and maybe show a dialog if critical
        });
        process.on('unhandledRejection', (reason, promise) => {
            startupLog(`[CRITICAL] Unhandled Rejection at: ${promise} reason: ${reason}`);
            Sentry.captureException(reason instanceof Error ? reason : new Error(String(reason)));
        });
        // ── Find available port ──
        PORT = await findAvailablePort(PORT);
        startupLog(`[Electron] Resolved port: ${PORT}`);
        startupLog(`[Electron] userData: ${electron_1.app.getPath('userData')}`);
        startupLog(`[Electron] resourcesPath: ${process.resourcesPath}`);
        // ── Spawn Next.js standalone server (production only) ──
        if (!isDev) {
            const serverPath = path.join(process.resourcesPath, 'standalone', 'server.js');
            startupLog(`[Electron] Standalone server path: ${serverPath}`);
            if (!fs.existsSync(serverPath)) {
                startupLog('[Electron] FATAL: standalone server.js not found');
                electron_1.dialog.showErrorBox('Initialization Error', `Standalone server not found at:\n${serverPath}\n\nPlease reinstall the application.`);
                electron_1.app.quit();
                return;
            }
            const userDataPath = electron_1.app.getPath('userData');
            fs.mkdirSync(userDataPath, { recursive: true });
            let serverErrorOutput = '';
            startupLog('[Electron] Spawning Next.js server...');
            nextServer = (0, child_process_1.spawn)(process.execPath, [serverPath], {
                env: {
                    ...process.env,
                    PORT: String(PORT),
                    NODE_ENV: 'production',
                    ELECTRON_USER_DATA: userDataPath,
                    ELECTRON_RESOURCES: process.resourcesPath,
                    ELECTRON_RUN_AS_NODE: '1',
                    ELECTRON_DB_KEY: (0, dbKeyManager_1.deriveDbKey)(process.env.USER_ID || 'SYSTEM'),
                    // Explicitly forward critical keys — don't rely solely on spread
                    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
                    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
                    NODE_PATH: [
                        path.join(process.resourcesPath, 'app.asar', 'node_modules'),
                        path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules'),
                        path.join(process.resourcesPath, 'standalone', 'node_modules'),
                    ].join(path.delimiter),
                },
                stdio: 'pipe',
            });
            nextServer.stdout?.on('data', (d) => startupLog(`[Next.js] ${d.toString().trim()}`));
            nextServer.stderr?.on('data', (d) => {
                const msg = d.toString().trim();
                startupLog(`[Next.js ERR] ${msg}`);
                serverErrorOutput += msg + '\n';
            });
            nextServer.on('error', (err) => {
                startupLog(`[Next.js] Spawn error: ${err.message}`);
                electron_1.dialog.showErrorBox('Server Error', `Failed to start server:\n${err.message}`);
            });
            nextServer.on('exit', (code) => {
                startupLog(`[Next.js] Exited with code: ${code}`);
                if (code !== 0 && code !== null) {
                    electron_1.dialog.showErrorBox('Server Crashed', `Background server exited with code ${code}.\n\nLast errors:\n${serverErrorOutput.slice(-500)}`);
                }
                nextServer = null;
            });
            // ── Wait for server BEFORE creating window ──
            try {
                startupLog('[Electron] Waiting for Next.js to be ready...');
                await waitForNextJS(PORT, 120);
                startupLog('[Electron] Server ready ✓');
            }
            catch (err) {
                startupLog(`[Electron] Server never became ready: ${err.message}`);
                electron_1.dialog.showErrorBox('Startup Timeout', `The app server did not start on port ${PORT}.\n\nCheck logs at:\n${logPath}`);
                electron_1.app.quit();
                return;
            }
        }
        // ── Create window (server is guaranteed ready at this point) ──
        startupLog('[Electron] Creating window...');
        await createWindow();
        if (mainWindow) {
            setupAutoUpdater(mainWindow);
        }
        // ── Start vision engine ──
        spawnVisionEngine();
    });
    // Windows: closing all windows = quit app (no darwin exception needed)
    electron_1.app.on('window-all-closed', () => electron_1.app.quit());
    // ── Cleanup everything on quit ──
    electron_1.app.on('before-quit', () => {
        startupLog('[Electron] Shutting down...');
        if (sessionTimeoutTimer)
            clearTimeout(sessionTimeoutTimer);
        if (warningTimer)
            clearTimeout(warningTimer);
        if (visionProcess) {
            startupLog('[Vision] Killing vision process...');
            killProcess(visionProcess, 'Vision Engine');
            visionProcess = null;
        }
        if (nextServer) {
            startupLog('[Next.js] Killing server process...');
            killProcess(nextServer, 'Next.js Server');
            nextServer = null;
        }
        startupLog('[Electron] Shutdown complete ✓');
    });
} // end gotTheLock
