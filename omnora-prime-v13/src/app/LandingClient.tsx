'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Database, Layers, Smartphone, ShieldCheck, BarChart4, Globe2,
  Download, Check, X, Menu, Terminal, CircleDollarSign,
  ShieldAlert, Sparkles, MessageSquare, Wifi, Lock, TrendingUp,
} from 'lucide-react'

type CockpitTab = 'karigar' | 'sqlite' | 'khata' | 'cctv'

const CHAMPAGNE = '#C9A962'
const CHAMPAGNE_LIGHT = '#E8D5B5'
const OBSIDIAN = '#050507'

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

export default function LandingClient() {
  const router = useRouter()
  const supabase = createClient()

  const [checking, setChecking] = useState(() =>
    typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron')
  )
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<CockpitTab>('karigar')

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: OBSIDIAN }}>
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

  const cockpitTabs: { id: CockpitTab; label: string; icon: React.ReactNode }[] = [
    { id: 'karigar', label: 'Karigar Ledger', icon: <CircleDollarSign size={16} /> },
    { id: 'sqlite', label: 'Offline SQLite', icon: <Terminal size={16} /> },
    { id: 'khata', label: 'Cashflow Khata', icon: <BarChart4 size={16} /> },
    { id: 'cctv', label: 'AI CCTV Sentinel', icon: <ShieldAlert size={16} /> },
  ]

  return (
    <div
      className="font-sans min-h-screen selection:text-black overflow-x-hidden text-[#E2E8F0]"
      style={{ background: OBSIDIAN }}
    >
      {/* Obsidian + champagne ambient */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 inset-x-0 h-[900px] bg-gradient-to-b from-[#1a1520]/40 via-transparent to-transparent" />
        <div
          className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px] opacity-[0.07]"
          style={{ background: CHAMPAGNE }}
        />
      </div>

      <div className="relative z-10">
        {/* Nav */}
        <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.04] bg-[#050507]/80 backdrop-blur-2xl">
          <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="font-bold text-sm tracking-[0.28em] text-white group-hover:text-[#C9A962] transition-colors">NOXIS</span>
              <span className="h-4 w-px bg-white/10" />
              <span className="text-[9px] tracking-[0.2em] text-[#94A3B8] font-semibold uppercase">Enterprise ERP</span>
            </Link>

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
        </nav>

        {/* Hero */}
        <section className="pt-32 pb-16 lg:pt-44 lg:pb-24 px-6 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8 max-w-4xl mx-auto"
          >
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 border"
              style={{ borderColor: `${CHAMPAGNE}33`, background: `${CHAMPAGNE}0D` }}
            >
              <Sparkles size={12} style={{ color: CHAMPAGNE }} />
              <span className="text-[9px] font-bold tracking-[0.28em] uppercase" style={{ color: CHAMPAGNE_LIGHT }}>
                Enterprise Manufacturing ERP
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-[4.25rem] font-bold tracking-tight leading-[1.02] text-white">
              Industrial software.<br />
              <span style={{ color: CHAMPAGNE }}>Built for the physical floor.</span>
            </h1>

            <p className="text-[#94A3B8] text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto font-medium">
              Piece-rate karigar payroll, double-entry khata, offline SQLite mesh sync, and on-device AI CCTV — engineered for textile and rice mills with zero cloud rent and zero internet dependency.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/download"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-extrabold text-[10px] tracking-[0.2em] uppercase px-8 py-4 rounded-sm transition-all"
                style={{ background: CHAMPAGNE, color: OBSIDIAN, boxShadow: `0 8px 48px ${CHAMPAGNE}28` }}
              >
                <Download size={14} /> Download Free Trial
              </Link>
              <a
                href="https://wa.me/923334355475"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-white font-extrabold text-[10px] tracking-[0.2em] uppercase px-8 py-4 rounded-sm transition-all backdrop-blur-sm"
              >
                Schedule Factory Demo
              </a>
            </div>
          </motion.div>
        </section>

        {/* Interactive cockpit */}
        <section className="px-4 md:px-6 pb-24 max-w-7xl mx-auto">
          <div className="mb-8 text-center lg:text-left">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase mb-2" style={{ color: CHAMPAGNE }}>Live product preview</p>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Noxis Floor Cockpit — executive simulator</h2>
          </div>

          <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0A0B0D]/90 backdrop-blur-xl shadow-[0_40px_120px_rgba(0,0,0,0.75)]">
            <div className="bg-[#070708] border-b border-white/[0.04] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#EF4444]/90" />
                <span className="h-2 w-2 rounded-full bg-[#C9A962]/90" />
                <span className="h-2 w-2 rounded-full bg-[#10B981]/90" />
                <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase ml-3">Noxis Floor Cockpit v13.1</span>
              </div>
              <div className="flex items-center gap-4 text-[9px] font-mono uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-[#10B981]">
                  <Wifi size={11} /> Mesh sync active
                </span>
                <span className="flex items-center gap-1.5 text-[#C9A962]">
                  <Lock size={11} /> AES-256 local
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
              <aside className="lg:col-span-3 bg-[#070708] border-b lg:border-b-0 lg:border-r border-white/[0.04] p-3 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
                {cockpitTabs.map((tab) => {
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-none lg:w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-[10px] font-bold uppercase tracking-[0.12em] transition-all duration-200 ${
                        isActive ? 'text-[#050507] shadow-lg' : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.03]'
                      }`}
                      style={isActive ? { background: CHAMPAGNE } : undefined}
                    >
                      {tab.icon}
                      <span className="whitespace-nowrap">{tab.label}</span>
                    </button>
                  )
                })}
              </aside>

              <div className="lg:col-span-9 p-5 sm:p-6 bg-[#0A0B0D] flex flex-col">
                <AnimatePresence mode="wait">
                  {activeTab === 'karigar' && (
                    <motion.div key="karigar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex-1 flex flex-col">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: CHAMPAGNE }}>Karigar piece-rate ledger</h3>
                        <span className="text-[10px] font-mono text-gray-500">Payroll cycle · May 2026</span>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-white/[0.04] bg-black/30">
                        <table className="w-full text-left font-mono text-[11px]">
                          <thead>
                            <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                              {['Karigar', 'Shift', 'Attendance', 'Output (yds)', 'Peshgi', 'Net wages', 'Dispatch'].map((h) => (
                                <th key={h} className={`p-3 text-[9px] font-bold text-gray-500 uppercase tracking-wider ${h.includes('yds') || h.includes('Peshgi') || h.includes('Net') ? 'text-right' : ''} ${h === 'Dispatch' ? 'text-center' : ''}`}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {karigarRows.map((w) => (
                              <tr key={w.name} className="border-b border-white/[0.02] hover:bg-white/[0.015]">
                                <td className="p-3 font-semibold text-white">{w.name}</td>
                                <td className="p-3 text-gray-400">{w.shift}</td>
                                <td className="p-3">
                                  <span className={w.attendance === 'Present' ? 'text-[#10B981]' : 'text-[#F59E0B]'}>{w.attendance}</span>
                                </td>
                                <td className="p-3 text-right text-gray-300">{w.yds}</td>
                                <td className="p-3 text-right text-[#EF4444]">{w.adv}</td>
                                <td className="p-3 text-right font-bold" style={{ color: CHAMPAGNE }}>{w.net}</td>
                                <td className="p-3 text-center">
                                  <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded bg-[#10B981]/12 text-[#10B981]">{w.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <footer className="mt-4 pt-4 border-t border-white/[0.04] flex justify-between text-[10px] font-mono text-gray-500">
                        <span>4 pay slips compiled</span>
                        <span className="font-bold" style={{ color: CHAMPAGNE_LIGHT }}>Total disbursed · ₨ 160,500</span>
                      </footer>
                    </motion.div>
                  )}

                  {activeTab === 'sqlite' && (
                    <motion.div key="sqlite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex-1 flex flex-col">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: CHAMPAGNE }}>Offline SQLite sync console</h3>
                        <span className="text-[10px] font-mono text-gray-500">AES-256 · double encrypted</span>
                      </div>
                      <div className="flex-1 p-4 rounded-lg border border-white/[0.04] bg-black/50 font-mono text-[11px] space-y-1.5 overflow-y-auto max-h-[320px]">
                        {sqliteLogs.map((line, i) => (
                          <p key={i} className={line.includes('SUCCESS') || line.includes('STABILITY') ? 'text-[#10B981]' : line.includes('OFFLINE') ? 'text-[#C9A962]' : 'text-gray-500'}>
                            {line}
                          </p>
                        ))}
                      </div>
                      <footer className="mt-4 pt-4 border-t border-white/[0.04] flex justify-between text-[10px] font-mono text-gray-500">
                        <span>Local store · 4.09 MB</span>
                        <span className="text-[#10B981]">Zero-loss reconciliation enabled</span>
                      </footer>
                    </motion.div>
                  )}

                  {activeTab === 'khata' && (
                    <motion.div key="khata" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex-1 flex flex-col gap-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: CHAMPAGNE }}>Cashflow khata & mandi index</h3>
                        <span className="flex items-center gap-1 text-[10px] font-mono text-[#10B981]">
                          <TrendingUp size={12} /> P&L · Grade A eligible
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {mandiRates.map((m) => (
                          <div key={m.commodity} className="p-3 rounded-lg border border-white/[0.04] bg-white/[0.02]">
                            <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">{m.commodity}</p>
                            <p className="text-sm font-bold text-white font-mono">{m.rate}</p>
                            <p className={`text-[10px] font-mono mt-1 ${m.delta.startsWith('+') ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{m.delta} today</p>
                          </div>
                        ))}
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-white/[0.04] bg-black/30">
                        <table className="w-full font-mono text-[11px]">
                          <thead>
                            <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                              {['Txn', 'Description', 'Debit', 'Credit', 'Balance'].map((h) => (
                                <th key={h} className={`p-3 text-[9px] font-bold text-gray-500 uppercase ${h !== 'Txn' && h !== 'Description' ? 'text-right' : ''}`}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {khataRows.map((r) => (
                              <tr key={r.id} className="border-b border-white/[0.02] hover:bg-white/[0.015]">
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
                    <motion.div key="cctv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex-1 flex flex-col">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: CHAMPAGNE }}>AI CCTV sentinel feed</h3>
                        <span className="text-[10px] font-mono text-gray-500">On-device · 0.12ms inference</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                        <div className="relative aspect-video rounded-lg border border-white/[0.06] bg-[#030304] overflow-hidden">
                          <svg className="absolute inset-0 w-full h-full opacity-30" aria-hidden>
                            <line x1="10%" y1="70%" x2="90%" y2="70%" stroke="#C9A962" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1="30%" y1="20%" x2="30%" y2="80%" stroke="#10B981" strokeWidth="1" strokeDasharray="4 4" />
                            <rect x="33%" y="28%" width="22%" height="28%" fill="none" stroke="#10B981" strokeWidth="1.5" />
                          </svg>
                          <div className="absolute top-3 left-3 text-[8px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 bg-black/80 text-[#EF4444] px-2 py-1 rounded">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444] animate-pulse" /> Weaving cam 01
                          </div>
                          <div className="absolute bottom-3 right-3 text-[8px] font-mono text-gray-500">Floor feed · live</div>
                          <div className="absolute top-[28%] left-[33%] w-[22%] h-[28%] border border-[#10B981]/60 rounded-sm flex items-start p-1">
                            <span className="text-[7px] font-mono text-[#10B981] bg-black/90 px-1 rounded uppercase">Weaver #04</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg border border-white/[0.04] bg-black/40 font-mono text-[10px] space-y-2 overflow-y-auto">
                          {cctvLogs.map((line, i) => (
                            <p key={i} className={line.includes('ALERT') ? 'text-[#EF4444] font-bold' : line.includes('MATCH') ? 'text-[#10B981]' : 'text-gray-500'}>
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                      <footer className="mt-4 pt-4 border-t border-white/[0.04] text-[10px] font-mono text-gray-500">
                        4 cameras active · virtual zones armed
                      </footer>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <div className="border-y border-white/[0.04] bg-white/[0.015] py-5">
          <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-x-10 gap-y-3 text-[10px] font-bold tracking-[0.22em] uppercase text-[#64748B]">
            {['Textile mills', 'Rice mills', 'Karigar payroll', 'Offline ERP', 'Urdu floor UI', 'Barcode inventory', 'Double-entry khata'].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>

        {/* Features */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: CHAMPAGNE }}>Core capabilities</p>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">Elite ERP integration matrix</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className="group p-8 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:border-[#C9A962]/20 hover:bg-white/[0.03] transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-lg flex items-center justify-center border border-[#C9A962]/15 bg-[#C9A962]/5 mb-6 group-hover:border-[#C9A962]/30 transition-colors">
                  <f.icon size={20} style={{ color: CHAMPAGNE }} />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">{f.title}</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">{f.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Comparison */}
        <section className="py-20 px-6 border-y border-white/[0.04] bg-[#070708]/50">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: CHAMPAGNE }}>Enterprise benchmark</p>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">Why leading factories specify Noxis</h2>
            </div>
            <div className="overflow-x-auto rounded-xl border border-white/[0.05] bg-[#0A0B0D]">
              <table className="w-full text-left text-xs md:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-[#070708]">
                    <th className="p-4 md:p-5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500 w-[22%]">Parameter</th>
                    <th className="p-4 md:p-5 text-[9px] font-bold uppercase tracking-[0.2em] text-center w-[26%]" style={{ color: CHAMPAGNE, background: `${CHAMPAGNE}08` }}>
                      Noxis Industrial ERP
                    </th>
                    <th className="p-4 md:p-5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500 text-center">Legacy cloud ERP</th>
                    <th className="p-4 md:p-5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500 text-center">Manual registers</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.metric} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                      <td className="p-4 md:p-5 font-bold text-white text-[11px] uppercase tracking-wide">{row.metric}</td>
                      <td className="p-4 md:p-5 text-center font-medium border-x border-white/[0.03]" style={{ background: `${CHAMPAGNE}06` }}>
                        <span className="inline-flex items-start justify-center gap-2 text-[11px]" style={{ color: CHAMPAGNE_LIGHT }}>
                          <Check size={14} className="text-[#10B981] shrink-0 mt-0.5" />
                          {row.noxis}
                        </span>
                      </td>
                      <td className="p-4 md:p-5 text-center text-gray-400">{row.cloud}</td>
                      <td className="p-4 md:p-5 text-center text-gray-500">{row.manual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6 max-w-3xl mx-auto">
          <div
            className="rounded-2xl p-10 md:p-14 text-center border relative overflow-hidden"
            style={{ borderColor: `${CHAMPAGNE}40`, background: 'linear-gradient(165deg, rgba(201,169,98,0.06) 0%, rgba(10,11,13,0.95) 45%)' }}
          >
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-40" style={{ background: CHAMPAGNE }} />
            <div className="relative space-y-6">
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: CHAMPAGNE }}>Founding cohort invitation</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Apply for the Noxis founding factory cohort
              </h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed max-w-md mx-auto">
                White-glove onboarding: local mesh wiring, Urdu floor configuration, and tailored karigar payroll templates for verified industrial plants.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <a
                  href="https://wa.me/923334355475"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-extrabold text-[10px] tracking-[0.2em] uppercase py-4 px-8 rounded-sm transition-all"
                  style={{ background: '#25D366', color: OBSIDIAN }}
                >
                  <MessageSquare size={14} /> WhatsApp founding board
                </a>
                <Link
                  href="/download"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border font-extrabold text-[10px] tracking-[0.2em] uppercase py-4 px-8 rounded-sm transition-all"
                  style={{ borderColor: `${CHAMPAGNE}50`, color: CHAMPAGNE_LIGHT }}
                >
                  <Download size={14} /> Download studio
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.04] py-14 px-6" style={{ background: '#030304' }}>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white tracking-[0.25em] text-xs">NOXIS</span>
              <span className="text-gray-700">·</span>
              <span>Omnora Labs</span>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase tracking-widest">
              {[{ label: 'Download', href: '/download' }, { label: 'Pricing', href: '/pricing' }, { label: 'Reviews', href: '/reviews' }, { label: 'Blog', href: '/blog' }, { label: 'Docs', href: '/docs' }, { label: 'Privacy', href: '/privacy' }].map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
              ))}
            </div>
            <p className="text-center md:text-right text-gray-600">
              © 2026 Noxis Hub · Engineered in Pakistan
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
