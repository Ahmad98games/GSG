"use strict";
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
exports.verifyLicense = verifyLicense;
exports.getRawLicensePayload = getRawLicensePayload;
exports.isLicenseExpired = isLicenseExpired;
exports.getActiveLicensePayload = getActiveLicensePayload;
exports.persistLicense = persistLicense;
exports.revokeLicense = revokeLicense;
const crypto = __importStar(require("crypto"));
const hwid_1 = require("./hwid");
const store_1 = require("../store");
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
-----END PUBLIC KEY-----`;
// ── Base64URL helpers ─────────────────────────────────────────────────────────
function b64urlDecode(s) {
    // Base64URL → Base64: replace - with +, _ with /
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - s.length % 4) % 4);
    return Buffer.from(b64, 'base64');
}
// ── Core verifier ─────────────────────────────────────────────────────────────
function verifyLicense(keyString) {
    try {
        const trimmed = (keyString || '').trim();
        const parts = trimmed.split('.');
        // Offline licenses MUST be a 3-part dot-separated RSA token: NOXIS-[TIER].[PAYLOAD].[SIGNATURE]
        if (parts.length !== 3 || !parts[0].toUpperCase().startsWith('NOXIS-')) {
            return { valid: false, error: 'INVALID_FORMAT: Key must be a valid 3-part cryptographic license (NOXIS-[TIER].[PAYLOAD].[SIGNATURE])' };
        }
        const header = parts[0].toUpperCase(); // e.g. "NOXIS-ELITE"
        const tierStr = header.slice(6).toLowerCase(); // "elite"
        const payloadB64 = parts[1];
        const sigB64 = parts[2];
        if (!tierStr || !['lite', 'pro', 'elite'].includes(tierStr) || !payloadB64 || !sigB64) {
            return { valid: false, error: 'INVALID_FORMAT' };
        }
        // 1. Decode payload
        let payload;
        try {
            const payloadJson = b64urlDecode(payloadB64).toString('utf8');
            payload = JSON.parse(payloadJson);
        }
        catch {
            return { valid: false, error: 'PAYLOAD_DECODE_FAILED' };
        }
        // 2. Verify RSA-SHA256 signature
        // The signed material is the literal BASE64URL payload string (not decoded)
        const sigBuf = b64urlDecode(sigB64);
        const verify = crypto.createVerify('SHA256');
        verify.update(payloadB64, 'utf8');
        let sigValid = false;
        try {
            sigValid = verify.verify(NOXIS_PUBLIC_KEY, sigBuf);
        }
        catch {
            return { valid: false, error: 'SIGNATURE_VERIFY_ERROR' };
        }
        if (!sigValid) {
            return { valid: false, error: 'SIGNATURE_INVALID' };
        }
        // 3. Verify payload version
        if (payload.version !== 2) {
            return { valid: false, error: 'VERSION_MISMATCH' };
        }
        // 4. Verify tier matches key prefix
        if (payload.tier !== tierStr) {
            return { valid: false, error: 'TIER_MISMATCH' };
        }
        // 5. Verify HWID binding
        const currentHWID = (0, hwid_1.generateHWID)();
        const cachedHWID = (0, store_1.getCachedHWID)();
        const installHWID = (0, store_1.getInstallationHWID)();
        const isMatch = payload.hwid === currentHWID ||
            (cachedHWID && payload.hwid === cachedHWID) ||
            (installHWID && payload.hwid === installHWID);
        if (!isMatch) {
            // If machine has not yet been bound to another HWID, bind this cryptographically valid key's HWID
            if (!installHWID) {
                (0, store_1.setInstallationHWID)(payload.hwid);
            }
            else {
                return { valid: false, error: 'HWID_MISMATCH' };
            }
        }
        // 6. Verify expiry (0 = lifetime)
        if (payload.expiresAt !== 0 && Date.now() > payload.expiresAt) {
            return { valid: false, error: 'LICENSE_EXPIRED' };
        }
        return { valid: true, payload };
    }
    catch (err) {
        return { valid: false, error: `VERIFY_EXCEPTION: ${err.message}` };
    }
}
// ── Persistence helpers ───────────────────────────────────────────────────────
function getRawLicensePayload() {
    const raw = (0, store_1.getLicensePayload)();
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
function isLicenseExpired(payload) {
    if (!payload)
        return false;
    if (!payload.expiresAt || payload.expiresAt === 0)
        return false;
    return Date.now() > payload.expiresAt;
}
function getActiveLicensePayload() {
    const payload = getRawLicensePayload();
    if (!payload)
        return null;
    if (isLicenseExpired(payload)) {
        return null;
    }
    return payload;
}
function persistLicense(payload) {
    (0, store_1.setLicensePayload)(JSON.stringify(payload));
    if (payload.hwid) {
        (0, store_1.setInstallationHWID)(payload.hwid);
    }
}
function revokeLicense() {
    (0, store_1.clearLicensePayload)();
}
