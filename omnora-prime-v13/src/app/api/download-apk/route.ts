import { NextRequest, NextResponse } from 'next/server';

const CLOUDFLARE_APK_URL = 'https://pub-8c464d0d92ff44abbf70c58c362ad258.r2.dev/noxis-preview.apk';
const CLOUDFLARE_VERSION_URL = 'https://pub-8c464d0d92ff44abbf70c58c362ad258.r2.dev/version.json';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const info = searchParams.get('info');

  if (info === 'true' || searchParams.get('json') === 'true') {
    return NextResponse.json({
      name: 'Noxis Mobile Terminal',
      version: '15.0.2',
      latest_version: '15.0.2',
      platform: 'Android 8.0+ (ARM64 & x86_64)',
      filename: 'noxis-preview.apk',
      file_size_mb: 122.12,
      file_size_bytes: 128054905,
      hash: '3b2ecc118d714504cf677d3a63b7b1df7f41e33999f03d656f327bd74814eaa5',
      hash_sha256: '3b2ecc118d714504cf677d3a63b7b1df7f41e33999f03d656f327bd74814eaa5',
      direct_download_url: CLOUDFLARE_APK_URL,
      apk_url: CLOUDFLARE_APK_URL,
      manifest_url: CLOUDFLARE_VERSION_URL,
      release_notes: 'Official Noxis Hub Logo, Instant Direct Sync Engine, Local Hub Bridge & Splash Screen Polish',
      released_at: new Date().toISOString(),
      devices_ready: true,
    });
  }

  // Redirect to high-speed Cloudflare Edge CDN download
  return NextResponse.redirect(CLOUDFLARE_APK_URL, 307);
}
