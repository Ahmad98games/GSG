import { NextResponse } from 'next/server'
import { drainSyncQueue, getSyncQueueStats } from '@/lib/sync/cloudSyncWorker'
import { verifyUserSession } from '@/lib/security/authHelpers'

export const dynamic = 'force-dynamic'

export async function POST() {
  const auth = await verifyUserSession();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await drainSyncQueue()
    const stats = await getSyncQueueStats()
    return NextResponse.json({
      success: true,
      result,
      stats,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  const auth = await verifyUserSession();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = await getSyncQueueStats()
    return NextResponse.json({ stats })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}
