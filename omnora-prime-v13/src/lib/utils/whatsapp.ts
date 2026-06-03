/**
 * Noxis WhatsApp URL Builder
 *
 * Centralises all wa.me link generation so every button in the app
 * uses the same number-normalisation logic.
 *
 * Supported input formats (Pakistani default):
 *   03001234567   → 923001234567
 *   3001234567    → 923001234567
 *   +923001234567 → 923001234567
 *   923001234567  → 923001234567
 *   00923001234567 → 923001234567
 *
 * For other countries pass the relevant countryCode ('AE', 'IN', etc.).
 */

/** IANA country code → phone country code */
const COUNTRY_CODES: Record<string, string> = {
  PK: '92',
  AE: '971',
  BD: '880',
  TR: '90',
  GB: '44',
  US: '1',
  CA: '1',
  SA: '966',
  IN: '91',
  OM: '968',
  QA: '974',
  KW: '965',
  BH: '973',
}

/**
 * Normalise a phone number string to the E.164 digit string
 * (country code + number, no +, no spaces) suitable for wa.me.
 */
export function normalisePhone(
  phone: string,
  countryCode = 'PK',
): string {
  // Strip everything that is not a digit
  let digits = phone.replace(/\D/g, '')

  // Remove double-zero prefix (00 92... → 92...)
  if (digits.startsWith('00')) {
    digits = digits.slice(2)
  }

  const cc = COUNTRY_CODES[countryCode] ?? '92'

  if (digits.startsWith(cc)) {
    // Already has the correct country code — use as-is
    return digits
  }

  // Remove a leading 0 (local format)
  if (digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  return cc + digits
}

/**
 * Build a wa.me deep-link.
 *
 * @param phone       Raw phone string from the database (any format)
 * @param message     Optional pre-filled message
 * @param countryCode IANA country code used for number normalisation (default 'PK')
 * @returns           Full https://wa.me/... URL
 */
export function buildWhatsAppLink(
  phone: string | null | undefined,
  message = '',
  countryCode = 'PK',
): string {
  const SUPPORT = '923334355475' // Omnora Labs support fallback

  const number = phone?.trim()
    ? normalisePhone(phone.trim(), countryCode)
    : SUPPORT

  const qs = message
    ? `?text=${encodeURIComponent(message)}`
    : ''

  return `https://wa.me/${number}${qs}`
}

/**
 * Open WhatsApp directly in a new tab.
 *
 * @param phone       Owner / party / karigar phone number
 * @param message     Optional pre-filled message
 * @param countryCode IANA country code (default 'PK')
 */
export function openWhatsApp(
  phone: string | null | undefined,
  message = '',
  countryCode = 'PK',
): void {
  window.open(
    buildWhatsAppLink(phone, message, countryCode),
    '_blank',
    'noopener,noreferrer',
  )
}

/**
 * Pre-built message templates used across the app.
 * These replace ad-hoc template strings scattered in individual pages.
 */
export const WA_TEMPLATES = {
  dailySummary: (opts: {
    businessName: string
    currency: string
    revenue: string
    activeOrders: number
    date: string
  }) =>
    `*Noxis Daily Summary — ${opts.businessName}*\n\n📅 ${opts.date}\n\n💰 *Revenue Today:* ${opts.currency} ${opts.revenue}\n📦 *Active Orders:* ${opts.activeOrders}\n\n_Sent via Noxis Hub | Omnora Labs_`,

  invoiceSend: (opts: {
    businessName: string
    invoiceNumber: string
    amount: string
    currency: string
    dueDate: string
  }) =>
    `*Invoice from ${opts.businessName}*\n\nInvoice #${opts.invoiceNumber}\nAmount: ${opts.currency} ${opts.amount}\nDue: ${opts.dueDate}\n\n_Please confirm receipt._\n\n_Sent via Noxis Hub_`,

  paymentReminder: (opts: {
    businessName: string
    partyName: string
    balance: string
    currency: string
  }) =>
    `Assalam o Alaikum ${opts.partyName},\n\nThis is a reminder from *${opts.businessName}*.\n\nYour outstanding balance is:\n*${opts.currency} ${opts.balance}*\n\nPlease arrange payment at your earliest.\n\n_Noxis Hub | ${opts.businessName}_`,

  payslip: (opts: {
    businessName: string
    karigarName: string
    netSalary: string
    currency: string
  }) =>
    `Assalam o Alaikum ${opts.karigarName},\n\nYour payslip from *${opts.businessName}* is ready.\n\nNet Salary: *${opts.currency} ${opts.netSalary}*\n\n_Noxis Hub_`,

  peshgiReminder: (opts: {
    businessName: string
    karigarName: string
    balance: string
    currency: string
  }) =>
    `Assalam o Alaikum ${opts.karigarName},\n\nThis is a reminder from *${opts.businessName}*.\n\nYour peshgi balance is: *${opts.currency} ${opts.balance}*\n\n_Noxis Hub_`,
}
