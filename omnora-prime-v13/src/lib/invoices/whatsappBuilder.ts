import { formatCurrency }
  from '@/lib/i18n/currencies'
import type { POSCart } from '@/lib/pos/posEngine'

export function buildWhatsAppInvoiceMessage(
  invoice: {
    invoice_number: string
    invoice_date: string
    total_amount: number
    amount_paid: number
    balance_due: number
    status: string
  },
  cart: POSCart,
  profile: any
): string {
  const currency =
    profile?.base_currency || 'PKR'
  const businessName =
    profile?.business_name || 'Our Store'
  const businessPhone =
    profile?.phone || ''

  const date = new Date(
    invoice.invoice_date
  ).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  let msg = `*${businessName}*\n`
  msg += `📋 *Invoice: ${
    invoice.invoice_number
  }*\n`
  msg += `📅 Date: ${date}\n`

  if (cart.partyName) {
    msg += `\nDear *${cart.partyName}*,\n`
    msg += `Thank you for your purchase.\n`
  }

  msg += `\n*━━━ ORDER DETAILS ━━━*\n`

  cart.items.forEach((item, i) => {
    msg += `\n${i + 1}. *${item.name}*\n`
    msg += `   ${item.quantity} ${item.unit} × ${
      formatCurrency(item.unitPrice, currency)
    }`
    if (item.discountAmount > 0) {
      msg += ` (-${
        formatCurrency(item.discountAmount, currency)
      } disc)`
    }
    msg += `\n   = *${
      formatCurrency(item.lineTotal, currency)
    }*`
  })

  msg += `\n\n*━━━━━━━━━━━━━━━━━━*\n`

  if (cart.discountAmount > 0) {
    msg += `Subtotal: ${
      formatCurrency(cart.subtotal, currency)
    }\n`
    msg += `Discount: -${
      formatCurrency(cart.discountAmount, currency)
    }\n`
  }

  if (cart.taxAmount > 0) {
    msg += `Tax: +${
      formatCurrency(cart.taxAmount, currency)
    }\n`
  }

  msg += `*TOTAL: ${
    formatCurrency(
      invoice.total_amount, currency
    )
  }*\n`

  if (invoice.amount_paid > 0 &&
    invoice.amount_paid < invoice.total_amount) {
    msg += `\n*PAID: ${
      formatCurrency(invoice.amount_paid, currency)
    }*\n`
    msg += `⚠️ *BALANCE DUE: ${
      formatCurrency(invoice.balance_due, currency)
    }*\n`
  } else if (
    invoice.status === 'paid' ||
    invoice.amount_paid >=
      invoice.total_amount
  ) {
    msg += `\n✅ *FULLY PAID*\n`
  }

  // If party has existing balance beyond
  // this invoice
  if (cart.partyBalance > 0) {
    msg += `\n*Previous Balance: ${
      formatCurrency(cart.partyBalance, currency)
    }*\n`
    msg += `*Total Outstanding: ${
      formatCurrency(
        cart.partyBalance +
          invoice.balance_due,
        currency
      )
    }*\n`
  }

  // Payment details if balance due
  if (invoice.balance_due > 0 &&
    profile?.bank_name) {
    msg += `\n*━━ PAYMENT DETAILS ━━*\n`
    msg += `Bank: ${profile.bank_name}\n`
    if (profile.bank_account_number) {
      msg += `A/C: \`${
        profile.bank_account_number
      }\`\n`
    }
    if (profile.bank_account_title) {
      msg += `Title: ${
        profile.bank_account_title
      }\n`
    }
  }

  msg += `\n${businessPhone}\n`
  msg += `\n_Thank you for your business!_\n`
  msg += `_${businessName}_`

  return msg
}

// Overdue balance reminder message
export function buildPaymentReminder(
  party: {
    name: string
    phone: string
    current_balance: number
  },
  overdueInvoices: {
    invoice_number: string
    invoice_date: string
    balance_due: number
    days_overdue: number
  }[],
  profile: any
): string {
  const currency =
    profile?.base_currency || 'PKR'
  const businessName =
    profile?.business_name || 'Our Store'

  let msg =
    `*Payment Reminder*\n` +
    `${businessName}\n\n` +
    `Dear *${party.name}*,\n\n` +
    `This is a gentle reminder that ` +
    `the following amounts are ` +
    `outstanding on your account:\n\n`

  overdueInvoices.forEach(inv => {
    msg += `📄 ${inv.invoice_number}: ` +
      `*${formatCurrency(
        inv.balance_due, currency
      )}*`
    if (inv.days_overdue > 0) {
      msg += ` _(${inv.days_overdue} days overdue)_`
    }
    msg += `\n`
  })

  msg +=
    `\n*Total Outstanding: ${
      formatCurrency(party.current_balance, currency)
    }*\n\n` +
    `Please arrange payment at your ` +
    `earliest convenience.\n\n` +
    `For queries: ${
      profile?.phone || ''
    }\n\n` +
    `_${businessName}_`

  return msg
}
