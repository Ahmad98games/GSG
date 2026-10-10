import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false }
  });
}

// Commercial benchmark baseline rates (PKR base)
const DEFAULT_BENCHMARK_RATES = [
  { id: 'def-usd-pkr', from_currency: 'USD', to_currency: 'PKR', rate: 278.450000, effective_date: new Date().toISOString().split('T')[0], source: 'Interbank Benchmark' },
  { id: 'def-aed-pkr', from_currency: 'AED', to_currency: 'PKR', rate: 75.820000, effective_date: new Date().toISOString().split('T')[0], source: 'Interbank Benchmark' },
  { id: 'def-eur-pkr', from_currency: 'EUR', to_currency: 'PKR', rate: 302.200000, effective_date: new Date().toISOString().split('T')[0], source: 'Interbank Benchmark' },
  { id: 'def-gbp-pkr', from_currency: 'GBP', to_currency: 'PKR', rate: 355.100000, effective_date: new Date().toISOString().split('T')[0], source: 'Interbank Benchmark' },
  { id: 'def-sar-pkr', from_currency: 'SAR', to_currency: 'PKR', rate: 74.200000, effective_date: new Date().toISOString().split('T')[0], source: 'Interbank Benchmark' },
  { id: 'def-cny-pkr', from_currency: 'CNY', to_currency: 'PKR', rate: 38.650000, effective_date: new Date().toISOString().split('T')[0], source: 'Interbank Benchmark' },
  { id: 'def-cad-pkr', from_currency: 'CAD', to_currency: 'PKR', rate: 204.500000, effective_date: new Date().toISOString().split('T')[0], source: 'Interbank Benchmark' },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('business_id');
    const syncLive = searchParams.get('sync_live') === 'true';

    // If live sync is requested
    if (syncLive) {
      try {
        const liveRes = await fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: 3600 } });
        if (liveRes.ok) {
          const liveData = await liveRes.json();
          const pkrPerUsd = liveData.rates?.PKR || 278.45;
          const ratesList = [
            { id: 'live-usd-pkr', from_currency: 'USD', to_currency: 'PKR', rate: pkrPerUsd, effective_date: new Date().toISOString().split('T')[0], source: 'Open Exchange Feed' },
            { id: 'live-eur-pkr', from_currency: 'EUR', to_currency: 'PKR', rate: pkrPerUsd / (liveData.rates?.EUR || 0.92), effective_date: new Date().toISOString().split('T')[0], source: 'Open Exchange Feed' },
            { id: 'live-gbp-pkr', from_currency: 'GBP', to_currency: 'PKR', rate: pkrPerUsd / (liveData.rates?.GBP || 0.78), effective_date: new Date().toISOString().split('T')[0], source: 'Open Exchange Feed' },
            { id: 'live-aed-pkr', from_currency: 'AED', to_currency: 'PKR', rate: pkrPerUsd / (liveData.rates?.AED || 3.67), effective_date: new Date().toISOString().split('T')[0], source: 'Open Exchange Feed' },
            { id: 'live-sar-pkr', from_currency: 'SAR', to_currency: 'PKR', rate: pkrPerUsd / (liveData.rates?.SAR || 3.75), effective_date: new Date().toISOString().split('T')[0], source: 'Open Exchange Feed' },
            { id: 'live-cny-pkr', from_currency: 'CNY', to_currency: 'PKR', rate: pkrPerUsd / (liveData.rates?.CNY || 7.20), effective_date: new Date().toISOString().split('T')[0], source: 'Open Exchange Feed' },
          ];
          return NextResponse.json({ rates: ratesList, synced: true });
        }
      } catch (liveErr) {
        // Fallback to benchmarks
      }
    }

    const supabase = getAdminClient();
    if (supabase && businessId && businessId !== '00000000-0000-0000-0000-000000000000') {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('business_id', businessId)
        .order('effective_date', { ascending: false });

      if (!error && data && data.length > 0) {
        return NextResponse.json({ rates: data });
      }
    }

    return NextResponse.json({ rates: DEFAULT_BENCHMARK_RATES });
  } catch (err: any) {
    return NextResponse.json({ rates: DEFAULT_BENCHMARK_RATES, error: err.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, from_currency, to_currency, rate, effective_date, source } = body;

    if (!from_currency || !to_currency || !rate) {
      return NextResponse.json({ error: 'from_currency, to_currency and rate are required' }, { status: 400 });
    }

    const effectiveRate = parseFloat(rate);
    if (isNaN(effectiveRate) || effectiveRate <= 0) {
      return NextResponse.json({ error: 'Valid positive rate number required' }, { status: 400 });
    }

    const effectiveDate = effective_date || new Date().toISOString().split('T')[0];
    const newRecord = {
      id: `rate-${Date.now()}`,
      business_id: businessId || '00000000-0000-0000-0000-000000000000',
      from_currency: from_currency.toUpperCase().trim(),
      to_currency: to_currency.toUpperCase().trim(),
      rate: effectiveRate,
      effective_date: effectiveDate,
      source: source || 'manual',
      created_at: new Date().toISOString()
    };

    const supabase = getAdminClient();
    if (supabase && businessId && businessId !== '00000000-0000-0000-0000-000000000000') {
      const { data, error } = await supabase
        .from('exchange_rates')
        .insert({
          business_id: businessId,
          from_currency: newRecord.from_currency,
          to_currency: newRecord.to_currency,
          rate: newRecord.rate,
          effective_date: newRecord.effective_date,
          source: newRecord.source
        })
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ success: true, rate: data });
      }
    }

    // Local / fallback mode
    return NextResponse.json({ success: true, rate: newRecord });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const businessId = searchParams.get('business_id');

    if (!id) {
      return NextResponse.json({ error: 'id parameter required' }, { status: 400 });
    }

    const supabase = getAdminClient();
    if (supabase && businessId) {
      await supabase
        .from('exchange_rates')
        .delete()
        .eq('id', id)
        .eq('business_id', businessId);
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
