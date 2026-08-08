'use client'
import Link from 'next/link'
import { Download, ArrowRight } from 'lucide-react'

const COMPARISON_DATA = [
  { feature: 'Offline operation', noxis: '✅', manager: '❌ (crashed)', vyapar: '⚠️', tally: '❌', khata: '⚠️', gnucash: '✅' },
  { feature: 'Karigar piece-rate payroll', noxis: '✅', manager: '❌', vyapar: '❌', tally: '❌', khata: '❌', gnucash: '❌' },
  { feature: 'Piece-rate grid', noxis: '✅', manager: '❌', vyapar: '❌', tally: '❌', khata: '❌', gnucash: '❌' },
  { feature: 'Mobile companion mesh', noxis: '✅', manager: '❌', vyapar: '⚠️', tally: '❌', khata: '✅', gnucash: '❌' },
  { feature: 'CCTV video feed integration', noxis: '✅', manager: '❌', vyapar: '❌', tally: '❌', khata: '❌', gnucash: '❌' },
  { feature: 'WhatsApp invoice dispatch', noxis: '✅', manager: '❌', vyapar: '⚠️', tally: '❌', khata: '✅', gnucash: '❌' },
  { feature: 'Power cut recovery', noxis: '✅', manager: '❌', vyapar: '❌', tally: '❌', khata: '❌', gnucash: '❌' },
  { feature: 'Double-entry accounting', noxis: '✅', manager: '✅', vyapar: '⚠️', tally: '✅', khata: '❌', gnucash: '✅' },
  { feature: 'UAE VAT 5%', noxis: '✅', manager: '❌', vyapar: '✅', tally: '✅', khata: '❌', gnucash: '❌' },
  { feature: 'Pakistan FBR GST', noxis: '✅', manager: '❌', vyapar: '✅', tally: '✅', khata: '❌', gnucash: '❌' },
  { feature: 'Weighbridge RS232', noxis: '✅', manager: '❌', vyapar: '❌', tally: '❌', khata: '❌', gnucash: '❌' },
  { feature: 'Bill of Materials (BOM)', noxis: '✅', manager: '✅', vyapar: '⚠️', tally: '✅', khata: '❌', gnucash: '❌' },
  { feature: 'Hardware-bound license', noxis: '✅', manager: '❌', vyapar: '✅', tally: '✅', khata: '❌', gnucash: '❌' },
  { feature: 'Encrypted local database', noxis: '✅', manager: '❌', vyapar: '❌', tally: '❌', khata: '❌', gnucash: '❌' },
  { feature: 'Free tier available', noxis: '✅', manager: '✅', vyapar: '⚠️', tally: '❌', khata: '✅', gnucash: '✅' },
  { feature: 'Pakistan annual price', noxis: 'PKR 25,000', manager: '$299', vyapar: '₹3,600', tally: '₹18,000', khata: 'Free', gnucash: 'Free' },
]

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-[#060708] text-[#F9FAFB] font-sans pt-12 pb-20">
      {/* HEADER */}
      <section className="py-12 border-b border-[#21262D] bg-[#060708]">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <span className="text-xs font-mono font-bold text-[#3B82F6] uppercase tracking-wider block mb-2">
            Field Test Benchmark
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            Noxis Hub vs Alternative Solutions
          </h1>
          <p className="text-xs text-gray-400 font-mono">
            Tested July 2026 on factory hardware. Results reflect actual offline runtime capability.
          </p>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="py-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="overflow-x-auto bg-[#0D1117] rounded-md border border-[#21262D] mb-8">
            <table className="w-full text-left text-xs border-collapse min-w-[750px]">
              <thead>
                <tr className="border-b border-[#21262D] bg-[#161B22]">
                  <th className="p-3 font-bold text-white">Features</th>
                  <th className="p-3 font-mono font-bold text-[#3B82F6] bg-[#3B82F6]/10">Noxis Hub</th>
                  <th className="p-3 font-bold text-gray-400">Manager.io</th>
                  <th className="p-3 font-bold text-gray-400">Vyapar</th>
                  <th className="p-3 font-bold text-gray-400">Tally</th>
                  <th className="p-3 font-bold text-gray-400">Khatabook</th>
                  <th className="p-3 font-bold text-gray-400">GnuCash</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_DATA.map((row, idx) => (
                  <tr key={idx} className="border-b border-[#21262D]/60 hover:bg-[#161B22]/50 transition-colors">
                    <td className="p-3 font-medium text-gray-300">{row.feature}</td>
                    <td className="p-3 font-mono font-bold text-[#10B981] bg-[#3B82F6]/5">{row.noxis}</td>
                    <td className="p-3 font-mono text-gray-400">{row.manager}</td>
                    <td className="p-3 font-mono text-gray-400">{row.vyapar}</td>
                    <td className="p-3 font-mono text-gray-400">{row.tally}</td>
                    <td className="p-3 font-mono text-gray-400">{row.khata}</td>
                    <td className="p-3 font-mono text-gray-400">{row.gnucash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SUMMARY CARD */}
          <div className="p-6 bg-[#0D1117] border border-[#21262D] rounded-md text-center max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-white mb-2">
              Noxis Hub Leads Across 14 Industrial Categories
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Engineered specifically for offline stability in Pakistan and UAE factories where load shedding, internet cuts, and karigar piece-rate payroll are critical daily realities.
            </p>
            <Link href="/download" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-black font-bold text-xs rounded-md transition-colors">
              <Download size={14} />
              Download Free Setup
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
