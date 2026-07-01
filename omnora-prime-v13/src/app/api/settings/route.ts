import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { verifyUserSession } from '@/lib/security/authHelpers';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const bypassKey = req.headers.get('x-internal-bypass-key');
  const isInternal = bypassKey && bypassKey === process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isInternal) {
    const auth = await verifyUserSession();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    let config = [];
    let sessions = [];
    try {
      config = await db.select().from(schema.localConfig);
      sessions = await db.select().from(schema.tcpSessions);
    } catch (dbErr) {
      if (dbErr instanceof Error && dbErr.message === 'LOCAL_DB_UNAVAILABLE') {
        console.warn('[DB] SQLite unavailable, using mock localConfig for development');
        config = [
          { key: 'pairing_key', value: 'mock_pairing_key_for_dev' },
          { key: 'hub_pin_hash', value: 'mock_pin_hash' }
        ];
      } else {
        throw dbErr;
      }
    }
    
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
  const auth = await verifyUserSession();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, data } = body;

    if (type === 'business_profile') {
      const { error } = await supabase
        .from('business_profiles')
        .update(data)
        .eq('id', data.id)
        .eq('user_id', auth.user.id);
      if (error) throw error;
    }

    if (type === 'local_config') {
      try {
        for (const [key, value] of Object.entries(data)) {
          await db.insert(schema.localConfig)
            .values({ key, value: String(value) })
            .onConflictDoUpdate({
              target: schema.localConfig.key,
              set: { value: String(value), updatedAt: new Date().toISOString() }
            });
        }
      } catch (dbErr) {
        if (dbErr instanceof Error && dbErr.message === 'LOCAL_DB_UNAVAILABLE') {
          console.warn('[DB] SQLite unavailable, skipped local_config insert');
        } else {
          throw dbErr;
        }
      }
    }

    if (type === 'regenerate_pairing_key') {
      const newKey = crypto.randomBytes(32).toString('hex');
      try {
        await db.insert(schema.localConfig)
          .values({ key: 'pairing_key', value: newKey })
          .onConflictDoUpdate({
            target: schema.localConfig.key,
            set: { value: newKey, updatedAt: new Date().toISOString() }
          });
      } catch (dbErr) {
        if (dbErr instanceof Error && dbErr.message === 'LOCAL_DB_UNAVAILABLE') {
          console.warn('[DB] SQLite unavailable, skipped pairing_key update');
        } else {
          throw dbErr;
        }
      }
      return NextResponse.json({ pairingKey: newKey });
    }

    if (type === 'update_pin') {
      const { newPin } = data;
      const hashedPin = crypto.createHash('sha256').update(newPin).digest('hex');
      try {
        await db.insert(schema.localConfig)
          .values({ key: 'hub_pin_hash', value: hashedPin })
          .onConflictDoUpdate({
            target: schema.localConfig.key,
            set: { value: hashedPin, updatedAt: new Date().toISOString() }
          });
      } catch (dbErr) {
        if (dbErr instanceof Error && dbErr.message === 'LOCAL_DB_UNAVAILABLE') {
          console.warn('[DB] SQLite unavailable, skipped pin update');
        } else {
          throw dbErr;
        }
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
