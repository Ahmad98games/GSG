import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { createClient } from '@supabase/supabase-js';
import { sql } from 'drizzle-orm';
import { verifyUserSession } from '@/lib/security/authHelpers';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const auth = await verifyUserSession();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: any = {
    supabase: { status: 'loading', detail: '' },
    sqlite: { status: 'loading', detail: '' },
    tcp: { status: 'loading', detail: '' },
    sync: { status: 'loading', detail: '' },
    storage: { status: 'loading', detail: '' },
    env: { status: 'loading', detail: [] },
  };

  // 1. Supabase Check
  try {
    const start = Date.now();
    const { error } = await supabase.from('business_profiles').select('id').limit(1);
    const latency = Date.now() - start;
    if (error) throw error;
    results.supabase = { status: 'online', detail: `Connected (${latency}ms)` };
  } catch (err: any) {
    results.supabase = { status: 'offline', detail: err.message };
  }

  // 2. SQLite Check
  try {
    await db.select().from(schema.localConfig).limit(1);
    results.sqlite = { status: 'online', detail: 'Local Registry Operational' };
  } catch (err: any) {
    results.sqlite = { status: 'offline', detail: err.message };
  }

  // 3. Sync Queue Check
  try {
    const pending = await db.select().from(schema.syncQueue).where(sql`status = 'pending'`);
    results.sync = { 
      status: pending.length > 0 ? 'warning' : 'online', 
      detail: pending.length > 0 ? `${pending.length} items pending sync` : 'All records synchronized' 
    };
  } catch (err: any) {
    results.sync = { status: 'offline', detail: err.message };
  }

  // 4. TCP Sessions Check
  try {
    const onlineDevices = await db.select().from(schema.tcpSessions).where(sql`status = 'online'`);
    results.tcp = { status: 'online', detail: `${onlineDevices.length} mesh nodes connected` };
  } catch (err: any) {
    results.tcp = { status: 'offline', detail: err.message };
  }

  // 5. Env Vars Check
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL'
  ];
  results.env.detail = required.map(key => ({
    key,
    status: process.env[key] ? 'SET' : 'MISSING'
  }));
  results.env.status = results.env.detail.every((d: any) => d.status === 'SET') ? 'online' : 'warning';

  return NextResponse.json(results);
}
