'use client'

import React, { useState, useEffect } from 'react'
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
    { id: 'install', icon: <Terminal size={14} />, title: '1. Easy Setup & Instant Launch' },
    { id: 'trial', icon: <Zap size={14} />, title: '2. 14-Day Full Access & Free Mode' },
    { id: 'license', icon: <KeyRound size={14} />, title: '3. Machine Security & Lifetime License' },
    { id: 'sqlite', icon: <Database size={14} />, title: '4. 100% Offline Database & Auto Sync' },
    { id: 'mobile', icon: <Smartphone size={14} />, title: '5. Mobile App & Staff Permissions' },
    { id: 'pos', icon: <Zap size={14} />, title: '6. Fast Billing & Weighbridge Scale' },
    { id: 'inventory', icon: <Layers size={14} />, title: '7. Stock, Fabric Rolls & Barcodes' },
    { id: 'invoices', icon: <FileText size={14} />, title: '8. Invoicing & Automatic Khata' },
    { id: 'karigar', icon: <Banknote size={14} />, title: '9. Karigar Work, Attendance & Peshgi' },
    { id: 'cctv', icon: <ShieldCheck size={14} />, title: '10. Factory CCTV & Live Camera Feeds' },
    { id: 'fault-recovery', icon: <HelpCircle size={14} />, title: '11. Load-Shedding & Power Cut Protection' },
    { id: 'troubleshoot', icon: <Sparkles size={14} />, title: '12. System Health & Quick Help' }
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
    <div className="bg-[#030712] text-slate-300 font-sans min-h-screen selection:bg-[#08EBF6]/30 selection:text-white pb-32 relative overflow-hidden">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#08EBF6]/[0.04] rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#5FA5FA]/[0.04] rounded-full blur-[140px]" />
      </div>

      <PublicNavbar />

      <div className="max-w-7xl mx-auto px-6 pt-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left Sidebar */}
          <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit space-y-6 z-10">
            <div className="bg-[#0B0F17] border border-[#08EBF6]/30 p-6 rounded-md space-y-4 shadow-[0_0_25px_rgba(8,235,246,0.08)]">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-[#08EBF6]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">Factory Owner's Manual</h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Step-by-step operating guide designed for factory owners, shop managers, and accounting staff.
              </p>
              
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

            {/* Quick Security Panel */}
            <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Business Protection</h4>
              <div className="space-y-2.5 text-[11px] font-medium uppercase tracking-wider">
                <div className="flex justify-between border-b border-white/[0.03] pb-1.5">
                  <span className="text-slate-500">Data Privacy</span>
                  <span className="text-emerald-400 font-bold">100% On-Premise</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.03] pb-1.5">
                  <span className="text-slate-500">Internet Needed</span>
                  <span className="text-[#00E5FF] font-bold">Zero (Works Offline)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Load-Shedding Safe</span>
                  <span className="text-amber-400 font-bold">Continuous Auto-Save</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-8 space-y-16 z-10">
            
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 bg-[#C5A059]/10 border border-[#C5A059]/20 px-3 py-1 rounded-full">
                <span className="text-[9px] font-bold text-[#C5A059] uppercase tracking-widest">Business Guidebook</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none uppercase">
                Complete Setup <span className="text-[#C5A059]">Manual</span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
                Everything you need to set up your billing counters, track your workers, secure your khata ledgers, and manage your textile production seamlessly.
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
                  <span className="text-[#C5A059] font-mono text-base">01.</span> Easy Installation & Quick Start
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Noxis Hub installs right onto your office computer like any standard program. It requires zero cloud subscription to run your daily counter.
                </p>
                
                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white">4-Step Setup Process</h4>
                  <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-400 leading-relaxed">
                    <li>Download and run the installer file: <span className="text-white font-semibold">NoxisSetup.exe</span></li>
                    <li>Wait for the automatic setup to complete (usually under 30 seconds).</li>
                    <li>Noxis starts automatically whenever you turn on your computer.</li>
                    <li>Enter your business name, set an Admin password, and you are ready to bill.</li>
                  </ol>

                  <div className="bg-[#00E5FF]/5 border border-[#00E5FF]/10 p-4 text-xs text-[#00E5FF] leading-relaxed rounded-sm space-y-2">
                    <div className="font-bold flex items-center gap-2">
                      <ShieldCheck size={14} />
                      <span>NO INTERNET CONNECTION REQUIRED</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Your factory keeps working even if your broadband cable is cut. All billing, khata ledgers, printing, and security cameras operate entirely inside your shop or mill.
                    </p>
                  </div>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 2. TRIAL */}
            <motion.section 
              id="trial"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">02.</span> 14-Day Free Trial & Permanent Free Mode
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Experience every feature without paying upfront. Even if your trial finishes, your sales counter never stops and your data is never locked.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white/5 p-4 rounded-sm border border-white/5 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Days 1 to 14 (Trial)</span>
                      <p className="text-xs text-white font-semibold">All Features Unlocked</p>
                      <p className="text-[11px] text-slate-400">Unlimited items, mobile apps, multi-branch, and CCTV feeds enabled.</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-sm border border-white/5 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Days 15 to 17 (Grace Period)</span>
                      <p className="text-xs text-white font-semibold">Counter Stays Open</p>
                      <p className="text-[11px] text-slate-400">Your cashier can still create bills and print receipts while you arrange license activation.</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-sm border border-white/5 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Day 18+ (Free Forever)</span>
                      <p className="text-xs text-white font-semibold">Zero Data Loss</p>
                      <p className="text-[11px] text-slate-400">Standard billing stays open forever for up to 200 items and 50 parties with no fees.</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 3. LICENSE */}
            <motion.section 
              id="license"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">03.</span> Machine License & Security Lock
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Each paid license is tied to your physical computer to prevent unauthorized copying and ensure zero monthly surprise fees.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                  <ol className="list-decimal list-inside space-y-2 text-xs text-slate-400 leading-relaxed">
                    <li>Open <strong className="text-white">Settings → License & System</strong> and copy your Machine ID.</li>
                    <li>Send your Machine ID to our support team to receive your unique key.</li>
                    <li>Paste the key into the activation box and click <strong className="text-white">Activate</strong>.</li>
                  </ol>
                  <p className="text-[11px] text-slate-400 bg-white/5 p-3 rounded-sm border border-white/5">
                    <strong>Note:</strong> Activation works entirely offline. You do not need to connect your office machine to the internet to verify your license.
                  </p>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 4. SQLITE */}
            <motion.section 
              id="sqlite"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">04.</span> Local Data Ownership & Background Cloud Backup
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Your business records live on your local hard drive. Nobody outside your office can see your profit margins or customer prices.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-3 ml-6 text-xs text-slate-400 leading-relaxed">
                  <p>• <strong className="text-white">Instant Response:</strong> Counter bills and stock searches update in milliseconds without relying on slow web pages.</p>
                  <p>• <strong className="text-white">Automatic Cloud Sync:</strong> Whenever an internet connection is available, your bills back up quietly in the background without slowing down your computer.</p>
                  <p>• <strong className="text-white">Total Privacy:</strong> Financial records are encrypted locally so unauthorized staff cannot copy raw files.</p>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 5. MOBILE APP */}
            <motion.section 
              id="mobile"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">05.</span> Mobile Staff App & Access Control
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Connect your phone over the shop’s local Wi-Fi. Control strictly what your cashier, accountant, or floor supervisor is allowed to see.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-400 border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-white font-bold text-[10px] uppercase tracking-wider">
                          <th className="py-2.5 px-3">Staff Role</th>
                          <th className="py-2.5 px-3">Allowed Access</th>
                          <th className="py-2.5 px-3">Protected / Hidden</th>
                          <th className="py-2.5 px-3">Edit Ledgers?</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-[11px]">
                        <tr>
                          <td className="py-2.5 px-3 text-emerald-400 font-bold uppercase">Owner (Seth)</td>
                          <td className="py-2.5 px-3">Complete System, Profits, Reports</td>
                          <td className="py-2.5 px-3 text-slate-600">None (Full Access)</td>
                          <td className="py-2.5 px-3 text-emerald-400 font-bold">YES</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 text-blue-400 font-bold uppercase">Manager</td>
                          <td className="py-2.5 px-3">Billing, Khata, Orders, Attendance</td>
                          <td className="py-2.5 px-3 text-slate-500">Owner User Management</td>
                          <td className="py-2.5 px-3 text-emerald-400 font-bold">YES</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 text-amber-400 font-bold uppercase">Accountant</td>
                          <td className="py-2.5 px-3">Invoices, Party Balances, Payments</td>
                          <td className="py-2.5 px-3 text-slate-500">Worker Attendance & Factory Floor</td>
                          <td className="py-2.5 px-3 text-emerald-400 font-bold">YES</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 text-purple-400 font-bold uppercase">Supervisor</td>
                          <td className="py-2.5 px-3">Worker Attendance, Daily Output, Peshgi</td>
                          <td className="py-2.5 px-3 text-slate-500">Cash Khata & Invoices (Hidden)</td>
                          <td className="py-2.5 px-3 text-red-400 font-bold">NO</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 text-slate-300 font-bold uppercase">Cashier</td>
                          <td className="py-2.5 px-3">Counter Billing & Cash Receipts</td>
                          <td className="py-2.5 px-3 text-slate-500">Party Ledgers & Purchase Costs (Hidden)</td>
                          <td className="py-2.5 px-3 text-red-400 font-bold">NO</td>
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
                  <span className="text-[#C5A059] font-mono text-base">06.</span> High-Speed Counter Billing & Scale Weight Integration
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Built for rapid counter sales. Connect your barcode scanner, thermal receipt printer, and electronic weighing scale directly.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                  <div className="border border-white/10 rounded-sm overflow-hidden bg-black/40">
                    <img 
                      src="/software-images/pos.png" 
                      alt="Noxis POS Counter Interface" 
                      className="w-full h-auto object-cover max-h-80"
                    />
                    <div className="p-2.5 bg-[#08090C] border-t border-white/10 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                      <span>FIGURE 6.1 — Noxis Counter Sales Screen</span>
                      <span className="text-[#C5A059] font-bold">Fast Keyboard Workflow</span>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold uppercase tracking-widest text-white pt-2">One-Touch Keyboard Shortcuts</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white/5 p-3 rounded-sm border border-white/5">
                      <span className="font-mono text-amber-400 font-bold">F2</span>
                      <p className="text-slate-400 text-[11px] mt-1">Search Item / Scan Barcode</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-sm border border-white/5">
                      <span className="font-mono text-amber-400 font-bold">F4</span>
                      <p className="text-slate-400 text-[11px] mt-1">Apply Discount</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-sm border border-white/5">
                      <span className="font-mono text-amber-400 font-bold">F8</span>
                      <p className="text-slate-400 text-[11px] mt-1">Complete Sale & Print Receipt</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-sm border border-white/5">
                      <span className="font-mono text-amber-400 font-bold">ESC</span>
                      <p className="text-slate-400 text-[11px] mt-1">Clear Cart / New Customer</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 7. INVENTORY */}
            <motion.section 
              id="inventory"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">07.</span> Inventory, Fabric Rolls & Stock Alerts
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Track yarn bags, raw fabric rolls (thaan), ready stock, and chemicals with automated low-stock warnings.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-3 ml-6 text-xs text-slate-400 leading-relaxed">
                  <p>• <strong className="text-white">Printable Labels:</strong> Generate and print barcode stickers for each thaan, roll, or package.</p>
                  <p>• <strong className="text-white">Low Stock Warnings:</strong> The system automatically highlights items that are running out so you can reorder in advance.</p>
                  <p>• <strong className="text-white">Zero Mismatches:</strong> Every piece sold updates your warehouse stock instantaneously.</p>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 8. INVOICES */}
            <motion.section 
              id="invoices"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">08.</span> Professional Bills & Automatic Party Khata
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  No need for manual ledger books. Every invoice updates the customer's outstanding balance automatically.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-3 ml-6 text-xs text-slate-400 leading-relaxed">
                  <p>• <strong className="text-white">Automatic Ledger Posting:</strong> Whenever you save a bill, the customer's previous balance and new total are reconciled instantly.</p>
                  <p>• <strong className="text-white">WhatsApp & PDF Receipts:</strong> Generate clean invoice printouts or send balance statements straight to parties.</p>
                  <p>• <strong className="text-white">Fraud Protection:</strong> Locked records ensure previous transactions cannot be secretly deleted without owner authorization.</p>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 9. KARIGAR */}
            <motion.section 
              id="karigar"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">09.</span> Karigar Management, Attendance & Peshgi
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Manage piece-rate production, worker daily attendance, salary slips, and cash advances (peshgi) with zero disputes.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                  <div className="border border-white/10 rounded-sm overflow-hidden bg-black/40">
                    <img 
                      src="/software-images/register karigar.png" 
                      alt="Karigar Registration & Peshgi Ledger" 
                      className="w-full h-auto object-cover max-h-72"
                    />
                    <div className="p-2.5 bg-[#08090C] border-t border-white/10 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                      <span>FIGURE 9.1 — Karigar Work Records & Advance Cash Tracker</span>
                      <span className="text-[#60A5FA] font-bold">Dispute-Free Payroll</span>
                    </div>
                  </div>

                  <div className="bg-[#08090C] p-4 border border-white/5 rounded-sm space-y-1 text-xs">
                    <p className="text-emerald-400 font-bold">Automated Weekly Salary Calculation:</p>
                    <p className="text-slate-300">
                      Final Payout = (Completed Suits/Pieces × Agreed Rate) + Overtime − Deducted Peshgi Advances
                    </p>
                  </div>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 10. CCTV */}
            <motion.section 
              id="cctv"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">06.</span> CCTV Surveillance Inside Your Billing Screen
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Watch your cash drawer, packing table, or loom machines directly inside Noxis without switching to separate DVR software.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                  <div className="border border-white/10 rounded-sm overflow-hidden bg-black/40">
                    <img 
                      src="/software-images/cctv.png" 
                      alt="CCTV Live Camera Grid" 
                      className="w-full h-auto object-cover max-h-72"
                    />
                    <div className="p-2.5 bg-[#08090C] border-t border-white/10 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                      <span>FIGURE 10.1 — Live Counter & Floor Camera Monitoring</span>
                      <span className="text-emerald-400 font-bold">Auto-Detects Local Cameras</span>
                    </div>
                  </div>
                </div>
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
                  <span className="text-[#C5A059] font-mono text-base">11.</span> Load-Shedding & Power Cut Protection
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Engineered specifically for Pakistani industrial areas with unscheduled power outages.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-3 ml-6 text-xs text-slate-400">
                  <p>1. <strong className="text-white">5-Second Auto Draft:</strong> Bills in progress are saved automatically every few seconds so counter staff never lose their typed lines.</p>
                  <p>2. <strong className="text-white">Sudden Shutdown Recovery:</strong> If the generator fails or the power cuts abruptly, the software recovers your open screen upon reboot.</p>
                  <p>3. <strong className="text-white">Auto-Restart with Windows:</strong> When electricity returns, Noxis launches itself immediately so your staff can resume work.</p>
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
                  <span className="text-[#C5A059] font-mono text-base">12.</span> Maintenance & System Help
                </h2>
                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-3 ml-6 text-xs text-slate-400 leading-relaxed">
                  <p className="text-white font-bold">Standard Diagnostic Checks:</p>
                  <p>• <strong className="text-white">Daily Backups:</strong> Use the one-click backup button in Settings to save a copy of your records to a USB thumb drive.</p>
                  <p>• <strong className="text-white">Direct Support:</strong> If any error banner appears, share the on-screen error code with our support team on WhatsApp for prompt resolution.</p>
                </div>
              </ScrollReveal3D>
            </motion.section>

          </div>
        </div>
      </div>

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