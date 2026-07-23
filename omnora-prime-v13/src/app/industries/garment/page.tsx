import type { Metadata } from 'next'
import Script from 'next/script'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Garment Factory Software Pakistan — Noxis Hub | Stitching Unit ERP',
  description: 'Best stitching unit and readymade garments ERP software in Pakistan. Manage custom piece-rate salaries, karigar advances, cutting room counts, and client dispatch.',
  keywords: [
    'garment factory software',
    'stitching unit management software',
    'readymade garments ERP Pakistan',
    'apparel karkhana software',
    'tailoring unit payroll software',
    'garment inventory software',
    'stitching factory Lahore',
    'garment ERP Karachi',
  ],
  openGraph: {
    title: 'Garment Factory Software Pakistan — Noxis Hub',
    description: 'Track stitching production, cutting logs, and piece-rate worker payroll offline.',
    url: 'https://noxishub.app/industries/garment',
  },
  alternates: {
    canonical: '/industries/garment',
  },
}

export default function GarmentPage() {
  return (
    <>
      <Script
        id="garment-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Garment Factory Software Pakistan',
            description: 'Noxis Hub provides specialized piece-rate tailoring payroll, cutting room stock logs, and finished apparel barcode inventory for Pakistani factories.',
            url: 'https://noxishub.app/industries/garment',
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://noxishub.app' },
                { '@type': 'ListItem', position: 2, name: 'Industries', item: 'https://noxishub.app/industries' },
                { '@type': 'ListItem', position: 3, name: 'Garment Factory', item: 'https://noxishub.app/industries/garment' },
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
            👕 Garments & Stitching Units
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Garment Factory ERP{' '}
            <span className="text-[#60A5FA]">
              Designed for Pakistan
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-8 font-medium">
            Manage cutting ratios, stitching counts, finished cartons, and dynamic piece-rate karigar payroll. Track advances and mark attendance fully offline from the factory floor.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-12 relative z-10">
            <Link
              href="https://wa.me/923264742678?text=I+want+a+demo+of+Noxis+Hub+for+my+garment+factory"
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
            How Stitching Karkhanas Streamline Operations
          </h2>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 text-center mb-12 max-w-2xl mx-auto">
            Traditional registers fail to handle the dynamic piece-rate payroll structure of garments factories.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                problem: 'Calculating stitcher wages based on piece-rate per collar/cuff/body is slow and prone to errors',
                solution: 'Digital logging by operation. Wage is automatically calculated per piece completed.',
              },
              {
                problem: 'Tracking fabric rolls issued to cutting rooms vs cut pieces obtained is inaccurate',
                solution: 'Dynamic inventory. Input issued yards and get predicted/actual cut outputs.',
              },
              {
                problem: 'Client order tracking gets lost between cutting, stitching, washing, and packaging stages',
                solution: 'Workflow phase updates. Monitor what percentage of each bundle is at which stage.',
              },
              {
                problem: 'Manual bookkeeping of employee advances (peshgi) gets lost or leads to disputes',
                solution: 'Peshgi ledger module. Automatically deducts advances from the worker payroll.',
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

        {/* Features */}
        <section className="px-6 py-20 bg-[#0A0C0F] border-y border-white/5">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-12 text-center uppercase tracking-tight">
              Garments Factory Modules
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: '✂️',
                  title: 'Cutting Room Log',
                  points: [
                    'Record fabric consumption in yards',
                    'Log cutting ratios (S, M, L, XL)',
                    'Manage bundle generation with barcodes',
                    'Monitor wastage rates per batch',
                  ],
                },
                {
                  icon: '🧵',
                  title: 'Piece-Rate Salaries',
                  points: [
                    'Define rates per specific operation',
                    'Log worker production sheets digitally',
                    'Automatic weekly advance deductions',
                    'Urdu payslips print/export options',
                  ],
                },
                {
                  icon: '📦',
                  title: 'Finished Inventory',
                  points: [
                    'Monitor washers/packers outputs',
                    'Box-level barcodes for ready cartons',
                    'Manage customer dispatch orders',
                    'WhatsApp dispatch notes and billing',
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
            Plans for Stitching Units
          </h2>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-12">
            Pricing matching your stitching machine capacity. Free installation.
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
                  href={`https://wa.me/923264742678?text=I+want+${plan.name}+plan+for+my+garments+factory`}
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
            Ready to Modernize Your Garment Factory?
          </h2>
          <p className="text-xs font-medium text-gray-500 mb-8 max-w-xl mx-auto leading-relaxed">
            We install the system, set up your size ratios, and train your floor supervisors.
          </p>
          <Link
            href="https://wa.me/923264742678?text=I+want+to+see+Noxis+Hub+for+my+stitching+unit"
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
