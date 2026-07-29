import { createClient } from '@/lib/supabase/client'
import { queryClient } from '@/lib/queryClient'

// All tables that mobile can write to and Hub needs to receive
const SYNC_TABLES = [
  {
    table: 'attendance_logs',
    orderBy: 'created_at',
    queryKeys: ['attendance', 'dashboard'],
  },
  {
    table: 'karigar_production_logs',
    orderBy: 'created_at',
    queryKeys: ['production', 'dashboard'],
  },
  {
    table: 'peshgi_transactions',
    orderBy: 'given_date',
    queryKeys: ['karigars', 'dashboard'],
  },
  {
    table: 'invoices',
    orderBy: 'created_at',
    queryKeys: ['invoices', 'dashboard'],
  },
  {
    table: 'payments',
    orderBy: 'payment_date',
    queryKeys: ['payments', 'dashboard'],
  },
  {
    table: 'scan_history',
    orderBy: 'scanned_at',
    queryKeys: ['inventory'],
  },
] as const

interface DeltaSyncResult {
  success: boolean
  tablesChecked: number
  rowsPulled: number
  durationMs: number
  error?: string
}

export async function runDeltaSync(
  businessId: string,
  lastSyncAt: number
): Promise<DeltaSyncResult> {
  const supabase = createClient()
  const startTime = Date.now()
  let totalRowsPulled = 0
  const tablesWithNewData: string[] = []

  // Convert Unix ms timestamp to ISO string for Supabase comparison
  const lastSyncIso = lastSyncAt === 0
    ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Default: last 24 hours
    : new Date(lastSyncAt).toISOString()

  console.log(`[DeltaSync] Starting sync from ${lastSyncIso}`)

  try {
    // Run all table syncs in parallel
    await Promise.allSettled(
      SYNC_TABLES.map(async (tableConfig) => {
        const { data, error } = await supabase
          .from(tableConfig.table)
          .select('*')
          .eq('business_id', businessId)
          .gt('created_at', lastSyncIso)
          .order(tableConfig.orderBy, {
            ascending: true,
          })
          .limit(1000) // Safety cap

        if (error) {
          console.error(`[DeltaSync] ${tableConfig.table}:`, error.message)
          return
        }

        const rows = data || []
        if (rows.length > 0) {
          totalRowsPulled += rows.length
          tablesWithNewData.push(tableConfig.table)

          console.log(`[DeltaSync] ${tableConfig.table}: ${rows.length} new rows`)

          // Invalidate relevant TanStack Query caches so UI refreshes
          tableConfig.queryKeys.forEach(key => {
            queryClient.invalidateQueries({
              queryKey: [key, businessId],
            })
          })
        }
      })
    )

    const durationMs = Date.now() - startTime
    const newSyncAt = Date.now()

    // Save sync timestamp to local store
    if (typeof window !== 'undefined' && (window as any).electronAPI?.sync) {
      await (window as any).electronAPI.sync.setLastSyncAt(newSyncAt)
    }

    // Log sync to Supabase for multi-device sync coordination
    await supabase.from('hub_sync_log')
      .insert({
        business_id: businessId,
        device_id: 'hub-pc',
        last_sync_at: new Date(newSyncAt).toISOString(),
        tables_synced: tablesWithNewData,
        rows_pulled: totalRowsPulled,
        sync_duration_ms: durationMs,
      })

    console.log(`[DeltaSync] Complete: ${totalRowsPulled} rows in ${durationMs}ms`)

    return {
      success: true,
      tablesChecked: SYNC_TABLES.length,
      rowsPulled: totalRowsPulled,
      durationMs,
    }

  } catch (err: any) {
    console.error('[DeltaSync] Failed:', err)
    return {
      success: false,
      tablesChecked: 0,
      rowsPulled: 0,
      durationMs: Date.now() - startTime,
      error: err.message,
    }
  }
}

// Called from dashboard or root layout on app mount — runs once per session
export async function bootDeltaSync(
  businessId: string
): Promise<DeltaSyncResult | null> {
  if (!businessId) return null

  // Get last sync time from electron store
  let lastSyncAt = 0
  if (typeof window !== 'undefined' && (window as any).electronAPI?.sync) {
    lastSyncAt = await (window as any).electronAPI.sync.getLastSyncAt()
  }

  // Check if we are online
  if (!navigator.onLine) {
    console.log('[DeltaSync] Offline — skipping boot sync')
    return null
  }

  return runDeltaSync(businessId, lastSyncAt)
}
