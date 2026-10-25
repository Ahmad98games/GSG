export function SoftwareSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'Noxis Hub',
    'applicationCategory': 'BusinessApplication, ERPApplication, PointOfSale',
    'applicationSubCategory': 'Industrial Manufacturing ERP & POS',
    'operatingSystem': 'Windows 10, Windows 11 (64-bit), Android 8.0+ (Mobile Companion)',
    'offers': [
      {
        '@type': 'Offer',
        'name': 'Free Forever',
        'price': '0',
        'priceCurrency': 'PKR',
        'description': 'Free perpetual tier with billing counter, 200 items, 50 parties, and offline operation',
      },
      {
        '@type': 'Offer',
        'name': 'Lite License',
        'price': '25000',
        'priceCurrency': 'PKR',
        'description': 'Perpetual machine license with mobile floor bridge (up to 5 devices) and cloud backup',
      },
      {
        '@type': 'Offer',
        'name': 'Pro License',
        'price': '60000',
        'priceCurrency': 'PKR',
        'description': 'Full industrial suite with Karigar piece-rate payroll, RS232 weighbridge, CCTV feeds, and multi-user sync',
      },
    ],
    'featureList': [
      '23 Industrial Themes with Daylight and Dark High-Contrast Modes (Light Slate, Cyber Cyan, Textile Gold, Pharma Clean, Logistics Amber, etc.)',
      '100% Offline SQLite Write-Ahead Logging (WAL) Engine with Zero-Loss Power-Cut Protection',
      'Multi-User Real-Time LAN Auto-Sync & Workstation Heartbeat Monitor (<1ms local latency)',
      'Public Authenticated Developer REST API v1 (Bearer Token auth for /api/v1/inventory and /api/v1/invoices)',
      'HMAC-SHA256 Signed Outbound Webhooks Engine (real-time events with delivery audit logs)',
      'RS232 Serial Weighbridge Scale Integration (continuous Tara/Gross weight capture)',
      'Bluetooth & USB ESC/POS 58mm & 80mm Thermal Slip Printing with auto-cutter pulse',
      'Karigar Piece-Rate Wage Matrix & Peshgi Cash Advance Balance Khata',
      'Double-Entry Accounting & Ledger with Multi-Currency support (PKR, AED, USD, SAR)',
      'CCTV RTSP Security Camera Live Monitoring in Dashboard',
      'Pakistan FBR NTN/STRN Sales Tax & UAE FTA VAT 201 Tax Compliance',
      'Hardware Fingerprint Cryptographic Licensing (HWID tied, zero forced cloud dependency)',
    ],
    'screenshot': 'https://noxishub.app/screenshot.png',
    'softwareVersion': '14.0.17',
    'datePublished': '2026-10-24',
    'author': {
      '@type': 'Organization',
      'name': 'Omnora Labs',
      'url': 'https://noxishub.app',
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': 'Lahore',
        'addressCountry': 'PK',
      },
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '5',
      'reviewCount': '12',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema)
      }}
    />
  )
}

export function OrganizationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          'name': 'Omnora Labs',
          'url': 'https://noxishub.app',
          'logo': 'https://noxishub.app/logo.png',
          'contactPoint': {
            '@type': 'ContactPoint',
            'telephone': '+92-326-474-2678',
            'contactType': 'customer service',
            'availableLanguage': ['English', 'Urdu'],
          },
          'sameAs': [
            'https://www.youtube.com/@Pak_the_gamerz',
          ],
        })
      }}
    />
  )
}

export function FAQSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          'mainEntity': [
            {
              '@type': 'Question',
              'name': 'How many themes does Noxis Hub support?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Noxis Hub supports 23 engineered industrial themes specifically crafted for factory ergonomics. These include high-visibility daylight themes (such as Light Slate and Arctic White for dusty factory counters), high-contrast cyber dark modes (Cyber Cyan & Deep Obsidian, Carbon Dark), sector-specific palettes (Textile Gold for weaving mills, Pharma Clean for medical labs, Logistics Amber for transport hubs, Saffron Bazaar for wholesale markets, Steel Industrial, Midnight Blue, Desert Sand, Crimson Power, Ocean Teal, Warm Ivory, Neon Cyber, Rose Gold, Volcanic Ash, Deep Forest, Chrome Silver, Golden Onyx, and Midnight Emerald). Users can also customize accent colors and toggle between daylight and night-shift contrast levels.',
              },
            },
            {
              '@type': 'Question',
              'name': 'Does Noxis Hub work without internet?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Yes. Noxis Hub is 100% offline-first. All inventory records, customer khatas, invoices, and Karigar payroll are stored in an encrypted local SQLite database using Write-Ahead Logging (WAL) on your physical computer. Broadband disconnects, severed fiber cables, or total internet blackouts do not impact daily billing, printing, or floor operations.',
              },
            },
            {
              '@type': 'Question',
              'name': 'Can multiple users work on Noxis Hub simultaneously?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Yes. Noxis Hub features real-time multi-terminal LAN peer synchronization. One PC acts as the master Hub over local office Wi-Fi, and other workstations or laptops connect via their web browser (http://<hub-ip>:3000) or desktop app. All updates (new invoices, stock deductions, ledger payments) sync instantly across terminals in under 1 millisecond without passing through any external cloud server.',
              },
            },
            {
              '@type': 'Question',
              'name': 'Does Noxis Hub have a Developer REST API and Webhooks?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Yes. Noxis Hub v14.0.17 includes a public authenticated Developer REST API v1 (/api/v1/inventory and /api/v1/invoices) secured with 64-character high-entropy Bearer tokens. It also features a built-in HMAC-SHA256 signed outbound webhook dispatcher that automatically broadcasts events (e.g. invoice.created, stock.low, payment.received) to external platforms like Shopify, WooCommerce, or custom ERP systems with real-time delivery logs and latency tracking.',
              },
            },
            {
              '@type': 'Question',
              'name': 'What happens during a sudden factory power cut or load-shedding?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Noxis Hub utilizes SQLite in Write-Ahead Logging (WAL) mode with synchronous PRAGMA tuning. Transactions are committed to a write log before altering the master database file. If power cuts off abruptly while printing an invoice or saving a ledger entry, uncommitted operations cleanly roll back and completed transactions remain intact, preventing database file corruption.',
              },
            },
            {
              '@type': 'Question',
              'name': 'What hardware peripherals does Noxis Hub support?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Noxis Hub integrates natively with RS232 serial weighbridge scales (Avery Weigh-Tronix, Cardinal, Toledo, Keli, Yaohua at 9600 baud, 8-N-1), Bluetooth and USB ESC/POS 58mm and 80mm thermal receipt printers with automatic paper cut commands, USB barcode and QR scanners, and RTSP video feeds from factory CCTV security cameras.',
              },
            },
            {
              '@type': 'Question',
              'name': 'How does Karigar piece-rate payroll and Peshgi advance work?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Noxis Hub calculates Karigar wages automatically based on piece-rate production tariffs (per yard, meter, suit, or thaan cut), daily shifts, and monthly attendance. It features an integrated Peshgi (cash advance) ledger where advances are automatically deducted from the worker\'s weekly or bi-weekly pay slip, producing bilingual English and Urdu payment vouchers.',
              },
            },
            {
              '@type': 'Question',
              'name': 'Does Noxis Hub support UAE VAT and Pakistan Sales Tax?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Yes. Noxis Hub supports UAE FTA VAT at 5% with TRN numbers and compliant tax invoice templates, as well as Pakistan FBR Sales Tax (GST) with NTN and STRN fields, bilingual Urdu/English thermal printouts, and automated tax reporting.',
              },
            },
          ],
        })
      }}
    />
  )
}
