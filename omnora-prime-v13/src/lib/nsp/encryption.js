"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NSPEncryption = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * NSP Encryption Module (AES-256-GCM)
 */
exports.NSPEncryption = {
    encrypt(payload, key) {
        const iv = crypto_1.default.randomBytes(12);
        const cipher = crypto_1.default.createCipheriv('aes-256-gcm', key, iv);
        const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
        const tag = cipher.getAuthTag();
        // Packet Structure: [IV(12)] [Tag(16)] [Payload(N)]
        return Buffer.concat([iv, tag, encrypted]);
    },
    decrypt(packet, key) {
        try {
            const iv = packet.subarray(0, 12);
            const tag = packet.subarray(12, 28);
            const encrypted = packet.subarray(28);
            const decipher = crypto_1.default.createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(tag);
            return Buffer.concat([decipher.update(encrypted), decipher.final()]);
        }
        catch (err) {
            throw new Error('DECRYPT_FAIL');
        }
    }
};
