import { NextResponse, type NextRequest } from 'next/server'
import { verifyToken } from '@/lib/admin/auth'

const PUBLIC_FILE = /\.(.*)$/;
const locales = ['en', 'ur', 'fr', 'ar', 'zh', 'tr', 'hi', 'fa', 'es', 'de'];
const defaultLocale = 'en';

// Public marketing & external customer routes allowed on web
const ALLOWED_WEB_PREFIXES = [
  '/features',
  '/pricing',
  '/industries',
  '/download',
  '/docs',
  '/changelog',
  '/blog',
  '/compare',
  '/terms',
  '/privacy',
  '/refund',
  '/purchase',
  '/who-is-it-for',
  '/technology',
  '/reviews',
  '/about',
  '/whats-new',
  '/portal',
  '/shared',
  '/not-found',
];

const ALLOWED_WEB_APIS = [
  '/api/download-software',
  '/api/download',
  '/api/orders',
  '/api/portal',
  '/api/changelog',
  '/api/docs',
  '/api/admin',
  '/api/webhooks',
  '/api/license',
  '/api/heartbeat',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets and next internals immediately
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Security Layer: Strict Web vs Desktop Separation
  // Desktop environment is verified via Electron platform flag, Electron process env, or user-agent
  const isDesktop = 
    process.env.NEXT_PUBLIC_PLATFORM === 'electron' ||
    process.env.ELECTRON_ENV === 'true' ||
    request.headers.get('user-agent')?.toLowerCase().includes('electron') ||
    request.headers.get('x-noxis-client') === 'desktop' ||
    process.env.NODE_ENV === 'development';

  const ADMIN_SEGMENT = process.env.ADMIN_PATH_SEGMENT;

  // If request is from an open-web client (NOT desktop app)
  if (!isDesktop) {
    const isRoot = pathname === '/' || pathname === '/index.html';
    const isAllowedPrefix = ALLOWED_WEB_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
    const isAllowedAdmin = ADMIN_SEGMENT ? pathname === `/${ADMIN_SEGMENT}` || pathname.startsWith(`/${ADMIN_SEGMENT}/`) : false;

    // Handle API requests on web
    if (pathname.startsWith('/api')) {
      const isAllowedApi = ALLOWED_WEB_APIS.some(api => pathname === api || pathname.startsWith(`${api}/`));
      if (!isAllowedApi) {
        // Internal ERP API requested on web: return pure 404 with zero details
        return new NextResponse(JSON.stringify({ error: 'Not Found' }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        });
      }
      return NextResponse.next();
    }

    // Handle Page requests on web: if not an allowed public page, rewrite to /not-found with 404 status
    if (!isRoot && !isAllowedPrefix && !isAllowedAdmin) {
      return NextResponse.rewrite(new URL('/not-found', request.url), {
        status: 404,
        headers: {
          'X-Robots-Tag': 'noindex, nofollow, noarchive',
        },
      });
    }
  }

  // 3. Protect admin routes (cookie check + cryptographic verification, no outbound network)
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

  // Skip api and portal from locale cookies
  if (pathname.startsWith('/api') || pathname.startsWith('/portal/') || pathname.startsWith('/shared/')) {
    return NextResponse.next();
  }

  // 4. Locale Logic (remains offline-friendly)
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
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
