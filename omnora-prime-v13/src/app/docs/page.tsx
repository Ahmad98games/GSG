'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ScrollReveal3D } from '@/components/ui/AnimatedComponents'
import { 
  BookOpen, 
  Terminal, 
  KeyRound, 
  Smartphone, 
  Layers, 
  FileText, 
  Zap, 
  HelpCircle,
  ArrowLeft,
  ChevronRight,
  Database,
  ShieldCheck,
  Sparkles,
  Banknote
} from 'lucide-react'
import Footer from "@/components/shell/Footer"

import PublicNavbar from '@/components/shell/PublicNavbar'

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('install')

  const sections = [
    { id: 'install', icon: <Terminal size={14} />, title: '1. Platform Installation & Auto-Start' },
    { id: 'trial', icon: <Zap size={14} />, title: '2. 14-Day Anti-Tamper Trial & Freemium' },
    { id: 'license', icon: <KeyRound size={14} />, title: '3. RSA-2048 & HWID Security' },
    { id: 'sqlite', icon: <Database size={14} />, title: '4. Local SQLite & Boot Delta Sync' },
    { id: 'mobile', icon: <Smartphone size={14} />, title: '5. Mobile Pairing & RBAC Matrix' },
    { id: 'pos', icon: <Zap size={14} />, title: '6. POS & Weighbridge Integration' },
    { id: 'inventory', icon: <Layers size={14} />, title: '7. Inventory & Barcode Config' },
    { id: 'invoices', icon: <FileText size={14} />, title: '8. Invoices & Double-Entry Khata' },
    { id: 'karigar', icon: <Banknote size={14} />, title: '9. Karigar Production & Payroll' },
    { id: 'cctv', icon: <ShieldCheck size={14} />, title: '10. CCTV ONVIF & WebRTC Streams' },
    { id: 'fault-recovery', icon: <HelpCircle size={14} />, title: '11. Power-Cut & Fault Recovery' },
    { id: 'troubleshoot', icon: <Sparkles size={14} />, title: '12. Maintenance & Troubleshooting' },
    { id: 'api', icon: <Terminal size={14} />, title: '13. API Reference & Data Sync' }
  ]

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200
      for (const section of sections) {
        const el = document.getElementById(section.id)
        if (el) {
          const top = el.offsetTop
          const height = el.offsetHeight
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="bg-[#040608] text-[#94A3B8] font-sans min-h-screen selection:bg-[#C5A059]/30 selection:text-white pb-32 relative overflow-hidden">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#C5A059]/[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#00E5FF]/[0.01] rounded-full blur-[120px]" />
      </div>

      {/* ═══ HEADER NAVIGATION ═══ */}
      <PublicNavbar />

      {/* ═══ DOCS LAYOUT ═══ */}
      <div className="max-w-7xl mx-auto px-6 pt-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left Sidebar Navigation - sticky */}
          <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit space-y-6 z-10">
            <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-[#C5A059]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">System Guidebook</h3>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Detailed setup guidelines for local node operators and industrial workshop managers.
              </p>
              
              {/* Navigation list */}
              <div className="space-y-1 pt-2">
                {sections.map(section => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })
                      setActiveSection(section.id)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all border ${
                      activeSection === section.id
                        ? 'bg-[#C5A059]/10 border-[#C5A059]/25 text-white shadow-[0_0_15px_rgba(197,160,89,0.03)]'
                        : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/[0.01]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {section.icon}
                      <span>{section.title.split('. ')[1]}</span>
                    </div>
                    <ChevronRight size={12} className={`transform transition-transform ${activeSection === section.id ? 'translate-x-0.5 text-[#C5A059]' : 'opacity-20'}`} />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Server Info Panel */}
            <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Security Architecture</h4>
              <div className="space-y-2.5 text-[11px] font-mono font-bold uppercase tracking-wider">
                <div className="flex justify-between border-b border-white/[0.03] pb-1.5">
                  <span className="text-slate-600">ENCRYPTION</span>
                  <span className="text-emerald-400">AES-256 GCM</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.03] pb-1.5">
                  <span className="text-slate-600">LOCAL DATAGRID</span>
                  <span className="text-[#00E5FF]">SQLite-Cipher</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">RTSP SIGNING</span>
                  <span className="text-amber-500">HMAC-SHA256</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-8 space-y-16 z-10">
            
            {/* Header introduction */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 bg-[#C5A059]/10 border border-[#C5A059]/20 px-3 py-1 rounded-full">
                <span className="text-[9px] font-bold text-[#C5A059] uppercase tracking-widest">Platform Manuals</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none uppercase">
                Zero-Configuration <span className="text-[#C5A059]">Onboarding</span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
                Set up, pair, configure local databases, configure security networks, and manage your manufacturing workshop assets securely within ten minutes.
              </p>
            </motion.div>
               {/* 1. INSTALLATION */}
            <motion.section 
              id="install"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">01.</span> Platform Installation & Auto-Start Recovery
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Noxis Hub runs as an offline-first desktop application on Electron 41. It installs into your local Windows profile with zero cloud dependency.
                </p>
                
                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white">Setup Checklist</h4>
                  <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-400 leading-relaxed">
                    <li>Download the setup installer: <span className="font-mono text-white bg-white/5 px-2 py-0.5 rounded-sm">NoxisSetup-v13.exe</span></li>
                    <li>Execute the file to install into <span className="font-mono text-slate-300">%LocalAppData%\\Programs\\noxis-hub</span>.</li>
                    <li>Noxis registers itself in Windows Startup (<span className="font-mono text-emerald-400">openAtLogin: true</span>) automatically.</li>
                    <li>Complete the initial setup wizard (Business profile, Admin PIN, and Hardware COM ports).</li>
                  </ol>

                  <div className="bg-[#00E5FF]/5 border border-[#00E5FF]/10 p-4 text-xs text-[#00E5FF] leading-relaxed rounded-sm space-y-2">
                    <div className="font-bold flex items-center gap-2">
                      <ShieldCheck size={14} />
                      <span>OFFLINE FIRST GUARANTEE</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Noxis requires zero internet connectivity to operate your factory, workshop, or POS counters. All databases, CCTV feeds, and local mobile pairings operate on your internal network.
                    </p>
                  </div>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 2. 14-DAY TRIAL & FREEMIUM */}
            <motion.section 
              id="trial"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">02.</span> 14-Day Anti-Tamper Trial & Freemium Fallback
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Noxis includes a 3-time-source trial engine. When your trial ends, your system automatically transitions to Free Forever mode — zero data deletion.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white">3-Time Source Anti-Tamper Engine</h4>
                  <div className="p-4 bg-[#08090C] border border-white/5 text-[11px] leading-relaxed text-slate-400 rounded-sm font-mono space-y-1.5">
                    <p className="text-[#00E5FF] font-bold">// Evaluation Logic: Maximum Age Wins</p>
                    <p>1. NTP Source: <span className="text-white">time.cloudflare.com (UTC ms on first run)</span></p>
                    <p>2. Monotonic Source: <span className="text-white">process.hrtime.bigint() (30s checkpoint interval)</span></p>
                    <p>3. Filesystem Source: <span className="text-white">SQLite DB birthtime (fs.statSync)</span></p>
                    <p className="text-emerald-400 font-bold mt-2">trialAge = Math.max(ntpAge, monoAge, fsAge)</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="bg-white/5 p-3 rounded-sm border border-white/5 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Active (Days 1–14)</span>
                      <p className="text-[11px] text-slate-400">All Pro/Elite features 100% unlocked. No credit card needed.</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-sm border border-white/5 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Grace (Days 15–17)</span>
                      <p className="text-[11px] text-slate-400">POS counter stays open. Cloud/CCTV/Multi-device locked.</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-sm border border-white/5 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Expired (Day 18+)</span>
                      <p className="text-[11px] text-slate-400">Free Forever tier: POS open, 200 SKUs, 50 Parties, 0 data loss.</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 3. RSA-2048 & HWID SECURITY */}
            <motion.section 
              id="license"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">03.</span> RSA-2048 & Hardware Fingerprinting (HWID)
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Paid licenses are signed offline with an RSA-2048 private key and bound directly to your physical computer hardware.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white">License Format & Activation</h4>
                  <div className="p-3 bg-[#08090C] border border-white/5 font-mono text-xs text-amber-400 rounded-sm">
                    NOXIS-PRO.eyJ2ZXJzaW9uIjoyLCJ... .E-cJzoSJkLIMxY2LeE...
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-xs text-slate-400 leading-relaxed">
                    <li>Go to <strong className="text-white">Settings → License & System</strong> and copy your local Hardware ID (HWID).</li>
                    <li>Paste your key into the activation box and click <strong className="text-white">Activate License</strong>.</li>
                    <li>Verification happens 100% offline via the embedded RSA-2048 public key.</li>
                  </ol>
                  <div className="bg-red-500/5 border border-red-500/10 p-3 text-[11px] text-red-400 rounded-sm">
                    <strong>Revocation Safeguard:</strong> If 3 consecutive HWID mismatches occur (e.g. moving disk to another PC), the system revokes active licensing and falls back to read-only backup mode.
                  </div>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 4. LOCAL SQLITE ARCHITECTURE */}
            <motion.section 
              id="sqlite"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">04.</span> Local SQLite Database & Boot Delta Sync
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Noxis stores all local data in SQLCipher 256-bit encrypted SQLite databases with Write-Ahead Logging (WAL) for sub-millisecond writes.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white">Boot Delta Reconciliation Flow</h4>
                  <div className="p-4 bg-[#08090C] border border-white/5 text-[11px] font-mono text-slate-400 rounded-sm space-y-2">
                    <p className="text-[#00E5FF] font-bold"># Boot Reconciliation Chain</p>
                    <p>1. Hub Boots → Reads <span className="text-white">last_sync_timestamp</span> from store</p>
                    <p>2. Queries Cloud → Fetches rows where <span className="text-white">updated_at &gt; last_sync_timestamp</span></p>
                    <p>3. Local Cache Replaced → React Query invalidated across core modules</p>
                    <p>4. Realtime CDC Started → WebSocket pushes live updates going forward</p>
                  </div>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 5. MOBILE PAIRING & RBAC */}
            <motion.section 
              id="mobile"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">05.</span> Local WiFi Mobile Pairing & RBAC Matrix
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  The handheld mobile companion app pairs over your local WiFi network via WebSocket port 9001 with strict per-role permissions.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white">Mobile Role Permissions Matrix</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-400 border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-white font-bold text-[10px] uppercase tracking-wider">
                          <th className="py-2 px-3">Role</th>
                          <th className="py-2 px-3">Allowed Tables</th>
                          <th className="py-2 px-3">Blocked Tables</th>
                          <th className="py-2 px-3">Khata Write</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                        <tr>
                          <td className="py-2 px-3 text-emerald-400 font-bold">owner</td>
                          <td className="py-2 px-3">All tables</td>
                          <td className="py-2 px-3 text-slate-600">None</td>
                          <td className="py-2 px-3 text-emerald-400 font-bold">YES</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-blue-400 font-bold">manager</td>
                          <td className="py-2 px-3">Invoices, Khata, Production, Attendance, POs</td>
                          <td className="py-2 px-3 text-slate-500">business_users</td>
                          <td className="py-2 px-3 text-emerald-400 font-bold">YES</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-amber-400 font-bold">accountant</td>
                          <td className="py-2 px-3">Invoices, Ledgers, Parties, Payments</td>
                          <td className="py-2 px-3 text-slate-500">Attendance, Karigars</td>
                          <td className="py-2 px-3 text-emerald-400 font-bold">YES</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-purple-400 font-bold">supervisor</td>
                          <td className="py-2 px-3">Attendance, Production, Peshgi</td>
                          <td className="py-2 px-3 text-slate-500">Ledgers, Invoices</td>
                          <td className="py-2 px-3 text-red-400 font-bold">NO</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-slate-300 font-bold">cashier</td>
                          <td className="py-2 px-3">Invoices, Items, Parties, Payments</td>
                          <td className="py-2 px-3 text-slate-500">Ledgers, POs</td>
                          <td className="py-2 px-3 text-red-400 font-bold">NO</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 6. POS & WEIGHBRIDGE */}
            <motion.section 
              id="pos"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">06.</span> Point of Sale (POS) & Weighbridge Integration
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  High-speed checkout interface with RS232 weighbridge COM port reading, barcode scanning, split payments, and thermal printing.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white">POS Keyboard Shortcuts & Operation</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white/5 p-3 rounded-sm border border-white/5">
                      <span className="font-mono text-amber-400 font-bold">F2</span>
                      <p className="text-slate-400 text-[11px] mt-1">Search SKU / Barcode</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-sm border border-white/5">
                      <span className="font-mono text-amber-400 font-bold">F4</span>
                      <p className="text-slate-400 text-[11px] mt-1">Apply Line Discount</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-sm border border-white/5">
                      <span className="font-mono text-amber-400 font-bold">F8</span>
                      <p className="text-slate-400 text-[11px] mt-1">Pay & Print Receipt</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-sm border border-white/5">
                      <span className="font-mono text-amber-400 font-bold">ESC</span>
                      <p className="text-slate-400 text-[11px] mt-1">Cancel / Clear Cart</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 7. INVENTORY & BARCODING */}
            <motion.section 
              id="inventory"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">07.</span> Inventory, SKU Tracking & Barcodes
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Manage raw materials, fabric grades, finished goods, and chemical batches with barcode printing and reorder alerts.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                  <ul className="list-disc pl-5 space-y-2 text-xs text-slate-400 leading-relaxed">
                    <li><strong className="text-white">Auto Barcode Generation:</strong> Generates standard Code128 / QR codes for printable label sheets.</li>
                    <li><strong className="text-white">Stock Warnings:</strong> Visual amber warnings when item quantity drops below safety reorder threshold.</li>
                    <li><strong className="text-white">Batch & Expiry:</strong> Track perishable or batch-bound stock with automated expiration alerts.</li>
                  </ul>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 8. INVOICES & KHATA */}
            <motion.section 
              id="invoices"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">08.</span> Invoicing & Double-Entry Khata Ledgers
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Create professional print invoices while automatic double-entry khata ledgers reconcile balances in real-time.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Every invoice issued automatically posts debit and credit entries mapped to customer accounts, instantly updating receivable balances locally and reflecting inside printable PDFs.
                  </p>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 9. KARIGAR PRODUCTION & PAYROLL */}
            <motion.section 
              id="karigar"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">09.</span> Karigar Production, Attendance & Payroll
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Track piece-rate production output, daily attendance logs, worker cash advances (Peshgi), and payout slips.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6 font-mono text-xs text-slate-400">
                  <p className="text-emerald-400 font-bold">// Payout Formula</p>
                  <p className="bg-[#08090C] p-3 border border-white/5 rounded-sm">
                    Net Payout = (Completed Units × Piece Rate) + Overtime Allowance - Peshgi Deductions
                  </p>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 10. CCTV ONVIF */}
            <motion.section 
              id="cctv"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">10.</span> CCTV ONVIF Discovery & WebRTC Streams
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Auto-discover IP cameras via ONVIF WS-Discovery and render ultra-low-latency streams powered by embedded MediaMTX engine.
                </p>
              </ScrollReveal3D>
            </motion.section>

            {/* 11. FAULT RECOVERY */}
            <motion.section 
              id="fault-recovery"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">11.</span> Power-Cut & Fault Recovery Protocol
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Designed for industrial environments with frequent power outages. State is saved continuously.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-3 ml-6 text-xs text-slate-400">
                  <p>1. <strong className="text-white">Auto Draft Save:</strong> All active entry forms save draft snapshots every 5 seconds.</p>
                  <p>2. <strong className="text-white">Ungraceful Exit Detection:</strong> Boot sequence checks <span className="font-mono text-amber-400">exit_flag</span>. If power cut, displays recovery banner.</p>
                  <p>3. <strong className="text-white">Windows Auto-Boot:</strong> Power restored → Windows boots → Noxis auto-opens → Session resumes.</p>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 12. TROUBLESHOOTING */}
            <motion.section 
              id="troubleshoot"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">12.</span> System Maintenance & Log Inspection
                </h2>
                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-3 ml-6 font-mono text-xs text-slate-400">
                  <p className="text-white font-bold">// Diagnostic Log File Locations</p>
                  <p>Startup Log: <span className="text-amber-400">%AppData%\\noxis-hub\\startup.log</span></p>
                  <p>Server Errors: <span className="text-red-400">%AppData%\\noxis-hub\\server-stderr.log</span></p>
                  <p>SQLite Data: <span className="text-emerald-400">%AppData%\\noxis-hub\\NOXIS-local.db</span></p>
                </div>
              </ScrollReveal3D>
            </motion.section>

          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@700&display=swap');
        .font-sans { font-family: 'Outfit', sans-serif; }
        .font-mono { font-family: 'JetBrains+Mono', monospace; }
        body { background-color: #040608; }
      `}</style>
    </div>
  )
}
