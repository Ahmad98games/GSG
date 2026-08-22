'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PublicNavbar from '@/components/shell/PublicNavbar'
import { 
  CircleDollarSign, Layers, Users, FileText, Smartphone, ShieldCheck, 
  Cpu, Monitor, Download, ArrowRight, Sparkles, Check, Lock, Wifi,
  BarChart4, ShieldAlert, Key, Zap, PackageCheck, RefreshCw
} from 'lucide-react'

export default function FeaturesPage() {
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    setIsElectron(
      window.navigator.userAgent.toLowerCase().includes('electron') ||
      !!(window as any).electronAPI ||
      !!(window as any).electron
    )
  }, [])

  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null)

  const featureCategories = [
    {
      id: 'pos',
      title: 'POS Counter & Hardware Control',
      badge: 'Hardware Integrated',
      desc: 'High-speed POS counter for factory retail & wholesale outlets with thermal printer & weighbridge COM scale support.',
      image: '/software-images/pos.png',
      items: [
        'Instant barcode scanner integration & quick SKU entry',
        'Weighbridge COM scale live payload reading',
        '80mm & 58mm thermal receipt printing via ESC/POS',
        'Sales returns, discounts, & tax calculation',
        'F2 quick search & 5-second automatic draft recovery'
      ],
      icon: CircleDollarSign,
      color: 'text-amber-400',
      border: 'border-amber-500/20',
      bg: 'bg-amber-500/10'
    },
    {
      id: 'payroll',
      title: 'Karigar Payroll & Peshgi Ledger',
      badge: 'Pakistan Factory Specialization',
      desc: 'Automate piece-rate & daily-wage worker payroll with real-time Peshgi advance deductions and printable slips.',
      image: '/software-images/register karigar.png',
      items: [
        'Piece-rate wage calculations (per yard, meter, suit, maund)',
        'Peshgi (Advance) ledger & automatic salary deduction',
        'Attendance tracking via Android companion or ONVIF CCTV',
        'Worker payslip PDF generation with Amount in Words',
        'Virtual scroll support for 1,000+ factory workers'
      ],
      icon: Users,
      color: 'text-blue-400',
      border: 'border-blue-500/20',
      bg: 'bg-blue-500/10'
    },
    {
      id: 'accounting',
      title: 'Double-Entry Khata Accounting',
      badge: 'Audit Verified',
      desc: 'Complete financial ledger engine automatically balancing Debit and Credit for zero-error accounting.',
      image: '/software-images/party.png',
      items: [
        'Automatic journal entries for sales, purchases, & expenses',
        'Real-time P&L (Profit & Loss), Trial Balance, & Balance Sheet',
        'Party Khata ledgers with debit/credit balance tracking',
        'Aging reports for Accounts Receivable & Payable',
        'Professional PDF statement & invoice generation'
      ],
      icon: FileText,
      color: 'text-emerald-400',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/10'
    },
    {
      id: 'filemorph',
      title: 'File Morph & Document Security Suite',
      badge: '100% Offline Utilities',
      desc: 'Local-first PDF, Image, and Document processing engine with complete privacy and zero cloud uploads.',
      image: '/software-images/file morph.png',
      items: [
        'Convert PDF, Word, Excel, Images & HTML documents offline',
        'Merge, split, extract pages, rotate, and compress PDF files',
        'Redact sensitive text, add digital watermarks & metadata cleaner',
        'Image background remover, resizer, scaler & batch optimizer',
        'AES-256 PDF decryption and password unlocking'
      ],
      icon: RefreshCw,
      color: 'text-cyan-400',
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-500/10'
    },
    {
      id: 'production',
      title: 'Batch Production & Fabric Purchase',
      badge: 'Loom & Mill Control',
      desc: 'Track raw material yarn/fabric purchasing, batch production stages, and stitching job allotments.',
      image: '/software-images/batch.png',
      items: [
        'Raw material fabric purchase orders & supplier tracking',
        'Loom production batch creation with SKU yield measurement',
        'Stitching job slip assignment to karigars',
        'Finished goods quality inspection & batch completion',
        'Maund & Mandi rate conversions built-in'
      ],
      icon: PackageCheck,
      color: 'text-[#C5A059]',
      border: 'border-[#C5A059]/20',
      bg: 'bg-[#C5A059]/10'
    },
    {
      id: 'crm',
      title: 'Corporate CRM & Deal Pipeline',
      badge: 'B2B Sales Acceleration',
      desc: 'Manage wholesale buyer pipelines, corporate party directories, deals, and automated WhatsApp payment reminders.',
      image: '/software-images/crm.png',
      items: [
        'Corporate customer directory with multi-contact profiles',
        'Visual deal pipeline tracking from lead to final dispatch',
        'Automated WhatsApp billing reminders & invoice sharing',
        'Credit limit & credit days utilization monitoring',
        'Party reliability scoring & AI credit evaluation'
      ],
      icon: BarChart4,
      color: 'text-indigo-400',
      border: 'border-indigo-500/20',
      bg: 'bg-indigo-500/10'
    },
    {
      id: 'offline',
      title: '100% Offline SQLite Data Engine',
      badge: 'Zero Internet Dependency',
      desc: 'Keep working through power cuts and load-shedding with local encrypted SQLite database files.',
      image: '/software-images/setting.png',
      items: [
        'AES-256 SQLCipher encrypted local database file',
        'Sub-50ms query response time directly on your hard drive',
        'Automatic WAL journal mode preventing data corruption',
        'Silent background sync queue when internet reconnects',
        'Power-cut auto-start recovery & draft session state'
      ],
      icon: Lock,
      color: 'text-purple-400',
      border: 'border-purple-500/20',
      bg: 'bg-purple-500/10'
    },
    {
      id: 'cctv',
      title: 'CCTV Sentinel AI Monitoring',
      badge: 'Elite AI Feature',
      desc: 'Connect factory IP cameras for AI face check-in attendance and automated perimeter security breach alerts.',
      image: '/software-images/cctv.png',
      items: [
        'RTSP & ONVIF stream integration for up to 6 camera channels',
        'AI face recognition matching karigars at loom floor doors',
        'Intruder & unauthorized zone breach detection',
        'Live timeline incident log & CSV event export',
        'Instant PC alarm siren & mobile push notifications'
      ],
      icon: ShieldAlert,
      color: 'text-red-400',
      border: 'border-red-500/20',
      bg: 'bg-red-500/10'
    },
    {
      id: 'mobile',
      title: 'Local WiFi Mobile Mesh Nodes',
      badge: 'No Internet Needed',
      desc: 'Pair floor supervisor Android smartphones over local office WiFi in under 60 seconds without cloud dependency.',
      image: '/software-images/device pair.png',
      items: [
        'QR code instant device pairing via local IP subnet',
        'Floor attendance marking & Peshgi advance logging',
        'Stock scanning & batch production entry from phone',
        'Sub-2-second local synchronization with PC Hub',
        'Role-based permissions limiting mobile supervisor views'
      ],
      icon: Smartphone,
      color: 'text-cyan-400',
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-500/10'
    }
  ]

  const softwareShowcaseScreenshots = [
    { title: 'POS Counter Interface', src: '/software-images/pos.png', desc: 'Real-time SKU barcode entry & thermal invoice printer control' },
    { title: 'Karigar Registration & Wages', src: '/software-images/register karigar.png', desc: 'Piece-rate rate setups & Peshgi advance ledger' },
    { title: 'Double-Entry Khata Ledger', src: '/software-images/party.png', desc: 'Party accounts receivable & debit/credit balance ledger' },
    { title: 'File Morph Security Suite', src: '/software-images/file morph.png', desc: 'Local PDF conversion, compression, & watermark utilities' },
    { title: 'Batch Production & Loom Control', src: '/software-images/batch.png', desc: 'Fabric purchasing, stitching job slips & yield tracking' },
    { title: 'CCTV Sentinel AI Monitoring', src: '/software-images/cctv.png', desc: 'ONVIF IP camera stream integration & intruder alarms' },
    { title: 'Corporate CRM & Deal Pipeline', src: '/software-images/crm.png', desc: 'Wholesale buyer pipeline & automated WhatsApp notifications' },
    { title: 'Workflow Automation Rules', src: '/software-images/workflows.png', desc: 'Trigger-based alert rules & automated scheduled tasks' },
    { title: 'Local WiFi Device Pairing', src: '/software-images/device pair.png', desc: 'QR code pairing for Android floor supervisor smartphones' },
    { title: 'Audit Trail & Compliance Logs', src: '/software-images/audit logs.png', desc: 'Cryptographic security logs & tamper-evident audit history' },
  ]

  const tierComparison = [
    { feature: 'POS Counter & Thermal Printing', free: true, lite: true, pro: true, elite: true },
    { feature: 'Karigar Attendance & Basic Ledger', free: true, lite: true, pro: true, elite: true },
    { feature: 'WhatsApp Invoice Sharing', free: false, lite: true, pro: true, elite: true },
    { feature: 'Full Payroll & Payslip PDF Export', free: false, lite: true, pro: true, elite: true },
    { feature: 'Financial Reports PDF/Excel Export', free: false, lite: true, pro: true, elite: true },
    { feature: 'Multi-Device WiFi Companion (Max)', free: '1', lite: '5', pro: '15', elite: '50' },
    { feature: 'CCTV IP Camera Channels (Max)', free: '0', lite: '2', pro: '4', elite: '6' },
    { feature: 'Cloud Backup & Auto-Sync', free: false, lite: false, pro: true, elite: true },
    { feature: 'Multi-Branch Location Management', free: false, lite: false, pro: true, elite: true },
    { feature: 'Foresight AI Predictions', free: false, lite: false, pro: true, elite: true },
    { feature: 'Sentinel AI CCTV Detection & API', free: false, lite: false, pro: false, elite: true },
  ]

  return (
    <div className="min-h-screen bg-[#040608] text-slate-200 font-sans selection:bg-[#C5A059] selection:text-black pt-12 pb-20">
      {!isElectron && <PublicNavbar />}

      <div className="max-w-7xl mx-auto px-6 space-y-20">
        
        {/* ═══ HERO SECTION ═══ */}
        <section className="text-center pt-4 space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#C5A059]/10 border border-[#C5A059]/25 px-4 py-1.5 rounded-full">
            <Sparkles size={14} className="text-[#C5A059]" />
            <span className="text-xs font-black text-[#C5A059] uppercase tracking-widest">
              Industrial Feature Index · Noxis Hub v13.0.0
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-none">
            Complete Industrial <span className="text-[#C5A059]">ERP Capabilities</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Explore every module built into Noxis Hub — designed specifically for textile mills, factories, and industrial hubs.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isElectron ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#C5A059] via-[#E8D5B5] to-[#C5A059] text-black font-black text-sm uppercase tracking-wider px-8 py-4 rounded-sm hover:brightness-110 transition-all shadow-[0_0_30px_rgba(197,160,89,0.3)]"
              >
                <Cpu size={18} />
                <span>Return to Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/download"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#C5A059] via-[#E8D5B5] to-[#C5A059] text-black font-black text-sm uppercase tracking-wider px-8 py-4 rounded-sm hover:brightness-110 transition-all shadow-[0_0_30px_rgba(197,160,89,0.3)]"
              >
                <Download size={18} />
                <span>Download Free 14-Day Trial</span>
              </Link>
            )}
            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider px-6 py-4 rounded-sm transition-all"
            >
              <span>View Tier Matrix</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* ═══ FEATURE CATEGORIES GRID ═══ */}
        <section className="space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-wider">
              Core Platform Modules
            </h2>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-500">
              100% Offline First · Encrypted SQLite · Built for Pakistan Industrial Workstations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureCategories.map((cat) => {
              const Icon = cat.icon
              return (
                <div 
                  key={cat.id} 
                  id={cat.id}
                  className="bg-[#0A0D10] border border-white/[0.06] p-6 rounded-sm space-y-5 hover:border-[#C5A059]/40 transition-all group relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-sm ${cat.bg} border ${cat.border} flex items-center justify-center ${cat.color}`}>
                        <Icon size={24} />
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 bg-white/5 border border-white/10 text-slate-400 rounded-sm">
                        {cat.badge}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-black text-white uppercase tracking-wide group-hover:text-[#C5A059] transition-colors">
                        {cat.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        {cat.desc}
                      </p>
                    </div>

                    {/* Screenshot Preview thumbnail */}
                    {cat.image && (
                      <div 
                        onClick={() => setSelectedScreenshot(cat.image)}
                        className="relative h-36 w-full bg-black/40 border border-white/10 rounded-sm overflow-hidden cursor-pointer group/img"
                      >
                        <img 
                          src={cat.image} 
                          alt={cat.title} 
                          className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 group-hover/img:scale-105 transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                          <span className="text-[9px] font-bold text-[#C5A059] uppercase tracking-wider">
                            🔍 Click to Preview Screenshot
                          </span>
                        </div>
                      </div>
                    )}

                    <ul className="space-y-2.5 pt-2 border-t border-white/[0.04]">
                      {cat.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <Check size={14} className="text-[#C5A059] flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ═══ INTERACTIVE SCREENSHOT GALLERY ═══ */}
        <section className="bg-[#0A0D10] border border-white/[0.06] p-8 sm:p-12 rounded-sm space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#C5A059]">Visual Walkthrough</span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-white">Live Software Interface Showcase</h2>
            <p className="text-xs text-slate-400 max-w-xl mx-auto">
              Real screenshots captured directly from active industrial workstations using Noxis Hub v13.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {softwareShowcaseScreenshots.map((sc, i) => (
              <div 
                key={i}
                onClick={() => setSelectedScreenshot(sc.src)}
                className="bg-[#040608] border border-white/10 rounded-sm overflow-hidden cursor-pointer hover:border-[#C5A059]/50 transition-all group"
              >
                <div className="h-44 overflow-hidden relative">
                  <img 
                    src={sc.src} 
                    alt={sc.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                </div>
                <div className="p-4 space-y-1 bg-[#0D1017]">
                  <h4 className="text-xs font-black uppercase text-white tracking-wider group-hover:text-[#C5A059] transition-colors">
                    {sc.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium leading-normal">
                    {sc.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ TIER FEATURE MATRIX ═══ */}
        <section className="bg-[#0A0D10] border border-white/[0.06] p-8 sm:p-12 rounded-sm space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#C5A059]">Tier Comparison</span>
            <h2 className="text-2xl font-black uppercase text-white">Feature Gate Matrix across Plans</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="p-4 font-bold uppercase text-slate-400">Capability / Feature</th>
                  <th className="p-4 font-bold uppercase text-slate-400 text-center">Free</th>
                  <th className="p-4 font-bold uppercase text-slate-400 text-center">Lite</th>
                  <th className="p-4 font-bold uppercase text-amber-400 text-center">Pro</th>
                  <th className="p-4 font-bold uppercase text-emerald-400 text-center">Elite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {tierComparison.map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.01]">
                    <td className="p-4 font-sans font-medium text-white">{row.feature}</td>
                    <td className="p-4 text-center">
                      {typeof row.free === 'boolean' ? (
                        row.free ? <Check size={16} className="text-emerald-400 mx-auto" /> : <span className="text-slate-600">—</span>
                      ) : <span className="text-slate-300 font-bold">{row.free}</span>}
                    </td>
                    <td className="p-4 text-center">
                      {typeof row.lite === 'boolean' ? (
                        row.lite ? <Check size={16} className="text-emerald-400 mx-auto" /> : <span className="text-slate-600">—</span>
                      ) : <span className="text-slate-300 font-bold">{row.lite}</span>}
                    </td>
                    <td className="p-4 text-center bg-amber-500/[0.02]">
                      {typeof row.pro === 'boolean' ? (
                        row.pro ? <Check size={16} className="text-emerald-400 mx-auto" /> : <span className="text-slate-600">—</span>
                      ) : <span className="text-amber-400 font-bold">{row.pro}</span>}
                    </td>
                    <td className="p-4 text-center bg-emerald-500/[0.02]">
                      {typeof row.elite === 'boolean' ? (
                        row.elite ? <Check size={16} className="text-emerald-400 mx-auto" /> : <span className="text-slate-600">—</span>
                      ) : <span className="text-emerald-400 font-bold">{row.elite}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ═══ BOTTOM CTA ═══ */}
        <section className="bg-gradient-to-r from-[#0D1117] via-[#161B22] to-[#0D1117] border border-[#C5A059]/30 p-12 rounded-sm text-center space-y-6">
          <h2 className="text-3xl font-black uppercase text-white tracking-tight">
            Ready to Deploy Noxis Hub in Your Factory?
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Install in under 5 minutes. Works 100% offline with zero internet dependency.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/download"
              className="inline-flex items-center gap-2 bg-[#C5A059] text-black font-black text-xs uppercase tracking-wider px-8 py-4 rounded-sm hover:brightness-110 transition-all"
            >
              <Download size={16} />
              <span>Download Production Installer</span>
            </Link>
          </div>
        </section>

      </div>

      {/* Screenshot Lightbox Modal */}
      {selectedScreenshot && (
        <div 
          onClick={() => setSelectedScreenshot(null)}
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md p-4 sm:p-8 flex items-center justify-center cursor-pointer animate-in fade-in-0 duration-200"
        >
          <div className="relative max-w-5xl w-full bg-[#0D1017] border border-[#C5A059]/40 rounded-sm p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-bold text-[#C5A059] uppercase tracking-wider">
                High-Resolution Software Interface Screenshot
              </span>
              <button 
                onClick={() => setSelectedScreenshot(null)}
                className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider px-2 py-1 bg-white/5 rounded-sm"
              >
                ✕ Close Preview
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-black/50 rounded-sm p-2">
              <img 
                src={selectedScreenshot} 
                alt="Software Screenshot Preview" 
                className="max-h-[70vh] w-auto object-contain rounded-sm shadow-2xl" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
