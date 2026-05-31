import { NextResponse } from 'next/server';
import { startHubServer } from '@/server/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

let isStarted = false;

export async function GET() {
  if (!isStarted) {
    logger.info('[Startup] Initializing Hub Services from API...');
    try {
      startHubServer(() => {
        // TCP Activity callback
      });
      isStarted = true;
      return NextResponse.json({ status: 'started', timestamp: Date.now() });
    } catch (err: any) {
      logger.error({ err }, '[Startup] Failed to start hub server');
      return NextResponse.json({ status: 'error', error: err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ status: 'already_running', timestamp: Date.now() });
}
