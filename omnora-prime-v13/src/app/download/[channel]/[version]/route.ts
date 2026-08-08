import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{ channel: 'stable', version: 'latest' }];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channel: string; version: string }> }
) {
  const { channel, version } = await params;
  
  // Public R2 Bucket update URL for versioned installers
  const targetUrl = `https://updates.noxishub.app/${channel}/Noxis-Hub-Setup-${version}.exe`;
  
  // Redirect to direct installer binary
  return NextResponse.redirect(targetUrl, 307);
}
