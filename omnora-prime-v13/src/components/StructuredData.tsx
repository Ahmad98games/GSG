import React from 'react';

/**
 * Type-safe Schema.org definitions for Omnora Labs & Noxis Hub
 * Designed for Next.js 15 SSR / Static generation without hydration mismatches.
 */

export interface PostalAddressSchema {
  '@type': 'PostalAddress';
  addressLocality: string;
  addressRegion?: string;
  addressCountry: string;
}

export interface ContactPointSchema {
  '@type': 'ContactPoint';
  telephone: string;
  contactType: string;
  areaServed?: string | string[];
  availableLanguage?: string[];
}

export interface PersonSchema {
  '@type': 'Person';
  name: string;
  jobTitle?: string;
  url?: string;
}

export interface AdministrativeAreaSchema {
  '@type': 'AdministrativeArea';
  name: string;
}

export interface OfferSchema {
  '@type': 'Offer';
  price: string | number;
  priceCurrency: string;
  category?: string;
  description?: string;
  availability?: string;
  url?: string;
  priceValidUntil?: string;
}

export interface OrganizationRefSchema {
  '@type': 'Organization';
  '@id'?: string;
  name?: string;
  url?: string;
}

export interface OrganizationSchemaType {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  '@id'?: string;
  name: string;
  alternateName?: string | string[];
  url: string;
  logo?: string;
  image?: string;
  telephone?: string;
  founder?: PersonSchema;
  areaServed?: AdministrativeAreaSchema | string;
  address?: PostalAddressSchema;
  contactPoint?: ContactPointSchema | ContactPointSchema[];
  sameAs?: string[];
}

export interface SoftwareApplicationSchemaType {
  '@context': 'https://schema.org';
  '@type': 'SoftwareApplication';
  '@id'?: string;
  name: string;
  alternateName?: string | string[];
  operatingSystem: string;
  applicationCategory: string;
  applicationSubCategory?: string;
  softwareVersion?: string;
  description: string;
  url?: string;
  downloadUrl?: string;
  screenshot?: string;
  offers?: OfferSchema | OfferSchema[];
  featureList?: string[];
  author?: OrganizationRefSchema;
  publisher?: OrganizationRefSchema;
  inLanguage?: string[];
  countryOfOrigin?: string;
  availableInCountry?: string[];
}

export const OMNORA_ORGANIZATION_SCHEMA: OrganizationSchemaType = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://noxishub.app/#organization',
  name: 'Omnora Labs',
  alternateName: 'Noxis Hub',
  url: 'https://noxishub.app',
  logo: 'https://noxishub.app/logo.png',
  image: 'https://noxishub.app/og.png',
  telephone: '+923121271765',
  founder: {
    '@type': 'Person',
    name: 'Ahmad Mahboob',
    jobTitle: 'Founder / Lead Architect',
    url: 'https://noxishub.app/about',
  },
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Lahore, Pakistan',
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Lahore',
    addressRegion: 'Punjab',
    addressCountry: 'PK',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+923121271765',
    contactType: 'customer service',
    areaServed: 'PK',
    availableLanguage: ['English', 'Urdu'],
  },
  sameAs: [
    'https://www.youtube.com/@Pak_the_gamerz',
    'https://github.com/Ahmad98games/GSG',
  ],
};

export const NOXIS_SOFTWARE_SCHEMA: SoftwareApplicationSchemaType = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': 'https://noxishub.app/#softwareapplication',
  name: 'Noxis Hub',
  alternateName: ['Noxis', 'Noxis ERP', 'Noxis Factory Software', 'نوکسس ہب'],
  operatingSystem: 'Windows 11, Windows 10, Web, Android',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Industrial Manufacturing ERP & POS',
  softwareVersion: '7.0 (Textile ERP / Industrial Sync Engine)',
  description:
    'Offline-first industrial ERP and high-speed POS system built for Textile & Garments, Pharmacies, Gyms, Auto Spare Parts, and Wholesale distribution.',
  url: 'https://noxishub.app',
  downloadUrl: 'https://noxishub.app/download',
  screenshot: 'https://noxishub.app/screenshot.png',
  featureList: [
    'Offline-First SQLite WAL',
    'Local Mesh Sync',
    'Karigar Wages Ledger',
    'Batch Expiry Tracking',
    'Thermal Slip POS',
  ],
  offers: {
    '@type': 'Offer',
    price: 0,
    priceCurrency: 'PKR',
    category: 'Free Trial / Contact for Pricing',
    description: 'Free Trial / Contact for Pricing',
    availability: 'https://schema.org/InStock',
    url: 'https://noxishub.app/pricing',
    priceValidUntil: '2028-12-31',
  },
  author: {
    '@type': 'Organization',
    '@id': 'https://noxishub.app/#organization',
    name: 'Omnora Labs',
    url: 'https://noxishub.app',
  },
  publisher: {
    '@type': 'Organization',
    '@id': 'https://noxishub.app/#organization',
    name: 'Omnora Labs',
    url: 'https://noxishub.app',
  },
  inLanguage: ['en', 'ur'],
  countryOfOrigin: 'PK',
  availableInCountry: ['PK', 'AE', 'SA', 'BD', 'GB', 'US'],
};

/**
 * Pure React Component rendering Google-compliant JSON-LD script tag.
 * Guaranteed zero client-side overhead & zero hydration mismatch.
 */
export function StructuredData() {
  const schemas = [OMNORA_ORGANIZATION_SCHEMA, NOXIS_SOFTWARE_SCHEMA];

  return (
    <script
      id="structured-data-omnora-noxis"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemas),
      }}
    />
  );
}

export default StructuredData;
