'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Database, Layers, Smartphone, ShieldCheck, BarChart4, Globe2,
  Download, Check, X, Menu, Terminal, CircleDollarSign,
  ShieldAlert, Sparkles, MessageSquare, Wifi, Lock, Cpu, ChevronRight,
  Camera, FileText, ArrowUpRight, Zap, RefreshCw, Eye, Sliders, CheckCircle2,
  Building, HardDrive, FileSpreadsheet, LockKeyhole, HelpCircle, FileCheck
} from 'lucide-react'
import {
  LandingBackdrop,
  BrandLogo,
  OBSIDIAN,
  AnimatePresence,
  motion
} from '@/components/landing/LandingMotion'
import PublicNavbar from '@/components/shell/PublicNavbar'

type FeatureModuleTab = 'mesh' | 'erp' | 'filemorph' | 'cctv' | 'capital' | 'compliance'

export default function LandingClient() {
  const router = useRouter()
  const supabase = createClient()

  const [mounted, setMounted] = useState(false)
  const [checking, setChecking] = useState(true)
  const [activeTab, setActiveTab] = useState<FeatureModuleTab>('mesh')

  // Modals state
  const [deployModalOpen, setDeployModalOpen] = useState(false)
  const [capitalModalOpen, setCapitalModalOpen] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState('Akhuwat Microfinance')
  const [capitalAmount, setCapitalAmount] = useState('2500')
  const [capitalPurpose, setCapitalPurpose] = useState('Raw Material Fabric Inventory')
  const [referralToken, setReferralToken] = useState<string | null>(null)

  // Interactive Demos State
  // 1. FileMorph Demo State
  const [fileMorphAction, setFileMorphAction] = useState<'encrypt' | 'watermark' | 'compress' | 'convert' | 'exif'>('encrypt')
  const [fileMorphProcessing, setFileMorphProcessing] = useState(false)
  const [fileMorphResult, setFileMorphResult] = useState<string | null>(null)

  // 2. CCTV Scanner Demo State
  const [cctvScanning, setCctvScanning] = useState(false)
  const [cctvDevicesFound, setCctvDevicesFound] = useState([
    { ip: '192.168.1.104', port: 554, brand: 'Hikvision DS-2CD2143', location: 'Loom Floor Cam 01', status: 'Online' },
    { ip: '192.168.1.108', port: 554, brand: 'Imou Cue 2MP', location: 'Packing Dock Cam 02', status: 'Online' },
    { ip: '192.168.1.115', port: 80, brand: 'Dahua IPC-HDW', location: 'Raw Dye Warehouse 03', status: 'Online' },
  ])

  // 3. Karigar Payroll Calculator State
  const [karigarUnits, setKarigarUnits] = useState(450)
  const [karigarRate, setKarigarRate] = useState(35)
  const [karigarPeshgi, setKarigarPeshgi] = useState(1500)

  // 4. Working Capital Score Calculator State
  const [monthsActive, setMonthsActive] = useState(4)
  const [invoiceCount, setInvoiceCount] = useState(18)
  const [customerCount, setCustomerCount] = useState(6)

  // Calculate live credit score
  const creditScore = useMemo(() => {
    const timeScore = Math.min(25, monthsActive * 5)
    const invScore = Math.min(40, invoiceCount * 2)
    const custScore = Math.min(35, customerCount * 5)
    const total = Math.min(100, timeScore + invScore + custScore)
    const grade = total >= 80 ? 'A' : total >= 60 ? 'B' : total >= 40 ? 'C' : 'D'
    const maxLoan = total >= 80 ? 5000 : total >= 60 ? 2500 : total >= 40 ? 1000 : 500
    return { score: total, grade, maxLoan }
  }, [monthsActive, invoiceCount, customerCount])

  // Hydration-safe initial check & URL hash scrolling
  useEffect(() => {
    setMounted(true)

    async function checkEnvironment() {
      try {
        const isElectron = typeof window !== 'undefined' && (
          window.navigator.userAgent.toLowerCase().includes('electron') ||
          !!(window as any).electronAPI ||
          !!(window as any).electron
        )

        if (isElectron) {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            router.replace('/dashboard')
            return
          }
        }
        setChecking(false)
      } catch {
        setChecking(false)
      }
    }
    checkEnvironment()
  }, [supabase, router])

  // Scroll handler for hash navigation
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.hash) {
      const hash = window.location.hash.substring(1)
      setTimeout(() => {
        const el = document.getElementById(hash)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 150)
    }
  }, [mounted])

  const runFileMorphDemo = () => {
    setFileMorphProcessing(true)
    setFileMorphResult(null)
    setTimeout(() => {
      setFileMorphProcessing(false)
      if (fileMorphAction === 'encrypt') {
        setFileMorphResult('SUCCESS: Document encrypted in-memory with AES-256-GCM. 0 bytes sent to external cloud.')
      } else if (fileMorphAction === 'watermark') {
        setFileMorphResult('SUCCESS: Applied 45° opacity-controlled vector watermark "NOXIS FACTORY SEAL".')
      } else if (fileMorphAction === 'compress') {
        setFileMorphResult('SUCCESS: Reduced PDF stream size by 78.4% (8.4 MB → 1.8 MB). Stripped unused metadata.')
      } else if (fileMorphAction === 'convert') {
        setFileMorphResult('SUCCESS: Converted 12 PDF pages to 300 DPI high-resolution PNG image zip archive.')
      } else if (fileMorphAction === 'exif') {
        setFileMorphResult('SUCCESS: Stripped GPS coordinates, camera model tags, and EXIF metadata from 24 photos.')
      }
    }, 600)
  }

  const runCctvScannerDemo = () => {
    setCctvScanning(true)
    setTimeout(() => {
      setCctvScanning(false)
      const newDev = {
        ip: `192.168.1.${Math.floor(120 + Math.random() * 80)}`,
        port: 554,
        brand: 'Hikvision RTSP Sentinel Cam',
        location: 'Finished Goods Bay 04',
        status: 'Online'
      }
      setCctvDevicesFound(prev => [newDev, ...prev.slice(0, 3)])
    }, 800)
  }

  const handleRequestCapital = (e: React.FormEvent) => {
    e.preventDefault()
    const token = `REF-${selectedPartner.substring(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`
    setReferralToken(token)

    if (typeof window !== 'undefined') {
      const existing = JSON.parse(localStorage.getItem('noxis_capital_applications') || '[]')
      const app = {
        referral_token: token,
        partner_name: selectedPartner,
        amount: capitalAmount,
        purpose: capitalPurpose,
        status: 'Pre-Approved',
        submitted_at: new Date().toISOString()
      }
      localStorage.setItem('noxis_capital_applications', JSON.stringify([app, ...existing]))
    }
  }

  if (!mounted || checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#0B0F17] text-white">
        <BrandLogo size="splash" showWordmark={false} />
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent border-[#06B6D4] animate-spin" />
      </div>
    )
  }

  return (
    <>
      {/* Structured JSON-LD Metadata */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            'name': 'Noxis Hub Industrial OS',
            'operatingSystem': 'Windows, WebAssembly, Android Bridge',
            'applicationCategory': 'BusinessApplication',
            'offers': {
              '@type': 'Offer',
              'price': '0',
              'priceCurrency': 'USD'
            },
            'description': 'Offline-first industrial operating system for textile factories, karigar piece-rate payroll, CCTV Sentinel AI, FileMorph zero-cloud data studio, and Working Capital credit scoring.'
          })
        }}
      />

      <div className="font-sans min-h-screen selection:bg-[#06B6D4] selection:text-black overflow-x-hidden text-[#E2E8F0] relative bg-[#0B0F17]">
        <LandingBackdrop />

        {/* Global ambient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.06)_0%,transparent_60%)] pointer-events-none z-0" />

        <div className="relative z-10">
          {/* Header Navigation */}
          <PublicNavbar />

          {/* ========================================== */}
          {/* HERO SECTION                               */}
          {/* ========================================== */}
          <section className="pt-32 pb-20 lg:pt-44 lg:pb-32 px-4 sm:px-6 max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <BrandLogo size="hero" showWordmark={true} />
              </motion.div>

              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 border border-[#06B6D4]/30 bg-[#06B6D4]/10 mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <Sparkles size={13} className="text-[#06B6D4] animate-pulse" />
                <span className="text-[10px] font-black tracking-[0.25em] uppercase text-[#08EBF6] font-mono">
                  Production-Grade Offline-First Industrial OS
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white italic leading-tight mb-8">
                THE 100% OFFLINE-FIRST <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06B6D4] via-[#08EBF6] to-white not-italic">
                  FACTORY OPERATING SYSTEM
                </span>
              </h1>

              <p className="text-sm sm:text-base text-gray-400 max-w-3xl leading-relaxed font-normal mb-10">
                Engineered for textile factories, garment manufacturers, pharma labs, and industrial plants. Operates seamlessly with zero active internet dependencies utilizing local encrypted SQLite Write-Ahead Logging, QR-based LAN mobile device pairing, Karigar piece-rate payroll, CCTV Sentinel AI, FileMorph 100% client-side document studio, and Working Capital telemetry.
              </p>

              {/* Hero Action CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <a
                  href="#features"
                  onClick={(e) => {
                    e.preventDefault()
                    const el = document.getElementById('features')
                    if (el) el.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="w-full sm:w-auto px-8 py-4 text-xs font-black uppercase tracking-widest text-black bg-[#06B6D4] hover:bg-[#08EBF6] rounded shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 no-underline"
                >
                  <Cpu size={16} />
                  <span>Explore Architecture</span>
                </a>

                <button
                  onClick={() => setDeployModalOpen(true)}
                  className="w-full sm:w-auto px-8 py-4 text-xs font-black uppercase tracking-widest text-white bg-white/5 border border-[#06B6D4]/40 hover:bg-[#06B6D4]/10 hover:border-[#06B6D4] rounded transition-all flex items-center justify-center gap-2"
                >
                  <Download size={16} className="text-[#06B6D4]" />
                  <span>Deploy Offline Node</span>
                </button>

                <button
                  onClick={() => setCapitalModalOpen(true)}
                  className="w-full sm:w-auto px-8 py-4 text-xs font-black uppercase tracking-widest text-[#EAB308] bg-[#EAB308]/10 border border-[#EAB308]/30 hover:bg-[#EAB308]/20 rounded transition-all flex items-center justify-center gap-2"
                >
                  <Building size={16} />
                  <span>Capital Referral</span>
                </button>
              </div>

              {/* Key Highlights Ribbon */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 w-full max-w-5xl">
                {[
                  ['100% Offline Mode', 'Zero cloud lockout or internet downtime', Database],
                  ['QR Multi-Device LAN', 'Instant Android Wi-Fi pairing on floor', Smartphone],
                  ['Karigar Piece-Rate', 'Artisan output & peshgi wage calculator', CircleDollarSign],
                  ['100% Client FileMorph', 'In-memory AES-256 PDF & Image suite', LockKeyhole],
                ].map(([title, desc, Icon]: any, idx) => (
                  <div key={idx} className="p-4 bg-[#0F141C]/80 border border-[#06B6D4]/20 rounded backdrop-blur-md text-left space-y-1">
                    <div className="flex items-center gap-2 text-[#06B6D4]">
                      <Icon size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider text-white">{title}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium leading-normal">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ========================================== */}
          {/* CORE MODULES & FEATURES SECTION (#features) */}
          {/* ========================================== */}
          <section id="features" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-[#06B6D4]/20">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4] text-[10px] font-bold uppercase tracking-widest mb-3">
                <Layers size={12} />
                <span>Production System UI Architecture</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white italic">
                EXPLORE NOXIS HUB CORE MODULES
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">
                Click any module tab below to interact with live system components and operational simulators.
              </p>
            </div>

            {/* Feature Tabs Selector */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              {[
                { id: 'mesh', label: 'Offline Mesh Node', icon: Database },
                { id: 'erp', label: 'Garment ERP & Karigars', icon: CircleDollarSign },
                { id: 'filemorph', label: 'FileMorph Data Studio', icon: LockKeyhole },
                { id: 'cctv', label: 'CCTV Sentinel AI', icon: Camera },
                { id: 'capital', label: 'Working Capital Hub', icon: Building },
                { id: 'compliance', label: 'Governance & GDPR', icon: ShieldCheck },
              ].map(tab => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as FeatureModuleTab)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all border ${
                      active
                        ? 'bg-[#06B6D4] text-black border-[#08EBF6] shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                        : 'bg-[#0F141C]/60 text-gray-400 border-white/5 hover:border-[#06B6D4]/40 hover:text-white'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Tab Contents */}
            <div className="bg-[#0F141C]/90 border border-[#06B6D4]/30 rounded-lg p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#06B6D4]/5 rounded-full blur-3xl pointer-events-none" />

              {/* MODULE 1: OFFLINE MESH & SYNC */}
              {activeTab === 'mesh' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4] text-[10px] font-mono font-bold uppercase tracking-wider">
                      <Wifi size={12} />
                      <span>Zero-Cloud Dependency Engine</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight italic">
                      100% Offline-First Mesh & Device Pairing
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-normal">
                      Noxis Workstation runs on an embedded local SQLite engine configured with Write-Ahead Logging (WAL) and AES-256 local database encryption. Factories can log raw material transactions, attendance, and sales for months with zero internet connectivity.
                    </p>

                    <div className="space-y-3 text-xs">
                      {[
                        'Local Wi-Fi Subnet QR Discovery: Pair supervisor Android devices instantly over local Wi-Fi.',
                        'Automatic Cloud Sync: When active internet connects, changes reconcile asynchronously.',
                        'Conflict Resolution Engine: Automatic timestamped transaction queue merging.',
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-gray-300">
                          <CheckCircle2 size={16} className="text-[#06B6D4] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setDeployModalOpen(true)}
                      className="px-6 py-3 bg-[#06B6D4] text-black text-xs font-black uppercase tracking-widest rounded shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:bg-[#08EBF6] transition-all flex items-center gap-2"
                    >
                      <Download size={14} />
                      <span>Download Offline Workstation Installer</span>
                    </button>
                  </div>

                  {/* Simulated Terminal Console */}
                  <div className="bg-[#07090D] border border-white/10 rounded p-4 font-mono text-[11px] space-y-2">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                      <div className="flex items-center gap-2 text-[#06B6D4]">
                        <Terminal size={14} />
                        <span className="font-bold uppercase tracking-wider">Noxis Local Mesh Node Console</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold uppercase">
                        LOCAL ENGINE ACTIVE
                      </span>
                    </div>

                    <div className="space-y-1.5 text-gray-300">
                      <p className="text-gray-500">[21:32:04] Initializing local SQLite database: C:\NoxisData\Noxis-Local.db</p>
                      <p className="text-[#06B6D4]">[21:32:05] SUCCESS: AES-256 encrypted WAL journal active.</p>
                      <p className="text-emerald-400">[21:32:08] TELEMETRY: Offline mode enabled. Transactions queued locally.</p>
                      <p className="text-gray-300">[21:32:15] TRANSACT: Logged 1,420 yards for Weaver Hamid Saeed.</p>
                      <p className="text-amber-400">[21:35:12] MESH: 4 Android companion devices connected via subnet 192.168.1.0/24</p>
                      <p className="text-cyan-300">[21:36:00] QUEUE: 142 records ready for cloud handshake when online.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 2: INDUSTRIAL GARMENT ERP & KARIGARS */}
              {activeTab === 'erp' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center" id="erp">
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4] text-[10px] font-mono font-bold uppercase tracking-wider">
                      <CircleDollarSign size={12} />
                      <span>Artisan & Piece-Rate Registry</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight italic">
                      Karigars, Piece-Rate Payroll & Supply Chain
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-normal">
                      Built specifically for garment & textile mills. Track piece-rate wages per yard/unit, manage worker advance payments (peshgi), print salary slips, manage purchase orders, track fabric stock, and trigger automated workflow alerts.
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-black/40 border border-white/10 rounded space-y-1">
                        <span className="text-[10px] uppercase font-bold text-gray-400">Karigar Wage Types</span>
                        <p className="text-white font-bold">Piece-rate, Daily & Monthly</p>
                      </div>
                      <div className="p-3 bg-black/40 border border-white/10 rounded space-y-1">
                        <span className="text-[10px] uppercase font-bold text-gray-400">Advance Deductions</span>
                        <p className="text-white font-bold">Automated Peshgi Tracking</p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Karigar Payroll Calculator Simulator */}
                  <div className="bg-[#07090D] border border-[#06B6D4]/30 rounded p-6 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#06B6D4] flex items-center justify-between border-b border-white/10 pb-3">
                      <span>Live Karigar Payroll Slip Simulator</span>
                      <span className="text-[9px] font-mono text-gray-400">Interactive Tool</span>
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between text-gray-400 mb-1">
                          <span>Units Produced (Yards / Stitching):</span>
                          <span className="font-bold text-white font-mono">{karigarUnits} units</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="2000"
                          value={karigarUnits}
                          onChange={(e) => setKarigarUnits(Number(e.target.value))}
                          className="w-full accent-[#06B6D4]"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-gray-400 mb-1">
                          <span>Piece Rate per Unit (PKR):</span>
                          <span className="font-bold text-white font-mono">PKR {karigarRate}</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="200"
                          value={karigarRate}
                          onChange={(e) => setKarigarRate(Number(e.target.value))}
                          className="w-full accent-[#06B6D4]"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-gray-400 mb-1">
                          <span>Peshgi (Advance Deduction):</span>
                          <span className="font-bold text-[#06B6D4] font-mono">PKR {karigarPeshgi}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10000"
                          step="250"
                          value={karigarPeshgi}
                          onChange={(e) => setKarigarPeshgi(Number(e.target.value))}
                          className="w-full accent-[#06B6D4]"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-black/60 border border-white/10 rounded space-y-2 font-mono text-xs">
                      <div className="flex justify-between text-gray-400">
                        <span>Gross Earnings ({karigarUnits} × {karigarRate}):</span>
                        <span className="text-white font-bold">PKR {(karigarUnits * karigarRate).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Peshgi Deduction:</span>
                        <span className="text-red-400">- PKR {karigarPeshgi.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-white font-bold border-t border-white/10 pt-2 text-sm">
                        <span className="text-[#06B6D4]">Net Payable Wage:</span>
                        <span className="text-emerald-400">PKR {Math.max(0, (karigarUnits * karigarRate) - karigarPeshgi).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 3: FILEMORPH DATA STUDIO */}
              {activeTab === 'filemorph' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center" id="filemorph">
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4] text-[10px] font-mono font-bold uppercase tracking-wider">
                      <LockKeyhole size={12} />
                      <span>100% Client-Side In-Memory Engine</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight italic">
                      FileMorph Data & Document Studio
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-normal">
                      Zero-cloud document suite running 100% inside your browser / desktop RAM via WebAssembly. Perform PDF encryption, watermarking, size compression, format conversions, image background removal, EXIF cleaner, and Tally/WhatsApp order CSV importers.
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {[
                        'AES-256 PDF Encryption & Lock',
                        'PDF Compression (up to 80% size reduction)',
                        'PDF to 300 DPI Images & Word',
                        'Edge Background Remover & EXIF Stripper',
                        'Tally & QuickBooks CSV Ledger Importers',
                        'WhatsApp Order Text Parser',
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-gray-300">
                          <CheckCircle2 size={14} className="text-[#06B6D4] shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interactive FileMorph Simulator */}
                  <div className="bg-[#07090D] border border-[#06B6D4]/30 rounded p-6 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#06B6D4] flex items-center justify-between border-b border-white/10 pb-3">
                      <span>Interactive FileMorph Tool Simulator</span>
                      <span className="text-[9px] font-mono text-gray-400">100% WASM Client-Side</span>
                    </h4>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'encrypt', label: 'PDF Encrypt (AES-256)' },
                        { id: 'watermark', label: 'PDF Watermark' },
                        { id: 'compress', label: 'Compress PDF (80%)' },
                        { id: 'convert', label: 'PDF → 300DPI PNG' },
                        { id: 'exif', label: 'EXIF Metadata Strip' },
                      ].map(btn => (
                        <button
                          key={btn.id}
                          onClick={() => setFileMorphAction(btn.id as any)}
                          className={`p-2 text-[10px] font-bold uppercase rounded border transition-colors ${
                            fileMorphAction === btn.id
                              ? 'bg-[#06B6D4] text-black border-[#08EBF6]'
                              : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/20'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-4 bg-black/60 border border-white/10 rounded space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 font-mono">Sample Input File:</span>
                        <span className="text-white font-bold font-mono">Factory_Payroll_2026.pdf (8.4 MB)</span>
                      </div>

                      <button
                        onClick={runFileMorphDemo}
                        disabled={fileMorphProcessing}
                        className="w-full py-3 bg-[#06B6D4] hover:bg-[#08EBF6] text-black text-xs font-black uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2"
                      >
                        {fileMorphProcessing ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Processing in RAM...</span>
                          </>
                        ) : (
                          <>
                            <Zap size={14} />
                            <span>Run {fileMorphAction.toUpperCase()} Operation</span>
                          </>
                        )}
                      </button>

                      {fileMorphResult && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] rounded">
                          {fileMorphResult}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 4: CCTV SENTINEL AI */}
              {activeTab === 'cctv' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center" id="cctv">
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4] text-[10px] font-mono font-bold uppercase tracking-wider">
                      <Camera size={12} />
                      <span>RTSP & Port 80/554 Auto-Discovery</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight italic">
                      CCTV Sentinel AI & Security Hub
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-normal">
                      Scan local LAN subnets automatically for Hikvision, Imou, Dahua, and RTSP IP camera feeds (Port 80 / 554). Run local face matching, zone intrusion detection, and instant floor sirens without monthly cloud storage fees.
                    </p>

                    <div className="space-y-3 text-xs text-gray-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-[#06B6D4]" />
                        <span>Zero cloud storage fee — RTSP video stays 100% local.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-[#06B6D4]" />
                        <span>Local face check-in logging for Karigars and Operators.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-[#06B6D4]" />
                        <span>Automated siren & push notifications on zone breaches.</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive CCTV Scanner Simulator */}
                  <div className="bg-[#07090D] border border-[#06B6D4]/30 rounded p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#06B6D4] flex items-center gap-2">
                        <Camera size={14} />
                        <span>LAN Subnet Camera Auto-Discovery</span>
                      </h4>
                      <button
                        onClick={runCctvScannerDemo}
                        disabled={cctvScanning}
                        className="px-3 py-1 bg-[#06B6D4] text-black text-[10px] font-black uppercase tracking-wider rounded hover:bg-[#08EBF6] transition-all flex items-center gap-1"
                      >
                        <RefreshCw size={12} className={cctvScanning ? 'animate-spin' : ''} />
                        <span>Scan 192.168.1.0/24</span>
                      </button>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      {cctvDevicesFound.map((dev, idx) => (
                        <div key={idx} className="p-3 bg-black/50 border border-white/10 rounded flex items-center justify-between">
                          <div>
                            <p className="text-white font-bold">{dev.location}</p>
                            <p className="text-gray-500 text-[10px]">{dev.brand} ({dev.ip}:{dev.port})</p>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded uppercase">
                            {dev.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 5: WORKING CAPITAL HUB */}
              {activeTab === 'capital' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center" id="capital">
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#EAB308]/10 border border-[#EAB308]/30 text-[#EAB308] text-[10px] font-mono font-bold uppercase tracking-wider">
                      <Building size={12} />
                      <span>SME Funding Telemetry & Credit Scoring</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight italic">
                      Noxis Capital Core & Working Capital Hub
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-normal">
                      Verified factory telemetry converts live ledger invoice activity into credit health scores (A/B tiering). Access collateral-free SME microfinance referrals from institutional partners (Akhuwat Microfinance, NRSP, HBL).
                    </p>

                    <button
                      onClick={() => setCapitalModalOpen(true)}
                      className="px-6 py-3 bg-[#EAB308] text-black text-xs font-black uppercase tracking-widest rounded shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:bg-amber-300 transition-all flex items-center gap-2"
                    >
                      <ArrowUpRight size={16} />
                      <span>Submit Capital Referral Request</span>
                    </button>
                  </div>

                  {/* Interactive Credit Score Calculator */}
                  <div className="bg-[#07090D] border border-[#EAB308]/30 rounded p-6 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#EAB308] flex items-center justify-between border-b border-white/10 pb-3">
                      <span>Live Credit Score Benchmark Calculator</span>
                      <span className="text-[9px] font-mono text-gray-400">Factory Score</span>
                    </h4>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 bg-black/50 border border-white/10 rounded">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Credit Score</span>
                        <span className="text-2xl font-black text-white font-mono">{creditScore.score}/100</span>
                      </div>
                      <div className="p-3 bg-black/50 border border-white/10 rounded">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Credit Grade</span>
                        <span className="text-2xl font-black text-[#EAB308] font-mono">Grade {creditScore.grade}</span>
                      </div>
                      <div className="p-3 bg-black/50 border border-white/10 rounded">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Pre-Approved Limit</span>
                        <span className="text-lg font-black text-emerald-400 font-mono">${creditScore.maxLoan} USD</span>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between text-gray-400 mb-1">
                          <span>Months Active on Noxis:</span>
                          <span className="font-bold text-white font-mono">{monthsActive} months</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="24"
                          value={monthsActive}
                          onChange={(e) => setMonthsActive(Number(e.target.value))}
                          className="w-full accent-[#EAB308]"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-gray-400 mb-1">
                          <span>Invoice Volume (last 90 days):</span>
                          <span className="font-bold text-white font-mono">{invoiceCount} invoices</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={invoiceCount}
                          onChange={(e) => setInvoiceCount(Number(e.target.value))}
                          className="w-full accent-[#EAB308]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 6: GOVERNANCE, COMPLIANCE & GDPR */}
              {activeTab === 'compliance' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center" id="compliance">
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4] text-[10px] font-mono font-bold uppercase tracking-wider">
                      <ShieldCheck size={12} />
                      <span>Audit Trails & Data Governance</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight italic">
                      Governance, Compliance & GDPR Center
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-normal">
                      Immutable double-entry audit trails, SLA verifications, industry GMP checklists, and one-click GDPR subject data export or permanent deletion.
                    </p>

                    <div className="space-y-2 text-xs">
                      <div className="p-3 bg-black/40 border border-white/10 rounded flex items-center justify-between">
                        <span className="text-gray-300">FDA & GMP Audit Verification Reports</span>
                        <span className="text-emerald-400 font-bold">100% Passed</span>
                      </div>
                      <div className="p-3 bg-black/40 border border-white/10 rounded flex items-center justify-between">
                        <span className="text-gray-300">GDPR Data Privacy Export Engine</span>
                        <span className="text-[#06B6D4] font-bold">Compliant</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-[#07090D] border border-white/10 rounded space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span className="text-white font-bold">GDPR Subject Request Console</span>
                      <span className="text-emerald-400">Ready</span>
                    </div>
                    <p className="text-gray-400 text-[11px]">
                      Enter subject email address to generate an encrypted export bundle or execute a right-to-be-forgotten erasure.
                    </p>
                    <div className="flex gap-2 pt-2">
                      <input
                        type="email"
                        placeholder="operator@factory.com"
                        className="flex-1 bg-black border border-white/20 text-xs px-3 py-2 text-white outline-none focus:border-[#06B6D4]"
                      />
                      <button className="px-4 py-2 bg-[#06B6D4] text-black text-xs font-bold uppercase tracking-wider rounded">
                        Export ZIP
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </section>

          {/* ========================================== */}
          {/* COMPARISON MATRIX                          */}
          {/* ========================================== */}
          <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-[#06B6D4]/20">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white italic">
                NOXIS HUB VS TRADITIONAL SOFTWARE
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">
                Why industrial factories choose offline-first local workstations over fragile cloud SaaS tools.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-white/10 rounded overflow-hidden">
                <thead>
                  <tr className="bg-[#0F141C] border-b border-white/10 text-xs font-black uppercase tracking-wider text-gray-300">
                    <th className="p-4">Operational Feature</th>
                    <th className="p-4 text-[#06B6D4]">Noxis Hub (Offline-First OS)</th>
                    <th className="p-4 text-gray-500">Generic Cloud SaaS</th>
                    <th className="p-4 text-gray-500">Paper Ledgers</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-gray-300 font-medium divide-y divide-white/5 bg-[#07090D]">
                  {[
                    ['Network Dependency', '100% Offline-capable (Runs on local Wi-Fi)', 'Completely blocks on internet drops', 'Manual records'],
                    ['Karigar Wages & Peshgi', 'Automated piece-rate & advance deductions', 'Requires complex custom spreadsheets', 'Calculated manually, high error rate'],
                    ['Document Privacy (FileMorph)', '100% In-memory WASM (0 bytes uploaded)', 'Uploaded to third-party web servers', 'Physical paper copies'],
                    ['Security Camera Feeds', 'Local AI RTSP camera scanner (Zero cloud fee)', 'High monthly fee cloud cameras', 'None'],
                    ['Data Control & Safety', 'Encrypted local SQLite + auto cloud mirror', 'Stored on public multi-tenant clouds', 'No backup (fire/loss risk)'],
                  ].map(([row, noxis, cloud, manual], i) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-bold text-white">{row}</td>
                      <td className="p-4 text-[#08EBF6] font-semibold">{noxis}</td>
                      <td className="p-4 text-gray-400">{cloud}</td>
                      <td className="p-4 text-gray-500">{manual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ========================================== */}
          {/* DEPLOY OFFLINE NODE MODAL                  */}
          {/* ========================================== */}
          {deployModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="max-w-md w-full bg-[#0B0F17] border border-[#06B6D4]/40 rounded-lg p-6 space-y-4 shadow-2xl relative">
                <button onClick={() => setDeployModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
                <div className="flex items-center gap-2 text-[#06B6D4]">
                  <Download size={20} />
                  <h3 className="text-base font-black uppercase text-white tracking-wider">Deploy Noxis Offline Node</h3>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Download the optimized Windows desktop workstation setup binary (.exe) or launcher for local factory computers.
                </p>

                <div className="space-y-3 pt-2">
                  <a
                    href="/download"
                    className="w-full py-3.5 bg-[#06B6D4] hover:bg-[#08EBF6] text-black text-xs font-black uppercase tracking-widest rounded flex items-center justify-center gap-2 no-underline"
                  >
                    <Download size={14} />
                    <span>Download Windows Workstation Setup (.exe)</span>
                  </a>
                  <a
                    href="https://wa.me/923264742678?text=Hello%20Noxis%20Team%2C%20I%20want%20to%20deploy%20an%20Offline%20Factory%20Node"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 bg-white/5 border border-white/10 hover:border-white/20 text-gray-300 text-xs font-bold uppercase tracking-widest rounded flex items-center justify-center gap-2 no-underline"
                  >
                    <MessageSquare size={14} />
                    <span>Request Guided Onboarding via WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* WORKING CAPITAL REFERRAL MODAL             */}
          {/* ========================================== */}
          {capitalModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="max-w-lg w-full bg-[#0B0F17] border border-[#EAB308]/40 rounded-lg p-6 space-y-4 shadow-2xl relative">
                <button onClick={() => { setCapitalModalOpen(false); setReferralToken(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
                <div className="flex items-center gap-2 text-[#EAB308]">
                  <Building size={20} />
                  <h3 className="text-base font-black uppercase text-white tracking-wider">Institutional Capital Referral</h3>
                </div>

                {!referralToken ? (
                  <form onSubmit={handleRequestCapital} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Select Financial Partner</label>
                      <select
                        value={selectedPartner}
                        onChange={(e) => setSelectedPartner(e.target.value)}
                        className="w-full bg-[#07090D] border border-white/20 text-white p-3 rounded outline-none focus:border-[#EAB308]"
                      >
                        <option value="Akhuwat Microfinance">Akhuwat Microfinance (Qarz-e-Hasna 0% Markup)</option>
                        <option value="NRSP Microfinance Bank">NRSP Microfinance Bank (SME Inventory Loans)</option>
                        <option value="HBL Microfinance Bank">HBL Microfinance Bank (Commercial Credit)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Requested Amount (USD / Equivalent)</label>
                      <input
                        type="number"
                        value={capitalAmount}
                        onChange={(e) => setCapitalAmount(e.target.value)}
                        className="w-full bg-[#07090D] border border-white/20 text-white p-3 rounded outline-none focus:border-[#EAB308]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Purpose of Capital</label>
                      <input
                        type="text"
                        value={capitalPurpose}
                        onChange={(e) => setCapitalPurpose(e.target.value)}
                        className="w-full bg-[#07090D] border border-white/20 text-white p-3 rounded outline-none focus:border-[#EAB308]"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-[#EAB308] hover:bg-amber-300 text-black text-xs font-black uppercase tracking-widest rounded flex items-center justify-center gap-2"
                    >
                      <ArrowUpRight size={16} />
                      <span>Submit Capital Referral Request</span>
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4 text-xs font-mono text-center py-2">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded">
                      <p className="font-bold text-sm">REFERRAL APPLICATION GENERATED ✓</p>
                      <p className="text-white text-base font-black mt-2">{referralToken}</p>
                    </div>
                    <p className="text-gray-400">
                      Your referral telemetry has been queued for {selectedPartner}. A microfinance credit desk officer will review your score benchmarks within 24-48 hours.
                    </p>
                    <button
                      onClick={() => setCapitalModalOpen(false)}
                      className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase rounded"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* DYNAMIC FOOTER                             */}
          {/* ========================================== */}
          <footer className="border-t border-[#06B6D4]/20 bg-[#07090D] py-12 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-gray-400">
              <div className="flex items-center gap-3">
                <BrandLogo size="footer" showWordmark={true} />
                <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold uppercase">
                  ● All Systems Nominal • Mesh Local Engine Active
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-6 font-semibold uppercase text-[11px]">
                <Link href="/specs" className="hover:text-[#06B6D4] transition-colors no-underline">Hardware Specs</Link>
                <Link href="/docs" className="hover:text-[#06B6D4] transition-colors no-underline">Documentation</Link>
                <Link href="/pricing" className="hover:text-[#06B6D4] transition-colors no-underline">Pricing</Link>
                <Link href="/terms" className="hover:text-[#06B6D4] transition-colors no-underline">Terms</Link>
                <Link href="/privacy" className="hover:text-[#06B6D4] transition-colors no-underline">Privacy Policy</Link>
              </div>

              <p className="text-[10px] font-mono text-gray-500">
                © 2026 Noxis Hub. Built for extreme performance.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}
