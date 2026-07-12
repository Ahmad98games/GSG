import type { NextConfig } from "next";
import path from "path";
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const isProd = process.env.NODE_ENV === 'production';
const projectRoot = path.resolve(process.cwd());

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

const serverOnlyPackages = [
  'better-sqlite3-multiple-ciphers',
  'better-sqlite3',
  '@noxis/sqlite',
  'sharp',
  'canvas',
  'puppeteer',
  'pino',
  'node-cron'
];

const isStaticBuild = 
  process.env.NEXT_PUBLIC_PLATFORM === 'electron' || 
  process.env.NEXT_PUBLIC_PLATFORM === 'capacitor' || 
  process.env.CLOUDFLARE_DEPLOY === 'true';

// Electron needs 'standalone' to spawn standalone nextServer inside the packaged app.
// Static website deployment (Cloudflare) needs 'export'.
const isStaticExport = 
  process.env.NEXT_PUBLIC_PLATFORM === 'capacitor' || 
  process.env.CLOUDFLARE_DEPLOY === 'true';

const nextConfig: NextConfig = {
  output: isStaticExport ? 'export' : 'standalone',
  images: {
    unoptimized: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },
  serverExternalPackages: serverOnlyPackages,
  outputFileTracingRoot: path.join(__dirname),
  outputFileTracingIncludes: {
    '**': [
      './node_modules/better-sqlite3-multiple-ciphers/**',
      './node_modules/better-sqlite3/**',
      './node_modules/drizzle-orm/**',
      './src/lib/db/migrations/**',
    ],
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@supabase/supabase-js',
      'recharts',
      'date-fns',
      '@tanstack/react-table',
      '@tanstack/react-virtual',
      '@tanstack/react-query',
      'react-hot-toast',
    ],
  },

  turbopack: {
    root: projectRoot,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Stub server-only modules on the client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, 
        net: false, 
        tls: false, 
        child_process: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
      };
    }

    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase/,
            name: 'supabase',
            chunks: 'all',
            priority: 30,
          },
          tanstack: {
            test: /[\\/]node_modules[\\/]@tanstack/,
            name: 'tanstack',
            chunks: 'all',
            priority: 25,
          },
          charts: {
            test: /[\\/]node_modules[\\/]recharts/,
            name: 'recharts',
            chunks: 'async',
            priority: 20,
          },
          lucide: {
            test: /[\\/]node_modules[\\/]lucide-react/,
            name: 'lucide',
            chunks: 'all',
            priority: 20,
          },
        },
      },
    };

    return config;
  },
  async headers() {
    if (isStaticExport) return [];
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: getCSP() },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/cctv/:path*',
        headers: [
          { key: 'Permissions-Policy', value: 'camera=(self)' },
        ],
      },
    ];
  },
};

// Bundle Analyzer integration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

export default withNextIntl(withBundleAnalyzer(nextConfig));

