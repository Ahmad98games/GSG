import { NextResponse } from 'next/server';
import os from 'os';

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

  return NextResponse.json({
    ip: localIP,
    port: 9000,
    hostname: os.hostname(),
    platform: os.platform(),
    uptime: os.uptime(),
  });
}
