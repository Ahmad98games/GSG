import { NextRequest, NextResponse } from 'next/server';
import { registerWorkstationHeartbeat, unregisterWorkstation, getBridgeStatus } from '@/lib/mobile-bridge/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { nodeId, deviceLabel, path: currentPath, tier } = body;

    if (!nodeId) {
      return NextResponse.json({ error: 'nodeId required' }, { status: 400 });
    }

    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : (req.headers.get('x-real-ip') || '127.0.0.1');

    registerWorkstationHeartbeat({
      nodeId,
      deviceLabel: deviceLabel || (currentPath === '/pos' ? 'POS Cashier Kiosk' : 'LAN Workstation Node'),
      path: currentPath || '/workstation',
      ip,
      tier: tier || 'elite',
    });

    const status = getBridgeStatus();
    return NextResponse.json({
      success: true,
      activeDevices: status.paired,
      connectedNodes: status.pairedDevices,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nodeId = searchParams.get('nodeId');
    if (nodeId) {
      unregisterWorkstation(nodeId);
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
