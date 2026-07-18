import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hub/tunnel-status
 * Returns the Cloudflare Tunnel URL if cloudflared is running.
 * Used by the pairing QR code to include the tunnel URL.
 */
export async function GET() {
  let tunnelUrl: string | null = null;

  // Check env variable first (set by user in .env.local)
  const envTunnel = process.env.CLOUDFLARE_TUNNEL_URL || process.env.NEXT_PUBLIC_CLOUDFLARE_TUNNEL_URL;
  if (envTunnel) {
    tunnelUrl = envTunnel.startsWith('http') ? envTunnel : `https://${envTunnel}`;
  }

  // Try to read from cloudflared if not in env
  if (!tunnelUrl) {
    try {
      // cloudflared tunnel info returns JSON with hostname
      const result = execSync(
        'cloudflared tunnel info --output json 2>nul',
        { timeout: 3000, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      );
      const info = JSON.parse(result);
      if (info?.hostname) {
        tunnelUrl = `https://${info.hostname}`;
      }
    } catch {
      // cloudflared not available or not configured
    }
  }

  // Try alternate: read from Windows service registry where cloudflared stores config
  if (!tunnelUrl) {
    try {
      // Look for .cloudflared/config.yml
      const configPaths = [
        `${process.env.USERPROFILE}\\.cloudflared\\config.yml`,
        'C:\\Windows\\System32\\config\\systemprofile\\.cloudflared\\config.yml',
        `${process.env.APPDATA}\\cloudflared\\config.yml`,
      ];

      const fs = await import('fs');
      for (const cfgPath of configPaths) {
        if (fs.existsSync(cfgPath)) {
          const cfg = fs.readFileSync(cfgPath, 'utf8');
          // Parse hostname from ingress rules
          const match = cfg.match(/hostname:\s*([^\s\n]+)/);
          if (match?.[1]) {
            tunnelUrl = `https://${match[1]}`;
            break;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return NextResponse.json({
    tunnelUrl,
    tunnelAvailable: !!tunnelUrl,
  });
}
