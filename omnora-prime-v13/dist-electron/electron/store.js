"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveSession = saveSession;
exports.clearSession = clearSession;
exports.getSession = getSession;
exports.savePinHash = savePinHash;
exports.getPinHash = getPinHash;
exports.isAppLockEnabled = isAppLockEnabled;
exports.setAppLockEnabled = setAppLockEnabled;
exports.getLockTimeout = getLockTimeout;
exports.setLockTimeout = setLockTimeout;
exports.saveLastRoute = saveLastRoute;
exports.getLastRoute = getLastRoute;
exports.saveLastActive = saveLastActive;
exports.getLastActive = getLastActive;
exports.saveFormDraft = saveFormDraft;
exports.getFormDraft = getFormDraft;
exports.clearFormDraft = clearFormDraft;
exports.saveScrollPosition = saveScrollPosition;
exports.getScrollPosition = getScrollPosition;
exports.getLastSyncAt = getLastSyncAt;
exports.setLastSyncAt = setLastSyncAt;
exports.getAutoStartEnabled = getAutoStartEnabled;
exports.setAutoStartEnabled = setAutoStartEnabled;
exports.getCachedHWID = getCachedHWID;
exports.setCachedHWID = setCachedHWID;
exports.getHWIDMismatchCount = getHWIDMismatchCount;
exports.incrementHWIDMismatch = incrementHWIDMismatch;
exports.resetHWIDMismatch = resetHWIDMismatch;
exports.getTrialNtpStart = getTrialNtpStart;
exports.setTrialNtpStart = setTrialNtpStart;
exports.getTrialElapsedMs = getTrialElapsedMs;
exports.setTrialElapsedMs = setTrialElapsedMs;
exports.getTrialMonoCheckpoint = getTrialMonoCheckpoint;
exports.setTrialMonoCheckpoint = setTrialMonoCheckpoint;
exports.getLicensePayload = getLicensePayload;
exports.setLicensePayload = setLicensePayload;
exports.clearLicensePayload = clearLicensePayload;
exports.getExitFlag = getExitFlag;
exports.setExitFlag = setExitFlag;
const electron_store_1 = __importDefault(require("electron-store"));
const crypto = __importStar(require("crypto"));
const os = __importStar(require("os"));
// Generate a machine-specific encryption key
// This means the store is tied to this PC
// Even if someone copies the store file,
// they cannot read it on another machine
function getMachineKey() {
    const machineId = [
        os.hostname(),
        os.platform(),
        os.arch(),
        os.cpus()[0]?.model || '',
        process.env.USERNAME || process.env.USER || '',
    ].join('|');
    return crypto
        .createHash('sha256')
        .update(machineId)
        .digest('hex')
        .slice(0, 32);
}
const store = new electron_store_1.default({
    projectName: 'noxis-hub',
    name: 'noxis-secure',
    encryptionKey: getMachineKey(),
    clearInvalidConfig: true,
    defaults: {
        supabaseAccessToken: '',
        supabaseRefreshToken: '',
        supabaseTokenExpiry: 0,
        userEmail: '',
        userId: '',
        businessId: '',
        appLockEnabled: false,
        appLockPin: '',
        appLockTimeout: 5,
        lastRoute: '/dashboard',
        lastScrollPositions: {},
        lastFormDrafts: {},
        lastActiveAt: 0,
        setupComplete: false,
        onboardingStep: 0,
        sidebarCollapsed: false,
        theme: 'dark',
        autoStartConfigured: false,
        lastSyncAt: 0,
        autoStartEnabled: true,
        // HWID
        hwid_cached: '',
        hwid_mismatch_count: 0,
        // Trial
        trial_ntp_start: 0,
        trial_elapsed_ms: 0,
        trial_mono_checkpoint: 0,
        // License
        license_payload: '',
        // Power-cut
        exit_flag: 'clean',
    },
});
exports.default = store;
// ── TYPED HELPERS ──
function saveSession(session) {
    store.set('supabaseAccessToken', session.accessToken);
    store.set('supabaseRefreshToken', session.refreshToken);
    store.set('supabaseTokenExpiry', session.expiresAt);
    store.set('userEmail', session.email);
    store.set('userId', session.userId);
}
function clearSession() {
    store.delete('supabaseAccessToken');
    store.delete('supabaseRefreshToken');
    store.delete('supabaseTokenExpiry');
    store.delete('userEmail');
    store.delete('userId');
}
function getSession() {
    const token = store.get('supabaseAccessToken');
    const refresh = store.get('supabaseRefreshToken');
    const expiry = store.get('supabaseTokenExpiry');
    const email = store.get('userEmail');
    const userId = store.get('userId');
    if (!token || !refresh)
        return null;
    return {
        accessToken: token,
        refreshToken: refresh,
        expiresAt: expiry,
        email,
        userId,
        isExpired: Date.now() / 1000 > expiry,
    };
}
function savePinHash(pinHash) {
    store.set('appLockPin', pinHash);
}
function getPinHash() {
    return store.get('appLockPin') || '';
}
function isAppLockEnabled() {
    return store.get('appLockEnabled') || false;
}
function setAppLockEnabled(enabled) {
    store.set('appLockEnabled', enabled);
}
function getLockTimeout() {
    return store.get('appLockTimeout') || 5;
}
function setLockTimeout(minutes) {
    store.set('appLockTimeout', minutes);
}
function saveLastRoute(route) {
    if (route.includes('/login') ||
        route.includes('/setup') ||
        route.includes('/lock'))
        return;
    store.set('lastRoute', route);
}
function getLastRoute() {
    return store.get('lastRoute') || '/dashboard';
}
function saveLastActive() {
    store.set('lastActiveAt', Date.now());
}
function getLastActive() {
    return store.get('lastActiveAt') || 0;
}
function saveFormDraft(key, data) {
    const drafts = store.get('lastFormDrafts') || {};
    drafts[key] = { data, savedAt: Date.now() };
    store.set('lastFormDrafts', drafts);
}
function getFormDraft(key) {
    const drafts = store.get('lastFormDrafts') || {};
    const draft = drafts[key];
    if (!draft)
        return null;
    // Drafts expire after 24 hours
    if (Date.now() - draft.savedAt > 86400000) {
        return null;
    }
    return draft.data;
}
function clearFormDraft(key) {
    const drafts = store.get('lastFormDrafts') || {};
    delete drafts[key];
    store.set('lastFormDrafts', drafts);
}
function saveScrollPosition(route, position) {
    const positions = store.get('lastScrollPositions') || {};
    positions[route] = position;
    store.set('lastScrollPositions', positions);
}
function getScrollPosition(route) {
    const positions = store.get('lastScrollPositions') || {};
    return positions[route] || 0;
}
function getLastSyncAt() {
    return store.get('lastSyncAt') || 0;
}
function setLastSyncAt(ts) {
    store.set('lastSyncAt', ts);
}
function getAutoStartEnabled() {
    return store.get('autoStartEnabled') ?? true;
}
function setAutoStartEnabled(enabled) {
    store.set('autoStartEnabled', enabled);
}
// ── HWID ──
function getCachedHWID() {
    return store.get('hwid_cached') || '';
}
function setCachedHWID(hwid) {
    store.set('hwid_cached', hwid);
}
function getHWIDMismatchCount() {
    return store.get('hwid_mismatch_count') || 0;
}
function incrementHWIDMismatch() {
    const n = getHWIDMismatchCount() + 1;
    store.set('hwid_mismatch_count', n);
    return n;
}
function resetHWIDMismatch() {
    store.set('hwid_mismatch_count', 0);
}
// ── TRIAL ENGINE ──
function getTrialNtpStart() {
    return store.get('trial_ntp_start') || 0;
}
function setTrialNtpStart(ts) {
    store.set('trial_ntp_start', ts);
}
function getTrialElapsedMs() {
    return store.get('trial_elapsed_ms') || 0;
}
function setTrialElapsedMs(ms) {
    store.set('trial_elapsed_ms', ms);
}
function getTrialMonoCheckpoint() {
    return store.get('trial_mono_checkpoint') || 0;
}
function setTrialMonoCheckpoint(ts) {
    store.set('trial_mono_checkpoint', ts);
}
// ── LICENSE PAYLOAD ──
function getLicensePayload() {
    return store.get('license_payload') || '';
}
function setLicensePayload(json) {
    store.set('license_payload', json);
}
function clearLicensePayload() {
    store.set('license_payload', '');
}
// ── EXIT FLAG (power-cut detection) ──
function getExitFlag() {
    return store.get('exit_flag') || 'clean';
}
function setExitFlag(flag) {
    store.set('exit_flag', flag);
}
