import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
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

export const metadata = {
  title: 'Noxis — Industrial ERP for Factories',
  description: 'Factory management software that works offline. Inventory, payroll, CCTV, invoicing. For textile, pharma, rice mills and 40+ industries. Available in Urdu and English.',
  keywords: [
    'factory ERP Pakistan',
    'industrial ERP software',
    'textile management software Pakistan',
    'karigar management software',
    'factory software Urdu',
    'offline ERP Pakistan',
    'inventory management Pakistan',
    'CCTV factory software',
    'kapra factory software',
    'dawapharma software',
    'rice mill software Pakistan',
    'ERP software Lahore',
    'ERP software Karachi',
    'small business ERP Pakistan',
    'factory payroll software'
  ],
  openGraph: {
    title: 'Noxis — Industrial ERP for Factories',
    description: 'Works offline. Speaks Urdu. Built for Pakistani and global factories.',
    url: 'https://noxishub.app',
    siteName: 'Noxis',
    type: 'website',
    images: [{
      url: 'https://noxishub.app/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Noxis Industrial ERP Dashboard',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Noxis — Industrial ERP for Factories',
    description: 'Works offline. Speaks Urdu. Built for Pakistani factories.',
    images: ['https://noxishub.app/og-image.png'],
  },
  alternates: {
    canonical: 'https://noxishub.app',
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
    const pkg = ['next', 'headers'].join('/');
    const { headers: getHeaders } = require(pkg);
    const headerList = getHeaders();
    locale = (await headerList).get('x-next-intl-locale') || 'en';
    const { getMessages } = require('next-intl/server');
    messages = await getMessages({ locale });
  }
  const direction = isRTL(locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <head>
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
        <NextIntlClientProvider locale={locale} messages={messages}>
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
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
