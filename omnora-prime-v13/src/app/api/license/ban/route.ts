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
    const { licenseId, hwid, action = 'ban', reason = 'Access restricted by administrator.' } = body;

    if (!licenseId && !hwid) {
      return NextResponse.json({ error: 'licenseId or hwid required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const shouldDeactivate = action === 'ban' || action === 'restrict';

    if (licenseId) {
      // First get current notes so we preserve brand and hwid
      const { data: currentLic } = await supabase.from('licenses').select('notes').eq('id', licenseId).maybeSingle();
      const existingNotes = (currentLic?.notes || '').replace(/\s*\[(BANNED|RESTORED)[^\]]*\]/g, '').trim();
      const updatedNotes = shouldDeactivate
        ? `${existingNotes} [BANNED: ${reason} on ${new Date().toLocaleDateString('en-PK')}]`.trim()
        : `${existingNotes} [RESTORED on ${new Date().toLocaleDateString('en-PK')}]`.trim();

      // Direct license update
      const { data, error } = await supabase
        .from('licenses')
        .update({
          is_deactivated: shouldDeactivate,
          is_active: !shouldDeactivate,
          notes: updatedNotes
        })
        .eq('id', licenseId)
        .select('*')
        .maybeSingle();

      if (error) throw error;
      return NextResponse.json({ success: true, action, license: data });
    } else {
      // Match by HWID
      const cleanHwid = String(hwid).trim().toUpperCase();
      const { data: all } = await supabase.from('licenses').select('*');
      const target = (all || []).find((lic: any) => {
        const notes = lic.notes || '';
        return notes.toUpperCase().includes(cleanHwid) || (lic.license_key && lic.license_key.toUpperCase() === cleanHwid);
      });

      if (!target) {
        return NextResponse.json({ error: 'Machine with this HWID not found' }, { status: 404 });
      }

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

      if (error) throw error;
      return NextResponse.json({ success: true, action, license: data });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
