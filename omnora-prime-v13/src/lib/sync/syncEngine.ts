import { logger } from '../logger'

const RETRY_DELAYS = [1000, 2000, 4000, 8000, 30000]

/**
 * Executes a sync operation with exponential backoff and jitter.
 */
export async function syncWithRetry<T>(
  operation: () => Promise<T>,
  attempt = 0
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (attempt >= RETRY_DELAYS.length) {
      logger.error({ error }, 'Sync failed after maximum retries')
      throw error
    }
    
    // Calculate delay with jitter
    const delay = RETRY_DELAYS[attempt] + Math.random() * 1000
    
    logger.warn(
      { attempt: attempt + 1, delay: Math.round(delay), error },
      'Sync failed, retrying...'
    )
    
    await new Promise(r => setTimeout(r, delay))
    return syncWithRetry(operation, attempt + 1)
  }
}

/**
 * Initializes a sync schedule with a random jitter offset to prevent 
 * multiple clients from hitting the server simultaneously.
 */
export function startSyncSchedule(
  syncTask: () => Promise<void>,
  baseInterval = 300_000
) {
  const jitter = Math.random() * 10000 // 0-10s jitter
  const initialDelay = Math.random() * baseInterval // Initial offset

  logger.info({ initialDelay: Math.round(initialDelay), jitter: Math.round(jitter) }, 'Sync schedule initialized')

  let intervalId: ReturnType<typeof setInterval> | null = null

  // Randomize initial start
  setTimeout(() => {
    syncTask().catch(err => logger.error({ err }, 'Sync task execution failed'))
    intervalId = setInterval(() => {
      syncTask().catch(err => logger.error({ err }, 'Sync task execution failed'))
    }, baseInterval + jitter)
  }, initialDelay)

  return () => {
    if (intervalId) clearInterval(intervalId)
  }
}
