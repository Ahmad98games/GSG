import { contextBridge, ipcRenderer } from 'electron';

// Expose safe IPC channels to the renderer
contextBridge.exposeInMainWorld('electron', {
  session: {
    userActivity: () => ipcRenderer.send('user-activity'),
    staySignedIn: () => ipcRenderer.send('stay-signed-in'),
    onWarning: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('session-expiring-warning', listener);
      return () => ipcRenderer.removeListener('session-expiring-warning', listener);
    },
    onTimeout: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('session-timeout-logout', listener);
      return () => ipcRenderer.removeListener('session-timeout-logout', listener);
    }
  },
  fileMorph: {
    compressImages: (files: any) => ipcRenderer.invoke('compress-images', files),
    convertHeic: (files: any) => ipcRenderer.invoke('convert-heic', files)
  },
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  onLicenseExpired: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('license-expired', listener);
    return () => ipcRenderer.removeListener('license-expired', listener);
  }
});

const bridgeListeners = new Map<any, any>();

// Data Sovereignty API — lets the renderer ask where data lives on disk
contextBridge.exposeInMainWorld('electronAPI', {
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),
  fetchScaleWeight: () => ipcRenderer.invoke('fetchScaleWeight'),
  setConfig: (key: string, value: string) => ipcRenderer.invoke('set-config', key, value),
  getBridgeStatus: () => ipcRenderer.invoke('get-bridge-status'),
  on: (channel: string, callback: (...args: any[]) => void) => {
    const subscription = (_event: any, ...args: any[]) => callback(_event, ...args);
    bridgeListeners.set(callback, subscription);
    ipcRenderer.on(channel, subscription);
  },
  off: (channel: string, callback: (...args: any[]) => void) => {
    const subscription = bridgeListeners.get(callback);
    if (subscription) {
      ipcRenderer.removeListener(channel, subscription);
      bridgeListeners.delete(callback);
    }
  },
  // Update control
  checkForUpdates: () =>
    ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () =>
    ipcRenderer.invoke('download-update'),
  installUpdate: () =>
    ipcRenderer.invoke('install-update'),
  getUpdateStatus: () =>
    ipcRenderer.invoke('get-update-status'),
  setUpdateChannel: (channel: string) =>
    ipcRenderer.invoke('set-update-channel', channel),

  // Listen for update events
  onUpdateStatus: (callback: (data: any) => void) => {
    const listener = (_: any, data: any) => callback(data);
    ipcRenderer.on('update-status', listener);
    return () => {
      ipcRenderer.removeListener('update-status', listener);
    };
  },

  getTunnelUrl: () =>
    ipcRenderer.invoke('get-tunnel-url'),
  onTunnelReady: (callback: (data: any) => void) => {
    const listener = (_: any, data: any) => callback(data);
    ipcRenderer.on('tunnel-ready', listener);
    return () => {
      ipcRenderer.removeListener('tunnel-ready', listener);
    };
  },
  store: {
    saveSession: (session: any) =>
      ipcRenderer.invoke('store:saveSession', session),
    getSession: () =>
      ipcRenderer.invoke('store:getSession'),
    clearSession: () =>
      ipcRenderer.invoke('store:clearSession'),
    savePinHash: (hash: string) =>
      ipcRenderer.invoke('store:savePinHash', hash),
    getPinHash: () =>
      ipcRenderer.invoke('store:getPinHash'),
    disableAppLock: () =>
      ipcRenderer.invoke('store:disableAppLock'),
    isAppLockEnabled: () =>
      ipcRenderer.invoke('store:isAppLockEnabled'),
    getLockTimeout: () =>
      ipcRenderer.invoke('store:getLockTimeout'),
    setLockTimeout: (m: number) =>
      ipcRenderer.invoke('store:setLockTimeout', m),
    saveLastRoute: (r: string) =>
      ipcRenderer.invoke('store:saveLastRoute', r),
    getLastRoute: () =>
      ipcRenderer.invoke('store:getLastRoute'),
    saveLastActive: () =>
      ipcRenderer.invoke('store:saveLastActive'),
    getLastActive: () =>
      ipcRenderer.invoke('store:getLastActive'),
    saveFormDraft: (k: string, d: any) =>
      ipcRenderer.invoke('store:saveFormDraft', k, d),
    getFormDraft: (k: string) =>
      ipcRenderer.invoke('store:getFormDraft', k),
    clearFormDraft: (k: string) =>
      ipcRenderer.invoke('store:clearFormDraft', k),
    saveScrollPosition: (r: string, p: number) =>
      ipcRenderer.invoke('store:saveScrollPosition', r, p),
    getScrollPosition: (r: string) =>
      ipcRenderer.invoke('store:getScrollPosition', r),
  },
  autostart: {
    get: () =>
      ipcRenderer.invoke('autostart:get'),
    set: (enabled: boolean) =>
      ipcRenderer.invoke('autostart:set', enabled),
  },
  sync: {
    getLastSyncAt: () =>
      ipcRenderer.invoke('sync:getLastSyncAt'),
    setLastSyncAt: (ts: number) =>
      ipcRenderer.invoke('sync:setLastSyncAt', ts),
  },
  onBridgeEvent: (callback: (event: any, payload: any) => void) => {
    ipcRenderer.on('bridge-event', callback)
  },
  removeBridgeEventListener: () => {
    ipcRenderer.removeAllListeners('bridge-event')
  },
  app: {
    wasAutoStarted: () =>
      ipcRenderer.invoke('app:wasAutoStarted'),
    onAutoStarted: (callback: (data: any) => void) => {
      const listener = (_: any, data: any) => callback(data);
      ipcRenderer.on('app:autostarted', listener);
      return () => ipcRenderer.removeListener('app:autostarted', listener);
    },
  },

  // ── Licensing & HWID ────────────────────────────────────────────────────────
  license: {
    getInfo: () =>
      ipcRenderer.invoke('license:getInfo'),
    activate: (keyString: string) =>
      ipcRenderer.invoke('license:activate', keyString),
    getHWID: () =>
      ipcRenderer.invoke('license:getHWID'),
  },

  // ── Trial Engine ────────────────────────────────────────────────────────────
  trial: {
    getState: () =>
      ipcRenderer.invoke('trial:getState'),
  },

  // ── Khata real-time updates from bridge ─────────────────────────────────────
  onKhataUpdated: (callback: (data: { partyId: string; newBalance: number }) => void) => {
    const listener = (_: any, data: any) => callback(data);
    ipcRenderer.on('ipc:khata-updated', listener);
    return () => ipcRenderer.removeListener('ipc:khata-updated', listener);
  },

  // ── Power-cut recovery signal ───────────────────────────────────────────────
  onPowerCutDetected: (callback: (data: { lastRoute: string; message: string }) => void) => {
    const listener = (_: any, data: any) => callback(data);
    ipcRenderer.on('ipc:power-cut-detected', listener);
    return () => ipcRenderer.removeListener('ipc:power-cut-detected', listener);
  },

  // ── Mobile Hub Messaging API ────────────────────────────────────────────────
  messaging: {
    send: (payload: any) =>
      ipcRenderer.invoke('messaging:send', payload),
    getHistory: (payload: any) =>
      ipcRenderer.invoke('messaging:getHistory', payload),
    renameDevice: (payload: any) =>
      ipcRenderer.invoke('messaging:renameDevice', payload),
    onNewMessage: (cb: (msg: any) => void) =>
      ipcRenderer.on('messaging:new-message', (_, msg) => cb(msg)),
    removeMessageListener: () =>
      ipcRenderer.removeAllListeners('messaging:new-message'),
  },
});

contextBridge.exposeInMainWorld('electronWindow', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => 
    ipcRenderer.invoke('window-is-maximized'),
  onMaximizeChange: (cb: (max: boolean) => void) => {
    const listener = (_: any, isMax: boolean) => cb(isMax);
    ipcRenderer.on('maximize-changed', listener);
    return () => ipcRenderer.removeListener('maximize-changed', listener);
  },
  // Auto-updater
  onUpdateAvailable: (cb: (info: any) => void) => {
    const listener = (_: any, info: any) => cb(info);
    ipcRenderer.on('update-available', listener);
    return () => ipcRenderer.removeListener('update-available', listener);
  },
  onUpdateProgress: (cb: (progress: any) => void) => {
    const listener = (_: any, p: any) => cb(p);
    ipcRenderer.on('update-progress', listener);
    return () => ipcRenderer.removeListener('update-progress', listener);
  },
  onUpdateDownloaded: (cb: (info: any) => void) => {
    const listener = (_: any, info: any) => cb(info);
    ipcRenderer.on('update-downloaded', listener);
    return () => ipcRenderer.removeListener('update-downloaded', listener);
  },
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update')
});

// ── CCTV / Camera Management API ──────────────────────────────────────────
contextBridge.exposeInMainWorld('cctv', {
  // Discover cameras on the local network (ONVIF WS-Discovery + TCP scan)
  discover: () =>
    ipcRenderer.invoke('cctv:discover'),

  // Fetch full camera details via ONVIF after user provides credentials
  getDetails: (params: {
    ip: string; port: number; username: string; password: string;
  }) => ipcRenderer.invoke('cctv:getDetails', params),

  // Encrypt password before saving to database (never store plaintext)
  encryptPassword: (password: string) =>
    ipcRenderer.invoke('cctv:encryptPassword', password),

  // Quick connectivity test (returns boolean)
  testConnection: (params: {
    ip: string; port: number; username: string; passwordEncrypted: string;
  }) => ipcRenderer.invoke('cctv:testConnection', params),

  // Grab a still image snapshot from a camera
  getSnapshot: (params: {
    ip: string; port: number; username: string; passwordEncrypted: string;
  }) => ipcRenderer.invoke('cctv:getSnapshot', params),

  // Start mediamtx WebRTC streams for the active camera list
  startStreams: (cameras: Array<{
    id: string; name: string; rtspUrl: string;
  }>) => ipcRenderer.invoke('cctv:startStreams', cameras),

  // Get the WebRTC URL for a specific camera
  getWebRtcUrl: (cameraId: string) =>
    ipcRenderer.invoke('cctv:getWebRtcUrl', cameraId),

  // Stop all mediamtx streams
  stopStreams: () =>
    ipcRenderer.invoke('cctv:stopStreams'),

  // Check if mediamtx is currently running
  isStreamingActive: () =>
    ipcRenderer.invoke('cctv:isStreamingActive'),
});
