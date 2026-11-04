/**
 * Noxis Hub — Silent Thermal Printing Service
 *
 * Runs in the Electron main process (Node.js).
 * Eliminates browser/OS print dialog popups by leveraging Electron's hidden
 * webContents.print({ silent: true }) targeting 80mm/58mm thermal receipt printers directly.
 */

import { ipcMain, BrowserWindow } from 'electron';
import log from 'electron-log';

export interface ThermalPrintPayload {
  htmlContent: string;
  printerName?: string;
  width?: string; // Default: '80mm'
}

export interface ThermalPrintResult {
  success: boolean;
  error?: string;
}

export function registerThermalPrintHandlers(getMainWindow: () => BrowserWindow | null): void {
  // ── 1. Silent Thermal Print ──────────────────────────────────────────────
  ipcMain.handle(
    'print:thermal-silent',
    async (_event, options: ThermalPrintPayload): Promise<ThermalPrintResult> => {
      const { htmlContent, printerName, width = '80mm' } = options || {};

      if (!htmlContent || typeof htmlContent !== 'string') {
        log.warn('[ThermalPrint] Rejected: Empty or invalid HTML content received');
        return { success: false, error: 'No printable HTML content provided' };
      }

      // Convert thermal millimeter width to standard viewport pixels (80mm ~ 302px at 96 DPI, 58mm ~ 220px)
      const is58mm = width.toLowerCase().includes('58');
      const pixelWidth = is58mm ? 220 : 302;

      let hiddenPrintWindow: BrowserWindow | null = null;
      let printTimeoutTimer: NodeJS.Timeout | null = null;

      try {
        log.info(`[ThermalPrint] Initiating silent print. Target printer: "${printerName || 'Default'}", Width: ${width}`);

        // Construct dedicated off-screen BrowserWindow
        hiddenPrintWindow = new BrowserWindow({
          show: false,
          width: pixelWidth,
          height: 800,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
          },
        });

        // Assemble full standalone HTML document with strict thermal reset styling
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
      font-family: 'Courier New', Courier, monospace, monospace;
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

        await hiddenPrintWindow.loadURL(
          `data:text/html;charset=utf-8,${encodeURIComponent(sanitizedDocument)}`
        );

        // Allow micro-pause for rendering engine and SVG barcodes to lay out
        await new Promise((resolve) => setTimeout(resolve, 150));

        return await new Promise<ThermalPrintResult>((resolve) => {
          // Guard: Terminate hanging spooler jobs or slow Bluetooth discovery after 5 seconds max
          printTimeoutTimer = setTimeout(() => {
            log.error('[ThermalPrint] Print operation timed out after 5000ms (Bluetooth/USB device unreachable)');
            if (hiddenPrintWindow && !hiddenPrintWindow.isDestroyed()) {
              try { hiddenPrintWindow.destroy(); } catch {}
              hiddenPrintWindow = null;
            }
            resolve({
              success: false,
              error: 'Thermal printer timed out after 5s (device may be offline or Bluetooth disconnected)',
            });
          }, 5000);

          const printOptions: any = {
            silent: true,
            printBackground: true,
            margins: {
              marginType: 'none',
            },
          };

          if (printerName && typeof printerName === 'string' && printerName.trim().length > 0) {
            printOptions.deviceName = printerName.trim();
          }

          hiddenPrintWindow!.webContents.print(printOptions, (success, failureReason) => {
            if (printTimeoutTimer) clearTimeout(printTimeoutTimer);

            if (hiddenPrintWindow && !hiddenPrintWindow.isDestroyed()) {
              try { hiddenPrintWindow.destroy(); } catch {}
              hiddenPrintWindow = null;
            }

            if (!success) {
              log.warn(`[ThermalPrint] Printing rejected by system spooler: ${failureReason}`);
              resolve({
                success: false,
                error: failureReason || 'Spooler rejected print command (printer offline or out of paper)',
              });
            } else {
              log.info('[ThermalPrint] Silent print successfully processed by printer spooler');
              resolve({ success: true });
            }
          });
        });
      } catch (err: any) {
        if (printTimeoutTimer) clearTimeout(printTimeoutTimer);
        if (hiddenPrintWindow && !hiddenPrintWindow.isDestroyed()) {
          try { hiddenPrintWindow.destroy(); } catch {}
          hiddenPrintWindow = null;
        }
        log.error('[ThermalPrint] Unexpected fatal print error:', err?.message || err);
        return { success: false, error: err?.message || 'Unexpected silent print error' };
      }
    }
  );

  // ── 2. Enumerate System Printers ────────────────────────────────────────
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
}

