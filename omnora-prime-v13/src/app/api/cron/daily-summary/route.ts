import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. Security Check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 2. Fetch businesses with WhatsApp enabled
    // Note: We filter for businesses that have a phone number set
    const { data: businesses, error } = await supabase
      .from('business_profiles')
      .select('id, business_name, whatsapp_config, region')
      .not('whatsapp_config->owner_phone', 'is', null);

    if (error) throw error;

    const summaryResults = [];

    // 3. For each business: gather data and send
    for (const business of (businesses || [])) {
      const config = business.whatsapp_config as any;
      if (!config?.daily_summary_enabled) continue;

      // Invoke the whatsapp-send Edge Function
      const { data, error: invokeError } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          type: 'daily_summary',
          business_id: business.id,
          recipient: config.owner_phone,
          language: config.language || 'english'
        }
      });

      summaryResults.push({
        business_id: business.id,
        success: !invokeError,
        error: invokeError?.message
      });
    }

    return NextResponse.json({
      status: 'completed',
      processed: businesses?.length || 0,
      sent: summaryResults.filter(r => r.success).length,
      results: summaryResults
    });

  } catch (err: any) {
    console.error('Daily Summary Cron Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

