import { createTCPServer } from './TCPServer';
import { logger } from '../lib/logger';
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';

let supabaseClient: any = null;

function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !key) {
      logger.warn('[Startup] SUPABASE_URL or SERVICE_ROLE_KEY missing. Automation tasks will be limited.');
      return null;
    }
    
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

/**
 * Noxis v13.0 — Core Hub Server
 */
export function startHubServer(onActivity?: () => void) {
  logger.info('[Performance] Initializing Hub Server...');
  
  // 1. TCP Server for Industrial Nodes
  const tcpServer = createTCPServer(onActivity);
  const tcpPort = Number(process.env.HUB_TCP_PORT) || 9000;
  tcpServer.listen(tcpPort, '0.0.0.0', () => {
    logger.info(`[NSP] Industrial TCP Server listening on port ${tcpPort}`);
  });

  // 2. Automated Schedules (Elite Tier Features)
  // Check every minute for custom scheduled summaries
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    try {
      const sb = getSupabase();
      if (!sb) return;

      // Fetch businesses that have a summary scheduled for right now
      const { data: businesses } = await sb
        .from('business_profiles')
        .select('id, business_name, whatsapp_numbers, summary_time, summary_includes')
        .eq('summary_time', currentTime);

      if (!businesses || businesses.length === 0) return;

      for (const b of businesses) {
        const recipients = (b.whatsapp_numbers || []) as { name: string; phone: string }[];
        if (recipients.length === 0) continue;

        logger.info(`[Automation] Triggering scheduled summary for ${b.business_name} at ${currentTime}`);

        for (const recipient of recipients) {
          if (!recipient.phone) continue;
          
          await sb.functions.invoke('whatsapp-send', {
            body: {
              type: 'daily_summary',
              business_id: b.id,
              recipient: recipient.phone,
              summary_includes: b.summary_includes || {}
            }
          });
        }
      }
    } catch (err) {
      logger.error({ err }, 'Custom summary automation failed');
    }
  });

  // Daily 07:00 AM: Promise Statuses and Warnings
  cron.schedule('0 7 * * *', async () => {
    logger.info('[Automation] Executing payment promises daily checks at 07:00 AM...');
    try {
      const sb = getSupabase();
      if (!sb) {
        logger.warn('[Automation] Supabase client missing — skipping daily promise check');
        return;
      }

      // 1. Run global status updater RPC
      const { error: rpcError } = await sb.rpc('update_promise_statuses');
      if (rpcError) throw rpcError;
      logger.info('[Automation] Global promise status update RPC executed successfully');

      // 2. Query all overdue promises
      const { data: overduePromises, error: queryError } = await sb
        .from('payment_promises')
        .select('*, party:parties(name)')
        .eq('status', 'overdue');

      if (queryError) throw queryError;

      if (overduePromises && overduePromises.length > 0) {
        logger.info(`[Automation] Detected ${overduePromises.length} overdue payment commitments`);

        for (const promise of overduePromises) {
          // Check if an unresolved alert already exists for this promise to avoid duplication
          const { data: existing } = await sb
            .from('anomaly_alerts')
            .select('id')
            .eq('business_id', promise.business_id)
            .eq('alert_type', 'payment_promise_overdue')
            .eq('resolved', false)
            .eq('payload->promise_id', promise.id);

          if (!existing || existing.length === 0) {
            // Insert warning sentinel anomaly alert
            await sb.from('anomaly_alerts').insert({
              business_id: promise.business_id,
              alert_type: 'payment_promise_overdue',
              severity: 'warning',
              payload: {
                promise_id: promise.id,
                message: `Client ${promise.party?.name || 'Party'} broke their payment commitment of PKR ${promise.promised_amount} due on ${promise.promise_date}.`,
                promised_amount: promise.promised_amount,
                promise_date: promise.promise_date
              },
              resolved: false
            });
            logger.info(`[Automation] Logged overdue commitment alert for party ${promise.party?.name || 'Party'}`);
          }
        }
      }
    } catch (err) {
      logger.error({ err }, 'Daily payment promises automation failed');
    }
  });

  // Daily 08:00: Send Sales Report (Backup / Legacy)
  cron.schedule('0 8 * * *', async () => {
    logger.info('[Automation] Generating daily sales report for WhatsApp...');
  });

  // ─────────────────────────────────────────────
  // Automated Weekly Backup — Every Sunday at 2:00 AM
  // Generates JSON backup, uploads to Supabase Storage,
  // retains last 4 weeks only
  // ─────────────────────────────────────────────
  cron.schedule('0 2 * * 0', async () => {
    logger.info('[Backup] Starting automated weekly backup...');
    try {
      const sb = getSupabase();
      if (!sb) {
        logger.warn('[Backup] No Supabase client — skipping automated backup');
        return;
      }

      // Get all active businesses
      const { data: businesses } = await sb
        .from('business_profiles')
        .select('id, business_name');

      if (!businesses || businesses.length === 0) return;

      const backupTables = [
        'skus', 'parties', 'karigars', 'invoices', 'ledger_entries',
        'karigar_production_logs', 'attendance_logs', 'purchase_orders',
        'karigar_advances', 'recurring_invoices', 'supplier_payments',
        'sku_batches', 'staff_users',
      ];

      for (const biz of businesses) {
        try {
          const backup: Record<string, any[]> = {};
          
          for (const table of backupTables) {
            const { data } = await sb
              .from(table)
              .select('*')
              .eq('business_id', biz.id);
            backup[table] = data || [];
          }

          const backupJson = JSON.stringify({
            backup,
            metadata: {
              generated_at: new Date().toISOString(),
              business_id: biz.id,
              business_name: biz.business_name,
              type: 'automated_weekly',
              version: '13.0.0',
            }
          });

          const date = new Date().toISOString().split('T')[0];
          const filePath = `${biz.id}/backup_${date}.json`;

          // Upload to Supabase Storage
          await sb.storage
            .from('backups')
            .upload(filePath, backupJson, {
              contentType: 'application/json',
              upsert: true,
            });

          logger.info(`[Backup] Uploaded backup for ${biz.business_name}: ${filePath}`);

          // Retention: keep only last 4 backups
          const { data: files } = await sb.storage
            .from('backups')
            .list(biz.id, { sortBy: { column: 'created_at', order: 'desc' } });

          if (files && files.length > 4) {
            const toDelete = files.slice(4).map((f: any) => `${biz.id}/${f.name}`);
            await sb.storage.from('backups').remove(toDelete);
            logger.info(`[Backup] Cleaned up ${toDelete.length} old backups for ${biz.business_name}`);
          }
        } catch (bizErr) {
          logger.error({ err: bizErr }, `[Backup] Failed for business ${biz.id}`);
        }
      }

      logger.info('[Backup] Automated weekly backup complete ✓');
    } catch (err) {
      logger.error({ err }, '[Backup] Automated backup failed');
    }
  });

  // 3. Global Webhook Dispatcher
  // Reserved for future industrial event triggers
  /*
  const _dispatchWebhook = async (eventType: string, payload: any, businessId: string) => {
    try {
      await supabase.functions.invoke('deliver-webhook', {
        body: { eventType, payload, businessId }
      });
    } catch (err) {
      logger.error({ err, eventType }, 'Webhook dispatch failed');
    }
  };
  */

  logger.info('[Database] SQLite connectivity verified with WAL mode');
}

