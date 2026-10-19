/**
 * Autonomous Version-Locked Update Routing and Tier-Gating Engine
 * "Noxis Hub" — Enterprise Architecture
 *
 * Core Business Logic & Version Math Rules:
 *
 * 1. Lite & Pro Plan Rule (Baseline + 1 Major Version Window):
 *    - If a user installs on v14.0.5 or v14.9.0, they are eligible for all patches,
 *      minor updates, and strictly up to +1 Major Version jump (maximum ceiling v15.x.x).
 *    - Once reaching v15, any attempt to fetch or install v16+ triggers an upgrade gate
 *      indicating that an Elite license is required.
 *
 * 2. Elite Plan Rule (Baseline + 2 Major Version Windows):
 *    - Elite tier users receive an extended multi-version maintenance window spanning
 *      up to +2 Major Version jumps from their installation baseline (e.g. v14 baseline -> v16.x.x ceiling).
 *    - Any attempt to jump to v17+ triggers a renewal gate.
 */

import { app } from 'electron'
import { getCachedHWIDOrGenerate } from './hwid'
import { getActiveLicensePayload, type LicenseTier } from './licenseVerifier'
import {
  getBaselineInstallationVersion,
  setBaselineInstallationVersion,
  getBaselineTier,
  setBaselineTier,
  getInstallationHWID,
  setInstallationHWID,
} from '../store'

export interface VersionEligibilityResult {
  allowed: boolean
  requiredTier?: 'lite' | 'pro' | 'elite' | 'enterprise'
  message: string
  installMajor: number
  targetMajor: number
  maxAllowedMajor: number
  maxAllowedVersion: string
}

export interface VersionPolicyStatus {
  baselineVersion: string
  currentVersion: string
  tier: 'lite' | 'pro' | 'elite'
  hwid: string
  maxAllowedMajor: number
  maxAllowedVersion: string
  allowedWindow: string
  whatsappSupportNumber: string
  contactPerson: string
}

/**
 * Robust semantic version parser extracting integer major version.
 * Strips prefixes like 'v' / 'V' and ignores minor, patch, and build suffixes.
 * Examples: "v14.0.5" -> 14, "15.9.1" -> 15, "v16.0.0-rc.1" -> 16
 */
export function parseMajorVersion(versionStr: string): number {
  if (!versionStr || typeof versionStr !== 'string') return 14
  const cleaned = versionStr.trim().replace(/^v/i, '')
  const firstSegment = cleaned.split('.')[0]
  const major = parseInt(firstSegment, 10)
  return isNaN(major) ? 14 : major
}

/**
 * Calculates whether a target update version is eligible under the client's
 * installation baseline version and active license tier.
 */
export function calculateVersionEligibility(
  installVersion: string,
  tier: 'lite' | 'pro' | 'elite',
  targetVersion: string
): VersionEligibilityResult {
  const installMajor = parseMajorVersion(installVersion)
  const targetMajor = parseMajorVersion(targetVersion)

  // Lite & Pro: Baseline + 1 Major ceiling (e.g. v14.x baseline -> v15.x.x ceiling)
  // Elite: Baseline + 2 Major ceiling (e.g. v14.x baseline -> v16.x.x ceiling)
  const majorWindow = tier === 'elite' ? 2 : 1
  const maxAllowedMajor = installMajor + majorWindow
  const maxAllowedVersion = `v${maxAllowedMajor}.x.x`

  // Within eligible ceiling (e.g., target is v14, v15 for Lite/Pro; or v14, v15, v16 for Elite)
  if (targetMajor <= maxAllowedMajor) {
    return {
      allowed: true,
      message: `Target version ${targetVersion} is within eligible window (${maxAllowedVersion}) for ${tier.toUpperCase()} license.`,
      installMajor,
      targetMajor,
      maxAllowedMajor,
      maxAllowedVersion,
    }
  }

  // Exceeds ceiling: Lite or Pro trying to jump to v16+
  if (tier === 'lite' || tier === 'pro') {
    return {
      allowed: false,
      requiredTier: 'elite',
      message: `Your current ${tier.toUpperCase()} license supports updates up to ${maxAllowedVersion}. Upgrade to Elite to unlock v${targetMajor} and beyond.`,
      installMajor,
      targetMajor,
      maxAllowedMajor,
      maxAllowedVersion,
    }
  }

  // Exceeds ceiling: Elite trying to jump to v17+
  return {
    allowed: false,
    requiredTier: 'enterprise',
    message: `Your ELITE license baseline (${installVersion}) maintenance window covers up to ${maxAllowedVersion}. License renewal required to unlock v${targetMajor} and beyond.`,
    installMajor,
    targetMajor,
    maxAllowedMajor,
    maxAllowedVersion,
  }
}

/**
 * Initializes first-run telemetry and captures baseline installation version.
 * Executes on application startup and persists baseline version, hardware ID,
 * and active tier to both encrypted store and SQLite.
 */
export function initAutonomousUpdateBaseline(currentVersion?: string): VersionPolicyStatus {
  const appVer = currentVersion || (app?.isPackaged ? app.getVersion() : '14.0.0')
  const hwid = getCachedHWIDOrGenerate()

  // Determine active tier from signed license or fallback to Pro evaluation / Elite
  let activeTier: 'lite' | 'pro' | 'elite' = 'elite'
  try {
    const lic = getActiveLicensePayload()
    if (lic?.tier && ['lite', 'pro', 'elite'].includes(lic.tier)) {
      activeTier = lic.tier
    } else {
      activeTier = getBaselineTier() || 'elite'
    }
  } catch {
    activeTier = getBaselineTier() || 'elite'
  }

  // Check if baseline installation version already recorded
  let baseline = getBaselineInstallationVersion()
  if (!baseline) {
    baseline = appVer.startsWith('v') ? appVer : `v${appVer}`
    setBaselineInstallationVersion(baseline)
    setBaselineTier(activeTier)
    setInstallationHWID(hwid)
  }

  // Also persist to SQLite license_telemetry table for dual-layer durability
  try {
    const { db } = require('../../src/lib/db/client')
    const sqlite = db?.$client
    if (sqlite) {
      sqlite.prepare(`
        CREATE TABLE IF NOT EXISTS license_telemetry (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          hwid TEXT NOT NULL,
          baseline_installation_version TEXT NOT NULL,
          license_tier TEXT NOT NULL,
          recorded_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `).run()

      sqlite.prepare(`
        INSERT INTO license_telemetry (id, hwid, baseline_installation_version, license_tier, recorded_at, updated_at)
        VALUES (1, ?, ?, ?, datetime('now'), datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          license_tier = excluded.license_tier,
          updated_at = datetime('now')
      `).run(hwid, baseline, activeTier)
    }
  } catch {
    // Non-fatal if sqlite is still initializing
  }

  const installMajor = parseMajorVersion(baseline)
  const majorWindow = activeTier === 'elite' ? 2 : 1
  const maxAllowedMajor = installMajor + majorWindow
  const maxAllowedVersion = `v${maxAllowedMajor}.x.x`

  return {
    baselineVersion: baseline,
    currentVersion: appVer.startsWith('v') ? appVer : `v${appVer}`,
    tier: activeTier,
    hwid,
    maxAllowedMajor,
    maxAllowedVersion,
    allowedWindow: activeTier === 'elite' ? '+2 Major Generations' : '+1 Major Generation',
    whatsappSupportNumber: '923264742678',
    contactPerson: 'Bilal',
  }
}

/**
 * Returns current version policy status for UI and update checks.
 */
export function getVersionPolicy(): VersionPolicyStatus {
  return initAutonomousUpdateBaseline()
}
