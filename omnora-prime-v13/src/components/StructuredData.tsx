export function SoftwareSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'Noxis Hub',
    'applicationCategory': 'BusinessApplication',
    'applicationSubCategory': 'ERP Software',
    'operatingSystem': 'Windows 8.1, Windows 10, Windows 11',
    'offers': [
      {
        '@type': 'Offer',
        'name': 'Free Forever',
        'price': '0',
        'priceCurrency': 'PKR',
        'description': 'Free tier with POS, 200 items, 50 customers',
      },
      {
        '@type': 'Offer',
        'name': 'Lite',
        'price': '25000',
        'priceCurrency': 'PKR',
        'description': 'Annual license with mobile app and cloud backup',
      },
      {
        '@type': 'Offer',
        'name': 'Pro',
        'price': '60000',
        'priceCurrency': 'PKR',
        'description': 'Annual license for factories with AI and multi-branch',
      },
    ],
    'featureList': [
      'Double-entry accounting',
      'Karigar piece-rate payroll',
      'Offline-first operation',
      'Mobile companion app',
      'CCTV integration',
      'WhatsApp billing',
      'UAE VAT compliance',
      'Pakistan FBR GST compliance',
      'Power cut recovery',
      'RS232 weighbridge integration',
    ],
    'screenshot': 'https://noxishub.app/screenshot.png',
    'softwareVersion': '13.1.0',
    'datePublished': '2026-07-01',
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
      'reviewCount': '1',
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
              'name': 'Does Noxis Hub work without internet?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Yes. Noxis Hub is 100% offline-capable. All data is stored on your PC in an encrypted SQLite database. Internet is only needed for cloud backup and mobile sync, which are optional.',
              },
            },
            {
              '@type': 'Question',
              'name': 'Is there a free version of Noxis Hub?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Yes. Noxis Hub Free Forever has no expiry date and includes full POS, 200 inventory items, 50 customers, and offline operation. There is also a 14-day free trial with full Pro access.',
              },
            },
            {
              '@type': 'Question',
              'name': 'Does Noxis Hub support UAE VAT?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Yes. Noxis Hub supports UAE VAT at 5% including TRN on invoices and a UAE FTA VAT 201 return report. It also supports Pakistan GST at 17% with NTN and STRN fields.',
              },
            },
            {
              '@type': 'Question',
              'name': 'What is karigar payroll in Noxis Hub?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Karigar payroll is Noxis Hub\'s piece-rate wage calculation system for factory workers. It handles piece-rate, daily, and monthly wages, advance tracking (peshgi), EOBI deductions, and generates payslips with amount in words in English and Urdu.',
              },
            },
          ],
        })
      }}
    />
  )
}
