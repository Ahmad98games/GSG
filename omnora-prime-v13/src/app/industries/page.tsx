'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Download, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'

const INDUSTRIES = [
  {
    id: 'textile',
    name: 'Textile Mill & Weaving Unit',
    icon: '🧵',
    color: '#3B82F6',
    summary: 'Karigar piece-rate payroll, beam inventory, yarn consumption tracking, and weaver attendance.',
    workflows: [
      'Piece-rate wage calculation per meter / per suit',
      'Yarn cone inventory in LBs and KGs',
      'Loom efficiency and downtime tracking',
      'Peshgi advance ledger with worker running balance',
      'Delivery challan with vehicle number and driver signature',
    ],
    metrics: [
      { label: 'Weaver Settlement', val: '< 2 mins' },
      { label: 'Yarn Loss Margin', val: '0.0%' },
      { label: 'Karigar Capacity', val: '500+ workers' },
    ],
  },
  {
    id: 'rice-mill',
    name: 'Rice Mill & Processing',
    icon: '🌾',
    color: '#F59E0B',
    summary: 'Paddy IN / Rice OUT weight bridge integration (RS232), moisture testing, and Maund-to-KG conversions.',
    workflows: [
      'Direct RS232 weighbridge scale reader',
      'Paddy IN to Super Basmati yield conversion',
      'Moisture percentage logging per truck batch',
      'By-product tracking (Bhoosa, Nakku, Broken Rice)',
      'Party maund ledger with automated deductions',
    ],
    metrics: [
      { label: 'Weighbridge Read', val: 'Instant RS232' },
      { label: 'Yield Accuracy', val: '100% Exact' },
      { label: 'Conversion', val: 'Maund ↔ KG' },
    ],
  },
  {
    id: 'pharmacy',
    icon: '💊',
    name: 'Pharmacy & Medical Store',
    color: '#10B981',
    summary: 'Batch expiry tracking, salt search, strip-to-tablet conversions, and rapid barcode POS.',
    workflows: [
      '4-level expiry date urgency alerts',
      'Formula / salt name cross-reference search',
      'Strip-to-tablet partial sales calculation',
      'DRAP registration fields on invoice',
      'High-speed barcode scanner counter POS',
    ],
    metrics: [
      { label: 'POS Checkout', val: '3 seconds' },
      { label: 'Expiry Alert', val: '30/60/90 Days' },
      { label: 'Inventory SKU Cap', val: '50,000+' },
    ],
  },
  {
    id: 'garment',
    icon: '✂️',
    name: 'Garment Factory & Stitching',
    color: '#00E5FF',
    summary: 'Stitching piece-rate grid, cutter logs, size matrix (S/M/L/XL), and buyer PO tracking.',
    workflows: [
      'Master cutter fabric consumption log',
      'Stitching piece-rate grid by operation type',
      'Size and color matrix inventory grid',
      'Export garment batch tracking',
      'Subcontractor / job-work issue and return',
    ],
    metrics: [
      { label: 'Piece Grid Speed', val: 'High Density' },
      { label: 'Defect Rate', val: 'Tracked per Lot' },
      { label: 'Payslip Print', val: 'Bulk PDF' },
    ],
  },
  {
    id: 'general-shop',
    icon: '🏪',
    name: 'General Wholesale & Retail',
    color: '#3B82F6',
    summary: 'High-speed POS, customer khata ledger, WhatsApp invoice dispatch, and low stock reorder alerts.',
    workflows: [
      'POS counter with keyboard shortcuts (F2, F10)',
      'Customer khata credit ledger with WhatsApp reminders',
      'Thermal receipt printing (80mm / 58mm)',
      'Opening stock migration wizard',
      'Daily cash drawer reconciliation report',
    ],
    metrics: [
      { label: 'Scan Latency', val: '0ms (Local)' },
      { label: 'WhatsApp Send', val: '1 Tap' },
      { label: 'Receipt Speed', val: 'Instant' },
    ],
  },
  {
    id: 'auto-parts',
    icon: '⚙️',
    name: 'Auto Parts & Hardware Store',
    color: '#EF4444',
    summary: 'OEM part number search, vehicle compatibility matrix, bin location tracking, and duplicate part detection.',
    workflows: [
      'OEM part number & cross-reference search',
      'Bin location tracking (Shelf A-3, Rack 2)',
      'Vehicle model compatibility tags',
      'Core return and defective part ledger',
      'Wholesale tiered pricing (Retail / Mechanic / Dealer)',
    ],
    metrics: [
      { label: 'Part Search', val: 'Instant' },
      { label: 'Tiered Pricing', val: '3 Levels' },
      { label: 'Stock Search', val: 'Exact Bin' },
    ],
  },
  {
    id: 'food-processing',
    icon: '🥩',
    name: 'Food Processing & Cold Storage',
    color: '#F59E0B',
    summary: 'Perishable lot tracking, weight-based pricing, temperature batch logs, and FSSAI/PFA compliance.',
    workflows: [
      'Weight-based dynamic unit pricing (KG/Grams)',
      'Cold storage batch entry and exit logs',
      'Wastage and spoilage deduction records',
      'Punjab Food Authority (PFA) compliant invoices',
      'Supplier GRN with quality inspection status',
    ],
    metrics: [
      { label: 'Batch Trace', val: '100% Lot ID' },
      { label: 'Weight Calc', val: 'Direct Scale' },
      { label: 'Loss Margin', val: 'Audited' },
    ],
  },
]

export default function IndustriesPage() {
  const [selectedIndustry, setSelectedIndustry] = useState('textile')

  const activeInd = INDUSTRIES.find(i => i.id === selectedIndustry) || INDUSTRIES[0]

  return (
    <div className="min-h-screen bg-[#060708] text-[#F9FAFB] font-sans pt-12 pb-20">
      {/* HEADER */}
      <section className="py-12 border-b border-[#21262D] bg-[#060708]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-mono font-bold text-[#3B82F6] uppercase tracking-wider block mb-2">
              Sector Workflows
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Configured for Your Industry Standard.
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              Select your business sector to view tailored ERP workflows, piece-rate parameters, and hardware integrations.
            </p>
          </div>
        </div>
      </section>

      {/* MAIN SELECTOR & CONTENT */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Sidebar list */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-gray-500 uppercase tracking-wider block mb-2 px-1">
                Select Sector
              </span>
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => setSelectedIndustry(ind.id)}
                  className={`
                    w-full text-left p-3 rounded-md border text-xs font-semibold transition-all flex items-center justify-between
                    ${selectedIndustry === ind.id
                      ? 'bg-[#161B22] text-white border-[#3B82F6]'
                      : 'bg-[#0D1117] text-gray-400 border-[#21262D] hover:text-white hover:bg-[#161B22]/50'}
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{ind.icon}</span>
                    <span>{ind.name}</span>
                  </div>
                  <ArrowRight size={14} className={selectedIndustry === ind.id ? 'text-[#3B82F6]' : 'opacity-30'} />
                </button>
              ))}
            </div>

            {/* Active Industry Detail Card */}
            <div className="lg:col-span-2 p-6 bg-[#0D1117] border border-[#21262D] rounded-md space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{activeInd.icon}</span>
                  <h2 className="text-xl font-bold text-white">{activeInd.name}</h2>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{activeInd.summary}</p>
              </div>

              {/* Metrics strip */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-[#161B22] border border-[#21262D] rounded-md">
                {activeInd.metrics.map((m) => (
                  <div key={m.label} className="text-center">
                    <span className="text-[10px] font-mono text-gray-500 uppercase block mb-0.5">{m.label}</span>
                    <span className="text-xs font-mono font-bold text-[#10B981]">{m.val}</span>
                  </div>
                ))}
              </div>

              {/* Workflow checklist */}
              <div>
                <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Configured Workflows
                </h3>
                <div className="space-y-2.5">
                  {activeInd.workflows.map((wf) => (
                    <div key={wf} className="flex items-start gap-2.5 text-xs text-gray-300">
                      <CheckCircle2 size={15} className="text-[#3B82F6] shrink-0 mt-0.5" />
                      <span>{wf}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA button */}
              <div className="pt-4 border-t border-[#21262D] flex items-center justify-between">
                <span className="text-xs text-gray-500 font-mono">
                  100% Offline · Works without internet
                </span>
                <Link
                  href="/download"
                  className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-black font-bold text-xs rounded-md flex items-center gap-2 transition-colors"
                >
                  <Download size={14} />
                  Download Free Setup
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
