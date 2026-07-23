import type { Metadata } from 'next'
import Script from 'next/script'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'TallyPrime Alternative Pakistan — Noxis Hub vs TallyPrime (2026)',
  description: 'Comparing TallyPrime and Noxis Hub for manufacturing businesses in Pakistan. Learn why karkhanas are switching to Noxis Hub. Full side-by-side analysis.',
  keywords: [
    'TallyPrime alternative Pakistan',
    'TallyPrime vs Noxis',
    'better than TallyPrime',
    'accounting software Pakistan comparison',
    'manufacturing ERP Tally alternate',
  ],
  openGraph: {
    title: 'TallyPrime Alternative Pakistan — Noxis Hub vs TallyPrime',
    description: 'Honest comparison for factory owners: piece-rate worker payroll, offline operation, and WhatsApp billing vs ledger accounting.',
    url: 'https://noxishub.app/compare/vs-tallyprime',
  },
  alternates: {
    canonical: '/compare/vs-tallyprime',
  },
}

export default function CompareTallyPrimePage() {
  return (
    <>
      <Script
        id="tally-compare-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Noxis Hub vs TallyPrime Comparison',
            description: 'Side-by-side comparison of TallyPrime accounting and Noxis Hub factory ERP for karkhanas in Pakistan.',
            url: 'https://noxishub.app/compare/vs-tallyprime',
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
            Noxis Hub vs{' '}
            <span className="text-gray-400">TallyPrime</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-8 font-medium">
            TallyPrime is an accounting giant. Noxis Hub is a dedicated worker and factory floor manager. Find out which one is the right fit for your manufacturing operations.
          </p>

          <div className="flex flex-wrap gap-4 justify-center relative z-10">
            <Link
              href="https://wa.me/923264742678?text=I+want+to+know+if+Noxis+Hub+is+better+than+TallyPrime+for+my+factory"
              target="_blank"
              className="px-8 py-4 bg-[#60A5FA] text-black font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/10"
            >
              💬 WhatsApp — Consult Expert
            </Link>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="px-6 py-12 max-w-5xl mx-auto">
          <h2 className="text-xl md:text-2xl font-black text-center mb-8 uppercase tracking-wide">
            Feature Comparison Matrix
          </h2>

          <div className="border border-white/5 bg-[#0F1114] overflow-x-auto rounded-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/8 bg-black/40 text-gray-400">
                  <th className="p-4 font-bold uppercase tracking-wider">Feature</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[#60A5FA]">Noxis Hub</th>
                  <th className="p-4 font-bold uppercase tracking-wider">TallyPrime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ['Karigar (Worker) Registry', 'Built-in database for up to 500 workers', 'Requires custom ledger definitions'],
                  ['Piece-Rate Wages & Peshgi', 'Automated per-piece wages and advance deductions', 'Manual journal entry mapping required'],
                  ['Offline-First LAN Support', 'Full feature access on local network without internet', 'Local installation only, lacks multi-branch offline sync'],
                  ['WhatsApp Invoicing', 'One-click automated invoice delivery', 'Requires external Tally-to-WhatsApp utilities'],
                  ['CCTV & AI Camera Grid', 'Integrates IP cameras inside application view', 'No camera support'],
                  ['Mobile Companion App', 'Android app for supervisors on the factory floor', 'Mobile viewer is read-only'],
                  ['Keyboard Shortcut Speed', 'Standard web navigation', 'High-speed keyboard-only navigation'],
                  ['Core Accounting Depth', 'Double-entry bookkeeping, GST/VAT billing', 'Unmatched standard accounting, taxation, and auditing tools'],
                ].map(([feat, noxis, tally]) => (
                  <tr key={feat} className="hover:bg-white/[0.01]">
                    <td className="p-4 font-semibold text-white">{feat}</td>
                    <td className="p-4 text-[#60A5FA] font-medium">{noxis}</td>
                    <td className="p-4 text-gray-500">{tally}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Details Section */}
        <section className="px-6 py-16 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-lg font-black text-[#60A5FA] mb-4 uppercase tracking-wider">
              Where Noxis Hub Wins
            </h3>
            <ul className="space-y-4">
              <li className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-white block mb-1">Weaver & Stitcher Payroll:</strong>
                Calculates piece-rate wages and tracks peshgi balances automatically. Tally is built for general accounting, not factory operations.
              </li>
              <li className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-white block mb-1">Supervisor Mobile Tools:</strong>
                Supervisors mark worker attendance and log output bags directly from their mobile phones while on the factory floor.
              </li>
              <li className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-white block mb-1">Security Integration:</strong>
                Displays live CCTV streams inside the software, linking motion alerts with inventory logs.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-black text-gray-300 mb-4 uppercase tracking-wider">
              Where TallyPrime Wins
            </h3>
            <ul className="space-y-4">
              <li className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-white block mb-1">Keyboard Entry Speed:</strong>
                Accountants can use Tally without touching the mouse. Its data entry speeds are unmatched.
              </li>
              <li className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-white block mb-1">Auditor Compatibility:</strong>
                Almost every Chartered Accountant in Pakistan is trained on Tally, making year-end audits seamless.
              </li>
              <li className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-white block mb-1">Tax Localization:</strong>
                Offers robust direct FBR tax integrations, localized audit trails, and multi-country tax forms.
              </li>
            </ul>
          </div>
        </section>

        {/* Verdict */}
        <section className="px-6 py-16 bg-[#0A0C0F] border-t border-white/5 text-center">
          <h2 className="text-2xl font-black text-white mb-4 tracking-tight uppercase">
            The Verdict
          </h2>
          <div className="max-w-2xl mx-auto space-y-4 text-xs text-gray-400 leading-relaxed text-left p-6 bg-[#0F1114] border border-white/5 rounded-sm">
            <p>
              Choose <strong className="text-white">TallyPrime</strong> if your priority is pure financial auditing, compliance reporting, and you have a dedicated, stationary accountant who handles general ledger books.
            </p>
            <p>
              Choose <strong className="text-[#60A5FA]">Noxis Hub</strong> if you run a textile loom, rice mill, or garment factory, and want to digitize supervisor tasks, count daily worker production, track cash advances (peshgi), and send WhatsApp invoices.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
            Still Undecided? Talk to Us
          </h2>
          <p className="text-xs font-semibold text-gray-500 mb-8 max-w-xl mx-auto">
            Tell us about your factory layout, and we will tell you honestly which software fits best.
          </p>
          <Link
            href="https://wa.me/923264742678?text=Help+me+choose+between+TallyPrime+and+Noxis+Hub"
            target="_blank"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#60A5FA] text-black font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/10"
          >
            💬 WhatsApp Consultation
          </Link>
        </section>
      </main>
    </>
  )
}
