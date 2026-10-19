import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zgxmvwxzjmpmesqliwxl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy'
);

function generateLicenseKey(tier: string): string {
  const prefix =
    tier.toLowerCase() === 'elite' ? 'ELIT'
    : tier.toLowerCase() === 'pro' ? 'PROP'
    : 'LITE';
  const rand = () =>
    Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${rand()}-${rand()}-${rand()}`;
}

const TIER_DEVICES = {
  lite: 5,
  pro: 15,
  elite: 50,
};

const TIER_PRICES_MONTHLY: Record<string, number> = {
  lite: 1999,
  pro: 4999,
  elite: 9999,
};

const TIER_PRICES_ANNUAL: Record<string, number> = {
  lite: 18000,
  pro: 45000,
  elite: 90000,
};

const TIER_PRICES_PERMANENT: Record<string, number> = {
  lite: 72000,
  pro: 135000,
  elite: 225000,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tier = 'pro',
      paymentMethod = 'nayapay',
      txId = '',
      customerName = '',
      customerWhatsapp = '',
      hwid = '',
      billingCycle = 'monthly',
    } = body;

    if (!customerName || !customerName.trim()) {
      return NextResponse.json(
        { error: 'Customer or business name is required.' },
        { status: 400 }
      );
    }

    const cleanTier = (tier || 'pro').toLowerCase();
    const cleanHwid = (hwid || '').trim();
    const cleanTxId = (txId || '').trim();
    const licenseKey = generateLicenseKey(cleanTier);

    // Duration: 100 years for permanent, 1 year for annual, 1 month for monthly
    const expiresAt = new Date();
    const isPermanent = billingCycle === 'permanent' || billingCycle === 'lifetime';
    if (isPermanent) {
      expiresAt.setFullYear(expiresAt.getFullYear() + 100);
    } else if (billingCycle === 'annual') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    const maxDevices = TIER_DEVICES[cleanTier as keyof typeof TIER_DEVICES] || 15;
    const amountPaid = isPermanent
      ? (TIER_PRICES_PERMANENT[cleanTier] || 135000)
      : billingCycle === 'annual'
        ? (TIER_PRICES_ANNUAL[cleanTier] || 45000)
        : (TIER_PRICES_MONTHLY[cleanTier] || 4999);

    // Persist to Supabase licenses table
    const { error: insertError } = await supabase
      .from('licenses')
      .insert({
        license_key: licenseKey,
        tier: cleanTier,
        is_trial: false,
        max_devices: maxDevices,
        expires_at: expiresAt.toISOString(),
        customer_name: customerName.trim(),
        customer_whatsapp: customerWhatsapp.trim() || null,
        payment_method: paymentMethod,
        amount_paid: amountPaid,
        currency: 'PKR',
        notes: `HWID: ${cleanHwid || 'PENDING'} | TID: ${cleanTxId || 'PENDING'} | Mode: Web-Checkout-${billingCycle.toUpperCase()}`,
      });

    if (insertError) {
      console.warn('[License Issue] Supabase insert warning, falling back to local grant:', insertError.message);
    }

    return NextResponse.json({
      success: true,
      licenseKey,
      tier: cleanTier.toUpperCase(),
      hwid: cleanHwid,
      expiresAt: expiresAt.toISOString(),
      customerName: customerName.trim(),
    });
  } catch (err: any) {
    console.error('[API license issue] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate license key.' },
      { status: 500 }
    );
  }
}
