'use server';

import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function saveLicenseToLocal(licenseKey: string, tier: string, isTrial?: boolean, expiresAt?: string) {
  try {
    const key = licenseKey.trim().toUpperCase();
    
    // Store license key
    await db.insert(schema.localConfig)
      .values({
        key: 'license_key',
        value: key
      })
      .onConflictDoUpdate({
        target: schema.localConfig.key,
        set: { value: key, updatedAt: new Date().toISOString() }
      });
    
    // Store tier
    await db.insert(schema.localConfig)
      .values({
        key: 'tier',
        value: tier
      })
      .onConflictDoUpdate({
        target: schema.localConfig.key,
        set: { value: tier, updatedAt: new Date().toISOString() }
      });

    // Store is_trial status
    await db.insert(schema.localConfig)
      .values({
        key: 'is_trial',
        value: isTrial ? 'true' : 'false'
      })
      .onConflictDoUpdate({
        target: schema.localConfig.key,
        set: { value: isTrial ? 'true' : 'false', updatedAt: new Date().toISOString() }
      });

    // Store expires_at
    if (expiresAt) {
      await db.insert(schema.localConfig)
        .values({
          key: 'expires_at',
          value: expiresAt
        })
        .onConflictDoUpdate({
          target: schema.localConfig.key,
          set: { value: expiresAt, updatedAt: new Date().toISOString() }
        });
    }
      
    return { success: true };
  } catch (error) {
    console.error('Failed to save license locally:', error);
    return { success: false, error: 'Database error' };
  }
}

export async function storeBusinessId(businessId: string) {
  try {
    await db.insert(schema.localConfig)
      .values({
        key: 'business_id',
        value: businessId
      })
      .onConflictDoUpdate({
        target: schema.localConfig.key,
        set: { value: businessId, updatedAt: new Date().toISOString() }
      });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
