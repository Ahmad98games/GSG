import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zgxmvwxzjmpmesqliwxl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { fullName, businessName, phone, city, hwid } = body;

    if (!fullName || !phone) {
      return NextResponse.json(
        { error: 'Full name and phone/WhatsApp number are required.' },
        { status: 400 }
      );
    }

    let cleanPhone = String(phone).trim().replace(/[\s-]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '92' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.slice(1);
    }

    const bizName = (businessName && businessName.trim()) ? businessName.trim() : `${fullName.trim()}'s Business`;

    // 1. Record lead into business_profiles
    const { data, error } = await supabase
      .from('business_profiles')
      .insert({
        business_name: bizName,
        owner_name: fullName.trim(),
        phone: cleanPhone,
        city: city?.trim() || 'Pakistan',
        country: 'PK',
        currency: 'PKR',
        role: 'manufacturer',
        industry_type: 'textile',
        industry_key: 'textile',
        license_status: 'trial',
        trial_started_at: new Date().toISOString(),
        onboarding_done: true,
        summary_frequency: 1,
        whatsapp_numbers: [{ name: fullName.trim(), phone: cleanPhone }]
      })
      .select('id, business_name, owner_name, phone, created_at')
      .maybeSingle();

    if (error) {
      console.warn('[DownloadLead] Supabase record warning:', error.message);
    }

    // 2. Also register pre-activated trial license
    try {
      const trialKey = `TRIAL-${cleanPhone.slice(-6)}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
      await supabase.from('licenses').insert({
        license_key: trialKey,
        tier: 'elite',
        customer_name: fullName.trim(),
        customer_phone: cleanPhone,
        hwid: hwid || 'PENDING_INSTALLATION',
        is_trial: true,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'ACTIVE'
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Download lead recorded successfully',
      lead: {
        id: data?.id,
        fullName: fullName.trim(),
        businessName: bizName,
        phone: cleanPhone,
        registeredAt: new Date().toISOString()
      },
      downloadUrl: '/api/download-software?format=zip&trial=true&redirect=true'
    });
  } catch (err: any) {
    console.error('[DownloadLead API] Exception:', err);
    return NextResponse.json(
      { success: true, downloadUrl: '/api/download-software?format=zip&trial=true&redirect=true' },
      { status: 200 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hwid = searchParams.get('hwid');
    const phone = searchParams.get('phone');

    if (hwid && hwid !== 'PENDING_INSTALLATION') {
      const { data: license } = await supabase
        .from('licenses')
        .select('*')
        .eq('hwid', hwid)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (license) {
        return NextResponse.json({
          found: true,
          lead: {
            fullName: license.customer_name,
            phone: license.customer_phone,
            hwid: license.hwid,
            expiresAt: license.expires_at
          }
        });
      }
    }

    if (phone) {
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('*')
        .ilike('phone', `%${phone.slice(-7)}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (profile) {
        return NextResponse.json({
          found: true,
          lead: {
            fullName: profile.owner_name || profile.business_name,
            businessName: profile.business_name,
            phone: profile.phone,
            city: profile.city
          }
        });
      }
    }

    // Fallback: get the most recent download lead for single-machine local test
    const { data: recent } = await supabase
      .from('business_profiles')
      .select('owner_name, business_name, phone, city, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent) {
      return NextResponse.json({
        found: true,
        recent: true,
        lead: {
          fullName: recent.owner_name || recent.business_name,
          businessName: recent.business_name,
          phone: recent.phone,
          city: recent.city
        }
      });
    }

    return NextResponse.json({ found: false });
  } catch (err: any) {
    return NextResponse.json({ found: false, error: err.message }, { status: 500 });
  }
}

