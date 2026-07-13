'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Database, Layers, Smartphone, ShieldCheck, BarChart4, Globe2,
  Download, Check, X, Menu, Terminal, CircleDollarSign,
  ShieldAlert, Sparkles, MessageSquare, Wifi, Lock, Cpu, ChevronRight
} from 'lucide-react'
import {
  LandingBackdrop,
  BrandLogo,
  NavBrand,
  CHAMPAGNE,
  CHAMPAGNE_LIGHT,
  OBSIDIAN,
  AnimatePresence,
  motion,
  CockpitTabs,
  TypewriterConsole,
  SplitHeadline,
  FeatureCard,
  Reveal,
  RevealStagger,
  RevealItem,
  SignatureMarquee
} from '@/components/landing/LandingMotion'

type CockpitTab = 'dashboard' | 'wages' | 'sqlite' | 'khata' | 'cctv'

const sqliteLogs = [
  '[21:32:04] Initializing secure local SQLite database...',
  '[21:32:04] Opening local tables at C:\\NoxisData\\Noxis-Local.db',
  '[21:32:05] SUCCESS: Local AES-256 database connection active.',
  '[21:32:08] TELEMETRY: Offline mode enabled. Transactions queued locally.',
  '[21:32:15] TRANSACT: Logged 1,420 yards for Weaver Hamid Saeed.',
  '[21:32:44] INVENTORY: Stock scanned (Item SKU-4920) - saved to memory queue.',
  '[21:35:12] NETWORK: 4 Android companion devices paired on local Wi-Fi subnet.',
  '[21:36:00] REPLICATION: Queue holds 142 records. Waiting for cloud handshake.',
]

const cctvAlerts = [
  { time: '21:30:15', msg: 'System check: 4 floor camera RTSP feeds connected.', status: 'info' },
  { time: '21:31:00', msg: 'Face matched: Hamid Saeed checked-in at Loom Cam 01.', status: 'success' },
  { time: '21:32:12', msg: 'Face matched: Bilal Khan checked-in at Packing Cam 02.', status: 'success' },
  { time: '21:35:44', msg: 'ALERT: Intruders/Zone breach at Loom Area (Cam 03).', status: 'danger' },
  { time: '21:35:45', msg: 'Security action: Triggered local PC siren and push notice.', status: 'warning' },
]

const marqueeTerms = [
  'OFFLINE-FIRST CORE',
  'SQLITE LOCAL ENCRYPTION',
  'SUPABASE CLOUD SYNC',
  'ROW-LEVEL SECURITY',
  'KARIGAR PIECE-RATE PAYROLL',
  'CCTV SENTINEL AI FEED',
  'LOCAL WI-FI MESH NODE',
  'PAKISTAN & UAE TAX COMPLIANCE'
]

export default function LandingClient() {
  const router = useRouter()
  const supabase = createClient()

  const [mounted, setMounted] = useState(false)
  const [checking, setChecking] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<CockpitTab>('dashboard')

  // Hydration-safe initial check
  useEffect(() => {
    setMounted(true)
    async function handleAuthRedirect() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data: profile } = await supabase
            .from('business_profiles').select('id, onboarding_done')
            .eq('user_id', session.user.id).single()
          router.push(profile?.onboarding_done ? '/dashboard' : '/setup')
        } else {
          const isElectron = window.navigator.userAgent.toLowerCase().includes('electron')
          if (isElectron) {
            router.push('/login')
          } else {
            setChecking(false)
          }
        }
      } catch {
        setChecking(false)
      }
    }
    handleAuthRedirect()
  }, [supabase, router])

  if (!mounted || checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: OBSIDIAN }}>
        <BrandLogo size="splash" showWordmark={false} />
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: `${CHAMPAGNE}33`, borderTopColor: CHAMPAGNE }}
        />
      </div>
    )
  }

  const docsFeatures = [
    {
      id: 'install',
      title: '01. Platform Installation',
      desc: 'Download the optimized Windows desktop client setup binary (.exe) and install the local system node directly on your factory floor PC.',
      badge: 'Workstation Setup',
      icon: Terminal,
    },
    {
      id: 'license',
      title: '02. Cryptographic Activation',
      desc: 'Perform a secure one-time activation. Your verified license key acts as a cryptographic recovery key for the local database block.',
      badge: 'License Control',
      icon: Lock,
    },
    {
      id: 'sqlite',
      title: '03. Local SQLite Architecture',
      desc: 'All factory transactions are stored locally with zero internet dependency, utilizing Write-Ahead Logging (WAL) for absolute stability.',
      badge: 'Database Core',
      icon: Database,
    },
    {
      id: 'mobile',
      title: '04. Local WiFi Phone Pairing',
      desc: 'Connect supervisor Android phones directly to your office PC over local Wi-Fi. Log operator inputs and attendance without internet.',
      badge: 'Floor Sync',
      icon: Smartphone,
    },
    {
      id: 'inventory',
      title: '05. Barcode & Inventory Config',
      desc: 'Scan grades of fabric rolls, chemical batches, or yarn packs. Get automated stock reorder alerts when inventory levels fall low.',
      badge: 'Stock Tracking',
      icon: Layers,
    },
    {
      id: 'invoices',
      title: '06. Ledger & Invoicing Setup',
      desc: 'Professional PDF invoice printouts, party-wise accounting registers, and cash book entries automatically keeping double-entry ledger records.',
      badge: 'Accounting',
      icon: CircleDollarSign,
    },
    {
      id: 'data-safety',
      title: '07. Data Safety Protocol',
      desc: 'Your data is backed up dual-fold: locally via downloadable encrypted JSON files and synced securely to Supabase servers when online.',
      badge: 'Security',
      icon: ShieldCheck,
    },
    {
      id: 'quickentry',
      title: '08. Floor Quick Entry Console',
      desc: 'A touch-friendly entry cockpit for computers on the floor, enabling quick records of production rates and attendance within seconds.',
      badge: 'Fast Logging',
      icon: Cpu,
    },
    {
      id: 'troubleshoot',
      title: '09. Regional Diagnostics',
      desc: 'Simple diagnostics checks for network subnets, local router connections, and device mapping errors to prevent any floor downtime.',
      badge: 'Diagnostics',
      icon: ShieldAlert,
    },
    {
      id: 'intelligence',
      title: '10. Predictive Intelligence',
      desc: 'Automated moving average inventory alerts, customer churn metrics, and live regional market rate indices calculated on your dashboard.',
      badge: 'Analytics',
      icon: BarChart4,
    },
    {
      id: 'finance',
      title: '11. Credit Scoring & Peshgi',
      desc: 'Track worker advance pays (peshgi), calculate credit profiles for operators, and coordinate wage payouts with digital wallet APIs.',
      badge: 'Finance Flow',
      icon: Globe2,
    },
    {
      id: 'api-worker',
      title: '12. Digital Worker IDs & APIs',
      desc: 'Generate QR badges for karigars displaying credentials, and utilize secure webhook integrations to sync inventory to third-party tools.',
      badge: 'Developer Integration',
      icon: Terminal,
    },
  ]

  const comparisonRows = [
    { metric: 'Network Dependency', noxis: '100% Offline-capable (Runs on local Wi-Fi)', cloud: 'Completely blocks on internet drops', manual: 'Paper records' },
    { metric: 'Karigar Wages & Peshgi', noxis: 'Automated piece-rate & advance deductions', cloud: 'Requires complex custom spreadsheets', manual: 'Calculated manually, prone to errors' },
    { metric: 'Security Camera Integration', noxis: 'Local AI camera alert zones, zero cloud fees', cloud: 'Requires high monthly fee smart cameras', manual: 'None (manual video playback)' },
    { metric: 'Data Control & Safety', noxis: 'Encrypted local database + automatic cloud mirror', cloud: 'Stored on public clouds with limited export', manual: 'No backup (fire/loss risk)' },
    { metric: 'Operational Costs', noxis: 'Affordable, one-time fee with no recurring monthly rent', cloud: 'Per-seat monthly subscriptions', manual: 'High losses from calculation mistakes' },
  ]

  return (
    <>
      <div
        className="font-sans min-h-screen selection:text-black overflow-x-hidden text-[#E2E8F0] relative"
        style={{ background: OBSIDIAN }}
      >
        <LandingBackdrop />

        {/* Global ambient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(197,160,89,0.05)_0%,transparent_50%)] pointer-events-none z-0" />

        <div className="relative z-10">
          {/* Header Navigation */}
          <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.04] bg-[#08090A]/85 backdrop-blur-2xl"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[76px] flex items-center justify-between gap-4">
              <NavBrand />

              <div className="hidden lg:flex items-center gap-10">
                {[{ label: 'Pricing', href: '/pricing' }, { label: 'Reviews', href: '/reviews' }, { label: 'Blog', href: '/blog' }, { label: 'Docs', href: '/docs' }, { label: 'About', href: '/about' }].map((link) => (
                  <Link key={link.href} href={link.href} className="text-[10px] text-[#94A3B8] hover:text-[#E8D5B5] font-bold tracking-[0.18em] uppercase transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="hidden lg:flex items-center gap-4">
                <Link
                  href="/dashboard"
                  style={{
                    background: 'rgba(197,160,89,0.05)',
                    border: '1px solid rgba(197,160,89,0.15)',
                    color: CHAMPAGNE,
                    padding: '8px 16px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 800,
                    textDecoration: 'none',
                  }}
                  className="inline-flex items-center text-[10px] font-bold tracking-[0.15em] uppercase hover:bg-[#C5A059]/10 transition-all font-mono"
                >
                  Owner Login →
                </Link>
                <Link
                  href="/download"
                  className="inline-flex items-center text-[10px] font-bold tracking-[0.2em] uppercase px-6 py-2.5 rounded-sm transition-all"
                  style={{ background: CHAMPAGNE, color: OBSIDIAN, boxShadow: `0 0 30px ${CHAMPAGNE}33` }}
                >
                  Download Trial
                </Link>
              </div>

              <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-white/70 hover:text-white" aria-label="Menu">
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="lg:hidden border-t border-white/[0.04] bg-[#08080A]/95 backdrop-blur-xl overflow-hidden"
                >
                  <div className="px-6 py-6 flex flex-col gap-5">
                    <BrandLogo size="nav" />
                    {[{ label: 'Pricing', href: '/pricing' }, { label: 'Reviews', href: '/reviews' }, { label: 'Blog', href: '/blog' }, { label: 'Docs', href: '/docs' }, { label: 'About', href: '/about' }].map((link) => (
                      <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold tracking-widest uppercase text-[#94A3B8] hover:text-white">
                        {link.label}
                      </Link>
                    ))}
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        background: 'rgba(197,160,89,0.05)',
                        border: '1px solid rgba(197,160,89,0.15)',
                        color: CHAMPAGNE,
                        padding: '10px 16px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 800,
                        textDecoration: 'none',
                        textAlign: 'center',
                      }}
                      className="text-[10px] font-bold tracking-widest uppercase font-mono"
                    >
                      Owner Login →
                    </Link>
                    <Link href="/download" onClick={() => setMobileMenuOpen(false)} className="text-center text-[10px] font-bold tracking-widest uppercase py-3 rounded-sm" style={{ background: CHAMPAGNE, color: OBSIDIAN }}>
                      Download Trial
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.nav>

          {/* Hero Section */}
          <section className="pt-32 pb-16 lg:pt-48 lg:pb-28 px-4 sm:px-6 max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <BrandLogo size="hero" showWordmark={true} />
              </motion.div>

              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 border border-[#C5A059]/20 bg-[#C5A059]/5 mb-8"
              >
                <Sparkles size={12} className="text-[#C5A059] animate-pulse" />
                <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#E8D5B5] font-mono">
                  Industrial-Grade Factory Core
                </span>
              </div>

              <SplitHeadline
                lines={[
                  { text: 'Offline-First ERP' },
                  { text: 'For Manufacturing Plants', accent: true }
                ]}
              />

              <p className="text-[#94A3B8] text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto mt-8 font-medium">
                Eliminate calculation disputes and paper registers. Noxis runs locally on your office PC without internet, calculating worker piece-rates, tracking warehouse inventory, and coordinating payouts with ease.
              </p>

              <div className="w-full mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
                <Link
                  href="/download"
                  className="inline-flex items-center justify-center gap-2 font-extrabold text-[11px] tracking-[0.2em] uppercase px-8 py-4 rounded-sm transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${CHAMPAGNE_LIGHT}, ${CHAMPAGNE})`,
                    color: OBSIDIAN,
                    boxShadow: `0 12px 40px ${CHAMPAGNE}33`,
                  }}
                >
                  <Download size={14} /> Download Free Trial (.exe)
                </Link>
                <a
                  href="https://wa.me/923264742678"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-white/[0.08] bg-white/[0.02] text-white font-extrabold text-[11px] tracking-[0.2em] uppercase px-8 py-4 rounded-sm backdrop-blur-sm transition-all duration-300 hover:border-[#C5A059]/60 hover:text-[#E8D5B5]"
                >
                  <MessageSquare size={14} className="text-emerald-400" /> WhatsApp Live Demo
                </a>
              </div>
            </div>
          </section>

          {/* Marquee Features */}
          <SignatureMarquee items={marqueeTerms} />

          {/* High-Fidelity B2B Dashboard Cockpit */}
          <section className="px-4 md:px-6 py-24 max-w-7xl mx-auto">
            <Reveal variant="up" className="space-y-8">
              <div className="mb-8 text-center lg:text-left">
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase mb-1" style={{ color: CHAMPAGNE }}>Executive Operations Center</p>
                <h2 className="text-2xl font-bold text-white tracking-tight uppercase">Noxis Hub Dashboard Interface</h2>
                <p className="text-xs text-gray-500 mt-1">Realistic live simulation of Noxis industrial software node</p>
              </div>

              <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-[#0A0B0D] shadow-2xl relative">
                {/* Decorative border glow */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C5A059]/40 to-transparent" />

                {/* Simulator Header */}
                <div className="bg-[#070708] border-b border-white/[0.04] px-5 py-4 flex flex-wrap items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                    <span className="text-[11px] text-white font-mono uppercase font-bold tracking-widest ml-2">Noxis local server : C:\\NoxisData\\</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-emerald-400"><Wifi size={12} /> Local Mesh</span>
                    <span className="flex items-center gap-1.5 text-[#C5A059]"><Lock size={12} /> Encrypted DB</span>
                  </div>
                </div>

                {/* Operations Overview stats cards inside simulator */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.03] border-b border-white/[0.04] relative z-10">
                  {[
                    { title: 'Floor Looms', value: '24 Active', detail: 'Local mesh connected', color: 'text-white' },
                    { title: 'Checked-in Staff', value: '148 Karigars', detail: 'Via Android companion app', color: 'text-white' },
                    { title: 'Shift Production', value: '12,850 Yards', detail: 'Grey grade A output', color: 'text-[#C5A059]' },
                    { title: 'Sync Status', value: 'Offline Grace', detail: 'Replicates once online', color: 'text-emerald-400' },
                  ].map((stat) => (
                    <div key={stat.title} className="p-5 bg-[#0A0B0D]">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold mb-1">{stat.title}</span>
                      <span className={`text-lg font-bold block ${stat.color}`}>{stat.value}</span>
                      <span className="text-[9px] text-gray-600 font-mono block mt-1">{stat.detail}</span>
                    </div>
                  ))}
                </div>

                {/* Simulator Tab Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 relative z-10">
                  {/* Left side vertical tabs */}
                  <CockpitTabs
                    tabs={[
                      { id: 'dashboard', label: 'Operations Summary', icon: <Cpu size={14} /> },
                      { id: 'wages', label: 'Karigar Wages Ledger', icon: <CircleDollarSign size={14} /> },
                      { id: 'sqlite', label: 'Local Database Logs', icon: <Terminal size={14} /> },
                      { id: 'khata', label: 'Cash Accounts & Mandi', icon: <BarChart4 size={14} /> },
                      { id: 'cctv', label: 'Security AI CCTV', icon: <ShieldAlert size={14} /> },
                    ]}
                    activeId={activeTab}
                    onSelect={(id) => setActiveTab(id as CockpitTab)}
                  />

                  {/* Right side content window */}
                  <div className="lg:col-span-9 p-6 bg-[#0A0B0D] min-h-[380px] flex flex-col justify-between border-t lg:border-t-0 border-white/[0.04]">
                    <AnimatePresence mode="wait">
                      {/* Tab: Dashboard Summary */}
                      {activeTab === 'dashboard' && (
                        <motion.div
                          key="dashboard"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-6 flex-1"
                        >
                          <div className="flex items-center justify-between border-b border-white/[0.03] pb-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">Mill Floor Status Overview</h3>
                            <span className="text-[10px] text-gray-500 font-mono">Telemetry v13.1</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded border border-white/[0.04] bg-white/[0.01] space-y-2">
                              <span className="text-[9px] font-bold text-[#60A5FA] uppercase tracking-wider block">Local Network Gateway</span>
                              <p className="text-xs text-gray-400 font-mono">
                                PC Server running at <span className="text-white">192.168.10.42:3000</span><br />
                                Android Terminals connected: <span className="text-white">4 Handhelds</span><br />
                                Ping Latency: <span className="text-emerald-400">0.4ms (Instant)</span>
                              </p>
                            </div>
                            <div className="p-4 rounded border border-white/[0.04] bg-white/[0.01] space-y-2">
                              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">Database Health</span>
                              <p className="text-xs text-gray-400 font-mono">
                                Encryption Cipher: <span className="text-white">AES-256-GCM</span><br />
                                File Size: <span className="text-white">4.82 MB</span><br />
                                Integrity Scan: <span className="text-emerald-400">100% Secure</span>
                              </p>
                            </div>
                          </div>
                          <div className="p-4 rounded border border-[#C5A059]/20 bg-[#C5A059]/5 flex items-center gap-3">
                            <ShieldCheck className="text-[#C5A059] shrink-0" size={18} />
                            <p className="text-xs text-gray-300 font-medium">
                              <strong>Zero-Internet Operation Active:</strong> The Noxis local server processes worker wages, inventories, and accounting offline. Workstations will mirror these transactions to the cloud once an internet connection is established.
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {/* Tab: Wages */}
                      {activeTab === 'wages' && (
                        <motion.div
                          key="wages"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4 flex-1"
                        >
                          <div className="flex items-center justify-between border-b border-white/[0.03] pb-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">Karigar Wages & Peshgi (Advances)</h3>
                            <span className="text-[10px] text-gray-500 font-mono">Current Shift Logs</span>
                          </div>
                          <div className="overflow-x-auto rounded border border-white/[0.04]">
                            <table className="w-full text-left font-mono text-[11px] min-w-[500px]">
                              <thead>
                                <tr className="border-b border-white/[0.05] bg-white/[0.02] text-gray-500">
                                  <th className="p-2.5 uppercase font-bold text-[9px]">Operator</th>
                                  <th className="p-2.5 uppercase font-bold text-[9px]">Shift</th>
                                  <th className="p-2.5 uppercase font-bold text-[9px] text-right">Production</th>
                                  <th className="p-2.5 uppercase font-bold text-[9px] text-right">Advance Paid</th>
                                  <th className="p-2.5 uppercase font-bold text-[9px] text-right">Net Salary</th>
                                  <th className="p-2.5 uppercase font-bold text-[9px] text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[
                                  { name: 'Hamid Saeed', shift: 'Morning', yds: '1,420 yds', adv: '₨ 12,500', net: '₨ 42,600', status: 'PAID' },
                                  { name: 'Muhammad Asif', shift: 'Morning', yds: '1,150 yds', adv: '₨ 5,000', net: '₨ 39,200', status: 'PAID' },
                                  { name: 'Bilal Khan', shift: 'Night', yds: '1,560 yds', adv: '₨ 18,000', net: '₨ 44,400', status: 'DRAFT' },
                                  { name: 'Tariq Mahmood', shift: 'Night', yds: '980 yds', adv: '₨ 0', net: '₨ 34,300', status: 'DRAFT' },
                                ].map((row) => (
                                  <tr key={row.name} className="border-b border-white/[0.02]">
                                    <td className="p-2.5 text-white font-bold">{row.name}</td>
                                    <td className="p-2.5 text-gray-400">{row.shift}</td>
                                    <td className="p-2.5 text-right text-gray-300">{row.yds}</td>
                                    <td className="p-2.5 text-right text-red-400">{row.adv}</td>
                                    <td className="p-2.5 text-right font-bold text-[#C5A059]">{row.net}</td>
                                    <td className="p-2.5 text-center">
                                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                        row.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                      }`}>{row.status}</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}

                      {/* Tab: SQLite Logs */}
                      {activeTab === 'sqlite' && (
                        <motion.div
                          key="sqlite"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4 flex-1 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between border-b border-white/[0.03] pb-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">Local SQLite Datagrid Terminal</h3>
                            <span className="text-[10px] text-gray-500 font-mono">WAL Mode Active</span>
                          </div>
                          <TypewriterConsole lines={sqliteLogs} />
                        </motion.div>
                      )}

                      {/* Tab: Khata & Mandi */}
                      {activeTab === 'khata' && (
                        <motion.div
                          key="khata"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4 flex-1"
                        >
                          <div className="flex items-center justify-between border-b border-white/[0.03] pb-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">Double-Entry cash book ledger</h3>
                            <span className="text-[10px] text-gray-500 font-mono">Balance Reconciled</span>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { item: 'Cotton Mandi', price: '₨ 18,450 / maund', delta: '+1.2%' },
                              { item: 'Yarn 30s', price: '₨ 412 / kg', delta: '-0.4%' },
                              { item: 'Grey Fabric 60"', price: '₨ 285 / meter', delta: '+0.8%' },
                            ].map((rate) => (
                              <div key={rate.item} className="p-3 bg-white/[0.02] border border-white/[0.04] rounded">
                                <span className="text-[9px] text-gray-500 uppercase block font-bold mb-1">{rate.item}</span>
                                <span className="text-xs font-bold block text-white font-mono">{rate.price}</span>
                                <span className={`text-[9px] font-mono block mt-1 ${rate.delta.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{rate.delta}</span>
                              </div>
                            ))}
                          </div>
                          <div className="overflow-x-auto rounded border border-white/[0.04] bg-black/20">
                            <table className="w-full text-left font-mono text-[11px] min-w-[500px]">
                              <thead>
                                <tr className="border-b border-white/[0.05] bg-white/[0.02] text-gray-500">
                                  <th className="p-2 uppercase font-bold text-[9px]">Txn ID</th>
                                  <th className="p-2 uppercase font-bold text-[9px]">Description</th>
                                  <th className="p-2 uppercase font-bold text-[9px] text-right">Debit</th>
                                  <th className="p-2 uppercase font-bold text-[9px] text-right">Credit</th>
                                  <th className="p-2 uppercase font-bold text-[9px] text-right">Balance</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[
                                  { id: 'TX-9028', desc: 'Bale Yarn Raw Stock Procurement', dr: '₨ 450,000', cr: '—', bal: '₨ 1,240,500' },
                                  { id: 'TX-9029', desc: 'Faisalabad Mandi Sale — Batch 12', dr: '—', cr: '₨ 850,000', bal: '₨ 2,090,500' },
                                  { id: 'TX-9030', desc: 'Weekly Karigar Wages Cashout', dr: '₨ 160,500', cr: '—', bal: '₨ 1,930,000' },
                                ].map((row) => (
                                  <tr key={row.id} className="border-b border-white/[0.02]">
                                    <td className="p-2 text-gray-500 font-bold">{row.id}</td>
                                    <td className="p-2 text-white">{row.desc}</td>
                                    <td className="p-2 text-right text-red-400 font-bold">{row.dr}</td>
                                    <td className="p-2 text-right text-emerald-400 font-bold">{row.cr}</td>
                                    <td className="p-2 text-right text-[#C5A059] font-bold">{row.bal}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}

                      {/* Tab: CCTV */}
                      {activeTab === 'cctv' && (
                        <motion.div
                          key="cctv"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4 flex-1"
                        >
                          <div className="flex items-center justify-between border-b border-white/[0.03] pb-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">AI CCTV Sentinel Edge Feed</h3>
                            <span className="text-[10px] text-gray-500 font-mono">0.12ms Local Inference</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative aspect-video rounded border border-white/[0.06] bg-black overflow-hidden flex items-center justify-center">
                              <span className="absolute top-2 left-2 text-[8px] font-mono bg-red-600 text-white font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-widest flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Cam 01 : Loom Floor
                              </span>
                              <div className="border border-emerald-400/40 rounded p-1 text-[8px] font-mono text-emerald-400 bg-black/60">
                                [Weaver #04 : Hamid Saeed matched 98%]
                              </div>
                            </div>
                            <div className="p-3 bg-black/40 border border-white/[0.04] rounded font-mono text-[9px] space-y-1.5 max-h-[140px] overflow-y-auto">
                              {cctvAlerts.map((alert, i) => (
                                <p key={i} className={
                                  alert.status === 'danger' ? 'text-red-400 font-bold' :
                                  alert.status === 'success' ? 'text-emerald-400' : 'text-gray-500'
                                }>
                                  [{alert.time}] {alert.msg}
                                </p>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Simulator footer */}
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-gray-500">
                      <span>Noxis Workstation Database Node: active</span>
                      <span className="text-[#C5A059] font-bold uppercase">Safe local storage</span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* System Capabilities Section - Listing all 12 modules */}
          <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/[0.04]">
            <div className="text-center mb-16 space-y-3">
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: CHAMPAGNE }}>Complete Capability Index</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white uppercase">System Features & Documentation</h2>
              <p className="text-sm text-gray-400 max-w-xl mx-auto">
                Explore the technical capabilities and system configurations built directly into the Noxis Hub platform.
              </p>
            </div>

            <RevealStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {docsFeatures.map((f, i) => (
                <FeatureCard
                  key={f.id}
                  href={`/docs#${f.id}`}
                  icon={f.icon}
                  title={f.title}
                  desc={f.desc}
                  index={i}
                />
              ))}
            </RevealStagger>
          </section>

          {/* Comparison Matrix */}
          <section className="py-24 px-4 sm:px-6 border-t border-white/[0.04] bg-[#070708]/50">
            <Reveal variant="up" className="max-w-7xl mx-auto space-y-12">
              <div className="text-center space-y-3">
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: CHAMPAGNE }}>Platform Parameters</p>
                <h2 className="text-3xl font-bold tracking-tight text-white uppercase">Designed for Industrial Reality</h2>
                <p className="text-xs text-gray-500">Comparison of Noxis Local ERP vs cloud systems and manual books</p>
              </div>

              <div className="overflow-x-auto rounded border border-white/[0.05] bg-[#0A0B0D]">
                <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-[#070708] text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                      <th className="p-4 w-[25%]">Parameter</th>
                      <th className="p-4 text-center w-[30%]" style={{ color: CHAMPAGNE, background: `${CHAMPAGNE}08` }}>Noxis Local ERP</th>
                      <th className="p-4 text-center">Legacy Cloud SaaS</th>
                      <th className="p-4 text-center">Manual Accounting</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.metric} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                        <td className="p-4 font-bold text-white text-[11px] uppercase tracking-wide">{row.metric}</td>
                        <td className="p-4 text-center border-x border-white/[0.03]" style={{ background: `${CHAMPAGNE}06` }}>
                          <span className="inline-flex items-start justify-center gap-2 text-[11px]" style={{ color: CHAMPAGNE_LIGHT }}>
                            <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                            {row.noxis}
                          </span>
                        </td>
                        <td className="p-4 text-center text-gray-400 font-medium">{row.cloud}</td>
                        <td className="p-4 text-center text-gray-500 font-medium">{row.manual}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          </section>

          {/* Onboarding Invitation CTA */}
          <section className="py-24 px-4 sm:px-6 max-w-4xl mx-auto">
            <Reveal variant="scale">
              <div
                className="rounded-xl p-10 md:p-14 text-center border relative overflow-hidden"
                style={{ borderColor: `${CHAMPAGNE}30`, background: 'linear-gradient(165deg, rgba(197,160,89,0.03) 0%, rgba(10,11,13,0.98) 70%)' }}
              >
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20" style={{ background: CHAMPAGNE }} />
                <div className="relative space-y-6">
                  <div className="flex justify-center mb-2">
                    <BrandLogo size="nav" showWordmark={false} />
                  </div>
                  <p className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: CHAMPAGNE }}>Founding Factory Cohort</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight uppercase">Get Started with Noxis Hub</h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                    We assist with local WiFi routing configurations, operator account mapping, and custom piece-rate settings directly for your plant.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                    <a
                      href="https://wa.me/923264742678"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-extrabold text-[10px] tracking-[0.2em] uppercase py-4 px-8 rounded-sm bg-[#25D366] text-black"
                    >
                      <MessageSquare size={14} /> WhatsApp Support Board
                    </a>
                    <Link
                      href="/download"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/20 font-extrabold text-[10px] tracking-[0.2em] uppercase py-4 px-8 rounded-sm text-white hover:bg-white/5 transition-colors"
                    >
                      <Download size={14} /> Download Free Trial
                  </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* Simple Professional Footer */}
          <footer className="border-t border-white/[0.04] py-14 px-4 sm:px-6" style={{ background: '#030304' }}>
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <BrandLogo size="footer" />
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Image src="/logos/omnoralabs.png" alt="Omnora Labs" width={72} height={20} className="h-5 w-auto object-contain opacity-60" />
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                {[{ label: 'Download', href: '/download' }, { label: 'Pricing', href: '/pricing' }, { label: 'Reviews', href: '/reviews' }, { label: 'Blog', href: '/blog' }, { label: 'Docs', href: '/docs' }, { label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }, { label: 'Refund', href: '/refund' }, { label: 'About', href: '/about' }].map((l) => (
                  <Link key={l.href} href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                ))}
              </div>
              <p className="text-center md:text-right text-xs text-gray-600">© 2026 Noxis Hub · Engineered in Pakistan</p>
            </div>
          </footer>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@700&display=swap');
        .font-sans { font-family: 'Outfit', sans-serif; }
        .font-mono { font-family: 'JetBrains+Mono', monospace; }
        body { background-color: #08090A; }
        
        @keyframes noxis-grid-drift {
          0% {
            background-position: 0px 0px;
          }
          100% {
            background-position: 64px 64px;
          }
        }
        .noxis-grid-drift {
          animation: noxis-grid-drift 24s linear infinite;
        }
      `}</style>
    </>
  )
}
