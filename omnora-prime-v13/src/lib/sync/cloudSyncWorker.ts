import { db } from '@/lib/db/client'
import { syncQueue } from '@/lib/db/schema'
import { eq, and, lt, sql } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

let isSyncing = false

export async function drainSyncQueue(): Promise<{ synced: number; failed: number }> {
  if (isSyncing) return { synced: 0, failed: 0 }
  isSyncing = true

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
      .limit(50)

    if (items.length === 0) {
      return { synced: 0, failed: 0 }
    }

    console.log(`[CloudSync] Processing ${items.length} items`)

    for (const item of items) {
      try {
        // Mark as processing to avoid concurrent double-processing
        await db
          .update(syncQueue)
          .set({ status: 'processing' })
          .where(eq(syncQueue.id, item.id))

        const payload = JSON.parse(item.payload)
        let result

        if (item.operation === 'delete') {
          // If operation is delete, we expect payload to contain the match filter
          result = await supabase
            .from(item.tableName)
            .delete()
            .match(payload)
        } else if (item.operation === 'update') {
          // If operation is update, payload should contain { data, match }
          result = await supabase
            .from(item.tableName)
            .update(payload.data || payload)
            .match(payload.match || { id: item.recordId })
        } else {
          // insert or upsert behavior
          result = await supabase
            .from(item.tableName)
            .upsert(payload)
        }

        if (result.error) throw result.error

        await db
          .update(syncQueue)
          .set({
            status: 'synced',
            syncedAt: new Date().toISOString(),
          })
          .where(eq(syncQueue.id, item.id))

        synced++

      } catch (err: any) {
        const nextAttempts = item.attempts + 1
        const nextStatus = nextAttempts >= 5 ? 'failed' : 'pending'

        await db
          .update(syncQueue)
          .set({
            attempts: nextAttempts,
            status: nextStatus,
          })
          .where(eq(syncQueue.id, item.id))

        failed++
        console.error(`[CloudSync] Failed ${item.id}: ${err.message || err}`)
      }

      await new Promise(r => setTimeout(r, 50))
    }

    console.log(`[CloudSync] Drain complete: ${synced} synced, ${failed} failed`)

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
