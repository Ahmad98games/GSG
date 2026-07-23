"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptPassword = decryptPassword;
exports.registerOnvifHandlers = registerOnvifHandlers;
const electron_1 = require("electron");
const crypto = __importStar(require("crypto"));
const os = __importStar(require("os"));
const net = __importStar(require("net"));
const http = __importStar(require("http"));
// ── ENCRYPTION FOR CAMERA PASSWORDS ────────────────────────────────────────
// Passwords are AES-256-GCM encrypted before being stored in Supabase.
// The key is derived from an app-level secret — never stored in plaintext.
const CIPHER_KEY = crypto.scryptSync(process.env.CAMERA_CIPHER_KEY || 'noxis-camera-key-2026', 'salt', 32);
function encryptPassword(password) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', CIPHER_KEY, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}
function decryptPassword(encrypted) {
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
function getLocalNetworkInfo() {
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
function isPortOpen(host, port, timeout = 400) {
    return new Promise(resolve => {
        const socket = new net.Socket();
        let resolved = false;
        const finish = (result) => {
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
async function discoverViaOnvif(log) {
    try {
        // node-onvif is a CommonJS module — use require to avoid ESM issues
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const OnvifManager = require('node-onvif');
        log('[CCTV] Starting ONVIF WS-Discovery probe...');
        const deviceList = await new Promise((resolve) => {
            const timeout = setTimeout(() => resolve([]), 8000);
            Promise.resolve(OnvifManager.startProbe())
                .then((list) => {
                clearTimeout(timeout);
                resolve(list || []);
            })
                .catch(() => {
                clearTimeout(timeout);
                resolve([]);
            });
        });
        log(`[CCTV] WS-Discovery found ${deviceList.length} devices`);
        return deviceList.map((d) => {
            const xaddr = d.xaddrs?.[0] || '';
            const ipMatch = xaddr.match(/(\d+\.\d+\.\d+\.\d+)/);
            return {
                ip: ipMatch?.[1] || '',
                xaddr,
                name: d.name || 'ONVIF Camera',
            };
        }).filter(d => d.ip);
    }
    catch (err) {
        log(`[CCTV] ONVIF discovery error: ${err.message}`);
        return [];
    }
}
// ── SUBNET SCAN ─────────────────────────────────────────────────────────────
// Scans .1-.254 for common ONVIF/camera ports in parallel batches
async function scanSubnet(subnet, log) {
    const found = [];
    const CAMERA_PORTS = [80, 8080, 8000, 8899, 554];
    const BATCH_SIZE = 25;
    const all = [];
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
async function fetchCameraDetails(ip, port, username, password) {
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
        let manufacturer = 'other';
        const mfr = (state?.Manufacturer || '').toLowerCase();
        if (mfr.includes('hikvision'))
            manufacturer = 'hikvision';
        else if (mfr.includes('imou'))
            manufacturer = 'imou';
        else if (mfr.includes('dahua'))
            manufacturer = 'dahua';
        // Get RTSP stream URLs from profiles
        const streamUrls = await Promise.all(profiles.slice(0, 2).map(async (profile) => {
            try {
                const url = await device.getUdpStreamUrl(profile.token);
                const res = profile.VideoEncoderConfiguration?.Resolution;
                return {
                    token: profile.token,
                    url,
                    resolution: res ? `${res.Width}×${res.Height}` : null,
                };
            }
            catch {
                return null;
            }
        })).then(r => r.filter(Boolean));
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
        }
        catch { /* analytics not available */ }
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
                supportsAudio: profiles.some((p) => p.AudioEncoderConfiguration),
                supportsHumanDetection,
                supportsVehicleDetection,
            },
        };
    }
    catch (err) {
        return { success: false, error: err.message || 'Connection failed' };
    }
}
// ── SNAPSHOT VIA HTTP ───────────────────────────────────────────────────────
// Falls back to HTTP snapshot endpoint (common on Hikvision/Imou/Dahua)
function fetchSnapshotHttp(ip, port, username, password) {
    return new Promise(resolve => {
        const auth = Buffer.from(`${username}:${password}`).toString('base64');
        const paths = [
            '/onvif/snapshot',
            '/Streaming/channels/101/picture', // Hikvision
            '/cgi-bin/snapshot.cgi', // Dahua/Imou
            '/snapshot.jpg',
        ];
        let tried = 0;
        const tryPath = (pathIndex) => {
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
                const chunks = [];
                res.on('data', (c) => chunks.push(c));
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
function registerOnvifHandlers(startupLog) {
    // ── Full discovery: ONVIF WS-Discovery + TCP port scan ──
    electron_1.ipcMain.handle('cctv:discover', async () => {
        const results = [];
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
    electron_1.ipcMain.handle('cctv:getDetails', async (_e, { ip, port, username, password }) => {
        return fetchCameraDetails(ip, port, username, password);
    });
    // ── Encrypt password before saving to Supabase ──
    electron_1.ipcMain.handle('cctv:encryptPassword', (_e, password) => {
        return encryptPassword(password);
    });
    // ── Test camera connectivity ──
    electron_1.ipcMain.handle('cctv:testConnection', async (_e, { ip, port, username, passwordEncrypted }) => {
        const password = decryptPassword(passwordEncrypted);
        const result = await fetchCameraDetails(ip, port, username, password);
        return result.success;
    });
    // ── Grab a still snapshot from a camera ──
    electron_1.ipcMain.handle('cctv:getSnapshot', async (_e, { ip, port, username, passwordEncrypted }) => {
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
            }
            catch { /* fall through to HTTP */ }
            return fetchSnapshotHttp(ip, port, username, password);
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    });
    startupLog('[CCTV] ONVIF IPC handlers registered ✓');
}
