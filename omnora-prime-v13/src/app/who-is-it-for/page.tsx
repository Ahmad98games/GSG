import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Is Noxis Hub Right for My Business? — Honest Assessment',
  description: 'Find out if Noxis Hub is the right ERP for your factory. We are honest about who it helps and who should use something else.',
  keywords: [
    'is Noxis Hub right for me',
    'Noxis Hub review',
    'factory ERP Pakistan right fit',
    'manufacturing software assessment',
  ],
  alternates: { canonical: '/who-is-it-for' },
}

export default function WhoIsItForPage() {
  return (
    <>
      <Script
        id="who-is-it-for-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Is Noxis Hub Right for My Business? — Honest Assessment',
            description: 'Find out if Noxis Hub is the right ERP for your factory.',
            url: 'https://noxishub.app/who-is-it-for',
          })
        }}
      />

      <main className="min-h-screen bg-[#060708] text-white">
        {/* Hero */}
        <section className="px-6 pt-32 pb-16 max-w-5xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-[#60A5FA]/5 blur-[120px] rounded-full max-w-lg mx-auto pointer-events-none" />
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#60A5FA]/10 border border-[#60A5FA]/20 text-[#60A5FA] text-xs font-bold uppercase tracking-widest mb-6">
            ⚖️ Product Assessment
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Is Noxis Hub Right for Your Business? <br className="hidden md:inline" />
            <span className="text-gray-400">An Honest Assessment</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-8 font-medium">
            Most software companies will tell you their product is perfect for everyone. We won't. Here is an honest breakdown of exactly who Noxis Hub is built for and who should use something else.
          </p>

          <div className="flex flex-wrap gap-4 justify-center relative z-10">
            <Link
              href="https://wa.me/923264742678?text=Is+Noxis+Hub+suitable+for+my+business"
              target="_blank"
              className="px-8 py-4 bg-[#60A5FA] text-black font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/10"
            >
              💬 Ask an Advisor on WhatsApp
            </Link>
          </div>
        </section>

        {/* Yes & No checklists */}
        <section className="px-6 py-12 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-white/5">
          {/* YES */}
          <div className="p-6 bg-[#0F1114] border border-white/5 rounded-sm">
            <h2 className="text-lg md:text-xl font-black text-[#60A5FA] mb-6 uppercase tracking-wider">
              Noxis Hub is the right choice if...
            </h2>
            <ul className="space-y-4 text-xs text-gray-400">
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>You run a factory, mill, or processing plant.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>You have workers paid by piece rate or daily wage.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>You are in Pakistan, UAE, Saudi Arabia, Bangladesh, or UK (Pakistani community).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Your internet connection is unreliable at least sometimes.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>You currently track attendance in a paper notebook or basic Excel.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>You want billing and notifications sent directly via WhatsApp.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>You employ between 10 to 5,000 workers.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>You value keeping your operational data secure on your own local hardware.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>You have between 1 to 50 factory locations.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>You want native software that runs locally on Windows (not just in a web browser).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Your annual software budget is between PKR 25,000 and 120,000.</span>
              </li>
            </ul>
            <p className="text-[11px] text-gray-500 mt-6 leading-relaxed bg-[#60A5FA]/5 p-3 border border-[#60A5FA]/10">
              💡 <strong>Verdict:</strong> If you said <strong>YES to 5 or more</strong> of these items, Noxis Hub is specifically designed to solve your operational pain points.
            </p>
          </div>

          {/* NO */}
          <div className="p-6 bg-[#0F1114] border border-white/5 rounded-sm">
            <h2 className="text-lg md:text-xl font-black text-gray-400 mb-6 uppercase tracking-wider">
              Noxis Hub is NOT the right choice if...
            </h2>
            <ul className="space-y-4 text-xs text-gray-400">
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">✗</span>
                <span>You are a software company or pure services business with no physical product manufacturing.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">✗</span>
                <span>You need native integrations with Shopify, Amazon, or other e-commerce platforms as a core feature.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">✗</span>
                <span>You operate 50+ legal entities across 10+ countries requiring consolidated IFRS corporate accounting.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">✗</span>
                <span>You require enterprise ISO 9001 quality management compliance modules built into the core ERP.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">✗</span>
                <span>You require direct integrations with Salesforce CRM.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">✗</span>
                <span>You are an accountant looking for multi-tenant bookkeeping to serve 100+ client firms (we recommend TallyPrime or Xero).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">✗</span>
                <span>Your entire workforce works remotely and you do not operate a physical factory, warehouse, or workspace.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Industry Fit Table */}
        <section className="px-6 py-12 max-w-5xl mx-auto">
          <h2 className="text-xl md:text-2xl font-black text-center mb-8 uppercase tracking-wide">
            Does Noxis Hub Support My Industry?
          </h2>

          <div className="border border-white/5 bg-[#0F1114] overflow-x-auto rounded-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/8 bg-black/40 text-gray-400">
                  <th className="p-4 font-bold uppercase tracking-wider">Industry</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-center">Supported</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Specialized Mode / Core Features</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {[
                  ['Textile Mill', '✓', 'Full karigar management, loom logging, fabric grading, peshgi advances'],
                  ['Rice Mill', '✓', 'Mazdoor mode, seasonal paddy input, output yield monitoring, commission tracking'],
                  ['Garment Factory', '✓', 'Size variants, stitcher piece-rate tracking, order batch workflows'],
                  ['Medical/Pharma', '✓', 'Expiry alerts, batch safety logging, salt and active ingredient index searches'],
                  ['Auto Parts', '✓', 'Part catalog numbers, VIN search, assembly line process tracking'],
                  ['Food Processing', '✓', 'Cold chain logging, batch recall, storage temperature limits'],
                  ['Chemical Plant', '✓', 'General recipe manufacturing, chemical batch logs, quality control'],
                  ['E-commerce', '✗', 'Not supported. (Use Shopify or WooCommerce paired with QuickBooks instead)'],
                  ['Restaurant Chain', '✗', 'Not supported. (Use a dedicated food-service POS instead)'],
                  ['Freelancers', '✗', 'Not supported. (Use Wave or Zoho Books instead)'],
                  ['Law Firm', '✗', 'Not supported. (Use Clio or PracticePanther instead)'],
                ].map(([industry, status, notes]) => (
                  <tr key={industry} className="hover:bg-white/[0.01]">
                    <td className="p-4 font-semibold text-white">{industry}</td>
                    <td className="p-4 text-center font-bold text-sm">
                      <span className={status === '✓' ? 'text-[#60A5FA]' : 'text-red-500'}>{status}</span>
                    </td>
                    <td className="p-4 text-gray-400">{notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* How to choose */}
        <section className="px-6 py-12 max-w-4xl mx-auto border-t border-white/5">
          <h2 className="text-xl md:text-2xl font-black text-center mb-8 uppercase tracking-wide">
            How to Choose Between Noxis Hub and Other Options
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-[#0F1114] border border-white/5 rounded-sm">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-[#60A5FA]">If your priority is:</h3>
              <ul className="space-y-3 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-[#60A5FA] font-bold">→</span>
                  <span><strong>Karigar management:</strong> Noxis Hub (built explicitly for karkhanas)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#60A5FA] font-bold">→</span>
                  <span><strong>Offline operation in Pakistan:</strong> Noxis Hub or TallyPrime</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#60A5FA] font-bold">→</span>
                  <span><strong>Cheapest basic invoicing:</strong> Vyapar (note: lacks advanced bookkeeping)</span>
                </li>
              </ul>
            </div>

            <div className="p-6 bg-[#0F1114] border border-white/5 rounded-sm">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-gray-400">Alternative fits:</h3>
              <ul className="space-y-3 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-[#60A5FA] font-bold">→</span>
                  <span><strong>Pharma distribution:</strong> Marg ERP (highly specialized for retail pharmacies)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#60A5FA] font-bold">→</span>
                  <span><strong>Multi-country enterprise:</strong> SAP or Oracle NetSuite</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#60A5FA] font-bold">→</span>
                  <span><strong>Pure rapid bookkeeping:</strong> TallyPrime (highly popular with auditors)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#60A5FA] font-bold">→</span>
                  <span><strong>Simple mobile invoicing:</strong> Vyapar</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Why we tell you this */}
        <section className="px-6 py-16 bg-[#0A0C0F] border-t border-white/5 text-center">
          <h2 className="text-xl md:text-2xl font-black text-white mb-4 tracking-tight uppercase">
            Why We Tell You This
          </h2>
          <p className="max-w-2xl mx-auto text-xs text-gray-400 leading-relaxed mb-8">
            We would rather send you to the right software than sell you the wrong one. If Noxis Hub is not the right fit for your business, we will tell you honestly and suggest a better alternative. 
            <br /><br />
            If it <strong>is</strong> the right fit, contact us via WhatsApp:
          </p>
          <div className="max-w-md mx-auto p-6 bg-[#0F1114] border border-white/5 rounded-sm">
            <p className="text-sm font-bold text-[#60A5FA] mb-4">+92 326 474 2678</p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              We install and configure the system personally at your factory site. You only pay for the software subscription if it completely resolves your operational requirements.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 text-center">
          <Link
            href="https://wa.me/923264742678?text=I+read+the+who-is-it-for+assessment+and+want+to+try+Noxis+Hub"
            target="_blank"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#60A5FA] text-black font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/10"
          >
            💬 Contact via WhatsApp
          </Link>
        </section>
      </main>
    </>
  )
}
