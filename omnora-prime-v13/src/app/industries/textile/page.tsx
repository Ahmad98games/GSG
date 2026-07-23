import type { Metadata } from 'next'
import Script from 'next/script'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Textile Mill ERP Software Pakistan — Noxis Hub | Kapra Factory Software',
  description: 'Best textile mill management software in Pakistan. Track weaving production, karigar wages, piece-rates, beam/warp stock, and offline sales. PKR 25,000/year.',
  keywords: [
    'textile mill software Pakistan',
    'kapra factory software',
    'weaving mill ERP',
    'power loom software Pakistan',
    'sizing mill software Faisalabad',
    'textile karigar software',
    'textile payroll software',
    'textile mill ERP Lahore',
    'textile software Karachi',
  ],
  openGraph: {
    title: 'Textile Mill ERP Software Pakistan — Noxis Hub',
    description: 'Track weaving production, loom efficiency, and piece-rate karigar wages completely offline.',
    url: 'https://noxishub.app/industries/textile',
  },
  alternates: {
    canonical: '/industries/textile',
  },
}

export default function TextilePage() {
  return (
    <>
      <Script
        id="textile-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Textile Mill ERP Software Pakistan',
            description: 'Noxis Hub provides specialized loom monitoring, karigar piece-rate tracking, and raw yarn inventory control for Pakistani weaving mills.',
            url: 'https://noxishub.app/industries/textile',
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://noxishub.app' },
                { '@type': 'ListItem', position: 2, name: 'Industries', item: 'https://noxishub.app/industries' },
                { '@type': 'ListItem', position: 3, name: 'Textile Mill', item: 'https://noxishub.app/industries/textile' },
              ],
            },
          })
        }}
      />

      <main className="min-h-screen bg-[#060708] text-white">
        {/* Hero */}
        <section className="px-6 pt-32 pb-20 max-w-5xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-[#60A5FA]/5 blur-[120px] rounded-full max-w-lg mx-auto pointer-events-none" />
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#60A5FA]/10 border border-[#60A5FA]/20 text-[#60A5FA] text-xs font-bold uppercase tracking-widest mb-6">
            🧵 Textile Weaving & Looms
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Textile ERP Software{' '}
            <span className="text-[#60A5FA]">
              Built for Pakistan
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-8 font-medium">
            Manage loom efficiency, warp/weft inventory, yarn stock, and piece-rate karigar wages. Run your entire weaving mill or sizing unit on an offline-first system built for Faisalabad and Karachi.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-12 relative z-10">
            <Link
              href="https://wa.me/923264742678?text=I+want+a+demo+of+Noxis+Hub+for+my+textile+mill"
              target="_blank"
              className="px-8 py-4 bg-[#60A5FA] text-black font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/10"
            >
              📱 WhatsApp for Demo
            </Link>
            <Link
              href="/download"
              className="px-8 py-4 border border-white/20 text-white font-bold text-sm uppercase tracking-widest rounded-sm hover:border-white/40 hover:bg-white/[0.02] transition-colors"
            >
              Free Download
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] uppercase tracking-widest font-bold text-gray-600">
            <span>✓ Works offline</span>
            <span>✓ PKR 25,000/year</span>
            <span>✓ Free installation</span>
            <span>✓ WhatsApp support</span>
            <span>✓ Windows 8.1+</span>
          </div>
        </section>

        {/* Problems */}
        <section className="px-6 py-20 max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-3 text-center">
            Challenges Weaving Mills Solve with Noxis
          </h2>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 text-center mb-12 max-w-2xl mx-auto">
            Traditional registers fail to handle the dynamic piece-rate payroll structure of Pakistani karkhanas.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                problem: 'Weaver production outputs (picks/meters) are miscalculated on paper registers',
                solution: 'Digital logging by loom number. Wage is automatically calculated per pick/meter.',
              },
              {
                problem: 'Yarn bag issues to sizing units and loom allocations get mixed up',
                solution: 'Dynamic inventory tracking. Deducts yarn bags automatically as warp beams are completed.',
              },
              {
                problem: 'Workers demand peshgi (advances) weekly and payroll calculations take days',
                solution: 'Built-in Peshgi Ledger. Advances are automatically deducted from the final monthly paycheck.',
              },
              {
                problem: 'Loom production stops when the internet goes out',
                solution: 'Noxis Hub runs 100% offline at the factory floor. Supervisors log loom runs without delay.',
              },
            ].map((item, i) => (
              <div key={i} className="p-6 bg-[#0F1114] border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#E53E3E] opacity-40 group-hover:opacity-100 transition-opacity" />
                <p className="text-xs font-semibold text-red-400 mb-3 flex items-start gap-2 leading-relaxed">
                  <span className="flex-shrink-0">✗</span>
                  {item.problem}
                </p>
                <p className="text-xs font-semibold text-emerald-400 flex items-start gap-2 leading-relaxed">
                  <span className="flex-shrink-0">✓</span>
                  {item.solution}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Loom Features */}
        <section className="px-6 py-20 bg-[#0A0C0F] border-y border-white/5">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-12 text-center uppercase tracking-tight">
              Weaving ERP Capabilities
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: '🏗️',
                  title: 'Loom Allocation',
                  points: [
                    'Allocate beams and qualities to specific looms',
                    'Track loom status (active, down, maintenance)',
                    'Monitor daily meters/picks produced per loom',
                    'Efficiency alerts for underperforming looms',
                  ],
                },
                {
                  icon: '🧵',
                  title: 'Yarn & Beam Stock',
                  points: [
                    'Track yarn bags by count and brand',
                    'Record warp and weft yarn consumption',
                    'Monitor sized beams inventory',
                    'Automatic alerts for low raw stock levels',
                  ],
                },
                {
                  icon: '💵',
                  title: 'Piece-Rate Wages',
                  points: [
                    'Weaver payroll based on exact pick/meter counts',
                    'Peshgi (advance) ledger with weekly records',
                    'Helper and supervisor fixed/daily salary logs',
                    'Generate print-ready payslips in Urdu/English',
                  ],
                },
              ].map(feature => (
                <div key={feature.title} className="p-6 bg-[#0F1114] border border-white/5 rounded-sm hover:border-[#60A5FA]/20 transition-all">
                  <span className="text-3xl block mb-3">{feature.icon}</span>
                  <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">
                    {feature.title}
                  </h3>
                  <ul className="space-y-2">
                    {feature.points.map(p => (
                      <li key={p} className="text-xs text-gray-500 flex items-start gap-2 leading-relaxed">
                        <span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="px-6 py-20 max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
            Plans for Textile Factories
          </h2>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-12">
            Pricing matching your loom capacity. Contact for installation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                name: 'Lite',
                price: '25,000',
                per: 'per year',
                devices: 'Up to 5 devices',
                cameras: '2 CCTV channels',
                highlight: false,
              },
              {
                name: 'Pro',
                price: '60,000',
                per: 'per year',
                devices: 'Up to 15 devices',
                cameras: '4 CCTV channels',
                highlight: true,
              },
              {
                name: 'Elite',
                price: '1,20,000',
                per: 'per year',
                devices: 'Up to 50 devices',
                cameras: '6 CCTV channels',
                highlight: false,
              },
            ].map(plan => (
              <div key={plan.name} className={`p-6 rounded-sm border text-center relative ${
                plan.highlight
                  ? 'bg-[#60A5FA]/5 border-[#60A5FA]/30'
                  : 'bg-[#0F1114] border-white/5'
              }`}>
                {plan.highlight && (
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#60A5FA] mb-3">
                    Most Popular
                  </p>
                )}
                <p className="text-sm font-bold text-white mb-1 uppercase tracking-wider">{plan.name}</p>
                <p className="text-2xl font-black text-white font-mono mb-1">PKR {plan.price}</p>
                <p className="text-[10px] uppercase font-bold text-gray-600 mb-4">{plan.per}</p>
                <div className="text-xs text-gray-500 space-y-1.5 mb-6 leading-relaxed">
                  <p>{plan.devices}</p>
                  <p>{plan.cameras}</p>
                  <p>All features included</p>
                </div>
                <Link
                  href={`https://wa.me/923264742678?text=I+want+${plan.name}+plan+for+my+textile+mill`}
                  target="_blank"
                  className={`block w-full py-3 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors ${
                    plan.highlight
                      ? 'bg-[#60A5FA] text-black hover:bg-blue-400'
                      : 'border border-white/10 text-white hover:border-white/20 hover:bg-white/[0.01]'
                  }`}
                >
                  Get {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 bg-[#0A0C0F] border-t border-white/5 text-center relative">
          <div className="absolute inset-0 bg-[#60A5FA]/2 blur-[100px] pointer-events-none" />
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4 tracking-tight">
            Modernize Your Textile Weaving Mill
          </h2>
          <p className="text-xs font-medium text-gray-500 mb-8 max-w-xl mx-auto leading-relaxed">
            We install the system, set up your loom sheets, and train your supervisors in Faisalabad, Karachi, or Lahore.
          </p>
          <Link
            href="https://wa.me/923264742678?text=I+want+to+see+Noxis+Hub+for+my+weaving+mill"
            target="_blank"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#60A5FA] text-black font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/10"
          >
            💬 WhatsApp — Free Demo
          </Link>
        </section>
      </main>
    </>
  )
}
