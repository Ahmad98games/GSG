// src/services/GuardianService.ts
import crypto from 'crypto';
import { logger } from '@/lib/logger';

/**
 * Noxis — Guardian Authentication Service
 * Verified HMAC Formula: HMAC-SHA256(requestId + ':' + timestamp + ':' + keyHex)
 */
export class GuardianService {
  /**
   * Generates or Verifies a Guardian Authentication Token.
   * Hub side uses this to verify Mobile's approval.
   */
  public static verifyAuthToken(
    requestId: string, 
    timestamp: number, 
    meshKeyHex: string, 
    receivedToken: string
  ): boolean {
    try {
      // THE FORMULA: requestId + ':' + timestamp + ':' + keyHex
      const baseString = `${requestId}:${timestamp}:${meshKeyHex}`;
      
      const expectedToken = crypto
        .createHmac('sha256', Buffer.from(meshKeyHex, 'hex'))
        .update(baseString)
        .digest('hex');

      return expectedToken === receivedToken;
    } catch (err) {
      logger.error({ err }, 'Guardian Token Verification Fault');
      return false;
    }
  }

  /**
   * Helper to generate a token (used for Hub simulation or SOS override)
   */
  public static generateToken(requestId: string, timestamp: number, meshKeyHex: string): string {
    const baseString = `${requestId}:${timestamp}:${meshKeyHex}`;
    return crypto
      .createHmac('sha256', Buffer.from(meshKeyHex, 'hex'))
      .update(baseString)
      .digest('hex');
  }
}

