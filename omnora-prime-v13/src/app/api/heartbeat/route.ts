import { NextResponse } from 'next/server';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET() {
  const uptime = process.uptime();
  
  return NextResponse.json({
    status: 'ok',
    uptime: Math.floor(uptime),
    version: '13.0.0-industrial',
    nodeCount: 0, // In production, query the active node manager
    system: {
      platform: os.platform(),
      release: os.release(),
      freeMem: os.freemem(),
      totalMem: os.totalmem(),
    }
  });
}

