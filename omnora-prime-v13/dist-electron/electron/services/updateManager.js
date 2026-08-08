"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAutoUpdater = initAutoUpdater;
exports.checkForUpdates = checkForUpdates;
exports.installUpdate = installUpdate;
exports.registerUpdateIPC = registerUpdateIPC;
const electron_updater_1 = require("electron-updater");
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
let mainWindow = null;
function startupLog(msg) {
    try {
        electron_log_1.default.info(msg);
    }
    catch { }
}
function initAutoUpdater(win) {
    mainWindow = win;
    // Configure updater
    electron_updater_1.autoUpdater.autoDownload = true;
    // Downloads automatically in background
    // User is notified only when ready to install
    electron_updater_1.autoUpdater.autoInstallOnAppQuit = false;
    // We handle the install manually so we can save state first
    electron_updater_1.autoUpdater.allowPrerelease = false;
    // Only stable releases by default
    // Check for updates every 4 hours while the app is running
    setInterval(() => {
        checkForUpdates();
    }, 4 * 60 * 60 * 1000);
    // Also check 30 seconds after launch (let app load first)
    setTimeout(() => {
        checkForUpdates();
    }, 30 * 1000);
    // ── EVENTS ──
    electron_updater_1.autoUpdater.on('checking-for-update', () => {
        startupLog('[UPDATE] Checking for update...');
        mainWindow?.webContents.send('update:checking');
    });
    electron_updater_1.autoUpdater.on('update-available', (info) => {
        startupLog(`[UPDATE] Available: v${info.version}`);
        mainWindow?.webContents.send('update:available', {
            version: info.version,
            releaseNotes: info.releaseNotes,
            releaseDate: info.releaseDate,
        });
    });
    electron_updater_1.autoUpdater.on('update-not-available', () => {
        startupLog('[UPDATE] Already up to date');
        mainWindow?.webContents.send('update:not-available');
    });
    electron_updater_1.autoUpdater.on('download-progress', (progress) => {
        const pct = Math.round(progress.percent);
        startupLog(`[UPDATE] Downloading: ${pct}%`);
        mainWindow?.webContents.send('update:progress', {
            percent: pct,
            transferred: progress.transferred,
            total: progress.total,
            bytesPerSecond: progress.bytesPerSecond,
        });
    });
    electron_updater_1.autoUpdater.on('update-downloaded', (info) => {
        startupLog(`[UPDATE] Downloaded: v${info.version}`);
        mainWindow?.webContents.send('update:downloaded', {
            version: info.version,
            releaseNotes: info.releaseNotes,
        });
    });
    electron_updater_1.autoUpdater.on('error', (err) => {
        startupLog(`[UPDATE] Error: ${err.message}`);
        mainWindow?.webContents.send('update:error', err.message);
    });
}
function checkForUpdates() {
    try {
        electron_updater_1.autoUpdater.checkForUpdates();
    }
    catch (err) {
        startupLog(`[UPDATE] Check failed: ${err.message}`);
    }
}
function installUpdate() {
    mainWindow?.webContents.send('app:save-state-for-update');
    setTimeout(() => {
        electron_updater_1.autoUpdater.quitAndInstall(false, // isSilent: false = show progress
        true // isForceRunAfter: relaunch after
        );
    }, 1000);
}
// IPC handlers
function registerUpdateIPC() {
    electron_1.ipcMain.handle('update:check', () => {
        checkForUpdates();
        return { ok: true };
    });
    electron_1.ipcMain.handle('update:install', () => {
        installUpdate();
    });
    electron_1.ipcMain.handle('update:getChannel', () => {
        return electron_updater_1.autoUpdater.channel || 'stable';
    });
    electron_1.ipcMain.handle('update:setChannel', (_, channel) => {
        electron_updater_1.autoUpdater.channel = channel;
        electron_updater_1.autoUpdater.allowPrerelease = channel === 'beta';
        return { ok: true };
    });
}
