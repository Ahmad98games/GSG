import React from 'react'
import { createClient } from '@supabase/supabase-js'
import { validatePortalToken } from '@/lib/portal/generatePortalToken'
import { AlertCircle } from 'lucide-react'
import { UnifiedPortalClientView } from './UnifiedPortalClientView'

interface Props {
  params: Promise<{ token: string }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  try {
    return createClient(url, key)
  } catch {
    return null
  }
}

export default async function UnifiedPortalPage({ params }: Props) {
  try {
    const { token } = await params
    const rawToken = decodeURIComponent(token || '').trim()

    if (!rawToken) {
      return <PortalErrorFallback reason="Missing Portal ID Parameter" />
    }

    // Extract base token if slug/party name is appended (e.g. "3d15-1d91-c756 _gold she Garments" -> "3d15-1d91-c756")
    const match = rawToken.match(/^([a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4})/);
    const baseToken = match ? match[1] : rawToken.split(/[\s_]/)[0];

    // Attempt token validation with baseToken first, then rawToken
    let tokenResult = await validatePortalToken(baseToken).catch(() => ({ valid: false, session: null, reason: 'Invalid Token' }))
    if (!tokenResult.valid) {
      tokenResult = await validatePortalToken(rawToken).catch(() => ({ valid: false, session: null, reason: 'Invalid Token' }))
    }

    const supabase = getSupabaseClient()

    let party: any = null
    let business: any = null
    let invoices: any[] = []
    let payments: any[] = []

    if (tokenResult.valid && tokenResult.session && supabase) {
      const businessId = tokenResult.session.business_id
      const partyId = tokenResult.session.party_id

      const [partyRes, bizRes, invRes, payRes] = await Promise.allSettled([
        supabase.from('parties').select('*').eq('id', partyId).single(),
        supabase.from('business_profiles').select('*').eq('id', businessId).single(),
        supabase.from('invoices').select('*').eq('party_id', partyId).order('created_at', { ascending: false }).limit(20),
        supabase.from('payments').select('*').eq('party_id', partyId).order('payment_date', { ascending: false }).limit(20),
      ])

      if (partyRes.status === 'fulfilled') party = partyRes.value.data
      if (bizRes.status === 'fulfilled') business = bizRes.value.data
      if (invRes.status === 'fulfilled') invoices = invRes.value.data || []
      if (payRes.status === 'fulfilled') payments = payRes.value.data || []

      if (!party && tokenResult.session.party_name) {
        party = {
          id: partyId || 'party-id',
          name: tokenResult.session.party_name,
          phone: null,
          current_balance: 0,
          credit_limit: 0,
        }
      }
    } else if (supabase) {
      // 2. Fallback: Query party directly by baseToken or rawToken safely using .eq()
      const { data: p1 } = await supabase.from('parties').select('*').eq('portal_token', baseToken).maybeSingle()
      let partyData = p1

      if (!partyData) {
        const { data: p2 } = await supabase.from('parties').select('*').eq('id', baseToken).maybeSingle()
        if (p2) partyData = p2
      }

      if (!partyData) {
        const { data: p3 } = await supabase.from('parties').select('*').eq('portal_token', rawToken).maybeSingle()
        if (p3) partyData = p3
      }

      if (!partyData) {
        const { data: p4 } = await supabase.from('parties').select('*').eq('id', rawToken).maybeSingle()
        if (p4) partyData = p4
      }

      if (partyData) {
        party = partyData
        const { data: bizData } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('id', party.business_id)
          .maybeSingle()
        business = bizData

        const [invRes, payRes] = await Promise.allSettled([
          supabase.from('invoices').select('*').eq('party_id', party.id).order('created_at', { ascending: false }).limit(20),
          supabase.from('payments').select('*').eq('party_id', party.id).order('payment_date', { ascending: false }).limit(20),
        ])
        if (invRes.status === 'fulfilled') invoices = invRes.value.data || []
        if (payRes.status === 'fulfilled') payments = payRes.value.data || []
      }
    }

    if (!party) {
      return <PortalErrorFallback reason="Invalid or Expired Client Portal Link." />
    }

    const currentBalance = Number(party.current_balance || 0)
    const creditLimit = Number(party.credit_limit || 0)
    const creditUtilization = creditLimit > 0 ? Math.min(100, Math.round((Math.abs(currentBalance) / creditLimit) * 100)) : 0
    const isReceivable = currentBalance >= 0

    // Combine invoices and payments into a ledger timeline
    const ledgerEntries = [
      ...invoices.map((inv: any) => {
        const amount = Number(inv.total ?? inv.total_amount ?? inv.subtotal ?? 0);
        return {
          id: String(inv.id),
          date: String(inv.created_at || inv.issue_date || new Date().toISOString()),
          type: 'INVOICE' as const,
          ref: String(inv.invoice_no || inv.invoice_number || `INV-${String(inv.id).slice(0, 6)}`),
          debit: amount,
          credit: 0,
          note: inv.status ? `Status: ${inv.status.toUpperCase()}` : 'Sales Invoice',
        };
      }),
      ...payments.map((pay: any) => {
        const amount = Number(pay.amount ?? pay.total_amount ?? pay.total ?? 0);
        return {
          id: String(pay.id),
          date: String(pay.payment_date || pay.created_at || new Date().toISOString()),
          type: 'PAYMENT' as const,
          ref: String(pay.reference_no || pay.reference_number || `PMT-${String(pay.id).slice(0, 6)}`),
          debit: 0,
          credit: amount,
          note: pay.payment_method ? `Method: ${pay.payment_method}` : (pay.method ? `Method: ${pay.method}` : 'Payment Received'),
        };
      }),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Calculate running balance
    let runningBal = currentBalance
    const ledgerWithRunningBalance = ledgerEntries.map((entry) => {
      const item = { ...entry, runningBalance: runningBal }
      runningBal = runningBal - (entry.debit - entry.credit)
      return item
    })

    return (
      <UnifiedPortalClientView
        party={{
          id: String(party.id),
          name: String(party.name || 'Client'),
          phone: party.phone ? String(party.phone) : null,
          address: party.address ? String(party.address) : null,
          current_balance: currentBalance,
          credit_limit: creditLimit,
          credit_days: party.credit_days ? Number(party.credit_days) : 30,
        }}
        business={business ? { 
          business_name: String(business.business_name || ''),
          phone: business.phone ? String(business.phone) : null,
          address: business.address ? String(business.address) : null,
        } : null}
        currentBalance={currentBalance}
        creditLimit={creditLimit}
        creditUtilization={creditUtilization}
        isReceivable={isReceivable}
        ledgerWithRunningBalance={ledgerWithRunningBalance}
      />
    )
  } catch (err: any) {
    console.error('[UnifiedPortalPage] Render error:', err)
    return <PortalErrorFallback reason="An unexpected error occurred while loading this portal link. Please try again." />
  }
}

function PortalErrorFallback({ reason }: { reason: string }) {
  return (
    <div className="min-h-screen bg-[#040608] flex items-center justify-center p-6 text-slate-200">
      <div className="bg-[#0D1017] border border-red-500/30 p-8 rounded-sm max-w-md w-full text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-lg font-black text-white uppercase tracking-wider">Access Error</h2>
        <p className="text-xs text-slate-400 leading-relaxed font-medium">
          {reason}
        </p>
        <div className="pt-2 flex items-center justify-center">
          
          <a
            href="/"
            
            className="w-full sm:w-auto inline-block bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase px-6 py-3 rounded-sm transition-all"

          >

            Return to Home
          </a>
        </div>
      </div>
    </div>
  )
}

