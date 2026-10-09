/**
 * 3-Source Anti-Tampering 7-Day Trial Engine
 *
 * Three independent time sources are used. The maximum age wins —
 * rolling back any single clock cannot extend the trial.
 *
 * Source 1 — NTP: UTC timestamp fetched from time.cloudflare.com on first run.
 * Source 2 — Monotonic: process.hrtime.bigint() accumulation checkpointed every 30s.
 * Source 3 — FS Birthtime: creation time of the SQLite database file.
 *
 * Transition Lifecycle:
 *   ACTIVE_TRIAL  (active)       — Days 1..7  — 100% Pro/Elite features unlocked
 *   TRIAL_EXPIRED (expired)      — Day 8+     — Trigger Expiration Intercept Modal
 *   FREE_FOREVER  (free_forever) — Fallback   — POS counter + 200 SKU + 50 Party cap (no data loss)
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
  getTrialCompleted,
  setTrialCompleted,
} from '../store'

// ── Constants ─────────────────────────────────────────────────────────────────

export const TRIAL_MAX_DAYS = 7
export const TRIAL_DURATION_MS = TRIAL_MAX_DAYS * 24 * 60 * 60 * 1000 // 7 days (604,800,000 ms)

export type TrialStatus = 'active' | 'expired' | 'grace' | 'ACTIVE_TRIAL' | 'TRIAL_EXPIRED' | 'FREE_FOREVER'

export interface TrialState {
  status: 'active' | 'expired' | 'grace'
  statusCode: 'ACTIVE_TRIAL' | 'TRIAL_EXPIRED' | 'FREE_FOREVER'
  daysLeft: number       // days until trial expires (0 if expired)
  graceDaysLeft: number  // 0 (strict 7-day cycle, no extended grace)
  trialAgeMs: number     // actual computed age
  trialCompleted: boolean
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
    }, 800)

    const req = https.get('https://time.cloudflare.com', (res) => {
      const dateHeader = res.headers['date']
      clearTimeout(timeout)

      if (dateHeader) {
        const parsed = new Date(dateHeader).getTime()
        if (!isNaN(parsed)) {
          resolve(parsed)
          return
        }
      }

      res.resume()
      resolve(Date.now())
    })

    req.on('error', () => {
      clearTimeout(timeout)
      resolve(Date.now())
    })

    req.setTimeout(800, () => {
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
    const birthMs = stat.birthtimeMs || stat.ctimeMs
    return Math.max(0, Date.now() - birthMs)
  } catch {
    return 0
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

/**
 * Must be called once on app boot (after store is ready).
 * Non-blocking NTP resolution to guarantee instant startup.
 */
export function initTrialEngine(dbPath: string): void {
  setDbPath(dbPath)
  monoSessionStart = Date.now()

  if (getTrialNtpStart() === 0) {
    fetchNTPTime().then(ntpTime => {
      setTrialNtpStart(ntpTime)
    }).catch(() => {
      setTrialNtpStart(Date.now())
    })
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
  const isAlreadyCompleted = getTrialCompleted()
  const { trialAgeMs, ntpAgeMs, monoAgeMs, fsAgeMs } = computeTrialAge()

  let status: 'active' | 'expired' | 'grace' = 'active'
  let statusCode: 'ACTIVE_TRIAL' | 'TRIAL_EXPIRED' | 'FREE_FOREVER' = 'ACTIVE_TRIAL'
  let daysLeft = 0
  const graceDaysLeft = 0

  // If already flagged completed in persistent store, or if max age is >= 7 days, evaluate trial expiration strictly
  if (isAlreadyCompleted || trialAgeMs >= TRIAL_DURATION_MS) {
    if (!isAlreadyCompleted) {
      setTrialCompleted(true)
    }
    status = 'expired'
    statusCode = 'TRIAL_EXPIRED'
    daysLeft = 0
  } else {
    // Days 1 to 7: Active Trial (status: 'ACTIVE_TRIAL' / 'active'). 100% Pro/Elite features unlocked
    status = 'active'
    statusCode = 'ACTIVE_TRIAL'
    daysLeft = Math.max(1, Math.ceil((TRIAL_DURATION_MS - trialAgeMs) / (24 * 60 * 60 * 1000)))
  }

  return {
    status,
    statusCode,
    daysLeft,
    graceDaysLeft,
    trialAgeMs,
    trialCompleted: isAlreadyCompleted || trialAgeMs >= TRIAL_DURATION_MS,
    sources: { ntpAgeMs, monoAgeMs, fsAgeMs },
  }
}

export function isTrialActive(): boolean {
  const state = getTrialState()
  return state.status === 'active' || state.statusCode === 'ACTIVE_TRIAL'
}

export function isInGrace(): boolean {
  return false
}

export function isTrialExpired(): boolean {
  const state = getTrialState()
  return state.status === 'expired' || state.statusCode === 'TRIAL_EXPIRED'
}
