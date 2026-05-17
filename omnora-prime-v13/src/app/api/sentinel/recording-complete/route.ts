import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const secret = req.headers.get('x-sentinel-secret');
  if (secret !== process.env.SENTINEL_INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { camera_id, recording_id, signature, duration, file_size } = await req.json();

  const { error } = await supabase
    .from('sentinel_recordings')
    .update({
      ended_at: new Date().toISOString(),
      duration_seconds: duration,
      file_size_bytes: file_size,
      hmac_hash: signature,
      status: 'completed'
    })
    .eq('id', recording_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
