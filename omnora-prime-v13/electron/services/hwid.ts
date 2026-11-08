/**
 * HWID Fingerprinting Engine
 * Ties a Noxis license to physical hardware using 5 independent hardware identifiers.
 * Uses wmic on Windows for UUID, Motherboard Serial, and CPU ProcessorId.
 * Falls back gracefully when wmic is unavailable (dev mode / non-Windows).
 *
 * SHA-256(UUID | MotherboardSerial | CpuId | PrimaryMAC | Hostname)
 */

import * as crypto from 'crypto'
import * as os from 'os'
import { execSync } from 'child_process'
import {
  getCachedHWID,
  setCachedHWID,
  getHWIDMismatchCount,
  incrementHWIDMismatch,
  resetHWIDMismatch,
} from '../store'

// ── Helpers ───────────────────────────────────────────────────────────────────

let inMemoryHWID: string | null = null;

function wmicQuery(q: string): string {
  try {
    const o = execSync(q, { timeout: 3000, windowsHide: true, encoding: 'utf8', stdio: ['ignore','pipe','ignore'] });
    for (const line of o.split('\n')) {
      const t = line.trim();
      const eqIdx = t.indexOf('=');
      if (eqIdx !== -1) {
        const val = t.slice(eqIdx + 1).trim();
        if (val && val.toLowerCase() !== 'to be filled by o.e.m.' && val.toLowerCase() !== 'none' && val !== '0') return val;
      }
    }
  } catch {}
  try {
    let psCmd = '';
    if (q.includes('csproduct')) psCmd = 'powershell -NoProfile -NonInteractive -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"';
    else if (q.includes('baseboard')) psCmd = 'powershell -NoProfile -NonInteractive -Command "(Get-CimInstance Win32_BaseBoard).SerialNumber"';
    else if (q.includes('cpu')) psCmd = 'powershell -NoProfile -NonInteractive -Command "(Get-CimInstance Win32_Processor).ProcessorId"';
    if (psCmd) {
      const val = execSync(psCmd, { timeout: 3000, windowsHide: true, encoding: 'utf8', stdio: ['ignore','pipe','ignore'] }).trim();
      if (val) return val;
    }
  } catch {}
  return '';
}

function getPrimaryMAC(): string {
  const ifaces = os.networkInterfaces()
  for (const name of Object.keys(ifaces)) {
    const ifaceList = ifaces[name]
    if (!ifaceList) continue
    // Skip loopback and virtual adapters
    if (name.toLowerCase().includes('loopback') ||
        name.toLowerCase().includes('virtual') ||
        name.toLowerCase().includes('vmware') ||
        name.toLowerCase().includes('vbox')) {
      continue
    }
    for (const iface of ifaceList) {
      if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
        return iface.mac.toLowerCase()
      }
    }
  }
  return ''
}

// ── Core ──────────────────────────────────────────────────────────────────────

export interface HWIDComponents {
  systemUUID: string
  motherboardSerial: string
  cpuProcessorId: string
  primaryMAC: string
  hostname: string
}

export function collectHWIDComponents(): HWIDComponents {
  const isWin = process.platform === 'win32'
  const systemUUID = isWin ? wmicQuery('wmic csproduct get UUID /value') : ''
  const motherboardSerial = isWin ? wmicQuery('wmic baseboard get SerialNumber /value') : ''
  const cpuProcessorId = isWin ? wmicQuery('wmic cpu get ProcessorId /value') : ''
  const primaryMAC = getPrimaryMAC()
  const hostname = os.hostname()

  return {
    systemUUID,
    motherboardSerial,
    cpuProcessorId,
    primaryMAC,
    hostname
  }
}

/**
 * Generates HWID as SHA-256 hex of "UUID|MotherboardSerial|CpuId|PrimaryMAC|Hostname".
 * Non-empty components only — cached in-memory for instant 0ms subsequent returns.
 */
export function generateHWID(): string {
  if (inMemoryHWID) return inMemoryHWID;

  const c = collectHWIDComponents()
  const parts = [
    c.systemUUID,
    c.motherboardSerial,
    c.cpuProcessorId,
    c.primaryMAC,
    c.hostname
  ].filter(Boolean)

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
export function getCachedHWIDOrGenerate(): string {
  const cached = getCachedHWID()
  if (cached) return cached.toUpperCase()

  const hwid = generateHWID().toUpperCase()
  setCachedHWID(hwid)
  return hwid
}

export type HWIDVerifyResult =
  | { ok: true }
  | { ok: false; reason: 'MISMATCH'; mismatchCount: number; revoked: boolean }

/**
 * Verifies current HWID against cached value.
 * Increments mismatch counter on failure.
 * Triggers offline license revocation after 3 consecutive mismatches.
 */
export function verifyHWID(): HWIDVerifyResult {
  const cached = getCachedHWID()

  // No cached HWID yet — first boot, generate and cache
  if (!cached) {
    const hwid = generateHWID()
    setCachedHWID(hwid)
    resetHWIDMismatch()
    return { ok: true }
  }

  const current = generateHWID()

  if (current === cached) {
    // Match — reset the mismatch counter
    resetHWIDMismatch()
    return { ok: true }
  }

  // Mismatch
  const count = incrementHWIDMismatch()
  const revoked = count >= 3

  return { ok: false, reason: 'MISMATCH', mismatchCount: count, revoked }
}
