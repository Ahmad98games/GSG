// src/lib/portal/portal-token-utils.ts
// JWT-based portal token utilities for read-only customer access

import jwt from 'jsonwebtoken';

const PORTAL_SECRET = process.env.PORTAL_JWT_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'noxis-portal-fallback-secret';
const TOKEN_EXPIRY_DAYS = 90;

interface PortalTokenPayload {
  party_id: string;
  business_id: string;
  type: 'portal_access';
}

/**
 * Generate a signed JWT portal token for read-only customer access.
 * Token expires in 90 days.
 */
export function generatePortalToken(partyId: string, businessId: string): {
  token: string;
  expiresAt: Date;
} {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

  const payload: PortalTokenPayload = {
    party_id: partyId,
    business_id: businessId,
    type: 'portal_access',
  };

  const token = jwt.sign(payload, PORTAL_SECRET, {
    expiresIn: `${TOKEN_EXPIRY_DAYS}d`,
  });

  return { token, expiresAt };
}

/**
 * Verify and decode a portal token.
 * Returns the decoded payload or null if invalid/expired.
 */
export function verifyPortalToken(token: string): PortalTokenPayload | null {
  try {
    const decoded = jwt.verify(token, PORTAL_SECRET) as PortalTokenPayload;
    if (decoded.type !== 'portal_access') return null;
    return decoded;
  } catch {
    return null;
  }
}
