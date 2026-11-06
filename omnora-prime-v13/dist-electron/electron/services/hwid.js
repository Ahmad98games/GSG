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
function queryWindowsHWID() {
    let systemUUID = '';
    let motherboardSerial = '';
    let cpuProcessorId = '';
    // Fast single batch PowerShell query with 1500ms strict timeout to prevent startup hangs
    try {
        const batchCmd = 'powershell -NoProfile -NonInteractive -Command "$u=(Get-CimInstance Win32_ComputerSystemProduct).UUID; $s=(Get-CimInstance Win32_BaseBoard).SerialNumber; $c=(Get-CimInstance Win32_Processor).ProcessorId; Write-Output ($u+\'`t\'+$s+\'`t\'+$c)"';
        const output = (0, child_process_1.execSync)(batchCmd, {
            timeout: 1500,
            windowsHide: true,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore']
        }).trim();
        if (output) {
            const parts = output.split('\t');
            if (parts[0] && !parts[0].toLowerCase().includes('o.e.m') && parts[0] !== '0')
                systemUUID = parts[0].trim();
            if (parts[1] && !parts[1].toLowerCase().includes('o.e.m') && parts[1] !== '0')
                motherboardSerial = parts[1].trim();
            if (parts[2] && !parts[2].toLowerCase().includes('o.e.m') && parts[2] !== '0')
                cpuProcessorId = parts[2].trim();
            return { systemUUID, motherboardSerial, cpuProcessorId };
        }
    }
    catch {
        // If PowerShell is blocked or restricted, continue with zero-cost fallback
    }
    return { systemUUID, motherboardSerial, cpuProcessorId };
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
    const winHw = isWin ? queryWindowsHWID() : { systemUUID: '', motherboardSerial: '', cpuProcessorId: '' };
    const primaryMAC = getPrimaryMAC();
    const hostname = os.hostname();
    return {
        systemUUID: winHw.systemUUID,
        motherboardSerial: winHw.motherboardSerial,
        cpuProcessorId: winHw.cpuProcessorId,
        primaryMAC,
        hostname
    };
}
/**
 * Generates HWID as SHA-256 hex of "UUID|MotherboardSerial|CpuId|MAC|Hostname|CPUModel".
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
        c.hostname,
        os.cpus()[0]?.model || '',
        os.arch(),
        os.platform()
    ].filter(Boolean);
    const hash = crypto
        .createHash('sha256')
        .update(parts.join('|'))
        .digest('hex');
    inMemoryHWID = hash;
    return hash;
}
/**
 * Returns cached HWID from electron-store, generating and caching it on first call.
 */
function getCachedHWIDOrGenerate() {
    const cached = (0, store_1.getCachedHWID)();
    if (cached)
        return cached;
    const hwid = generateHWID();
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
