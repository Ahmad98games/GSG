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

function queryWindowsHWID(): { systemUUID: string; motherboardSerial: string; cpuProcessorId: string } {
  let systemUUID = '';
  let motherboardSerial = '';
  let cpuProcessorId = '';

  // Fast single batch PowerShell query with 1500ms strict timeout to prevent startup hangs
  try {
    const batchCmd = 'powershell -NoProfile -NonInteractive -Command "$u=(Get-CimInstance Win32_ComputerSystemProduct).UUID; $s=(Get-CimInstance Win32_BaseBoard).SerialNumber; $c=(Get-CimInstance Win32_Processor).ProcessorId; Write-Output ($u+\'`t\'+$s+\'`t\'+$c)"';
    const output = execSync(batchCmd, {
      timeout: 1500,
      windowsHide: true,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();

    if (output) {
      const parts = output.split('\t');
      if (parts[0] && !parts[0].toLowerCase().includes('o.e.m') && parts[0] !== '0') systemUUID = parts[0].trim();
      if (parts[1] && !parts[1].toLowerCase().includes('o.e.m') && parts[1] !== '0') motherboardSerial = parts[1].trim();
      if (parts[2] && !parts[2].toLowerCase().includes('o.e.m') && parts[2] !== '0') cpuProcessorId = parts[2].trim();
      return { systemUUID, motherboardSerial, cpuProcessorId };
    }
  } catch {
    // If PowerShell is blocked or restricted, continue with zero-cost fallback
  }

  return { systemUUID, motherboardSerial, cpuProcessorId };
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
  const winHw = isWin ? queryWindowsHWID() : { systemUUID: '', motherboardSerial: '', cpuProcessorId: '' }
  const primaryMAC = getPrimaryMAC()
  const hostname = os.hostname()

  return {
    systemUUID: winHw.systemUUID,
    motherboardSerial: winHw.motherboardSerial,
    cpuProcessorId: winHw.cpuProcessorId,
    primaryMAC,
    hostname
  }
}

/**
 * Generates HWID as SHA-256 hex of "UUID|MotherboardSerial|CpuId|MAC|Hostname|CPUModel".
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
    c.hostname,
    os.cpus()[0]?.model || '',
    os.arch(),
    os.platform()
  ].filter(Boolean)

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
export function getCachedHWIDOrGenerate(): string {
  const cached = getCachedHWID()
  if (cached) return cached

  const hwid = generateHWID()
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
