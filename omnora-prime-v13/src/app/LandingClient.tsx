'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Database, Layers, Smartphone, ShieldCheck, BarChart4, Globe2, 
  Zap, ArrowRight, Download, Check, X, Menu, Terminal, CircleDollarSign, 
  ShieldAlert, Sparkles, ChevronRight, MessageSquare
} from 'lucide-react'

export default function LandingClient() {
  const router = useRouter()
  const supabase = createClient()
  
  const [checking, setChecking] = useState(() =>
    typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron')
  )
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'karigar' | 'sqlite' | 'khata' | 'cctv'>('karigar')
  
  // Dynamic screen width detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-redirect checks for native Electron builds
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

  if (checking) return (
    <div className="min-h-screen bg-[#050507] flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 border-2 border-[#D97706]/20 border-t-[#D97706] rounded-full"
      />
    </div>
  )

  const features = [
    { 
      icon: <Database size={20} className="text-[#F59E0B]" />, 
      title: 'Offline-First SQLite', 
      desc: 'Double-ciphered local floor database that reconciles automatically with cloud on reconnect. Zero reliance on continuous internet.',
      color: 'gold', 
      href: '/docs#sqlite' 
    },
    { 
      icon: <Layers size={20} className="text-[#F59E0B]" />, 
      title: 'Barcode & SKU Engine', 
      desc: 'Scan, store, and manage raw bales, fabric yards, chemical batches. Auto-triggers reorder level alerts.', 
      color: 'gold', 
      href: '/docs#inventory' 
    },
    { 
      icon: <Smartphone size={20} className="text-[#F59E0B]" />, 
      title: 'Mobile Floor Handhelds', 
      desc: 'Workers log piece-rate counts and attendance from Android terminals paired via local WiFi instantly.', 
      color: 'gold', 
      href: '/docs#mobile' 
    },
    { 
      icon: <ShieldCheck size={20} className="text-[#F59E0B]" />, 
      title: 'AI Sentinel CCTV', 
      desc: 'Draw virtual zone boundaries. Triggers instant local alerts for unauthorized entries — no cloud storage fees.', 
      color: 'gold', 
      href: '/docs#data-safety' 
    },
    { 
      icon: <BarChart4 size={20} className="text-[#F59E0B]" />, 
      title: 'Double-Entry Accounting', 
      desc: 'Log receipts, bank entries, and ledger credits. Generate P&L and aging accounts with one click.', 
      color: 'gold', 
      href: '/docs#invoices' 
    },
    { 
      icon: <Globe2 size={20} className="text-[#F59E0B]" />, 
      title: 'Multilingual Scripts', 
      desc: 'Switch Urdu Nastaliq and English instantly to accommodate local workers and international administrators.', 
      color: 'gold', 
      href: '/docs#troubleshoot' 
    },
  ]

  const comparisonRows = [
    { 
      metric: 'Internet Dependency', 
      noxis: '100% Offline (Local Mesh Grid)', 
      cloud: 'Fails entirely on signal drop', 
      manual: 'Not applicable (paper registers)' 
    },
    { 
      metric: 'Karigar Payroll Processing', 
      noxis: 'Instant (1-click automated calculation)', 
      cloud: 'Excel formulas (manual inputs required)', 
      manual: 'Takes 3-5 days of manual calculation' 
    },
    { 
      metric: 'Peshgi Advance Safeguards', 
      noxis: 'Hard-coded alerts & automatic wage deduct', 
      cloud: 'No built-in advance ledger hooks', 
      manual: 'High rate of manual ledger disputes' 
    },
    { 
      metric: 'Floor Security & Intrusion', 
      noxis: 'Real-time AI CCTV (Local on-device execution)', 
      cloud: 'Requires expensive Cloud cameras', 
      manual: 'Zero tracking (vulnerable to theft)' 
    },
    { 
      metric: 'B2B Client Portal & Webhooks', 
      noxis: 'HMAC-SHA256 cryptographically signed logs', 
      cloud: 'Limited integrations or high API fees', 
      manual: 'No electronic logs available' 
    },
    { 
      metric: 'Setup & Operation Cost', 
      noxis: 'One-time setup (Zero recurring software fees)', 
      cloud: 'High monthly per-user cloud license fees', 
      manual: 'High loss due to bookkeeping mistakes' 
    },
  ]

  return (
    <div className="bg-[#050507] text-[#E2E8F0] font-sans min-h-screen selection:bg-[#D97706] selection:text-black overflow-x-hidden">
      {/* Luxury Background Shading */}
      <div className="absolute top-0 inset-x-0 h-[800px] bg-gradient-to-b from-[#1E1B4B]/15 via-transparent to-transparent pointer-events-none" />

      {/* Nav Section */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.03] bg-[#050507]/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 cursor-pointer group">
            <span className="font-bold text-base tracking-[0.25em] text-white group-hover:text-[#F59E0B] transition-colors">NOXIS</span>
            <span className="h-4 w-px bg-white/10" />
            <span className="text-[10px] tracking-widest text-[#94A3B8] font-semibold uppercase">Enterprise</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-10">
            {[{ label: 'Pricing', href: '/pricing' }, { label: 'Reviews', href: '/reviews' }, { label: 'Blog', href: '/blog' }, { label: 'Docs', href: '/docs' }].map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="text-xs text-[#94A3B8] hover:text-white font-bold tracking-widest uppercase transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center">
            <Link 
              href="/download" 
              className="inline-flex items-center justify-center text-[10px] font-bold tracking-widest uppercase text-black bg-[#F59E0B] hover:bg-[#D97706] px-6 py-3 rounded-md transition-all shadow-[0_0_30px_rgba(245,158,11,0.15)]"
            >
              Download Studio
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white/70 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-20 left-0 right-0 bg-[#07070A] border-b border-white/[0.05] py-6 px-6 lg:hidden flex flex-col gap-6"
            >
              {[{ label: 'Pricing', href: '/pricing' }, { label: 'Reviews', href: '/reviews' }, { label: 'Blog', href: '/blog' }, { label: 'Docs', href: '/docs' }].map((link) => (
                <Link 
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs text-[#94A3B8] hover:text-white font-bold tracking-widest uppercase transition-colors py-1"
                >
                  {link.label}
                </Link>
              ))}
              <Link 
                href="/download"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center text-[10px] font-bold tracking-widest uppercase text-black bg-[#F59E0B] py-3 rounded-md text-center"
              >
                Download Studio
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 lg:pt-48 lg:pb-28 px-6 max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
        <div className="space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-full px-4 py-1.5">
            <Sparkles size={12} className="text-[#F59E0B]" />
            <span className="text-[9px] font-bold text-[#F59E0B] tracking-[0.25em] uppercase">Enterprise Manufacturing ERP</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.05] text-white">
            Heavy-Duty Software.<br />Built for the <span className="text-[#F59E0B]">Physical Floor.</span>
          </h1>

          <p className="text-[#94A3B8] text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto font-medium">
            Manage floor inventory, automated piece-rate karigar payroll, double-entry ledgers, and secure on-device CCTV Sentinelcam feeds. Runs reliably with **zero internet reliance** and zero recurring cloud costs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/download" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-extrabold text-xs tracking-widest uppercase px-8 py-4 rounded-md transition-all shadow-[0_0_40px_rgba(245,158,11,0.2)]"
            >
              <Download size={14} /> Download Free Trial
            </Link>
            <a 
              href="https://wa.me/923334355475"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04] text-white font-extrabold text-xs tracking-widest uppercase px-8 py-4 rounded-md transition-all"
            >
              Schedule Factory Demo
            </a>
          </div>
        </div>
      </section>

      {/* Noxis Dashboard interactive Simulator */}
      <section className="px-4 md:px-6 pb-28 max-w-7xl mx-auto">
        <div className="bg-[#0B0C0E] border border-white/[0.04] rounded-2xl overflow-hidden shadow-[0_32px_96px_rgba(0,0,0,0.8)]">
          {/* Workstation Top Bar */}
          <div className="bg-[#08080A] border-b border-white/[0.04] px-5 py-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
              <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase ml-4">Noxis Floor Cockpit v13.1</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] text-[#10B981] bg-[#10B981]/10 px-3 py-1 rounded font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
                Offline Grid Sync Active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Interactive Tab Selector - Left Sidebar */}
            <div className="lg:col-span-3 bg-[#08080A] border-r border-white/[0.03] p-4 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible no-scrollbar">
              {[
                { id: 'karigar', label: 'Karigar Ledger', icon: <CircleDollarSign size={16} /> },
                { id: 'sqlite', label: 'Offline SQLite', icon: <Terminal size={16} /> },
                { id: 'khata', label: 'Finance Khata', icon: <BarChart4 size={16} /> },
                { id: 'cctv', label: 'AI CCTV Sentinel', icon: <ShieldAlert size={16} /> },
              ].map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-none lg:flex-initial flex items-center gap-3 px-4 py-3.5 rounded-lg text-left text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                      isActive 
                        ? 'text-black bg-[#F59E0B] shadow-[0_4px_16px_rgba(245,158,11,0.15)]' 
                        : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.02]'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Dashboard simulator panel - Right Window */}
            <div className="lg:col-span-9 p-6 bg-[#0B0C0E] min-h-[420px] flex flex-col justify-between">
              <AnimatePresence mode="wait">
                {activeTab === 'karigar' && (
                  <motion.div 
                    key="karigar"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6 flex-1 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-[#F59E0B]">Karigar Piece-Rate Wage Dashboard</h3>
                        <span className="text-[10px] font-mono text-gray-500">PAYROLL CYCLE: MAY 2026</span>
                      </div>
                      <div className="overflow-x-auto border border-white/[0.03] rounded-lg bg-black/40">
                        <table className="w-full text-left border-collapse font-mono text-xs">
                          <thead>
                            <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                              <th className="p-3 text-[10px] font-bold text-gray-500 uppercase">Karigar (Worker)</th>
                              <th className="p-3 text-[10px] font-bold text-gray-500 uppercase">Shift</th>
                              <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-right">Output (Yds)</th>
                              <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-right">Peshgi (Adv)</th>
                              <th className="p-3 text-[10px] font-bold text-[#F59E0B] uppercase text-right">Net Wages</th>
                              <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-center">Receipt</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { name: 'Hamid Saeed', shift: 'Morning', yds: '1,420', adv: '₨ 12,500', net: '₨ 42,600', status: 'WhatsApp' },
                              { name: 'Muhammad Asif', shift: 'Morning', yds: '1,150', adv: '₨ 5,000', net: '₨ 39,200', status: 'WhatsApp' },
                              { name: 'Bilal Khan', shift: 'Night', yds: '1,560', adv: '₨ 18,000', net: '₨ 44,400', status: 'WhatsApp' },
                              { name: 'Tariq Mahmood', shift: 'Night', yds: '980', adv: '₨ 0', net: '₨ 34,300', status: 'Printed' },
                            ].map((w, idx) => (
                              <tr key={idx} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors">
                                <td className="p-3 font-semibold text-white">{w.name}</td>
                                <td className="p-3 text-gray-400">{w.shift}</td>
                                <td className="p-3 text-right text-gray-300">{w.yds}</td>
                                <td className="p-3 text-right text-[#EF4444]">{w.adv}</td>
                                <td className="p-3 text-right font-bold text-[#F59E0B]">{w.net}</td>
                                <td className="p-3 text-center">
                                  <span className="inline-block text-[9px] bg-[#10B981]/15 text-[#10B981] font-bold px-2 py-0.5 rounded uppercase">
                                    {w.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/[0.03] flex items-center justify-between text-[10px] text-gray-500 font-mono">
                      <span>✓ 4 Pay Slips Compiled</span>
                      <span>TOTAL DISBURSED: ₨ 160,500</span>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'sqlite' && (
                  <motion.div 
                    key="sqlite"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6 flex-1 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-[#F59E0B]">Offline SQLite Database Reconciler</h3>
                        <span className="text-[10px] font-mono text-gray-500">AES-256 DOUBLE ENCRYPTED</span>
                      </div>
                      <div className="p-4 bg-black/60 border border-white/[0.03] rounded-lg font-mono text-xs text-[#10B981] space-y-2 h-[220px] overflow-y-auto">
                        <p className="text-gray-500">[21:32:04] Initializing local SQLite3-MC engine...</p>
                        <p className="text-gray-500">[21:32:04] Mounting local storage at Noxis-Local.db...</p>
                        <p>[21:32:04] SUCCESS: Encrypted SQLite connection established.</p>
                        <p className="text-[#F59E0B]">[21:32:08] CENTRAL CLOUD CONNECT: OFFLINE. Entering standalone floor mode.</p>
                        <p>[21:32:15] LOG: Karigar Hamid Saeed yardage logged (+1,420 yds). Buffer queued.</p>
                        <p>[21:32:44] LOG: Inventory bale scan SKU #2908-WEAVE logged. Buffer queued.</p>
                        <p>[21:35:12] LOCAL NET: Android floor terminals matched (local WiFi mesh grid).</p>
                        <p className="text-cyan-400 font-bold">[21:36:00] STANDALONE STABILITY: 100% operative. Offline Buffer queue: 142 records.</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/[0.03] flex items-center justify-between text-[10px] text-gray-500 font-mono">
                      <span>OFFLINE STORAGE SIZE: 4.09 MB</span>
                      <span>ZERO DATA LOSS RECONCILIATION: ENABLED</span>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'khata' && (
                  <motion.div 
                    key="khata"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6 flex-1 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-[#F59E0B]">Double-Entry Accounting Ledger</h3>
                        <span className="text-[10px] font-mono text-gray-500">MANDI COMMODITY COMPLIANT</span>
                      </div>
                      <div className="overflow-x-auto border border-white/[0.03] rounded-lg bg-black/40">
                        <table className="w-full text-left border-collapse font-mono text-xs">
                          <thead>
                            <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                              <th className="p-3 text-[10px] font-bold text-gray-500 uppercase">Transaction ID</th>
                              <th className="p-3 text-[10px] font-bold text-gray-500 uppercase">Description</th>
                              <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-right">Debit (-)</th>
                              <th className="p-3 text-[10px] font-bold text-gray-500 uppercase text-right">Credit (+)</th>
                              <th className="p-3 text-[10px] font-bold text-[#F59E0B] uppercase text-right">Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { id: 'TXN-9028', desc: 'Bale Yarn Raw Stock Procurement', dr: '₨ 450,000', cr: '--', bal: '₨ 1,240,500' },
                              { id: 'TXN-9029', desc: 'Faisalabad Mandi Sale - Batch 12', dr: '--', cr: '₨ 850,000', bal: '₨ 2,090,500' },
                              { id: 'TXN-9030', desc: 'Weekly Karigar Wages Cashout', dr: '₨ 160,500', cr: '--', bal: '₨ 1,930,000' },
                              { id: 'TXN-9031', desc: 'Raw Silk Inward Mandi Reconcile', dr: '--', cr: '₨ 120,000', bal: '₨ 2,050,000' },
                            ].map((w, idx) => (
                              <tr key={idx} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors">
                                <td className="p-3 text-gray-500 font-bold">{w.id}</td>
                                <td className="p-3 font-semibold text-white">{w.desc}</td>
                                <td className="p-3 text-right text-[#EF4444]">{w.dr}</td>
                                <td className="p-3 text-right text-[#10B981]">{w.cr}</td>
                                <td className="p-3 text-right font-bold text-[#F59E0B]">{w.bal}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/[0.03] flex items-center justify-between text-[10px] text-gray-500 font-mono">
                      <span>✓ Ledger accounts audited</span>
                      <span className="text-[#10B981]">OPERATIONAL PROFIT: Grade A-Highly Eligible</span>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'cctv' && (
                  <motion.div 
                    key="cctv"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6 flex-1 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-[#F59E0B]">AI Sentinel CCTV security</h3>
                        <span className="text-[10px] font-mono text-gray-500">ON-DEVICE AI INTRUSION SCANNER</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Mock Cam Feed */}
                        <div className="relative aspect-video rounded-lg border border-white/[0.05] bg-black overflow-hidden flex items-center justify-center">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:16px_16px] opacity-40" />
                          <div className="absolute top-3 left-3 text-[9px] font-mono bg-black/75 text-[#EF4444] px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444] animate-pulse" />
                            WEAVING CAM 01
                          </div>
                          <span className="text-xs font-mono text-gray-500">[FLOOR VIDEO FEED PREVIEW]</span>
                          {/* Mock AI Bounding Box */}
                          <div className="absolute top-1/4 left-1/3 w-28 h-28 border border-[#10B981] rounded-sm flex items-start p-1.5 bg-[#10B981]/5">
                            <span className="text-[7px] font-mono text-[#10B981] font-bold uppercase tracking-wider bg-black/80 px-1 rounded">WEAVER ID #04</span>
                          </div>
                        </div>

                        {/* Security Detection Feed Logs */}
                        <div className="p-3 bg-black/40 border border-white/[0.03] rounded-lg font-mono text-[10px] space-y-2 h-[155px] overflow-y-auto">
                          <p className="text-gray-500">[21:30:15] AI CCTV Sentinel mounted: 4 active cams scanner.</p>
                          <p className="text-[#10B981]">[21:31:00] MATCH: Weaver Hamid Saeed checked in Loom Cam 01.</p>
                          <p className="text-[#10B981]">[21:32:12] MATCH: Weaver Bilal Khan checked in Packing Cam 02.</p>
                          <p className="text-[#EF4444] font-bold">[21:35:44] WARNING: Zone breach Cam 03 (Weaving Loom 14 perimeter).</p>
                          <p className="text-gray-400">[21:35:44] Sentinel alert: SMS & local floor notification dispatched.</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/[0.03] flex items-center justify-between text-[10px] text-gray-500 font-mono">
                      <span>✓ 4 cameras active</span>
                      <span>LOCAL INFERENCE LATENCY: 0.12ms</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Ticker */}
      <div className="py-6 border-y border-white/[0.03] bg-white/[0.01] overflow-hidden">
        <div className="flex justify-around items-center gap-8 px-4 flex-wrap text-[#94A3B8] font-bold text-xs tracking-[0.2em] uppercase">
          <span>Textile Mills 🏭</span>
          <span>Rice Mills 🌾</span>
          <span>Karigar Payroll 💰</span>
          <span>Offline ERP 🔌</span>
          <span>Urdu Support 🇵🇰</span>
          <span>Barcode Inventory 📦</span>
          <span>Double-Entry Khata 📒</span>
        </div>
      </div>

      {/* Features Bento Grid Redesign */}
      <section className="py-32 px-6 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-[10px] font-bold text-[#F59E0B] tracking-[0.3em] uppercase">PREMIUM INTEGRATION MATRIX</h2>
          <p className="text-3xl sm:text-5xl font-bold tracking-tight text-white uppercase">ELITE CORE ERP CAPABILITIES</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div 
              key={f.title} 
              className="bg-[#0B0C0E] border border-white/[0.04] p-8 rounded-xl hover:border-white/[0.08] hover:bg-white/[0.01] transition-all duration-300 group"
            >
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-lg bg-[#F59E0B]/5 flex items-center justify-center border border-[#F59E0B]/10 group-hover:border-[#F59E0B]/20 group-hover:bg-[#F59E0B]/10 transition-colors">
                  {f.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">{f.title}</h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed font-medium">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* McKinsey-style Comparative Board */}
      <section className="py-28 px-6 bg-[#07070A]/40 border-y border-white/[0.03]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-[10px] font-bold text-[#F59E0B] tracking-[0.3em] uppercase">ENTERPRISE PERFORMANCE COMPARISON</h2>
            <p className="text-3xl sm:text-5xl font-bold tracking-tight text-white uppercase">WHY LEADING FACTORIES SPECIFY NOXIS</p>
          </div>

          <div className="overflow-x-auto border border-white/[0.04] rounded-xl bg-[#0B0C0E]">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-white/[0.05] bg-[#07070A]">
                  <th className="p-5 text-[10px] font-bold uppercase tracking-widest text-gray-500 w-1/4">Operational Parameter</th>
                  <th className="p-5 text-[10px] font-bold uppercase tracking-widest text-[#F59E0B] bg-[#F59E0B]/5 text-center w-1/3">Noxis Industrial ERP</th>
                  <th className="p-5 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center w-1/4">Legacy Cloud ERP</th>
                  <th className="p-5 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center w-1/4">Manual Paper Registers</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors">
                    <td className="p-5 font-bold text-white uppercase tracking-wider text-[11px]">{row.metric}</td>
                    <td className="p-5 text-center font-bold text-white bg-[#F59E0B]/5 border-x border-white/[0.02]">
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#F59E0B] font-mono">
                        <Check size={14} className="text-[#10B981]" />
                        {row.noxis}
                      </span>
                    </td>
                    <td className="p-5 text-center text-gray-400 font-medium">{row.cloud}</td>
                    <td className="p-5 text-center text-gray-400 font-medium">{row.manual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Luxury Foundries early cohort sign-up */}
      <section className="py-32 px-6 max-w-4xl mx-auto text-center space-y-10">
        <div className="bg-[#0B0C0E] border border-[#F59E0B]/25 rounded-2xl p-10 md:p-14 relative overflow-hidden shadow-[0_24px_72px_rgba(0,0,0,0.6)]">
          <div className="absolute top-0 right-0 h-40 w-40 bg-[#F59E0B]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-6 relative z-10">
            <h3 className="text-[10px] font-bold text-[#F59E0B] tracking-[0.3em] uppercase">JOIN THE ENTERPRISE CONSOLE</h3>
            <p className="text-2xl sm:text-4xl font-bold tracking-tight text-white uppercase max-w-xl mx-auto">
              APPLY FOR NOXIS FOUNDING COHORT
            </p>
            <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed max-w-md mx-auto font-medium">
              We provide fully custom local system onboarding, offline local network wiring guidance, and tailored translation setups for verified industrial plants.
            </p>
            <div className="pt-4">
              <a 
                href="https://wa.me/923334355475" 
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE57] text-black font-extrabold text-xs tracking-widest uppercase py-4 px-8 rounded-lg transition-all shadow-[0_12px_32px_rgba(37,211,102,0.15)]"
              >
                <MessageSquare size={14} /> WhatsApp Founding Board
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] bg-[#030304] py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-xs font-semibold text-gray-500">
          <div className="flex items-center gap-4">
            <span className="font-bold text-white tracking-[0.25em] text-xs">NOXIS</span>
            <span>·</span>
            <span className="text-gray-600">by Omnora Labs</span>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {[{ label: 'Download', href: '/download' }, { label: 'Pricing', href: '/pricing' }, { label: 'Reviews', href: '/reviews' }, { label: 'Blog', href: '/blog' }, { label: 'Docs', href: '/docs' }, { label: 'Privacy', href: '/privacy' }].map(l => (
              <Link key={l.href} href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
            ))}
          </div>

          <p className="text-gray-600 text-center md:text-right font-medium">
            © 2026 Noxis Hub By Omnora Labs · Engineered for Developed in Pakistan...
          </p>
        </div>
      </footer>
    </div>
  )
}
