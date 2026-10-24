import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function getSqliteInstance() {
  try {
    return (db as any).$client || null;
  } catch {
    return null;
  }
}

/**
 * GET /api/hub/webhooks/test
 * POST /api/hub/webhooks/test
 * Executes an actual live test ping HTTP request to the webhook URL
 * and logs the real response status and latency into the local deliveries history.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint_id, url, secret, name = 'Webhook Endpoint' } = body;

    if (!url) {
      return NextResponse.json({ error: 'Webhook URL required' }, { status: 400 });
    }

    const payload = JSON.stringify({
      event: 'system.ping',
      timestamp: new Date().toISOString(),
      data: {
        message: 'Noxis Hub Live Webhook Test Ping',
        hub_status: 'online',
        test_delivery_id: 'test_' + Date.now(),
      }
    });

    const signature = crypto
      .createHmac('sha256', secret || 'whsec_test')
      .update(payload)
      .digest('hex');

    const startTime = Date.now();
    let status = 0;
    let success = false;
    let responseText = '';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Noxis-Event': 'system.ping',
          'X-Noxis-Signature': signature,
          'User-Agent': 'Noxis-Hub-Webhook/14.0',
        },
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      status = res.status;
      success = res.ok;
      responseText = await res.text().catch(() => '');
    } catch (netErr: any) {
      status = 504;
      success = false;
      responseText = netErr?.message || 'Connection timed out';
    }

    const latency = Date.now() - startTime;

    // Save into SQLite deliveries history if available
    const sqlite = getSqliteInstance();
    if (sqlite) {
      try {
        const tableExists = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='webhook_deliveries'").get();
        if (tableExists) {
          sqlite.prepare(`
            INSERT INTO webhook_deliveries (
              id, business_id, endpoint_id, endpoint_name, event_type, 
              payload, response_status, response_body, success, latency_ms, delivered_at
            ) VALUES (?, 'local', ?, ?, 'system.ping', ?, ?, ?, ?, ?, datetime('now'))
          `).run(
            'del_' + Date.now(),
            endpoint_id || 'test_endpoint',
            name,
            payload,
            status,
            responseText.slice(0, 1000),
            success ? 1 : 0,
            latency
          );
        }
      } catch {}
    }

    return NextResponse.json({
      success,
      status,
      latency_ms: latency,
      response_snippet: responseText.slice(0, 300),
      delivered_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
