import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Multi-Branch Factory Management — Noxis Hub | Pakistan & UAE',
  description: 'Noxis Hub supports multiple factory branches across Pakistan and UAE from one central system. Consolidate reports, control access per branch, and sync in real time.',
  keywords: [
    'multi branch ERP Pakistan',
    'factory software multiple locations',
    'ERP Pakistan UAE both countries',
    'multi location manufacturing software',
    'Lahore Karachi factory management',
    'Pakistan UAE business ERP',
  ],
  alternates: { canonical: '/features/multi-branch' },
}

export default function MultiBranchPage() {
  return (
    <>
      <Script
        id="multi-branch-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Multi-Branch Factory Management — Noxis Hub',
            description: 'Noxis Hub supports multiple factory branches across Pakistan and UAE from one central system.',
            url: 'https://noxishub.app/features/multi-branch',
          })
        }}
      />

      <main className="min-h-screen bg-[#060708] text-white">
        {/* Hero */}
        <section className="px-6 pt-32 pb-16 max-w-5xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-[#60A5FA]/5 blur-[120px] rounded-full max-w-lg mx-auto pointer-events-none" />
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#60A5FA]/10 border border-[#60A5FA]/20 text-[#60A5FA] text-xs font-bold uppercase tracking-widest mb-6">
            🌐 Multi-Branch & Global Ops
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Manage Multiple Factory Branches <br className="hidden md:inline" />
            <span className="text-[#60A5FA]">from One Screen</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-8 font-medium">
            Noxis Hub is not just for single-location factories. It is built for businesses that operate across multiple cities in Pakistan — or across Pakistan and UAE simultaneously.
          </p>

          <div className="flex flex-wrap gap-4 justify-center relative z-10">
            <Link
              href="https://wa.me/923264742678?text=I+want+to+know+more+about+multi-branch+setup"
              target="_blank"
              className="px-8 py-4 bg-[#60A5FA] text-black font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/10"
            >
              💬 WhatsApp — Consult Expert
            </Link>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="px-6 py-16 max-w-5xl mx-auto border-t border-white/5">
          <h2 className="text-2xl md:text-3xl font-black mb-12 text-center uppercase tracking-wide">
            How Multi-Branch Works in Noxis Hub
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Scenario 1 */}
            <div className="p-6 bg-[#0F1114] border border-white/5 rounded-sm flex flex-col justify-between">
              <div>
                <span className="text-[#60A5FA] font-bold text-xs uppercase tracking-widest block mb-2">Scenario 01</span>
                <h3 className="text-lg font-bold mb-4 text-white">Two Factories in Pakistan</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  <strong>Faisalabad:</strong> Production facility. <br />
                  <strong>Lahore:</strong> Finishing, packaging, and dispatch.
                </p>
                <div className="border-t border-white/5 pt-4">
                  <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wide">How Noxis Handles It:</h4>
                  <ul className="space-y-2 text-xs text-gray-400 list-disc list-inside">
                    <li>Each location has its own local PC Hub.</li>
                    <li>Both sync to a single Supabase cloud database.</li>
                    <li>The owner sees a consolidated P&L from Lahore.</li>
                    <li>Faisalabad managers see only their local production logs.</li>
                    <li>Inter-branch stock transfers and separate payroll are fully tracked.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Scenario 2 */}
            <div className="p-6 bg-[#0F1114] border border-white/5 rounded-sm flex flex-col justify-between">
              <div>
                <span className="text-[#60A5FA] font-bold text-xs uppercase tracking-widest block mb-2">Scenario 02</span>
                <h3 className="text-lg font-bold mb-4 text-white">Pakistan Factory + UAE Office</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  <strong>Lahore:</strong> Manufacturing base. <br />
                  <strong>Dubai:</strong> Customer-facing sales office.
                </p>
                <div className="border-t border-white/5 pt-4">
                  <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wide">How Noxis Handles It:</h4>
                  <ul className="space-y-2 text-xs text-gray-400 list-disc list-inside">
                    <li>Lahore Hub operates in PKR (GST 17%).</li>
                    <li>Dubai Hub operates in AED (VAT 5%).</li>
                    <li>Single click switches currency and localized tax compliance.</li>
                    <li>Shared party database via cloud-level sync.</li>
                    <li>Dubai creates invoices in AED; Lahore views them in PKR automatically.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Scenario 3 */}
            <div className="p-6 bg-[#0F1114] border border-white/5 rounded-sm flex flex-col justify-between">
              <div>
                <span className="text-[#60A5FA] font-bold text-xs uppercase tracking-widest block mb-2">Scenario 03</span>
                <h3 className="text-lg font-bold mb-4 text-white">Factory + Warehouse + Showroom</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  <strong>Production:</strong> Main factory. <br />
                  <strong>Storage & Retail:</strong> Offsite warehouse and sales showroom.
                </p>
                <div className="border-t border-white/5 pt-4">
                  <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wide">How Noxis Handles It:</h4>
                  <ul className="space-y-2 text-xs text-gray-400 list-disc list-inside">
                    <li>Tracks physical stock transfers seamlessly between all three.</li>
                    <li>Role-Based Access (RBAC) scopes access for each location.</li>
                    <li>Warehouse logs dispatch; showroom triggers retail customer invoicing.</li>
                    <li>Real-time sync keeps the master inventory numbers accurate.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* When you need a different system */}
        <section className="px-6 py-16 max-w-4xl mx-auto border-t border-white/5">
          <h2 className="text-2xl md:text-3xl font-black mb-6 text-center uppercase tracking-wide text-gray-300">
            When You Need a Different System
          </h2>
          <p className="text-xs text-gray-400 text-center mb-10 max-w-2xl mx-auto leading-relaxed">
            Honesty builds trust. Noxis Hub is engineered for fast-paced mid-market manufacturing, not international enterprise conglomerates.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-red-500/[0.02] border border-red-500/10 rounded-sm">
              <h3 className="text-sm font-bold text-red-400 mb-4 uppercase tracking-wider">Noxis Hub is NOT built for:</h3>
              <ul className="space-y-3 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✗</span>
                  Corporations with 50+ separate legal entities across 10+ countries requiring consolidated financial statements under IFRS.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✗</span>
                  Businesses requiring real-time API integration with global logistics platforms like FedEx, DHL, or Amazon Marketplace.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✗</span>
                  Public companies requiring SEC or SECP regulatory reporting modules.
                </li>
              </ul>
              <p className="text-[11px] text-gray-500 mt-6 leading-relaxed">
                * For these cases, SAP S/4HANA or Oracle NetSuite are the appropriate choices, costing $100,000–$1,000,000+ to implement.
              </p>
            </div>

            <div className="p-6 bg-[#60A5FA]/[0.02] border border-[#60A5FA]/10 rounded-sm">
              <h3 className="text-sm font-bold text-[#60A5FA] mb-4 uppercase tracking-wider">Noxis Hub is built for:</h3>
              <ul className="space-y-3 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-[#60A5FA]">✓</span>
                  Businesses running between 1 to 50 factory locations.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#60A5FA]">✓</span>
                  Factories in Pakistan, UAE, Saudi Arabia, Bangladesh, and UK (for Pakistani diaspora).
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#60A5FA]">✓</span>
                  Manufacturing, processing, and distribution businesses with 10 to 5,000 workers.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#60A5FA]">✓</span>
                  Owners who prioritize full data ownership over hosted pure-cloud SaaS services.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Technical Architecture */}
        <section className="px-6 py-16 bg-[#0A0C0F] border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black mb-10 text-center uppercase tracking-wide text-white">
              Technical Architecture for Multi-Branch
            </h2>

            <div className="space-y-8 text-xs text-gray-400 leading-relaxed">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-[#0F1114] border border-white/5 rounded-sm">
                  <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wide">1. Local PC Hub</h4>
                  <p>Each branch runs a local instance of the Noxis Hub (built on Electron + Next.js + SQLite). Databases are isolated and encrypted at rest with SQLCipher.</p>
                </div>
                <div className="p-4 bg-[#0F1114] border border-white/5 rounded-sm">
                  <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wide">2. Cloud Sync</h4>
                  <p>Branches sync to a shared Supabase PostgreSQL database when online. Row Level Security (RLS) ensures clean branch-scoped access and data isolation.</p>
                </div>
                <div className="p-4 bg-[#0F1114] border border-white/5 rounded-sm">
                  <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wide">3. Remote Access</h4>
                  <p>Cloudflare CDN serves the public interface, Cloudflare Tunnels secure remote connections, and Cloudflare R2 stores and distributes APK and EXE updates.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
            Connect Your Branches Today
          </h2>
          <p className="text-xs font-semibold text-gray-500 mb-8 max-w-xl mx-auto">
            We help you connect multiple locations with our custom localized hub-and-spoke setup.
          </p>
          <Link
            href="https://wa.me/923264742678?text=I+want+to+setup+multi-branch+noxis+hub+for+my+factory"
            target="_blank"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#60A5FA] text-black font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/10"
          >
            💬 WhatsApp Multi-Branch Consultation
          </Link>
        </section>
      </main>
    </>
  )
}
