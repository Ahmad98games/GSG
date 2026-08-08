import { autoUpdater, type UpdateInfo } from 'electron-updater'
import { BrowserWindow, ipcMain } from 'electron'
import log from 'electron-log'

let mainWindow: BrowserWindow | null = null

function startupLog(msg: string): void {
  try {
    log.info(msg)
  } catch {}
}

export function initAutoUpdater(win: BrowserWindow): void {
  mainWindow = win

  // Configure updater
  autoUpdater.autoDownload = true
  // Downloads automatically in background
  // User is notified only when ready to install

  autoUpdater.autoInstallOnAppQuit = false
  // We handle the install manually so we can save state first

  autoUpdater.allowPrerelease = false
  // Only stable releases by default

  // Check for updates every 4 hours while the app is running
  setInterval(() => {
    checkForUpdates()
  }, 4 * 60 * 60 * 1000)

  // Also check 30 seconds after launch (let app load first)
  setTimeout(() => {
    checkForUpdates()
  }, 30 * 1000)

  // ── EVENTS ──

  autoUpdater.on('checking-for-update', () => {
    startupLog('[UPDATE] Checking for update...')
    mainWindow?.webContents.send('update:checking')
  })

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    startupLog(`[UPDATE] Available: v${info.version}`)
    mainWindow?.webContents.send('update:available', {
      version: info.version,
      releaseNotes: info.releaseNotes,
      releaseDate: info.releaseDate,
    })
  })

  autoUpdater.on('update-not-available', () => {
    startupLog('[UPDATE] Already up to date')
    mainWindow?.webContents.send('update:not-available')
  })

  autoUpdater.on('download-progress', (progress) => {
    const pct = Math.round(progress.percent)
    startupLog(`[UPDATE] Downloading: ${pct}%`)
    mainWindow?.webContents.send('update:progress', {
      percent: pct,
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond,
    })
  })

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    startupLog(`[UPDATE] Downloaded: v${info.version}`)
    mainWindow?.webContents.send('update:downloaded', {
      version: info.version,
      releaseNotes: info.releaseNotes,
    })
  })

  autoUpdater.on('error', (err) => {
    startupLog(`[UPDATE] Error: ${err.message}`)
    mainWindow?.webContents.send('update:error', err.message)
  })
}

export function checkForUpdates(): void {
  try {
    autoUpdater.checkForUpdates()
  } catch (err: any) {
    startupLog(`[UPDATE] Check failed: ${err.message}`)
  }
}

export function installUpdate(): void {
  mainWindow?.webContents.send('app:save-state-for-update')

  setTimeout(() => {
    autoUpdater.quitAndInstall(
      false, // isSilent: false = show progress
      true   // isForceRunAfter: relaunch after
    )
  }, 1000)
}

// IPC handlers
export function registerUpdateIPC(): void {
  ipcMain.handle('update:check', () => {
    checkForUpdates()
    return { ok: true }
  })

  ipcMain.handle('update:install', () => {
    installUpdate()
  })

  ipcMain.handle('update:getChannel', () => {
    return autoUpdater.channel || 'stable'
  })

  ipcMain.handle('update:setChannel', (_, channel: 'stable' | 'beta') => {
    autoUpdater.channel = channel
    autoUpdater.allowPrerelease = channel === 'beta'
    return { ok: true }
  })
}
