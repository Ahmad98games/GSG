'use server';

import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function saveLicenseToLocal(licenseKey: string, tier: string) {
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
