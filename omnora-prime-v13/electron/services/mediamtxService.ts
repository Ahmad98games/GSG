/**
 * Noxis Hub — mediamtx WebRTC/RTSP Proxy Service
 *
 * mediamtx is a single-binary media server that proxies RTSP camera streams
 * into WebRTC so they can be viewed directly in the Electron BrowserWindow.
 *
 * Why mediamtx:
 * - Electron renderer cannot open raw RTSP sockets (browser sandbox)
 * - WebRTC works natively in Chromium (Electron's renderer)
 * - mediamtx re-muxes RTSP → WebRTC locally with zero cloud dependency
 *
 * Binary: resources/mediamtx/mediamtx.exe (~12MB)
 * Ports: RTSP on :8554, WebRTC on :8889
 */

import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { app, ipcMain } from 'electron';

let mediamtxProcess: ChildProcess | null = null;

const RTSP_PORT = 8554;
const WEBRTC_PORT = 8889;

// ── PATH RESOLUTION ─────────────────────────────────────────────────────────

function getMediamtxPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'mediamtx', 'mediamtx.exe');
  }
  // Development: local resources folder
  return join(__dirname, '../../resources/mediamtx/mediamtx.exe');
}

// ── CONFIG GENERATION ───────────────────────────────────────────────────────
// Generates a mediamtx.yml config file for the active camera set.
// Each camera gets a named path like cam_<id> that proxies its RTSP stream.

interface CameraStream {
  id: string;
  name: string;
  rtspUrl: string;
}

function generateConfig(cameras: CameraStream[]): string {
  const pathEntries = cameras.map(cam => {
    const safeName = `cam_${cam.id.replace(/-/g, '_')}`;
    return `
  ${safeName}:
    source: ${cam.rtspUrl}
    sourceProtocol: tcp
    sourceOnDemand: false
    sourceOnDemandStartTimeout: 10s
    sourceOnDemandCloseAfter: 10s`;
  }).join('\n');

  return `# Noxis Hub — mediamtx auto-generated config
# Generated: ${new Date().toISOString()}

logLevel: warn
logDestinations: [stdout]

# Disable unused protocols to minimize attack surface
rtspAddress: :${RTSP_PORT}
rtspsAddress: :8322
rtmpAddress: :1935
rtmpEncryptedAddress: :1936
hlsAddress: :8888

# WebRTC — used by Electron renderer for live view
webrtcAddress: :${WEBRTC_PORT}
webrtc: yes
webrtcLocalUDPAddress: :8889
webrtcLocalTCPAddress: ""
webrtcIPsFromInterfaces: yes
webrtcIPsFromInterfacesList: []
webrtcAdditionalHosts: []
webrtcICEServers2: []

# No auth needed — mediamtx binds to localhost only
# Accessible only from within the Electron app
authInternalUsers:
  - user: any
    pass: any
    permissions:
      - action: publish
      - action: read
      - action: playback

paths:
${pathEntries || '  # No cameras configured'}
`;
}

// ── START ────────────────────────────────────────────────────────────────────

export function startMediamtx(
  cameras: CameraStream[],
  log: (msg: string) => void
): Promise<void> {
  return new Promise(resolve => {
    if (mediamtxProcess) {
      log('[mediamtx] Already running');
      resolve();
      return;
    }

    const binaryPath = getMediamtxPath();

    if (!existsSync(binaryPath)) {
      log(`[mediamtx] Binary not found at ${binaryPath} — live view unavailable`);
      resolve(); // Non-fatal — CCTV management still works, just no live stream
      return;
    }

    // Write config to userData (writable on packaged + dev)
    const configDir = join(app.getPath('userData'), 'mediamtx');
    mkdirSync(configDir, { recursive: true });
    const configPath = join(configDir, 'mediamtx.yml');
    writeFileSync(configPath, generateConfig(cameras));

    log(`[mediamtx] Starting with ${cameras.length} camera(s)...`);

    mediamtxProcess = spawn(binaryPath, [configPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    mediamtxProcess.stdout?.on('data', (d: Buffer) =>
      log(`[mediamtx] ${d.toString().trim()}`)
    );
    mediamtxProcess.stderr?.on('data', (d: Buffer) =>
      log(`[mediamtx ERR] ${d.toString().trim()}`)
    );

    mediamtxProcess.on('spawn', () => {
      log('[mediamtx] Started ✓');
      resolve();
    });

    mediamtxProcess.on('error', (err: Error) => {
      log(`[mediamtx] Spawn error: ${err.message}`);
      mediamtxProcess = null;
      resolve(); // Non-fatal
    });

    mediamtxProcess.on('exit', (code: number | null) => {
      log(`[mediamtx] Exited with code ${code}`);
      mediamtxProcess = null;
    });
  });
}

// ── STOP ─────────────────────────────────────────────────────────────────────

export function stopMediamtx(): void {
  if (mediamtxProcess) {
    try { mediamtxProcess.kill(); } catch {}
    mediamtxProcess = null;
  }
}

// ── RESTART WITH NEW CAMERA SET ──────────────────────────────────────────────

export async function restartMediamtxWithCameras(
  cameras: CameraStream[],
  log: (msg: string) => void
): Promise<void> {
  stopMediamtx();
  // Give the OS a moment to release ports before re-binding
  await new Promise<void>(r => setTimeout(r, 300));
  return startMediamtx(cameras, log);
}

// ── WEBRTC URL HELPER ────────────────────────────────────────────────────────

export function getWebRtcUrl(cameraId: string): string {
  const safeName = `cam_${cameraId.replace(/-/g, '_')}`;
  return `http://127.0.0.1:${WEBRTC_PORT}/${safeName}`;
}

// ── IPC HANDLER REGISTRATION ─────────────────────────────────────────────────

export function registerMediamtxHandlers(log: (msg: string) => void): void {

  // Start/restart mediamtx with the user's active camera list
  ipcMain.handle('cctv:startStreams', async (_e, cameras: CameraStream[]) => {
    await restartMediamtxWithCameras(cameras, log);
    return cameras.map(c => ({
      id: c.id,
      webrtcUrl: getWebRtcUrl(c.id),
    }));
  });

  // Get WebRTC URL for a single camera
  ipcMain.handle('cctv:getWebRtcUrl', (_e, cameraId: string) => {
    return getWebRtcUrl(cameraId);
  });

  // Stop all streams (e.g., when user navigates away from CCTV page)
  ipcMain.handle('cctv:stopStreams', () => {
    stopMediamtx();
  });

  // Check if mediamtx is running
  ipcMain.handle('cctv:isStreamingActive', () => {
    return !!mediamtxProcess;
  });

  log('[mediamtx] IPC handlers registered ✓');
}
