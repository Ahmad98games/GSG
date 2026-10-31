import { NextRequest, NextResponse } from 'next/server';
import { generateDailyMunshiZReport, formatMunshiZReportWhatsApp, dispatchMunshiZReport } from '@/lib/reports/munshiZReportEngine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined;
    const businessId = searchParams.get('business_id') || 'local';

    const report = await generateDailyMunshiZReport(businessId, date);
    if (!report) {
      return NextResponse.json({ error: 'Could not generate Munshi Z-Report' }, { status: 500 });
    }

    const message = formatMunshiZReportWhatsApp(report);
    return NextResponse.json({ report, message }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId = 'local', ownerPhone } = body;

    const result = await dispatchMunshiZReport(businessId, ownerPhone);
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
