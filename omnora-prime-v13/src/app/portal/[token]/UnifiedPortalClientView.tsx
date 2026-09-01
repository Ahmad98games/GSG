'use client'

import React, { useState } from 'react'
import { 
  Building2, Phone, Download, 
  ArrowUpRight, ArrowDownLeft, Share2, Loader2 
} from 'lucide-react'

interface PartyData {
  id: string
  name: string
  phone?: string | null
  address?: string | null
  current_balance?: number | null
  credit_limit?: number | null
  credit_days?: number | null
}

interface BusinessData {
  business_name?: string | null
  phone?: string | null
  address?: string | null
}

interface LedgerItem {
  id: string
  date: string
  type: 'INVOICE' | 'PAYMENT'
  ref: string
  debit: number
  credit: number
  note: string
  runningBalance: number
}

interface Props {
  party: PartyData
  business: BusinessData | null
  currentBalance: number
  creditLimit: number
  creditUtilization: number
  isReceivable: boolean
  ledgerWithRunningBalance: LedgerItem[]
}

export function UnifiedPortalClientView({
  party,
  business,
  currentBalance,
  creditLimit,
  creditUtilization,
  isReceivable,
  ledgerWithRunningBalance,
}: Props) {
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const businessName = business?.business_name || 'Noxis Business Engine'
  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
  const cleanPhone = (party.phone || '').replace(/\D/g, '').replace(/^0/, '92')
  const balanceVal = Math.abs(currentBalance).toLocaleString('en-PK')
  const balanceStatus = isReceivable ? 'Payable (Amount Due)' : currentBalance < 0 ? 'Advance (Credit)' : 'Settled / Nil'

  const waMsg = 
    `*OFFICIAL ACCOUNT STATEMENT & LEDGER*\n` +
    `🏛️ *Business*: ${businessName}\n` +
    `👤 *Client*: ${party.name}\n` +
    (party.phone ? `📞 *Phone*: ${party.phone}\n` : '') +
    `📅 *Statement Date*: ${new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}\n` +
    `──────────────────────────\n` +
    `📊 *Financial Standing*:\n` +
    `• *Net Balance*: PKR ${balanceVal} (${balanceStatus})\n` +
    `• *Credit Limit*: PKR ${creditLimit.toLocaleString('en-PK')}\n` +
    `• *Payment Terms*: ${party.credit_days || 30} Days Net\n` +
    `• *Verified Transactions*: ${ledgerWithRunningBalance.length} Records\n\n` +
    `🔗 *View Live Portal & Invoices*:\n` +
    `${currentUrl}\n\n` +
    `_(Review itemized invoices, payment history, and download official PDF statements anytime.)_\n` +
    `──────────────────────────\n` +
    `*${businessName}*`

  const waHref = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`
    : `https://wa.me/?text=${encodeURIComponent(waMsg)}`

  const handleExportPDF = async () => {
    try {
      setGeneratingPdf(true)
      const { generatePartyStatementPDF } = await import('@/lib/pdf/generatePartyStatement')
      
      const totalDebit = ledgerWithRunningBalance.reduce((acc, item) => acc + (item.debit || 0), 0)
      const totalCredit = ledgerWithRunningBalance.reduce((acc, item) => acc + (item.credit || 0), 0)
      const sorted = [...ledgerWithRunningBalance].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      const startDate = sorted[0]?.date ? new Date(sorted[0].date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      const endDate = new Date().toISOString().split('T')[0]

      generatePartyStatementPDF({
        businessName,
        businessPhone: business?.phone || undefined,
        businessAddress: business?.address || undefined,
        partyName: party.name,
        partyPhone: party.phone || undefined,
        partyAddress: party.address || undefined,
        startDate,
        endDate,
        openingBalance: 0,
        items: sorted.map(item => ({
          date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
          reference: item.ref || '—',
          description: item.note || (item.type === 'INVOICE' ? 'Sales Invoice' : 'Payment Received'),
          debit: item.debit || 0,
          credit: item.credit || 0,
          runningBalance: item.runningBalance || 0,
        })),
        closingBalance: currentBalance,
        totalDebit,
        totalCredit,
        currency: 'PKR',
      })
    } catch (err: any) {
      console.error('PDF export error:', err)
      alert('PDF generation error: ' + (err?.message || 'Unknown error occurred'))
    } finally {
      setGeneratingPdf(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#06080B] text-slate-200 font-sans selection:bg-[#C5A059] selection:text-black py-10 px-4 sm:px-8">
      <div className="printable-statement max-w-5xl mx-auto space-y-8">
        
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
                {businessName}
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
              onClick={handleExportPDF}
              disabled={generatingPdf}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-sm transition-all disabled:opacity-50"
            >
              {generatingPdf ? (
                <Loader2 size={14} className="animate-spin text-amber-400" />
              ) : (
                <Download size={14} />
              )}
              <span>{generatingPdf ? 'Generating PDF...' : 'Export Statement PDF'}</span>
            </button>
            <a 
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase px-4 py-2.5 rounded-sm transition-all shadow-lg hover:shadow-emerald-500/20"
            >
              <Share2 size={14} />
              <span>WhatsApp Statement</span>
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
