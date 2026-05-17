import { format as dateFnsFormat } from 'date-fns';
import { formatCurrency as globalFormatCurrency, CurrencyCode } from '@/lib/currency/currencyEngine';

export type Locale = 'en' | 'ur' | 'fr' | 'ar' | 'zh' | 'tr' | 'hi' | 'fa' | 'es' | 'de';

export const locales: Locale[] = ['en', 'ur', 'fr', 'ar', 'zh', 'tr', 'hi', 'fa', 'es', 'de'];

export const RTL_LOCALES: Locale[] = ['ur', 'ar', 'fa'];

export function isRTL(locale: string): boolean {
  return RTL_LOCALES.includes(locale as Locale);
}

/**
 * Format currency using the unified currency engine
 */
export function formatCurrency(amount: number | string, currency?: string): string {
  const code = (currency as CurrencyCode) || 'PKR';
  return globalFormatCurrency(amount, code);
}

/**
 * Format numbers with locale-appropriate separators
 */
export function formatNumber(value: number | string, locale: string = 'en'): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (locale === 'hi') {
    return new Intl.NumberFormat('en-IN').format(num);
  }

  return new Intl.NumberFormat(locale === 'ur' ? 'en-US' : locale).format(num);
}

/**
 * Format dates with Gregorian and optional Hijri
 */
export function formatDate(date: Date | string, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const gregorian = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d);

  if (locale === 'ar' || locale === 'fa') {
    const hijri = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-ca-islamic-uma' : 'fa-IR-u-ca-persian', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(d);
    return `${gregorian} (${hijri})`;
  }

  return gregorian;
}

/**
 * Get Font Family based on locale
 */
export function getFontFamily(locale: string): string {
  switch (locale) {
    case 'ur':
    case 'ar':
    case 'fa':
      return '"Noto Naskh Arabic", sans-serif';
    case 'hi':
      return '"Noto Sans Devanagari", sans-serif';
    case 'zh':
      return '"Noto Sans SC", sans-serif';
    default:
      return 'Inter, sans-serif';
  }
}
