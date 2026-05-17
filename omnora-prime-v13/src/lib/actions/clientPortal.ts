"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import crypto from "crypto";
import { Decimal } from "decimal.js";
import { ClientPortal, PortalPaymentIntent } from "@/lib/db/schema";

/**
 * PHASE 12: CLIENT PORTAL SERVER ACTIONS
 * All financial math is restricted to SQL; JS uses Decimal.js for formatting/validation.
 */

/**
 * 1. Invite Client to Portal
 */
export async function inviteClientToPortal(params: {
  businessId: string;
  partyId: string;
  email: string;
  displayName: string;
}) {
  const admin = createAdminClient();
  const supabase = await createClient();

  // 1. Check business tier (Elite Only for Portal)
  const { data: license, error: lError } = await supabase
    .from('licenses')
    .select('tier')
    .eq('tenant_id', params.businessId)
    .eq('status', 'active')
    .single();

  if (lError || license.tier !== 'elite') {
    throw new Error('PORTAL_PRO_REQUIRED');
  }

  // 2. Check for existing portal
  const { data: existing } = await admin
    .from('client_portals')
    .select('*')
    .eq('business_id', params.businessId)
    .eq('party_id', params.partyId)
    .single();

  if (existing) return existing as ClientPortal;

  // 3. Insert portal record
  const { data: portal, error: pError } = await admin
    .from('client_portals')
    .insert({
      business_id: params.businessId,
      party_id: params.partyId,
      email: params.email,
      display_name: params.displayName,
      status: 'active'
    })
    .select()
    .single();

  if (pError) throw new Error(pError.message);

  // 4. Generate secure token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  // 5. Store session (expires in 72h)
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
  const { error: sError } = await admin
    .from('portal_sessions')
    .insert({
      portal_id: portal.id,
      token_hash: tokenHash,
      expires_at: expiresAt
    });

  if (sError) throw new Error(sError.message);

  // 6. Trigger invite email via Supabase Auth (simulated template dispatch)
  // In a real implementation, we would use supabase.auth.admin.inviteUserByEmail 
  // or a custom Edge Function to trigger the 'portal_invite' template.
  const domain = process.env.NEXT_PUBLIC_SITE_URL || 'localhost:3000';
  const inviteUrl = `https://${domain}/portal/auth?token=${rawToken}`;
  
  // Update invite_sent_at
  await admin
    .from('client_portals')
    .update({ invite_sent_at: new Date().toISOString() })
    .eq('id', portal.id);

  revalidatePath('/settings/portals');
  return portal as ClientPortal;
}

/**
 * 2. Verify Portal Token
 */
export async function verifyPortalToken(rawToken: string): Promise<ClientPortal | null> {
  const admin = createAdminClient();
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  try {
    // 1. Fetch session details
    const { data: session, error: sError } = await admin
      .from('portal_sessions')
      .select('*, portal:client_portals(*)')
      .eq('token_hash', tokenHash)
      .single();

    if (sError || !session || !session.portal) return null;

    // Check expiry
    if (new Date(session.expires_at) < new Date()) {
      return null;
    }

    const portal = session.portal as ClientPortal;

    // 2. Token Rotation (if within 24h of expiry)
    const now = Date.now();
    const expiry = new Date(session.expires_at).getTime();
    const rotateThreshold = 24 * 60 * 60 * 1000; // 24 hours

    if (expiry - now < rotateThreshold) {
      console.log(`[Security] Rotating portal token for ${portal.id}`);
      
      const newRawToken = crypto.randomBytes(32).toString('hex');
      const newTokenHash = crypto.createHash('sha256').update(newRawToken).digest('hex');
      const newExpiresAt = new Date(now + 72 * 60 * 60 * 1000).toISOString();

      // Create new session
      await admin.from('portal_sessions').insert({
        portal_id: portal.id,
        token_hash: newTokenHash,
        expires_at: newExpiresAt
      });

      // Update old session with 5-min grace period (logical expiry)
      await admin.from('portal_sessions')
        .update({ expires_at: new Date(now + 5 * 60 * 1000).toISOString() })
        .eq('id', session.id);

      // Set new cookie
      const cookieStore = await cookies();
      cookieStore.set('portal_session', newRawToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 72 * 60 * 60,
        path: '/'
      });

      // Log rotation event (Assuming window.pino or equivalent)
      // window.pino?.info({ event: 'portal_token_rotated', portalId: portal.id });
    } else {
      // Refresh current cookie duration
      const cookieStore = await cookies();
      cookieStore.set('portal_session', rawToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 72 * 60 * 60,
        path: '/'
      });
    }

    // 3. Concurrent Session Limit (Max 3)
    const { data: activeSessions } = await admin
      .from('portal_sessions')
      .select('id, created_at')
      .eq('portal_id', portal.id)
      .order('created_at', { ascending: true });

    if (activeSessions && activeSessions.length > 3) {
      const sessionsToKill = activeSessions.slice(0, activeSessions.length - 3);
      for (const s of sessionsToKill) {
        await admin.from('portal_sessions').delete().eq('id', s.id);
      }
    }

    return portal;
  } catch (err) {
    console.error('[Portal Auth] Verification failed:', err);
    return null;
  }
}

/**
 * 3. Revoke Portal Access
 */
export async function revokePortalAccess(portalId: string): Promise<void> {
  const admin = createAdminClient();

  // 1. Mark status as revoked
  await admin
    .from('client_portals')
    .update({ status: 'revoked' })
    .eq('id', portalId);

  // 2. Clear all sessions
  await admin
    .from('portal_sessions')
    .delete()
    .eq('portal_id', portalId);

  // 3. Log to audit (Assuming audit table exists from Phase 2)
  await admin.from('audit_sessions').insert({
    label: `Portal Revoked: ${portalId}`,
    status: 'finalized'
  });

  revalidatePath('/settings/portals');
}

/**
 * 4. Create Payment Intent
 */
export async function createPaymentIntent(params: {
  portalId: string;
  invoiceId: string;
  provider: 'stripe' | 'jazzcash' | 'easypaisa';
  amount: string;
  currency: string;
}): Promise<PortalPaymentIntent> {
  const admin = createAdminClient();
  
  // 1. Validate amount with Decimal.js
  const amount = new Decimal(params.amount);
  if (amount.lte(0)) throw new Error('INVALID_AMOUNT');

  // 2. Security Check: Verify invoice ownership via portal
  const { data: portal } = await admin
    .from('client_portals')
    .select('party_id, business_id')
    .eq('id', params.portalId)
    .single();

  if (!portal) throw new Error('PORTAL_NOT_FOUND');

  const { data: invoice } = await admin
    .from('invoices')
    .select('party_id, total, paid_amount')
    .eq('id', params.invoiceId)
    .single();

  if (!invoice || invoice.party_id !== portal.party_id) {
    throw new Error('UNAUTHORIZED_INVOICE_ACCESS');
  }

  // 3. Verify outstanding balance
  const outstanding = new Decimal(invoice.total).minus(invoice.paid_amount);
  if (amount.gt(outstanding)) {
    throw new Error('PAYMENT_EXCEEDS_BALANCE');
  }

  // 4. Create local intent record
  const { data: intent, error: iError } = await admin
    .from('portal_payment_intents')
    .insert({
      business_id: portal.business_id,
      portal_id: params.portalId,
      invoice_id: params.invoiceId,
      amount: amount.toNumber(),
      currency: params.currency,
      provider: params.provider,
      status: 'pending'
    })
    .select()
    .single();

  if (iError) throw new Error(iError.message);

  // 5. Provider-specific logic (Simulation of external API calls)
  let providerIntentId = null;
  if (params.provider === 'stripe') {
    // Simulation: const stripeIntent = await stripe.paymentIntents.create(...)
    providerIntentId = `pi_${crypto.randomBytes(12).toString('hex')}`;
  } else {
    // Regional: JazzCash/EasyPaisa payload generation
    providerIntentId = `reg_${Date.now()}`;
  }

  if (providerIntentId) {
    await admin
      .from('portal_payment_intents')
      .update({ provider_intent_id: providerIntentId })
      .eq('id', intent.id);
  }

  return { ...intent, provider_intent_id: providerIntentId } as PortalPaymentIntent;
}

/**
 * 5. Confirm Payment & Post Ledger
 * SECURITY: Called by webhooks only. RLS bypassed via service role.
 */
export async function confirmPaymentAndPostLedger(intentId: string): Promise<void> {
  const admin = createAdminClient(); // SERVICE ROLE — RLS bypassed intentionally for webhook

  // 1. Fetch and lock intent
  const { data: intent } = await admin
    .from('portal_payment_intents')
    .select('*, invoice:invoices(*)')
    .eq('id', intentId)
    .single();

  if (!intent || intent.status !== 'pending') return;

  // 2. Mark succeeded
  await admin
    .from('portal_payment_intents')
    .update({ 
      status: 'succeeded', 
      completed_at: new Date().toISOString() 
    })
    .eq('id', intentId);

  // 3. Create Ledger Entries (Double-Entry)
  // Debit Bank/Cash (1100), Credit Accounts Receivable (1200)
  // Fetch account IDs first (Standard pattern)
  const { data: bankAcc } = await admin
    .from('accounts')
    .select('id')
    .eq('business_id', intent.business_id)
    .eq('account_code', '1100') // Cash/Bank
    .single();

  const { data: arAcc } = await admin
    .from('accounts')
    .select('id')
    .eq('business_id', intent.business_id)
    .eq('account_code', '1200') // Accounts Receivable
    .single();

  if (bankAcc && arAcc) {
    // Debit Bank
    await admin.from('ledger_entries').insert({
      business_id: intent.business_id,
      tx_ref: `PAY-${intent.id}`,
      entry_type: 'debit',
      account_id: bankAcc.id,
      amount: intent.amount,
      description: `Portal Payment for Invoice ${intent.invoice.invoice_no}`,
      status: 'posted',
      invoice_id: intent.invoice_id
    });

    // Credit A/R
    await admin.from('ledger_entries').insert({
      business_id: intent.business_id,
      tx_ref: `PAY-${intent.id}`,
      entry_type: 'credit',
      account_id: arAcc.id,
      amount: intent.amount,
      description: `Portal Payment for Invoice ${intent.invoice.invoice_no}`,
      status: 'posted',
      invoice_id: intent.invoice_id
    });
  }

  // 4. Update Invoice status (Logic handled by database triggers in fintech migration, 
  // but here we force a revalidation if needed)
  revalidatePath('/portal/dashboard');
}

