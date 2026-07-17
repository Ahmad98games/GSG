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
