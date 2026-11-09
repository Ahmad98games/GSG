import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zgxmvwxzjmpmesqliwxl.supabase.co';
  // Use anon key first because Supabase RLS is configured for anon role
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  const fetchWithTimeout = (u: any, opts: any = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    return fetch(u, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
  };

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchWithTimeout }
  });
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { hwid, userName, businessName, phone, appVersion = '14.0.33' } = body;

    if (!hwid) {
      return NextResponse.json({ error: 'HWID is required' }, { status: 400 });
    }

    const cleanHwid = String(hwid).trim().toUpperCase();
    const cleanUser = (userName || '').trim() || 'Store Owner';
    const cleanBrand = (businessName || '').trim() || 'My Business';
    let cleanPhone = String(phone || '').trim().replace(/[\s-]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '92' + cleanPhone.slice(1);

    const supabase = getSupabase();

    // 1. Check if ANY license exists matching this HWID, phone, or brand
    const { data: allLicenses } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });

    const phoneLast7 = cleanPhone.length >= 7 ? cleanPhone.slice(-7) : '';

    // Find all matching licenses for this device or phone
    const matching = (allLicenses || []).filter((lic: any) => {
      const licHwid = (lic.hwid || '').trim().toUpperCase();
      const licKey = (lic.license_key || '').trim().toUpperCase();
      const licPhone = String(lic.customer_whatsapp || lic.customer_phone || '').replace(/[\s-]/g, '');
      const notes = (lic.notes || '').toUpperCase();

      // Direct HWID or key match
      if (licHwid && (licHwid === cleanHwid || cleanHwid.includes(licHwid) || licHwid.includes(cleanHwid))) return true;
      if (licKey && licKey === cleanHwid) return true;
      if (notes.includes(cleanHwid)) return true;

      // Phone match (full or last 7 digits)
      if (phoneLast7 && licPhone && (licPhone === cleanPhone || licPhone.endsWith(phoneLast7))) return true;

      // Unclaimed download lead matching brand name
      if (cleanBrand && cleanBrand !== 'My Business' && lic.brand_name) {
        const licBrand = String(lic.brand_name).trim().toLowerCase();
        if (licBrand === cleanBrand.toLowerCase() && (!licHwid || licHwid === 'PENDING FIRST RUN')) {
          return true;
        }
      }

      return false;
    });

    // Check if ANY license for this machine OR phone number is banned
    const isBanned = matching.some((lic: any) => Boolean(lic.is_deactivated === true || lic.is_active === false));

    const existing = matching[0];

    if (existing) {
      // Machine already registered in Supabase
      
      // Update latest device telemetry, keeping user/brand info fresh
      const existingNotes = existing.notes || '';
      let updatedNotes = existingNotes;
      if (!updatedNotes.toUpperCase().includes(cleanHwid)) {
        updatedNotes = `${existingNotes} | HWID: ${cleanHwid}`;
      }
      if (cleanBrand && !updatedNotes.includes(cleanBrand)) {
        updatedNotes = `Brand: ${cleanBrand} | ${updatedNotes}`;
      }

      const displayName = cleanBrand && cleanBrand !== 'My Business'
        ? `${cleanUser} (${cleanBrand})`
        : cleanUser;

      const newKey = existing.license_key && !existing.license_key.startsWith('DL-')
        ? existing.license_key
        : `HWID-${cleanHwid.slice(-8)}`;

      const isTrial = Boolean(existing.is_trial);
      const months = existing.months || 1;
      const billingCycle = isTrial ? 'trial' : (months === 12 ? 'yearly' : months >= 99 ? 'lifetime' : 'monthly');

      // If banned on phone or machine, synchronize is_deactivated across ALL matching rows
      if (isBanned) {
        for (const m of matching) {
          if (!m.is_deactivated || m.is_active) {
            await supabase
              .from('licenses')
              .update({ is_deactivated: true, is_active: false })
              .eq('id', m.id);
          }
        }
      }

      await supabase
        .from('licenses')
        .update({
          license_key: newKey,
          customer_name: displayName,
          customer_whatsapp: cleanPhone || existing.customer_whatsapp,
          customer_phone: cleanPhone || existing.customer_phone,
          hwid: cleanHwid,
          brand_name: cleanBrand || existing.brand_name || 'Standard Business',
          notes: updatedNotes,
        })
        .eq('id', existing.id);

      return NextResponse.json({
        success: true,
        isBanned,
        status: isBanned ? 'banned' : (isTrial ? 'trial' : 'active'),
        tier: existing.tier || 'elite',
        isTrial,
        months,
        billingCycle,
        banReason: isBanned ? 'You cannot use this software. Please pay for the license to continue. (Contact Administrator via WhatsApp: +92 326 4742678)' : null,
        licenseKey: newKey,
        expiresAt: existing.expires_at,
        customerName: displayName,
        brandName: cleanBrand,
        hwid: cleanHwid
      });
    }

    // 2. New Machine / Download Installation: Automatically register in Supabase
    const defaultTrialExpires = new Date();
    defaultTrialExpires.setDate(defaultTrialExpires.getDate() + 14); // 14-day full elite trial

    const newKey = `HWID-${cleanHwid.slice(-8)}`;
    const formattedNotes = `Brand: ${cleanBrand} | HWID: ${cleanHwid} | v${appVersion}`;
    const displayName = cleanBrand && cleanBrand !== 'My Business'
      ? `${cleanUser} (${cleanBrand})`
      : cleanUser;

    const { data: inserted, error: insertErr } = await supabase
      .from('licenses')
      .insert({
        license_key: newKey,
        tier: 'elite',
        max_devices: 50,
        customer_name: displayName,
        customer_whatsapp: cleanPhone || null,
        customer_phone: cleanPhone || null,
        customer_email: null, // ZERO email required
        hwid: cleanHwid,
        brand_name: cleanBrand,
        validity_type: 'trial',
        notes: formattedNotes,
        is_active: true,
        is_deactivated: false,
        is_trial: true,
        activated_at: new Date().toISOString(),
        expires_at: defaultTrialExpires.toISOString(),
        amount_paid: 0,
        currency: 'PKR',
        months: 1,
      })
      .select('*')
      .maybeSingle();

    if (insertErr) {
      console.warn('[SyncDevice] License insert warning:', insertErr.message);
    }

    // Also mirror to business_profiles for complete tenant visibility
    try {
      await supabase.from('business_profiles').insert({
        business_name: cleanBrand,
        owner_name: cleanUser,
        phone: cleanPhone || '923000000000',
        license_key: cleanHwid,
        license_status: 'trial',
        onboarding_done: true,
        whatsapp_numbers: [{ name: cleanUser, phone: cleanPhone, hwid: cleanHwid, registered_at: new Date().toISOString() }],
      });
    } catch {}

    return NextResponse.json({
      success: true,
      isBanned: false,
      status: 'trial',
      tier: 'elite',
      licenseKey: newKey,
      expiresAt: defaultTrialExpires.toISOString(),
      customerName: displayName,
      brandName: cleanBrand,
      hwid: cleanHwid
    });
  } catch (err: any) {
    console.error('[SyncDevice] Error:', err);
    return NextResponse.json({ error: err.message, isBanned: false, status: 'offline' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hwid = searchParams.get('hwid');
    const phone = searchParams.get('phone');

    if (!hwid && !phone) {
      return NextResponse.json({ error: 'hwid or phone required' }, { status: 400 });
    }

    const cleanHwid = (hwid || '').trim().toUpperCase();
    let cleanPhone = String(phone || '').trim().replace(/[\s-]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '92' + cleanPhone.slice(1);
    const phoneLast7 = cleanPhone.length >= 7 ? cleanPhone.slice(-7) : '';

    const supabase = getSupabase();

    const { data: allLicenses } = await supabase
      .from('licenses')
      .select('*');

    const matches = (allLicenses || []).filter((lic: any) => {
      const licHwid = (lic.hwid || '').trim().toUpperCase();
      const licKey = (lic.license_key || '').trim().toUpperCase();
      const licPhone = String(lic.customer_whatsapp || lic.customer_phone || '').replace(/[\s-]/g, '');
      const notes = (lic.notes || '').toUpperCase();
      
      if (cleanHwid && (licHwid === cleanHwid || licHwid.includes(cleanHwid) || cleanHwid.includes(licHwid))) return true;
      if (cleanHwid && (licKey === cleanHwid || notes.includes(cleanHwid))) return true;
      if (phoneLast7 && licPhone && (licPhone === cleanPhone || licPhone.endsWith(phoneLast7))) return true;
      return false;
    });

    if (matches.length === 0) {
      return NextResponse.json({ registered: false, isBanned: false, status: 'unknown' });
    }

    const isBanned = matches.some((m: any) => Boolean(m.is_deactivated === true || m.is_active === false));
    const match = matches[0];

    return NextResponse.json({
      registered: true,
      isBanned,
      status: isBanned ? 'banned' : (match.is_trial ? 'trial' : 'active'),
      tier: match.tier,
      expiresAt: match.expires_at,
      customerName: match.customer_name,
      notes: match.notes,
      licenseKey: match.license_key,
      banReason: isBanned ? 'You cannot use this software. Please pay for the license to continue. (Contact Administrator via WhatsApp: +92 326 4742678)' : null
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, isBanned: false }, { status: 500 });
  }
}
