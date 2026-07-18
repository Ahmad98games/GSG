'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import * as XLSX from 'xlsx'
import { useToast } from '@/hooks/useToast'
import { 
  ShieldCheck, 
  ArrowLeft, 
  Download, 
  FileSpreadsheet, 
  AlertTriangle 
} from 'lucide-react'

export default function TaxReportPage() {
  const supabase = createClient()
  const { profile } = useBusinessProfile()
  const toast = useToast()
  const [year, setYear] = useState(new Date().getFullYear())
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const generateReport = async () => {
    if (!profile?.id) return
    setLoading(true)

    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    try {
      // Pull all invoices for the year
      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('*, party:parties(name)')
        .eq('business_id', profile.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('status', 'posted')

      if (invError) throw invError;

      // Pull all purchases
      const { data: purchases, error: purError } = await supabase
        .from('purchase_orders')
        .select('*, party:parties(name)')
        .eq('business_id', profile.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (purError) throw purError;

      // Pull payroll
      const { data: payrolls, error: payError } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('business_id', profile.id)
        .gte('period_start', startDate)
        .lte('period_end', endDate)

      if (payError) throw payError;

      const totalSales = (invoices || [])
        .reduce((s: number, i: any) => s + (i.total_amount || 0), 0)
      const totalTaxable = totalSales
      const salesTax = totalTaxable * 0.17 // 17% GST

      const totalPurchases = (purchases || [])
        .reduce((s: number, p: any) => s + (p.total_amount || 0), 0)
      const inputTax = totalPurchases * 0.17

      const netTaxPayable = Math.max(0, salesTax - inputTax)

      const totalPayroll = (payrolls || [])
        .reduce((s: number, p: any) => s + (p.total_net || 0), 0)

      setData({
        year,
        totalSales,
        totalPurchases,
        salesTax,
        inputTax,
        netTaxPayable,
        totalPayroll,
        invoiceCount: (invoices || []).length,
        invoices: invoices || [],
        purchases: purchases || [],
      })
      toast.success('Report successfully calculated')
    } catch (err: any) {
      toast.error('Failed to generate report', err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  const exportFBR = () => {
    if (!data) return

    try {
      // FBR Sales Tax Return format
      const salesRows = data.invoices.map((inv: any) => ({
        'Invoice Date': new Date(inv.created_at).toLocaleDateString('en-PK'),
        'Invoice Number': inv.invoice_number || inv.invoice_no,
        'Customer Name': inv.party?.name || '',
        'Taxable Amount': inv.subtotal || 0,
        'Tax Rate': '17%',
        'Sales Tax': ((inv.subtotal || 0) * 0.17).toFixed(2),
        'Total Amount': inv.total_amount || inv.total || 0,
      }))

      const wb = XLSX.utils.book_new()
      const ws1 = XLSX.utils.json_to_sheet(salesRows)
      XLSX.utils.book_append_sheet(wb, ws1, 'Sales Register')

      // Summary sheet
      const summary = [{
        'Tax Year': data.year,
        'Total Sales': data.totalSales,
        'Output Tax (17%)': data.salesTax.toFixed(2),
        'Total Purchases': data.totalPurchases,
        'Input Tax (17%)': data.inputTax.toFixed(2),
        'Net Tax Payable': data.netTaxPayable.toFixed(2),
        'Total Payroll': data.totalPayroll,
      }]
      const ws2 = XLSX.utils.json_to_sheet(summary)
      XLSX.utils.book_append_sheet(wb, ws2, 'Tax Summary')

      XLSX.writeFile(wb, `FBR_Tax_Return_${data.year}.xlsx`)
      toast.success('FBR export downloaded')
    } catch (err: any) {
      toast.error('Export failed', err.message || String(err))
    }
  }

  const PKR = (n: number) =>
    `PKR ${n.toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter">
      {/* Sub-Header / Breadcrumb with Nav Tabs */}
      <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
          <Link href="/reports" className="hover:text-white transition-colors">Reports</Link>
          <span className="mx-3 opacity-30">/</span>
          <span className="text-white">FBR Year-End Tax Export</span>
        </div>

        <nav className="ml-auto flex h-16 items-center">
          <Link href="/reports" className="px-6 h-full flex items-center space-x-2 text-[10px] uppercase tracking-widest font-black text-gray-500 border-b-2 border-transparent hover:text-white hover:bg-white/[0.02]">
            Overview
          </Link>
          <Link href="/reports/tax-return" className="px-6 h-full flex items-center space-x-2 text-[10px] uppercase tracking-widest font-black text-gray-500 border-b-2 border-transparent hover:text-white hover:bg-white/[0.02]">
            Tax Return Analysis
          </Link>
          <Link href="/reports/tax" className="px-6 h-full flex items-center space-x-2 text-[10px] uppercase tracking-widest font-black text-electric-blue border-b-2 border-electric-blue bg-white/5">
            Year-End FBR Report
          </Link>
        </nav>
      </header>

      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Tax Report
            </h1>
            <p className="text-xs text-gray-500">
              FBR Sales Tax Return — Pakistan (Year End Audit)
            </p>
          </div>
          <Link 
            href="/reports" 
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-all rounded-sm"
          >
            <ArrowLeft size={14} /> Back to Hub
          </Link>
        </div>

        {/* Year selector & Actions */}
        <div className="flex flex-wrap items-center gap-4 bg-[#1A1D21] border border-white/5 p-6 rounded-sm">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 block mb-1.5">
              Tax Year
            </label>
            <select
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
              className="bg-[#0F1113] border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-electric-blue/40 rounded-sm"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={generateReport}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest bg-electric-blue text-onyx hover:brightness-110 disabled:opacity-50 transition-all rounded-sm cursor-pointer shadow-lg"
            >
              {loading ? 'Calculating...' : 'Generate Report'}
            </button>

            {data && (
              <button
                onClick={exportFBR}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest border border-electric-blue/30 text-electric-blue hover:bg-electric-blue/10 transition-colors rounded-sm cursor-pointer"
              >
                <FileSpreadsheet size={14} />
                Export FBR Format
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {data && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  label: 'Total Sales',
                  value: PKR(data.totalSales),
                  sub: `${data.invoiceCount} posted invoices`,
                  color: 'text-emerald-400',
                  border: 'border-white/5'
                },
                {
                  label: 'Output Tax (17%)',
                  value: PKR(data.salesTax),
                  sub: 'Collected GST liability',
                  color: 'text-white',
                  border: 'border-white/5'
                },
                {
                  label: 'Total Purchases',
                  value: PKR(data.totalPurchases),
                  sub: 'Input Tax credit base',
                  color: 'text-white',
                  border: 'border-white/5'
                },
                {
                  label: 'Input Tax Credit',
                  value: PKR(data.inputTax),
                  sub: 'Deductible from Output GST',
                  color: 'text-[#60A5FA]',
                  border: 'border-white/5'
                },
              ].map(card => (
                <div 
                  key={card.label}
                  className={`p-6 bg-[#121417] border ${card.border} rounded-sm relative`}
                >
                  <div className="absolute top-0 left-0 w-1/4 h-[1px] bg-gradient-to-r from-electric-blue/50 to-transparent" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                    {card.label}
                  </p>
                  <p className={`text-2xl font-mono font-bold ${card.color}`}>
                    {card.value}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-1">
                    {card.sub}
                  </p>
                </div>
              ))}
            </div>

            {/* Net payable */}
            <div className="p-6 bg-[#121417] border border-amber-500/20 rounded-sm relative">
              <div className="absolute top-0 left-0 w-1/4 h-[1px] bg-gradient-to-r from-amber-500/50 to-transparent" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">
                Net Sales Tax Payable
              </p>
              <p className="text-3xl font-mono font-black text-amber-500">
                {PKR(data.netTaxPayable)}
              </p>
              <p className="text-[11px] text-gray-500 mt-2">
                Output Tax − Input Tax Credit. Form 26S reconciliation for Federal Board of Revenue filing.
              </p>
            </div>

            {/* Payroll info */}
            <div className="p-6 bg-[#121417] border border-white/5 rounded-sm relative">
              <div className="absolute top-0 left-0 w-1/4 h-[1px] bg-gradient-to-r from-gray-500/50 to-transparent" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Total Payroll Expense
              </p>
              <p className="text-xl font-mono font-bold text-white">
                {PKR(data.totalPayroll)}
              </p>
              <p className="text-[10px] text-gray-600 mt-1">
                Income tax deductible operational expense
              </p>
            </div>

            {/* Compliance Banner */}
            <div className="p-5 bg-electric-blue/5 border border-electric-blue/15 text-xs text-electric-blue leading-relaxed flex gap-3">
              <ShieldCheck className="shrink-0 mt-0.5" size={16} />
              <div>
                <span className="font-bold block mb-1">Compliance & Filing Guide</span>
                This report is automatically reconciled from the master ledger. Ensure all sales invoices are uploaded to IRIS/FBR portal by the 10th of every calendar month. Standard input tax credit claiming is capped under Section 8B of the Sales Tax Act.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
