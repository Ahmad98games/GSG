import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const secret = req.headers.get('x-sentinel-secret');
  if (secret !== process.env.SENTINEL_INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { camera_id, filepath, timestamp } = await req.json();

  const { data, error } = await supabase
    .from('sentinel_recordings')
    .insert({
      business_id: (await supabase.from('cctv_nodes').select('business_id').eq('id', camera_id).single()).data?.business_id,
      camera_id,
      started_at: new Date(timestamp * 1000).toISOString(),
      file_path: filepath,
      status: 'recording'
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recording_id: data.id });
}
