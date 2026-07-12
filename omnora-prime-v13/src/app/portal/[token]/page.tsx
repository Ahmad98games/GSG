import { notFound } from 'next/navigation'
import { validatePortalToken } from '@/lib/portal/generatePortalToken'
import { createClient } from '@supabase/supabase-js'
import { PortalView } from './PortalView'

interface Props {
  params: Promise<{ token: string }>
}

// Always dynamic — never cached
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PortalPage({ params }: Props) {
  const { token } = await params
  const { valid, session, reason } = await validatePortalToken(token)

  if (!valid) {
    return (
      <PortalError
        reason={reason || 'unknown'}
        token={token}
      />
    )
  }

  // Fetch portal data server-side
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const businessId = session.business_id
  const partyId = session.party_id

  // Parallel fetch all portal data
  const [
    invoicesRes,
    dispatchRes,
    balanceRes,
    paymentsRes,
    promisesRes,
  ] = await Promise.allSettled([
    supabase
      .from('invoices')
      .select(`
        id, invoice_number, total_amount,
        paid_amount, balance_due, status,
        created_at, due_date
      `)
      .eq('business_id', businessId)
      .eq('party_id', partyId)
      .order('created_at', { ascending: false })
      .limit(20),

    supabase
      .from('dispatch_orders')
      .select(`
        id, status, created_at,
        estimated_delivery, actual_delivery,
        total_amount, notes
      `)
      .eq('business_id', businessId)
      .eq('party_id', partyId)
      .order('created_at', { ascending: false })
      .limit(10),

    supabase
      .from('parties')
      .select('current_balance, name, phone')
      .eq('id', partyId)
      .single(),

    supabase
      .from('payments')
      .select('amount, payment_date, payment_method, notes')
      .eq('business_id', businessId)
      .eq('party_id', partyId)
      .order('payment_date', { ascending: false })
      .limit(10),

    supabase
      .from('payment_promises')
      .select('amount, promise_date, status')
      .eq('business_id', businessId)
      .eq('party_id', partyId)
      .eq('status', 'pending')
      .order('promise_date')
      .limit(5),
  ])

  const portalData = {
    session,
    party: balanceRes.status === 'fulfilled' ? balanceRes.value.data : null,
    invoices: invoicesRes.status === 'fulfilled' ? invoicesRes.value.data || [] : [],
    dispatch: dispatchRes.status === 'fulfilled' ? dispatchRes.value.data || [] : [],
    payments: paymentsRes.status === 'fulfilled' ? paymentsRes.value.data || [] : [],
    promises: promisesRes.status === 'fulfilled' ? promisesRes.value.data || [] : [],
  }

  return <PortalView data={portalData} />
}

function PortalError({
  reason, token
}: {
  reason: string
  token: string
}) {
  const messages: Record<string, string> = {
    not_found: 'This portal link is not valid.',
    revoked: 'This portal link has been deactivated by the business.',
    expired: 'This portal link has expired. Contact the business for a new link.',
    unknown: 'This portal link could not be verified.',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060708',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        maxWidth: 380,
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 48,
          marginBottom: 20,
        }}>
          🔒
        </div>
        <h1 style={{
          color: '#FFFFFF',
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 12,
        }}>
          Portal Unavailable
        </h1>
        <p style={{
          color: '#6B7280',
          fontSize: 14,
          lineHeight: 1.6,
          marginBottom: 24,
        }}>
          {messages[reason]}
        </p>
        <a
          href="https://noxishub.app"
          style={{
            color: '#60A5FA',
            fontSize: 13,
          }}
        >
          ← Back to Noxis
        </a>
      </div>
    </div>
  )
}
