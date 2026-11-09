import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zgxmvwxzjmpmesqliwxl.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { licenseId, hwid, phone, key, action = 'ban', reason = 'You cannot use this software. Please pay for the license to continue.' } = body;

    const targetInput = String(key || phone || hwid || licenseId || '').trim();

    if (!targetInput) {
      return NextResponse.json({ error: 'phone, hwid, licenseId, or key required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const shouldDeactivate = action === 'ban' || action === 'restrict';

    const cleanInput = targetInput.toUpperCase();
    const digitsOnly = targetInput.replace(/[^0-9]/g, '');
    const phoneLast7 = digitsOnly.length >= 7 ? digitsOnly.slice(-7) : '';

    const { data: all, error: fetchErr } = await supabase.from('licenses').select('*');
    if (fetchErr) throw fetchErr;

    const targets = (all || []).filter((lic: any) => {
      if (lic.id === targetInput) return true;
      const licHwid = (lic.hwid || '').trim().toUpperCase();
      const licKey = (lic.license_key || '').trim().toUpperCase();
      const licPhone = String(lic.customer_whatsapp || lic.customer_phone || '').replace(/[^0-9]/g, '');
      const notes = (lic.notes || '').toUpperCase();

      if (licHwid && (licHwid === cleanInput || licHwid.includes(cleanInput) || cleanInput.includes(licHwid))) return true;
      if (licKey && licKey === cleanInput) return true;
      if (notes.includes(cleanInput)) return true;
      if (phoneLast7 && licPhone && (licPhone === digitsOnly || licPhone.endsWith(phoneLast7))) return true;
      return false;
    });

    if (targets.length === 0) {
      return NextResponse.json({ error: `No workstation found matching: ${targetInput}` }, { status: 404 });
    }

    const updatedRows: any[] = [];
    for (const target of targets) {
      const existingNotes = (target.notes || '').replace(/\s*\[(BANNED|RESTORED)[^\]]*\]/g, '').trim();
      const updatedNotes = shouldDeactivate
        ? `${existingNotes} [BANNED: ${reason} on ${new Date().toLocaleDateString('en-PK')}]`.trim()
        : `${existingNotes} [RESTORED on ${new Date().toLocaleDateString('en-PK')}]`.trim();

      const { data, error } = await supabase
        .from('licenses')
        .update({
          is_deactivated: shouldDeactivate,
          is_active: !shouldDeactivate,
          notes: updatedNotes
        })
        .eq('id', target.id)
        .select('*')
        .maybeSingle();

      if (!error && data) {
        updatedRows.push(data);
      }
    }

    return NextResponse.json({
      success: true,
      action: shouldDeactivate ? 'banned' : 'restored',
      count: updatedRows.length,
      keys: updatedRows.map((r) => r.license_key),
      hwids: updatedRows.map((r) => r.hwid),
      licenses: updatedRows
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
