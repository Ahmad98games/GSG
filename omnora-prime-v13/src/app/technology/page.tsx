import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Technology Behind Noxis Hub — Offline-First ERP Architecture',
  description: 'How Noxis Hub works technically: SQLite local database, Cloudflare edge hosting, Supabase real-time sync, Electron desktop, and WebRTC mobile bridge.',
  keywords: [
    'offline first ERP architecture',
    'SQLite ERP Pakistan',
    'Electron ERP software',
    'local first software manufacturing',
    'Noxis Hub technology',
  ],
  alternates: { canonical: '/technology' },
}

export default function TechnologyPage() {
  return (
    <>
      <Script
        id="technology-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Technology Behind Noxis Hub — Offline-First ERP Architecture',
            description: 'How Noxis Hub works technically: SQLite local database, Cloudflare edge hosting, Supabase real-time sync, Electron desktop, and WebRTC mobile bridge.',
            url: 'https://noxishub.app/technology',
          })
        }}
      />

      <main className="min-h-screen bg-[#060708] text-white">
        {/* Hero */}
        <section className="px-6 pt-32 pb-16 max-w-5xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-[#60A5FA]/5 blur-[120px] rounded-full max-w-lg mx-auto pointer-events-none" />
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#60A5FA]/10 border border-[#60A5FA]/20 text-[#60A5FA] text-xs font-bold uppercase tracking-widest mb-6">
            ⚙️ Tech Stack & Architecture
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            How Noxis Hub Works: <br className="hidden md:inline" />
            <span className="text-[#60A5FA]">Offline-First ERP Architecture</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-8 font-medium">
            This page is for technical buyers, IT managers, and investors who want to understand how Noxis Hub is built.
          </p>

          <div className="flex flex-wrap gap-4 justify-center relative z-10">
            <Link
              href="https://wa.me/923264742678?text=Technical+question+about+Noxis+Hub+architecture"
              target="_blank"
              className="px-8 py-4 bg-[#60A5FA] text-black font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/10"
            >
              💬 Talk to Tech Lead on WhatsApp
            </Link>
          </div>
        </section>

        {/* Architecture Section */}
        <section className="px-6 py-16 max-w-5xl mx-auto border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-black mb-6 uppercase tracking-wide">
              The Hub-and-Spoke Architecture
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Noxis Hub implements a robust <strong>Local-First Hub-and-Spoke Topology</strong> to guarantee uninterrupted operation in environment conditions where internet connectivity is highly volatile.
            </p>
            <ul className="space-y-3 text-xs text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-[#60A5FA] font-bold">•</span>
                <span><strong>The Hub (Local PC):</strong> A primary Windows desktop node runs the local server instance, storing all business and transactional records.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#60A5FA] font-bold">•</span>
                <span><strong>The Spokes (Mobile devices):</strong> Companion devices connect directly over the local area network (LAN) to sync production data and attendance in real time.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#60A5FA] font-bold">•</span>
                <span><strong>Cloud Backup:</strong> The cloud database serves as an asynchronous read-replica replication backup layer, not a hard runtime dependency.</span>
              </li>
            </ul>
          </div>

          {/* Architecture Diagram SVG */}
          <div className="p-6 bg-[#0F1114] border border-white/5 rounded-sm flex items-center justify-center">
            <svg viewBox="0 0 500 350" className="w-full max-w-md h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Nodes */}
              <rect x="180" y="140" width="140" height="60" rx="4" fill="#0E1726" stroke="#60A5FA" strokeWidth="2" />
              <text x="250" y="175" fill="#60A5FA" fontSize="11" fontWeight="bold" textAnchor="middle">Local PC Hub (Server)</text>
              
              <rect x="40" y="40" width="100" height="40" rx="4" fill="#0E1726" stroke="#4B5563" strokeWidth="1" />
              <text x="90" y="65" fill="#9CA3AF" fontSize="10" textAnchor="middle">Supervisor Phone</text>

              <rect x="40" y="240" width="100" height="40" rx="4" fill="#0E1726" stroke="#4B5563" strokeWidth="1" />
              <text x="90" y="265" fill="#9CA3AF" fontSize="10" textAnchor="middle">Weighing Scale</text>

              <rect x="360" y="40" width="100" height="40" rx="4" fill="#0E1726" stroke="#10B981" strokeWidth="1" />
              <text x="410" y="65" fill="#10B981" fontSize="10" textAnchor="middle">Cloud Sync (Supabase)</text>

              <rect x="360" y="240" width="100" height="40" rx="4" fill="#0E1726" stroke="#10B981" strokeWidth="1" />
              <text x="410" y="265" fill="#10B981" fontSize="10" textAnchor="middle">Owner (Anywhere)</text>

              {/* Connectors */}
              {/* LAN links */}
              <path d="M 140 60 L 180 150" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="4" />
              <text x="140" y="105" fill="#60A5FA" fontSize="9" fontWeight="bold">Local WiFi</text>

              <path d="M 140 260 L 180 190" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="4" />
              <text x="140" y="235" fill="#60A5FA" fontSize="9" fontWeight="bold">Local WiFi</text>

              {/* WAN Sync */}
              <path d="M 320 160 L 360 65" stroke="#10B981" strokeWidth="1.5" />
              <text x="350" y="125" fill="#10B981" fontSize="9" fontWeight="bold">Internet</text>

              {/* WAN Owner */}
              <path d="M 320 180 L 360 250" stroke="#10B981" strokeWidth="1.5" />
              <text x="355" y="215" fill="#10B981" fontSize="9" fontWeight="bold">Tunnels</text>
            </svg>
          </div>
        </section>

        {/* Database Section */}
        <section className="px-6 py-16 max-w-4xl mx-auto border-t border-white/5">
          <h2 className="text-xl md:text-2xl font-black mb-6 uppercase tracking-wide">
            Why SQLite and Not a Cloud Database
          </h2>
          <div className="space-y-6 text-xs text-gray-400 leading-relaxed">
            <p>
              Traditional cloud ERPs degrade or lock up completely when the internet connection drops. Noxis Hub solves this by utilizing SQLite as its core, zero-config relational storage database engine.
            </p>
            <ul className="space-y-4">
              <li>
                <strong className="text-white block mb-1">Battle-tested Reliability:</strong>
                SQLite is the most widely deployed database engine globally, running on billions of mobile devices and browsers. It is transactional, fully ACID-compliant, and self-contained.
              </li>
              <li>
                <strong className="text-white block mb-1">State-of-the-art Encryption:</strong>
                Our desktop database is encrypted with SQLCipher using 256-bit AES encryption. Even in the event of hardware theft, business transactions and payroll databases remain secure.
              </li>
              <li>
                <strong className="text-white block mb-1">Sub-millisecond Read Speed:</strong>
                Query execution takes place locally, bypassing network latency. UI updates render instantly with no loading spinners.
              </li>
            </ul>
          </div>
        </section>

        {/* Cloud Sync */}
        <section className="px-6 py-16 max-w-4xl mx-auto border-t border-white/5">
          <h2 className="text-xl md:text-2xl font-black mb-6 uppercase tracking-wide">
            How Cloud Sync Works
          </h2>
          <div className="space-y-6 text-xs text-gray-400 leading-relaxed">
            <p>
              When a stable internet connection is detected, a background replication service kicks in:
            </p>
            <ul className="space-y-3 list-disc list-inside">
              <li>Changes are batched and pushed to our cloud storage layer (powered by Supabase PostgreSQL on AWS) every 30 seconds.</li>
              <li>Row Level Security (RLS) policies isolate tenant database rows so distinct organizations cannot access peer data records.</li>
              <li>Conflict resolution uses a timestamped last-write-wins mechanism, ensuring local and cloud states reach final consistency.</li>
              <li>Your local SQLite database is the master source of truth, and the cloud replica acts as a backup.</li>
            </ul>
          </div>
        </section>

        {/* Mobile Bridge */}
        <section className="px-6 py-16 max-w-4xl mx-auto border-t border-white/5">
          <h2 className="text-xl md:text-2xl font-black mb-6 uppercase tracking-wide">
            Mobile-to-PC Local WiFi Bridge
          </h2>
          <div className="space-y-6 text-xs text-gray-400 leading-relaxed">
            <p>
              Supervisors carry companion phones on the karkhana floor, marking worker output bags or attendance logs.
            </p>
            <ul className="space-y-3 list-disc list-inside">
              <li>Connection goes directly to the local PC Hub via a localized WebSocket server running on port 3000.</li>
              <li>Works on offline WiFi networks without requiring an active external internet subscription.</li>
              <li>When out-of-range, operations queue up locally on the supervisor's companion client app and sync once the connection is re-established.</li>
              <li>Remote dashboard access from external networks is tunneled securely via Cloudflare Tunnels (WSS protocols).</li>
            </ul>
          </div>
        </section>

        {/* Security */}
        <section className="px-6 py-16 max-w-4xl mx-auto border-t border-white/5">
          <h2 className="text-xl md:text-2xl font-black mb-6 uppercase tracking-wide">
            Security Model
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-gray-400 leading-relaxed">
            <div className="p-4 bg-[#0F1114] border border-white/5 rounded-sm">
              <h4 className="font-bold text-white mb-2 uppercase tracking-wide">Data & Storage Security</h4>
              <ul className="space-y-2 list-disc list-inside">
                <li>Local Database: SQLCipher AES-256 encryption.</li>
                <li>Cloud Sync: Supabase Row Level Security (RLS).</li>
                <li>Audit Logs: Full historical tracking of inserts, updates, and deletes.</li>
              </ul>
            </div>
            <div className="p-4 bg-[#0F1114] border border-white/5 rounded-sm">
              <h4 className="font-bold text-white mb-2 uppercase tracking-wide">Access & Network Control</h4>
              <ul className="space-y-2 list-disc list-inside">
                <li>Auth: JWT-signed tokens and secure cookie state.</li>
                <li>Licensing: Nonce-based replay attack validation.</li>
                <li>Telemetry: Respects user privacy, no tracking telemetry.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Tech Stack Table */}
        <section className="px-6 py-12 max-w-5xl mx-auto border-t border-white/5">
          <h2 className="text-xl md:text-2xl font-black text-center mb-8 uppercase tracking-wide">
            Noxis Hub Technical Stack
          </h2>

          <div className="border border-white/5 bg-[#0F1114] overflow-x-auto rounded-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/8 bg-black/40 text-gray-400">
                  <th className="p-4 font-bold uppercase tracking-wider">Layer</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Technology</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Why it was selected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {[
                  ['Desktop UI', 'Next.js 16 + React', 'Modern component lifecycle, SSR/static export capabilities, and fast render loops.'],
                  ['Desktop Shell', 'Electron 33', 'Cross-platform native OS integration, auto-updater hooks, and file system access on Windows.'],
                  ['Local Database', 'SQLite (SQLCipher)', 'Offline deployment stability, zero configurations, and AES-256 database encryption.'],
                  ['Cloud Database', 'Supabase (Postgres)', 'Postgres indexing, real-time sync, and Row Level Security for multi-tenant data isolation.'],
                  ['Mobile App', 'Expo + React Native', 'Single codebase targeting iOS and Android with native performance hooks.'],
                  ['Mobile Bridge', 'WebSocket (ws://)', 'LAN-local websocket connections enabling zero network overhead and instant updates.'],
                  ['Cloud Hosting', 'Cloudflare Pages', 'Highly fast page loading in Pakistan and UAE via global CDN edge servers.'],
                  ['File Storage', 'Cloudflare R2', 'S3-compatible object storage with zero egress fees for APK and EXE installer distribution.'],
                  ['Remote Tunnel', 'Cloudflare Tunnel', 'Secure proxy tunneling that bypasses local NAT and firewalls without open ports.'],
                  ['Auth', 'Supabase Auth', 'Standard JWT user token storage, authentication, and secure login workflows.'],
                  ['PDF Generation', 'jsPDF', 'Client-side local PDF generation that works without cloud server dependencies.'],
                  ['AI Predictions', 'Custom Pattern Engine', 'Identifies production patterns and detects recording anomalies locally.'],
                ].map(([layer, tech, rationale]) => (
                  <tr key={layer} className="hover:bg-white/[0.01]">
                    <td className="p-4 font-semibold text-white">{layer}</td>
                    <td className="p-4 text-[#60A5FA] font-medium">{tech}</td>
                    <td className="p-4 text-gray-400">{rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
            Evaluate Our Technology First Hand
          </h2>
          <p className="text-xs font-semibold text-gray-500 mb-8 max-w-xl mx-auto">
            Contact our engineering team to review our security model or arrange custom integrations.
          </p>
          <Link
            href="https://wa.me/923264742678?text=Technical+architect+integration+request+for+Noxis+Hub"
            target="_blank"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#60A5FA] text-black font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/10"
          >
            💬 WhatsApp Security Team
          </Link>
        </section>
      </main>
    </>
  )
}
