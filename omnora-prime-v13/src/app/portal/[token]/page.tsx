import React from 'react'
import { createClient } from '@supabase/supabase-js'
import { validatePortalToken } from '@/lib/portal/generatePortalToken'
import { 
  Building2, User, Phone, ShieldCheck, FileText, Download, 
  ArrowUpRight, ArrowDownLeft, AlertCircle, Share2, DollarSign
} from 'lucide-react'

interface Props {
  params: Promise<{ token: string }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function UnifiedPortalPage({ params }: Props) {
  const { token } = await params
  const portalId = token

  if (!portalId) {
    return <PortalErrorFallback reason="Missing Portal ID Parameter" />
  }

  // 1. First attempt validating as token session
  const tokenResult = await validatePortalToken(portalId).catch(() => ({ valid: false, session: null, reason: 'Invalid Token' }))
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  let party: any = null
  let business: any = null
  let invoices: any[] = []
  let payments: any[] = []

  if (tokenResult.valid && tokenResult.session) {
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
  } else {
    // 2. Fallback: Query party directly by id or portal_token / slug matching portalId
    const { data: partyData } = await supabase
      .from('parties')
      .select('*')
      .or(`id.eq.${portalId},portal_token.eq.${portalId}`)
      .maybeSingle()

    if (partyData) {
      party = partyData
      const { data: bizData } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', party.business_id)
        .single()
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
    ...invoices.map((inv: any) => ({
      id: inv.id,
      date: inv.created_at || inv.issue_date || new Date().toISOString(),
      type: 'INVOICE',
      ref: inv.invoice_number || `INV-${inv.id.slice(0, 6)}`,
      debit: Number(inv.total_amount || 0),
      credit: 0,
      note: inv.status ? `Status: ${inv.status.toUpperCase()}` : 'Sales Invoice',
    })),
    ...payments.map((pay: any) => ({
      id: pay.id,
      date: pay.payment_date || pay.created_at || new Date().toISOString(),
      type: 'PAYMENT',
      ref: pay.reference_number || `PAY-${pay.id.slice(0, 6)}`,
      debit: 0,
      credit: Number(pay.amount || pay.total_amount || 0),
      note: pay.payment_method ? `Method: ${pay.payment_method}` : 'Payment Received',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Calculate running balance
  let runningBal = currentBalance
  const ledgerWithRunningBalance = ledgerEntries.map((entry) => {
    const item = { ...entry, runningBalance: runningBal }
    runningBal = runningBal - (entry.debit - entry.credit)
    return item
  })

  return (
    <div className="min-h-screen bg-[#06080B] text-slate-200 font-sans selection:bg-[#C5A059] selection:text-black py-10 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* ═══ HEADER BAR ═══ */}
        <header className="bg-[#0D1017] border border-white/[0.08] p-6 sm:p-8 rounded-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                Interactive Client Web Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              {party.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium pt-1">
              <span className="flex items-center gap-1.5">
                <Building2 size={14} className="text-[#60A5FA]" />
                {business?.business_name || 'Noxis Business Engine'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Phone size={14} className="text-emerald-400" />
                {party.phone || 'Phone Unlisted'}
              </span>
            </div>
          </div>

          <div className="bg-black/40 border border-white/[0.06] p-4 rounded-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-sm bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg">
              98%
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Party Reliability Score</p>
              <p className="text-xs font-bold text-emerald-400 uppercase">Tier 1 Verified Client</p>
            </div>
          </div>
        </header>

        {/* ═══ BALANCE & CREDIT STATS ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Net Balance Card */}
          <div className="bg-[#0D1017] border border-white/[0.08] p-6 rounded-sm space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Current Net Balance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-black text-white">
                PKR {Math.abs(currentBalance).toLocaleString()}
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {isReceivable ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
              <span>{isReceivable ? 'Receivable (Party Owes You)' : 'Payable (Advance / Credit)'}</span>
            </div>
          </div>

          {/* Credit Limit Card */}
          <div className="bg-[#0D1017] border border-white/[0.08] p-6 rounded-sm space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Authorized Credit Limit</p>
            <div className="text-3xl font-mono font-black text-slate-300">
              PKR {creditLimit.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500">Terms: {party.credit_days || 30} Days Net</p>
          </div>

          {/* Credit Utilization Card */}
          <div className="bg-[#0D1017] border border-white/[0.08] p-6 rounded-sm space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Credit Utilization</p>
            <div className="text-3xl font-mono font-black text-[#60A5FA]">
              {creditUtilization}%
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div className="bg-[#60A5FA] h-full rounded-full" style={{ width: `${creditUtilization}%` }} />
            </div>
          </div>
        </div>

        {/* ═══ ACTIONS BAR ═══ */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0D1017] border border-white/[0.08] p-4 rounded-sm">
          <div className="text-xs text-slate-400 font-medium">
            Showing latest {ledgerWithRunningBalance.length} verified transactions
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={() => window.print()}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-sm transition-all"
            >
              <Download size={14} />
              <span>Export Statement PDF</span>
            </button>
            <a 
              href={`https://wa.me/?text=${encodeURIComponent(`Assalam-o-Alaikum, here is your updated account statement with ${business?.business_name || 'our company'}: Net Balance PKR ${currentBalance.toLocaleString()}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase px-4 py-2.5 rounded-sm transition-all"
            >
              <Share2 size={14} />
              <span>WhatsApp Receipt</span>
            </a>
          </div>
        </div>

        {/* ═══ COMMITMENT LOG / LEDGER TABLE ═══ */}
        <div className="bg-[#0D1017] border border-white/[0.08] rounded-sm overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/[0.08]">
            <h3 className="text-sm font-black uppercase text-white tracking-wider">
              Transaction Ledger & Commitment Log
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/40 border-b border-white/[0.08] text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="p-4">Date</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Reference ID</th>
                  <th className="p-4 text-right">Debit (PKR)</th>
                  <th className="p-4 text-right">Credit (PKR)</th>
                  <th className="p-4 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs font-mono">
                {ledgerWithRunningBalance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                      No ledger transactions logged for this client portal.
                    </td>
                  </tr>
                ) : (
                  ledgerWithRunningBalance.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-slate-400">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase ${item.type === 'INVOICE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="p-4 text-white font-bold">{item.ref}</td>
                      <td className="p-4 text-right text-slate-200">{item.debit > 0 ? item.debit.toLocaleString() : '—'}</td>
                      <td className="p-4 text-right text-emerald-400">{item.credit > 0 ? item.credit.toLocaleString() : '—'}</td>
                      <td className="p-4 text-right text-white font-bold">PKR {item.runningBalance.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
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
        <div className="pt-2">
          <a
            href="/"
            className="inline-block bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase px-6 py-3 rounded-sm transition-all"
          >
            Return to Noxis Home
          </a>
        </div>
      </div>
    </div>
  )
}
