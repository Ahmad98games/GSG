'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Database, Layers, Smartphone, ShieldCheck, BarChart4, Globe2,
  Download, Check, X, Menu, Terminal, CircleDollarSign,
  ShieldAlert, Sparkles, MessageSquare, Wifi, Lock, Cpu, ChevronRight, Video,
  HardDrive, QrCode, CheckCircle2, ArrowRight, Zap, FileSpreadsheet
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
import PublicNavbar from '@/components/shell/PublicNavbar'

type CockpitTab = 'dashboard' | 'wages' | 'sqlite' | 'khata' | 'cctv'

const sqliteLogs = [
  '[21:32:04] Opening local database: C:\\NoxisData\\Noxis-Local.db',
  '[21:32:04] SQLite Write-Ahead Logging (WAL) active on hard drive.',
  '[21:32:05] Local database connected. Works without an internet connection.',
  '[21:32:08] Offline mode active. All records saved directly to your PC.',
  '[21:32:15] WAGE ENTRY: Logged 1,420 yards for Weaver Hamid Saeed (PKR 30/yd).',
  '[21:32:44] INVENTORY: Scanned fabric bale (Item SKU-4920) - updated stock ledger.',
  '[21:35:12] LOCAL WI-FI: 4 Android companion devices connected to office router.',
  '[21:36:00] KHATA RECONCILIATION: Cash book and customer balance balanced.',
]

const cctvAlerts = [
  { time: '21:30:15', msg: 'System check: 4 on-site IP camera RTSP feeds connected.', status: 'info' },
  { time: '21:31:00', msg: 'Motion tripwire: Shift check-in at Loom Door 01.', status: 'success' },
  { time: '21:32:12', msg: 'Attendance logged: Bilal Khan verified at Packing Area.', status: 'success' },
  { time: '21:35:44', msg: 'ALERT: Restricted yarn inventory area accessed after hours (Cam 03).', status: 'danger' },
  { time: '21:35:45', msg: 'Security action: Sounded local PC speaker and alerted floor manager.', status: 'warning' },
]

const marqueeTerms = [
  'LOCAL SQLITE ON HARD DRIVE',
  'WORKS WITHOUT INTERNET',
  'KARIGAR PIECE-RATE PAYROLL',
  'PESHGI ADVANCE TRACKING',
  'DOUBLE-ENTRY WHOLESALE KHATA',
  'YARN & FABRIC INVENTORY',
  'OFFICE WI-FI PHONE LOGGING',
  'ON-SITE RTSP CAMERA FEEDS'
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
        const isElectron = typeof window !== 'undefined' && (
          window.navigator.userAgent.toLowerCase().includes('electron') ||
          !!(window as any).electronAPI ||
          !!(window as any).electron
        )

        // Strict: Auto-resume to user's last operational route inside Electron app frame
        if (isElectron) {
          let resumeRoute = '/dashboard'
          try {
            const electronRoute = await (window as any).electronAPI?.store?.getLastRoute?.()
            const localRoute = typeof window !== 'undefined' ? localStorage.getItem('noxis_last_route') : null
            if (electronRoute && electronRoute !== '/' && !electronRoute.startsWith('/login') && !electronRoute.startsWith('/lock') && !electronRoute.startsWith('/setup')) {
              resumeRoute = electronRoute
            } else if (localRoute && localRoute !== '/' && !localRoute.startsWith('/login') && !localRoute.startsWith('/lock') && !localRoute.startsWith('/setup')) {
              resumeRoute = localRoute
            }
          } catch {}

          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            const { data: profile } = await supabase
              .from('business_profiles').select('id, onboarding_done')
              .eq('user_id', session.user.id).single()
            if (profile?.onboarding_done === false) {
              router.replace('/setup')
              return
            }
          }
          router.replace(resumeRoute)
          return
        }

        // Web production build: ALWAYS display public website pages
        setChecking(false)
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
      title: '01. Workstation Setup',
      desc: 'Download the standalone Windows installer (.exe) and install directly on your office or factory floor PC in under 2 minutes.',
      badge: 'Workstation Setup',
      icon: Terminal,
    },
    {
      id: 'license',
      title: '02. Permanent Offline License',
      desc: 'License key locked to your PC\'s motherboard. Works permanently offline with zero recurring rental fees or internet activation.',
      badge: 'Motherboard Lock',
      icon: Lock,
    },
    {
      id: 'sqlite',
      title: '03. Local SQLite Database',
      desc: 'All factory transactions are stored in a local SQLite file on your hard drive with Write-Ahead Logging (WAL) for power-cut resilience.',
      badge: 'Local Hard Drive',
      icon: Database,
    },
    {
      id: 'mobile',
      title: '04. Office Wi-Fi Phone Pairing',
      desc: 'Connect supervisor Android phones over your workshop\'s local Wi-Fi router. Log piece-rate output and attendance without internet data.',
      badge: 'Local Wi-Fi',
      icon: Smartphone,
    },
    {
      id: 'inventory',
      title: '05. Yarn & Fabric Stock Tracking',
      desc: 'Track fabric rolls, yarn bales, and chemical batches. Automatic reorder alerts notify you when raw material falls below your threshold.',
      badge: 'Raw Materials',
      icon: Layers,
    },
    {
      id: 'invoices',
      title: '06. Wholesale Khata & Invoices',
      desc: 'Print clean thermal receipts or PDF invoices. Keep balanced double-entry customer and supplier ledgers with debit/credit balance tracking.',
      badge: 'Wholesale Khata',
      icon: CircleDollarSign,
    },
    {
      id: 'data-safety',
      title: '07. Local USB & Cloud Backups',
      desc: 'Export encrypted database backup files to USB drives anytime. Optional automatic cloud mirroring when an internet connection is present.',
      badge: 'Data Safety',
      icon: ShieldCheck,
    },
    {
      id: 'quickentry',
      title: '08. Rapid Floor Entry Console',
      desc: 'Large, touch-friendly interface designed for shop-floor operators to quickly log daily meterage, yards, or piece outputs in seconds.',
      badge: 'Piece-Rate Entry',
      icon: Cpu,
    },
    {
      id: 'troubleshoot',
      title: '09. Built-in Network Diagnostics',
      desc: 'Self-diagnostic utilities to verify local IP addresses, router connection quality, and COM port thermal scale configurations.',
      badge: 'Diagnostics',
      icon: ShieldAlert,
    },
    {
      id: 'intelligence',
      title: '10. Reorder Alerts & Demand Forecast',
      desc: 'Automatic reorder alerts and 30-day raw material demand forecasting based on your historical sales and weaving output.',
      badge: 'Stock Forecasting',
      icon: BarChart4,
    },
    {
      id: 'finance',
      title: '11. Worker Peshgi (Advance) Ledger',
      desc: 'Track worker advances (Peshgi), deduct balances automatically on weekly paydays, and print clear payslips with amount in words.',
      badge: 'Peshgi & Payroll',
      icon: Globe2,
    },
    {
      id: 'cctv-spec',
      title: '12. On-Site RTSP Camera Video Feeds',
      desc: 'Connect up to 6 on-site IP cameras via RTSP. Draw boundary tripwires to alert staff when restricted inventory areas are accessed.',
      badge: 'IP Camera Feeds',
      icon: Video,
    },
  ]

  const comparisonRows = [
    {
      metric: 'Load-Shedding & Power Cuts',
      noxis: 'WAL-enabled SQLite ensures zero corrupted records when generators kick in',
      cloud: 'Browser sessions crash; unsaved invoices lost during sudden outages',
      manual: 'Work stalls in the dark; delayed entries and lost paper vouchers'
    },
    {
      metric: 'Fiber Cuts & Internet Blackouts',
      noxis: '100% Offline — Runs permanently on your local office hard drive and workshop Wi-Fi',
      cloud: 'Completely blocked when optical fiber cuts or broadband disconnects',
      manual: 'Paper books; zero multi-counter coordination'
    },
    {
      metric: 'Karigar Piece-Rates & Peshgi',
      noxis: 'Automated piece-rate matrices (yd/meter/suit) + real-time advance deduction & slip printing',
      cloud: 'Generic monthly salary only; cannot handle piece-rates or daily floor cash advances',
      manual: 'Calculated by hand on paper slips; frequent Friday evening wage disputes'
    },
    {
      metric: 'Data Privacy & Margin Secrecy',
      noxis: '100% Local on your physical PC. Sensitive profit margins and supplier rates never touch public cloud',
      cloud: 'Confidential factory ledger data stored on external multi-tenant cloud servers',
      manual: 'Open paper Khata books readable by anyone walking past the desk'
    },
    {
      metric: 'Migration & Onboarding',
      noxis: 'Free personal assistance from Omnora Labs to migrate your existing Excel sheets and paper Khata registers into Noxis.',
      cloud: 'Self-serve CSV format errors; expensive third-party consultant implementation fees',
      manual: 'Permanently trapped in handwritten notebooks and loose receipts'
    },
    {
      metric: 'License & Cost Structure',
      noxis: 'Permanent offline license with no forced recurring monthly software rent',
      cloud: 'Continuous per-seat monthly subscription fee that cuts off access if unpaid',
      manual: 'Continuous hidden losses from calculation errors and uncollected Khata'
    },
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
          <PublicNavbar />

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
                  Built for Textile Mills, Garments &amp; Wholesale Traders
                </span>
              </div>

              <SplitHeadline
                lines={[
                  { text: 'Offline-First ERP' },
                  { text: 'Built for Physical Manufacturing', accent: true }
                ]}
              />

              {/* INDUSTRIAL TRUST SUB-BADGE */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mt-6 max-w-3xl mx-auto w-full px-2"
              >
                <div className="relative inline-flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 px-5 py-3 rounded-lg border border-[#C5A059]/40 bg-[#0E1015]/95 shadow-[0_4px_30px_rgba(0,0,0,0.6),0_0_35px_rgba(197,160,89,0.12)] backdrop-blur-md text-center sm:text-left">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px] uppercase tracking-wider shrink-0 font-bold">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                    <span>Permanent Offline License</span>
                  </div>
                  <span className="hidden sm:inline text-white/20">|</span>
                  <p className="text-xs sm:text-sm font-semibold tracking-wide text-[#F3E8D2] leading-snug">
                    Permanent Offline License — Zero Cloud Reliance — Runs 100% on your local office hard drive and workshop Wi-Fi.
                  </p>
                </div>
              </motion.div>

              <p className="text-[#94A3B8] text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto mt-6 font-medium">
                Engineered for load-shedding, fiber cable cuts, and zero cloud delay. Core operations—Karigar piece-rate payroll, Peshgi advance ledgers, fabric inventory, and wholesale Khata—run 100% offline from your local PC hard drive.
              </p>

              <div className="w-full mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
                <Link
                  href="/download"
                  className="inline-flex items-center justify-center gap-2 font-extrabold text-[11px] tracking-[0.2em] uppercase px-8 py-4 rounded-sm transition-all duration-300 cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${CHAMPAGNE_LIGHT}, ${CHAMPAGNE})`,
                    color: OBSIDIAN,
                    boxShadow: `0 12px 40px ${CHAMPAGNE}33`,
                  }}
                >
                  <Download size={14} /> Download 7-Day Free Evaluation (.exe)
                </Link>
                <a
                  href="https://wa.me/923264742678?text=Salam%20Omnora,%20I%20want%20a%20live%20demo%20of%20Noxis%20Hub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-white/[0.08] bg-white/[0.02] text-white font-extrabold text-[11px] tracking-[0.2em] uppercase px-8 py-4 rounded-sm backdrop-blur-sm transition-all duration-300 hover:border-[#C5A059]/60 hover:text-[#E8D5B5] cursor-pointer"
                >
                  <MessageSquare size={14} className="text-emerald-400" /> WhatsApp Live Demo
                </a>
              </div>

              {/* Quick Hero Micro-Guarantees */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-mono text-gray-400">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> WAPDA &amp; UPS Power-Cut Protected</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> Zero PTCL / Fiber Dependence</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> Free Excel &amp; Khata Migration</span>
              </div>
            </div>
          </section>

          {/* Marquee Features */}
          <SignatureMarquee items={marqueeTerms} />

          {/* ═══ 3-STEP ONBOARDING SECTION ═══ */}
          <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/[0.04] relative">
            <Reveal variant="up" className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/20 text-[#E8D5B5] text-[10px] font-mono font-bold uppercase tracking-widest">
                <Zap size={12} className="text-[#C5A059]" />
                Frictionless Workshop Setup · 10-Minute Deployment
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
                How It Works in 3 Simple Steps
              </h2>
              <p className="text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
                No complex server racks, no cloud subscriptions, and no rewiring. Connect your cashier or office desktop to your factory floor in under 10 minutes.
              </p>
            </Reveal>

            <RevealStagger className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <RevealItem>
                <div className="relative h-full flex flex-col justify-between p-8 rounded-xl border border-white/[0.08] bg-[#0A0C10] hover:border-[#C5A059]/40 transition-all duration-300 group shadow-xl">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-black font-mono tracking-tight text-[#C5A059]/40 group-hover:text-[#C5A059] transition-colors">
                        01
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-[#C5A059]/10 text-[#E8D5B5] border border-[#C5A059]/20">
                        Workstation PC
                      </span>
                    </div>

                    <div className="w-12 h-12 rounded-lg bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059]">
                      <Download size={22} />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">
                        Step 1: Install PC .exe
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                        Download and run the standalone installer on your main office or cashier PC. Noxis initializes an encrypted local SQLite database directly on your hard drive with zero cloud configuration, zero server maintenance, and zero recurring fees.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>WAL engine survives sudden power cuts &amp; load-shedding</span>
                  </div>
                </div>
              </RevealItem>

              {/* Step 2 */}
              <RevealItem>
                <div className="relative h-full flex flex-col justify-between p-8 rounded-xl border border-white/[0.08] bg-[#0A0C10] hover:border-[#60A5FA]/40 transition-all duration-300 group shadow-xl">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-black font-mono tracking-tight text-[#60A5FA]/40 group-hover:text-[#60A5FA] transition-colors">
                        02
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-[#60A5FA]/10 text-[#93C5FD] border border-[#60A5FA]/20">
                        Floor Wi-Fi Sync
                      </span>
                    </div>

                    <div className="w-12 h-12 rounded-lg bg-[#60A5FA]/10 border border-[#60A5FA]/30 flex items-center justify-center text-[#60A5FA]">
                      <QrCode size={22} />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">
                        Step 2: Scan local Wi-Fi QR on Android
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                        Floor supervisors open the companion app and scan the pairing QR code displayed on the PC. Devices sync across your existing workshop Wi-Fi router without consuming cellular 4G data or needing internet access.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center gap-2 text-[11px] font-mono text-[#60A5FA]">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>Works during fiber cable cuts &amp; broadband blackouts</span>
                  </div>
                </div>
              </RevealItem>

              {/* Step 3 */}
              <RevealItem>
                <div className="relative h-full flex flex-col justify-between p-8 rounded-xl border border-white/[0.08] bg-[#0A0C10] hover:border-emerald-500/40 transition-all duration-300 group shadow-xl">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-black font-mono tracking-tight text-emerald-500/40 group-hover:text-emerald-400 transition-colors">
                        03
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        Dispute-Free Factory
                      </span>
                    </div>

                    <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <CircleDollarSign size={22} />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">
                        Step 3: Track Karigar piece-rates &amp; Khata
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                        Log yards, meters, suits, or units completed right at the looms or stitching tables. Net pay calculates automatically, Peshgi cash advances deduct instantly, and double-entry wholesale ledgers stay balanced without wage disputes.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>Instant thermal worker slips &amp; one-click customer WhatsApp</span>
                  </div>
                </div>
              </RevealItem>
            </RevealStagger>
          </section>

          {/* High-Fidelity B2B Dashboard Cockpit */}
          <section className="px-4 md:px-6 py-24 max-w-7xl mx-auto">
            <Reveal variant="up" className="space-y-8">
              <div className="mb-8 text-center lg:text-left">
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase mb-1" style={{ color: CHAMPAGNE }}>Factory Operations Cockpit</p>
                <h2 className="text-2xl font-bold text-white tracking-tight uppercase">Noxis Hub Desktop Interface</h2>
                <p className="text-xs text-gray-500 mt-1">Direct view of the offline mill management system running on local PC</p>
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
                    <span className="text-[11px] text-white font-mono uppercase font-bold tracking-widest ml-2">Noxis Local Database : C:\NoxisData\Noxis-Local.db</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-emerald-400"><Wifi size={12} /> Local Office Wi-Fi</span>
                    <span className="flex items-center gap-1.5 text-[#C5A059]"><Lock size={12} /> Local Hard Drive</span>
                  </div>
                </div>

                {/* Operations Overview stats cards inside simulator */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.03] border-b border-white/[0.04] relative z-10">
                  {[
                    { title: 'Weaving Looms', value: '24 Active', detail: 'Floor machines operational', color: 'text-white' },
                    { title: 'Shift Karigars', value: '148 Workers', detail: 'Logged via office Wi-Fi', color: 'text-white' },
                    { title: 'Shift Production', value: '12,850 Yards', detail: 'Grey cloth Grade A output', color: 'text-[#C5A059]' },
                    { title: 'Internet State', value: '100% Offline', detail: 'Zero external cloud delay', color: 'text-emerald-400' },
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
                      { id: 'dashboard', label: 'Mill Status Overview', icon: <Cpu size={14} /> },
                      { id: 'wages', label: 'Karigar Piece-Rate Ledger', icon: <CircleDollarSign size={14} /> },
                      { id: 'sqlite', label: 'Local SQLite Engine', icon: <Terminal size={14} /> },
                      { id: 'khata', label: 'Double-Entry Khata & Mandi', icon: <BarChart4 size={14} /> },
                      { id: 'cctv', label: 'On-Site RTSP Camera Feeds', icon: <Video size={14} /> },
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
                            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">v14.0.12 Stable</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded border border-white/[0.04] bg-white/[0.01] space-y-2">
                              <span className="text-[9px] font-bold text-[#60A5FA] uppercase tracking-wider block">Local Wi-Fi Network</span>
                              <p className="text-xs text-gray-400 font-mono">
                                Workstation IP: <span className="text-white">192.168.1.45:3000</span><br />
                                Android Phones Paired: <span className="text-white">4 Devices</span><br />
                                Network Latency: <span className="text-emerald-400">&lt;1ms (Instant Local Wi-Fi)</span>
                              </p>
                            </div>
                            <div className="p-4 rounded border border-white/[0.04] bg-white/[0.01] space-y-2">
                              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">Hard Drive Database</span>
                              <p className="text-xs text-gray-400 font-mono">
                                Storage: <span className="text-white">Local SQLite 3</span><br />
                                File Size: <span className="text-white">5.12 MB</span><br />
                                Journal Mode: <span className="text-emerald-400">WAL (Power-cut Protected)</span>
                              </p>
                            </div>
                          </div>
                          <div className="p-4 rounded border border-[#C5A059]/20 bg-[#C5A059]/5 flex items-center gap-3">
                            <ShieldCheck className="text-[#C5A059] shrink-0" size={18} />
                            <p className="text-xs text-gray-300 font-normal">
                              <strong>Works without an internet connection:</strong> Noxis Hub runs locally on your PC. You can record sales, log daily Karigar production, print vouchers, and update Khata balances even during total internet or cable disconnects.
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
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">Karigar Piece-Rate Wages &amp; Peshgi Advances</h3>
                            <span className="text-[10px] text-gray-500 font-mono">Shift Production Log</span>
                          </div>
                          <div className="overflow-x-auto rounded border border-white/[0.04]">
                            <table className="w-full text-left font-mono text-[11px] min-w-[500px]">
                              <thead>
                                <tr className="border-b border-white/[0.05] bg-white/[0.02] text-gray-500">
                                  <th className="p-2.5 uppercase font-bold text-[9px]">Karigar / Weaver</th>
                                  <th className="p-2.5 uppercase font-bold text-[9px]">Shift</th>
                                  <th className="p-2.5 uppercase font-bold text-[9px] text-right">Output</th>
                                  <th className="p-2.5 uppercase font-bold text-[9px] text-right">Peshgi Advance</th>
                                  <th className="p-2.5 uppercase font-bold text-[9px] text-right">Net Payable</th>
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
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">Local SQLite Database Log</h3>
                            <span className="text-[10px] text-gray-500 font-mono">Stored on Your Hard Drive</span>
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
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">Double-Entry Wholesale Khata</h3>
                            <span className="text-[10px] text-gray-500 font-mono">Balanced Ledger</span>
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
                                  <th className="p-2 uppercase font-bold text-[9px]">Voucher #</th>
                                  <th className="p-2 uppercase font-bold text-[9px]">Description</th>
                                  <th className="p-2 uppercase font-bold text-[9px] text-right">Debit</th>
                                  <th className="p-2 uppercase font-bold text-[9px] text-right">Credit</th>
                                  <th className="p-2 uppercase font-bold text-[9px] text-right">Running Balance</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[
                                  { id: 'TX-9028', desc: 'Raw Yarn Bale Purchase from Mill', dr: '₨ 450,000', cr: '—', bal: '₨ 1,240,500' },
                                  { id: 'TX-9029', desc: 'Faisalabad Mandi Sale — Fabric Batch 12', dr: '—', cr: '₨ 850,000', bal: '₨ 2,090,500' },
                                  { id: 'TX-9030', desc: 'Weekly Karigar Wages Cash Disbursement', dr: '₨ 160,500', cr: '—', bal: '₨ 1,930,000' },
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
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">On-Site RTSP Camera Video Feeds</h3>
                            <span className="text-[10px] text-gray-500 font-mono">Connect up to 6 IP Cameras</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative aspect-video rounded border border-white/[0.06] bg-black overflow-hidden flex items-center justify-center">
                              <span className="absolute top-2 left-2 text-[8px] font-mono bg-red-600 text-white font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-widest flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Cam 01 : Loom Floor Entrance
                              </span>
                              <div className="border border-emerald-400/40 rounded p-1 text-[8px] font-mono text-emerald-400 bg-black/60">
                                [Motion Tripwire: Area Active]
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
                          <p className="text-[10px] text-gray-400 font-mono">
                            Connect up to 6 on-site IP cameras via RTSP. Draw boundary tripwires to alert staff when restricted inventory areas are accessed.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Simulator footer */}
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-gray-500">
                      <span>Noxis Workstation: Local Hard Drive</span>
                      <span className="text-[#C5A059] font-bold uppercase">No internet needed</span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* System Capabilities Section */}
          <section id="features" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/[0.04]">
            <div className="text-center mb-16 space-y-3">
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: CHAMPAGNE }}>Complete Module Index</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white uppercase">Engineered for Factory Operations</h2>
              <p className="text-sm text-gray-400 max-w-xl mx-auto">
                Explore the practical features built directly into Noxis Hub for managing factory production, inventory, and finances.
              </p>
            </div>

            <RevealStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {docsFeatures.map((f, i) => (
                <FeatureCard
                  key={f.id}
                  href={`/features#${f.id}`}
                  icon={f.icon}
                  title={f.title}
                  desc={f.desc}
                  index={i}
                />
              ))}
            </RevealStagger>
          </section>

          {/* ═══ MOBILE HUB SECTION ═══ */}
          <section id="mobile" className="py-24 px-4 sm:px-6 relative overflow-hidden border-t border-white/[0.04]">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#60A5FA]/[0.03] to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto relative">
              <Reveal variant="up" className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  v14.0 Production Live · Android &amp; Handheld Terminals
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 uppercase">
                  Noxis Mobile Hub &amp; Floor Companion
                </h2>
                <p className="text-base text-gray-400 max-w-3xl mx-auto leading-relaxed">
                  Full-featured handheld terminal for supervisors, weavers, cashiers, and dispatch teams. Connects zero-cloud over local Wi-Fi or encrypted tunnel with AI Voice Khata, photo attendance, piece-rate wages, and thermal Bluetooth printing.
                </p>
              </Reveal>

              {/* Phone mockup + features */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-20">
                {/* Left: Phone mockup */}
                <div className="relative mx-auto flex justify-center">
                  <div className="relative w-72 h-[560px] bg-[#0A0C0F] rounded-[3rem] border-2 border-white/10 shadow-2xl overflow-hidden">
                    {/* Status bar */}
                    <div className="absolute top-0 left-0 right-0 h-12 bg-[#0A0C0F] flex items-center justify-between px-6 pt-2">
                      <span className="text-[10px] text-gray-500 font-mono">10:45</span>
                      <div className="w-20 h-4 bg-black rounded-full" />
                      <div className="flex gap-1.5 items-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] text-emerald-400 font-bold">192.168.1.45</span>
                      </div>
                    </div>

                    {/* Screen */}
                    <div className="absolute top-12 left-0 right-0 bottom-0 bg-[#060708] p-4 overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between py-2 mb-3 border-b border-white/[0.06]">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-emerald-400 font-semibold font-mono">PC HUB · &lt;1ms PING</span>
                          </div>
                          <span className="text-[9px] font-bold text-[#C5A059] bg-[#C5A059]/10 px-1.5 py-0.5 rounded border border-[#C5A059]/20">v14 TERMINAL</span>
                        </div>

                        {/* Top quick metrics */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {([
                            ['Karigars On Floor', '48 / 52 Present', '#10B981'],
                            ['Today Output', '2,480 yds / 380 suits', '#60A5FA'],
                            ['AI Voice Khata', 'Ready (Urdu/Eng)', '#C5A059'],
                            ['ESC/POS Printer', '58mm BT Paired', '#A78BFA'],
                          ] as const).map(([label, value, color]) => (
                            <div key={label} className="bg-[#0F1114] rounded-xl p-2.5 border border-white/[0.06]">
                              <p className="text-[8px] text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
                              <p className="text-xs font-bold font-mono truncate" style={{ color }}>{value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Quick 6-button Floor Grid */}
                        <p className="text-[8px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Quick Operations</p>
                        <div className="grid grid-cols-3 gap-1.5 mb-3">
                          {([
                            ['🎙️', 'Voice Khata', '#C5A059'],
                            ['📸', 'Photo Attend', '#10B981'],
                            ['⚡', 'Log Wages', '#60A5FA'],
                            ['🖨️', 'Mobile POS', '#A78BFA'],
                            ['💰', 'Peshgi Adv', '#F59E0B'],
                            ['⊞', 'Scan Roll', '#34D399'],
                          ] as const).map(([icon, label, color]) => (
                            <div key={label} className="bg-[#0F1114] rounded-lg p-2 border border-white/[0.06] flex flex-col items-center gap-1">
                              <span className="text-base" style={{ color }}>{icon}</span>
                              <span className="text-[8px] text-gray-300 font-medium text-center leading-tight">{label}</span>
                            </div>
                          ))}
                        </div>

                        {/* Live activity feed items */}
                        <div className="space-y-1.5">
                          <div className="bg-emerald-500/[0.08] border border-emerald-500/20 rounded-lg p-2">
                            <p className="text-[9px] text-emerald-400 font-semibold">🎙️ Voice: &ldquo;Haji Aslam ko 50,000 naqd&rdquo;</p>
                            <p className="text-[8px] text-gray-400 mt-0.5">Voucher #V-8821 posted to SQLite ledger</p>
                          </div>
                          <div className="bg-[#60A5FA]/[0.08] border border-[#60A5FA]/20 rounded-lg p-2">
                            <p className="text-[9px] text-[#60A5FA] font-semibold">🖨️ POS Bill #B-4190 Printed</p>
                            <p className="text-[8px] text-gray-400 mt-0.5">58mm Bluetooth Thermal ESC/POS slip issued</p>
                          </div>
                        </div>
                      </div>

                      {/* Bottom phone nav */}
                      <div className="h-12 bg-[#0A0C0F] border-t border-white/[0.06] -mx-4 -mb-4 flex items-center justify-around px-2">
                        {([
                          { icon: '🏠', label: 'Home', active: true },
                          { icon: '🎙️', label: 'Khata', active: false },
                          { icon: '👷', label: 'Workers', active: false },
                          { icon: '🖨️', label: 'POS', active: false },
                          { icon: '📦', label: 'Stock', active: false },
                        ] as const).map((tab, i) => (
                          <div key={i} className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg ${tab.active ? 'text-[#60A5FA]' : 'text-gray-500'}`}>
                            <span className="text-xs">{tab.icon}</span>
                            <span className="text-[7px] font-bold">{tab.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-16 bg-[#60A5FA]/15 rounded-full blur-3xl" />
                </div>

                {/* Right: Features */}
                <RevealStagger className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400 mb-4 flex items-center gap-2">
                      <span className="w-4 h-px bg-emerald-400/50" />
                      Factory Floor &amp; Worker Wage Features
                    </p>
                    <div className="space-y-3">
                      {[
                        { icon: '📡', title: 'Local Router Pairing & Zero Mobile Data', desc: 'Scan the pairing QR on your PC Hub. Connects in under 2 seconds over local workshop Wi-Fi with zero internet required, or over encrypted tunnel across branches.' },
                        { icon: '🎙️', title: 'Urdu & English AI Voice Khata Engine', desc: 'Speak natural voice entries like "Haji Aslam ko 50,000 naqd diye" or "Ali Raza 120 gaz latha". AI automatically parses amounts, accounts, and posts double-entry vouchers.' },
                        { icon: '📸', title: 'Biometric & Photo Attendance with Geofencing', desc: 'Clock-in workers with selfie camera verification, shift audit tracking, and optional GPS geofence validation. Completely eliminates proxy attendance and buddy punching.' },
                        { icon: '⚡', title: 'Piece-Rate Wage Logging (Yards / Meters / Suits)', desc: 'Supervisors log weaving, stitching, and cutting output directly at each loom or table. Instant wage calculations sync straight into weekly payroll.' },
                        { icon: '💰', title: 'Floor Peshgi (Advance) & Daily Ledger', desc: 'Disburse and record on-the-spot cash advances (Peshgi). Updates worker balance instantly and automatically deducts from Saturday pay envelopes.' },
                      ].map(item => (
                        <RevealItem key={item.title}>
                          <div className="flex items-start gap-3 p-4 bg-[#0F1114] border border-white/[0.08] rounded-xl hover:border-emerald-500/20 transition-colors">
                            <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-semibold text-white">{item.title}</p>
                                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded font-bold border border-emerald-500/20">LIVE v14</span>
                              </div>
                              <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                            </div>
                          </div>
                        </RevealItem>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#60A5FA] mb-4 flex items-center gap-2">
                      <span className="w-4 h-px bg-[#60A5FA]/50" />
                      Handheld POS, Logistics &amp; Security
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { icon: '🖨️', title: 'Mobile POS & Bluetooth ESC/POS Printing', desc: 'Bill customers on the shop floor and print slips directly to 58mm or 80mm Bluetooth thermal receipt printers.' },
                        { icon: '⊞', title: 'High-Speed Barcode & QR Scanner', desc: 'Scan fabric rolls, thaan tags, and dispatch carton labels to verify stock and prevent wrong deliveries.' },
                        { icon: '📹', title: 'Live RTSP CCTV & Watchdog', desc: 'View shop floor camera streams and security alerts right on the supervisor mobile screen.' },
                        { icon: '📻', title: 'Encrypted Mesh Intercom & Shift Audit', desc: 'Two-way voice intercom between office PC and mobile terminals plus end-of-shift balance reconciliations.' },
                      ].map(item => (
                        <RevealItem key={item.title}>
                          <div className="flex items-start gap-3 p-4 bg-[#0F1114] border border-white/[0.06] rounded-xl hover:border-[#60A5FA]/20 transition-colors h-full">
                            <span className="text-lg flex-shrink-0 mt-0.5">{item.icon}</span>
                            <div>
                              <p className="text-sm font-semibold text-white">{item.title}</p>
                              <p className="text-xs text-gray-400 leading-relaxed mt-0.5">{item.desc}</p>
                            </div>
                          </div>
                        </RevealItem>
                      ))}
                    </div>
                  </div>
                </RevealStagger>
              </div>

              {/* Connection diagram */}
              <Reveal variant="up" className="mt-16 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 mb-8">How Devices Connect</p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  {[
                    { icon: '🖥', label: 'Main PC Hub', sub: 'Runs on Windows' },
                  ].map(n => (
                    <div key={n.label} className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-[#0F1114] border border-white/10 rounded-2xl flex items-center justify-center text-2xl">{n.icon}</div>
                      <p className="text-xs text-gray-300 font-semibold">{n.label}</p>
                      <p className="text-[10px] text-gray-500">{n.sub}</p>
                    </div>
                  ))}
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-px bg-[#60A5FA]/40" />
                      <span className="px-2 py-1 bg-[#60A5FA]/10 border border-[#60A5FA]/20 rounded text-[9px] text-[#60A5FA] font-bold">Office Wi-Fi Router</span>
                      <div className="w-8 h-px bg-[#60A5FA]/40" />
                    </div>
                    <p className="text-[9px] text-gray-500">Same local network (No mobile data needed)</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-[#0F1114] border border-[#60A5FA]/30 rounded-2xl flex items-center justify-center text-2xl">📱</div>
                    <p className="text-xs text-[#60A5FA] font-semibold">Android Phones</p>
                    <p className="text-[10px] text-gray-500">Supervisors on Shop Floor</p>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* Comparison Matrix */}
          <section className="py-24 px-4 sm:px-6 border-t border-white/[0.04] bg-[#070708]/50">
            <Reveal variant="up" className="max-w-7xl mx-auto space-y-12">
              <div className="text-center space-y-3">
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: CHAMPAGNE }}>Practical Engineering Comparison</p>
                <h2 className="text-3xl font-bold tracking-tight text-white uppercase">Built for Factory Floor Realities</h2>
                <p className="text-xs text-gray-400">How Noxis Hub compares to generic cloud subscriptions and manual registers</p>
              </div>

              <div className="overflow-x-auto rounded border border-white/[0.05] bg-[#0A0B0D]">
                <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-[#070708] text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                      <th className="p-4 w-[25%]">Requirement</th>
                      <th className="p-4 text-center w-[30%]" style={{ color: CHAMPAGNE, background: `${CHAMPAGNE}08` }}>Noxis Local ERP</th>
                      <th className="p-4 text-center">Generic Cloud SaaS</th>
                      <th className="p-4 text-center">Paper Registers</th>
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

              {/* ═══ DEDICATED MIGRATION GUARANTEE BLOCK ═══ */}
              <div className="mt-12 rounded-2xl border border-[#C5A059]/40 bg-gradient-to-br from-[#12141C] via-[#0D0F14] to-[#08090C] p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_40px_rgba(197,160,89,0.08)] relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-[#C5A059]/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 justify-between">
                  <div className="space-y-4 max-w-2xl text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#E8D5B5] text-[10px] font-mono font-bold uppercase tracking-widest">
                      <ShieldCheck size={14} className="text-emerald-400" />
                      Zero-Friction Switch Guarantee
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                      Free personal assistance from Omnora Labs to migrate your existing Excel sheets and paper Khata registers into Noxis.
                    </h3>

                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                      You don&apos;t have to re-type years of transactions or risk downtime during transition. Our engineering team personally formats, cleans, and imports your customer opening balances, supplier ledgers, raw material inventory SKUs, and Karigar advance books directly into your new offline Noxis installation.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="flex items-center gap-2 text-xs text-gray-300 font-mono">
                        <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                        <span>Excel / CSV Formatted &amp; Cleaned</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-300 font-mono">
                        <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                        <span>Paper Registers Digitized Free</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-300 font-mono">
                        <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                        <span>Live WhatsApp &amp; AnyDesk Setup</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-center sm:items-stretch gap-3 w-full sm:w-auto">
                    <a
                      href="https://wa.me/923264742678?text=Salam%20Omnora,%20I%20want%20free%20help%20migrating%20my%20factory%20Excel%20and%20paper%20Khata%20into%20Noxis"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded font-extrabold text-xs uppercase tracking-wider text-black bg-[#25D366] hover:bg-[#20bd5a] transition-all duration-300 shadow-xl cursor-pointer"
                    >
                      <MessageSquare size={16} />
                      <span>Claim Free Migration Assistance</span>
                    </a>
                    <span className="text-[10px] text-center text-gray-500 font-mono">
                      Direct Senior Engineer Line · +92 326 4742678
                    </span>
                  </div>
                </div>
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
                  <p className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: CHAMPAGNE }}>Direct Engineer Setup</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight uppercase">Get Started with Noxis Hub</h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                    We personally configure your office Wi-Fi router, set up Karigar piece-rates, and migrate your existing Excel sheets and paper Khata registers into Noxis with zero downtime.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                    <a
                      href="https://wa.me/923264742678?text=Salam%20Omnora,%20I%20want%20to%20set%20up%20Noxis%20Hub%20for%20my%20factory"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-extrabold text-[10px] tracking-[0.2em] uppercase py-4 px-8 rounded-sm bg-[#25D366] text-black cursor-pointer"
                    >
                      <MessageSquare size={14} /> WhatsApp Support (+92 326 4742678)
                    </a>
                    <Link
                      href="/pricing"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-[#C5A059]/40 bg-[#C5A059]/10 font-extrabold text-[10px] tracking-[0.2em] uppercase py-4 px-8 rounded-sm text-white hover:bg-[#C5A059]/20 transition-colors cursor-pointer"
                    >
                      <span>Explore Pricing &amp; Support Tiers</span>
                    </Link>
                    <Link
                      href="/download"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/20 font-extrabold text-[10px] tracking-[0.2em] uppercase py-4 px-8 rounded-sm text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <Download size={14} /> Download 7-Day Free Evaluation
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
                {[{ label: 'Download', href: '/download' }, { label: 'Features', href: '/features' }, { label: 'Pricing', href: '/pricing' }, { label: 'Industries', href: '/industries' }, { label: 'Blog', href: '/blog' }, { label: 'Docs', href: '/docs' }, { label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }, { label: 'Refund', href: '/refund' }, { label: 'About', href: '/about' }].map((l) => (
                  <Link key={l.href} href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                ))}
              </div>
              <p className="text-center md:text-right text-xs text-gray-500">© {new Date().getFullYear()} Omnora · Industrial ERP for Textile Mills &amp; Manufacturers</p>
            </div>
          </footer>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@700&display=swap');
        .font-sans { font-family: 'Outfit', sans-serif; }
        .font-mono { font-family: 'JetBrains+Mono', monospace; }
        body { background-color: #08090A; }
      `}</style>
    </>
  )
}
