"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose safe IPC channels to the renderer
electron_1.contextBridge.exposeInMainWorld('electron', {
    session: {
        userActivity: () => electron_1.ipcRenderer.send('user-activity'),
        staySignedIn: () => electron_1.ipcRenderer.send('stay-signed-in'),
        onWarning: (callback) => {
            const listener = () => callback();
            electron_1.ipcRenderer.on('session-expiring-warning', listener);
            return () => electron_1.ipcRenderer.removeListener('session-expiring-warning', listener);
        },
        onTimeout: (callback) => {
            const listener = () => callback();
            electron_1.ipcRenderer.on('session-timeout-logout', listener);
            return () => electron_1.ipcRenderer.removeListener('session-timeout-logout', listener);
        }
    },
    fileMorph: {
        compressImages: (files) => electron_1.ipcRenderer.invoke('compress-images', files),
        convertHeic: (files) => electron_1.ipcRenderer.invoke('convert-heic', files)
    },
    invoke: (channel, ...args) => electron_1.ipcRenderer.invoke(channel, ...args),
    onLicenseExpired: (callback) => {
        const listener = () => callback();
        electron_1.ipcRenderer.on('license-expired', listener);
        return () => electron_1.ipcRenderer.removeListener('license-expired', listener);
    }
});
electron_1.contextBridge.exposeInMainWorld('electronWindow', {
    minimize: () => electron_1.ipcRenderer.send('window-minimize'),
    maximize: () => electron_1.ipcRenderer.send('window-maximize'),
    close: () => electron_1.ipcRenderer.send('window-close'),
    isMaximized: () => electron_1.ipcRenderer.invoke('window-is-maximized'),
    onMaximizeChange: (cb) => {
        const listener = (_, isMax) => cb(isMax);
        electron_1.ipcRenderer.on('maximize-changed', listener);
        return () => electron_1.ipcRenderer.removeListener('maximize-changed', listener);
    },
    // Auto-updater
    onUpdateAvailable: (cb) => {
        const listener = (_, info) => cb(info);
        electron_1.ipcRenderer.on('update-available', listener);
        return () => electron_1.ipcRenderer.removeListener('update-available', listener);
    },
    onUpdateProgress: (cb) => {
        const listener = (_, p) => cb(p);
        electron_1.ipcRenderer.on('update-progress', listener);
        return () => electron_1.ipcRenderer.removeListener('update-progress', listener);
    },
    onUpdateDownloaded: (cb) => {
        const listener = (_, info) => cb(info);
        electron_1.ipcRenderer.on('update-downloaded', listener);
        return () => electron_1.ipcRenderer.removeListener('update-downloaded', listener);
    },
    checkForUpdates: () => electron_1.ipcRenderer.invoke('check-for-updates'),
    installUpdate: () => electron_1.ipcRenderer.invoke('install-update')
});
