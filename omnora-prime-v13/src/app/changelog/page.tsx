'use client'
import { useState } from 'react'
import { Tag, Calendar, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'

const RELEASES = [
  {
    version: 'v14.0.17',
    date: 'October 2026',
    isCurrent: true,
    title: 'Instant SQLite Invoice Finalization, Zero-Latency Offline Performance & Item Resilience',
    summary: 'Sub-millisecond invoice finalization saved directly to local SQLite WAL with full line items, stock deductions, party balances, and zero-latency offline performance under 1ms.',
    changes: [
      'Instant Local Invoice Finalization: Inverted post pipeline to write to local encrypted SQLite WAL first (<1ms), instantly saving invoices, line items, stock deductions, and party ledger balances.',
      'Line Item Persistence & Schema Resolution: Fixed column mappings and table creation for invoice_items in SQLite, ensuring items always display immediately upon finalization.',
      'Zero-Latency Offline Mode: Shortened WAN probes and added instantaneous offline rejection so page navigation, calculations, and button clicks operate smoothly under 1ms without cloud timeouts.',
      'Local-First Party & SKU Search: Form searches query local SQLite databases first for instant typing response and seamless functionality when internet is unavailable.',
      'UUID Safe Fallbacks: Prevented PostgreSQL type errors by validating UUID strings before remote fallback queries.',
    ],
  },
  {
    version: 'v14.0.16',
    date: 'October 2026',
    isCurrent: false,
    title: 'Invoice Finalization & PDF Rendering Fixes, Mobile Mesh Hub Sync Optimization & Industrial Calculators',
    summary: 'Resolved empty item rows on finalized invoices, fixed faint Amount in Words in PDF exports with high-contrast containers, optimized Mobile Hub device registration and eliminated sync lag, and linked Industrial Calculators to the main navigation.',
    changes: [
      'Invoice Finalization & Line Items: Fixed SQLite query in /api/invoices so item descriptions, quantities, unit prices, and totals persist and render immediately upon invoice finalization.',
      'PDF Invoice Export Contrast: Corrected Amount in Words styling in PDF generator to print in high-contrast charcoal/black inside a styled container instead of faint white text.',
      'Amount in Words Localization: Integrated real-time number-to-words currency conversion for PKR, USD, AED, and SAR with dual English and Urdu script support.',
      'Mobile Hub Mesh Device Telemetry: Fixed device field normalization so connected mobile terminals immediately appear as active online nodes on the host PC.',
      'Lag-Free Mobile Synchronization: Implemented debounced query invalidation in MobileSyncListener to eliminate UI freezing on both PC and mobile devices.',
      'Industrial Calculators Sidebar Link: Integrated fabric consumption, GSM, and costing calculators directly into the primary industrial sidebar.',
    ],
  },
  {
    version: 'v14.0.15',
    date: 'October 2026',
    isCurrent: false,
    title: 'Batch Costing & Traceability Engine, Audit Trail, Summary Export & Production Fixes',
    summary: 'Resolved SQLite quotation syntax for batch output updates, added functional interactive Audit Trail modal and CSV Costing Summary export, and normalized batch costing material and overhead metrics.',
    changes: [
      'Batch Output & Status Updates: Fixed SQLite column name resolution for timestamp updates by switching to ISO datetime(\'now\') string literals, preventing \'no such column: now\' errors on output logging.',
      'Interactive Batch Audit Trail: Added dedicated traceability modal displaying genesis ledger anchors, material allocations, labor contracts, and offline cryptographic ledger verification.',
      'Batch Costing Summary Export: Enabled instant CSV summary download for cumulative costs, unit margins, and profitability breakdown with one-click export.',
      'Fiscal Mass Normalization: Harmonized material and overhead unit rates, descriptions, and quantities in the batch fiscal breakdown card.',
      '1st-Try Seamless Restart: Fixed installer lock contention by decoupling update shutdown from background process holds, guaranteeing instant silent execution on the first click.',
    ],
  },
  {
    version: 'v14.0.14',
    date: 'October 2026',
    isCurrent: false,
    title: 'Instant 1-Click Seamless Restart, Lockout-Free Installer & Differential Delta Streaming',
    summary: 'Single-click instant update installation without lockups or aborted attempts, detached background watcher process supervisor, exit lock bypass, and re-enabled differential delta downloads.',
    changes: [
      '1st-Try Seamless Restart: Fixed installer lock contention by decoupling update shutdown from background process holds, guaranteeing instant silent execution on the first click.',
      'Detached Watcher Supervisor: Launches a detached PowerShell supervisor that kills any stale process hold, executes the installer silently with /S, and relaunches Noxis Hub automatically.',
      'Differential Delta Streaming: Enabled native electron-updater byte-range streaming against Cloudflare R2 blockmaps, downloading only 2–5 MB delta ranges for updates.',
      'Universal Theme Engine: 100% theme shifting across every single page, panel, card, table, header, and input with automatic light-mode contrast harmonization.',
      'POS Workspace Navigation: Preserves the industrial navigation sidebar on POS by default with an instant one-click Kiosk Mode toggle for full-screen counter operations.',
    ],
  },
  {
    version: 'v14.0.13',
    date: 'October 2026',
    isCurrent: false,
    title: 'Universal Theme Engine, POS Workspace, Auto-Relaunch Updates & Differential Blockmap Engine',
    summary: 'Comprehensive software-wide theme adaptation across all 23 industrial themes, persistent POS navigation sidebar with Kiosk toggle, automatic update relaunching, differential delta patches, and offline-first batch tracking.',
    changes: [
      'Universal Theme Engine: 100% theme shifting across every single page, panel, card, table, header, and input with automatic light-mode contrast harmonization.',
      'POS Workspace Navigation: Preserves the industrial navigation sidebar on POS by default with an instant one-click Kiosk Mode toggle for full-screen counter operations.',
      '1-Click Update Auto-Relaunch: Background process supervisor seamlessly monitors installer completion and instantly relaunches Noxis Hub without user intervention.',
      'Differential Delta Patching: Dynamic size calculation downloads only 2–5 MB blockmap differential byte ranges for patches instead of redownloading 200+ MB installers.',
      'Offline-First Production Batch Tracking: Fully wired local SQLite schema and REST API for batch lifecycle tracking with real-time creation and output logging.',
    ],
  },
  {
    version: 'v14.0.12',
    date: 'October 2026',
    isCurrent: false,
    title: 'Production Upgrade — Multi-User Auto-Sync, Public REST API & Webhook Dispatcher',
    summary: 'Instant multi-terminal state synchronization, commercially ready Developer API Keys & Webhook engine with HMAC signatures, and seamless update transition splash.',
    changes: [
      'Multi-User Workstation Auto-Sync: Real-time broadcast and instant cache invalidation between web terminals and desktop software over local LAN.',
      'Workstation Heartbeat Monitor: Live peer discovery tracking active terminal operators, last-seen timestamps, and latency across workstations.',
      'Developer REST API v1: Public endpoints for inventory querying and invoice creation secured with high-entropy Bearer token auth.',
      'HMAC-SHA256 Webhook Dispatcher: Live delivery engine notifying Shopify, WooCommerce, and custom webhooks with audit logging.',
      'Seamless Update Restart: Persistent visual splash feedback during binary update execution eliminates the silent gap before relaunch.',
    ],
  },
  {
    version: 'v14.0.0',
    date: 'October 2026',
    isCurrent: false,
    title: 'Major Release — Noxis Mobile Hub & Sovereign Industrial Grid v14',
    summary: 'Full production launch of Noxis Mobile Hub for Android, Urdu & English AI Voice Khata, biometric attendance, Bluetooth thermal printing, and strict multi-tier device security.',
    changes: [
      'Noxis Mobile Hub (Android & Handheld) production launch with instant local Wi-Fi router pairing and encrypted Cloudflare tunnel fallback.',
      'AI Urdu & English Voice Khata Engine: Natural speech parser directly records double-entry debits, credits, and factory cash advances (Peshgi).',
      'Biometric & photo selfie attendance with GPS geofencing and supervisor shift audit validation.',
      'Loom floor piece-rate wage logging (yards, meters, suits, thaan cuts) directly from Android terminals.',
      'Handheld Mobile POS counter with ESC/POS Bluetooth 58mm & 80mm wireless thermal slip printing.',
      'High-speed camera barcode and QR fabric roll scanner for rapid warehouse cycle counts and dispatch tracking.',
      'Floor Peshgi (cash advance) disbursements with instant Karigar balance ledger deduction.',
      'Strict multi-tier device pairing limits (Lite: 3, Pro: 15, Elite: 50) with hardware fingerprint security and auto-suspension watchdog.',
    ],
  },
  {
    version: 'v13.0.0',
    date: 'July 2026',
    title: 'Industrial ERP & Companion Mesh',
    summary: 'Complete redesign of offline-first engine, RS232 weighbridge support, CCTV video feeds, and UAE VAT 201 compliance.',
    changes: [
      'RS232 weighbridge direct integration for rice mill Paddy IN / Rice OUT weight entries.',
      'CCTV video feed integration with direct stream protocol and event recording.',
      'UAE VAT 5% tax module with FTA VAT 201 return reporting.',
      'Mobile Mesh synchronization over local WiFi and secure connection.',
      'Karigar piece-rate grid with instant wage calculations and bulk payslip PDF generation.',
      '256-bit local database encryption with asymmetric license verification.',
    ],
  },
  {
    version: 'v12.4.0',
    date: 'May 2026',
    title: 'Performance & Thermal Label Studio',
    summary: 'Virtual scroll implementation for 50,000+ SKUs with under 150ms page load times.',
    changes: [
      'Virtual scroll implementation in inventory tables and POS counter search.',
      'Thermal label designer for 80mm receipts and product barcode stickers.',
      'FBR NTN and STRN invoice footer customization.',
      'Concurrent read-write engine optimizations for local database.',
    ],
  },
  {
    version: 'v11.8.0',
    date: 'February 2026',
    title: 'WhatsApp Automation & Peshgi Ledger',
    summary: 'One-tap WhatsApp invoice PDF dispatch and advance wage tracking.',
    changes: [
      'WhatsApp invoice dispatch with pre-filled customer messages.',
      'Peshgi advance tracking module for Karigars with running balance.',
      'Multi-currency support for PKR, AED, USD, and SAR.',
      'Automated daily encrypted local backups.',
    ],
  },
]

export default function ChangelogPage() {
  const [openVersions, setOpenVersions] = useState<string[]>(['v14.0.17'])

  const toggleVersion = (v: string) => {
    setOpenVersions(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
    )
  }

  return (
    <div className="min-h-screen bg-[#060708] text-[#F9FAFB] font-sans pt-12 pb-20">
      {/* HERO */}
      <section className="py-12 border-b border-[#21262D] bg-[#060708]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="text-xs font-mono font-bold text-[#3B82F6] uppercase tracking-wider block mb-2">
            Release History
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            Noxis Hub Changelog
          </h1>
          <p className="text-xs text-gray-400 font-mono">
            Track feature updates, performance benchmarks, and security patches.
          </p>
        </div>
      </section>

      {/* RELEASES */}
      <section className="py-10">
        <div className="max-w-3xl mx-auto px-6 space-y-4">
          {RELEASES.map((rel) => {
            const isOpen = openVersions.includes(rel.version)
            return (
              <div
                key={rel.version}
                className={`
                  p-5 bg-[#0D1117] border rounded-md transition-all
                  ${rel.isCurrent ? 'border-[#3B82F6]' : 'border-[#21262D]'}
                `}
              >
                <div
                  onClick={() => toggleVersion(rel.version)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base font-mono font-bold text-white flex items-center gap-2">
                      <Tag size={15} className={rel.isCurrent ? 'text-[#3B82F6]' : 'text-gray-500'} />
                      {rel.version}
                    </span>
                    {rel.isCurrent && (
                      <span className="text-[10px] font-mono font-bold uppercase text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
                        Current Release
                      </span>
                    )}
                    <span className="text-xs font-mono text-gray-500 flex items-center gap-1">
                      <Calendar size={12} />
                      {rel.date}
                    </span>
                  </div>
                  <button className="text-gray-400 hover:text-white">
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                <div className="mt-3">
                  <h3 className="text-sm font-bold text-white mb-1">{rel.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{rel.summary}</p>
                </div>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-[#21262D] space-y-2">
                    <span className="text-[10px] font-mono font-bold text-[#3B82F6] uppercase tracking-wider block mb-2">
                      Changes in {rel.version}:
                    </span>
                    {rel.changes.map((chg, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                        <CheckCircle2 size={14} className="text-[#10B981] shrink-0 mt-0.5" />
                        <span>{chg}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
