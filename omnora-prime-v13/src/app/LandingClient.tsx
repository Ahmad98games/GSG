'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Database, Layers, Smartphone, ShieldCheck, BarChart4, Globe2,
  Download, Check, X, Menu, Terminal, CircleDollarSign,
  ShieldAlert, Sparkles, MessageSquare, Wifi, Lock, TrendingUp,
} from 'lucide-react'
import {
  LandingBackdrop,
  LandingIntro,
  BrandLogo,
  NavBrand,
  Reveal,
  SplitHeadline,
  SignatureMarquee,
  FeatureCard,
  CockpitTabs,
  TypewriterConsole,
  CHAMPAGNE,
  CHAMPAGNE_LIGHT,
  OBSIDIAN,
  AnimatePresence,
  motion,
} from '@/components/landing/LandingMotion'

type CockpitTab = 'karigar' | 'sqlite' | 'khata' | 'cctv'

const INTRO_KEY = 'noxis-landing-intro-v2'

const karigarRows = [
  { name: 'Hamid Saeed', shift: 'Morning', attendance: 'Present', yds: '1,420', adv: '₨ 12,500', net: '₨ 42,600', status: 'WhatsApp' },
  { name: 'Muhammad Asif', shift: 'Morning', attendance: 'Present', yds: '1,150', adv: '₨ 5,000', net: '₨ 39,200', status: 'WhatsApp' },
  { name: 'Bilal Khan', shift: 'Night', attendance: 'Present', yds: '1,560', adv: '₨ 18,000', net: '₨ 44,400', status: 'WhatsApp' },
  { name: 'Tariq Mahmood', shift: 'Night', attendance: 'Late', yds: '980', adv: '₨ 0', net: '₨ 34,300', status: 'Printed' },
]

const khataRows = [
  { id: 'TXN-9028', desc: 'Bale Yarn Raw Stock Procurement', dr: '₨ 450,000', cr: '—', bal: '₨ 1,240,500' },
  { id: 'TXN-9029', desc: 'Faisalabad Mandi Sale — Batch 12', dr: '—', cr: '₨ 850,000', bal: '₨ 2,090,500' },
  { id: 'TXN-9030', desc: 'Weekly Karigar Wages Cashout', dr: '₨ 160,500', cr: '—', bal: '₨ 1,930,000' },
  { id: 'TXN-9031', desc: 'Raw Silk Inward Mandi Reconcile', dr: '—', cr: '₨ 120,000', bal: '₨ 2,050,000' },
]

const mandiRates = [
  { commodity: 'Raw Cotton (40mm)', rate: '₨ 18,450 / maund', delta: '+1.2%' },
  { commodity: 'Polyester Yarn 30s', rate: '₨ 412 / kg', delta: '-0.4%' },
  { commodity: 'Grey Fabric 60"', rate: '₨ 285 / meter', delta: '+0.8%' },
]

const sqliteLogs = [
  '[21:32:04] Initializing local SQLite3-MC engine…',
  '[21:32:04] Mounting encrypted store at Noxis-Local.db',
  '[21:32:04] SUCCESS: AES-256 connection established.',
  '[21:32:08] CENTRAL CLOUD: OFFLINE — standalone floor mode active.',
  '[21:32:15] LOG: Karigar Hamid Saeed — +1,420 yds queued for mesh sync.',
  '[21:32:44] LOG: Inventory bale SKU #2908-WEAVE scanned — buffer queued.',
  '[21:35:12] MESH: 4 Android floor terminals paired (local WiFi).',
  '[21:36:00] STABILITY: 100% operative — offline buffer: 142 records.',
]

const cctvLogs = [
  '[21:30:15] AI Sentinel mounted — 4 active floor cameras.',
  '[21:31:00] MATCH: Weaver Hamid Saeed — Loom Cam 01 check-in.',
  '[21:32:12] MATCH: Weaver Bilal Khan — Packing Cam 02 check-in.',
  '[21:35:44] ALERT: Zone breach — Weaving Loom 14 perimeter (Cam 03).',
  '[21:35:44] Dispatch: SMS + local floor notification sent.',
]

const marqueeItems = [
  'Textile mills',
  'Rice mills',
  'Karigar payroll',
  'Offline ERP',
  'Urdu floor UI',
  'Barcode inventory',
  'Double-entry khata',
]

export default function LandingClient() {
  const router = useRouter()
  const supabase = createClient()

  const [checking, setChecking] = useState(() =>
    typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron')
  )
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return !sessionStorage.getItem(INTRO_KEY)
    } catch {
      return false
    }
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<CockpitTab>('karigar')

  const finishIntro = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_KEY, '1')
    } catch {
      /* ignore */
    }
    setShowIntro(false)
  }, [])

  useEffect(() => {
    async function handleAuthRedirect() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data: profile } = await supabase
            .from('business_profiles').select('id, onboarding_done')
            .eq('user_id', session.user.id).single()
          router.push(profile?.onboarding_done ? '/dashboard' : '/setup')
        } else {
          const isElectron = typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron')
          if (isElectron) router.push('/login')
          else setChecking(false)
        }
      } catch { setChecking(false) }
    }
    handleAuthRedirect()
  }, [supabase, router])

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: OBSIDIAN }}>
        <BrandLogo size="splash" showWordmark />
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: `${CHAMPAGNE}33`, borderTopColor: CHAMPAGNE }}
        />
      </div>
    )
  }

  const features = [
    { icon: Database, title: 'Offline-First SQLite', desc: 'Double-ciphered local floor database reconciles with cloud on reconnect. Zero reliance on continuous internet.', href: '/docs#sqlite' },
    { icon: Layers, title: 'Barcode & SKU Engine', desc: 'Scan bales, fabric yards, and chemical batches. Auto-triggers reorder alerts at configurable thresholds.', href: '/docs#inventory' },
    { icon: Smartphone, title: 'Mobile Floor Handhelds', desc: 'Workers log piece-rate counts and attendance from Android terminals over local WiFi mesh — no cloud hop.', href: '/docs#mobile' },
    { icon: ShieldCheck, title: 'AI Sentinel CCTV', desc: 'Virtual zone boundaries with on-device inference. Instant local alerts — no recurring cloud storage fees.', href: '/docs#data-safety' },
    { icon: BarChart4, title: 'Double-Entry Khata', desc: 'Receipts, bank entries, and ledger credits with one-click P&L, aging, and mandi-index reconciliation.', href: '/docs#invoices' },
    { icon: Globe2, title: 'Multilingual Floor UI', desc: 'Urdu Nastaliq and English for local karigars and international administrators on the same deployment.', href: '/docs#troubleshoot' },
  ]

  const comparisonRows = [
    { metric: 'Internet Dependency', noxis: '100% offline (local mesh grid)', cloud: 'Fails on signal drop', manual: 'Paper only' },
    { metric: 'Karigar Payroll', noxis: '1-click automated piece-rate', cloud: 'Manual Excel formulas', manual: '3–5 days manual calc' },
    { metric: 'Peshgi Advance Safeguards', noxis: 'Hard-coded alerts & wage deduct', cloud: 'No advance ledger hooks', manual: 'High dispute rate' },
    { metric: 'Floor Security', noxis: 'On-device AI CCTV Sentinel', cloud: 'Expensive cloud cameras', manual: 'No intrusion tracking' },
    { metric: 'B2B Portal & Webhooks', noxis: 'HMAC-SHA256 signed event logs', cloud: 'Limited / costly APIs', manual: 'No electronic trail' },
    { metric: 'Total Cost of Ownership', noxis: 'One-time setup, zero SaaS rent', cloud: 'Per-seat monthly licenses', manual: 'Hidden loss from errors' },
  ]

  const cockpitTabs = [
    { id: 'karigar', label: 'Karigar Ledger', icon: <CircleDollarSign size={16} /> },
    { id: 'sqlite', label: 'Offline SQLite', icon: <Terminal size={16} /> },
    { id: 'khata', label: 'Cashflow Khata', icon: <BarChart4 size={16} /> },
    { id: 'cctv', label: 'AI CCTV Sentinel', icon: <ShieldAlert size={16} /> },
  ]

  return (
    <>
      <AnimatePresence>{showIntro && <LandingIntro onDone={finishIntro} />}</AnimatePresence>

      <div
        className="font-sans min-h-screen selection:text-black overflow-x-hidden text-[#E2E8F0]"
        style={{ background: OBSIDIAN }}
      >
        <LandingBackdrop />

        <div className="relative z-10">
          <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.04] bg-[#050507]/85 backdrop-blur-2xl"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[76px] flex items-center justify-between gap-4">
              <NavBrand />

              <div className="hidden lg:flex items-center gap-10">
                {[{ label: 'Pricing', href: '/pricing' }, { label: 'Reviews', href: '/reviews' }, { label: 'Blog', href: '/blog' }, { label: 'Docs', href: '/docs' }].map((link) => (
                  <Link key={link.href} href={link.href} className="text-[10px] text-[#94A3B8] hover:text-[#E8D5B5] font-bold tracking-[0.18em] uppercase transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>

              <Link
                href="/download"
                className="hidden lg:inline-flex items-center text-[10px] font-bold tracking-[0.2em] uppercase px-6 py-2.5 rounded-sm transition-all"
                style={{ background: CHAMPAGNE, color: OBSIDIAN, boxShadow: `0 0 40px ${CHAMPAGNE}22` }}
              >
                Download Studio
              </Link>

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
                    {[{ label: 'Pricing', href: '/pricing' }, { label: 'Reviews', href: '/reviews' }, { label: 'Blog', href: '/blog' }, { label: 'Docs', href: '/docs' }].map((link) => (
                      <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold tracking-widest uppercase text-[#94A3B8] hover:text-white">
                        {link.label}
                      </Link>
                    ))}
                    <Link href="/download" onClick={() => setMobileMenuOpen(false)} className="text-center text-[10px] font-bold tracking-widest uppercase py-3 rounded-sm" style={{ background: CHAMPAGNE, color: OBSIDIAN }}>
                      Download Studio
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.nav>

          {/* Hero */}
          <section className="pt-28 pb-12 lg:pt-40 lg:pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              <Reveal>
                <div className="mb-8 flex justify-center">
                  <BrandLogo size="hero" />
                </div>
              </Reveal>

              <Reveal delay={0.08}>
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 border mb-8"
                  style={{ borderColor: `${CHAMPAGNE}33`, background: `${CHAMPAGNE}0D` }}
                >
                  <Sparkles size={12} style={{ color: CHAMPAGNE }} />
                  <span className="text-[9px] font-bold tracking-[0.28em] uppercase" style={{ color: CHAMPAGNE_LIGHT }}>
                    Enterprise Manufacturing ERP
                  </span>
                </div>
              </Reveal>

              <SplitHeadline
                lines={[
                  { text: 'Industrial software.' },
                  { text: 'Built for the physical floor.', accent: true },
                ]}
              />

              <Reveal delay={0.2} className="mt-8">
                <p className="text-[#94A3B8] text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto font-medium">
                  Piece-rate karigar payroll, double-entry khata, offline SQLite mesh sync, and on-device AI CCTV — engineered for textile and rice mills with zero cloud rent.
                </p>
              </Reveal>

              <Reveal delay={0.28} className="w-full mt-10">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
                  <motion.div whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                    <Link
                      href="/download"
                      className="w-full inline-flex items-center justify-center gap-2 font-extrabold text-[10px] tracking-[0.2em] uppercase px-8 py-4 rounded-sm"
                      style={{ background: CHAMPAGNE, color: OBSIDIAN, boxShadow: `0 8px 48px ${CHAMPAGNE}28` }}
                    >
                      <Download size={14} /> Download Free Trial
                    </Link>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                    <a
                      href="https://wa.me/923334355475"
                      className="w-full inline-flex items-center justify-center gap-2 border border-white/[0.08] bg-white/[0.02] text-white font-extrabold text-[10px] tracking-[0.2em] uppercase px-8 py-4 rounded-sm backdrop-blur-sm"
                    >
                      Schedule Factory Demo
                    </a>
                  </motion.div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* Cockpit */}
          <section className="px-4 md:px-6 pb-24 max-w-7xl mx-auto">
            <Reveal className="mb-8 text-center lg:text-left">
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase mb-2" style={{ color: CHAMPAGNE }}>Live product preview</p>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Noxis Floor Cockpit — executive simulator</h2>
            </Reveal>

            <Reveal variant="scale" delay={0.1}>
              <motion.div
                className="rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0A0B0D]/90 backdrop-blur-xl shadow-[0_40px_120px_rgba(0,0,0,0.75)]"
                whileHover={{ boxShadow: '0 48px 140px rgba(0,0,0,0.85)' }}
                transition={{ duration: 0.4 }}
              >
                <div className="bg-[#070708] border-b border-white/[0.04] px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Image src="/logos/noxis.png" alt="" width={20} height={20} className="rounded object-contain" />
                    <span className="h-2 w-2 rounded-full bg-[#EF4444]/90" />
                    <span className="h-2 w-2 rounded-full bg-[#C9A962]/90" />
                    <span className="h-2 w-2 rounded-full bg-[#10B981]/90" />
                    <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase ml-1 hidden sm:inline">Cockpit v13.1</span>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 text-[9px] font-mono uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-[#10B981]"><Wifi size={11} /> Mesh</span>
                    <span className="flex items-center gap-1.5 text-[#C9A962]"><Lock size={11} /> AES-256</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px] lg:min-h-[480px]">
                  <CockpitTabs
                    tabs={cockpitTabs}
                    activeId={activeTab}
                    onSelect={(id) => setActiveTab(id as CockpitTab)}
                  />

                  <div className="lg:col-span-9 p-4 sm:p-6 bg-[#0A0B0D] flex flex-col min-h-[360px]">
                    <AnimatePresence mode="wait">
                      {activeTab === 'karigar' && (
                        <motion.div key="karigar" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.25 }} className="flex-1 flex flex-col">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: CHAMPAGNE }}>Karigar piece-rate ledger</h3>
                            <span className="text-[10px] font-mono text-gray-500">May 2026</span>
                          </div>
                          <div className="overflow-x-auto rounded-lg border border-white/[0.04] bg-black/30 -mx-1 px-1">
                            <table className="w-full text-left font-mono text-[11px] min-w-[640px]">
                              <thead>
                                <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                                  {['Karigar', 'Shift', 'Attend.', 'Yds', 'Peshgi', 'Net', 'Dispatch'].map((h) => (
                                    <th key={h} className={`p-2.5 sm:p-3 text-[9px] font-bold text-gray-500 uppercase ${['Yds', 'Peshgi', 'Net'].includes(h) ? 'text-right' : ''} ${h === 'Dispatch' ? 'text-center' : ''}`}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {karigarRows.map((w, i) => (
                                  <motion.tr
                                    key={w.name}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="border-b border-white/[0.02]"
                                  >
                                    <td className="p-2.5 sm:p-3 font-semibold text-white">{w.name}</td>
                                    <td className="p-2.5 sm:p-3 text-gray-400">{w.shift}</td>
                                    <td className="p-2.5 sm:p-3"><span className={w.attendance === 'Present' ? 'text-[#10B981]' : 'text-[#F59E0B]'}>{w.attendance}</span></td>
                                    <td className="p-2.5 sm:p-3 text-right text-gray-300">{w.yds}</td>
                                    <td className="p-2.5 sm:p-3 text-right text-[#EF4444]">{w.adv}</td>
                                    <td className="p-2.5 sm:p-3 text-right font-bold" style={{ color: CHAMPAGNE }}>{w.net}</td>
                                    <td className="p-2.5 sm:p-3 text-center"><span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded bg-[#10B981]/12 text-[#10B981]">{w.status}</span></td>
                                  </motion.tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <footer className="mt-4 pt-4 border-t border-white/[0.04] flex flex-col sm:flex-row justify-between gap-2 text-[10px] font-mono text-gray-500">
                            <span>4 pay slips compiled</span>
                            <span className="font-bold" style={{ color: CHAMPAGNE_LIGHT }}>Total · ₨ 160,500</span>
                          </footer>
                        </motion.div>
                      )}

                      {activeTab === 'sqlite' && (
                        <motion.div key="sqlite" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.25 }} className="flex-1 flex flex-col">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: CHAMPAGNE }}>Offline SQLite sync console</h3>
                            <span className="text-[10px] font-mono text-gray-500">AES-256</span>
                          </div>
                          <TypewriterConsole lines={sqliteLogs} />
                          <footer className="mt-4 pt-4 border-t border-white/[0.04] flex justify-between text-[10px] font-mono text-gray-500">
                            <span>4.09 MB local</span>
                            <span className="text-[#10B981]">Zero-loss sync</span>
                          </footer>
                        </motion.div>
                      )}

                      {activeTab === 'khata' && (
                        <motion.div key="khata" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.25 }} className="flex-1 flex flex-col gap-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: CHAMPAGNE }}>Cashflow khata & mandi index</h3>
                            <span className="flex items-center gap-1 text-[10px] font-mono text-[#10B981]"><TrendingUp size={12} /> Grade A P&L</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {mandiRates.map((m, i) => (
                              <motion.div
                                key={m.commodity}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="p-3 rounded-lg border border-white/[0.04] bg-white/[0.02]"
                              >
                                <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">{m.commodity}</p>
                                <p className="text-sm font-bold text-white font-mono">{m.rate}</p>
                                <p className={`text-[10px] font-mono mt-1 ${m.delta.startsWith('+') ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{m.delta}</p>
                              </motion.div>
                            ))}
                          </div>
                          <div className="overflow-x-auto rounded-lg border border-white/[0.04] bg-black/30">
                            <table className="w-full font-mono text-[11px] min-w-[520px]">
                              <thead>
                                <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                                  {['Txn', 'Description', 'Debit', 'Credit', 'Balance'].map((h) => (
                                    <th key={h} className={`p-3 text-[9px] font-bold text-gray-500 uppercase ${h !== 'Txn' && h !== 'Description' ? 'text-right' : ''}`}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {khataRows.map((r) => (
                                  <tr key={r.id} className="border-b border-white/[0.02]">
                                    <td className="p-3 text-gray-500 font-bold">{r.id}</td>
                                    <td className="p-3 text-white font-medium">{r.desc}</td>
                                    <td className="p-3 text-right text-[#EF4444]">{r.dr}</td>
                                    <td className="p-3 text-right text-[#10B981]">{r.cr}</td>
                                    <td className="p-3 text-right font-bold" style={{ color: CHAMPAGNE }}>{r.bal}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'cctv' && (
                        <motion.div key="cctv" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.25 }} className="flex-1 flex flex-col">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: CHAMPAGNE }}>AI CCTV sentinel feed</h3>
                            <span className="text-[10px] font-mono text-gray-500">0.12ms inference</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                            <div className="relative aspect-video rounded-lg border border-white/[0.06] bg-[#030304] overflow-hidden">
                              <motion.div
                                className="absolute inset-0 opacity-40"
                                style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(34,211,238,0.08) 50%, transparent 100%)' }}
                                animate={{ y: ['-100%', '200%'] }}
                                transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
                              />
                              <svg className="absolute inset-0 w-full h-full opacity-40" aria-hidden>
                                <line x1="10%" y1="70%" x2="90%" y2="70%" stroke="#C9A962" strokeWidth="1" strokeDasharray="4 4" />
                                <line x1="30%" y1="20%" x2="30%" y2="80%" stroke="#10B981" strokeWidth="1" strokeDasharray="4 4" />
                                <rect x="33%" y="28%" width="22%" height="28%" fill="none" stroke="#10B981" strokeWidth="1.5" />
                              </svg>
                              <div className="absolute top-3 left-3 text-[8px] font-mono font-bold uppercase flex items-center gap-1.5 bg-black/80 text-[#EF4444] px-2 py-1 rounded">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444] animate-pulse" /> Cam 01
                              </div>
                              <div className="absolute top-[28%] left-[33%] w-[22%] h-[28%] border border-[#10B981]/60 rounded-sm p-1">
                                <span className="text-[7px] font-mono text-[#10B981] bg-black/90 px-1 rounded uppercase">Weaver #04</span>
                              </div>
                            </div>
                            <div className="p-3 rounded-lg border border-white/[0.04] bg-black/40 font-mono text-[10px] space-y-2 overflow-y-auto max-h-[200px] md:max-h-none">
                              {cctvLogs.map((line, i) => (
                                <motion.p
                                  key={i}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: i * 0.12 }}
                                  className={line.includes('ALERT') ? 'text-[#EF4444] font-bold' : line.includes('MATCH') ? 'text-[#10B981]' : 'text-gray-500'}
                                >
                                  {line}
                                </motion.p>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </Reveal>
          </section>

          <SignatureMarquee items={marqueeItems} />

          <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
            <Reveal className="text-center mb-14 space-y-3">
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: CHAMPAGNE }}>Core capabilities</p>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">Elite ERP integration matrix</h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => (
                <FeatureCard key={f.title} href={f.href} icon={f.icon} title={f.title} desc={f.desc} index={i} />
              ))}
            </div>
          </section>

          <section className="py-20 px-4 sm:px-6 border-y border-white/[0.04] bg-[#070708]/50">
            <div className="max-w-7xl mx-auto space-y-12">
              <Reveal className="text-center space-y-3">
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: CHAMPAGNE }}>Enterprise benchmark</p>
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">Why leading factories specify Noxis</h2>
              </Reveal>
              <Reveal variant="scale">
                <div className="overflow-x-auto rounded-xl border border-white/[0.05] bg-[#0A0B0D]">
                  <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[720px]">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-[#070708]">
                        <th className="p-4 md:p-5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500 w-[22%]">Parameter</th>
                        <th className="p-4 md:p-5 text-[9px] font-bold uppercase tracking-[0.2em] text-center w-[26%]" style={{ color: CHAMPAGNE, background: `${CHAMPAGNE}08` }}>Noxis ERP</th>
                        <th className="p-4 md:p-5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500 text-center">Legacy cloud</th>
                        <th className="p-4 md:p-5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500 text-center">Manual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonRows.map((row, i) => (
                        <motion.tr
                          key={row.metric}
                          initial={{ opacity: 0, x: -16 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, margin: '-40px' }}
                          transition={{ delay: i * 0.06, duration: 0.5 }}
                          className="border-b border-white/[0.03] hover:bg-white/[0.01]"
                        >
                          <td className="p-4 md:p-5 font-bold text-white text-[11px] uppercase tracking-wide">{row.metric}</td>
                          <td className="p-4 md:p-5 text-center font-medium border-x border-white/[0.03]" style={{ background: `${CHAMPAGNE}06` }}>
                            <span className="inline-flex items-start justify-center gap-2 text-[11px]" style={{ color: CHAMPAGNE_LIGHT }}>
                              <Check size={14} className="text-[#10B981] shrink-0 mt-0.5" />
                              {row.noxis}
                            </span>
                          </td>
                          <td className="p-4 md:p-5 text-center text-gray-400">{row.cloud}</td>
                          <td className="p-4 md:p-5 text-center text-gray-500">{row.manual}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Reveal>
            </div>
          </section>

          <section className="py-24 px-4 sm:px-6 max-w-3xl mx-auto">
            <Reveal variant="scale">
              <motion.div
                className="rounded-2xl p-10 md:p-14 text-center border relative overflow-hidden"
                style={{ borderColor: `${CHAMPAGNE}40`, background: 'linear-gradient(165deg, rgba(201,169,98,0.06) 0%, rgba(10,11,13,0.95) 45%)' }}
                whileHover={{ scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 200, damping: 24 }}
              >
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-40" style={{ background: CHAMPAGNE }} />
                <div className="relative space-y-6">
                  <div className="flex justify-center mb-2">
                    <BrandLogo size="nav" showWordmark={false} />
                  </div>
                  <p className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: CHAMPAGNE }}>Founding cohort invitation</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Apply for the Noxis founding factory cohort</h3>
                  <p className="text-sm text-[#94A3B8] leading-relaxed max-w-md mx-auto">
                    White-glove onboarding: local mesh wiring, Urdu floor configuration, and tailored karigar payroll for verified plants.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                    <motion.a
                      href="https://wa.me/923334355475"
                      whileTap={{ scale: 0.97 }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-extrabold text-[10px] tracking-[0.2em] uppercase py-4 px-8 rounded-sm"
                      style={{ background: '#25D366', color: OBSIDIAN }}
                    >
                      <MessageSquare size={14} /> WhatsApp founding board
                    </motion.a>
                    <motion.div whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                      <Link
                        href="/download"
                        className="w-full inline-flex items-center justify-center gap-2 border font-extrabold text-[10px] tracking-[0.2em] uppercase py-4 px-8 rounded-sm"
                        style={{ borderColor: `${CHAMPAGNE}50`, color: CHAMPAGNE_LIGHT }}
                      >
                        <Download size={14} /> Download studio
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </Reveal>
          </section>

          <footer className="border-t border-white/[0.04] py-14 px-4 sm:px-6" style={{ background: '#030304' }}>
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <BrandLogo size="footer" />
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Image src="/logos/omnoralabs.png" alt="Omnora Labs" width={72} height={20} className="h-5 w-auto object-contain opacity-60" />
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                {[{ label: 'Download', href: '/download' }, { label: 'Pricing', href: '/pricing' }, { label: 'Reviews', href: '/reviews' }, { label: 'Blog', href: '/blog' }, { label: 'Docs', href: '/docs' }, { label: 'Privacy', href: '/privacy' }].map((l) => (
                  <Link key={l.href} href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                ))}
              </div>
              <p className="text-center md:text-right text-xs text-gray-600">© 2026 Noxis Hub · Engineered in Pakistan</p>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}
