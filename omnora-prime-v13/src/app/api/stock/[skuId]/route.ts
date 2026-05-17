import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: Request, { params }: { params: { skuId: string } }) {
  const { skuId } = params;
  const admin = createAdminClient();
  if (!admin) throw new Error('Admin client failed to initialize');

  try {
    // 1. Fetch SKU basic info
    const { data: sku, error: skuError } = await admin
      .from('skus')
      .select('*')
      .eq('id', skuId)
      .single();

    if (skuError) throw skuError;

    // 2. Fetch Movements (transfer_logs)
    const { data: movements, error: moveError } = await admin
      .from('transfer_logs')
      .select('*, auth.users(email)') // simplified user fetch
      .eq('sku_id', skuId)
      .order('initiated_at', { ascending: false })
      .limit(50);

    // 3. Simple Analytics (mocked for now based on movements)
    const stats = {
      avgMonthlyThroughput: (movements || []).reduce((acc: number, m: any) => acc + Number(m.qty), 0) / 12,
      last30DaysSales: (movements || [])
        .filter((m: any) => m.to_location === 'retail_shop' || m.to_location === 'disposed')
        .reduce((acc: number, m: any) => acc + Number(m.qty), 0),
      velocityRank: 'A' // Mocked rank
    };

    return NextResponse.json({ sku, movements, stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
