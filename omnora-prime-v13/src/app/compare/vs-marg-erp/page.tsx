import type { Metadata } from 'next'
import Script from 'next/script'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Marg ERP Alternative Pakistan — Noxis Hub vs Marg ERP (2026)',
  description: 'Comparing Marg ERP accounting software and Noxis Hub factory ERP. Learn why karkhanas and distributors are switching to Noxis Hub.',
  keywords: [
    'Marg ERP alternative Pakistan',
    'Marg ERP vs Noxis',
    'better than Marg ERP',
    'distributor billing software Pakistan alternate',
  ],
  openGraph: {
    title: 'Marg ERP Alternative Pakistan — Noxis Hub vs Marg ERP',
    description: 'Compare Marg ERP and Noxis Hub side-by-side for distribution batch inventory and worker payroll.',
    url: 'https://noxishub.app/compare/vs-marg-erp',
  },
  alternates: {
    canonical: '/compare/vs-marg-erp',
  },
}

export default function CompareMargErpPage() {
  return (
    <>
      <Script
        id="marg-compare-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Noxis Hub vs Marg ERP Comparison',
            description: 'Comparison of Marg ERP accounting and Noxis Hub factory ERP for pharmaceutical and manufacturing businesses in Pakistan.',
            url: 'https://noxishub.app/compare/vs-marg-erp',
          })
        }}
      />

      <main className="min-h-screen bg-[#060708] text-white">
        {/* Hero */}
        <section className="px-6 pt-32 pb-16 max-w-5xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-[#60A5FA]/5 blur-[120px] rounded-full max-w-lg mx-auto pointer-events-none" />
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#60A5FA]/10 border border-[#60A5FA]/20 text-[#60A5FA] text-xs font-bold uppercase tracking-widest mb-6">
            ⚖️ Software Comparison
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Noxis Hub vs <span className="text-gray-400">Marg ERP</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-8 font-medium">
            Marg ERP is built for wholesale distributors. Noxis Hub is built for factories with workforce registers, local networks, and CCTV integration.
          </p>
        </section>

        {/* Comparison Table */}
        <section className="px-6 py-12 max-w-5xl mx-auto">
          <h2 className="text-xl md:text-2xl font-black text-center mb-8 uppercase tracking-wide">
            Feature Matrix Comparison
          </h2>

          <div className="border border-white/5 bg-[#0F1114] overflow-x-auto rounded-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/8 bg-black/40 text-gray-400">
                  <th className="p-4 font-bold uppercase tracking-wider">Feature</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[#60A5FA]">Noxis Hub</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Marg ERP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ['Target Sector', 'Factories, Weaving/Stitching Units, Mills', 'Pharma Distributors, FMCG Wholesalers'],
                  ['Loom & Production Tracking', 'Loom allocation metrics and cutting room counts', 'Standard finished goods inventory mapping only'],
                  ['Peshgi Advance Tracking', 'Automated advance ledger per karigar', 'No labor advance records'],
                  ['Camera Support', 'Live CCTV streaming integration within client dashboard', 'No camera feed integrations'],
                  ['Setup & Customization', 'Self-setup in under 5 minutes with wizard', 'Requires a Marg specialist for initial database mapping'],
                ].map(([feat, noxis, marg]) => (
                  <tr key={feat} className="hover:bg-white/[0.01]">
                    <td className="p-4 font-semibold text-white">{feat}</td>
                    <td className="p-4 text-[#60A5FA] font-medium">{noxis}</td>
                    <td className="p-4 text-gray-500">{marg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Verdict */}
        <section className="px-6 py-16 bg-[#0A0C0F] border-t border-white/5 text-center">
          <h2 className="text-2xl font-black text-white mb-4 tracking-tight uppercase">
            The Verdict
          </h2>
          <div className="max-w-2xl mx-auto space-y-4 text-xs text-gray-400 leading-relaxed text-left p-6 bg-[#0F1114] border border-white/5 rounded-sm">
            <p>
              Choose <strong className="text-white">Marg ERP</strong> if you run a pharmacy store or wholesale pharma/FMCG distribution agency that requires expiry tracking configurations.
            </p>
            <p>
              Choose <strong className="text-[#60A5FA]">Noxis Hub</strong> if you run an industrial karkhana, garment shop, mill, or manufacturing plant with active workers and floor operations.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
            Consult Our Integration Team
          </h2>
          <Link
            href="https://wa.me/923264742678?text=Help+me+choose+between+Marg+ERP+and+Noxis+Hub"
            target="_blank"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#60A5FA] text-black font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/10"
          >
            💬 WhatsApp for Consultation
          </Link>
        </section>
      </main>
    </>
  )
}
