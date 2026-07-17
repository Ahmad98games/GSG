import { NextResponse } from 'next/server';
import os from 'os';
import { verifyUserSession } from '@/lib/security/authHelpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await verifyUserSession();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  return NextResponse.json({
    ip: localIP,
    localIp: localIP,
    port: 9000,          // NSP TCP port (desktop-to-desktop, unchanged)
    bridgePort: port,    // WebSocket bridge port (same as Next.js)
    bridgeUrl: `ws://${localIP}:${port}/mobile-bridge`,
    mobileUrl: `http://${localIP}:${port}/mobile`,
    tunnelUrl: process.env.CLOUDFLARE_TUNNEL_URL
      ? `wss://${process.env.CLOUDFLARE_TUNNEL_URL}/mobile-bridge`
      : null,
    hostname: os.hostname(),
    platform: os.platform(),
    uptime: os.uptime(),
    version: process.env.npm_package_version || '13.0.0',
  });
}

