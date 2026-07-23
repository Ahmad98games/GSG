import type { Metadata } from "next";
import { ClientI18nProvider } from '@/components/providers/ClientI18nProvider';
import enMessages from '@/messages/en.json';
import "./globals.css";

import QueryProvider from "@/components/providers/QueryProvider";
import { AuditProvider } from "@/components/providers/AuditProvider";
import AppShell from "@/components/shell/AppShell";
import { ThemeInitializer } from "@/components/providers/ThemeInitializer";
import { IndustryProvider } from "@/components/providers/IndustryProvider";
import { LicenseInitializer } from "@/components/providers/LicenseInitializer";
import { isRTL, getFontFamily } from "@/lib/locale-utils";
import AskNoxis from "@/components/knowledge/AskNoxis";
import { GlobalErrorBoundary } from "@/components/ui/GlobalErrorBoundary";
import Script from "next/script";
import ElectronMotionWrapper from "@/components/providers/ElectronMotionWrapper";

export const metadata: Metadata = {
  title: {
    default: 'Noxis Hub — Factory ERP Software for Pakistan & UAE | Offline-First',
    template: '%s | Noxis Hub',
  },
  description: 'Noxis Hub is the #1 factory management software for textile mills, rice mills, garment factories, and manufacturing businesses in Pakistan and UAE. Works offline. Karigar management, piece-rate payroll, WhatsApp billing, CCTV integration. Starting PKR 2,500/year.',
  keywords: [
    // Primary — what factory owners search
    'factory management software Pakistan',
    'ERP software Pakistan',
    'karigar management software',
    'textile mill software Pakistan',
    'rice mill software Pakistan',
    'garment factory software',
    'manufacturing software Pakistan',
    'piece rate payroll software',
    'attendance software factory',

    // Urdu transliteration (huge opportunity)
    'karkhana management software',
    'karigar software',
    'peshgi software',
    'haazri software',

    // UAE market
    'factory software UAE',
    'manufacturing ERP Dubai',
    'industrial software UAE',

    // Competitor comparison
    'TallyPrime alternative Pakistan',
    'Vyapar alternative',
    'Marg ERP alternative',

    // Feature-specific
    'offline ERP software',
    'WhatsApp invoice software',
    'CCTV ERP integration',
    'barcode inventory Pakistan',
    'payroll software factory Pakistan',
  ],

  authors: [{ name: 'Omnora Labs' }],
  creator: 'Omnora Labs',
  publisher: 'Omnora Labs',

  // Canonical URL
  metadataBase: new URL('https://noxishub.app'),
  alternates: {
    canonical: '/',
  },

  // Open Graph (Facebook, WhatsApp previews)
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    url: 'https://noxishub.app',
    siteName: 'Noxis Hub',
    title: 'Noxis Hub — Factory ERP Software for Pakistan & UAE',
    description: 'Manage karigars, attendance, production, payroll, and invoices in one offline-first system. Works without internet. WhatsApp billing built in.',
    images: [
      {
        url: '/og',
        width: 1200,
        height: 630,
        alt: 'Noxis Hub — Factory Management Software Pakistan',
      },
    ],
  },

  // Twitter/X Card
  twitter: {
    card: 'summary_large_image',
    title: 'Noxis Hub — Factory ERP Software Pakistan',
    description: 'Offline-first factory management. Karigars, payroll, CCTV, WhatsApp billing. PKR 2,500/year.',
    images: ['/og'],
    creator: '@omnoralabs',
  },

  // Robots — tell Google to index everything
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification
  verification: {
    google: 'google-site-verification-noxis-2026',
  },

  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let locale = 'en';
  let messages: any = enMessages;
  if (process.env.NEXT_PUBLIC_CLOUDFLARE_DEPLOY !== 'true') {
    const { headers: getHeaders } = eval('require("next/headers")');
    const headerList = getHeaders();
    locale = (await headerList).get('x-next-intl-locale') || 'en';
    messages = (await import(`../messages/${locale}.json`)).default;
  }
  const direction = isRTL(locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <script
          id="fetch-interceptor"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var originalFetch = window.fetch;
                window.fetch = function(input, init) {
                  if (typeof input === 'string' && input.startsWith('/api/')) {
                    input = window.location.origin + input;
                  }
                  return originalFetch(input, init);
                };
              })();
            `
          }}
        />
        <script
          id="ld-json-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Noxis Hub",
              "operatingSystem": "Windows, Web",
              "applicationCategory": "BusinessApplication",
              "description": "Offline-first Industrial ERP and Factory Management Software for manufacturing, textiles, and wholesale operations.",
              "offers": {
                "@type": "Offer",
                "price": "2500",
                "priceCurrency": "PKR"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Omnora Labs"
              }
            })
          }}
        />
        
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap"
          as="style"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap"
          rel="stylesheet"
        />
        {/* Dynamic Font Loading */}
        {(locale === 'ar' || locale === 'fa') && (
          <link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap" rel="stylesheet" />
        )}
        {locale === 'hi' && (
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&display=swap" rel="stylesheet" />
        )}
        {locale === 'zh' && (
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap" rel="stylesheet" />
        )}
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --font-ui-override: ${getFontFamily(locale)};
          }
          body {
            font-family: var(--font-ui-override), Inter, system-ui, sans-serif !important;
          }
        `}} />
      </head>
      <body className="antialiased">
        <Script
          id="adsense-loader"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8531123967455923"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <ElectronMotionWrapper>
        <ClientI18nProvider initialLocale={locale} initialMessages={messages}>
          <AuditProvider>
            <QueryProvider>
              <IndustryProvider>
                <LicenseInitializer />
                <ThemeInitializer />
                <GlobalErrorBoundary>
                  <AppShell>
                    {children}
                    <AskNoxis />
                  </AppShell>
                </GlobalErrorBoundary>
              </IndustryProvider>
            </QueryProvider>
          </AuditProvider>
        </ClientI18nProvider>
        </ElectronMotionWrapper>
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              // Software Application schema
              {
                '@context': 'https://schema.org',
                '@type': 'SoftwareApplication',
                name: 'Noxis Hub',
                alternateName: [
                  'Noxis',
                  'Noxis ERP',
                  'Noxis Factory Software',
                  'نوکسس ہب',
                ],
                description: 'Offline-first factory management ERP for textile mills, rice mills, garment factories, and manufacturing businesses in Pakistan and UAE. Features karigar management, piece-rate payroll, attendance tracking, WhatsApp billing, inventory management, and CCTV integration.',
                applicationCategory: 'BusinessApplication',
                operatingSystem: 'Windows 8.1, Windows 10, Windows 11',
                url: 'https://noxishub.app',
                downloadUrl: 'https://noxishub.app/download',
                screenshot: 'https://noxishub.app/og',
                featureList: [
                  'Karigar (Worker) Management',
                  'Piece-Rate Payroll Calculation',
                  'Peshgi (Advance) Tracking',
                  'Daily Attendance Marking',
                  'Production Logging',
                  'WhatsApp Invoice Sending',
                  'Client Portal with Token-Based Access',
                  'Offline-First with Cloud Sync',
                  'Inventory Management with Barcode',
                  'CCTV Camera Integration',
                  'Multi-Industry Support',
                  'Multi-Currency (PKR, AED, USD, GBP)',
                  'GST and VAT Calculation',
                  'FBR Tax Export',
                  'Double-Entry Accounting',
                  'Expiry Date Tracking',
                  'Batch Number Management',
                  'Mobile Companion App',
                  'Foresight Business Predictions',
                  'Workflow Automation Builder',
                ],
                offers: {
                  '@type': 'AggregateOffer',
                  priceCurrency: 'PKR',
                  lowPrice: '25000',
                  highPrice: '120000',
                  offerCount: 3,
                  offers: [
                    {
                      '@type': 'Offer',
                      name: 'Lite Plan',
                      price: '25000',
                      priceCurrency: 'PKR',
                      description: 'Up to 5 devices, 2 cameras, core factory management',
                    },
                    {
                      '@type': 'Offer',
                      name: 'Pro Plan',
                      price: '60000',
                      priceCurrency: 'PKR',
                      description: 'Up to 15 devices, 4 cameras, advanced reports and intelligence',
                    },
                    {
                      '@type': 'Offer',
                      name: 'Elite Plan',
                      price: '120000',
                      priceCurrency: 'PKR',
                      description: 'Up to 50 devices, 6 cameras, full enterprise features',
                    },
                  ],
                },
                author: {
                  '@type': 'Organization',
                  name: 'Omnora Labs',
                  url: 'https://noxishub.app',
                  contactPoint: {
                    '@type': 'ContactPoint',
                    telephone: '+92-326-474-2678',
                    contactType: 'customer service',
                    availableLanguage: ['English', 'Urdu'],
                  },
                },
                inLanguage: ['en', 'ur'],
                countryOfOrigin: 'PK',
                availableInCountry: ['PK', 'AE', 'SA', 'BD', 'GB', 'US'],
              },

              // Organization schema
              {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'Omnora Labs',
                alternateName: 'Noxis Hub',
                url: 'https://noxishub.app',
                logo: 'https://noxishub.app/logo.png',
                contactPoint: {
                  '@type': 'ContactPoint',
                  telephone: '+92-326-474-2678',
                  contactType: 'sales',
                  availableLanguage: ['English', 'Urdu'],
                },
                sameAs: [
                  'https://www.youtube.com/@Pak_the_gamerz',
                ],
              },

              // FAQ schema — this appears in
              // Google search results as expandable
              // questions
              {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: 'What is Noxis Hub?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Noxis Hub is an offline-first factory management ERP software built for manufacturing businesses in Pakistan and UAE. It manages karigars, attendance, piece-rate payroll, inventory, invoicing, and WhatsApp billing in one system.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Does Noxis Hub work without internet?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Yes. Noxis Hub stores all data locally on your factory PC and syncs to the cloud when internet is available. All core features work completely offline.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'What is the price of Noxis Hub?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Noxis Hub starts at PKR 25,000 per year for the Lite plan. Pro is PKR 60,000 per year. Elite is PKR 120,000 per year. All plans include installation support.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Does Noxis Hub support karigar management?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Yes. Noxis Hub has built-in karigar management with attendance tracking, piece-rate wage calculation, peshgi advance tracking, production logging with quality grades, and automatic payroll generation.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Is Noxis Hub suitable for rice mills?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Yes. Noxis Hub has a dedicated rice mill mode that changes all terminology to match rice mill operations — Mazdoor instead of Karigar, paddy and rice inventory tracking, yield calculation, and seasonal reporting.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'What is the difference between Noxis Hub and TallyPrime?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Noxis Hub includes karigar management, piece-rate payroll, mobile companion app, WhatsApp billing, and CCTV integration that TallyPrime does not have. TallyPrime has faster keyboard-based entry for accountants. Noxis Hub is designed for factory owners and floor supervisors, not accountants.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Does Noxis Hub work in UAE?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Yes. Noxis Hub supports UAE operations with AED currency, VAT 5% tax calculation, Arabic date formats, and UAE phone number formatting. It is used by Pakistani business owners in Dubai, Sharjah, and Abu Dhabi.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'What is Noxis Mobile Hub?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Noxis Mobile Hub is the Android companion app for Noxis Hub. Factory supervisors use it to mark attendance, log production, and give peshgi advances from their phone. It connects to the PC Hub over local WiFi and works offline.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Can Noxis Hub manage multiple factory branches?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Yes. Noxis Hub supports multiple factory locations in Pakistan and across Pakistan and UAE. Each location runs its own PC Hub with local data, and all branches sync to a shared cloud account. The owner sees consolidated reports while branch managers see only their location.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Is Noxis Hub better than SAP for Pakistani factories?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'For mid-sized Pakistani factories (10-5000 workers), Noxis Hub is a better fit than SAP because it works offline, costs 95% less, is installed in one day, and includes Pakistan-specific features like karigar management, peshgi tracking, and WhatsApp billing that SAP does not have. For multi-national corporations with 50+ legal entities, SAP remains the appropriate choice.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Does Noxis Hub integrate with e-commerce platforms?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Noxis Hub is built for manufacturing and factory operations, not e-commerce. It does not integrate with Shopify, Amazon, or similar platforms. For businesses that need both factory management and e-commerce, Noxis Hub handles the factory side while a separate e-commerce platform handles online sales.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'What technology does Noxis Hub use?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Noxis Hub uses Next.js and React for the interface, Electron for Windows deployment, SQLite with SQLCipher encryption for local data storage, Supabase PostgreSQL for cloud backup and sync, React Native for the mobile companion app, and Cloudflare for hosting and remote access tunneling.',
                    },
                  },
                ],
              },

              // BreadcrumbList for navigation
              {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Home',
                    item: 'https://noxishub.app',
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Features',
                    item: 'https://noxishub.app/features',
                  },
                  {
                    '@type': 'ListItem',
                    position: 3,
                    name: 'Pricing',
                    item: 'https://noxishub.app/pricing',
                  },
                  {
                    '@type': 'ListItem',
                    position: 4,
                    name: 'Download',
                    item: 'https://noxishub.app/download',
                  },
                ],
              },
            ])
          }}
        />
      </body>
    </html>
  );
}
