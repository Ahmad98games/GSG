'use client'
import { useState } from 'react'
import { Tag, Calendar, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'

const RELEASES = [
  {
    version: 'v13.0.0',
    date: 'July 2026',
    isCurrent: true,
    title: 'Major Release — Industrial ERP & Companion Mesh',
    summary: 'Complete redesign of offline-first engine, RS232 weighbridge support, CCTV video feeds, and UAE VAT 201 compliance.',
    changes: [
      'RS232 weighbridge direct integration for rice mill Paddy IN / Rice OUT weight entries.',
      'CCTV video feed integration with direct stream protocol and event recording.',
      'UAE VAT 5% tax module with FTA VAT 201 return reporting.',
      'Mobile Mesh synchronization over local WiFi and secure connection.',
      'Karigar piece-rate grid with instant wage calculations and bulk payslip PDF generation.',
      '256-bit local database encryption with asymmetric license verification.',
    ],
  },
  {
    version: 'v12.4.0',
    date: 'May 2026',
    title: 'Performance & Thermal Label Studio',
    summary: 'Virtual scroll implementation for 50,000+ SKUs with under 150ms page load times.',
    changes: [
      'Virtual scroll implementation in inventory tables and POS counter search.',
      'Thermal label designer for 80mm receipts and product barcode stickers.',
      'FBR NTN and STRN invoice footer customization.',
      'Concurrent read-write engine optimizations for local database.',
    ],
  },
  {
    version: 'v11.8.0',
    date: 'February 2026',
    title: 'WhatsApp Automation & Peshgi Ledger',
    summary: 'One-tap WhatsApp invoice PDF dispatch and advance wage tracking.',
    changes: [
      'WhatsApp invoice dispatch with pre-filled customer messages.',
      'Peshgi advance tracking module for Karigars with running balance.',
      'Multi-currency support for PKR, AED, USD, and SAR.',
      'Automated daily encrypted local backups.',
    ],
  },
]

export default function ChangelogPage() {
  const [openVersions, setOpenVersions] = useState<string[]>(['v13.0.0'])

  const toggleVersion = (v: string) => {
    setOpenVersions(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
    )
  }

  return (
    <div className="min-h-screen bg-[#060708] text-[#F9FAFB] font-sans pt-12 pb-20">
      {/* HERO */}
      <section className="py-12 border-b border-[#21262D] bg-[#060708]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="text-xs font-mono font-bold text-[#3B82F6] uppercase tracking-wider block mb-2">
            Release History
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            Noxis Hub Changelog
          </h1>
          <p className="text-xs text-gray-400 font-mono">
            Track feature updates, performance benchmarks, and security patches.
          </p>
        </div>
      </section>

      {/* RELEASES */}
      <section className="py-10">
        <div className="max-w-3xl mx-auto px-6 space-y-4">
          {RELEASES.map((rel) => {
            const isOpen = openVersions.includes(rel.version)
            return (
              <div
                key={rel.version}
                className={`
                  p-5 bg-[#0D1117] border rounded-md transition-all
                  ${rel.isCurrent ? 'border-[#3B82F6]' : 'border-[#21262D]'}
                `}
              >
                <div
                  onClick={() => toggleVersion(rel.version)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base font-mono font-bold text-white flex items-center gap-2">
                      <Tag size={15} className={rel.isCurrent ? 'text-[#3B82F6]' : 'text-gray-500'} />
                      {rel.version}
                    </span>
                    {rel.isCurrent && (
                      <span className="text-[10px] font-mono font-bold uppercase text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
                        Current Release
                      </span>
                    )}
                    <span className="text-xs font-mono text-gray-500 flex items-center gap-1">
                      <Calendar size={12} />
                      {rel.date}
                    </span>
                  </div>
                  <button className="text-gray-400 hover:text-white">
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                <div className="mt-3">
                  <h3 className="text-sm font-bold text-white mb-1">{rel.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{rel.summary}</p>
                </div>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-[#21262D] space-y-2">
                    <span className="text-[10px] font-mono font-bold text-[#3B82F6] uppercase tracking-wider block mb-2">
                      Changes in {rel.version}:
                    </span>
                    {rel.changes.map((chg, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                        <CheckCircle2 size={14} className="text-[#10B981] shrink-0 mt-0.5" />
                        <span>{chg}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
