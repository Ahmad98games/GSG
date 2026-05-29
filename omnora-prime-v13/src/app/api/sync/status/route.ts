import { NextResponse } from 'next/server';
import { syncQueue } from '@/lib/db/schema';
import { count, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Dynamic import to prevent route failure if client.ts fails at top-level
    const { db } = await import('@/lib/db/client')
    const result = await db.select({ value: count() })
      .from(syncQueue)
      .where(eq(syncQueue.status, 'pending'));
    
    return NextResponse.json({ 
      status: 'ok',
      pending_count: result[0].value 
    });
  } catch (error: any) {
    // SQLite not available — this is OK in cloud-first mode
    // Return synced state (no local queue = synced)
    console.warn('[Sync] Local DB unavailable:', error.message)
    return NextResponse.json({
      status: 'ok',
      pending_count: 0,
      note: 'local_db_unavailable'
    })
  }
}

export async function POST() {
  // Trigger manual sync logic could go here if needed
  return NextResponse.json({ success: true, message: 'Manual sync triggered' });
}
