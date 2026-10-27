import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

function getSqliteInstance() {
  try {
    return (db as any).$client || null;
  } catch {
    return null;
  }
}

/**
 * GET /api/workflows/runs
 * Serves real-time audit logs for all workflow executions
 */
export async function GET(req: NextRequest) {
  try {
    const sqlite = getSqliteInstance();
    if (!sqlite) {
      return NextResponse.json({ runs: [], stats: { total: 0, completed: 0, throttled: 0, failed: 0 } });
    }

    // Ensure table exists
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS workflow_runs (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL,
        workflow_id TEXT,
        workflow_name TEXT,
        event_type TEXT NOT NULL,
        event_hash TEXT,
        recipient TEXT,
        trigger_data TEXT,
        actions_executed TEXT,
        status TEXT NOT NULL CHECK(status IN ('completed', 'failed', 'throttled')),
        error TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = Math.min(200, parseInt(searchParams.get('limit') || '50', 10));

    let query = `SELECT * FROM workflow_runs`;
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ` WHERE status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const rows = sqlite.prepare(query).all(...params) as any[];

    const formattedRuns = rows.map((r) => {
      let triggerData = {};
      let actions = [];
      try { triggerData = JSON.parse(r.trigger_data || '{}'); } catch {}
      try { actions = JSON.parse(r.actions_executed || '[]'); } catch {}

      return {
        id: r.id,
        businessId: r.business_id,
        workflowId: r.workflow_id,
        workflowName: r.workflow_name || 'Automated Trigger',
        eventType: r.event_type,
        eventHash: r.event_hash,
        recipient: r.recipient,
        triggerData,
        actionsExecuted: actions,
        status: r.status,
        error: r.error,
        createdAt: r.created_at,
      };
    });

    const statsRow = sqlite.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'throttled' THEN 1 ELSE 0 END) as throttled,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM workflow_runs
    `).get() as any;

    return NextResponse.json({
      runs: formattedRuns,
      stats: {
        total: statsRow?.total || 0,
        completed: statsRow?.completed || 0,
        throttled: statsRow?.throttled || 0,
        failed: statsRow?.failed || 0,
      },
    });
  } catch (err: any) {
    console.error('[API /api/workflows/runs] Error:', err);
    return NextResponse.json({ runs: [], stats: { total: 0, completed: 0, throttled: 0, failed: 0 }, error: err.message }, { status: 500 });
  }
}
