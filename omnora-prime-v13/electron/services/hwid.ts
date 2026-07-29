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

function wmicQuery(query: string): string {
  try {
    const output = execSync(query, {
      timeout: 5000,
      windowsHide: true,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'], // suppress stderr warnings
    })
    const lines = output.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.toLowerCase().startsWith('uuid') ||
          trimmed.toLowerCase().startsWith('serialnumber') ||
          trimmed.toLowerCase().startsWith('processorid')) {
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx !== -1) {
          const val = trimmed.slice(eqIdx + 1).trim()
          if (val && val !== '' && val.toLowerCase() !== 'to be filled by o.e.m.' &&
              val.toLowerCase() !== 'none' && val !== '0') {
            return val
          }
        }
      }
    }
  } catch {
    // wmic failed — fall back to PowerShell Get-CimInstance on Windows 11
  }

  // PowerShell CIM fallback (Windows 11 compatible)
  try {
    let psCmd = ''
    if (query.includes('csproduct')) psCmd = 'powershell -NoProfile -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"'
    else if (query.includes('baseboard')) psCmd = 'powershell -NoProfile -Command "(Get-CimInstance Win32_BaseBoard).SerialNumber"'
    else if (query.includes('cpu')) psCmd = 'powershell -NoProfile -Command "(Get-CimInstance Win32_Processor).ProcessorId"'

    if (psCmd) {
      const val = execSync(psCmd, { timeout: 5000, windowsHide: true, encoding: 'utf8' }).trim()
      if (val && val.toLowerCase() !== 'to be filled by o.e.m.' && val.toLowerCase() !== 'none' && val !== '0') {
        return val
      }
    }
  } catch {}

  return ''
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

  const systemUUID      = isWin ? wmicQuery('wmic csproduct get UUID /value')        : ''
  const motherboardSerial = isWin ? wmicQuery('wmic baseboard get SerialNumber /value') : ''
  const cpuProcessorId  = isWin ? wmicQuery('wmic cpu get ProcessorId /value')       : ''
  const primaryMAC      = getPrimaryMAC()
  const hostname        = os.hostname()

  return { systemUUID, motherboardSerial, cpuProcessorId, primaryMAC, hostname }
}

/**
 * Generates HWID as SHA-256 hex of "UUID|MotherboardSerial|CpuId|MAC|Hostname".
 * Non-empty components only — a missing wmic value does not contribute.
 */
export function generateHWID(): string {
  const c = collectHWIDComponents()

  const parts = [
    c.systemUUID,
    c.motherboardSerial,
    c.cpuProcessorId,
    c.primaryMAC,
    c.hostname,
  ].filter(Boolean)

  // Require at least 2 hardware identifiers to generate a meaningful HWID
  if (parts.length < 2) {
    // Fallback for dev/CI: use hostname + arch + platform
    parts.push(os.arch(), os.platform())
  }

  return crypto
    .createHash('sha256')
    .update(parts.join('|'))
    .digest('hex')
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
