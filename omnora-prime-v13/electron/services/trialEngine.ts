/**
 * 3-Source Anti-Tampering 14-Day Trial Engine
 *
 * Three independent time sources are used. The maximum age wins —
 * rolling back any single clock cannot extend the trial.
 *
 * Source 1 — NTP: UTC timestamp fetched from time.cloudflare.com on first run.
 * Source 2 — Monotonic: process.hrtime.bigint() accumulation checkpointed every 30s.
 * Source 3 — FS Birthtime: creation time of the SQLite database file.
 *
 * States:
 *   active   — days 0..14        — full access per tier
 *   grace    — days 14..17       — POS stays on, sync/CCTV/AI/Mobile>1 locked
 *   expired  — day 17+           — Free Forever (POS + 200 SKU + 50 Party cap, no deletion)
 */

import * as https from 'https'
import * as fs from 'fs'
import {
  getTrialNtpStart,
  setTrialNtpStart,
  getTrialElapsedMs,
  setTrialElapsedMs,
  getTrialMonoCheckpoint,
  setTrialMonoCheckpoint,
} from '../store'

// ── Constants ─────────────────────────────────────────────────────────────────

const TRIAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000   // 14 days
const GRACE_DURATION_MS =  3 * 24 * 60 * 60 * 1000   //  3 days extra
const TOTAL_CUTOFF_MS   = TRIAL_DURATION_MS + GRACE_DURATION_MS // 17 days

export type TrialStatus = 'active' | 'grace' | 'expired'

export interface TrialState {
  status: TrialStatus
  daysLeft: number       // days until trial expires (0 during grace / expired)
  graceDaysLeft: number  // days left in grace window (0 if active / expired)
  trialAgeMs: number     // actual computed age
  sources: {
    ntpAgeMs: number
    monoAgeMs: number
    fsAgeMs: number
  }
}

// ── NTP Fetch ─────────────────────────────────────────────────────────────────

/**
 * Fetches current UTC time from Cloudflare's time endpoint.
 * Returns epoch ms. Falls back to Date.now() if unreachable.
 */
export function fetchNTPTime(): Promise<number> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(Date.now())
    }, 4000)

    const req = https.get('https://time.cloudflare.com', (res) => {
      // Cloudflare returns Date header in HTTP response
      const dateHeader = res.headers['date']
      clearTimeout(timeout)

      if (dateHeader) {
        const parsed = new Date(dateHeader).getTime()
        if (!isNaN(parsed)) {
          resolve(parsed)
          return
        }
      }

      // Drain response
      res.resume()
      resolve(Date.now())
    })

    req.on('error', () => {
      clearTimeout(timeout)
      resolve(Date.now())
    })

    req.setTimeout(4000, () => {
      req.destroy()
      clearTimeout(timeout)
      resolve(Date.now())
    })
  })
}

// ── Monotonic Drift Tracking ──────────────────────────────────────────────────

let monoSessionStart = 0  // hrtime ms at app boot — set by initTrialEngine()

/**
 * Returns total accumulated monotonic runtime in ms.
 * = stored accumulated ms from previous sessions + current session runtime
 */
function getMonotonicAge(): number {
  const stored = getTrialElapsedMs()
  const sessionRunMs = monoSessionStart > 0
    ? (Date.now() - monoSessionStart)
    : 0
  return stored + sessionRunMs
}

/**
 * Saves current monotonic elapsed ms to store. Called every 30s and on exit.
 */
export function checkpointMonotonicElapsed(): void {
  const total = getMonotonicAge()
  setTrialElapsedMs(total)
  setTrialMonoCheckpoint(Date.now())
}

// ── FS Birthtime Source ───────────────────────────────────────────────────────

let dbFilePath = ''

export function setDbPath(p: string): void {
  dbFilePath = p
}

function getFsBirthtimeAge(): number {
  if (!dbFilePath) return 0
  try {
    const stat = fs.statSync(dbFilePath)
    // birthtime is when the file was first created
    const birthMs = stat.birthtimeMs || stat.ctimeMs
    return Math.max(0, Date.now() - birthMs)
  } catch {
    return 0
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

/**
 * Must be called once on app boot (after store is ready).
 * Fetches NTP time on first run and sets monoSessionStart.
 */
export async function initTrialEngine(dbPath: string): Promise<void> {
  setDbPath(dbPath)
  monoSessionStart = Date.now()

  // Source 1: NTP — only on first ever run
  if (getTrialNtpStart() === 0) {
    const ntpTime = await fetchNTPTime()
    setTrialNtpStart(ntpTime)
  }
}

// ── Core Calculation ──────────────────────────────────────────────────────────

export function computeTrialAge(): {
  trialAgeMs: number
  ntpAgeMs: number
  monoAgeMs: number
  fsAgeMs: number
} {
  const ntpStart = getTrialNtpStart()
  const ntpAgeMs  = ntpStart > 0 ? Math.max(0, Date.now() - ntpStart) : 0
  const monoAgeMs = getMonotonicAge()
  const fsAgeMs   = getFsBirthtimeAge()

  // Maximum wins — cannot be fooled by rolling back any single source
  const trialAgeMs = Math.max(ntpAgeMs, monoAgeMs, fsAgeMs)

  return { trialAgeMs, ntpAgeMs, monoAgeMs, fsAgeMs }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getTrialState(): TrialState {
  const { trialAgeMs, ntpAgeMs, monoAgeMs, fsAgeMs } = computeTrialAge()

  let status: TrialStatus
  let daysLeft = 0
  let graceDaysLeft = 0

  if (trialAgeMs < TRIAL_DURATION_MS) {
    status = 'active'
    daysLeft = Math.ceil((TRIAL_DURATION_MS - trialAgeMs) / (24 * 60 * 60 * 1000))
  } else if (trialAgeMs < TOTAL_CUTOFF_MS) {
    status = 'grace'
    graceDaysLeft = Math.ceil((TOTAL_CUTOFF_MS - trialAgeMs) / (24 * 60 * 60 * 1000))
  } else {
    status = 'expired'
  }

  return {
    status,
    daysLeft,
    graceDaysLeft,
    trialAgeMs,
    sources: { ntpAgeMs, monoAgeMs, fsAgeMs },
  }
}

export function isTrialActive(): boolean {
  return getTrialState().status === 'active'
}

export function isInGrace(): boolean {
  return getTrialState().status === 'grace'
}

export function isTrialExpired(): boolean {
  return getTrialState().status === 'expired'
}
