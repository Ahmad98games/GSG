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

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('install')

  const sections = [
    { id: 'install', icon: <Terminal size={14} />, title: '1. Platform Installation' },
    { id: 'license', icon: <KeyRound size={14} />, title: '2. Cryptographic Activation' },
    { id: 'sqlite', icon: <Database size={14} />, title: '3. Local SQLite Architecture' },
    { id: 'mobile', icon: <Smartphone size={14} />, title: '4. Local WiFi Phone Pairing' },
    { id: 'inventory', icon: <Layers size={14} />, title: '5. Barcode & Inventory Config' },
    { id: 'invoices', icon: <FileText size={14} />, title: '6. Ledger & Invoicing Setup' },
    { id: 'data-safety', icon: <ShieldCheck size={14} />, title: '7. Data Safety Protocol' },
    { id: 'quickentry', icon: <Zap size={14} />, title: '8. Floor Quick Entry Console' },
    { id: 'troubleshoot', icon: <HelpCircle size={14} />, title: '9. Regional Troubleshooting' },
    { id: 'intelligence', icon: <Sparkles size={14} />, title: '10. Predictive Intelligence' },
    { id: 'finance', icon: <Banknote size={14} />, title: '11. Credit Scoring & Peshgi' },
    { id: 'api-worker', icon: <KeyRound size={14} />, title: '12. Digital Worker IDs & APIs' }
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#040608]/85 backdrop-blur-xl border-b border-white/[0.04] py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-8 h-8 flex items-center justify-center bg-white/5 group-hover:bg-[#C5A059]/10 border border-white/10 group-hover:border-[#C5A059]/30 rounded-sm transition-all shadow-2xl">
              <img
                src="/logos/noxis.png"
                alt="Noxis Logo"
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-extrabold tracking-wider leading-none text-sm">NOXIS</span>
              <span className="text-[8px] text-gray-500 font-mono tracking-widest uppercase mt-0.5">Core Documentation</span>
            </div>
          </Link>

          <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white flex items-center space-x-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back Home</span>
          </Link>
        </div>
      </nav>

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
                  <span className="text-[#C5A059] font-mono text-base">01.</span> Platform Installation
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  The Noxis Hub is engineered as a highly optimized desktop application. Download and execute the binary directly to initialize the local node.
                </p>
                
                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white">Setup Checklist</h4>
                  <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-400 leading-relaxed">
                    <li>Download the stable setup installer: <span className="font-mono text-white bg-white/5 px-2 py-0.5 rounded-sm">NoxisSetup.exe</span></li>
                    <li>Double-click the setup file to trigger local installation script.</li>
                    <li>If prompted with Windows Defender SmartScreen filters, click <strong className="text-white">"More Info"</strong> followed by <strong className="text-white">"Run Anyway"</strong>.</li>
                    <li>Complete the installation wizard. Noxis Hub boots automatically on completion.</li>
                  </ol>

                  <div className="bg-[#00E5FF]/5 border border-[#00E5FF]/10 p-4 text-xs text-[#00E5FF] leading-relaxed rounded-sm space-y-2">
                    <div className="font-bold flex items-center gap-2">
                      <ShieldCheck size={14} />
                      <span>CODE SIGNING NOTE</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Because Noxis Hub operates entirely localized and offline on standalone workstation environments, Windows Defender SmartScreen flags the executable as unrecognized simply due to the absence of active web certificate signing. This warning is safe to bypass.
                    </p>
                  </div>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 2. CRYPTOGRAPHIC ACTIVATION */}
            <motion.section 
              id="license"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">02.</span> Cryptographic License Activation
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  To guarantee zero external tracking while retaining offline licensing control, activation takes place upon the initial application startup.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                  <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-400 leading-relaxed">
                    <li>Confirm that your workstation has active internet access for this licensing step only.</li>
                    <li>Enter your acquired unique license key inside the primary entry terminal: <span className="font-mono text-white bg-white/5 px-2 py-0.5 rounded-sm">XXXX-XXXX-XXXX-XXXX</span></li>
                    <li>Click the activation button. The local client syncs keys directly with verified registration servers.</li>
                    <li>Upon completion, the application goes permanently offline. Your verified license states are saved in secure local blocks.</li>
                  </ol>
                  <div className="bg-red-500/5 border border-red-500/10 p-4 text-xs text-red-400 leading-relaxed rounded-sm">
                    <strong>Retention Directive:</strong> Your unique cryptographic activation key also acts as the recovery key for your localized SQLite database block. Store it securely in a physical format.
                  </div>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 3. LOCAL SQLITE ARCHITECTURE */}
            <motion.section 
              id="sqlite"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">03.</span> Local SQLite Database & Sync
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Noxis Hub operates an offline-first data fabric. All active data logs are replicated between a highly optimized local database block and the cloud.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 font-mono text-xs ml-6">
                  <h4 className="font-sans font-bold uppercase tracking-widest text-white text-[10px] mb-2">Technical Specifications</h4>
                  <div className="p-4 bg-[#08090C] border border-white/5 text-slate-400 space-y-2 rounded-sm font-bold">
                    <p className="text-[#00E5FF] font-mono font-bold"># SQLite Local Transaction Logging</p>
                    <p>Database: <span className="text-white">SQLite Multiple-Ciphers v12.9</span></p>
                    <p>Encryption: <span className="text-white">AES-256 Bit block ciphering</span></p>
                    <p>Replicator Engine: <span className="text-white">Dynamic WAL-sync and transactional backlogs</span></p>
                    <p className="text-slate-600 mt-2 font-sans font-medium text-[11px] uppercase tracking-wider">Reconciles automatically in the background when network changes are triggered.</p>
                  </div>
                  <p className="font-sans text-[11px] text-slate-500 leading-relaxed font-medium">
                    When internet connections are down, transactions are securely accumulated inside an offline log stack. On re-establishing external telemetry, the queue replicates blocks to the cloud via Supabase, resolving potential duplicate items dynamically.
                  </p>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 4. LOCAL WIFI PHONE PAIRING */}
            <motion.section 
              id="mobile"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">04.</span> Local WiFi Pairing (Android Application)
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  The handheld Android companion app hooks directly into the PC server using localized networks, completely bypassing the cloud.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                  <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-400 leading-relaxed">
                    <li>Ensure your workstation PC and the Android device are connected to the <strong className="text-white">same local WiFi router/access point</strong>.</li>
                    <li>Download the companion Android APK directly from the download area.</li>
                    <li>Perform the installation on the phone (allow installation from unknown local sources).</li>
                    <li>On the PC Hub, navigate to the <strong className="text-white">Pairing Console</strong>. A local system pairing QR Code is rendered.</li>
                    <li>Open the Android application and tap <strong className="text-white">"Scan Node QR"</strong>. Scan the QR code rendered on the PC.</li>
                    <li>Handheld devices are successfully paired and can immediately submit attendance, payment entries, and inventory levels.</li>
                  </ol>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 5. BARCODE & INVENTORY CONFIG */}
            <motion.section 
              id="inventory"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">05.</span> Barcode Setup & Inventory Configurations
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Input and catalog raw fabric grades, chemical batches, or manufactured assets in high-speed scanning systems.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Head to the main <strong className="text-white">Inventory Console</strong>. Under adding new product nodes, you can either auto-generate standard barcode keys or use physical barcode readers to scan code sequences directly into the system.
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-xs text-slate-400 leading-relaxed">
                    <li><strong className="text-white">Category Tags:</strong> Map units to raw materials, fabrics, or accessories.</li>
                    <li><strong className="text-white">Reorder Safety Limits:</strong> Define safe thresholds that trigger automatic visual stock warnings.</li>
                    <li><strong className="text-white">Piece Weights:</strong> Record baseline weights (kilograms or yards) to feed local mandi calculation engines.</li>
                  </ul>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 6. LEDGER & INVOICING SETUP */}
            <motion.section 
              id="invoices"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">06.</span> Automatic Double-Entry Ledger & Invoices
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Create professional print invoices while double-entry khata ledgers keep balances reconciled in real-time.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Every bill issued automatically triggers debit/credit entries mapped to the designated customer accounts. In the event of offline states, these balances update locally and reflect inside printable PDFs instantly.
                  </p>
                  <div className="p-4 bg-[#08090C] border border-white/5 text-[11px] leading-relaxed text-slate-400 rounded-sm font-mono font-bold">
                    <span className="text-[#00E5FF] block mb-2">// Automatic Khata Journal Sync Example:</span>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-bold text-white">DEBIT:</p>
                        <p>Receivables Ledger — PKR 84,500</p>
                      </div>
                      <div>
                        <p className="font-bold text-[#C5A059]">CREDIT:</p>
                        <p>Fabric Stock Sales — PKR 84,500</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* Section 7: Data safety */}
            <motion.section 
              id="data-safety"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">07.</span> Your Data is Always Safe
                </h2>
                
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Noxis stores your data in two places: locally on your PC and synced to Supabase cloud when internet is available. This means your data survives even if your PC fails.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                  {[
                    {
                      title: 'Local backup',
                      desc: 'Settings → Backup → Download Backup. Creates an encrypted JSON file you can save anywhere.',
                      icon: '💾',
                    },
                    {
                      title: 'Cloud sync',
                      desc: 'Your data automatically syncs to secure Supabase servers when internet is available.',
                      icon: '☁️',
                    },
                    {
                      title: 'Excel export',
                      desc: 'Export any module (inventory, parties, invoices) to Excel with one click.',
                      icon: '📊',
                    },
                    {
                      title: 'Your data, your control',
                      desc: 'You own your data. You can export it, back it up, or delete it anytime.',
                      icon: '🔑',
                    },
                  ].map(item => (
                    <div key={item.title} className="bg-[#0A0D10] border border-white/[0.04] p-5 rounded-sm">
                      <span className="text-xl">
                        {item.icon}
                      </span>
                      <p className="font-bold text-sm text-white mb-1.5 mt-2.5">
                        {item.title}
                      </p>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 8. FLOOR QUICK ENTRY CONSOLE */}
            <motion.section 
              id="quickentry"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">08.</span> Floor Quick Entry Console
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Designed for high-speed touch screen monitors deployed right next to the workshop floor.
                </p>

                <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The Quick Entry Console provides large touch layouts, allowing supervisors to log production records, attendance parameters, or ledger receipts under 3 seconds.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { title: 'Production Tab', desc: 'Select karigar, enter pieces/weights, tag grades (A, B, C).' },
                      { title: 'Payment Slip', desc: 'Accept customer peshgi, logs payments to JazzCash/EasyPaisa.' },
                      { title: 'Attendance Slip', desc: 'Mark absences, present states, or perform bulk check-ins.' }
                    ].map(tab => (
                      <div key={tab.title} className="p-4 bg-white/[0.02] border border-white/5 rounded-sm">
                        <h4 className="text-xs font-bold text-white mb-2">{tab.title}</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">{tab.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 9. REGIONAL TROUBLESHOOTING */}
            <motion.section 
              id="troubleshoot"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-[#C5A059] font-mono text-base">09.</span> Troubleshooting & Diagnostics
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                  Solutions to the most common local networking and system validation challenges.
                </p>

                <div className="space-y-4 ml-6">
                  {[
                    {
                      q: 'Workstation activation fails continuously',
                      a: 'Confirm that your device is actively connected to the internet during key verification. Ensure that characters are input exactly without spaces. If issues persist, verify that security filters or anti-virus apps are not blocking system background API connections.'
                    },
                    {
                      q: 'Android paired terminal shows connecting endlessly',
                      a: 'Diagnostics confirm this happens when the Hub workstation PC and phone are partitioned on separate routers or virtual subnets. Verify that both terminals show active connected states to the identical local router IP.'
                    },
                    {
                      q: 'Local backup is not logging correctly',
                      a: 'Go to Settings -> Database. Under the backup path, confirm that your mapped folder directory actually has valid write authorization from the OS system user.'
                    }
                  ].map(faq => (
                    <div key={faq.q} className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-2">
                      <h4 className="text-sm font-bold text-white">{faq.q}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{faq.a}</p>
                    </div>
                  ))}

                  {/* Support Card */}
                  <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-white">Need Regional Technical Support?</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      To meet the fast-paced nature of local mandi and regional textile mills, our technical teams provide immediate real-time solutions via direct WhatsApp or enterprise email logging.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-white/[0.03]">
                      <div>
                        <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest block mb-1">Direct Floor WhatsApp Support</span>
                        <a href="https://wa.me/923264742678" target="_blank" rel="noopener noreferrer" className="text-xs font-mono font-bold text-emerald-400 hover:underline">
                          +92 326 4742678
                        </a>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#00E5FF] font-bold uppercase tracking-widest block mb-1">Enterprise Email Support</span>
                        <a href="mailto:omnorainfo28@gmail.com" className="text-xs font-mono font-bold text-[#00E5FF] hover:underline">
                          omnorainfo28@gmail.com
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 10. PREDICTIVE INTELLIGENCE */}
            <motion.section 
               id="intelligence"
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               viewport={{ once: true, margin: '-100px' }}
               className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                 <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                   <span className="text-[#C5A059] font-mono text-base">10.</span> Predictive Intelligence Telemetry
                 </h2>
                 <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                   The Predictive Intelligence telemetry engine processes dynamic regional signals to empower workshop owners with raw pricing power and profit-margin security.
                 </p>

                 <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-white">Advanced Operations Guide</h4>
                   <ul className="list-disc pl-5 space-y-2 text-xs text-slate-400 leading-relaxed">
                     <li><strong className="text-white">Live Benchmark Tracking:</strong> Computes pieces-rate labor index and mandi output rates across target markets (Pakistan, UAE, Bangladesh, Turkey) using local telemetry.</li>
                     <li><strong className="text-white">Active Reorder Predictions:</strong> Triggers preemptive inventory alerts 4 days prior to a stockout based on moving average usage.</li>
                     <li><strong className="text-white">Margin Analysis & Churn Models:</strong> Performs customer churn assessments via Supabase stored RPC aggregators to highlight at-risk partnerships early.</li>
                   </ul>
                 </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 11. CREDIT SCORING & PESHGI */}
            <motion.section 
               id="finance"
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               viewport={{ once: true, margin: '-100px' }}
               className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                 <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                   <span className="text-[#C5A059] font-mono text-base">11.</span> Embedded Credit Scoring & Peshgi
                 </h2>
                 <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                   Modernize your workshop capital with integrated credit scoring formulas and secure payout structures paired directly with financial institutions.
                 </p>

                 <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-white">Fintech Score Metric Calculations</h4>
                   <div className="p-4 bg-[#08090C] border border-white/5 rounded-sm space-y-2 text-xs text-slate-400 font-mono font-bold">
                     <p className="text-[#00E5FF] font-mono">// Embedded Credit Grading Rubric</p>
                     <p>1. Noxis Ledger History (0-20 pts): Length of active ledger records.</p>
                     <p>2. Transaction Volume (0-35 pts): Cumulative monthly revenue flows.</p>
                     <p>3. Margin Stability (0-25 pts): Standard deviation of profit margins.</p>
                     <p>4. Peshgi Leverage (0-20 pts): Advance-to-wage ratios under 30%.</p>
                     <p className="text-slate-500 mt-2 font-sans font-medium text-[11px] uppercase tracking-wider">Total Grade Scale: <span className="text-[#A3E635]">A (80+ pts)</span> | <span className="text-[#00E5FF]">B (60-79 pts)</span> | <span className="text-[#C5A059]">C (40-59 pts)</span></p>
                   </div>
                   <p className="text-xs text-slate-400 leading-relaxed">
                     Eligible factory owners with Grade A or B rankings gain automated access to direct credit programs and local partner payout channels (JazzCash, EasyPaisa).
                   </p>
                 </div>
              </ScrollReveal3D>
            </motion.section>

            {/* 12. DIGITAL WORKER IDS & APIS */}
            <motion.section 
               id="api-worker"
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               viewport={{ once: true, margin: '-100px' }}
               className="pt-12 border-t border-white/[0.05] scroll-mt-28"
            >
              <ScrollReveal3D className="space-y-6">
                 <h2 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
                   <span className="text-[#C5A059] font-mono text-base">12.</span> Digital Worker Identities & Developer APIs
                 </h2>
                 <p className="text-sm text-slate-400 leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                   Seamlessly bridge physical staff records with cryptographic digital certificates and coordinate inventory sync using open webhook protocols.
                 </p>

                 <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4 ml-6">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-white">API Keys & Worker QR Setup</h4>
                   <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-400 leading-relaxed">
                     <li><strong className="text-white">API Platform:</strong> Create cryptographically generated API keys wrapped with read/write access controls.</li>
                     <li><strong className="text-white">Webhooks:</strong> Hook custom endpoints to receive instant pushes on transaction logs or stock movements.</li>
                     <li><strong className="text-white">Worker Profiles:</strong> Empower floor staff with public QR-enabled performance cards, displaying verified attendance and skill certifications.</li>
                   </ol>
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
