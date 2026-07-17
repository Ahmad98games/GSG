import { notify } from '@/stores/notificationStore'

const QUEUE_KEY = 'noxis_offline_ops'
const MAX_RETRIES = 5
const RETRY_DELAYS = [
  2000, 5000, 15000, 60000, 300000
] // exponential backoff

export interface QueuedOperation {
  id: string
  table: string
  operation: 'insert' | 'update' | 'upsert' | 'delete'
  data: any
  matchColumn?: string
  matchValue?: string
  createdAt: number
  attempts: number
  lastAttemptAt?: number
  error?: string
}

export async function queueFailedOperation(params: {
  queryKey: unknown[]
  variables: any
  mutationFn: Function
  successMessage?: string
}): Promise<void> {
  // Store a serializable version of the failed operation for retry
  try {
    const existing = localStorage.getItem(QUEUE_KEY)
    const queue: QueuedOperation[] = existing ? JSON.parse(existing) : []

    // We store the variables only — the mutationFn is recreated on drain using the table/operation extracted from variables
    if (params.variables?.table && params.variables?.data) {
      queue.push({
        id: `op_${Date.now()}`,
        table: params.variables.table,
        operation: params.variables.operation || 'upsert',
        data: params.variables.data,
        matchColumn: params.variables.matchColumn,
        matchValue: params.variables.matchValue,
        createdAt: Date.now(),
        attempts: 0,
      })

      localStorage.setItem(
        QUEUE_KEY,
        JSON.stringify(queue.slice(-100))
      )
    }
  } catch {
    // Queue write failure is non-fatal
  }
}

export async function drainOfflineQueue(): Promise<{ drained: number; failed: number }> {
  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()

  let drained = 0
  let failed = 0

  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (!raw) return { drained: 0, failed: 0 }

    const queue: QueuedOperation[] = JSON.parse(raw)
    const remaining: QueuedOperation[] = []

    for (const op of queue) {
      if (op.attempts >= MAX_RETRIES) {
        // Give up on this operation
        failed++
        notify.error(
          'Sync failed permanently',
          `Could not save ${op.table} record after ${MAX_RETRIES} attempts.`
        )
        continue
      }

      // Exponential backoff check
      const delay = RETRY_DELAYS[
        Math.min(op.attempts, RETRY_DELAYS.length - 1)
      ]
      if (op.lastAttemptAt && (Date.now() - op.lastAttemptAt < delay)) {
        remaining.push(op)
        continue
      }

      try {
        let result

        if (op.operation === 'insert') {
          result = await supabase
            .from(op.table)
            .insert(op.data)
        } else if (op.operation === 'upsert') {
          result = await supabase
            .from(op.table)
            .upsert(op.data)
        } else if (op.operation === 'update' && op.matchColumn) {
          result = await supabase
            .from(op.table)
            .update(op.data)
            .eq(op.matchColumn, op.matchValue)
        } else if (op.operation === 'delete' && op.matchColumn) {
          result = await supabase
            .from(op.table)
            .delete()
            .eq(op.matchColumn, op.matchValue)
        }

        if (result?.error) throw result.error

        drained++
        // Don't push to remaining — it's done

      } catch (err: any) {
        op.attempts++
        op.lastAttemptAt = Date.now()
        op.error = err.message || String(err)
        remaining.push(op)
        failed++
      }
    }

    localStorage.setItem(
      QUEUE_KEY,
      JSON.stringify(remaining)
    )

    if (drained > 0) {
      notify.success(
        'Sync complete',
        `${drained} offline action${drained > 1 ? 's' : ''} synced successfully.`
      )
    }

  } catch { /* non-fatal */ }

  return { drained, failed }
}

export function getQueuedCount(): number {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (!raw) return 0
    return JSON.parse(raw).length
  } catch {
    return 0
  }
}

// Auto-drain when connection returns
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    setTimeout(() => {
      drainOfflineQueue()
    }, 1000)
  })
}
