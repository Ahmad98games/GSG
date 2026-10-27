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
  client_transaction_id?: string
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('noxis:queue-updated', { detail: { count: queue.length } }))
      }
    }
  } catch {
    // Queue write failure is non-fatal
  }
}

export async function clearOfflineQueue(): Promise<void> {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(QUEUE_KEY)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('noxis:queue-updated', { detail: { count: 0 } }))
      }
    }
  } catch {
    // ignore
  }
}

let offlineDrainDebounceTimer: NodeJS.Timeout | null = null

export function scheduleDebouncedOfflineDrain(delayMs = 25000): void {
  if (offlineDrainDebounceTimer) return
  offlineDrainDebounceTimer = setTimeout(async () => {
    offlineDrainDebounceTimer = null
    try {
      await drainOfflineQueue()
    } catch {}
  }, delayMs)
}

export async function drainOfflineQueue(): Promise<{ drained: number; failed: number }> {
  if (offlineDrainDebounceTimer) {
    clearTimeout(offlineDrainDebounceTimer)
    offlineDrainDebounceTimer = null
  }

  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()

  let drained = 0
  let failed = 0

  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (!raw) return { drained: 0, failed: 0 }

    const queue: QueuedOperation[] = JSON.parse(raw)
    const remaining: QueuedOperation[] = []

    // Filter eligible items vs retrying later
    const eligible: QueuedOperation[] = []
    for (const op of queue) {
      if (op.attempts >= MAX_RETRIES) {
        failed++
        notify.error(
          'Sync failed permanently',
          `Could not save ${op.table} record after ${MAX_RETRIES} attempts.`
        )
        continue
      }
      const delay = RETRY_DELAYS[Math.min(op.attempts, RETRY_DELAYS.length - 1)]
      if (op.lastAttemptAt && Date.now() - op.lastAttemptAt < delay) {
        remaining.push(op)
        continue
      }
      eligible.push(op)
    }

    if (eligible.length === 0) {
      return { drained: 0, failed }
    }

    // Group eligible items by table for batch upsert
    const upsertBatches: Record<string, QueuedOperation[]> = {}
    const individualOps: QueuedOperation[] = []

    for (const op of eligible) {
      if ((op.operation === 'upsert' || op.operation === 'insert') && op.data && typeof op.data === 'object' && !Array.isArray(op.data)) {
        if (!upsertBatches[op.table]) upsertBatches[op.table] = []
        upsertBatches[op.table].push(op)
      } else {
        individualOps.push(op)
      }
    }

    // 1. Process batch upserts (Bulk roundtrip per table)
    for (const [table, batch] of Object.entries(upsertBatches)) {
      if (batch.length === 1) {
        // Just one item, fall to individual
        individualOps.push(batch[0])
        continue
      }

      try {
        const payloadArray = batch.map((b) => b.data)
        const { error } = await supabase.from(table).upsert(payloadArray, { onConflict: 'id', ignoreDuplicates: false })
        if (error) throw error
        drained += batch.length
      } catch (err: any) {
        // Fallback: retry as individual operations
        batch.forEach((b) => {
          b.attempts++
          b.lastAttemptAt = Date.now()
          b.error = err.message || String(err)
          remaining.push(b)
          failed++
        })
      }
    }

    // 2. Process individual / RPC / Delete / Update operations
    for (const op of individualOps) {
      try {
        let result

        if ((op as any).operation === 'rpc') {
          const rpcParams = { ...op.data }
          if (!rpcParams.p_client_transaction_id) {
            rpcParams.p_client_transaction_id = op.client_transaction_id || crypto.randomUUID()
            op.client_transaction_id = rpcParams.p_client_transaction_id
          }
          result = await (supabase as any).rpc(op.table, rpcParams)
        } else if (op.operation === 'insert') {
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
        if (result?.data?.status === 'ERROR') {
          const rpcError = new Error(result.data.message || result.data.error_code || 'RPC transaction failed')
          ;(rpcError as any).error_code = result.data.error_code
          throw rpcError
        }

        drained++
      } catch (err: any) {
        op.attempts++
        op.lastAttemptAt = Date.now()
        op.error = err.message || String(err)
        const errCode = err.error_code || ''
        if (['INSUFFICIENT_STOCK', 'UNAUTHORIZED_BUSINESS', 'PRICE_MISMATCH', 'INVALID_PAYLOAD'].includes(errCode) || op.attempts >= 5) {
          (op as any).status = 'FAILED_PERMANENT'
        }
        remaining.push(op)
        failed++
      }
    }

    localStorage.setItem(
      QUEUE_KEY,
      JSON.stringify(remaining)
    )

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('noxis:queue-updated', { detail: { count: remaining.length } }))
    }

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

export async function pushOfflineOperation(op: any): Promise<void> {
  await queueFailedOperation({ queryKey: [], variables: op, mutationFn: () => {} })
  scheduleDebouncedOfflineDrain(25000)
}

// Auto-drain with a 20-second debounce when connection returns (prevents reconnect IOPS spike)
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    scheduleDebouncedOfflineDrain(20000)
  })
}
