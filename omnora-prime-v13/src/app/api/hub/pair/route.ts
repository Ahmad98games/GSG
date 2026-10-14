import { NextResponse } from 'next/server';
import { POST as devicesPost } from '../devices/route';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return devicesPost(req);
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Pairing endpoint ready',
    version: '14.0.0',
    port: 7447,
  });
}
