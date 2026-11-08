"use strict";
/**
 * HWID Fingerprinting Engine
 * Ties a Noxis license to physical hardware using 5 independent hardware identifiers.
 * Uses wmic on Windows for UUID, Motherboard Serial, and CPU ProcessorId.
 * Falls back gracefully when wmic is unavailable (dev mode / non-Windows).
 *
 * SHA-256(UUID | MotherboardSerial | CpuId | PrimaryMAC | Hostname)
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
exports.collectHWIDComponents = collectHWIDComponents;
exports.generateHWID = generateHWID;
exports.getCachedHWIDOrGenerate = getCachedHWIDOrGenerate;
exports.verifyHWID = verifyHWID;
const crypto = __importStar(require("crypto"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
const store_1 = require("../store");
// ── Helpers ───────────────────────────────────────────────────────────────────
let inMemoryHWID = null;
function wmicQuery(q) {
    try {
        const o = (0, child_process_1.execSync)(q, { timeout: 3000, windowsHide: true, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
        for (const line of o.split('\n')) {
            const t = line.trim();
            const eqIdx = t.indexOf('=');
            if (eqIdx !== -1) {
                const val = t.slice(eqIdx + 1).trim();
                if (val && val.toLowerCase() !== 'to be filled by o.e.m.' && val.toLowerCase() !== 'none' && val !== '0')
                    return val;
            }
        }
    }
    catch { }
    try {
        let psCmd = '';
        if (q.includes('csproduct'))
            psCmd = 'powershell -NoProfile -NonInteractive -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"';
        else if (q.includes('baseboard'))
            psCmd = 'powershell -NoProfile -NonInteractive -Command "(Get-CimInstance Win32_BaseBoard).SerialNumber"';
        else if (q.includes('cpu'))
            psCmd = 'powershell -NoProfile -NonInteractive -Command "(Get-CimInstance Win32_Processor).ProcessorId"';
        if (psCmd) {
            const val = (0, child_process_1.execSync)(psCmd, { timeout: 3000, windowsHide: true, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
            if (val)
                return val;
        }
    }
    catch { }
    return '';
}
function getPrimaryMAC() {
    const ifaces = os.networkInterfaces();
    for (const name of Object.keys(ifaces)) {
        const ifaceList = ifaces[name];
        if (!ifaceList)
            continue;
        // Skip loopback and virtual adapters
        if (name.toLowerCase().includes('loopback') ||
            name.toLowerCase().includes('virtual') ||
            name.toLowerCase().includes('vmware') ||
            name.toLowerCase().includes('vbox')) {
            continue;
        }
        for (const iface of ifaceList) {
            if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
                return iface.mac.toLowerCase();
            }
        }
    }
    return '';
}
function collectHWIDComponents() {
    const isWin = process.platform === 'win32';
    const systemUUID = isWin ? wmicQuery('wmic csproduct get UUID /value') : '';
    const motherboardSerial = isWin ? wmicQuery('wmic baseboard get SerialNumber /value') : '';
    const cpuProcessorId = isWin ? wmicQuery('wmic cpu get ProcessorId /value') : '';
    const primaryMAC = getPrimaryMAC();
    const hostname = os.hostname();
    return {
        systemUUID,
        motherboardSerial,
        cpuProcessorId,
        primaryMAC,
        hostname
    };
}
/**
 * Generates HWID as SHA-256 hex of "UUID|MotherboardSerial|CpuId|PrimaryMAC|Hostname".
 * Non-empty components only — cached in-memory for instant 0ms subsequent returns.
 */
function generateHWID() {
    if (inMemoryHWID)
        return inMemoryHWID;
    const c = collectHWIDComponents();
    const parts = [
        c.systemUUID,
        c.motherboardSerial,
        c.cpuProcessorId,
        c.primaryMAC,
        c.hostname
    ].filter(Boolean);
    if (parts.length < 2) {
        parts.push(os.arch(), os.platform());
    }
    const hash = crypto
        .createHash('sha256')
        .update(parts.join('|'))
        .digest('hex')
        .toUpperCase();
    inMemoryHWID = hash;
    return hash;
}
/**
 * Returns cached HWID from electron-store, generating and caching it on first call.
 */
function getCachedHWIDOrGenerate() {
    const cached = (0, store_1.getCachedHWID)();
    if (cached)
        return cached.toUpperCase();
    const hwid = generateHWID().toUpperCase();
    (0, store_1.setCachedHWID)(hwid);
    return hwid;
}
/**
 * Verifies current HWID against cached value.
 * Increments mismatch counter on failure.
 * Triggers offline license revocation after 3 consecutive mismatches.
 */
function verifyHWID() {
    const cached = (0, store_1.getCachedHWID)();
    // No cached HWID yet — first boot, generate and cache
    if (!cached) {
        const hwid = generateHWID();
        (0, store_1.setCachedHWID)(hwid);
        (0, store_1.resetHWIDMismatch)();
        return { ok: true };
    }
    const current = generateHWID();
    if (current === cached) {
        // Match — reset the mismatch counter
        (0, store_1.resetHWIDMismatch)();
        return { ok: true };
    }
    // Mismatch
    const count = (0, store_1.incrementHWIDMismatch)();
    const revoked = count >= 3;
    return { ok: false, reason: 'MISMATCH', mismatchCount: count, revoked };
}
