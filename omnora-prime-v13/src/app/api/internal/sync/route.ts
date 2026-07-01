import { NextResponse } from 'next/server'
import { drainSyncQueue, getSyncQueueStats } from '@/lib/sync/cloudSyncWorker'

export const dynamic = 'force-dynamic'

export async function POST() {
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
