import { NextResponse } from 'next/server';

export function generateStaticParams() {
  return [{ channel: 'stable', version: 'latest' }];
}

export async function GET() {
  return NextResponse.redirect('https://noxishub.app/api/download-software?trial=true&redirect=true', 302);
}
