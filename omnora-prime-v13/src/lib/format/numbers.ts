const PKR_FORMATTER = new Intl.NumberFormat('en-PK', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const AED_FORMATTER = new Intl.NumberFormat('en-AE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatAmount(
  amount: number,
  currency: string = 'PKR'
): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '−' : ''

  const formatter = currency === 'AED' ? AED_FORMATTER : PKR_FORMATTER

  return `${sign}${currency} ${formatter.format(abs)}`
}

// Large number abbreviation for cards:
export function formatAmountShort(amount: number): string {
  if (amount >= 10_000_000) return `${(amount / 10_000_000).toFixed(1)}Cr`
  if (amount >= 100_000) return `${(amount / 100_000).toFixed(1)}L`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`
  return amount.toString()
}

// Relative time:
export function formatTimeAgo(date: Date | string): string {
  const d = new Date(date)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
  })
}
