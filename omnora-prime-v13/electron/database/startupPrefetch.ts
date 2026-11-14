/**
 * Noxis Hub — SQLite Startup Compound Prefetch
 *
 * Runs a single compound query prefetch for all initial dashboard & POS requirements.
 * Stores result in a 60-second in-memory cache so initial page mounts resolve in <1ms without disk IO.
 */

export interface StartupCache {
  businessProfile: any;
  todayStats: {
    invoice_count: number;
    total_sales: number;
    receivables: number;
  };
  lowStockCount: { count: number };
  presentToday: { count: number };
  prefetchedAt: number;
}

let _cachedStartupData: StartupCache | null = null;

export function runStartupPrefetch(
  db: any,
  businessId: string = 'local'
): StartupCache {
  // If cache exists and is fresh (<60s old), return immediately from RAM (<0.1ms)
  if (_cachedStartupData && Date.now() - _cachedStartupData.prefetchedAt < 60000) {
    return _cachedStartupData;
  }

  const bId = businessId || 'local';

  // 1. Business Profile
  let profile = null;
  try {
    profile = db.prepare('SELECT * FROM business_profiles WHERE id = ? OR id = "local" LIMIT 1').get(bId)
      || db.prepare('SELECT * FROM business_profiles LIMIT 1').get();
  } catch {
    try {
      profile = db.prepare('SELECT * FROM local_config LIMIT 1').get();
    } catch {}
  }

  // 2. Today's Core Financials
  let todayStats = { invoice_count: 0, total_sales: 0, receivables: 0 };
  try {
    const statsRow = db.prepare(`
      SELECT 
        COUNT(CASE WHEN status != 'void' AND status != 'cancelled' THEN 1 END) as invoice_count,
        COALESCE(SUM(CASE WHEN status != 'void' AND status != 'cancelled' THEN total_amount END), 0) as total_sales,
        COALESCE(SUM(balance_due), 0) as receivables
      FROM invoices 
      WHERE (business_id = ? OR business_id = 'local' OR ? = 'local')
        AND date(invoice_date) = date('now')
    `).get(bId, bId);
    if (statsRow) {
      todayStats = {
        invoice_count: Number(statsRow.invoice_count || 0),
        total_sales: Number(statsRow.total_sales || 0),
        receivables: Number(statsRow.receivables || 0),
      };
    }
  } catch {}

  // 3. Low Stock Alert Counter
  let lowStockCount = { count: 0 };
  try {
    const stockRow = db.prepare(`
      SELECT COUNT(*) as count FROM skus
      WHERE (business_id = ? OR business_id = 'local' OR ? = 'local')
        AND COALESCE(qty_on_hand, 0) <= COALESCE(reorder_level, 0)
        AND is_active = 1
    `).get(bId, bId);
    if (stockRow) {
      lowStockCount = { count: Number(stockRow.count || 0) };
    }
  } catch {}

  // 4. Karigars / Workers Attendance Today
  let presentToday = { count: 0 };
  try {
    const attRow = db.prepare(`
      SELECT COUNT(*) as count 
      FROM attendance_logs
      WHERE (business_id = ? OR business_id = 'local' OR ? = 'local')
        AND date(attendance_date) = date('now')
        AND status = 'present'
    `).get(bId, bId);
    if (attRow) {
      presentToday = { count: Number(attRow.count || 0) };
    }
  } catch {}

  _cachedStartupData = {
    businessProfile: profile,
    todayStats,
    lowStockCount,
    presentToday,
    prefetchedAt: Date.now(),
  };

  return _cachedStartupData;
}

export function getStartupCache(): StartupCache | null {
  if (_cachedStartupData && Date.now() - _cachedStartupData.prefetchedAt < 60000) {
    return _cachedStartupData;
  }
  return null;
}

