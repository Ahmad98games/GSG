'use client'
import Link from 'next/link'
import { Download, ArrowRight, ShieldCheck, MessageSquare, CheckCircle2 } from 'lucide-react'

const COMPARISON_DATA = [
  { feature: 'Offline operation (Hard drive & Wi-Fi)', noxis: '✅ 100% Offline', manager: '❌ (crashed)', vyapar: '⚠️', tally: '❌', khata: '⚠️', gnucash: '✅' },
  { feature: 'Free Excel & paper Khata migration', noxis: '✅ (Free Omnora setup)', manager: '❌', vyapar: '❌', tally: '❌ ($$$)', khata: '❌', gnucash: '❌' },
  { feature: 'Karigar piece-rate payroll & Peshgi', noxis: '✅ Automated', manager: '❌', vyapar: '❌', tally: '❌', khata: '❌', gnucash: '❌' },
  { feature: 'Power cut / Load-shedding recovery', noxis: '✅ (SQLite WAL)', manager: '❌', vyapar: '❌', tally: '❌', khata: '❌', gnucash: '❌' },
  { feature: 'Fiber cuts & internet blackout immunity', noxis: '✅ Zero delay', manager: '❌', vyapar: '❌', tally: '❌', khata: '❌', gnucash: '✅' },
  { feature: 'Mobile companion mesh (Local Wi-Fi)', noxis: '✅ No SIM needed', manager: '❌', vyapar: '⚠️', tally: '❌', khata: '✅', gnucash: '❌' },
  { feature: 'CCTV video feed integration (RTSP)', noxis: '✅ Up to 6 Cams', manager: '❌', vyapar: '❌', tally: '❌', khata: '❌', gnucash: '❌' },
  { feature: 'WhatsApp invoice dispatch', noxis: '✅ 1-Click', manager: '❌', vyapar: '⚠️', tally: '❌', khata: '✅', gnucash: '❌' },
  { feature: 'Double-entry accounting & Khata', noxis: '✅ Balanced', manager: '✅', vyapar: '⚠️', tally: '✅', khata: '❌', gnucash: '✅' },
  { feature: 'UAE VAT 5% & Pakistan FBR GST', noxis: '✅ Built-in', manager: '❌', vyapar: '✅', tally: '✅', khata: '❌', gnucash: '❌' },
  { feature: 'Hardware-bound license (No monthly rent)', noxis: '✅ Permanent', manager: '❌', vyapar: '✅', tally: '✅', khata: '❌', gnucash: '❌' },
  { feature: 'Encrypted local database (Privacy)', noxis: '✅ Local PC', manager: '❌', vyapar: '❌', tally: '❌', khata: '❌', gnucash: '❌' },
  { feature: 'Free tier available', noxis: '✅', manager: '✅', vyapar: '⚠️', tally: '❌', khata: '✅', gnucash: '✅' },
  { feature: 'Pakistan annual price', noxis: 'PKR 25,000 (One-time options)', manager: '$299/yr', vyapar: '₹3,600/yr', tally: '₹18,000/yr', khata: 'Free', gnucash: 'Free' },
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

          {/* DEDICATED MIGRATION GUARANTEE CARD */}
          <div className="p-8 bg-gradient-to-br from-[#10141D] to-[#0A0D12] border border-[#C5A059]/40 rounded-xl mb-8 max-w-3xl mx-auto shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#C5A059] uppercase tracking-wider mb-3">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Free Personal Migration Guarantee</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
              Free personal assistance from Omnora Labs to migrate your existing Excel sheets and paper Khata registers into Noxis.
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-6">
              Don&apos;t worry about manual re-entry. Our engineers will personally format and migrate your customer ledgers, opening balances, raw materials, and Karigar advance history directly into your local database.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="https://wa.me/923264742678?text=Salam%20Omnora,%20I%20want%20help%20migrating%20my%20factory%20Excel%20and%20paper%20Khata%20into%20Noxis"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold text-xs rounded transition-colors"
              >
                <MessageSquare size={15} />
                WhatsApp Free Migration Assistance
              </a>
              <Link
                href="/download"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded transition-colors"
              >
                <Download size={14} />
                Download 7-Day Free Setup
              </Link>
            </div>
          </div>

          {/* SUMMARY CARD */}
          <div className="p-6 bg-[#0D1117] border border-[#21262D] rounded-md text-center max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-white mb-2">
              Noxis Hub Leads Across 14 Industrial Categories
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Engineered specifically for offline stability in Pakistan and South Asian factories where load shedding, fiber cuts, and Karigar piece-rate payroll disputes are critical daily realities.
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
