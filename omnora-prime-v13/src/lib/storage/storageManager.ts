/**
 * Noxis Hub — Storage Lifecycle & Garbage Collection Manager
 *
 * Automatically inspects and purges expired localStorage cache items older than 24 hours.
 * Prevents localStorage bloat across continuous 10+ hour and multi-week operational runs.
 */

export function cleanupExpiredStorage(): number {
  if (typeof window === 'undefined' || !window.localStorage) return 0;

  const keysToCheck = [
    'noxis_pos_draft_',
    'noxis_dashboard_cache',
    'noxis_khata_cache_',
    'noxis_cached_mandi_rates_',
    'noxis_cached_foresight_',
    'noxis_crm_leads_',
    'noxis_cf_custom_events',
    'noxis_op_queue_',
  ];

  let cleanedCount = 0;

  try {
    const totalKeys = localStorage.length;
    const candidates: string[] = [];

    for (let i = 0; i < totalKeys; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const isNoxisKey = keysToCheck.some((prefix) => key.startsWith(prefix));
      if (!isNoxisKey) continue;
      candidates.push(key);
    }

    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    for (const key of candidates) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;

        const value = JSON.parse(raw);

        // If the cached item has a timestamp and is older than 24 hours, purge it
        const timestamp = value.savedAt || value.cachedAt || value.ts || value.timestamp;
        if (timestamp && typeof timestamp === 'number') {
          if (now - timestamp > ONE_DAY_MS) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        }
      } catch {
        // Corrupted JSON payload — purge immediately
        localStorage.removeItem(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[STORAGE] Cleaned ${cleanedCount} expired cache entries`);
    }
  } catch (err) {
    console.warn('[STORAGE] Cache purge error caught silently:', err);
  }

  return cleanedCount;
}

// Auto-run on client module load and scheduled every 4 hours
if (typeof window !== 'undefined') {
  try {
    cleanupExpiredStorage();
    setInterval(cleanupExpiredStorage, 4 * 60 * 60 * 1000);
  } catch {}
}

