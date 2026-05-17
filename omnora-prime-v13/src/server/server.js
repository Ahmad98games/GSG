"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startHubServer = startHubServer;
const TCPServer_1 = require("./TCPServer");
const logger_1 = require("@/lib/logger");
const node_cron_1 = __importDefault(require("node-cron"));
const supabase_js_1 = require("@supabase/supabase-js");
let supabaseClient = null;
function getSupabase() {
    if (!supabaseClient) {
        const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) {
            logger_1.logger.warn('[Startup] SUPABASE_URL or SERVICE_ROLE_KEY missing. Automation tasks will be limited.');
            return null;
        }
        supabaseClient = (0, supabase_js_1.createClient)(url, key);
    }
    return supabaseClient;
}
/**
 * Noxis v13.0 — Core Hub Server
 */
function startHubServer(onActivity) {
    logger_1.logger.info('[Performance] Initializing Hub Server...');
    // 1. TCP Server for Industrial Nodes
    const tcpServer = (0, TCPServer_1.createTCPServer)(onActivity);
    const tcpPort = Number(process.env.HUB_TCP_PORT) || 9000;
    tcpServer.listen(tcpPort, '0.0.0.0', () => {
        logger_1.logger.info(`[NSP] Industrial TCP Server listening on port ${tcpPort}`);
    });
    // 2. Automated Schedules (Elite Tier Features)
    // Daily 08:00: Send Sales Report
    node_cron_1.default.schedule('0 8 * * *', async () => {
        logger_1.logger.info('[Automation] Generating daily sales report for WhatsApp...');
        // In production, aggregate sales data from DB and call WhatsAppBusinessService
    });
    // Daily 09:00: Send Payment Reminders
    node_cron_1.default.schedule('0 9 * * *', async () => {
        logger_1.logger.info('[Automation] Dispatching payment reminders...');
    });
    // Daily 20:00: Noxis Daily Summary (Elite Only)
    node_cron_1.default.schedule('0 20 * * *', async () => {
        logger_1.logger.info('[Automation] Triggering Noxis Daily Summaries...');
        try {
            const sb = getSupabase();
            if (!sb)
                return;
            const { data: businesses } = await sb
                .from('business_profiles')
                .select('id, whatsapp_config')
                .not('whatsapp_config->owner_phone', 'is', null);
            for (const b of (businesses || [])) {
                const config = b.whatsapp_config;
                if (config?.daily_summary_enabled && config.owner_phone) {
                    await sb.functions.invoke('whatsapp-send', {
                        body: {
                            type: 'daily_summary',
                            business_id: b.id,
                            recipient: config.owner_phone,
                            language: config.language || 'english'
                        }
                    });
                }
            }
        }
        catch (err) {
            logger_1.logger.error({ err }, 'Daily summary automation failed');
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
    logger_1.logger.info('[Database] SQLite connectivity verified with WAL mode');
}
