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
 * JAZZCASH WEBHOOK HANDLER
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 
           req.headers.get('x-real-ip') ?? 
           'unknown';
  const contentType = req.headers.get('content-type');

  // 1. Content-Type Validation
  if (contentType !== 'application/json') {
    return new NextResponse('Invalid Content-Type', { status: 400 });
  }

  const body = await req.json();
  const pp_SecureHash = body.pp_SecureHash;
  const dataToHash = { ...body };
  delete dataToHash.pp_SecureHash;

  // 2. HMAC Signature Verification FIRST
  const secret = process.env.JAZZCASH_INTEGRITY_SALT!;
  const sortedKeys = Object.keys(dataToHash).sort();
  let baseString = secret;
  for (const key of sortedKeys) {
    if (dataToHash[key] !== '') baseString += '&' + dataToHash[key];
  }

  const expectedHash = crypto.createHmac('sha256', secret).update(baseString).digest('hex').toUpperCase();

  if (pp_SecureHash !== expectedHash) {
    logger.warn({ event: 'webhook_invalid_signature', provider: 'jazzcash', ip });
    return NextResponse.json({ responseCode: '401', responseMessage: 'Invalid Hash' });
  }

  // 3. In-memory Rate Limiting (100 req/min)
  if (!checkRateLimit(ip, 100, 60_000)) {
    logger.warn({ event: 'rate_limit_exceeded', ip, endpoint: '/api/webhooks/jazzcash' });
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: { 'Retry-After': '60' }
    });
  }

  // 4. Handle Success
  if (body.pp_ResponseCode === '000') {
    const admin = createAdminClient();
    const { data: intent } = await admin
      .from('portal_payment_intents')
      .select('id')
      .eq('provider_intent_id', body.pp_TxnRefNo)
      .single();

    if (intent) {
      logger.info({ event: 'jazzcash_webhook', intentId: intent.id, status: 'received' });
      confirmPaymentAndPostLedger(intent.id).catch(err => {
        logger.error({ err: err.message, intentId: intent.id }, 'ledger_posting_failed');
      });
    }
  }

  return NextResponse.json({ responseCode: '000', responseMessage: 'Success' });
}

