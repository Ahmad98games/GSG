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
const bridgeListeners = new Map();
// Data Sovereignty API — lets the renderer ask where data lives on disk
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    getAppDataPath: () => electron_1.ipcRenderer.invoke('get-app-data-path'),
    fetchScaleWeight: () => electron_1.ipcRenderer.invoke('fetchScaleWeight'),
    setConfig: (key, value) => electron_1.ipcRenderer.invoke('set-config', key, value),
    getBridgeStatus: () => electron_1.ipcRenderer.invoke('get-bridge-status'),
    on: (channel, callback) => {
        const subscription = (_event, ...args) => callback(_event, ...args);
        bridgeListeners.set(callback, subscription);
        electron_1.ipcRenderer.on(channel, subscription);
    },
    off: (channel, callback) => {
        const subscription = bridgeListeners.get(callback);
        if (subscription) {
            electron_1.ipcRenderer.removeListener(channel, subscription);
            bridgeListeners.delete(callback);
        }
    },
    // Update control
    checkForUpdates: () => electron_1.ipcRenderer.invoke('check-for-updates'),
    downloadUpdate: () => electron_1.ipcRenderer.invoke('download-update'),
    installUpdate: () => electron_1.ipcRenderer.invoke('install-update'),
    getUpdateStatus: () => electron_1.ipcRenderer.invoke('get-update-status'),
    setUpdateChannel: (channel) => electron_1.ipcRenderer.invoke('set-update-channel', channel),
    // Listen for update events
    onUpdateStatus: (callback) => {
        const listener = (_, data) => callback(data);
        electron_1.ipcRenderer.on('update-status', listener);
        return () => {
            electron_1.ipcRenderer.removeListener('update-status', listener);
        };
    },
    getTunnelUrl: () => electron_1.ipcRenderer.invoke('get-tunnel-url'),
    onTunnelReady: (callback) => {
        const listener = (_, data) => callback(data);
        electron_1.ipcRenderer.on('tunnel-ready', listener);
        return () => {
            electron_1.ipcRenderer.removeListener('tunnel-ready', listener);
        };
    },
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
// ── CCTV / Camera Management API ──────────────────────────────────────────
electron_1.contextBridge.exposeInMainWorld('cctv', {
    // Discover cameras on the local network (ONVIF WS-Discovery + TCP scan)
    discover: () => electron_1.ipcRenderer.invoke('cctv:discover'),
    // Fetch full camera details via ONVIF after user provides credentials
    getDetails: (params) => electron_1.ipcRenderer.invoke('cctv:getDetails', params),
    // Encrypt password before saving to database (never store plaintext)
    encryptPassword: (password) => electron_1.ipcRenderer.invoke('cctv:encryptPassword', password),
    // Quick connectivity test (returns boolean)
    testConnection: (params) => electron_1.ipcRenderer.invoke('cctv:testConnection', params),
    // Grab a still image snapshot from a camera
    getSnapshot: (params) => electron_1.ipcRenderer.invoke('cctv:getSnapshot', params),
    // Start mediamtx WebRTC streams for the active camera list
    startStreams: (cameras) => electron_1.ipcRenderer.invoke('cctv:startStreams', cameras),
    // Get the WebRTC URL for a specific camera
    getWebRtcUrl: (cameraId) => electron_1.ipcRenderer.invoke('cctv:getWebRtcUrl', cameraId),
    // Stop all mediamtx streams
    stopStreams: () => electron_1.ipcRenderer.invoke('cctv:stopStreams'),
    // Check if mediamtx is currently running
    isStreamingActive: () => electron_1.ipcRenderer.invoke('cctv:isStreamingActive'),
});
