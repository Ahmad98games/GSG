"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMediamtx = startMediamtx;
exports.stopMediamtx = stopMediamtx;
exports.restartMediamtxWithCameras = restartMediamtxWithCameras;
exports.getWebRtcUrl = getWebRtcUrl;
exports.registerMediamtxHandlers = registerMediamtxHandlers;
const child_process_1 = require("child_process");
const path_1 = require("path");
const fs_1 = require("fs");
const electron_1 = require("electron");
let mediamtxProcess = null;
const RTSP_PORT = 8554;
const WEBRTC_PORT = 8889;
// ── PATH RESOLUTION ─────────────────────────────────────────────────────────
function getMediamtxPath() {
    if (electron_1.app.isPackaged) {
        return (0, path_1.join)(process.resourcesPath, 'mediamtx', 'mediamtx.exe');
    }
    // Development: local resources folder
    return (0, path_1.join)(__dirname, '../../resources/mediamtx/mediamtx.exe');
}
function generateConfig(cameras) {
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
function startMediamtx(cameras, log) {
    return new Promise(resolve => {
        if (mediamtxProcess) {
            log('[mediamtx] Already running');
            resolve();
            return;
        }
        const binaryPath = getMediamtxPath();
        if (!(0, fs_1.existsSync)(binaryPath)) {
            log(`[mediamtx] Binary not found at ${binaryPath} — live view unavailable`);
            resolve(); // Non-fatal — CCTV management still works, just no live stream
            return;
        }
        // Write config to userData (writable on packaged + dev)
        const configDir = (0, path_1.join)(electron_1.app.getPath('userData'), 'mediamtx');
        (0, fs_1.mkdirSync)(configDir, { recursive: true });
        const configPath = (0, path_1.join)(configDir, 'mediamtx.yml');
        (0, fs_1.writeFileSync)(configPath, generateConfig(cameras));
        log(`[mediamtx] Starting with ${cameras.length} camera(s)...`);
        mediamtxProcess = (0, child_process_1.spawn)(binaryPath, [configPath], {
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        mediamtxProcess.stdout?.on('data', (d) => log(`[mediamtx] ${d.toString().trim()}`));
        mediamtxProcess.stderr?.on('data', (d) => log(`[mediamtx ERR] ${d.toString().trim()}`));
        mediamtxProcess.on('spawn', () => {
            log('[mediamtx] Started ✓');
            resolve();
        });
        mediamtxProcess.on('error', (err) => {
            log(`[mediamtx] Spawn error: ${err.message}`);
            mediamtxProcess = null;
            resolve(); // Non-fatal
        });
        mediamtxProcess.on('exit', (code) => {
            log(`[mediamtx] Exited with code ${code}`);
            mediamtxProcess = null;
        });
    });
}
// ── STOP ─────────────────────────────────────────────────────────────────────
function stopMediamtx() {
    if (mediamtxProcess) {
        try {
            mediamtxProcess.kill();
        }
        catch { }
        mediamtxProcess = null;
    }
}
// ── RESTART WITH NEW CAMERA SET ──────────────────────────────────────────────
async function restartMediamtxWithCameras(cameras, log) {
    stopMediamtx();
    // Give the OS a moment to release ports before re-binding
    await new Promise(r => setTimeout(r, 300));
    return startMediamtx(cameras, log);
}
// ── WEBRTC URL HELPER ────────────────────────────────────────────────────────
function getWebRtcUrl(cameraId) {
    const safeName = `cam_${cameraId.replace(/-/g, '_')}`;
    return `http://127.0.0.1:${WEBRTC_PORT}/${safeName}`;
}
// ── IPC HANDLER REGISTRATION ─────────────────────────────────────────────────
function registerMediamtxHandlers(log) {
    // Start/restart mediamtx with the user's active camera list
    electron_1.ipcMain.handle('cctv:startStreams', async (_e, cameras) => {
        await restartMediamtxWithCameras(cameras, log);
        return cameras.map(c => ({
            id: c.id,
            webrtcUrl: getWebRtcUrl(c.id),
        }));
    });
    // Get WebRTC URL for a single camera
    electron_1.ipcMain.handle('cctv:getWebRtcUrl', (_e, cameraId) => {
        return getWebRtcUrl(cameraId);
    });
    // Stop all streams (e.g., when user navigates away from CCTV page)
    electron_1.ipcMain.handle('cctv:stopStreams', () => {
        stopMediamtx();
    });
    // Check if mediamtx is running
    electron_1.ipcMain.handle('cctv:isStreamingActive', () => {
        return !!mediamtxProcess;
    });
    log('[mediamtx] IPC handlers registered ✓');
}
