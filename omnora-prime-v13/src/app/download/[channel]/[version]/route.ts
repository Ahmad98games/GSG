import { NextRequest, NextResponse } from 'next/server';
import { generateDownloadUrl } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const targetUrl = await generateDownloadUrl('Noxis Setup 13.0.0.exe', 900);
    return NextResponse.redirect(targetUrl, 302);
  } catch (e) {
    return NextResponse.redirect('/api/download-software?trial=true&redirect=true', 302);
  }
}
