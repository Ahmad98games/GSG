import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const host = req.headers.get('host') || '127.0.0.1:3000';
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  const cleanHost = host.split(':')[0];

  const vJsonPath = path.join(process.cwd(), 'public', 'version.json');
  let vData: any = {};
  try {
    if (fs.existsSync(vJsonPath)) {
      vData = JSON.parse(fs.readFileSync(vJsonPath, 'utf8'));
    }
  } catch {}

  const latestVersion = vData.latest_version || '15.0.1';
  const minRequiredVersion = vData.min_required_version || '15.0.0';
  const releaseNotes = vData.release_notes || 'Counter speed optimization & barcode mesh fix';

  return NextResponse.json({
    latestVersion,
    latest_version: latestVersion,
    minRequiredVersion,
    min_required_version: minRequiredVersion,
    apkUrl: `${protocol}://${host}/downloads/noxis-preview.apk`,
    apk_url: `${protocol}://${host}/downloads/noxis-preview.apk`,
    cloudApkUrl: 'https://pub-8c464d0d92ff44abbf70c58c362ad258.r2.dev/noxis-preview.apk',
    apkFilename: 'noxis-preview.apk',
    fileSize: vData.file_size || 125564246,
    file_size: vData.file_size || 125564246,
    hash: vData.hash || '',
    releaseNotes,
    release_notes: releaseNotes,
    serverTime: new Date().toISOString(),
    devicesReady: true,
  });
}
