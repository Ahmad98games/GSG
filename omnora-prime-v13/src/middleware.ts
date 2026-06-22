import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

  // 2. Auth & License Logic (from proxy.ts)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  
  // Public routes — no auth needed
  const publicRoutes = ['/', '/login', '/pricing', '/docs', '/download', '/portal', '/api', '/license', '/admin', '/dashboard/login']
  const isPublic = publicRoutes.some(r => pathname === r || pathname.startsWith(r))
  
  // A. License Check (Industrial Gate)
  const licenseActive = request.cookies.get('noxis_license_active');

  // B. Silent Re-Auth Logic
  if (!session && !isPublic) {
    try {
      // Attempt to get license from local DB via API route to avoid Edge runtime errors
      const apiUrl = new URL('/api/settings', request.url);
      const res = await fetch(apiUrl);
      if (res.ok) {
        const { localConfig } = await res.json();
        
        const licenseRes = localConfig?.find((c: any) => c.key === 'license_key');
        const emailRes = localConfig?.find((c: any) => c.key === 'customer_email');
        
        if (licenseRes && emailRes) {
          const licenseKey = licenseRes.value;
          const email = emailRes.value;
          
          console.log('[Middleware] Attempting silent re-auth for:', email);
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password: licenseKey,
          });

          if (!authError && authData.session) {
            console.log('[Middleware] Silent re-auth successful ✓');
            // Refresh the page to use the new session
            return NextResponse.redirect(request.url);
          }
        }
      }
    } catch (e) {
      console.error('[Middleware] Silent re-auth failed:', e);
    }
  }

  if (!licenseActive && !isPublic && !pathname.startsWith('/_next') && !pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/license', request.url))
  }

  // C. Auth Check
  if (pathname.startsWith('/dashboard')) {
    if (!session && pathname !== '/dashboard/login') {
      return NextResponse.redirect(new URL('/dashboard/login', request.url))
    }
    if (session && pathname === '/dashboard/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } else {
    if (!session && !isPublic) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Redirect to dashboard if already logged in
    if (session && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Redirect to setup if onboarding is not complete
  if (session && !isPublic) {
    try {
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('onboarding_complete')
        .eq('user_id', session.user.id)
        .single()
      
      const isComplete = profile ? profile.onboarding_complete : false
      
      if (!isComplete
        && pathname !== '/setup'
        && pathname !== '/license'
        && !pathname.startsWith('/dashboard')
        && !pathname.startsWith('/api')
        && !pathname.startsWith('/_next')) {
        return NextResponse.redirect(new URL('/setup', request.url))
      }
    } catch (e) {
      console.error('[Middleware] Failed to check onboarding status:', e)
    }
  }

  // D. Role-Based Access Control (RBAC) for staff users
  if (session && !isPublic && !pathname.startsWith('/unauthorized') && !pathname.startsWith('/dashboard') && !pathname.startsWith('/settings') && !pathname.startsWith('/api')) {
    try {
      const { data: staffRecord } = await supabase
        .from('staff_users')
        .select('role, is_active')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single()

      // If staff record exists (not the owner), check permissions
      if (staffRecord && staffRecord.role !== 'owner') {
        const ROLE_ROUTES: Record<string, string[]> = {
          manager: ['/dashboard', '/inventory', '/karigars', '/production', '/payroll', '/dispatch', '/invoices', '/parties', '/purchase', '/orders', '/khata', '/cashflow', '/reports', '/audit', '/cctv', '/quick-entry', '/analytics', '/stock', '/generators', '/calculators', '/converters', '/file-morph', '/messaging', '/pairing', '/portal'],
          accountant: ['/dashboard', '/khata', '/invoices', '/reports', '/parties', '/cashflow', '/audit', '/purchase', '/stock', '/calculators', '/converters', '/generators', '/file-morph'],
          supervisor: ['/dashboard', '/production', '/karigars', '/payroll', '/dispatch', '/stock', '/inventory'],
          salesman: ['/dashboard', '/invoices', '/parties', '/stock', '/orders', '/calculators', '/converters'],
          viewer: ['/dashboard', '/reports', '/analytics'],
        }
        const allowed = ROLE_ROUTES[staffRecord.role] || ['/dashboard']
        const hasAccess = allowed.some(route => pathname.startsWith(route))
        if (!hasAccess) {
          return NextResponse.redirect(new URL('/unauthorized', request.url))
        }
      }
    } catch {
      // If staff_users table doesn't exist yet or query fails, allow access (owner)
    }
  }

  // 3. Locale Logic (from original middleware.ts)
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

  // Set the locale in a header so i18n.ts can read it
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-next-intl-locale', locale);

  response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // If no cookie was present, set it for next time
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
