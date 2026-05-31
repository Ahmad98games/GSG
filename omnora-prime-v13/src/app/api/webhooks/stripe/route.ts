import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { confirmPaymentAndPostLedger } from '@/lib/actions/clientPortal';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/security/rateLimiter';

export const dynamic = 'force-dynamic';

export const maxDuration = 10;

// Lazy initialize Stripe to prevent build-time errors if ENV is missing
let stripeInstance: Stripe | null = null;
const getStripe = () => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27' as any,
    });
  }
  return stripeInstance;
};

const getWebhookSecret = () => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
  return secret;
};

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 
           req.headers.get('x-real-ip') ?? 
           'unknown';
  const contentType = req.headers.get('content-type');
  const signature = req.headers.get('stripe-signature');

  // 1. Content-Type Validation
  if (contentType !== 'application/json') {
    return new NextResponse('Invalid Content-Type', { status: 400 });
  }

  const payload = await req.text();

  // 2. HMAC Signature Verification FIRST
  let event: Stripe.Event;
  try {
    if (!signature) throw new Error('Missing signature');
    const stripe = getStripe();
    const webhookSecret = getWebhookSecret();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    logger.warn({ event: 'webhook_invalid_signature', provider: 'stripe', ip, error: err.message });
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 3. In-memory Rate Limiting (100 req/min)
  if (!checkRateLimit(ip, 100, 60_000)) {
    logger.warn({ event: 'rate_limit_exceeded', ip, endpoint: '/api/webhooks/stripe' });
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: { 'Retry-After': '60' }
    });
  }

  // Handle successful payment
  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent;
    const intentId = intent.metadata.intentId;

    if (intentId) {
      logger.info({ event: 'stripe_webhook', intentId, status: 'received' }, 'Payment Success');
      
      // Call confirmation action (Idempotent)
      // Do not await to return 200 immediately
      confirmPaymentAndPostLedger(intentId).catch(err => {
        logger.error({ err: err.message, intentId }, 'ledger_posting_failed');
      });
    }
  }

  return NextResponse.json({ received: true });
}
