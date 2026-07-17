export interface CreditScore {
  partyId: string
  partyName: string
  score: number        // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  label: string
  color: string
  factors: CreditFactor[]
  recommendation: string
  maxCreditSuggested: number
  generatedAt: string
}

export interface CreditFactor {
  name: string
  impact: 'positive' | 'negative' | 'neutral'
  detail: string
  points: number
}

export async function scoreParty(
  partyId: string,
  businessId: string,
  currency: string = 'PKR'
): Promise<CreditScore> {
  const supabase = (await import('@/lib/supabase/client')).createClient()

  const fmt = (n: number) =>
    `${currency} ${n.toLocaleString('en-PK')}`

  // Fetch party's complete history
  const [
    invoicesRes,
    paymentsRes,
    promisesRes,
    partyRes,
  ] = await Promise.all([
    supabase.from('invoices')
      .select('total_amount, balance_due, due_date, created_at, status')
      .eq('business_id', businessId)
      .eq('party_id', partyId)
      .eq('status', 'posted'),

    supabase.from('payments')
      .select('amount, payment_date')
      .eq('business_id', businessId)
      .eq('party_id', partyId),

    supabase.from('payment_promises')
      .select('amount, promise_date, status')
      .eq('business_id', businessId)
      .eq('party_id', partyId),

    supabase.from('parties')
      .select('name, current_balance, created_at')
      .eq('id', partyId)
      .single(),
  ])

  const invoices = invoicesRes.data || []
  const payments = paymentsRes.data || []
  const promises = promisesRes.data || []
  const party = partyRes.data

  let score = 50 // Start at 50 (neutral)
  const factors: CreditFactor[] = []

  // ── FACTOR 1: Payment history (30 points) ──
  const paidInvoices = invoices.filter(
    (i: any) => (i.balance_due || 0) === 0
  )
  const paymentRate = invoices.length > 0
    ? paidInvoices.length / invoices.length
    : 0.5

  if (paymentRate === 1) {
    score += 30
    factors.push({
      name: 'Perfect payment history',
      impact: 'positive',
      detail: `All ${invoices.length} invoices paid in full`,
      points: 30,
    })
  } else if (paymentRate >= 0.8) {
    score += 20
    factors.push({
      name: 'Good payment history',
      impact: 'positive',
      detail: `${(paymentRate * 100).toFixed(0)}% of invoices paid`,
      points: 20,
    })
  } else if (paymentRate >= 0.5) {
    score += 5
    factors.push({
      name: 'Average payment history',
      impact: 'neutral',
      detail: `${(paymentRate * 100).toFixed(0)}% of invoices paid`,
      points: 5,
    })
  } else if (invoices.length > 0) {
    score -= 20
    factors.push({
      name: 'Poor payment history',
      impact: 'negative',
      detail: `Only ${(paymentRate * 100).toFixed(0)}% of invoices paid`,
      points: -20,
    })
  }

  // ── FACTOR 2: Payment speed (20 points) ──
  const overdueInvoices = invoices.filter(
    (i: any) => i.due_date &&
      new Date(i.due_date) < new Date() &&
      (i.balance_due || 0) > 0
  )

  if (overdueInvoices.length === 0 &&
    invoices.length > 0) {
    score += 20
    factors.push({
      name: 'No overdue payments',
      impact: 'positive',
      detail: 'Always pays on or before due date',
      points: 20,
    })
  } else if (overdueInvoices.length > 0) {
    const penalty = Math.min(
      30,
      overdueInvoices.length * 8
    )
    score -= penalty
    factors.push({
      name: `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''}`,
      impact: 'negative',
      detail: `${fmt(overdueInvoices.reduce((s: number, i: any) => s + (i.balance_due || 0), 0))} currently overdue`,
      points: -penalty,
    })
  }

  // ── FACTOR 3: Promise keeping (15 points) ──
  const keptPromises = promises.filter(
    (p: any) => p.status === 'kept'
  )
  const brokenPromises = promises.filter(
    (p: any) => p.status === 'broken'
  )

  if (keptPromises.length > 0) {
    score += 10
    factors.push({
      name: `Keeps payment commitments`,
      impact: 'positive',
      detail: `${keptPromises.length} payment promise${keptPromises.length > 1 ? 's' : ''} honoured`,
      points: 10,
    })
  }
  if (brokenPromises.length > 0) {
    score -= 15
    factors.push({
      name: 'Broken payment promises',
      impact: 'negative',
      detail: `${brokenPromises.length} promise${brokenPromises.length > 1 ? 's' : ''} not kept`,
      points: -15,
    })
  }

  // ── FACTOR 4: Relationship length (10 points) ──
  if (party?.created_at) {
    const monthsOld = Math.floor(
      (Date.now() -
        new Date(party.created_at).getTime()
      ) / (30 * 86400000)
    )
    if (monthsOld >= 12) {
      score += 10
      factors.push({
        name: 'Long-term customer',
        impact: 'positive',
        detail: `Business relationship over ${Math.floor(monthsOld / 12)} year${Math.floor(monthsOld / 12) > 1 ? 's' : ''}`,
        points: 10,
      })
    } else if (monthsOld < 2) {
      score -= 5
      factors.push({
        name: 'New customer',
        impact: 'neutral',
        detail: 'Limited payment history available',
        points: -5,
      })
    }
  }

  // ── FACTOR 5: Order volume (10 points) ──
  const totalBusiness = invoices.reduce(
    (s: number, i: any) => s + (i.total_amount || 0), 0
  )
  if (totalBusiness > 500000) {
    score += 10
    factors.push({
      name: 'High value customer',
      impact: 'positive',
      detail: `${fmt(totalBusiness)} total business`,
      points: 10,
    })
  }

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score))

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F'
  let label: string
  let color: string
  let recommendation: string

  if (score >= 85) {
    grade = 'A'; label = 'Excellent'
    color = '#10B981'
    recommendation = 'Low risk. Safe to extend generous credit terms up to 60 days.'
  } else if (score >= 70) {
    grade = 'B'; label = 'Good'
    color = '#60A5FA'
    recommendation = 'Good standing. Standard 30-day credit terms are appropriate.'
  } else if (score >= 50) {
    grade = 'C'; label = 'Fair'
    color = '#F59E0B'
    recommendation = 'Proceed with caution. Consider requiring partial advance payment.'
  } else if (score >= 30) {
    grade = 'D'; label = 'Poor'
    color = '#F97316'
    recommendation = 'High risk. Require 50% advance before processing orders.'
  } else {
    grade = 'F'; label = 'Very Poor'
    color = '#EF4444'
    recommendation = 'Do not extend credit. Cash on delivery only until payment history improves.'
  }

  // Suggest max credit based on score and history
  const avgInvoice = invoices.length > 0
    ? invoices.reduce((s: number, i: any) =>
        s + (i.total_amount || 0), 0
      ) / invoices.length
    : 0
  const maxCreditSuggested = avgInvoice * (score / 100) * 2

  return {
    partyId,
    partyName: party?.name || 'Unknown',
    score,
    grade,
    label,
    color,
    factors,
    recommendation,
    maxCreditSuggested,
    generatedAt: new Date().toISOString(),
  }
}
