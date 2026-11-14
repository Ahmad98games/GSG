/**
 * Noxis Hub — Hardened Industrial Weighbridge & Scale RS-232 Service
 *
 * Runs in the Electron main process (Node.js).
 * Bulletproof COM/Serial port monitoring, noise filtering, stable-weight gating,
 * and capped auto-reconnection (max 10 retries) with graceful manual entry fallback.
 */

import { ipcMain, BrowserWindow } from 'electron';
import log from 'electron-log';
import { getHardwareSettings } from '../store';

export interface ScaleWeightPayload {
  weight: number;
  unit: string;
  raw: string;
  port?: string;
  timestamp: number;
  stable: boolean;
}

export interface ScaleStatus {
  connected: boolean;
  portPath: string | null;
  baudRate: number;
  lastReading: ScaleWeightPayload | null;
  error?: string | null;
  reconnectAttempts: number;
  maxRetriesExceeded: boolean;
}

let activePort: any = null;
let activePortPath: string | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let incomingDataBuffer = '';
let lastParsedReading: ScaleWeightPayload | null = null;
let lastStableReading: ScaleWeightPayload | null = null;
let isServiceRunning = false;

// ── Hardening State ──
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const recentReadingsWindow: number[] = [];
let lastAcceptedRawWeight: number | null = null;

/**
 * Strict data validation & multi-indicator weighbridge parser:
 * 1. Checks strict ASCII pattern /[\d]+\.[\d]+ KG/i
 * 2. Checks Yaohua XK3190 & Toledo industrial prefixes
 * 3. Enforces weight > 0 (discards zero or negative weights)
 * 4. Filters out sensor noise (discards jumps > 500KG)
 */
export function validateAndParseWeight(
  rawChunk: string,
  filterSpikes: boolean = false
): { weight: number; raw: string } | null {
  if (!rawChunk || typeof rawChunk !== 'string') return null;

  try {
    let candidateWeight: number | null = null;
    let matchedRaw = '';

    // Step 2.1: Strict regex for standard weighbridge format e.g. "0025.40 KG", "+00123.50 KG"
    const strictRegex = /\b(\d+\.?\d*)\s*KG\b/i;
    const strictMatch = rawChunk.match(strictRegex);

    if (strictMatch && strictMatch[1]) {
      const parsed = parseFloat(strictMatch[1]);
      if (!isNaN(parsed)) {
        candidateWeight = parsed;
        matchedRaw = strictMatch[0].trim();
      }
    }

    // Step 2.2: Multi-indicator fallback (Yaohua XK3190, Toledo, Avery Weigh-Tronix)
    if (candidateWeight === null) {
      const industrialRegex = /(?:WN|=|ST,GS,|\b)([+-]?\s*\d+\.\d{1,3})\s*(?:(?:\([kK][gG]\)|[kK][gG]))?/i;
      const indMatch = rawChunk.match(industrialRegex);
      if (indMatch && indMatch[1]) {
        const clean = indMatch[1].replace(/\s+/g, '');
        const parsed = parseFloat(clean);
        if (!isNaN(parsed)) {
          candidateWeight = parsed;
          matchedRaw = indMatch[0].trim();
        }
      }
    }

    // Step 2.3: Raw numeric terminal packet ending with \r\n or \r
    if (candidateWeight === null) {
      const rawLineRegex = /(?:^|[\r\n])\s*([+-]?\d+\.?\d{1,3})\s*(?:[\r\n]+|$)/;
      const lineMatch = rawChunk.match(rawLineRegex);
      if (lineMatch && lineMatch[1]) {
        const clean = lineMatch[1].trim();
        const parsed = parseFloat(clean);
        if (!isNaN(parsed)) {
          candidateWeight = parsed;
          matchedRaw = clean;
        }
      }
    }

    if (candidateWeight === null) return null;

    // Discard zero or negative weights
    if (candidateWeight <= 0) {
      return null;
    }

    // Discard sudden noise jumps greater than 500KG in continuous stream
    if (filterSpikes && lastAcceptedRawWeight !== null && lastAcceptedRawWeight > 0) {
      const delta = Math.abs(candidateWeight - lastAcceptedRawWeight);
      if (delta > 500) {
        log.warn(`[ScaleService] Noise spike rejected: jumped ${delta.toFixed(1)}KG (from ${lastAcceptedRawWeight} to ${candidateWeight})`);
        return null;
      }
    }

    lastAcceptedRawWeight = candidateWeight;
    return { weight: candidateWeight, raw: matchedRaw };
  } catch (err: any) {
    log.warn('[ScaleService] Parse error caught silently:', err?.message || err);
    return null;
  }
}

/**
 * Backwards-compatible parser export for test harnesses and external callers
 */
export function parseIndustrialWeight(rawChunk: string): ScaleWeightPayload | null {
  const parsed = validateAndParseWeight(rawChunk);
  if (!parsed) return null;
  return {
    weight: parsed.weight,
    unit: 'KG',
    raw: parsed.raw,
    timestamp: Date.now(),
    stable: true,
  };
}

/**
 * Stable Reading Check:
 * Only confirms a weight reading after 3 consecutive readings within 0.5KG of each other.
 */
function processStableReading(weight: number): boolean {
  recentReadingsWindow.push(weight);
  if (recentReadingsWindow.length > 3) {
    recentReadingsWindow.shift();
  }

  if (recentReadingsWindow.length < 3) {
    return false;
  }

  const max = Math.max(...recentReadingsWindow);
  const min = Math.min(...recentReadingsWindow);
  return (max - min) <= 0.5;
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

    // Check if user has explicitly saved a COM port in hardware settings
    const savedConfig = getHardwareSettings();
    if (savedConfig.scaleCOMPort) {
      const exactMatch = ports.find((p: any) =>
        (p.path || '').toUpperCase() === savedConfig.scaleCOMPort.toUpperCase()
      );
      if (exactMatch) return exactMatch;
    }

    // Prioritize known industrial USB-Serial chipsets commonly used in weighbridges
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
    log.warn('[ScaleService] Port scan error caught silently:', e.message);
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

    log.info(`[ScaleService] Connecting to weighbridge on ${portPath} (Attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`);

    activePort = new SerialPort({
      path: portPath,
      baudRate: 9600,
      autoOpen: true,
    });

    activePortPath = portPath;
    incomingDataBuffer = '';

    activePort.on('open', () => {
      log.info(`[ScaleService] Weighbridge port ${portPath} opened.`);
      reconnectAttempts = 0; // Reset retry counter on successful connection
      const win = getMainWindow();
      if (win && !win.isDestroyed()) {
        win.webContents.send('scale:status', {
          connected: true,
          portPath,
          error: null,
          reconnectAttempts: 0,
          maxRetriesExceeded: false,
        });
      }
    });

    activePort.on('data', (chunk: Buffer) => {
      try {
        const chunkStr = chunk.toString();
        incomingDataBuffer += chunkStr;

        // Keep last 512 bytes to prevent buffer bloat
        if (incomingDataBuffer.length > 512) {
          incomingDataBuffer = incomingDataBuffer.slice(-256);
        }

        const validated = validateAndParseWeight(incomingDataBuffer, true);
        if (validated) {
          const isStable = processStableReading(validated.weight);

          const payload: ScaleWeightPayload = {
            weight: validated.weight,
            unit: 'KG',
            raw: validated.raw,
            port: portPath,
            timestamp: Date.now(),
            stable: isStable,
          };

          lastParsedReading = payload;
          if (isStable) {
            lastStableReading = payload;
          }

          const win = getMainWindow();
          if (win && !win.isDestroyed()) {
            win.webContents.send('scale:weight-stream', payload);
          }
        }
      } catch (err: any) {
        log.warn('[ScaleService] Error processing data packet caught silently:', err?.message || err);
      }
    });

    activePort.on('error', (err: any) => {
      log.warn(`[ScaleService] Port [${portPath}] error:`, err?.message || err);
      handleDisconnect(getMainWindow, 'Connection interrupted');
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
    handleDisconnect(getMainWindow, err?.message || 'Failed to open serial port');
    return false;
  }
}

function handleDisconnect(getMainWindow: () => BrowserWindow | null, reason?: string): void {
  try {
    if (activePort) {
      try { activePort.close(); } catch {}
      activePort = null;
    }
  } catch {}
  activePortPath = null;
  recentReadingsWindow.length = 0;
  lastAcceptedRawWeight = null;

  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send('scale:status', {
      connected: false,
      portPath: null,
      error: reconnectAttempts >= MAX_RECONNECT_ATTEMPTS
        ? 'Scale offline — enter weight manually'
        : (reason || 'Scale disconnected'),
      reconnectAttempts,
      maxRetriesExceeded: reconnectAttempts >= MAX_RECONNECT_ATTEMPTS,
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

  // ── Auto-Reconnect Loop: Polls every 3 seconds, stops after 10 failures ──
  const pollAndConnect = async () => {
    if (!SerialPort) return;
    if (activePort && activePort.isOpen) return;

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      log.info('[ScaleService] Reconnect limit reached (10/10). Standing down auto-reconnect. Badge: "Scale offline — enter weight manually"');
      if (reconnectTimer) {
        clearInterval(reconnectTimer);
        reconnectTimer = null;
      }
      handleDisconnect(getMainWindow, 'Scale offline — enter weight manually');
      return;
    }

    reconnectAttempts++;
    try {
      const scalePort = await findPotentialScalePort(SerialPort);
      if (scalePort && scalePort.path) {
        await connectToScale(SerialPort, scalePort.path, getMainWindow);
      } else {
        handleDisconnect(getMainWindow, 'No scale port detected');
      }
    } catch (err: any) {
      log.warn('[ScaleService] Background scan error:', err.message);
      handleDisconnect(getMainWindow, err.message);
    }
  };

  // Kickoff discovery and schedule recurring 3000ms check
  pollAndConnect();
  if (!reconnectTimer) {
    reconnectTimer = setInterval(pollAndConnect, 3000);
  }

  // ── IPC Handler: fetchScaleWeight ──────────────────────────────────────────
  ipcMain.handle('fetchScaleWeight', async () => {
    try {
      // 1. Prefer stable reading if fresh (<4s old)
      if (lastStableReading && Date.now() - lastStableReading.timestamp < 4000) {
        return {
          success: true,
          weight: lastStableReading.weight,
          unit: lastStableReading.unit,
          port: lastStableReading.port,
          stable: true,
          cached: true,
        };
      }

      // 2. Fall back to last parsed reading if fresh (<3s old)
      if (lastParsedReading && Date.now() - lastParsedReading.timestamp < 3000) {
        return {
          success: true,
          weight: lastParsedReading.weight,
          unit: lastParsedReading.unit,
          port: lastParsedReading.port,
          stable: lastParsedReading.stable,
          cached: true,
        };
      }

      // 3. If port is connected and open, wait up to 2000ms for incoming stable packet
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
                stable: lastParsedReading.stable,
              });
            } else {
              resolve({
                success: false,
                reason: 'Scale offline — enter weight manually',
                manualFallback: true,
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
                stable: lastParsedReading.stable,
              });
            }
          }, 100);
        });
      }

      // 4. Port is offline or not installed
      return {
        success: false,
        reason: 'Scale offline — enter weight manually',
        manualFallback: true,
      };
    } catch (err: any) {
      log.error('[ScaleService] fetchScaleWeight error caught safely:', err?.message || err);
      return {
        success: false,
        reason: 'Scale offline — enter weight manually',
        manualFallback: true,
      };
    }
  });

  // ── IPC Handler: scale:get-status ───────────────────────────────────────────
  ipcMain.handle('scale:get-status', (): ScaleStatus => {
    return {
      connected: !!(activePort && activePort.isOpen),
      portPath: activePortPath,
      baudRate: 9600,
      lastReading: lastStableReading || lastParsedReading,
      error: reconnectAttempts >= MAX_RECONNECT_ATTEMPTS
        ? 'Scale offline — enter weight manually'
        : (!activePort ? 'Scale not connected' : null),
      reconnectAttempts,
      maxRetriesExceeded: reconnectAttempts >= MAX_RECONNECT_ATTEMPTS,
    };
  });

  // ── IPC Handler: scale:retry-connect ─────────────────────────────────────────
  ipcMain.handle('scale:retry-connect', async () => {
    reconnectAttempts = 0;
    if (reconnectTimer) clearInterval(reconnectTimer);
    reconnectTimer = setInterval(pollAndConnect, 3000);
    await pollAndConnect();
    return {
      connected: !!(activePort && activePort.isOpen),
      portPath: activePortPath,
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
  reconnectAttempts = 0;
}
