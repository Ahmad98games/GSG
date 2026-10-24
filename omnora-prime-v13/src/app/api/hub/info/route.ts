import { NextResponse } from 'next/server';
import os from 'os';
import { getBridgeStatus } from '@/lib/mobile-bridge/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const interfaces = os.networkInterfaces();
  let localIP = '127.0.0.1';

  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    if (addresses) {
      for (const addr of addresses) {
        if (addr.family === 'IPv4' && !addr.internal) {
          localIP = addr.address;
          break;
        }
      }
    }
    if (localIP !== '127.0.0.1') break;
  }

  const port = parseInt(process.env.PORT ?? '3000', 10);
  const bridgePort = 7447;

  let bridge: any = { connected: 0, paired: 0, pairedDevices: [] };
  try {
    bridge = getBridgeStatus();
  } catch (err) {
    console.warn('[Hub Info] Could not fetch bridge status:', err);
  }

  const rawTunnel = process.env.CLOUDFLARE_TUNNEL_URL || '';
  const isDummyTunnel = !rawTunnel || rawTunnel.includes('your-tunnel-hostname') || rawTunnel.includes('example.com');
  const cleanTunnelHost = rawTunnel.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const tunnelUrl = isDummyTunnel ? null : `wss://${cleanTunnelHost}/mobile-bridge`;

  return NextResponse.json({
    ip: localIP,
    localIp: localIP,
    port: port,
    webPort: port,
    bridgePort: bridgePort,
    bridgeUrl: `ws://${localIP}:${bridgePort}`,
    nextBridgeUrl: `ws://${localIP}:${port}/mobile-bridge`,
    mobileUrl: `http://${localIP}:${port}/mobile`,
    workstationUrl: `http://${localIP}:${port}/workstation`,
    tunnelUrl,
    hostname: os.hostname(),
    platform: os.platform(),
    uptime: os.uptime(),
    version: '14.0.10',
    bridge,
  });
}
