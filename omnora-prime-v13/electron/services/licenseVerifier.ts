/**
 * RSA-2048 Offline License Verifier
 *
 * Key format: NOXIS-[TIER]-[BASE64URL_PAYLOAD]-[BASE64URL_SIGNATURE]
 *
 * Payload: JSON-encoded LicensePayload
 * Signature: RSA-SHA256 of the BASE64URL_PAYLOAD string, signed with Noxis private key.
 *
 * Verification steps:
 *   1. Parse and decode payload from Base64URL
 *   2. Verify RSA-SHA256 signature against embedded public key
 *   3. Verify payload.hwid === current HWID
 *   4. Verify expiry (0 = lifetime)
 *   5. Verify tier matches key prefix
 */

import * as crypto from 'crypto'
import { generateHWID } from './hwid'
import {
  getLicensePayload,
  setLicensePayload,
  clearLicensePayload,
  getCachedHWID,
  getInstallationHWID,
  setInstallationHWID,
} from '../store'

// ── Embedded RSA-2048 Public Key ──────────────────────────────────────────────
// Generated 2026-07-29 for Noxis Hub licensing.
// The matching private key is held by Omnora Labs for key signing.
const NOXIS_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkdM53HQc7cSBZ/Wf8zhp
HLosOaFrUCT8lRUhVukBc52NXT0bQmfQrD1VWyEFnqMmKhIuD8dHsSsr1odAmMfX
5usqyNaLFdj31zrXwsMAILMH4pJmloRfLLz0ClK1Crp+dkRwSLet1tx3CBysvh5M
Q8hBKR18VM2Onu+dXvC4fCeJVvMxEzfRXbzi3avvd9O2TjanP9nJeudeL446Xrcj
6zbXDGpBgUAYuFyNK4/ZpIuOj2gI7hONF/7BFdrKWRVDlf58iOx3dShBPM4qUgSJ
6DXuW6ddC3sD0hUj6sO7zwSLjjtca+6XJFlkF+VIRPmH9nZA4g5bfeTWWi+RntqP
ewIDAQAB
-----END PUBLIC KEY-----`

// ── Types ─────────────────────────────────────────────────────────────────────

export type LicenseTier = 'lite' | 'pro' | 'elite'

export interface LicensePayload {
  version: 2
  tier: LicenseTier
  hwid: string
  businessId: string
  issuedAt: number    // epoch ms
  expiresAt: number   // epoch ms — 0 means lifetime
  maxDevices: number
  maxBranches: number
  maxCameras: number
  features: string[]
  signature: string   // RSA-SHA256 Base64URL of the rest of the payload
}

export type VerifyResult =
  | { valid: true;  payload: LicensePayload }
  | { valid: false; error: string }

// ── Base64URL helpers ─────────────────────────────────────────────────────────

function b64urlDecode(s: string): Buffer {
  // Base64URL → Base64: replace - with +, _ with /
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - s.length % 4) % 4)
  return Buffer.from(b64, 'base64')
}

// ── Core verifier ─────────────────────────────────────────────────────────────

export function verifyLicense(keyString: string): VerifyResult {
  try {
    const trimmed = (keyString || '').trim()
    const parts = trimmed.split('.')

    // Offline licenses MUST be a 3-part dot-separated RSA token: NOXIS-[TIER].[PAYLOAD].[SIGNATURE]
    if (parts.length !== 3 || !parts[0].toUpperCase().startsWith('NOXIS-')) {
      return { valid: false, error: 'INVALID_FORMAT: Key must be a valid 3-part cryptographic license (NOXIS-[TIER].[PAYLOAD].[SIGNATURE])' }
    }

    const header = parts[0].toUpperCase() // e.g. "NOXIS-ELITE"
    const tierStr = header.slice(6).toLowerCase() // "elite"
    const payloadB64 = parts[1]
    const sigB64 = parts[2]

    if (!tierStr || !['lite', 'pro', 'elite'].includes(tierStr) || !payloadB64 || !sigB64) {
      return { valid: false, error: 'INVALID_FORMAT' }
    }

    // 1. Decode payload
    let payload: LicensePayload
    try {
      const payloadJson = b64urlDecode(payloadB64).toString('utf8')
      payload = JSON.parse(payloadJson)
    } catch {
      return { valid: false, error: 'PAYLOAD_DECODE_FAILED' }
    }

    // 2. Verify RSA-SHA256 signature
    // The signed material is the literal BASE64URL payload string (not decoded)
    const sigBuf = b64urlDecode(sigB64)
    const verify = crypto.createVerify('SHA256')
    verify.update(payloadB64, 'utf8')
    let sigValid = false
    try {
      sigValid = verify.verify(NOXIS_PUBLIC_KEY, sigBuf)
    } catch {
      return { valid: false, error: 'SIGNATURE_VERIFY_ERROR' }
    }

    if (!sigValid) {
      return { valid: false, error: 'SIGNATURE_INVALID' }
    }

    // 3. Verify payload version
    if (payload.version !== 2) {
      return { valid: false, error: 'VERSION_MISMATCH' }
    }

    // 4. Verify tier matches key prefix
    if (payload.tier !== tierStr) {
      return { valid: false, error: 'TIER_MISMATCH' }
    }

    // 5. Verify HWID binding
    const currentHWID = generateHWID()
    const cachedHWID = getCachedHWID()
    const installHWID = getInstallationHWID()

    const isMatch =
      payload.hwid === currentHWID ||
      (cachedHWID && payload.hwid === cachedHWID) ||
      (installHWID && payload.hwid === installHWID)

    if (!isMatch) {
      // If machine has not yet been bound to another HWID, bind this cryptographically valid key's HWID
      if (!installHWID) {
        setInstallationHWID(payload.hwid)
      } else {
        return { valid: false, error: 'HWID_MISMATCH' }
      }
    }

    // 6. Verify expiry (0 = lifetime)
    if (payload.expiresAt !== 0 && Date.now() > payload.expiresAt) {
      return { valid: false, error: 'LICENSE_EXPIRED' }
    }

    return { valid: true, payload }

  } catch (err: any) {
    return { valid: false, error: `VERIFY_EXCEPTION: ${err.message}` }
  }
}

// ── Persistence helpers ───────────────────────────────────────────────────────

export function getRawLicensePayload(): LicensePayload | null {
  const raw = getLicensePayload()
  if (!raw) return null
  try {
    return JSON.parse(raw) as LicensePayload
  } catch {
    return null
  }
}

export function isLicenseExpired(payload: LicensePayload | null): boolean {
  if (!payload) return false
  if (!payload.expiresAt || payload.expiresAt === 0) return false
  return Date.now() > payload.expiresAt
}

export function getActiveLicensePayload(): LicensePayload | null {
  const payload = getRawLicensePayload()
  if (!payload) return null
  if (isLicenseExpired(payload)) {
    return null
  }
  return payload
}

export function persistLicense(payload: LicensePayload): void {
  setLicensePayload(JSON.stringify(payload))
  if (payload.hwid) {
    setInstallationHWID(payload.hwid)
  }
}

export function revokeLicense(): void {
  clearLicensePayload()
}

