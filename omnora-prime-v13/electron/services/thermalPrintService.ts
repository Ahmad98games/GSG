/**
 * Noxis Hub — Hardened Thermal Printing Service
 *
 * Runs in the Electron main process (Node.js).
 * Bulletproof hardware printing with silent fallback to preview window.
 * NEVER crashes the application, even if spooler hangs or printer is unplugged.
 */

import { ipcMain, BrowserWindow } from 'electron';
import log from 'electron-log';
import { getHardwareSettings } from '../store';

export interface ThermalPrintPayload {
  htmlContent: string;
  printerName?: string;
  width?: string; // Default: '80mm'
}

export interface ThermalPrintResult {
  success: boolean;
  method: 'hardware' | 'preview';
  error?: string;
}

/**
 * Builds the standalone preview window with toolbar, print buttons, and 80mm/58mm styling
 */
export function openThermalPreviewWindow(
  htmlContent: string,
  width: string = '80mm'
): BrowserWindow | null {
  try {
    const is58mm = width.toLowerCase().includes('58');
    const pixelWidth = is58mm ? 220 : 302;
    const windowWidth = Math.max(pixelWidth + 80, 390);

    const previewWin = new BrowserWindow({
      width: windowWidth,
      height: 820,
      title: 'Noxis Thermal Receipt Preview',
      backgroundColor: '#0f172a',
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Noxis Thermal Receipt Preview</title>
  <style>
    @page {
      size: ${width} auto;
      margin: 0mm !important;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      background: #0f172a;
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .preview-toolbar {
      width: 100%;
      background: #1e293b;
      color: #94a3b8;
      padding: 10px 16px;
      font-size: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #334155;
      position: sticky;
      top: 0;
      z-index: 9999;
    }
    .preview-toolbar .notice {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #e2e8f0;
      font-weight: 500;
    }
    .preview-toolbar .actions {
      display: flex;
      gap: 8px;
    }
    .btn {
      cursor: pointer;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: background 0.15s ease;
    }
    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }
    .btn-secondary {
      background: #334155;
      color: #e2e8f0;
    }
    .btn-secondary:hover {
      background: #475569;
    }
    .receipt-paper {
      margin: 20px auto;
      padding: 16px;
      background: #ffffff;
      color: #000000;
      width: ${pixelWidth}px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
      border-radius: 4px;
      font-family: 'Courier New', Courier, monospace;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    img, svg {
      max-width: 100% !important;
      height: auto !important;
      display: block;
      margin: 0 auto;
    }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
    }
    tbody tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .no-print, [data-resilience-banner] {
      display: none !important;
    }
    @media print {
      body {
        background: #ffffff !important;
      }
      .no-print, .preview-toolbar {
        display: none !important;
      }
      .receipt-paper {
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        width: 100% !important;
      }
    }
  </style>
</head>
<body>
  <div class="preview-toolbar no-print">
    <div class="notice">
      <span>📄 Printing to preview <span style="opacity:0.75; font-size:11px;">(connect a thermal printer for direct print)</span></span>
    </div>
    <div class="actions">
      <button class="btn btn-primary" onclick="window.print()">🖨️ Print</button>
      <button class="btn btn-secondary" onclick="window.print()">📥 Print to PDF</button>
    </div>
  </div>
  <div class="receipt-paper">
    ${htmlContent}
  </div>
</body>
</html>`;

    previewWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`);
    previewWin.focus();
    return previewWin;
  } catch (e) {
    log.error('[ThermalPrint] Failed to open print preview window:', e);
    return null;
  }
}

/**
 * Sends content to the physical thermal printer via an off-screen BrowserWindow
 */
async function sendToThermalPrinter(
  printer: any,
  htmlContent: string,
  width: string = '80mm'
): Promise<boolean> {
  let hiddenWindow: BrowserWindow | null = null;
  try {
    const is58mm = width.toLowerCase().includes('58');
    const pixelWidth = is58mm ? 220 : 302;

    const sanitizedDocument = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Noxis Thermal Receipt</title>
  <style>
    @page {
      size: ${width} auto;
      margin: 0mm !important;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: ${width} !important;
      max-width: ${width} !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: 'Courier New', Courier, monospace;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    img, svg {
      max-width: 100% !important;
      height: auto !important;
      display: block;
      margin: 0 auto;
    }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
    }
    tbody tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .no-print, [data-resilience-banner] {
      display: none !important;
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

    hiddenWindow = new BrowserWindow({
      show: false,
      width: pixelWidth,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });

    await hiddenWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(sanitizedDocument)}`
    );

    // Wait for layout and fonts to settle
    await new Promise((r) => setTimeout(r, 120));

    return await new Promise<boolean>((resolve, reject) => {
      const printOptions: any = {
        silent: true,
        printBackground: true,
        margins: { marginType: 'none' },
        deviceName: printer.name,
      };

      hiddenWindow!.webContents.print(printOptions, (success, failureReason) => {
        if (hiddenWindow && !hiddenWindow.isDestroyed()) {
          try { hiddenWindow.destroy(); } catch {}
          hiddenWindow = null;
        }

        if (success) {
          resolve(true);
        } else {
          reject(new Error(failureReason || 'Spooler rejected print job'));
        }
      });
    });
  } catch (err) {
    if (hiddenWindow && !hiddenWindow.isDestroyed()) {
      try { hiddenWindow.destroy(); } catch {}
      hiddenWindow = null;
    }
    throw err;
  }
}

/**
 * Executes the 3-step bulletproof thermal print pipeline
 */
export async function printThermal(
  content: string,
  options: {
    printerName?: string;
    width?: string;
    getMainWindow?: () => BrowserWindow | null;
  } = {}
): Promise<ThermalPrintResult> {
  const hardwareCfg = getHardwareSettings();
  const userSelectedPrinter = options.printerName || hardwareCfg.thermalPrinter || '';
  const paperWidth = options.width || hardwareCfg.paperSize || '80mm';

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    log.warn('[ThermalPrint] Rejected: Empty content provided');
    return { success: false, method: 'preview', error: 'Empty content' };
  }

  try {
    const win = options.getMainWindow?.() || BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
    const webContents = win?.webContents;

    // ── STEP 1: Check if printer exists ──
    let printers: any[] = [];
    if (webContents) {
      try {
        printers = await webContents.getPrintersAsync();
      } catch (e: any) {
        log.warn('[ThermalPrint] Could not query system printers:', e?.message);
      }
    }

    const thermalPrinter = printers.find((p) => {
      const name = (p.name || '').toLowerCase();
      const displayName = (p.displayName || '').toLowerCase();
      return (
        name.includes('thermal') ||
        name.includes('pos') ||
        name.includes('receipt') ||
        displayName.includes('thermal') ||
        displayName.includes('pos') ||
        displayName.includes('receipt') ||
        (userSelectedPrinter && (p.name === userSelectedPrinter || p.displayName === userSelectedPrinter))
      );
    });

    // ── STEP 2: Attempt hardware print with 4000ms timeout ──
    if (thermalPrinter) {
      try {
        await Promise.race([
          sendToThermalPrinter(thermalPrinter, content, paperWidth),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('print_timeout')), 4000)
          ),
        ]);
        log.info(`[ThermalPrint] Hardware print succeeded on "${thermalPrinter.name}"`);
        return { success: true, method: 'hardware' };
      } catch (err: any) {
        // Hardware print failed — silent fallback to preview
        console.warn('[PRINT] Hardware failed, using preview:', err?.message || err);
        log.warn('[ThermalPrint] Hardware failed, using preview fallback:', err?.message || err);
      }
    } else {
      log.info('[ThermalPrint] No physical thermal printer found. Using preview window.');
    }
  } catch (err: any) {
    console.warn('[PRINT] Error during thermal print pipeline:', err);
  }

  // ── STEP 3: Fallback — open print preview window ──
  // This always works regardless of printer status
  openThermalPreviewWindow(content, paperWidth);
  return { success: true, method: 'preview' };
}

export function registerThermalPrintHandlers(getMainWindow: () => BrowserWindow | null): void {
  // ── 1. Silent Thermal Print IPC Handler ───────────────────────────────────
  ipcMain.handle(
    'print:thermal-silent',
    async (_event, options: ThermalPrintPayload): Promise<ThermalPrintResult> => {
      const { htmlContent, printerName, width } = options || {};
      return await printThermal(htmlContent, {
        printerName,
        width,
        getMainWindow,
      });
    }
  );

  // ── 2. Enumerate System Printers ─────────────────────────────────────────
  ipcMain.handle('printers:get-list', async () => {
    try {
      const win = getMainWindow() || BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
      if (!win || win.isDestroyed()) {
        return { success: true, printers: [] };
      }

      const printers = await win.webContents.getPrintersAsync();
      log.info(`[Printers] Enumerated ${printers.length} system printers`);
      return { success: true, printers };
    } catch (err: any) {
      log.error('[Printers] Failed to enumerate printers:', err?.message || err);
      return { success: false, error: err?.message || 'Could not query system printers', printers: [] };
    }
  });

  // ── 3. Direct Preview Window Opener ──────────────────────────────────────
  ipcMain.handle('print:open-preview', async (_event, { htmlContent, width = '80mm' }: { htmlContent: string; width?: string }) => {
    const win = openThermalPreviewWindow(htmlContent, width);
    return { success: !!win };
  });
}
