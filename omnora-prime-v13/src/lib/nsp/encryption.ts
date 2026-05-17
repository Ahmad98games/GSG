import crypto from 'crypto';

/**
 * NSP Encryption Module (AES-256-GCM)
 */
export const NSPEncryption = {
  encrypt(payload: Buffer, key: Buffer): Buffer {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
    const tag = cipher.getAuthTag();
    
    // Packet Structure: [IV(12)] [Tag(16)] [Payload(N)]
    return Buffer.concat([iv, tag, encrypted]);
  },

  decrypt(packet: Buffer, key: Buffer): Buffer {
    try {
      const iv = packet.subarray(0, 12);
      const tag = packet.subarray(12, 28);
      const encrypted = packet.subarray(28);
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    } catch (err) {
      throw new Error('DECRYPT_FAIL');
    }
  }
};

