import type { NextConfig } from "next";
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const isProd = process.env.NODE_ENV === 'production';

const getCSP = () => {
  const isProd = process.env.NODE_ENV === 'production';
  const isElectron = process.env.NEXT_PUBLIC_PLATFORM === 'electron' || process.env.ELECTRON_ENV;

  const policy: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", !isProd ? "'unsafe-eval'" : ""].filter(Boolean),
    'style-src': ["'self'", "'unsafe-inline'"], // Required for Tailwind
    'img-src': ["'self'", "data:", "blob:", "https://*.supabase.co"],
    'connect-src': [
      "'self'", 
      "https://*.supabase.co", 
      "wss://*.supabase.co", 
      "https://api.stripe.com"
    ],
    'font-src': ["'self'"],
    'media-src': ["'self'", "blob:"],
    'frame-ancestors': [isElectron ? "'self'" : "'none'"],
  };

  return Object.entries(policy)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
};

const serverOnlyPackages = ['puppeteer', 'better-sqlite3', 'pino', 'node-cron'];

const isStaticBuild = 
  process.env.NEXT_PUBLIC_PLATFORM === 'electron' || 
  process.env.NEXT_PUBLIC_PLATFORM === 'capacitor' || 
  process.env.CLOUDFLARE_DEPLOY === 'true';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  serverExternalPackages: serverOnlyPackages,

  turbopack: {},
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent these from ever reaching the client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, 
        net: false, 
        tls: false, 
        child_process: false,
      };
    }
    return config;
  },
/*
  async headers() {
    // ... existing headers code ...
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
// { key: 'Content-Security-Policy', value: getCSP() },
        ],
      },
      {
        source: '/cctv/(.*)',
        headers: [
          { key: 'Permissions-Policy', value: 'camera=(self)' },
        ],
      },
    ];
  },
*/
};

// Bundle Analyzer integration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

export default withNextIntl(withBundleAnalyzer(nextConfig));

