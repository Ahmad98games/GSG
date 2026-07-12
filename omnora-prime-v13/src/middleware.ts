import { NextResponse, type NextRequest } from 'next/server'
import { verifyToken } from '@/lib/admin/auth'

const PUBLIC_FILE = /\.(.*)$/;
const locales = ['en', 'ur', 'fr', 'ar', 'zh', 'tr', 'hi', 'fa', 'es', 'de'];
const defaultLocale = 'en';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip public files and api routes for the locale check
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 1.5. Protect admin routes (cookie check + cryptographic verification, no outbound network)
  const ADMIN_SEGMENT = process.env.ADMIN_PATH_SEGMENT;
  if (
    ADMIN_SEGMENT &&
    pathname.startsWith(`/${ADMIN_SEGMENT}`) &&
    pathname !== `/${ADMIN_SEGMENT}/login`
  ) {
    const token = request.cookies.get('noxis_admin_token')?.value;
    const ip =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      'unknown';

    const valid = token ? await verifyToken(token, ip) : false;

    if (!valid) {
      return NextResponse.redirect(new URL(`/${ADMIN_SEGMENT}/login`, request.url));
    }
  }

  // 2. Locale Logic (remains offline-friendly)
  let locale = request.cookies.get('NOXIS_LOCALE')?.value;

  if (!locale || !locales.includes(locale)) {
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
      locale = acceptLanguage.split(',')[0].split('-')[0];
    }
    if (!locale || !locales.includes(locale)) {
      locale = defaultLocale;
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-next-intl-locale', locale);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (!request.cookies.has('NOXIS_LOCALE')) {
    response.cookies.set('NOXIS_LOCALE', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax'
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|portal).*)',
  ],
}
