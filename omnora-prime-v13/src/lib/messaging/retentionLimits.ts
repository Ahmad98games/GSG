export const MESSAGE_RETENTION_DAYS: Record<string, number> = {
  free: 1,   // 24 hours only
  lite: 7,   // 7 days
  pro: 30,  // 30 days
  elite: 3650, // 10 years (unlimited)
}

export const MAX_DEVICES_FOR_MESSAGING: Record<string, number> = {
  free: 1,
  lite: 5,
  pro: 15,
  elite: 50,
}

// Run this daily to clean old messages
export async function cleanupMessages(
  businessId: string,
  tier: string,
  supabase: any
): Promise<void> {
  const days = MESSAGE_RETENTION_DAYS[tier] || 1
  await supabase.rpc('cleanup_old_messages', {
    p_business_id: businessId,
    p_retention_days: days,
  })
}
