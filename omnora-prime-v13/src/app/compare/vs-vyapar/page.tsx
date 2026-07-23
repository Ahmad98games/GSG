import type { Metadata } from 'next'
import Script from 'next/script'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Vyapar Alternative Pakistan — Noxis Hub vs Vyapar (2026)',
  description: 'Comparing Vyapar billing software and Noxis Hub factory ERP. Learn why Pakistani karkhanas and manufacturers choose Noxis Hub for worker payroll and offline sync.',
  keywords: [
    'Vyapar alternative Pakistan',
    'Vyapar vs Noxis',
    'better than Vyapar',
    'GST billing software Pakistan alternate',
  ],
  openGraph: {
    title: 'Vyapar Alternative Pakistan — Noxis Hub vs Vyapar',
    description: 'Compare Vyapar and Noxis Hub side-by-side for worker payroll, peshgi advance tracking, and offline local operations.',
    url: 'https://noxishub.app/compare/vs-vyapar',
  },
  alternates: {
    canonical: '/compare/vs-vyapar',
  },
}

export default function CompareVyaparPage() {
  return (
    <>
      <Script
        id="vyapar-compare-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Noxis Hub vs Vyapar Comparison',
            description: 'Comparison of Vyapar mobile billing and Noxis Hub factory ERP for small factories in Pakistan.',
            url: 'https://noxishub.app/compare/vs-vyapar',
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
            Noxis Hub vs <span className="text-gray-400">Vyapar</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-8 font-medium">
            Vyapar is excellent for single-store retailers. Noxis Hub is built for factories with production lines, looms, sizing units, and workers.
          </p>
        </section>

        {/* Comparison Table */}
        <section className="px-6 py-12 max-w-5xl mx-auto">
          <h2 className="text-xl md:text-2xl font-black text-center mb-8 uppercase tracking-wide">
            Detailed Comparison Matrix
          </h2>

          <div className="border border-white/5 bg-[#0F1114] overflow-x-auto rounded-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/8 bg-black/40 text-gray-400">
                  <th className="p-4 font-bold uppercase tracking-wider">Feature</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[#60A5FA]">Noxis Hub</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Vyapar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ['Target Audience', 'Manufacturing units and factories', 'Small shops and retail traders'],
                  ['Worker (Karigar) Wages', 'Calculates piece-rate wages and advance deductions', 'No labor or piece-rate tracking'],
                  ['Peshgi Advance Tracking', 'Automated deduction ledgers per worker', 'No advance deduction tracking'],
                  ['Multi-Device LAN Sync', 'Works offline across devices on local network without internet', 'Multi-device sync requires cloud connection'],
                  ['CCTV Integration', 'View live camera feeds inside the ERP', 'No camera support'],
                  ['Pricing Plan Structure', 'Starting PKR 25,000/year (no limits on invoice count)', 'Tiers matching device limits and invoice branding'],
                ].map(([feat, noxis, vyapar]) => (
                  <tr key={feat} className="hover:bg-white/[0.01]">
                    <td className="p-4 font-semibold text-white">{feat}</td>
                    <td className="p-4 text-[#60A5FA] font-medium">{noxis}</td>
                    <td className="p-4 text-gray-500">{vyapar}</td>
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
              Choose <strong className="text-white">Vyapar</strong> if you run a simple retail outlet, have zero workers, and only need basic billing.
            </p>
            <p>
              Choose <strong className="text-[#60A5FA]">Noxis Hub</strong> if you run a garment stitching factory, loom unit, rice mill, or any manufacturing business with daily workers where tracking production output and advances is critical.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
            Optimize Your Factory Payroll
          </h2>
          <Link
            href="https://wa.me/923264742678?text=Help+me+choose+between+Vyapar+and+Noxis+Hub"
            target="_blank"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#60A5FA] text-black font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/10"
          >
            💬 WhatsApp for Free Consultation
          </Link>
        </section>
      </main>
    </>
  )
}
