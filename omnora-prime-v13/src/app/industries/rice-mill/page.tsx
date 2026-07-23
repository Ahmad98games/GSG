import type { Metadata } from 'next'
import Script from 'next/script'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Rice Mill Software Pakistan — Noxis Hub | Chawal Mill ERP',
  description: 'Best rice mill management software in Pakistan. Manage mazdoors, paddy inventory, yield tracking, and dispatch from one system. Works offline. PKR 25,000/year. Free demo.',
  keywords: [
    'rice mill software Pakistan',
    'chawal mill management software',
    'rice processing ERP',
    'paddy inventory software',
    'rice mill attendance software',
    'mazdoor management software',
    'rice yield tracking software',
    'rice mill software Lahore',
    'rice mill software Punjab',
    'rice mill software Sindh',
    'shaheen rice mill software',
  ],
  openGraph: {
    title: 'Rice Mill Software Pakistan — Noxis Hub',
    description: 'Manage your rice mill with the only software built specifically for Pakistani rice processors.',
    url: 'https://noxishub.app/industries/rice-mill',
  },
  alternates: {
    canonical: '/industries/rice-mill',
  },
}

export default function RiceMillPage() {
  return (
    <>
      <Script
        id="rice-mill-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Rice Mill Software Pakistan',
            description: 'Noxis Hub is the leading rice mill management software in Pakistan with paddy inventory, mazdoor management, yield tracking, and offline operation.',
            url: 'https://noxishub.app/industries/rice-mill',
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://noxishub.app' },
                { '@type': 'ListItem', position: 2, name: 'Industries', item: 'https://noxishub.app/industries' },
                { '@type': 'ListItem', position: 3, name: 'Rice Mill', item: 'https://noxishub.app/industries/rice-mill' },
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
            🌾 Rice Mill Industry
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Rice Mill Software{' '}
            <span className="text-[#60A5FA] bg-clip-text">
              Built for Pakistan
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-8 font-medium">
            The only ERP software designed specifically for Pakistani rice mills and processing units. Manage paddy inventory, mazdoor attendance, yield tracking, and dispatch — all in one system that works without internet.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-12 relative z-10">
            <Link
              href="https://wa.me/923264742678?text=I+want+a+demo+of+Noxis+Hub+for+my+rice+mill"
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

        {/* The problem this solves */}
        <section className="px-6 py-20 max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-3 text-center">
            What Rice Mill Owners in Pakistan Struggle With
          </h2>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 text-center mb-12 max-w-2xl mx-auto">
            We interviewed rice mill owners across Punjab and Sindh. These are the problems they told us about.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                problem: 'Mazdoor attendance is tracked in a register that gets lost or filled with errors',
                solution: 'Digital attendance on phone. 50 mazdoors marked in 2 minutes.',
              },
              {
                problem: 'No way to know exactly how much paddy came in vs how much rice went out',
                solution: 'Paddy-to-rice yield tracking with batch numbers and quality grades.',
              },
              {
                problem: 'Buyers ask for their outstanding balance and you have to search through files',
                solution: 'One tap sends the buyer a WhatsApp message with their exact balance and a link to their personal portal.',
              },
              {
                problem: 'When internet goes down, the software stops working',
                solution: 'Noxis works completely without internet. Syncs to cloud when connection returns.',
              },
              {
                problem: 'Monthly wages and peshgi deductions are calculated on paper and often wrong',
                solution: 'Automatic payroll with daily rates, peshgi deductions, and printable payslips.',
              },
              {
                problem: 'No way to know stock levels without physically counting bags',
                solution: 'Real-time inventory with alerts when stock falls below your minimum level.',
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

        {/* Features specific to rice mills */}
        <section className="px-6 py-20 bg-[#0A0C0F] border-y border-white/5">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-12 text-center uppercase tracking-tight">
              How Noxis Hub Works for Rice Mills
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: '🌾',
                  title: 'Paddy Inventory',
                  points: [
                    'Track paddy by variety (IRRI, Basmati, 1121)',
                    'Record moisture content and grade on receipt',
                    'Batch numbers for every incoming load',
                    'Automatic yield calculation (paddy to rice)',
                  ],
                },
                {
                  icon: '👷',
                  title: 'Mazdoor Management',
                  points: [
                    'Daily attendance on phone in 2 minutes',
                    'Daily wage rates per mazdoor',
                    'Peshgi advance tracking',
                    'Monthly payroll with automatic deductions',
                  ],
                },
                {
                  icon: '📦',
                  title: 'Rice Dispatch',
                  points: [
                    'Issue dispatch orders by bag count',
                    'Delivery challan PDF in one click',
                    'Party-wise balance tracking',
                    'WhatsApp invoice with portal link',
                  ],
                },
                {
                  icon: '📊',
                  title: 'Season Reports',
                  points: [
                    'Profit and loss by season',
                    'Revenue vs last year comparison',
                    'Top buyers by volume',
                    'Cash flow by month',
                  ],
                },
                {
                  icon: '📡',
                  title: 'Offline First',
                  points: [
                    'Works when internet is gone',
                    'All data on local machine',
                    'Syncs to cloud when connected',
                    'Data never lost even on power cut',
                  ],
                },
                {
                  icon: '🔒',
                  title: 'Secure & Private',
                  points: [
                    'Data stays on your PC',
                    'Encrypted local storage',
                    'Role-based access for staff',
                    'Audit log of every action',
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
            Simple Pricing for Rice Mills
          </h2>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-12">
            Pay once per year. Free installation. WhatsApp support included.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                name: 'Lite',
                price: '25,000',
                per: 'per year',
                devices: '5 PCs',
                cameras: '2 cameras',
                highlight: false,
              },
              {
                name: 'Pro',
                price: '60,000',
                per: 'per year',
                devices: '15 PCs',
                cameras: '4 cameras',
                highlight: true,
              },
              {
                name: 'Elite',
                price: '1,20,000',
                per: 'per year',
                devices: '50 PCs',
                cameras: '6 cameras',
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
                  href={`https://wa.me/923264742678?text=I+want+${plan.name}+plan+for+my+rice+mill`}
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

          <p className="text-xs text-gray-600">
            Not sure which plan?{' '}
            <Link
              href="https://wa.me/923264742678"
              target="_blank"
              className="text-[#60A5FA] hover:underline font-bold"
            >
              WhatsApp us
            </Link>{' '}
            — we will recommend the right one for your mill size.
          </p>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 bg-[#0A0C0F] border-t border-white/5 text-center relative">
          <div className="absolute inset-0 bg-[#60A5FA]/2 blur-[100px] pointer-events-none" />
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4 tracking-tight">
            Ready to Modernize Your Rice Mill?
          </h2>
          <p className="text-xs font-medium text-gray-500 mb-8 max-w-xl mx-auto leading-relaxed">
            We install the software at your mill, set everything up, and train your staff. You are running on the same day.
          </p>
          <Link
            href="https://wa.me/923264742678?text=I+want+to+see+Noxis+Hub+for+my+rice+mill"
            target="_blank"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#60A5FA] text-black font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/10"
          >
            💬 WhatsApp — Free Demo
          </Link>
          <p className="text-[10px] uppercase font-bold text-gray-700 tracking-wider mt-4">
            +92 326 474 2678 · Responds within 2 hours · Available in Urdu and English
          </p>
        </section>
      </main>
    </>
  )
}
