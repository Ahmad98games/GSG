import { NextRequest, NextResponse } from 'next/server';

const CLOUDFLARE_APK_URL = 'https://pub-8c464d0d92ff44abbf70c58c362ad258.r2.dev/noxis-preview.apk';
const CLOUDFLARE_VERSION_URL = 'https://pub-8c464d0d92ff44abbf70c58c362ad258.r2.dev/version.json';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const info = searchParams.get('info');

  if (info === 'true' || searchParams.get('json') === 'true') {
    return NextResponse.json({
      name: 'Noxis Mobile Terminal',
      version: '14.0.0',
      platform: 'Android 8.0+ (ARM64 & x86_64)',
      filename: 'Noxis-Mobile-Terminal-v14.0.0.apk',
      file_size_mb: 116.04,
      file_size_bytes: 121679446,
      hash_sha256: 'f2f96e67127246d3ef8a9cf6d59d0e0d7b0271fb6df98db26a8c8cd928d53c1a',
      direct_download_url: CLOUDFLARE_APK_URL,
      manifest_url: CLOUDFLARE_VERSION_URL,
      released_at: '2026-10-19T20:30:00Z',
    });
  }

  // Redirect to high-speed Cloudflare Edge CDN download
  return NextResponse.redirect(CLOUDFLARE_APK_URL, 307);
}
