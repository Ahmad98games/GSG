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
  '/workstation',
  '/mobile',
  '/pos',
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
  '/api/hub',
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

  // 2. Security Layer: Strict Web vs Desktop / Local Workstation Separation
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0].toLowerCase();
  
  // Check if request is directed to a local/private network node (LAN Workstation or Mobile device)
  const isPrivateIpOrLocalHost = 
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.16.') ||
    hostname.startsWith('172.17.') ||
    hostname.startsWith('172.18.') ||
    hostname.startsWith('172.19.') ||
    hostname.startsWith('172.20.') ||
    hostname.startsWith('172.21.') ||
    hostname.startsWith('172.22.') ||
    hostname.startsWith('172.23.') ||
    hostname.startsWith('172.24.') ||
    hostname.startsWith('172.25.') ||
    hostname.startsWith('172.26.') ||
    hostname.startsWith('172.27.') ||
    hostname.startsWith('172.28.') ||
    hostname.startsWith('172.29.') ||
    hostname.startsWith('172.30.') ||
    hostname.startsWith('172.31.') ||
    hostname.endsWith('.local') ||
    hostname === '::1';

  const isLocalNodeHost = 
    process.env.ELECTRON_ENV === 'true' ||
    process.env.IS_NOXIS_HUB_HOST === 'true' ||
    process.env.ELECTRON_USER_DATA !== undefined ||
    isPrivateIpOrLocalHost;

  const isDesktopOrWorkstation = 
    process.env.NEXT_PUBLIC_PLATFORM === 'electron' ||
    process.env.ELECTRON_ENV === 'true' ||
    request.headers.get('user-agent')?.toLowerCase().includes('electron') ||
    request.headers.get('x-noxis-client') === 'desktop' ||
    request.headers.get('x-noxis-client') === 'workstation' ||
    process.env.NODE_ENV === 'development' ||
    isLocalNodeHost;

  const ADMIN_SEGMENT = process.env.ADMIN_PATH_SEGMENT;

  // On local workstation/LAN nodes, root `/` redirects directly into the operational Hub dashboard
  if (isLocalNodeHost && (pathname === '/' || pathname === '/index.html')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If request is from an external open-web client (NOT desktop app and NOT local LAN workstation)
  if (!isDesktopOrWorkstation) {
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
