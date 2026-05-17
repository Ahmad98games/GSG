import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const config = await db.select().from(schema.localConfig);
    const sessions = await db.select().from(schema.tcpSessions);
    
    return NextResponse.json({
      localConfig: config,
      sessionCount: sessions.length
    });
  } catch (error) {
    console.error('API Settings Error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (type === 'business_profile') {
      const { error } = await supabase
        .from('business_profiles')
        .update(data)
        .eq('id', data.id);
      if (error) throw error;
    }

    if (type === 'local_config') {
      for (const [key, value] of Object.entries(data)) {
        await db.insert(schema.localConfig)
          .values({ key, value: String(value) })
          .onConflictDoUpdate({
            target: schema.localConfig.key,
            set: { value: String(value), updatedAt: new Date().toISOString() }
          });
      }
    }

    if (type === 'regenerate_pairing_key') {
      const newKey = crypto.randomBytes(32).toString('hex');
      await db.insert(schema.localConfig)
        .values({ key: 'pairing_key', value: newKey })
        .onConflictDoUpdate({
          target: schema.localConfig.key,
          set: { value: newKey, updatedAt: new Date().toISOString() }
        });
      return NextResponse.json({ pairingKey: newKey });
    }

    if (type === 'update_pin') {
      const { newPin } = data;
      const hashedPin = crypto.createHash('sha256').update(newPin).digest('hex');
      await db.insert(schema.localConfig)
        .values({ key: 'hub_pin_hash', value: hashedPin })
        .onConflictDoUpdate({
          target: schema.localConfig.key,
          set: { value: hashedPin, updatedAt: new Date().toISOString() }
        });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
