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

// Data Sovereignty API — lets the renderer ask where data lives on disk
contextBridge.exposeInMainWorld('electronAPI', {
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),
  setConfig: (key: string, value: string) => ipcRenderer.invoke('set-config', key, value),
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
