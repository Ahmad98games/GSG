import { Decimal } from 'decimal.js';
import { formatDistanceToNow, format as formatDateFns } from 'date-fns';
import { getCurrencySymbol } from '@/lib/constants/currencies';

export function formatAmount(
  amount: Decimal | number | string,
  options: {
    currency?: string;
    region?: 'south_asian' | 'international';
    compact?: boolean;
    showSymbol?: boolean;
  } = {}
): string {
  const { 
    currency = 'PKR', 
    region = 'south_asian', 
    compact = false, 
    showSymbol = true 
  } = options;

  let val: Decimal;
  try {
    val = new Decimal(amount);
  } catch (_) {
    val = new Decimal(0);
  }

  const symbol = getCurrencySymbol(currency);

  if (region === 'south_asian') {
    if (compact) {
      if (val.gte(10000000)) {
        return `${showSymbol ? symbol + ' ' : ''}${val.dividedBy(10000000).toFixed(2)} Crore`;
      }
      if (val.gte(100000)) {
        return `${showSymbol ? symbol + ' ' : ''}${val.dividedBy(100000).toFixed(2)} Lakh`;
      }
    }

    const parts = val.toFixed(2).split('.');
    const x = parts[0];
    const afterPoint = parts.length > 1 ? '.' + parts[1] : '';
    let lastThree = x.substring(x.length - 3);
    const otherNumbers = x.substring(0, x.length - 3);
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    const res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree + afterPoint;
    return `${showSymbol ? symbol + ' ' : ''}${res}`;
  } else {
    // International
    if (compact) {
      if (val.gte(1000000000)) {
        return `${showSymbol ? symbol : ''}${val.dividedBy(1000000000).toFixed(1)}B`;
      }
      if (val.gte(1000000)) {
        return `${showSymbol ? symbol : ''}${val.dividedBy(1000000).toFixed(1)}M`;
      }
      if (val.gte(1000)) {
        return `${showSymbol ? symbol : ''}${val.dividedBy(1000).toFixed(1)}K`;
      }
    }

    const parts = val.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${showSymbol ? symbol : ''}${parts.join('.')}`;
  }
}

export function formatQuantity(
  qty: Decimal | number,
  unit: string,
  region: 'south_asian' | 'international'
): string {
  const value = typeof qty === 'number' ? qty : qty.toNumber();
  
  if (region === 'south_asian') {
    const saUnits: Record<string, string> = {
      'kg': 'کلو / kg',
      'maund': 'من',
      'thaan': 'تھان',
      'meter': 'میٹر / meter',
      'dozen': 'درجن / dozen',
      'pcs': 'عدد / pcs',
    };
    const label = saUnits[unit.toLowerCase()] || unit;
    return `${value} ${label}`;
  }

  return `${value} ${unit}`;
}

export function formatDate(
  date: Date | string,
  options: {
    region?: 'south_asian' | 'international';
    format?: 'short' | 'long' | 'relative';
  } = {}
): string {
  const { region = 'south_asian', format = 'short' } = options;
  const d = new Date(date);

  if (format === 'relative') {
    const relative = formatDistanceToNow(d, { addSuffix: true });
    if (region === 'south_asian') {
      return relative
        .replace('about ', '')
        .replace('less than a minute ago', 'ابھی')
        .replace(' minute ago', ' منٹ پہلے')
        .replace(' minutes ago', ' منٹ پہلے')
        .replace(' hour ago', ' گھنٹہ پہلے')
        .replace(' hours ago', ' گھنٹے پہلے')
        .replace(' day ago', ' دن پہلے')
        .replace(' days ago', ' دن پہلے')
        .replace(' month ago', ' مہینہ پہلے')
        .replace(' months ago', ' مہینے پہلے')
        .replace(' year ago', ' سال پہلے')
        .replace(' years ago', ' سال پہلے')
        .replace('ago', 'پہلے');
    }
    return relative;
  }

  const pattern = region === 'south_asian' ? 'dd/MM/yyyy' : 'MM/dd/yyyy';
  return formatDateFns(d, pattern);
}

export function formatPaymentTerms(
  days: number,
  region: 'south_asian' | 'international'
): string {
  if (region === 'south_asian') {
    if (days === 0) return 'نقد';
    if (days === 7) return '7 دن';
    if (days === 30) return 'ایک مہینہ';
    return `${days} دن`;
  }

  if (days === 0) return 'Due on receipt';
  if ([7, 30, 45, 60].includes(days)) return `Net ${days}`;
  return `${days} days`;
}
