import { NextRequest, NextResponse } from 'next/server';

const CLOUDFLARE_APK_URL = 'https://pub-8c464d0d92ff44abbf70c58c362ad258.r2.dev/noxis-preview.apk';
const CLOUDFLARE_VERSION_URL = 'https://pub-8c464d0d92ff44abbf70c58c362ad258.r2.dev/version.json';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const info = searchParams.get('info');

  if (info === 'true' || searchParams.get('json') === 'true') {
    return NextResponse.json({
      name: 'Noxis Mobile Terminal',
      version: '14.5.0',
      latest_version: '14.5.0',
      platform: 'Android 8.0+ (ARM64 & x86_64)',
      filename: 'noxis-preview.apk',
      file_size_mb: 116.04,
      file_size_bytes: 121683542,
      hash: 'a90248fc6dadb21b17de7753c730798adb17f11e10867b78daa9e0f186d87f46',
      hash_sha256: 'a90248fc6dadb21b17de7753c730798adb17f11e10867b78daa9e0f186d87f46',
      direct_download_url: CLOUDFLARE_APK_URL,
      apk_url: CLOUDFLARE_APK_URL,
      manifest_url: CLOUDFLARE_VERSION_URL,
      release_notes: 'Official Noxis Hub Logo, Instant Zero-Lag Sync Engine, 2-Way Offline Persistence & Tactile Responsive UI',
      released_at: new Date().toISOString(),
      devices_ready: true,
    });
  }

  // Redirect to high-speed Cloudflare Edge CDN download
  return NextResponse.redirect(CLOUDFLARE_APK_URL, 307);
}
