'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
  Banknote,
  Palette,
  Wifi,
  Code,
  Cpu,
  Search,
  Check,
  Copy,
  Printer,
  Scale
} from 'lucide-react'
import Footer from "@/components/shell/Footer"
import PublicNavbar from '@/components/shell/PublicNavbar'

interface SectionItem {
  id: string
  icon: React.ReactNode
  title: string
  category: 'core' | 'features' | 'technical' | 'troubleshoot'
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('install')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSnippet(id)
    setTimeout(() => setCopiedSnippet(null), 2000)
  }

  const sections: SectionItem[] = [
    { id: 'install', icon: <Terminal size={14} />, title: '1. Easy Setup & Instant Launch', category: 'core' },
    { id: 'trial', icon: <Zap size={14} />, title: '2. 7-Day Evaluation & Free Mode', category: 'core' },
    { id: 'license', icon: <KeyRound size={14} />, title: '3. Machine Security & Lifetime License', category: 'core' },
    { id: 'sqlite', icon: <Database size={14} />, title: '4. 100% Offline SQLite WAL Engine', category: 'technical' },
    { id: 'themes', icon: <Palette size={14} />, title: '5. 23 Industrial Themes & Ergonomics', category: 'features' },
    { id: 'lan-sync', icon: <Wifi size={14} />, title: '6. Multi-User LAN Peer Sync & Heartbeat', category: 'technical' },
    { id: 'developer-api', icon: <Code size={14} />, title: '7. Developer REST API v1 & Webhooks', category: 'technical' },
    { id: 'hardware-specs', icon: <Cpu size={14} />, title: '8. Weighbridge, Thermal Printers & Peripherals', category: 'technical' },
    { id: 'mobile', icon: <Smartphone size={14} />, title: '9. Mobile Floor Bridge & Permissions', category: 'features' },
    { id: 'pos', icon: <Zap size={14} />, title: '10. Fast Billing & Weighbridge Scale', category: 'features' },
    { id: 'inventory', icon: <Layers size={14} />, title: '11. Stock, Fabric Rolls & Barcodes', category: 'features' },
    { id: 'invoices', icon: <FileText size={14} />, title: '12. Invoicing & Automatic Khata Ledgers', category: 'features' },
    { id: 'karigar', icon: <Banknote size={14} />, title: '13. Karigar Piece-Rate Wage & Peshgi', category: 'features' },
    { id: 'cctv', icon: <ShieldCheck size={14} />, title: '14. Factory CCTV & Live RTSP Feeds', category: 'features' },
    { id: 'fault-recovery', icon: <HelpCircle size={14} />, title: '15. Load-Shedding & Power Cut Protection', category: 'technical' },
    { id: 'troubleshoot', icon: <Sparkles size={14} />, title: '16. System Health & Diagnostics', category: 'troubleshoot' },
    { id: 'shortcuts-zoom', icon: <Terminal size={14} />, title: '17. Master Shortcuts & Zoom Glitch Fix (Ctrl+0)', category: 'troubleshoot' },
    { id: 'feature-guide', icon: <BookOpen size={14} />, title: '18. Complete Operational User Guide', category: 'core' }
  ]

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections
    const q = searchQuery.toLowerCase()
    return sections.filter(s => s.title.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
  }, [searchQuery, sections])

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 220
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
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [sections])

  return (
    <div className="bg-[#030712] text-slate-300 font-sans min-h-screen selection:bg-[#08EBF6]/30 selection:text-white pb-32 relative">
      <PublicNavbar />

      <div className="max-w-7xl mx-auto px-6 pt-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Sticky Sidebar */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 h-fit space-y-6 z-10">
            <div className="bg-[#0B0F17] border border-white/10 p-5 rounded-lg space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-[#08EBF6]" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white">Engineering Manual</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  v14.0.15
                </span>
              </div>
              
              {/* Quick Search / Filter Input */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter topics (e.g. themes, API, weighbridge, WAL)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#05070B] border border-white/10 rounded-md py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#08EBF6]/50 transition-colors"
                />
              </div>

              {/* Navigation Links */}
              <div className="space-y-0.5 max-h-[58vh] overflow-y-auto pr-1 custom-scrollbar">
                {filteredSections.map(section => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })
                      setActiveSection(section.id)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                      activeSection === section.id
                        ? 'bg-[#C5A059]/15 border border-[#C5A059]/30 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={activeSection === section.id ? 'text-[#C5A059]' : 'text-slate-500'}>
                        {section.icon}
                      </span>
                      <span className="truncate">{section.title}</span>
                    </div>
                    <ChevronRight size={12} className={`shrink-0 transition-transform ${activeSection === section.id ? 'translate-x-0.5 text-[#C5A059]' : 'opacity-20'}`} />
                  </a>
                ))}
                {filteredSections.length === 0 && (
                  <p className="text-xs text-slate-500 p-2 text-center">No matching sections found.</p>
                )}
              </div>
            </div>

            {/* Architectural Trust Panel */}
            <div className="bg-[#0B0F17] border border-white/10 p-5 rounded-lg space-y-3.5 shadow-lg">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">System Specifications</h4>
              <div className="space-y-2 text-[11px] font-mono">
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400 font-sans">Storage Architecture</span>
                  <span className="text-emerald-400 font-bold">100% Local SQLite WAL</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400 font-sans">Supported Themes</span>
                  <span className="text-cyan-400 font-bold">23 Engineered Palettes</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400 font-sans">Multi-User Sync</span>
                  <span className="text-purple-400 font-bold">LAN Heartbeat Mesh</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400 font-sans">External APIs</span>
                  <span className="text-amber-400 font-bold">Bearer REST v1 + HMAC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Cloud Requirement</span>
                  <span className="text-emerald-400 font-bold">Zero (Air-Gapped Ready)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-8 space-y-16 z-10">
            
            {/* Header Title */}
            <div className="space-y-4 border-b border-white/10 pb-8">
              <div className="inline-flex items-center gap-2 bg-[#C5A059]/10 border border-[#C5A059]/30 px-3 py-1 rounded-full text-[10px] font-mono font-bold text-[#C5A059] uppercase tracking-widest">
                Official Engineering Documentation · v14.0.15
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight uppercase">
                Noxis Hub Technical <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#08EBF6] via-[#5FA5FA] to-[#08EBF6]">Reference &amp; Manual</span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
                Comprehensive technical guide for plant managers, system integrators, accountants, and floor supervisors. Covers SQLite WAL database architecture, 23 visual themes, LAN peer synchronization, Developer REST API v1, outbound HMAC webhooks, and industrial RS232 weighbridge scales.
              </p>
            </div>

            {/* 1. INSTALLATION */}
            <section id="install" className="pt-6 scroll-mt-28 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] font-mono text-xs font-bold">01</span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">Easy Installation &amp; Rapid Deployment</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-[#C5A059]/50">
                Noxis Hub installs as a sovereign Windows desktop application running directly on local NVMe/SSD storage. It does not require IIS, Docker, or external cloud containers to run daily operations.
              </p>
              
              <div className="bg-[#0B0F17] border border-white/10 p-5 rounded-lg space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">4-Step Desktop Setup Process</h4>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed font-normal">
                  <li>Download and execute the installer: <code className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono">Noxis Hub Setup 14.0.15.exe</code></li>
                  <li>The single-stream NSIS engine unpacks core runtime libraries in under 30 seconds.</li>
                  <li>Upon initial launch, provide your Business Name and create an encrypted Admin master passphrase.</li>
                  <li>The local SQLite 3 database initializes automatically with power-loss WAL journal journaling.</li>
                </ol>

                <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 text-xs text-cyan-200 rounded-md space-y-1">
                  <div className="font-bold flex items-center gap-2 text-white">
                    <ShieldCheck size={14} className="text-cyan-400" />
                    <span>Windows 11 Smart App Control Bypass</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    For corporate terminals with strict Windows 11 Smart App Control, download <code className="font-mono text-cyan-300">Noxis-Setup-14.0.15.zip</code> containing <code className="font-mono text-cyan-300">Install-Noxis.bat</code>. It unblocks the binary using official Windows PowerShell execution policies without disabling Defender.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. TRIAL */}
            <section id="trial" className="pt-10 border-t border-white/10 scroll-mt-28 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] font-mono text-xs font-bold">02</span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">7-Day Free Evaluation &amp; Permanent Free Mode</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-[#C5A059]/50">
                Evaluate every feature without upfront payments or credit cards. If your 7-day evaluation completes before licensing, your cash counter never locks and customer records are never held hostage.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#0B0F17] p-5 rounded-lg border border-emerald-500/30 space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Days 1–7 (Full Pro Access)</span>
                  <h3 className="text-sm text-white font-bold">Complete Industrial Suite Unlocked</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">Unlimited inventory items, multi-user LAN peer sync, Android floor terminals, RS232 weighbridge capture, and RTSP CCTV live video feeds.</p>
                </div>
                <div className="bg-[#0B0F17] p-5 rounded-lg border border-blue-500/30 space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Day 8+ (Free Forever Fallback)</span>
                  <h3 className="text-sm text-white font-bold">Zero Data Lock &amp; Open Counter</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">Standard retail and wholesale counter billing remains open forever for up to 200 items, 50 parties, thermal slip printing, and offline reports with zero recurring fees.</p>
                </div>
              </div>
            </section>

            {/* 3. LICENSE */}
            <section id="license" className="pt-10 border-t border-white/10 scroll-mt-28 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] font-mono text-xs font-bold">03</span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">Cryptographic Machine Licensing (HWID Tied)</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-[#C5A059]/50">
                Noxis Hub utilizes hardware fingerprinting (CPU ID, motherboard serial, and disk UUID) to generate a unique Hardware Identifier (HWID). Perpetual licenses are cryptographically verified locally without phoning home to remote activation servers.
              </p>

              <div className="bg-[#0B0F17] border border-white/10 p-5 rounded-lg space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white/5 rounded border border-white/5">
                    <span className="text-[#C5A059] font-bold block mb-1">Step 1 — Machine ID</span>
                    <p className="text-slate-400">Open <strong className="text-white">Settings → License</strong> and copy your 16-character machine key.</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded border border-white/5">
                    <span className="text-[#C5A059] font-bold block mb-1">Step 2 — Support Token</span>
                    <p className="text-slate-400">Dispatch your Machine ID to Omnora WhatsApp (+92 326 4742678) to receive your cryptographic license string.</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded border border-white/5">
                    <span className="text-[#C5A059] font-bold block mb-1">Step 3 — Offline Verification</span>
                    <p className="text-slate-400">Paste the token and click Activate. Verification executes offline with zero cloud latency.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. SQLITE WAL ENGINE */}
            <section id="sqlite" className="pt-10 border-t border-white/10 scroll-mt-28 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] font-mono text-xs font-bold">04</span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">100% Offline SQLite Write-Ahead Logging (WAL) Architecture</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-[#C5A059]/50">
                Unlike client-server database architectures that require persistent cloud sockets or background daemon daemons like MySQL, Noxis Hub embeds SQLite 3 compiled with SQLCipher 256-bit AES encryption.
              </p>

              <div className="bg-[#0B0F17] border border-white/10 p-5 rounded-lg space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-white/5 rounded border border-white/5">
                    <h5 className="font-bold text-white mb-1">PRAGMA journal_mode = WAL</h5>
                    <p className="text-slate-400 text-[11px]">Write transactions append to a separate WAL log file, allowing concurrent reader processes on web browsers to query balances without locking the active POS counter.</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded border border-white/5">
                    <h5 className="font-bold text-white mb-1">PRAGMA synchronous = NORMAL</h5>
                    <p className="text-slate-400 text-[11px]">Sync barriers ensure completed ledger transactions flush to non-volatile physical storage prior to returning OK status, guaranteeing zero transaction rollback on unexpected power cut.</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded border border-white/5">
                    <h5 className="font-bold text-white mb-1">Air-Gapped Security</h5>
                    <p className="text-slate-400 text-[11px]">Raw database files are stored locally in the user AppData directory (<code className="text-cyan-300">~/.noxishub/NoxisHub.db</code>), completely shielded from internet scrapers.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. 23 INDUSTRIAL THEMES & VISUAL ERGONOMICS */}
            <section id="themes" className="pt-10 border-t border-white/10 scroll-mt-28 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] font-mono text-xs font-bold">05</span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">23 Purpose-Built Industrial Visual Themes</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-[#C5A059]/50">
                Factory control rooms and warehouse counters face extreme environmental lighting, ranging from direct blinding sun to low-light night shifts. Noxis Hub provides 23 meticulously calibrated visual palettes adhering to WCAG 2.1 AA/AAA contrast ratios.
              </p>

              <div className="bg-[#0B0F17] border border-white/10 p-5 rounded-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Complete Palettes Directory</h4>
                  <span className="text-[11px] text-slate-400 font-mono">Active in Settings → Themes &amp; UI</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300 border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-white font-bold text-[10px] uppercase tracking-wider">
                        <th className="py-2.5 px-3">Theme Name</th>
                        <th className="py-2.5 px-3">Token ID</th>
                        <th className="py-2.5 px-3">Primary Accent</th>
                        <th className="py-2.5 px-3">Financial Accent</th>
                        <th className="py-2.5 px-3">Target Industry / Ergonomic Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-[11px] font-mono">
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" /> Light Slate
                        </td>
                        <td className="py-2 px-3 text-slate-400">light-slate</td>
                        <td className="py-2 px-3 text-[#2563EB]">#2563EB</td>
                        <td className="py-2 px-3 text-[#92400E]">#92400E</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">High-visibility daylight mode for bright, dusty warehouse counters</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" /> Cyber Cyan &amp; Obsidian
                        </td>
                        <td className="py-2 px-3 text-slate-400">electric-slate</td>
                        <td className="py-2 px-3 text-[#06B6D4]">#06B6D4</td>
                        <td className="py-2 px-3 text-[#22D3EE]">#22D3EE</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Default industrial dark mode; ultra-high contrast for low eye strain</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059]" /> Textile Gold
                        </td>
                        <td className="py-2 px-3 text-slate-400">textile-gold</td>
                        <td className="py-2 px-3 text-[#C5A059]">#C5A059</td>
                        <td className="py-2 px-3 text-[#E8C07D]">#E8C07D</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Warm sandstone gold for cloth markets, weaving mills &amp; fabric trade</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" /> Pharma Clean
                        </td>
                        <td className="py-2 px-3 text-slate-400">pharma-clean</td>
                        <td className="py-2 px-3 text-[#0284C7]">#0284C7</td>
                        <td className="py-2 px-3 text-[#38BDF8]">#38BDF8</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Sterile medical blue &amp; white precision for pharmaceutical hubs</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> Logistics Amber
                        </td>
                        <td className="py-2 px-3 text-slate-400">logistics-amber</td>
                        <td className="py-2 px-3 text-[#F59E0B]">#F59E0B</td>
                        <td className="py-2 px-3 text-[#FBBF24]">#FBBF24</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Safety amber for transport depots, weighbridges, and container ports</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#64748B]" /> Carbon Dark
                        </td>
                        <td className="py-2 px-3 text-slate-400">carbon-dark</td>
                        <td className="py-2 px-3 text-[#94A3B8]">#94A3B8</td>
                        <td className="py-2 px-3 text-[#E2E8F0]">#E2E8F0</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Monochrome basalt &amp; pure matte carbon for minimal high-speed input</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" /> Desert Sand
                        </td>
                        <td className="py-2 px-3 text-slate-400">desert-sand</td>
                        <td className="py-2 px-3 text-[#D97706]">#D97706</td>
                        <td className="py-2 px-3 text-[#F59E0B]">#F59E0B</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Terracotta earth &amp; warm dune sand for Middle East commercial hubs</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" /> Midnight Blue
                        </td>
                        <td className="py-2 px-3 text-slate-400">midnight-blue</td>
                        <td className="py-2 px-3 text-[#3B82F6]">#3B82F6</td>
                        <td className="py-2 px-3 text-[#60A5FA]">#60A5FA</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Deep navy for finance, commodity brokers, and corporate offices</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> Emerald Forest
                        </td>
                        <td className="py-2 px-3 text-slate-400">emerald-forest</td>
                        <td className="py-2 px-3 text-[#10B981]">#10B981</td>
                        <td className="py-2 px-3 text-[#34D399]">#34D399</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Agricultural emerald for rice mills, grain silos, and agro-chemicals</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" /> Royal Purple
                        </td>
                        <td className="py-2 px-3 text-slate-400">royal-purple</td>
                        <td className="py-2 px-3 text-[#8B5CF6]">#8B5CF6</td>
                        <td className="py-2 px-3 text-[#A78BFA]">#A78BFA</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Regal amethyst &amp; violet for luxury boutiques, gems &amp; jewelry</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#64748B]" /> Steel Industrial
                        </td>
                        <td className="py-2 px-3 text-slate-400">steel-industrial</td>
                        <td className="py-2 px-3 text-[#94A3B8]">#94A3B8</td>
                        <td className="py-2 px-3 text-[#CBD5E1]">#CBD5E1</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Heavy machinery slate for foundries, steel mills, and pipe manufacturing</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> Crimson Power
                        </td>
                        <td className="py-2 px-3 text-slate-400">crimson-power</td>
                        <td className="py-2 px-3 text-[#EF4444]">#EF4444</td>
                        <td className="py-2 px-3 text-[#F87171]">#F87171</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">High-energy ruby red for automotive manufacturing &amp; heavy plants</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#14B8A6]" /> Ocean Teal
                        </td>
                        <td className="py-2 px-3 text-slate-400">ocean-teal</td>
                        <td className="py-2 px-3 text-[#14B8A6]">#14B8A6</td>
                        <td className="py-2 px-3 text-[#2DD4BF]">#2DD4BF</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Deep sea cyan for chemical processing, fisheries, and bottling lines</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" /> Warm Ivory
                        </td>
                        <td className="py-2 px-3 text-slate-400">warm-ivory</td>
                        <td className="py-2 px-3 text-[#B45309]">#B45309</td>
                        <td className="py-2 px-3 text-[#78350F]">#78350F</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Warm paper aesthetic for legal firms, audit desks, and bookkeepers</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#A3E635]" /> Neon Cyber
                        </td>
                        <td className="py-2 px-3 text-slate-400">neon-cyber</td>
                        <td className="py-2 px-3 text-[#A3E635]">#A3E635</td>
                        <td className="py-2 px-3 text-[#C084FC]">#C084FC</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Electric lime &amp; violet for technology retail and repair counters</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" /> Saffron Bazaar
                        </td>
                        <td className="py-2 px-3 text-slate-400">saffron-bazaar</td>
                        <td className="py-2 px-3 text-[#F97316]">#F97316</td>
                        <td className="py-2 px-3 text-[#FBBF24]">#FBBF24</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Vibrant South Asian spice orange for wholesale Mandi commodity trade</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#FB7185]" /> Rose Gold
                        </td>
                        <td className="py-2 px-3 text-slate-400">rose-gold</td>
                        <td className="py-2 px-3 text-[#FB7185]">#FB7185</td>
                        <td className="py-2 px-3 text-[#FDA4AF]">#FDA4AF</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Brushed metallic rose gold for fashion retail and cosmetic salons</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#E0F2FE]" /> Arctic White
                        </td>
                        <td className="py-2 px-3 text-slate-400">arctic-white</td>
                        <td className="py-2 px-3 text-[#0284C7]">#0284C7</td>
                        <td className="py-2 px-3 text-[#0369A1]">#0369A1</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Pure cold daylight for sterile cleanrooms, diagnostics, and food labs</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" /> Volcanic Ash
                        </td>
                        <td className="py-2 px-3 text-slate-400">volcanic-ash</td>
                        <td className="py-2 px-3 text-[#EA580C]">#EA580C</td>
                        <td className="py-2 px-3 text-[#F97316]">#F97316</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Charcoal basalt with molten orange for brick kilns and mining plants</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" /> Deep Forest
                        </td>
                        <td className="py-2 px-3 text-slate-400">deep-forest</td>
                        <td className="py-2 px-3 text-[#15803D]">#15803D</td>
                        <td className="py-2 px-3 text-[#4ADE80]">#4ADE80</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Natural pine and moss tones for timber yards and paper manufacturing</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]" /> Chrome Silver
                        </td>
                        <td className="py-2 px-3 text-slate-400">chrome-silver</td>
                        <td className="py-2 px-3 text-[#38BDF8]">#38BDF8</td>
                        <td className="py-2 px-3 text-[#E2E8F0]">#E2E8F0</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Precision polished aluminum for CNC tooling and aerospace workshops</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" /> Golden Onyx
                        </td>
                        <td className="py-2 px-3 text-slate-400">golden-onyx</td>
                        <td className="py-2 px-3 text-[#EAB308]">#EAB308</td>
                        <td className="py-2 px-3 text-[#FACC15]">#FACC15</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Bespoke high-contrast gold and deep obsidian for executive dashboards</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" /> Midnight Emerald
                        </td>
                        <td className="py-2 px-3 text-slate-400">midnight-emerald</td>
                        <td className="py-2 px-3 text-[#059669]">#059669</td>
                        <td className="py-2 px-3 text-[#10B981]">#10B981</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">Deep jewel green on pure black for carpet manufacturers &amp; craft guilds</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 6. MULTI-USER LAN PEER SYNC */}
            <section id="lan-sync" className="pt-10 border-t border-white/10 scroll-mt-28 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] font-mono text-xs font-bold">06</span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">Multi-User Local LAN Auto-Sync &amp; Heartbeat Mesh</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-[#C5A059]/50">
                In many factories, 2 to 10 staff members work simultaneously (e.g. 2 counter cashiers on PCs, 1 accountant in the back office, and 3 supervisors on Android floor phones). Noxis Hub connects all terminals over the local office Wi-Fi router with zero external internet required.
              </p>

              <div className="bg-[#0B0F17] border border-white/10 p-5 rounded-lg space-y-4 text-xs text-slate-300">
                <h4 className="font-bold text-white uppercase tracking-wider">How Local LAN Synchronization Operates</h4>
                <div className="space-y-3 font-normal leading-relaxed">
                  <p>1. <strong className="text-white">Master Hub Socket (Port 3000):</strong> The primary PC runs the embedded HTTP &amp; WebSocket server. Client machines point their Chrome or Edge browser to <code className="bg-white/10 px-1.5 py-0.5 rounded text-cyan-300 font-mono">http://&lt;hub-ip&gt;:3000</code>.</p>
                  <p>2. <strong className="text-white">Instant State Invalidation:</strong> When Cashier A commits an invoice or logs a stock receipt, the master PC immediately broadcasts a lightweight mutation pulse over the local router. All open web browsers and desktop terminals invalidate their cache and re-render updated ledgers within &lt;1 millisecond.</p>
                  <p>3. <strong className="text-white">Live Workstation Heartbeat:</strong> The system automatically tracks active operators, station names, IP addresses, and last-seen pings via <code className="bg-white/10 px-1.5 py-0.5 rounded text-cyan-300 font-mono">useWorkstationHeartbeat</code>.</p>
                  <p>4. <strong className="text-white">Total Internet Disconnect Immunity:</strong> If the telecom fiber breaks or broadband goes down, all terminals on the local router continue billing, printing, and synchronizing without interruption.</p>
                </div>
              </div>
            </section>

            {/* 7. DEVELOPER REST API & WEBHOOKS */}
            <section id="developer-api" className="pt-10 border-t border-white/10 scroll-mt-28 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] font-mono text-xs font-bold">07</span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">Developer REST API v1 &amp; HMAC Webhooks Engine</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-[#C5A059]/50">
                Introduced in v14.0.12, Noxis Hub includes a production-grade REST API and outbound webhook engine, allowing Shopify, WooCommerce, custom ERPs, and automated logistics systems to read stock and write invoices directly into the local master database.
              </p>

              <div className="bg-[#0B0F17] border border-white/10 p-5 rounded-lg space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-white tracking-wider">Public REST API Authentication</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Bearer Token Auth</span>
                  </div>
                  <p className="text-xs text-slate-400">Generate high-entropy 64-character tokens under <strong className="text-white">Settings → Developer API &amp; Webhooks</strong>. Pass the key in standard HTTP headers:</p>
                  <div className="relative bg-[#05070B] border border-white/10 p-3 rounded font-mono text-xs text-cyan-300 flex items-center justify-between">
                    <code>Authorization: Bearer nx_live_79a2fc10c9be41d8e8a3...</code>
                    <button 
                      onClick={() => copyToClipboard('Authorization: Bearer nx_live_79a2fc10c9be41d8e8a3...', 'auth')} 
                      className="p-1 hover:text-white transition-colors"
                      title="Copy header"
                    >
                      {copiedSnippet === 'auth' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase text-white tracking-wider">Core Endpoints</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-white/5 rounded border border-white/5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-blue-500 text-black font-mono font-bold text-[10px]">GET</span>
                        <code className="text-xs text-white font-mono font-bold">/api/v1/inventory</code>
                      </div>
                      <p className="text-[11px] text-slate-400">Returns list of SKUs, stock quantities, unit costs, selling rates, categories, and low-stock flags.</p>
                    </div>

                    <div className="p-3 bg-white/5 rounded border border-white/5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-blue-500 text-black font-mono font-bold text-[10px]">GET</span>
                        <code className="text-xs text-white font-mono font-bold">/api/v1/invoices</code>
                      </div>
                      <p className="text-[11px] text-slate-400">Queries sales invoices with filters for date range, party/customer ID, and payment status.</p>
                    </div>

                    <div className="p-3 bg-white/5 rounded border border-white/5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-black font-mono font-bold text-[10px]">POST</span>
                        <code className="text-xs text-white font-mono font-bold">/api/v1/invoices</code>
                      </div>
                      <p className="text-[11px] text-slate-400">Atomically generates an invoice, decrements physical warehouse stock, posts ledger debit/credit balances, and fires outbound webhooks.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-white tracking-wider">Outbound Webhooks (HMAC-SHA256 Signed)</span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">x-noxis-signature</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Noxis Hub dispatches real-time webhooks for events like <code className="text-white font-mono">invoice.created</code>, <code className="text-white font-mono">stock.low</code>, and <code className="text-white font-mono">peshgi.issued</code>. Every HTTP POST payload includes an HMAC-SHA256 signature header computed using your registered secret key for cryptographic verification.
                  </p>
                </div>
              </div>
            </section>

            {/* 8. WEIGHBRIDGE & HARDWARE PERIPHERALS */}
            <section id="hardware-specs" className="pt-10 border-t border-white/10 scroll-mt-28 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] font-mono text-xs font-bold">08</span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">Weighbridge Scales, Thermal Printers &amp; Hardware Peripherals</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-[#C5A059]/50">
                Noxis Hub connects directly to factory floor hardware via RS232 COM serial ports, USB HID, and Bluetooth RFCOMM.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#0B0F17] border border-white/10 p-5 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
                    <Scale size={16} className="text-[#08EBF6]" />
                    <span>RS232 Serial Weighbridge Scales</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Continuous serial stream parser configured for standard industrial indicators (Avery Weigh-Tronix, Cardinal, Mettler Toledo, Keli, Yaohua) at <strong className="text-white">9600 Baud, 8 Data Bits, No Parity, 1 Stop Bit (8-N-1)</strong>. Automatically captures Gross, Tare, and Net weight for Paddy IN and Rice OUT shipments.
                  </p>
                </div>

                <div className="bg-[#0B0F17] border border-white/10 p-5 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
                    <Printer size={16} className="text-emerald-400" />
                    <span>ESC/POS Thermal Receipt Printers</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Direct binary ESC/POS command pipeline supporting 58mm (2-inch) and 80mm (3-inch) Bluetooth &amp; USB thermal printers. Includes high-density bitmap raster rendering for company emblems, QR codes, automatic paper cut pulses (<code className="font-mono text-cyan-300">GS V 0</code>), and cash drawer triggers.
                  </p>
                </div>
              </div>
            </section>

            {/* 9. MOBILE APP & ACCESS CONTROL */}
            <section id="mobile" className="pt-10 border-t border-white/10 scroll-mt-28 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] font-mono text-xs font-bold">09</span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">Mobile Floor Companion App &amp; Role Access Control</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-[#C5A059]/50">
                Equip factory floor supervisors, loom overseers, and warehouse pickers with Android handhelds connected directly to the office PC.
              </p>

              <div className="bg-[#0B0F17] border border-white/10 p-5 rounded-lg space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300 border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-white font-bold text-[10px] uppercase tracking-wider">
                        <th className="py-2.5 px-3">Staff Role</th>
                        <th className="py-2.5 px-3">Permitted Operations</th>
                        <th className="py-2.5 px-3">Protected / Hidden Modules</th>
                        <th className="py-2.5 px-3">Edit Ledgers?</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-[11px]">
                      <tr>
                        <td className="py-2 px-3 text-emerald-400 font-bold uppercase">Owner (Seth)</td>
                        <td className="py-2 px-3">Full Master Suite, Gross Profit, License</td>
                        <td className="py-2 px-3 text-slate-500">None (Full Access)</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">YES</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-blue-400 font-bold uppercase">Manager</td>
                        <td className="py-2 px-3">Billing, Khata Balances, Orders, Production</td>
                        <td className="py-2 px-3 text-slate-400">Master User Management &amp; DB Keys</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">YES</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-amber-400 font-bold uppercase">Accountant</td>
                        <td className="py-2 px-3">Invoices, Party Roznamcha, Cash Receipts</td>
                        <td className="py-2 px-3 text-slate-400">Factory Floor Cameras &amp; Piece Matrix</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">YES</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-purple-400 font-bold uppercase">Supervisor</td>
                        <td className="py-2 px-3">Worker Attendance, Daily Thaan Output, Peshgi</td>
                        <td className="py-2 px-3 text-slate-400">Cash Khata &amp; Invoices (Hidden)</td>
                        <td className="py-2 px-3 text-red-400 font-bold">NO</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-slate-300 font-bold uppercase">Cashier</td>
                        <td className="py-2 px-3">Counter POS Billing &amp; Slip Printing</td>
                        <td className="py-2 px-3 text-slate-400">Purchase Costs &amp; Supplier Ledgers (Hidden)</td>
                        <td className="py-2 px-3 text-red-400 font-bold">NO</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 10. POS & COUNTER BILLING */}
            <section id="pos" className="pt-10 border-t border-white/10 scroll-mt-28 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] font-mono text-xs font-bold">10</span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">Rapid POS Counter Billing &amp; Keyboard Ergonomics</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-[#C5A059]/50">
                Engineered for rapid counter sales in busy wholesale Mandis, cloth markets, and retail counters where mouse clicks waste time.
              </p>

              <div className="bg-[#0B0F17] border border-white/10 p-5 rounded-lg space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white/5 p-3 rounded border border-white/5">
                    <span className="font-mono text-amber-400 font-bold">F2</span>
                    <p className="text-slate-400 text-[11px] mt-1 font-sans">Search Item / Focus Scanner</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded border border-white/5">
                    <span className="font-mono text-amber-400 font-bold">F4</span>
                    <p className="text-slate-400 text-[11px] mt-1 font-sans">Assign Customer / Khata</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded border border-white/5">
                    <span className="font-mono text-amber-400 font-bold">F8</span>
                    <p className="text-slate-400 text-[11px] mt-1 font-sans">Credit Khata Tender</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded border border-white/5">
                    <span className="font-mono text-amber-400 font-bold">F10</span>
                    <p className="text-slate-400 text-[11px] mt-1 font-sans">Commit &amp; Print Slip</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 11. INVENTORY & FABRIC ROLLS */}
            <section id="inventory" className="pt-10 border-t border-white/10 scroll-mt-28 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] font-mono text-xs font-bold">11</span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">Inventory, Fabric Rolls &amp; Batch Barcodes</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-[#C5A059]/50">
                Track yarn bags, fabric rolls (thaan), chemical drums, and ready-to-wear cartons with automated reorder alerts.
              </p>

              <div className="bg-[#0B0F17] border border-white/10 p-5 rounded-lg space-y-3 text-xs text-slate-300 leading-relaxed">
                <p>• <strong className="text-white">Printable Labels:</strong> Generate and print barcode stickers for each thaan, roll, or package with custom thermal dimensions.</p>
                <p>• <strong className="text-white">Low Stock Warnings:</strong> The system automatically highlights items dipping below reorder points on the main dashboard.</p>
                <p>• <strong className="text-white">Zero Mismatches:</strong> Every piece sold updates your warehouse stock instantaneously across all peer terminals.</p>
              </div>
            </section>

            {/* 12. INVOICING & KHATA LEDGERS */}
            <section id="invoices" className="pt-10 border-t border-white/10 scroll-mt-28 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] font-mono text-xs font-bold">12</span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">Professional Invoicing &amp; Automatic Khata Ledgers</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-[#C5A059]/50">
                Eliminate manual handwritten ledger books. Every transaction posts to double-entry general ledgers with balance calculations in Lakhs &amp; Crores.
              </p>

              <div className="bg-[#0B0F17] border border-white/10 p-5 rounded-lg space-y-3 text-xs text-slate-300 leading-relaxed">
                <p>• <strong className="text-white">Automatic Ledger Posting:</strong> Whenever a bill is finalized, the customer's previous balance and new balance reconcile instantly.</p>
                <p>• <strong className="text-white">WhatsApp &amp; PDF Dispatch:</strong> Send formatted balance statements and PDF invoice copies directly to customers with 1 click.</p>
                <p>• <strong className="text-white">Audit Trail Integrity:</strong> Cryptographic edit logs protect previous invoices from being deleted without administrator authorization.</p>
              </div>
            </section>

            {/* 13. KARIGAR WAGE MATRIX & PESHGI */}
            <section id="karigar" className="pt-10 border-t border-white/10 scroll-mt-28 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] font-mono text-xs font-bold">13</span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">Karigar Piece-Rate Wage Calculations &amp; Peshgi Advances</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-[#C5A059]/50">
                Designed specifically for textile factories, embroidery houses, and tailoring units to prevent disputed piece counts and advance wage disputes.
              </p>

              <div className="bg-[#0B0F17] border border-white/10 p-5 rounded-lg space-y-4">
                <div className="bg-[#05070B] p-4 border border-white/10 rounded-md font-mono text-xs space-y-1">
                  <span className="text-emerald-400 font-bold">Automated Net Payout Formula:</span>
                  <p className="text-slate-300">
                    Net Pay = (Units Produced × Piece Rate) + Overtime Allowances − Outstanding Peshgi Deductions
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                  <div className="p-3 bg-white/5 rounded border border-white/5">
                    <strong className="text-white block mb-1">Production Tariffs</strong>
                    <p className="text-slate-400 text-[11px]">Set individual rates per yard, meter, suit, or thaan cut per Karigar grade.</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded border border-white/5">
                    <strong className="text-white block mb-1">Peshgi Advance Khata</strong>
                    <p className="text-slate-400 text-[11px]">Disburse worker cash advances; the system deducts them automatically on salary day.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 14. CCTV SURVEILLANCE */}
            <section id="cctv" className="pt-10 border-t border-white/10 scroll-mt-28 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] font-mono text-xs font-bold">14</span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">CCTV RTSP IP Camera Live Monitoring</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-[#C5A059]/50">
                View cash drawers, weighbridge platforms, and loom floors directly inside your billing dashboard without running separate NVR applications.
              </p>

              <div className="bg-[#0B0F17] border border-white/10 p-5 rounded-lg space-y-3 text-xs text-slate-300 leading-relaxed">
                <p>• <strong className="text-white">Direct RTSP Feeds:</strong> Connects to Hikvision, Dahua, Uniview, and ONVIF IP cameras via standard RTSP URLs (<code className="text-cyan-300 font-mono">rtsp://user:pass@192.168.1.100:554/ch1</code>).</p>
                <p>• <strong className="text-white">Multi-Camera Grid:</strong> Monitor up to 4 cameras simultaneously on Pro tier and up to 6 on Elite tier with motion tripwires.</p>
              </div>
            </section>

            {/* 15. LOAD SHEDDING PROTECTION */}
            <section id="fault-recovery" className="pt-10 border-t border-white/10 scroll-mt-28 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] font-mono text-xs font-bold">15</span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">Load-Shedding &amp; Power Cut Protection</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-[#C5A059]/50">
                Engineered specifically for developing industrial regions with frequent generator switchovers and unannounced power outages.
              </p>

              <div className="bg-[#0B0F17] border border-white/10 p-5 rounded-lg space-y-3 text-xs text-slate-300 leading-relaxed">
                <p>1. <strong className="text-white">Continuous Auto-Draft:</strong> In-progress bills are saved into local memory every 5 seconds so counter operators never lose line items.</p>
                <p>2. <strong className="text-white">Zero Corruption SQLite WAL:</strong> Atomic rollbacks guarantee that half-written records never corrupt master ledger files.</p>
                <p>3. <strong className="text-white">Auto-Resume On Boot:</strong> When electricity returns, Noxis Hub reopens the exact active counter workspace automatically.</p>
              </div>
            </section>

            {/* 16. SYSTEM HEALTH & DIAGNOSTICS */}
            <section id="troubleshoot" className="pt-10 border-t border-white/10 scroll-mt-28 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] font-mono text-xs font-bold">16</span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">System Diagnostics &amp; Disaster Recovery</h2>
              </div>
              <div className="bg-[#0B0F17] border border-white/10 p-5 rounded-lg space-y-3 text-xs text-slate-300 leading-relaxed">
                <p>• <strong className="text-white">One-Click USB Backup:</strong> Open <strong className="text-white">Settings → Backup &amp; Restore</strong> to generate an instant single-file encrypted database snapshot onto a USB flash drive.</p>
                <p>• <strong className="text-white">Integrity Check:</strong> Built-in SQLite integrity verifier checks database health and index structures in real time.</p>
                <p>• <strong className="text-white">24/7 WhatsApp Support:</strong> Send on-screen diagnostics directly to WhatsApp support (+92 326 4742678) for prompt resolution.</p>
              </div>
            </section>

            {/* 17. SHORTCUTS & DISPLAY ZOOM FIX */}
            <section id="shortcuts-zoom" className="pt-10 border-t border-white/10 scroll-mt-28 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] font-mono text-xs font-bold">17</span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">Master Shortcuts &amp; Display Zoom Glitch Fix (Ctrl + 0)</h2>
              </div>

              {/* Emergency Zoom Fix Callout */}
              <div className="p-5 bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-transparent border border-amber-500/30 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-black text-[10px] font-black uppercase font-mono tracking-wider">CRITICAL FIX</span>
                  <h3 className="text-sm font-bold text-white">Software appears tiny, shrunken, or zoomed out? (Accidental Zoom)</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  If your software appears tiny in the center of the screen surrounded by a black empty background (caused by holding <strong>Ctrl</strong> and scrolling the mouse wheel or pressing <strong>Ctrl + -</strong>), press <kbd className="px-2 py-0.5 bg-black border border-cyan-400/50 rounded font-mono text-cyan-400 font-bold">Ctrl + 0</kbd> on your keyboard. This immediately resets the visual scale back to 100% normal view.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                  <div className="p-2.5 bg-black/40 border border-white/10 rounded">
                    <span className="text-cyan-400 font-bold">Ctrl + 0</span>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-sans">Reset Display Zoom to 100%</p>
                  </div>
                  <div className="p-2.5 bg-black/40 border border-white/10 rounded">
                    <span className="text-cyan-400 font-bold">Ctrl + +</span>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-sans">Zoom In (+10% Scaling)</p>
                  </div>
                  <div className="p-2.5 bg-black/40 border border-white/10 rounded">
                    <span className="text-cyan-400 font-bold">Ctrl + -</span>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-sans">Zoom Out (-10% Scaling)</p>
                  </div>
                </div>
              </div>

              {/* Shortcuts Table */}
              <div className="bg-[#0B0F17] border border-white/10 p-5 rounded-lg space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-white font-bold text-[10px] uppercase font-mono tracking-wider">
                        <th className="py-2.5 px-3">Operation</th>
                        <th className="py-2.5 px-3">Shortcut Key</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-medium">Reset Zoom to 100%</td>
                        <td className="py-2 px-3 text-cyan-300 font-bold">Ctrl + 0</td>
                        <td className="py-2 px-3 text-amber-400">Display</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">Instantly recovers shrunken viewport glitch</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-medium">Command Palette</td>
                        <td className="py-2 px-3 text-cyan-300 font-bold">Ctrl + K</td>
                        <td className="py-2 px-3 text-blue-400">Navigation</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">Universal search across SKUs, parties, and settings</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-medium">POS Counter / New Bill</td>
                        <td className="py-2 px-3 text-cyan-300 font-bold">Ctrl + P / F2</td>
                        <td className="py-2 px-3 text-emerald-400">Sales</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">Focuses barcode input or opens sales checkout</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-medium">Select Party / Khata</td>
                        <td className="py-2 px-3 text-cyan-300 font-bold">F4</td>
                        <td className="py-2 px-3 text-emerald-400">Sales</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">Focuses customer selection search on POS</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-medium">Cash Payment Tender</td>
                        <td className="py-2 px-3 text-cyan-300 font-bold">F7</td>
                        <td className="py-2 px-3 text-emerald-400">Sales</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">Instant cash register settlement</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-medium">Khata Credit Tender</td>
                        <td className="py-2 px-3 text-cyan-300 font-bold">F8</td>
                        <td className="py-2 px-3 text-emerald-400">Sales</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">Posts invoice directly to customer's running ledger</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-medium">Thermal Print Slip</td>
                        <td className="py-2 px-3 text-cyan-300 font-bold">F9</td>
                        <td className="py-2 px-3 text-emerald-400">Sales</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">Sends 58mm/80mm receipt to thermal printer</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-medium">Save &amp; Commit Bill</td>
                        <td className="py-2 px-3 text-cyan-300 font-bold">F10</td>
                        <td className="py-2 px-3 text-emerald-400">Sales</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">Atomic commit and warehouse stock deduction</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-medium">Inventory &amp; SKUs</td>
                        <td className="py-2 px-3 text-cyan-300 font-bold">Ctrl + I</td>
                        <td className="py-2 px-3 text-purple-400">Operations</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">Raw materials &amp; finished goods stock list</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-medium">Wholesale Parties</td>
                        <td className="py-2 px-3 text-cyan-300 font-bold">Ctrl + Shift + P</td>
                        <td className="py-2 px-3 text-purple-400">Finance</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">Customer &amp; supplier double-entry ledgers</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-medium">Karigar Wage Matrix</td>
                        <td className="py-2 px-3 text-cyan-300 font-bold">Ctrl + Shift + K</td>
                        <td className="py-2 px-3 text-purple-400">Workforce</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">Artisan piece rates, attendance &amp; advances</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-white font-sans font-medium">Toggle Sidebar</td>
                        <td className="py-2 px-3 text-cyan-300 font-bold">Ctrl + B</td>
                        <td className="py-2 px-3 text-slate-400">View</td>
                        <td className="py-2 px-3 text-slate-400 font-sans">Collapses sidebar for expanded workspace area</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 18. OPERATIONAL USER GUIDE */}
            <section id="feature-guide" className="pt-10 border-t border-white/10 scroll-mt-28 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] font-mono text-xs font-bold">18</span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">Complete Operational User Guide</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-[#C5A059]/50">
                Summary of operational workflows for day-to-day industrial operations.
              </p>

              <div className="space-y-4">
                <div className="bg-[#0B0F17] border border-white/10 p-5 rounded-lg space-y-2">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Universal Excel (.xlsx) &amp; CSV Data Importer</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Migrate existing business spreadsheets without manual data entry. Drag and drop any <code>.xlsx</code> or <code>.csv</code> file into <strong className="text-white">Settings → Import Data</strong>. The smart engine detects column headers (Item Name, Rate, Cost, Phone, Balance) and maps them automatically to local SQLite tables with instant preview and dry-run validation.
                  </p>
                </div>

                <div className="bg-[#0B0F17] border border-white/10 p-5 rounded-lg space-y-2">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Multi-Currency &amp; Interbank Rate Sync</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Designed for fabric exporters, yarn importers, and trading houses dealing in PKR, AED, USD, SAR, EUR, GBP, and CNY. Configure benchmark currency rates under <strong className="text-white">Settings → Regional &amp; Currency</strong> or perform 1-click live central bank sync.
                  </p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}