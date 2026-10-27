import { NextRequest, NextResponse } from 'next/server';
import { scanOverdueInvoices, reconcileDailyLedgers, processWorkflowOutboxQueue } from '@/lib/workflows/outboxEngine';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  try {
    const overdueEnqueued = scanOverdueInvoices();
    reconcileDailyLedgers();
    const result = await processWorkflowOutboxQueue();

    return NextResponse.json({
      success: true,
      overdueEnqueued,
      processed: result.processed,
      throttled: result.throttled,
      failed: result.failed,
      message: `Reconciliation executed: ${overdueEnqueued} overdue alerts checked, ${result.processed} actions processed, ${result.throttled} anti-spam throttled.`,
    });
  } catch (err: any) {
    console.error('[API /api/workflows/reconcile] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
