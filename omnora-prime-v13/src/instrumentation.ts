export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { startHubServer } = await import('./server/server')
      startHubServer(() => {
        console.log('[HUB] TCP server started via instrumentation')
      })
    } catch (err) {
      console.error('[HUB] Failed to start hub server via instrumentation:', err)
    }

    // Recurring Invoices Cron Job — runs daily at midnight
    try {
      const cron = await import('node-cron')
      cron.schedule('0 0 * * *', async () => {
        console.log('[CRON] Processing recurring invoices...')
        try {
          const baseUrl = `http://localhost:${process.env.PORT || 3000}`
          const res = await fetch(`${baseUrl}/api/cron/recurring-invoices`, { method: 'POST' })
          const data = await res.json()
          console.log(`[CRON] Recurring invoices processed: ${data.processed || 0} invoices created`)
        } catch (cronErr) {
          console.error('[CRON] Failed to process recurring invoices:', cronErr)
        }
      }, { timezone: 'Asia/Karachi' })
      console.log('[CRON] Recurring invoices cron job registered (daily at midnight)')
    } catch (cronErr) {
      console.error('[CRON] Failed to register recurring invoices cron:', cronErr)
    }
  }
}
