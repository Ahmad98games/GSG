export interface InvoiceWhatsAppParams {
  businessName: string
  partyName: string
  partyPhone: string | null | undefined
  invoiceNumber: string
  invoiceDate: string
  dueDate: string | null
  subtotal: number
  taxAmount: number
  totalAmount: number
  balanceDue: number
  currency: string
  portalUrl: string | null
  countryCode: string
}

export function buildInvoiceMessage(
  p: InvoiceWhatsAppParams
): string {
  const fmt = (n: number) =>
    `${p.currency} ${n.toLocaleString('en-PK')}`

  const lines: string[] = [
    `*${p.businessName}*`,
    ``,
    `Assalam o Alaikum *${p.partyName}*,`,
    ``,
    `Please find your invoice details below:`,
    ``,
    `📋 *Invoice: ${p.invoiceNumber}*`,
    `📅 Date: ${p.invoiceDate}`,
    ...(p.dueDate ? [`⏰ Due: ${p.dueDate}`] : []),
    ``,
    `💰 Subtotal: ${fmt(p.subtotal)}`,
    ...(p.taxAmount > 0
      ? [`🧾 Tax: ${fmt(p.taxAmount)}`]
      : []
    ),
    `*Total: ${fmt(p.totalAmount)}*`,
    ...(p.balanceDue > 0 && p.balanceDue < p.totalAmount
      ? [`✅ Paid: ${fmt(p.totalAmount - p.balanceDue)}`]
      : []
    ),
    ...(p.balanceDue > 0
      ? [`⚠️ *Balance Due: ${fmt(p.balanceDue)}*`]
      : [`✅ *Fully Paid — Thank You!*`]
    ),
    ``,
    ...(p.portalUrl ? [
      `📱 *View your account online:*`,
      p.portalUrl,
      ``,
    ] : []),
    `_${p.businessName} · Powered by Noxis Hub_`,
  ]

  return lines.join('\n')
}

export function buildPaymentReminderMessage(params: {
  businessName: string
  partyName: string
  invoiceNumber: string
  balanceDue: number
  dueDate: string
  currency: string
  portalUrl: string | null
}): string {
  const fmt = (n: number) =>
    `${params.currency} ${n.toLocaleString('en-PK')}`

  return [
    `*${params.businessName}*`,
    ``,
    `Assalam o Alaikum *${params.partyName}*,`,
    ``,
    `This is a friendly reminder that payment`,
    `is due for invoice *${params.invoiceNumber}*:`,
    ``,
    `💰 *Amount Due: ${fmt(params.balanceDue)}*`,
    `📅 Due Date: ${params.dueDate}`,
    ``,
    ...(params.portalUrl ? [
      `View full details:`,
      params.portalUrl,
      ``,
    ] : []),
    `Please contact us if you have any queries.`,
    ``,
    `_${params.businessName} · Noxis Hub_`,
  ].join('\n')
}

export function openWhatsApp(
  phone: string | null | undefined,
  message: string,
  countryCode: string = 'PK'
): boolean {
  if (!phone?.trim()) return false

  let digits = phone.replace(/\D/g, '')

  if (countryCode === 'PK') {
    if (digits.startsWith('92')) {
      // already correct
    } else if (digits.startsWith('0')) {
      digits = '92' + digits.slice(1)
    } else if (digits.length === 10) {
      digits = '92' + digits
    }
  } else if (countryCode === 'AE') {
    if (!digits.startsWith('971')) {
      digits = '971' + (
        digits.startsWith('0')
          ? digits.slice(1)
          : digits
      )
    }
  }

  const url = `https://wa.me/${digits}?text=${
    encodeURIComponent(message)
  }`

  window.open(url, '_blank')
  return true
}
