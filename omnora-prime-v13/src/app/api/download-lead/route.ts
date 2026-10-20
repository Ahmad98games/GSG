import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zgxmvwxzjmpmesqliwxl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { fullName, businessName, phone, city, hwid, platform = 'android', deviceModel } = body;

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
        role: platform === 'android' ? 'mobile_operator' : 'manufacturer',
        industry_type: 'textile',
        industry_key: 'textile',
        license_status: 'trial',
        trial_started_at: new Date().toISOString(),
        onboarding_done: true,
        summary_frequency: 1,
        whatsapp_numbers: [{ name: fullName.trim(), phone: cleanPhone, platform, device: deviceModel || 'Android/Windows', downloaded_at: new Date().toISOString() }]
      })
      .select('id, business_name, owner_name, phone, created_at')
      .maybeSingle();

    if (error) {
      console.warn('[DownloadLead] Supabase record warning:', error.message);
    }

    console.log(`[DownloadLead] Registered ${platform.toUpperCase()} download lead: ${fullName} (${cleanPhone}) for ${bizName}`);

    const downloadUrl = platform === 'android' 
      ? 'https://pub-8c464d0d92ff44abbf70c58c362ad258.r2.dev/noxis-preview.apk'
      : '/api/download-software?format=zip&trial=true&redirect=true';

    return NextResponse.json({
      success: true,
      message: 'Download lead recorded successfully',
      platform,
      lead: {
        id: data?.id,
        fullName: fullName.trim(),
        businessName: bizName,
        phone: cleanPhone,
        platform,
        registeredAt: new Date().toISOString()
      },
      downloadUrl
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
    const phone = searchParams.get('phone');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Search by specific phone
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
            city: profile.city,
            downloadedAt: profile.created_at
          }
        });
      }
    }

    // Default: Return list of all download leads (up to limit)
    const { data: leads, error } = await supabase
      .from('business_profiles')
      .select('id, owner_name, business_name, phone, city, role, license_status, whatsapp_numbers, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const formatted = (leads || []).map((l: any) => {
      let platform = 'android';
      if (Array.isArray(l.whatsapp_numbers) && l.whatsapp_numbers.length > 0) {
        platform = l.whatsapp_numbers[0]?.platform || (l.role === 'mobile_operator' ? 'android' : 'windows');
      } else if (l.role === 'manufacturer') {
        platform = 'windows';
      }
      return {
        id: l.id,
        fullName: l.owner_name || 'N/A',
        businessName: l.business_name || 'N/A',
        phone: l.phone || 'N/A',
        city: l.city || 'N/A',
        platform: platform.toUpperCase(),
        downloadedAt: l.created_at
      };
    });

    return NextResponse.json({
      success: true,
      totalCount: formatted.length,
      leads: formatted
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
