"use strict";
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
exports.fetchNTPTime = fetchNTPTime;
exports.checkpointMonotonicElapsed = checkpointMonotonicElapsed;
exports.setDbPath = setDbPath;
exports.initTrialEngine = initTrialEngine;
exports.computeTrialAge = computeTrialAge;
exports.getTrialState = getTrialState;
exports.isTrialActive = isTrialActive;
exports.isInGrace = isInGrace;
exports.isTrialExpired = isTrialExpired;
const https = __importStar(require("https"));
const fs = __importStar(require("fs"));
const store_1 = require("../store");
// ── Constants ─────────────────────────────────────────────────────────────────
const TRIAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const GRACE_DURATION_MS = 3 * 24 * 60 * 60 * 1000; //  3 days extra
const TOTAL_CUTOFF_MS = TRIAL_DURATION_MS + GRACE_DURATION_MS; // 17 days
// ── NTP Fetch ─────────────────────────────────────────────────────────────────
/**
 * Fetches current UTC time from Cloudflare's time endpoint.
 * Returns epoch ms. Falls back to Date.now() if unreachable.
 */
function fetchNTPTime() {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            resolve(Date.now());
        }, 4000);
        const req = https.get('https://time.cloudflare.com', (res) => {
            // Cloudflare returns Date header in HTTP response
            const dateHeader = res.headers['date'];
            clearTimeout(timeout);
            if (dateHeader) {
                const parsed = new Date(dateHeader).getTime();
                if (!isNaN(parsed)) {
                    resolve(parsed);
                    return;
                }
            }
            // Drain response
            res.resume();
            resolve(Date.now());
        });
        req.on('error', () => {
            clearTimeout(timeout);
            resolve(Date.now());
        });
        req.setTimeout(4000, () => {
            req.destroy();
            clearTimeout(timeout);
            resolve(Date.now());
        });
    });
}
// ── Monotonic Drift Tracking ──────────────────────────────────────────────────
let monoSessionStart = 0; // hrtime ms at app boot — set by initTrialEngine()
/**
 * Returns total accumulated monotonic runtime in ms.
 * = stored accumulated ms from previous sessions + current session runtime
 */
function getMonotonicAge() {
    const stored = (0, store_1.getTrialElapsedMs)();
    const sessionRunMs = monoSessionStart > 0
        ? (Date.now() - monoSessionStart)
        : 0;
    return stored + sessionRunMs;
}
/**
 * Saves current monotonic elapsed ms to store. Called every 30s and on exit.
 */
function checkpointMonotonicElapsed() {
    const total = getMonotonicAge();
    (0, store_1.setTrialElapsedMs)(total);
    (0, store_1.setTrialMonoCheckpoint)(Date.now());
}
// ── FS Birthtime Source ───────────────────────────────────────────────────────
let dbFilePath = '';
function setDbPath(p) {
    dbFilePath = p;
}
function getFsBirthtimeAge() {
    if (!dbFilePath)
        return 0;
    try {
        const stat = fs.statSync(dbFilePath);
        // birthtime is when the file was first created
        const birthMs = stat.birthtimeMs || stat.ctimeMs;
        return Math.max(0, Date.now() - birthMs);
    }
    catch {
        return 0;
    }
}
// ── Init ──────────────────────────────────────────────────────────────────────
/**
 * Must be called once on app boot (after store is ready).
 * Fetches NTP time on first run and sets monoSessionStart.
 */
async function initTrialEngine(dbPath) {
    setDbPath(dbPath);
    monoSessionStart = Date.now();
    // Source 1: NTP — only on first ever run
    if ((0, store_1.getTrialNtpStart)() === 0) {
        const ntpTime = await fetchNTPTime();
        (0, store_1.setTrialNtpStart)(ntpTime);
    }
}
// ── Core Calculation ──────────────────────────────────────────────────────────
function computeTrialAge() {
    const ntpStart = (0, store_1.getTrialNtpStart)();
    const ntpAgeMs = ntpStart > 0 ? Math.max(0, Date.now() - ntpStart) : 0;
    const monoAgeMs = getMonotonicAge();
    const fsAgeMs = getFsBirthtimeAge();
    // Maximum wins — cannot be fooled by rolling back any single source
    const trialAgeMs = Math.max(ntpAgeMs, monoAgeMs, fsAgeMs);
    return { trialAgeMs, ntpAgeMs, monoAgeMs, fsAgeMs };
}
// ── Public API ────────────────────────────────────────────────────────────────
function getTrialState() {
    const { trialAgeMs, ntpAgeMs, monoAgeMs, fsAgeMs } = computeTrialAge();
    let status;
    let daysLeft = 0;
    let graceDaysLeft = 0;
    if (trialAgeMs < TRIAL_DURATION_MS) {
        status = 'active';
        daysLeft = Math.ceil((TRIAL_DURATION_MS - trialAgeMs) / (24 * 60 * 60 * 1000));
    }
    else if (trialAgeMs < TOTAL_CUTOFF_MS) {
        status = 'grace';
        graceDaysLeft = Math.ceil((TOTAL_CUTOFF_MS - trialAgeMs) / (24 * 60 * 60 * 1000));
    }
    else {
        status = 'expired';
    }
    return {
        status,
        daysLeft,
        graceDaysLeft,
        trialAgeMs,
        sources: { ntpAgeMs, monoAgeMs, fsAgeMs },
    };
}
function isTrialActive() {
    return getTrialState().status === 'active';
}
function isInGrace() {
    return getTrialState().status === 'grace';
}
function isTrialExpired() {
    return getTrialState().status === 'expired';
}
