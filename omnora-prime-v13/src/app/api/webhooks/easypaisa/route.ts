import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { confirmPaymentAndPostLedger } from '@/lib/actions/clientPortal';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/security/rateLimiter';

export const dynamic = 'force-dynamic';

// Body size limit enforced via middleware — 
// App Router does not use config.api.bodyParser


export const maxDuration = 10;

/**
 * EASYPAISA WEBHOOK HANDLER
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 
           req.headers.get('x-real-ip') ?? 
           'unknown';
  const contentType = req.headers.get('content-type');
  const signature = req.headers.get('x-easypaisa-signature');

  // 1. Content-Type Validation
  if (contentType !== 'application/json') {
    return new NextResponse('Invalid Content-Type', { status: 400 });
  }

  const body = await req.json();

  // 2. HMAC Signature Verification FIRST
  const secret = process.env.EASYPAISA_HASH_KEY!;
  const expectedSignature = crypto.createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('base64');

  if (signature !== expectedSignature) {
    logger.warn({ event: 'webhook_invalid_signature', provider: 'easypaisa', ip });
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 3. In-memory Rate Limiting (100 req/min)
  if (!checkRateLimit(ip, 100, 60_000)) {
    logger.warn({ event: 'rate_limit_exceeded', ip, endpoint: '/api/webhooks/easypaisa' });
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: { 'Retry-After': '60' }
    });
  }

  // 4. Handle Success
  if (body.transactionStatus === 'SUCCESS') {
    const admin = createAdminClient();
    const { data: intent } = await admin
      .from('portal_payment_intents')
      .select('id')
      .eq('provider_intent_id', body.orderId)
      .single();

    if (intent) {
      logger.info({ event: 'easypaisa_webhook', intentId: intent.id, status: 'received' });
      confirmPaymentAndPostLedger(intent.id).catch(err => {
        logger.error({ err: err.message, intentId: intent.id }, 'ledger_posting_failed');
      });
    }
  }

  // EasyPaisa expected response
  return NextResponse.json({ status: '0000', message: 'Success' });
}

