// src/lib/auth/verifyTier.ts
import { createClient } from "@/lib/supabase/client";

export type LicenseTier = 'start' | 'pro' | 'elite';

/**
 * NOXIS License Tier Enforcement
 * Verifies if the business is authorized to access a specific feature.
 */
export async function verifyTier(requiredTier: LicenseTier): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const businessId = user.user_metadata?.business_id;
  if (!businessId) return false;

  // 1. Fetch current license status
  const { data: license, error } = await supabase
    .from('business_licenses')
    .select('tier, status, expires_at')
    .eq('business_id', businessId)
    .single();

  if (error || !license) return false;

  // 2. Check expiry
  if (new Date(license.expires_at) < new Date()) return false;
  if (license.status !== 'active') return false;

  // 3. Hierarchical Tier Check
  const tiers: LicenseTier[] = ['start', 'pro', 'elite'];
  const userTierIndex = tiers.indexOf(license.tier as LicenseTier);
  const requiredTierIndex = tiers.indexOf(requiredTier);

  return userTierIndex >= requiredTierIndex;
}

/**
 * Node Count Enforcement (Industrial Hub)
 * Returns the maximum allowed nodes based on the tier.
 */
export function getMaxAllowedNodes(tier: LicenseTier): number {
  switch (tier) {
    case 'elite': return 70;
    case 'pro': return 15;
    case 'start': return 3;
    default: return 0;
  }
}

