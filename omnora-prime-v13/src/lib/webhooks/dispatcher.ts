import crypto from 'crypto';
import { db } from '@/lib/db/client';

export interface WebhookEventPayload {
  event: string;
  businessId?: string;
  data: Record<string, any>;
  timestamp?: string;
}

function getSqliteInstance() {
  try {
    return (db as any).$client || null;
  } catch {
    return null;
  }
}

/**
 * Dispatches an event payload to all active registered webhook endpoints.
 * Handles HMAC-SHA256 signature generation, actual HTTP delivery,
 * and logs the response code and latency into local SQLite & memory.
 */
export async function dispatchWebhookEvent(
  eventType: string,
  data: Record<string, any>,
  businessId: string = 'local'
): Promise<void> {
  const sqlite = getSqliteInstance();
  if (!sqlite) return;

  try {
    // 1. Fetch matching active webhook endpoints
    const tableExists = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='webhook_endpoints'").get();
    if (!tableExists) return;

    const endpoints = sqlite.prepare(`
      SELECT id, name, url, secret, events, is_active
      FROM webhook_endpoints
      WHERE is_active = 1
    `).all() as any[];

    if (!endpoints || endpoints.length === 0) return;

    const timestamp = new Date().toISOString();
    const payloadObject = {
      event: eventType,
      business_id: businessId,
      timestamp,
      data,
    };
    const payloadString = JSON.stringify(payloadObject);

    for (const ep of endpoints) {
      let registeredEvents: string[] = [];
      try {
        registeredEvents = typeof ep.events === 'string' ? JSON.parse(ep.events) : ep.events;
      } catch {
        registeredEvents = ['*'];
      }

      // Check if endpoint is subscribed to this event or wildcard
      const matches = 
        registeredEvents.includes('*') ||
        registeredEvents.includes(eventType) ||
        registeredEvents.some((e: string) => eventType.startsWith(e.replace('.*', '')));

      if (!matches) continue;

      // 2. Deliver asynchronously in background
      deliverToEndpoint(ep, eventType, payloadString, businessId, sqlite).catch(() => {});
    }
  } catch (err: any) {
    console.error('[Webhooks] Dispatch error:', err?.message || err);
  }
}

async function deliverToEndpoint(
  endpoint: any,
  eventType: string,
  payloadString: string,
  businessId: string,
  sqlite: any
) {
  const startTime = Date.now();
  let status = 0;
  let success = false;
  let responseText = '';

  try {
    // Generate HMAC-SHA256 signature
    const signature = crypto
      .createHmac('sha256', endpoint.secret || 'noxis_secret')
      .update(payloadString)
      .digest('hex');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Noxis-Event': eventType,
        'X-Noxis-Signature': signature,
        'X-Noxis-Delivery': 'del_' + Date.now(),
        'User-Agent': 'Noxis-Hub-Webhook/14.0',
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    status = res.status;
    success = res.ok;
    responseText = await res.text().catch(() => '');
  } catch (netErr: any) {
    status = 504;
    success = false;
    responseText = netErr?.message || 'Connection failed';
  }

  const latency = Date.now() - startTime;

  // Log delivery into local SQLite
  try {
    const tableExists = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='webhook_deliveries'").get();
    if (tableExists) {
      sqlite.prepare(`
        INSERT INTO webhook_deliveries (
          id, business_id, endpoint_id, endpoint_name, event_type, 
          payload, response_status, response_body, success, latency_ms, delivered_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        'del_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        businessId,
        endpoint.id,
        endpoint.name,
        eventType,
        payloadString.slice(0, 2000),
        status,
        responseText.slice(0, 1000),
        success ? 1 : 0,
        latency
      );
    }
  } catch (dbErr: any) {
    console.warn('[Webhooks] Failed to record delivery log:', dbErr.message);
  }
}
