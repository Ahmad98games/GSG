/**
 * Noxis Hub — Industrial Weighbridge & Scale RS-232 Service
 *
 * Runs in the Electron main process (Node.js).
 * Provides resilient background COM / Serial port monitoring, persistent auto-reconnection,
 * real-time weight streaming, and industrial-grade multi-protocol regex parsing
 * (Yaohua XK3190 series, Mettler Toledo, Avery Weigh-Tronix, Prolific/FTDI USB-to-RS232).
 */

import { ipcMain, BrowserWindow } from 'electron';
import log from 'electron-log';

export interface ScaleWeightPayload {
  weight: number;
  unit: string;
  raw: string;
  port?: string;
  timestamp: number;
}

export interface ScaleStatus {
  connected: boolean;
  portPath: string | null;
  baudRate: number;
  lastReading: ScaleWeightPayload | null;
  error?: string | null;
}

let activePort: any = null;
let activePortPath: string | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let incomingDataBuffer = '';
let lastParsedReading: ScaleWeightPayload | null = null;
let isServiceRunning = false;

/**
 * Robust Multi-Protocol Industrial Weighbridge Parser
 * Handles:
 * 1. Standard suffix formats: "0044.50 KG", "+00123.50 kg", "123.45Kg"
 * 2. Yaohua XK3190 / Continuous format: "=00123.50(kg)", "=0012.30", "+00123.50(kg)"
 * 3. Mettler Toledo / Avery Weigh-Tronix: "ST,GS,+  1234.50 kg", "WN00123.50kg", "  123.45 kg G"
 * 4. Raw numeric packets ending with \r\n or \r: "00123.45\r\n", "+1234.5\r"
 */
export function parseIndustrialWeight(rawChunk: string): ScaleWeightPayload | null {
  if (!rawChunk || typeof rawChunk !== 'string') return null;

  // 1. Explicit Unit Match: e.g. "ST,GS,+  1234.50 kg", "+00123.50 KG", "=0044.50(kg)"
  const unitRegex = /([+-]?\s*\d+\.?\d*)\s*(?:\([kK][gG]\)|[kK][gG]\b)/;
  const unitMatch = rawChunk.match(unitRegex);
  if (unitMatch && unitMatch[1]) {
    const cleanNumStr = unitMatch[1].replace(/\s+/g, '');
    const num = parseFloat(cleanNumStr);
    if (!isNaN(num)) {
      return {
        weight: num,
        unit: 'KG',
        raw: unitMatch[0].trim(),
        timestamp: Date.now(),
      };
    }
  }

  // 2. Yaohua XK3190 / Toledo formatted prefix: e.g., "WN00123.50", "=00123.50"
  const prefixRegex = /(?:WN|=|ST,GS,|\b)([+-]?\s*\d+\.\d{1,3})\b/i;
  const prefixMatch = rawChunk.match(prefixRegex);
  if (prefixMatch && prefixMatch[1]) {
    const cleanNumStr = prefixMatch[1].replace(/\s+/g, '');
    const num = parseFloat(cleanNumStr);
    if (!isNaN(num) && num >= 0) {
      return {
        weight: num,
        unit: 'KG',
        raw: prefixMatch[0].trim(),
        timestamp: Date.now(),
      };
    }
  }

  // 3. Raw numeric chunk terminating with CR / LF
  const rawLineRegex = /(?:^|[\r\n])\s*([+-]?\d+\.?\d{1,3})\s*(?:[\r\n]+|$)/;
  const lineMatch = rawChunk.match(rawLineRegex);
  if (lineMatch && lineMatch[1]) {
    const cleanNumStr = lineMatch[1].trim();
    const num = parseFloat(cleanNumStr);
    if (!isNaN(num) && num > 0) {
      return {
        weight: num,
        unit: 'KG',
        raw: cleanNumStr,
        timestamp: Date.now(),
      };
    }
  }

  return null;
}

/**
 * Safely imports the SerialPort module with graceful degradation
 */
function getSerialPortModule(): any | null {
  try {
    const { SerialPort } = require('serialport');
    return SerialPort;
  } catch (err: any) {
    log.warn('[ScaleService] Dynamic serialport import failed. Native binary might not be compiled:', err?.message || err);
    return null;
  }
}

/**
 * Scans connected COM / TTY ports and finds matching scale adapters
 */
async function findPotentialScalePort(SerialPort: any): Promise<any | null> {
  try {
    const ports = await SerialPort.list();
    if (!ports || ports.length === 0) return null;

    // Prioritize known industrial USB-Serial chipsets commonly used in Pakistan weighbridges
    const matched = ports.find((p: any) => {
      const desc = `${p.manufacturer || ''} ${p.pnpId || ''} ${p.friendlyName || ''}`.toLowerCase();
      const path = (p.path || '').toUpperCase();
      return (
        desc.includes('prolific') ||
        desc.includes('ftdi') ||
        desc.includes('ch340') ||
        desc.includes('ch341') ||
        desc.includes('silicon labs') ||
        desc.includes('cp210') ||
        path.includes('COM') ||
        path.includes('TTYUSB') ||
        path.includes('TTYACM')
      );
    });

    return matched || ports[0];
  } catch (e: any) {
    log.warn('[ScaleService] Port scan error:', e.message);
    return null;
  }
}

/**
 * Connects to the scale serial port and registers continuous stream listeners
 */
async function connectToScale(
  SerialPort: any,
  portPath: string,
  getMainWindow: () => BrowserWindow | null
): Promise<boolean> {
  try {
    if (activePort && activePort.isOpen) {
      try { activePort.close(); } catch {}
    }

    log.info(`[ScaleService] Connecting to scale on ${portPath} @ 9600 baud...`);

    activePort = new SerialPort({
      path: portPath,
      baudRate: 9600,
      autoOpen: true,
    });

    activePortPath = portPath;
    incomingDataBuffer = '';

    activePort.on('open', () => {
      log.info(`[ScaleService] Serial port ${portPath} successfully opened.`);
      const win = getMainWindow();
      if (win && !win.isDestroyed()) {
        win.webContents.send('scale:status', {
          connected: true,
          portPath,
        });
      }
    });

    activePort.on('data', (chunk: Buffer) => {
      const chunkStr = chunk.toString();
      incomingDataBuffer += chunkStr;

      // Sliding window: keep last 512 bytes to prevent memory growth
      if (incomingDataBuffer.length > 512) {
        incomingDataBuffer = incomingDataBuffer.slice(-256);
      }

      const parsed = parseIndustrialWeight(incomingDataBuffer);
      if (parsed) {
        lastParsedReading = { ...parsed, port: portPath };

        const win = getMainWindow();
        if (win && !win.isDestroyed()) {
          win.webContents.send('scale:weight-stream', lastParsedReading);
        }
      }
    });

    activePort.on('error', (err: any) => {
      log.warn(`[ScaleService] Port [${portPath}] error:`, err?.message || err);
      handleDisconnect(getMainWindow);
    });

    activePort.on('close', () => {
      log.info(`[ScaleService] Port [${portPath}] closed.`);
      handleDisconnect(getMainWindow);
    });

    return true;
  } catch (err: any) {
    log.warn(`[ScaleService] Failed to open port ${portPath}:`, err?.message || err);
    activePort = null;
    activePortPath = null;
    return false;
  }
}

function handleDisconnect(getMainWindow: () => BrowserWindow | null): void {
  activePort = null;
  activePortPath = null;
  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send('scale:status', {
      connected: false,
      portPath: null,
    });
  }
}

/**
 * Main Scale Service Initialization & IPC Registration
 */
export function registerScaleService(getMainWindow: () => BrowserWindow | null): void {
  if (isServiceRunning) return;
  isServiceRunning = true;

  const SerialPort = getSerialPortModule();

  // Background Auto-Reconnection Loop (Runs every 4 seconds)
  const pollAndConnect = async () => {
    if (!SerialPort) return;
    if (activePort && activePort.isOpen) return;

    try {
      const scalePort = await findPotentialScalePort(SerialPort);
      if (scalePort && scalePort.path) {
        await connectToScale(SerialPort, scalePort.path, getMainWindow);
      }
    } catch (err: any) {
      log.warn('[ScaleService] Background scan error:', err.message);
    }
  };

  // Kickoff discovery and schedule recurring health check
  pollAndConnect();
  reconnectTimer = setInterval(pollAndConnect, 4000);

  // ── IPC Handler: fetchScaleWeight (Instant cache read with on-demand fallback) ──
  ipcMain.handle('fetchScaleWeight', async () => {
    try {
      // 1. If we have a fresh reading (< 3 seconds old), return it immediately
      if (lastParsedReading && Date.now() - lastParsedReading.timestamp < 3000) {
        return {
          success: true,
          weight: lastParsedReading.weight,
          unit: lastParsedReading.unit,
          port: lastParsedReading.port,
          cached: true,
        };
      }

      // 2. If port is active and open, wait briefly (up to 2000ms) for next packet
      if (activePort && activePort.isOpen) {
        return await new Promise((resolve) => {
          let checkInterval: NodeJS.Timeout | null = null;
          const timeout = setTimeout(() => {
            if (checkInterval) clearInterval(checkInterval);
            if (lastParsedReading) {
              resolve({
                success: true,
                weight: lastParsedReading.weight,
                unit: lastParsedReading.unit,
                port: activePortPath,
              });
            } else {
              resolve({
                success: false,
                reason: 'Weighbridge timeout: No reading received from scale',
              });
            }
          }, 2000);

          checkInterval = setInterval(() => {
            if (lastParsedReading && Date.now() - lastParsedReading.timestamp < 1500) {
              if (checkInterval) clearInterval(checkInterval);
              clearTimeout(timeout);
              resolve({
                success: true,
                weight: lastParsedReading.weight,
                unit: lastParsedReading.unit,
                port: activePortPath,
              });
            }
          }, 100);
        });
      }

      // 3. Fallback: Try one-shot direct port scan if not yet active
      if (!SerialPort) {
        return {
          success: false,
          reason: 'SerialPort driver not installed or supported on this system',
        };
      }

      const candidatePort = await findPotentialScalePort(SerialPort);
      if (!candidatePort) {
        return {
          success: false,
          reason: 'No weighbridge or RS-232 serial adapter detected',
        };
      }

      await connectToScale(SerialPort, candidatePort.path, getMainWindow);

      // Wait 1.5 seconds for first packet
      await new Promise((r) => setTimeout(r, 1500));

      if (lastParsedReading) {
        return {
          success: true,
          weight: lastParsedReading.weight,
          unit: lastParsedReading.unit,
          port: candidatePort.path,
        };
      }

      return {
        success: false,
        reason: 'Weighbridge connected but no valid weight characters received',
      };
    } catch (err: any) {
      log.error('[ScaleService] fetchScaleWeight error:', err?.message || err);
      return {
        success: false,
        reason: err?.message || 'Scale communication failure',
      };
    }
  });

  // ── IPC Handler: scale:get-status ───────────────────────────────────────────
  ipcMain.handle('scale:get-status', (): ScaleStatus => {
    return {
      connected: !!(activePort && activePort.isOpen),
      portPath: activePortPath,
      baudRate: 9600,
      lastReading: lastParsedReading,
    };
  });
}

/**
 * Clean shutdown for scale service
 */
export function stopScaleService(): void {
  if (reconnectTimer) {
    clearInterval(reconnectTimer);
    reconnectTimer = null;
  }
  if (activePort) {
    try { activePort.close(); } catch {}
    activePort = null;
  }
  activePortPath = null;
  isServiceRunning = false;
}

