import { db } from '@/lib/db/client'
import { syncQueue } from '@/lib/db/schema'
import { eq, and, lt, sql, inArray } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

let isSyncing = false
let debounceTimer: NodeJS.Timeout | null = null
const DEBOUNCE_INTERVAL_MS = 25000 // 25s batch debounce window to prevent Supabase Disk IO exhaustion
const IMMEDIATE_THRESHOLD = 25 // If queue reaches 25 items, flush immediately

/**
 * Schedules a debounced sync drain. Bundles rapid mutations over a 25-second window
 * into a single bulk sync execution to avoid depleting Supabase's Disk IOPS budget.
 */
export function scheduleDebouncedDrain(delayMs = DEBOUNCE_INTERVAL_MS): void {
  if (debounceTimer) return // Timer already running, will flush pending items

  debounceTimer = setTimeout(async () => {
    debounceTimer = null
    try {
      await drainSyncQueue()
    } catch (err: any) {
      console.warn('[CloudSync] Debounced drain error:', err?.message || err)
    }
  }, delayMs)
}

/**
 * Triggers sync queue processing with bulk upsert batches per table.
 */
export async function drainSyncQueue(): Promise<{ synced: number; failed: number }> {
  if (isSyncing) return { synced: 0, failed: 0 }
  isSyncing = true

  // Clear debounce timer if running manually or triggered
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  let synced = 0
  let failed = 0

  try {
    const items = await db
      .select()
      .from(syncQueue)
      .where(
        and(
          eq(syncQueue.status, 'pending'),
          lt(syncQueue.attempts, 5)
        )
      )
      .orderBy(syncQueue.createdAt)
      .limit(100)

    if (items.length === 0) {
      return { synced: 0, failed: 0 }
    }

    console.log(`[CloudSync] Bulk processing ${items.length} items (bundled batch)`)

    // Mark pulled items as processing in a single atomic query
    const itemIds = items.map((i: { id: string }) => i.id)
    await db
      .update(syncQueue)
      .set({ status: 'processing' })
      .where(inArray(syncQueue.id, itemIds))

    // Group items by table and operation for bulk execution
    const tableGroups: Record<
      string,
      {
        upserts: typeof items
        updates: typeof items
        deletes: typeof items
      }
    > = {}

    for (const item of items) {
      if (!tableGroups[item.tableName]) {
        tableGroups[item.tableName] = { upserts: [], updates: [], deletes: [] }
      }
      if (item.operation === 'delete') {
        tableGroups[item.tableName].deletes.push(item)
      } else if (item.operation === 'update') {
        tableGroups[item.tableName].updates.push(item)
      } else {
        tableGroups[item.tableName].upserts.push(item)
      }
    }

    const nowIso = new Date().toISOString()

    // ── PROCESS EACH TABLE IN BULK ──
    for (const [tableName, group] of Object.entries(tableGroups)) {
      // 1. BULK UPSERTS (Single round-trip & single WAL commit per table)
      if (group.upserts.length > 0) {
        try {
          const payloads = group.upserts.map((i: { payload: string }) => {
            const parsed = JSON.parse(i.payload)
            return parsed
          })

          const { error } = await supabase
            .from(tableName)
            .upsert(payloads, { onConflict: 'id', ignoreDuplicates: false })

          if (error) throw error

          const successfulIds = group.upserts.map((i: { id: string }) => i.id)
          await db
            .update(syncQueue)
            .set({ status: 'synced', syncedAt: nowIso })
            .where(inArray(syncQueue.id, successfulIds))

          synced += successfulIds.length
        } catch (err: any) {
          console.error(`[CloudSync] Bulk upsert error on ${tableName}:`, err.message || err)
          // Mark attempts on these items
          for (const item of group.upserts) {
            const nextAttempts = item.attempts + 1
            await db
              .update(syncQueue)
              .set({
                attempts: nextAttempts,
                status: nextAttempts >= 5 ? 'failed' : 'pending',
              })
              .where(eq(syncQueue.id, item.id))
            failed++
          }
        }
      }

      // 2. BULK DELETES
      if (group.deletes.length > 0) {
        try {
          const deleteRecordIds = group.deletes.map((i: { recordId: string }) => i.recordId).filter(Boolean)
          if (deleteRecordIds.length > 0) {
            const { error } = await supabase
              .from(tableName)
              .delete()
              .in('id', deleteRecordIds)

            if (error) throw error
          }

          const successfulIds = group.deletes.map((i: { id: string }) => i.id)
          await db
            .update(syncQueue)
            .set({ status: 'synced', syncedAt: nowIso })
            .where(inArray(syncQueue.id, successfulIds))

          synced += successfulIds.length
        } catch (err: any) {
          console.error(`[CloudSync] Bulk delete error on ${tableName}:`, err.message || err)
          for (const item of group.deletes) {
            const nextAttempts = item.attempts + 1
            await db
              .update(syncQueue)
              .set({
                attempts: nextAttempts,
                status: nextAttempts >= 5 ? 'failed' : 'pending',
              })
              .where(eq(syncQueue.id, item.id))
            failed++
          }
        }
      }

      // 3. UPDATES (Handled with targeted matching)
      if (group.updates.length > 0) {
        for (const item of group.updates) {
          try {
            const payload = JSON.parse(item.payload)
            const { error } = await supabase
              .from(item.tableName)
              .update(payload.data || payload)
              .match(payload.match || { id: item.recordId })

            if (error) throw error

            await db
              .update(syncQueue)
              .set({ status: 'synced', syncedAt: nowIso })
              .where(eq(syncQueue.id, item.id))

            synced++
          } catch (err: any) {
            const nextAttempts = item.attempts + 1
            await db
              .update(syncQueue)
              .set({
                attempts: nextAttempts,
                status: nextAttempts >= 5 ? 'failed' : 'pending',
              })
              .where(eq(syncQueue.id, item.id))
            failed++
          }
        }
      }
    }

    console.log(`[CloudSync] Drain complete: ${synced} synced in bulk, ${failed} failed`)

  } catch (err: any) {
    console.error('[CloudSync] Worker error:', err.message || err)
  } finally {
    isSyncing = false
  }

  return { synced, failed }
}

export async function getSyncQueueStats() {
  try {
    const pending = await db
      .select({ count: sql<number>`count(*)` })
      .from(syncQueue)
      .where(
        and(
          eq(syncQueue.status, 'pending'),
          lt(syncQueue.attempts, 5)
        )
      )

    const failedItems = await db
      .select({ count: sql<number>`count(*)` })
      .from(syncQueue)
      .where(
        and(
          eq(syncQueue.status, 'failed'),
          sql`${syncQueue.attempts} >= 5`
        )
      )

    return {
      pending: pending[0]?.count || 0,
      failed: failedItems[0]?.count || 0,
    }
  } catch {
    return { pending: 0, failed: 0 }
  }
}

