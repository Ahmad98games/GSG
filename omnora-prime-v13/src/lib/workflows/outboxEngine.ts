/**
 * ============================================================================
 * Noxis Hub — Workflow Automations Engine Phase-2
 * Outbox Queue, Anti-Spam Deduplication, 24-hr Cooldown & Night Reconciliation
 * Target File: src/lib/workflows/outboxEngine.ts
 * ============================================================================
 */

import { db } from '@/lib/db/client';
import { randomUUID, createHash } from 'crypto';
import { broadcastToHubRenderer, broadcastSyncToMobileDevices } from '@/lib/mobile-bridge/server';

export interface WorkflowEnqueueParams {
  businessId: string;
  eventType: string;
  entityId: string;
  payload: Record<string, any>;
  recipient?: string;
}

export interface WorkflowRuleRecord {
  id: string;
  business_id: string;
  name: string;
  trigger_event: string;
  trigger_conditions: string | null;
  action_type: string;
  action_config: string | null;
  is_active: number;
}

export interface WorkflowRunRecord {
  id: string;
  business_id: string;
  workflow_id: string | null;
  workflow_name: string;
  event_type: string;
  event_hash: string;
  recipient: string | null;
  trigger_data: Record<string, any>;
  actions_executed: Array<{ type: string; status: string; details?: any }>;
  status: 'completed' | 'failed' | 'throttled';
  error?: string;
  created_at: string;
}

let outboxProcessTimer: NodeJS.Timeout | null = null;
let isProcessingOutbox = false;
let nightSchedulerTimer: NodeJS.Timeout | null = null;

function getSqlite() {
  try {
    return (db as any).$client || null;
  } catch {
    return null;
  }
}

/**
 * 1. ZERO COUNTER LATENCY (Decoupled Background Outbox)
 * Inserts the trigger into detached SQLite `workflow_event_queue` in < 0.2ms.
 * Billing counter & Karigar API never wait for network, rules, or alerts.
 */
export function enqueueWorkflowEvent(params: WorkflowEnqueueParams): {
  success: boolean;
  eventHash: string;
  isDuplicate: boolean;
} {
  const sqlite = getSqlite();
  const today = new Date().toISOString().split('T')[0];

  // 2. Anti-Spam & Idempotency: SHA-256 hash of entity_id + trigger_type + date
  const eventHash = createHash('sha256')
    .update(`${params.entityId}:${params.eventType}:${today}`)
    .digest('hex');

  if (!sqlite) {
    console.warn('[WorkflowOutbox] SQLite unavailable. Skipping async outbox insert.');
    return { success: false, eventHash, isDuplicate: false };
  }

  try {
    // Ensure table exists just in case
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS workflow_event_queue (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        event_hash TEXT NOT NULL UNIQUE,
        payload TEXT NOT NULL,
        recipient TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'throttled')),
        retry_count INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        processed_at TEXT
      );
    `);

    // Fast atomic non-blocking write
    const insertStmt = sqlite.prepare(`
      INSERT OR IGNORE INTO workflow_event_queue (
        id, business_id, event_type, entity_id, event_hash, payload, recipient, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
    `);

    const result = insertStmt.run(
      randomUUID(),
      params.businessId,
      params.eventType,
      params.entityId,
      eventHash,
      JSON.stringify(params.payload),
      params.recipient || null
    );

    const isDuplicate = result.changes === 0;
    if (isDuplicate) {
      console.log(`[WorkflowOutbox] Duplicate event suppressed (Idempotency Lock): ${eventHash.slice(0, 12)}`);
    } else {
      // Schedule asynchronous processing without blocking current thread
      scheduleOutboxProcess(100);
    }

    return { success: true, eventHash, isDuplicate };
  } catch (err: any) {
    console.warn('[WorkflowOutbox] Error enqueuing workflow event:', err.message);
    return { success: false, eventHash, isDuplicate: false };
  }
}

/**
 * Schedules debounced outbox queue drainage
 */
export function scheduleOutboxProcess(delayMs = 250): void {
  if (outboxProcessTimer) return;
  outboxProcessTimer = setTimeout(async () => {
    outboxProcessTimer = null;
    try {
      await processWorkflowOutboxQueue();
    } catch (err: any) {
      console.warn('[WorkflowOutbox] Background worker error:', err?.message || err);
    }
  }, delayMs);
}

/**
 * Worker: Processes pending events from workflow_event_queue with 24-hour recipient cooldown
 */
export async function processWorkflowOutboxQueue(): Promise<{
  processed: number;
  throttled: number;
  failed: number;
}> {
  if (isProcessingOutbox) return { processed: 0, throttled: 0, failed: 0 };
  isProcessingOutbox = true;

  const sqlite = getSqlite();
  if (!sqlite) {
    isProcessingOutbox = false;
    return { processed: 0, throttled: 0, failed: 0 };
  }

  let processed = 0;
  let throttled = 0;
  let failed = 0;

  try {
    // Ensure tables exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS workflow_runs (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL,
        workflow_id TEXT,
        workflow_name TEXT,
        event_type TEXT NOT NULL,
        event_hash TEXT,
        recipient TEXT,
        trigger_data TEXT,
        actions_executed TEXT,
        status TEXT NOT NULL CHECK(status IN ('completed', 'failed', 'throttled')),
        error TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS workflow_recipient_cooldowns (
        recipient_key TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        last_notified_at TEXT NOT NULL
      );
    `);

    // Fetch batch of up to 25 pending events
    const pendingEvents = sqlite.prepare(`
      SELECT * FROM workflow_event_queue
      WHERE status = 'pending' AND retry_count < 5
      ORDER BY created_at ASC
      LIMIT 25
    `).all() as any[];

    if (!pendingEvents || pendingEvents.length === 0) {
      isProcessingOutbox = false;
      return { processed: 0, throttled: 0, failed: 0 };
    }

    // Fetch active workflow rules
    let activeRules: WorkflowRuleRecord[] = [];
    try {
      activeRules = sqlite.prepare(`
        SELECT * FROM workflow_rules
        WHERE is_active = 1
      `).all() as WorkflowRuleRecord[];
    } catch {}

    const markProcessingStmt = sqlite.prepare(`UPDATE workflow_event_queue SET status = 'processing' WHERE id = ?`);
    const markCompletedStmt = sqlite.prepare(`UPDATE workflow_event_queue SET status = 'completed', processed_at = datetime('now') WHERE id = ?`);
    const markThrottledStmt = sqlite.prepare(`UPDATE workflow_event_queue SET status = 'throttled', processed_at = datetime('now') WHERE id = ?`);
    const markFailedStmt = sqlite.prepare(`UPDATE workflow_event_queue SET status = 'failed', retry_count = retry_count + 1, error_message = ? WHERE id = ?`);

    const logRunStmt = sqlite.prepare(`
      INSERT INTO workflow_runs (
        id, business_id, workflow_id, workflow_name, event_type, event_hash, recipient, trigger_data, actions_executed, status, error, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    const checkCooldownStmt = sqlite.prepare(`
      SELECT last_notified_at FROM workflow_recipient_cooldowns
      WHERE recipient_key = ? AND event_type = ?
    `);

    const updateCooldownStmt = sqlite.prepare(`
      INSERT OR REPLACE INTO workflow_recipient_cooldowns (recipient_key, event_type, last_notified_at)
      VALUES (?, ?, datetime('now'))
    `);

    const COOLDOWN_24H_MS = 24 * 60 * 60 * 1000;

    for (const event of pendingEvents) {
      markProcessingStmt.run(event.id);

      const payload = JSON.parse(event.payload || '{}');
      const recipient = event.recipient || payload.phone || payload.party_phone || payload.party_id || null;

      // Anti-Spam: Check 24-Hour Cooldown per recipient
      if (recipient) {
        const cooldownRecord = checkCooldownStmt.get(recipient, event.event_type) as { last_notified_at: string } | undefined;
        if (cooldownRecord && cooldownRecord.last_notified_at) {
          const lastTime = new Date(cooldownRecord.last_notified_at).getTime();
          const elapsed = Date.now() - lastTime;

          if (elapsed < COOLDOWN_24H_MS) {
            // Throttled! Suppress alert to prevent spamming
            markThrottledStmt.run(event.id);
            logRunStmt.run(
              randomUUID(),
              event.business_id,
              null,
              '24-Hour Cooldown Guard',
              event.event_type,
              event.event_hash,
              recipient,
              event.payload,
              JSON.stringify([{ type: 'throttle_guard', status: 'skipped', reason: '24-hour recipient cooldown active' }]),
              'throttled',
              `Throttled: Last notified ${Math.round(elapsed / 60000)} mins ago (24-hr limit)`
            );
            throttled++;
            continue;
          }
        }
      }

      // Find matching rules for this trigger
      const matchingRules = activeRules.filter((r) => r.trigger_event === event.event_type);

      if (matchingRules.length === 0) {
        // No explicit custom rule configured, mark completed gracefully
        markCompletedStmt.run(event.id);
        processed++;
        continue;
      }

      let eventExecutedAny = false;

      for (const rule of matchingRules) {
        try {
          const conditions = rule.trigger_conditions ? JSON.parse(rule.trigger_conditions) : {};
          if (!evaluateRuleConditions(conditions, payload)) {
            continue; // Condition did not meet threshold
          }

          const actionConfig = rule.action_config ? JSON.parse(rule.action_config) : {};
          const executedActions = [];

          // Execute action based on type
          if (rule.action_type === 'dashboard_notification') {
            const title = interpolate(actionConfig.title || 'Workflow Alert', payload);
            const message = interpolate(actionConfig.message || 'Workflow triggered automatically', payload);
            const severity = actionConfig.severity || 'info';
            const route = actionConfig.route || '/';

            // 4. UI & Audit: Live dispatch to TopBar NotificationBell & Toast
            broadcastToHubRenderer('WORKFLOW_ALERT', {
              id: randomUUID(),
              title,
              message,
              severity,
              route,
              timestamp: new Date().toISOString(),
            });

            broadcastSyncToMobileDevices('WORKFLOW_ALERT', { title, message, severity });

            executedActions.push({ type: 'dashboard_notification', status: 'delivered', title, severity });
          } else if (rule.action_type === 'whatsapp_notify') {
            const message = interpolate(actionConfig.message_template || 'Noxis Hub Notification', payload);
            const phone = recipient || payload.phone || payload.party_phone;

            if (phone) {
              // Log WhatsApp dispatch to sent log
              try {
                sqlite.prepare(`
                  INSERT INTO whatsapp_sent_log (id, business_id, party_id, recipient_phone, message_type, reference_id, reference_type)
                  VALUES (?, ?, ?, ?, ?, ?, ?)
                `).run(
                  randomUUID(),
                  event.business_id,
                  payload.party_id || null,
                  phone,
                  event.event_type,
                  event.entity_id,
                  'workflow'
                );
              } catch {}

              broadcastToHubRenderer('WHATSAPP_PREPARED', { phone, message, eventType: event.event_type });
              executedActions.push({ type: 'whatsapp_notify', status: 'prepared', recipient: phone });
            }
          } else if (rule.action_type === 'create_task') {
            const title = interpolate(actionConfig.title || 'Follow up required', payload);
            const description = interpolate(actionConfig.description || '', payload);
            try {
              sqlite.prepare(`
                INSERT INTO tasks (id, business_id, title, description, due_date, status, created_at)
                VALUES (?, ?, ?, ?, date('now', '+1 day'), 'pending', datetime('now'))
              `).run(randomUUID(), event.business_id, title, description);
            } catch {}
            executedActions.push({ type: 'create_task', status: 'created', title });
          }

          // Record detailed execution log in workflow_runs
          logRunStmt.run(
            randomUUID(),
            event.business_id,
            rule.id,
            rule.name,
            event.event_type,
            event.event_hash,
            recipient,
            event.payload,
            JSON.stringify(executedActions),
            'completed',
            null
          );

          // Update trigger stats on rule
          try {
            sqlite.prepare(`UPDATE workflow_rules SET trigger_count = trigger_count + 1, last_triggered = datetime('now') WHERE id = ?`).run(rule.id);
          } catch {}

          eventExecutedAny = true;
        } catch (ruleErr: any) {
          logRunStmt.run(
            randomUUID(),
            event.business_id,
            rule.id,
            rule.name,
            event.event_type,
            event.event_hash,
            recipient,
            event.payload,
            JSON.stringify([]),
            'failed',
            ruleErr.message || 'Execution error'
          );
        }
      }

      // Update recipient cooldown after successful alert run
      if (recipient && eventExecutedAny) {
        updateCooldownStmt.run(recipient, event.event_type);
      }

      markCompletedStmt.run(event.id);
      processed++;
    }
  } catch (workerErr: any) {
    console.error('[WorkflowOutbox] Worker run failed:', workerErr.message);
  } finally {
    isProcessingOutbox = false;
  }

  return { processed, throttled, failed };
}

/**
 * Evaluates conditions (amount thresholds, days overdue, quantity)
 */
function evaluateRuleConditions(conditions: Record<string, any>, payload: Record<string, any>): boolean {
  if (!conditions || Object.keys(conditions).length === 0) return true;

  if (conditions.amount_gt !== undefined && Number(payload.total_amount ?? payload.amount ?? 0) <= Number(conditions.amount_gt)) {
    return false;
  }
  if (conditions.amount_lt !== undefined && Number(payload.total_amount ?? payload.amount ?? 0) >= Number(conditions.amount_lt)) {
    return false;
  }
  if (conditions.peshgi_exceeds !== undefined && Number(payload.peshgi_balance ?? payload.amount ?? 0) < Number(conditions.peshgi_exceeds)) {
    return false;
  }
  if (conditions.days_overdue !== undefined && Number(payload.days_overdue ?? 0) < Number(conditions.days_overdue)) {
    return false;
  }
  if (conditions.qty_below !== undefined && Number(payload.current_qty ?? payload.qty_on_hand ?? 0) >= Number(conditions.qty_below)) {
    return false;
  }

  return true;
}

function interpolate(template: string, data: Record<string, any>): string {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return data[key] !== undefined ? String(data[key]) : `{${key}}`;
  });
}

/**
 * 3. SCHEDULED CRON / NIGHT RECONCILIATION
 * Runs outside peak billing hours (21:00 - 06:00 or idle schedule).
 * Scans overdue invoices and runs daily ledger reconciliation without counter slowdown.
 */
export function startNightReconciliationScheduler(checkIntervalMs = 30 * 60 * 1000): void {
  if (nightSchedulerTimer) clearInterval(nightSchedulerTimer);

  const executeNightTasks = () => {
    const currentHour = new Date().getHours();
    // Peak billing hours (09:00 - 20:00) are protected from heavy analytical scans
    const isNightOrEarlyMorning = currentHour >= 21 || currentHour < 7;

    if (!isNightOrEarlyMorning) {
      console.log(`[NightReconciliation] Skipped during peak hours (Current: ${currentHour}:00). Scheduled for night window.`);
      return;
    }

    console.log('[NightReconciliation] Initiating night reconciliation & overdue customer scan...');
    scanOverdueInvoices();
    reconcileDailyLedgers();
  };

  // Run on startup check, then every interval
  setTimeout(executeNightTasks, 5000);
  nightSchedulerTimer = setInterval(executeNightTasks, checkIntervalMs);
}

/**
 * Night Overdue Scanner: Enqueues invoice.overdue triggers with idempotency hash
 */
export function scanOverdueInvoices(): number {
  const sqlite = getSqlite();
  if (!sqlite) return 0;

  try {
    const overdueInvoices = sqlite.prepare(`
      SELECT 
        i.id, i.business_id, i.invoice_number, i.party_id, i.party_name, i.party_phone,
        i.total_amount, i.balance_due, i.due_date,
        CAST((julianday('now') - julianday(COALESCE(i.due_date, i.invoice_date))) AS INTEGER) as days_overdue
      FROM invoices i
      WHERE i.balance_due > 0 
        AND i.status != 'cancelled'
        AND COALESCE(i.due_date, i.invoice_date) < date('now')
      LIMIT 100
    `).all() as any[];

    let enqueued = 0;
    for (const inv of overdueInvoices) {
      const res = enqueueWorkflowEvent({
        businessId: inv.business_id || 'local',
        eventType: 'invoice.overdue',
        entityId: inv.id,
        recipient: inv.party_phone || inv.party_id,
        payload: {
          invoice_id: inv.id,
          invoice_number: inv.invoice_number,
          party_name: inv.party_name || 'Valued Customer',
          phone: inv.party_phone,
          balance_due: inv.balance_due,
          days_overdue: Math.max(1, inv.days_overdue || 1),
        },
      });

      if (!res.isDuplicate) enqueued++;
    }

    if (enqueued > 0) {
      console.log(`[NightReconciliation] Enqueued ${enqueued} overdue invoice alerts safely.`);
    }

    return enqueued;
  } catch (err: any) {
    console.warn('[NightReconciliation] Overdue scan warning:', err.message);
    return 0;
  }
}

/**
 * Night Ledger Reconciliation
 */
export function reconcileDailyLedgers(): void {
  const sqlite = getSqlite();
  if (!sqlite) return;

  try {
    const today = new Date().toISOString().split('T')[0];
    const stats = sqlite.prepare(`
      SELECT 
        COUNT(*) as invoice_count,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COALESCE(SUM(amount_paid), 0) as total_collected
      FROM invoices
      WHERE date(invoice_date) = date('now')
    `).get() as any;

    enqueueWorkflowEvent({
      businessId: 'local',
      eventType: 'schedule.daily',
      entityId: `ledger_recon_${today}`,
      payload: {
        reconciliation_date: today,
        invoices_posted: stats?.invoice_count || 0,
        total_sales: stats?.total_sales || 0,
        total_collected: stats?.total_collected || 0,
      },
    });
  } catch (err: any) {
    console.warn('[NightReconciliation] Daily ledger reconciliation warning:', err.message);
  }
}

// ── AUTOMATIC ENGINE BOOTSTRAP IN NODE ENVIRONMENT ──
if (typeof window === 'undefined') {
  if (!(global as any).__noxis_workflow_scheduler_started) {
    (global as any).__noxis_workflow_scheduler_started = true;
    try {
      startNightReconciliationScheduler();
      console.log('[WorkflowEngine] Phase-2 Outbox and Night Scheduler initialized.');
    } catch (e: any) {
      console.warn('[WorkflowEngine] Scheduler startup warning:', e?.message || e);
    }
  }
}
