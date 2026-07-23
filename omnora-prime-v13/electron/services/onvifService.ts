/**
 * Noxis Hub — ONVIF Camera Discovery & Management Service
 *
 * Runs in the Electron main process (Node.js) because:
 * - Raw UDP/TCP network calls are blocked in renderer (browser sandbox)
 * - Camera passwords must never reach the renderer unencrypted
 * - WS-Discovery uses UDP multicast which requires OS-level socket access
 *
 * Provides IPC handlers consumed by renderer via preload.ts contextBridge.
 */

import { ipcMain } from 'electron';
import * as crypto from 'crypto';
import * as os from 'os';
import * as net from 'net';
import * as http from 'http';

// ── ENCRYPTION FOR CAMERA PASSWORDS ────────────────────────────────────────
// Passwords are AES-256-GCM encrypted before being stored in Supabase.
// The key is derived from an app-level secret — never stored in plaintext.

const CIPHER_KEY = crypto.scryptSync(
  process.env.CAMERA_CIPHER_KEY || 'noxis-camera-key-2026',
  'salt',
  32
);

function encryptPassword(password: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', CIPHER_KEY, iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decryptPassword(encrypted: string): string {
  const [ivHex, authTagHex, encryptedData] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', CIPHER_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ── NETWORK INFO ────────────────────────────────────────────────────────────

function getLocalNetworkInfo(): { ip: string; subnet: string } {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const iface of nets[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const parts = iface.address.split('.');
        return {
          ip: iface.address,
          subnet: `${parts[0]}.${parts[1]}.${parts[2]}`,
        };
      }
    }
  }
  return { ip: '192.168.1.1', subnet: '192.168.1' };
}

// ── PORT SCANNER ────────────────────────────────────────────────────────────
// Faster than ONVIF WS-Discovery for catching cameras that don't broadcast

function isPortOpen(host: string, port: number, timeout = 400): Promise<boolean> {
  return new Promise(resolve => {
    const socket = new net.Socket();
    let resolved = false;

    const finish = (result: boolean) => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve(result);
      }
    };

    socket.setTimeout(timeout);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

// ── ONVIF WS-DISCOVERY ─────────────────────────────────────────────────────
// UDP multicast probe that finds cameras announcing themselves on LAN

async function discoverViaOnvif(
  log: (msg: string) => void
): Promise<Array<{ ip: string; xaddr?: string; name?: string }>> {
  try {
    // node-onvif is a CommonJS module — use require to avoid ESM issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const OnvifManager = require('node-onvif');

    log('[CCTV] Starting ONVIF WS-Discovery probe...');

    const deviceList: any[] = await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve([]), 8000);

      Promise.resolve(OnvifManager.startProbe())
        .then((list: any[]) => {
          clearTimeout(timeout);
          resolve(list || []);
        })
        .catch(() => {
          clearTimeout(timeout);
          resolve([]);
        });
    });

    log(`[CCTV] WS-Discovery found ${deviceList.length} devices`);

    return deviceList.map((d: any) => {
      const xaddr = d.xaddrs?.[0] || '';
      const ipMatch = xaddr.match(/(\d+\.\d+\.\d+\.\d+)/);
      return {
        ip: ipMatch?.[1] || '',
        xaddr,
        name: d.name || 'ONVIF Camera',
      };
    }).filter(d => d.ip);

  } catch (err: any) {
    log(`[CCTV] ONVIF discovery error: ${err.message}`);
    return [];
  }
}

// ── SUBNET SCAN ─────────────────────────────────────────────────────────────
// Scans .1-.254 for common ONVIF/camera ports in parallel batches

async function scanSubnet(
  subnet: string,
  log: (msg: string, count: number) => void
): Promise<string[]> {
  const found: string[] = [];
  const CAMERA_PORTS = [80, 8080, 8000, 8899, 554];
  const BATCH_SIZE = 25;

  const all: Array<() => Promise<void>> = [];

  for (let i = 1; i <= 254; i++) {
    const ip = `${subnet}.${i}`;
    all.push(async () => {
      for (const port of CAMERA_PORTS) {
        if (await isPortOpen(ip, port, 400)) {
          found.push(ip);
          log(`Found device at ${ip}:${port}`, found.length);
          break;
        }
      }
    });
  }

  // Process in batches to avoid overwhelming the network stack
  for (let i = 0; i < all.length; i += BATCH_SIZE) {
    await Promise.all(all.slice(i, i + BATCH_SIZE).map(fn => fn()));
  }

  return found;
}

// ── ONVIF CAMERA DETAILS ────────────────────────────────────────────────────
// Connects to a discovered camera with credentials to pull full metadata

async function fetchCameraDetails(
  ip: string,
  port: number,
  username: string,
  password: string
): Promise<{ success: boolean; info?: any; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const OnvifManager = require('node-onvif');

    const device = new OnvifManager.OnvifDevice({
      xaddr: `http://${ip}:${port}/onvif/device_service`,
      user: username,
      pass: password,
    });

    await device.init();

    const state = device.getCurrentState();
    const profiles = await device.getProfileList().catch(() => []);

    // Detect manufacturer
    let manufacturer: 'hikvision' | 'imou' | 'dahua' | 'other' = 'other';
    const mfr = (state?.Manufacturer || '').toLowerCase();
    if (mfr.includes('hikvision')) manufacturer = 'hikvision';
    else if (mfr.includes('imou')) manufacturer = 'imou';
    else if (mfr.includes('dahua')) manufacturer = 'dahua';

    // Get RTSP stream URLs from profiles
    const streamUrls = await Promise.all(
      (profiles as any[]).slice(0, 2).map(async (profile: any) => {
        try {
          const url = await device.getUdpStreamUrl(profile.token);
          const res = profile.VideoEncoderConfiguration?.Resolution;
          return {
            token: profile.token,
            url,
            resolution: res ? `${res.Width}×${res.Height}` : null,
          };
        } catch {
          return null;
        }
      })
    ).then(r => r.filter(Boolean));

    // Detect capabilities
    let supportsHumanDetection = false;
    let supportsVehicleDetection = false;
    try {
      const caps = await device.getCapabilities();
      if (caps?.Analytics?.XAddr) {
        supportsHumanDetection = true;
        supportsVehicleDetection =
          manufacturer === 'hikvision' || manufacturer === 'dahua';
      }
    } catch { /* analytics not available */ }

    const mainStream = streamUrls[0];
    const subStream = streamUrls[1];

    return {
      success: true,
      info: {
        manufacturer,
        model: state?.Model || 'Unknown',
        serialNumber: state?.SerialNumber,
        firmwareVersion: state?.FirmwareVersion,
        resolutionMain: mainStream?.resolution || null,
        resolutionSub: subStream?.resolution || null,
        rtspUrlMain: mainStream?.url || null,
        rtspUrlSub: subStream?.url || null,
        supportsPtz: !!state?.PTZ?.XAddr,
        supportsAudio: profiles.some((p: any) => p.AudioEncoderConfiguration),
        supportsHumanDetection,
        supportsVehicleDetection,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed' };
  }
}

// ── SNAPSHOT VIA HTTP ───────────────────────────────────────────────────────
// Falls back to HTTP snapshot endpoint (common on Hikvision/Imou/Dahua)

function fetchSnapshotHttp(
  ip: string,
  port: number,
  username: string,
  password: string
): Promise<{ success: boolean; base64?: string; error?: string }> {
  return new Promise(resolve => {
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    const paths = [
      '/onvif/snapshot',
      '/Streaming/channels/101/picture',  // Hikvision
      '/cgi-bin/snapshot.cgi',            // Dahua/Imou
      '/snapshot.jpg',
    ];

    let tried = 0;

    const tryPath = (pathIndex: number) => {
      if (pathIndex >= paths.length) {
        resolve({ success: false, error: 'No snapshot endpoint found' });
        return;
      }

      const options = {
        hostname: ip,
        port,
        path: paths[pathIndex],
        method: 'GET',
        headers: { Authorization: `Basic ${auth}` },
        timeout: 4000,
      };

      const req = http.get(options, (res) => {
        if (res.statusCode !== 200) {
          tryPath(pathIndex + 1);
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => {
          resolve({ success: true, base64: Buffer.concat(chunks).toString('base64') });
        });
      });

      req.on('error', () => tryPath(pathIndex + 1));
      req.on('timeout', () => { req.destroy(); tryPath(pathIndex + 1); });
    };

    tryPath(0);
  });
}

// ── IPC HANDLER REGISTRATION ────────────────────────────────────────────────

export function registerOnvifHandlers(
  startupLog: (msg: string) => void
): void {

  // ── Full discovery: ONVIF WS-Discovery + TCP port scan ──
  ipcMain.handle('cctv:discover', async () => {
    const results: Array<{
      ip: string;
      discoveryMethod: 'onvif' | 'tcp_scan';
      xaddr?: string;
      name: string;
    }> = [];

    startupLog('[CCTV] Starting camera discovery...');

    // Method 1: ONVIF WS-Discovery (UDP multicast)
    const onvifDevices = await discoverViaOnvif(startupLog);
    for (const d of onvifDevices) {
      results.push({ ...d, name: d.name || 'ONVIF Camera', discoveryMethod: 'onvif' });
    }

    // Method 2: TCP port scan (catches non-broadcasting cameras)
    const { subnet } = getLocalNetworkInfo();
    startupLog(`[CCTV] Port scanning ${subnet}.1-254...`);

    const scannedIps = await scanSubnet(subnet, (msg, count) => {
      startupLog(`[CCTV] ${msg} (${count} total)`);
    });

    for (const ip of scannedIps) {
      if (!results.find(r => r.ip === ip)) {
        results.push({ ip, name: 'IP Device', discoveryMethod: 'tcp_scan' });
      }
    }

    startupLog(`[CCTV] Discovery complete — ${results.length} device(s) found`);
    return results;
  });

  // ── Fetch detailed camera info after user enters credentials ──
  ipcMain.handle(
    'cctv:getDetails',
    async (_e, { ip, port, username, password }: {
      ip: string; port: number; username: string; password: string;
    }) => {
      return fetchCameraDetails(ip, port, username, password);
    }
  );

  // ── Encrypt password before saving to Supabase ──
  ipcMain.handle('cctv:encryptPassword', (_e, password: string) => {
    return encryptPassword(password);
  });

  // ── Test camera connectivity ──
  ipcMain.handle(
    'cctv:testConnection',
    async (_e, { ip, port, username, passwordEncrypted }: {
      ip: string; port: number; username: string; passwordEncrypted: string;
    }) => {
      const password = decryptPassword(passwordEncrypted);
      const result = await fetchCameraDetails(ip, port, username, password);
      return result.success;
    }
  );

  // ── Grab a still snapshot from a camera ──
  ipcMain.handle(
    'cctv:getSnapshot',
    async (_e, { ip, port, username, passwordEncrypted }: {
      ip: string; port: number; username: string; passwordEncrypted: string;
    }) => {
      try {
        const password = decryptPassword(passwordEncrypted);
        // Try ONVIF first, fall back to HTTP endpoints
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const OnvifManager = require('node-onvif');
          const device = new OnvifManager.OnvifDevice({
            xaddr: `http://${ip}:${port}/onvif/device_service`,
            user: username,
            pass: password,
          });
          await device.init();
          const profiles = await device.getProfileList().catch(() => []);
          if (profiles.length > 0) {
            const snapshot = await device.fetchSnapshot(profiles[0].token);
            if (snapshot) {
              return { success: true, base64: snapshot };
            }
          }
        } catch { /* fall through to HTTP */ }

        return fetchSnapshotHttp(ip, port, username, password);
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
  );

  startupLog('[CCTV] ONVIF IPC handlers registered ✓');
}
