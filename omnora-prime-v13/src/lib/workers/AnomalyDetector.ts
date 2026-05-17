import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export class AnomalyDetector {
  private static instance: AnomalyDetector
  private intervalId: ReturnType<typeof setInterval> | null = null
  private readonly CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes

  static getInstance(): AnomalyDetector {
    if (!this.instance) this.instance = new AnomalyDetector()
    return this.instance
  }

  start(businessId: string) {
    if (this.intervalId) return
    this.runChecks(businessId)
    this.intervalId = setInterval(
      () => this.runChecks(businessId),
      this.CHECK_INTERVAL
    )
    logger.info({ event: 'anomaly_detector_started', businessId })
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private async runChecks(businessId: string) {
    const supabase = createAdminClient()
    const results = await Promise.allSettled([
      this.checkInventoryDesync(supabase, businessId),
      this.checkLedgerImbalance(supabase, businessId),
      this.checkHeartbeatTimeouts(businessId),
    ])
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        logger.error({ 
          event: 'anomaly_check_failed', 
          check: i, 
          error: r.reason 
        })
      }
    })
  }

  private async checkInventoryDesync(supabase: any, businessId: string) {
    const { data } = await supabase.rpc('detect_inventory_desync', {
      p_business_id: businessId
    })
    if (!data?.length) return
    
    const critical = data.filter((d: any) => d.severity === 'critical')
    if (critical.length > 0) {
      logger.warn({ 
        event: 'inventory_desync_critical',
        count: critical.length,
        skus: critical.map((d: any) => d.sku_code)
      })
      // Store in anomaly_alerts table for dashboard display
      await supabase.from('anomaly_alerts').insert(
        critical.map((d: any) => ({
          business_id: businessId,
          alert_type: 'inventory_desync',
          severity: 'critical',
          payload: d,
          resolved: false
        }))
      )
    }
  }

  private async checkLedgerImbalance(supabase: any, businessId: string) {
    const { data } = await supabase.rpc('detect_ledger_imbalance', {
      p_business_id: businessId
    })
    if (!data?.length) return
    logger.warn({
      event: 'ledger_imbalance_detected',
      accounts: data.map((d: any) => d.account_name)
    })
  }

  private async checkHeartbeatTimeouts(businessId: string) {
    // Check tcp_sessions in local SQLite
    // Any node with last_heartbeat_at > 45 seconds ago = timeout
    const { db } = await import('@/lib/db/client')
    const cutoff = new Date(Date.now() - 45000).toISOString()
    
    // Note: 'as any' used here for tcp_sessions to bypass direct schema reference 
    // if not fully typed in the specific worker context, but matches schema.ts
    const { sql } = await import('drizzle-orm')
    const timedOut = db
      .select()
      .from('tcp_sessions' as any)
      .where(sql`last_heartbeat_at < ${cutoff} AND status = 'online'`)
      .all()
    
    if (timedOut.length > 0) {
      logger.warn({
        event: 'heartbeat_timeout',
        nodes: timedOut.map((n: any) => n.node_id)
      })
    }
  }
}
