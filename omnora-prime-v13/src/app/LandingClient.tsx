'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, 
  X, 
  ChevronRight, 
  Sparkles, 
  Layers, 
  Smartphone, 
  ShieldCheck, 
  Check, 
  BarChart4, 
  Download, 
  ArrowRight, 
  HelpCircle,
  Database,
  Globe2
} from 'lucide-react'

export default function LandingClient() {
  const router = useRouter()
  const supabase = createClient()
  const [checking, setChecking] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.navigator.userAgent.toLowerCase().includes('electron')
    }
    return false
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    async function handleAuthRedirect() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data: profile } = await supabase
            .from('business_profiles')
            .select('id, onboarding_done')
            .eq('user_id', session.user.id)
            .single()
          if (profile && profile.onboarding_done) {
            router.push('/dashboard')
          } else {
            router.push('/setup')
          }
        } else {
          const isElectron = typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron')
          if (isElectron) {
            router.push('/login')
          } else {
            setChecking(false)
          }
        }
      } catch {
        setChecking(false)
      }
    }
    handleAuthRedirect()
  }, [supabase, router])

  if (checking) {
    return (
      <div className="min-h-screen bg-[#070809] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  }

  return (
    <div className="bg-[#070809] text-white font-sans min-h-screen selection:bg-blue-500 selection:text-black overflow-x-hidden">
      
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* ═══ NAVIGATION ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#070809]/80 backdrop-blur-xl border-b border-white/[0.06] transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="w-8 h-8 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-blue-500/50 transition-colors">
              <img
                src="/logos/noxis.png"
                alt="Noxis"
                className="w-5 h-5 object-contain"
                onError={e => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
            <span className="font-extrabold text-lg tracking-wider text-white group-hover:text-blue-400 transition-colors">
              NOXIS
            </span>
          </Link>

          {/* Desktop Nav links */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Pricing', href: '/pricing' },
              { label: 'Blog', href: '/blog' },
              { label: 'Docs', href: '/docs' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-400 hover:text-white font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/download"
              className="text-xs font-bold tracking-widest uppercase text-black bg-[#60A5FA] hover:bg-blue-400 px-6 py-2.5 rounded-sm transition-all shadow-[0_0_20px_rgba(96,165,250,0.15)] active:scale-95"
            >
              Download
            </Link>
          </div>

          {/* Mobile hamburger icon */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-b border-white/[0.06] bg-[#070809] overflow-hidden"
            >
              <div className="px-6 py-8 flex flex-col gap-6">
                {[
                  { label: 'Pricing', href: '/pricing' },
                  { label: 'Blog', href: '/blog' },
                  { label: 'Docs', href: '/docs' },
                  { label: 'Download Platform', href: '/download' }
                ].map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg text-gray-300 hover:text-white font-semibold transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/download"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center font-bold text-sm tracking-widest uppercase text-black bg-[#60A5FA] hover:bg-blue-400 py-3.5 rounded-sm transition-all"
                >
                  Download Free Trial
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-36 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left: Text Details */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="lg:col-span-7 space-y-8"
          >
            {/* Version Badge */}
            <motion.div 
              variants={fadeIn}
              className="inline-flex items-center gap-2.5 bg-blue-500/10 border border-blue-500/25 rounded-full px-4 py-1.5"
            >
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[10px] font-bold text-blue-400 tracking-widest uppercase">
                Industrial ERP · v13.1 Premium
              </span>
            </motion.div>

            {/* Main Header */}
            <motion.h1 
              variants={fadeIn}
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[1.05] text-white"
            >
              Factory software <br className="hidden sm:inline" />
              that runs <span className="text-[#60A5FA] bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">offline.</span>
            </motion.h1>

            {/* Detailed Description */}
            <motion.p 
              variants={fadeIn}
              className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-xl"
            >
              Manage floor inventory, piece-rate karigar payroll, double-entry financial accounts, and smart AI CCTV monitoring. Works reliably without internet or cloud fees. Engineered for global reliability and regional compliance.
            </motion.p>

            {/* CTA Elements */}
            <motion.div 
              variants={fadeIn}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
            >
              <Link
                href="/download"
                className="flex items-center justify-center gap-2.5 bg-[#60A5FA] hover:bg-blue-400 text-black font-extrabold text-sm tracking-wider px-8 py-4 rounded-sm transition-all shadow-[0_0_30px_rgba(96,165,250,0.2)] active:scale-95 text-center"
              >
                <Download size={16} />
                Download Free Trial
              </Link>
              <Link
                href="/pricing"
                className="flex items-center justify-center gap-1.5 text-gray-400 hover:text-white font-semibold text-sm py-3 transition-colors group"
              >
                Explore licensing tiers
                <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Geographic Coverage & Trust */}
            <motion.div 
              variants={fadeIn}
              className="pt-8 border-t border-white/5 flex flex-wrap items-center gap-x-8 gap-y-3"
            >
              <span className="text-xs font-bold text-gray-600 uppercase tracking-widest block w-full mb-1">Trusted across global manufacturing hubs</span>
              {[
                { flag: '🇵🇰', label: 'Pakistan' },
                { flag: '🇦🇪', label: 'UAE / GCC' },
                { flag: '🇹🇷', label: 'Turkey' },
                { flag: '🇧🇩', label: 'Bangladesh' },
                { flag: '🌍', label: '+36 countries' },
              ].map(c => (
                <div key={c.label} className="flex items-center gap-2">
                  <span className="text-base">{c.flag}</span>
                  <span className="text-xs text-gray-500 font-semibold">{c.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Graphic / Dashboard Mockup */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-5 relative"
          >
            {/* Soft decorative backdrop glow */}
            <div className="absolute inset-0 bg-blue-500/10 blur-[100px] pointer-events-none rounded-full" />
            
            {/* Visual Glass Frame */}
            <div className="relative bg-[#0F1114] border border-white/10 rounded-lg overflow-hidden shadow-2xl shadow-black/80">
              
              {/* Window Controls */}
              <div className="bg-[#0A0C0F] border-b border-white/5 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <span className="text-[10px] text-gray-600 font-mono tracking-widest uppercase">
                  Noxis Node Terminal
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono font-bold uppercase animate-pulse">
                  Local Active
                </span>
              </div>

              {/* Mockup Dashboard Content */}
              <div className="p-6 space-y-6">
                
                {/* Stats Blocks */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Mandi Output today', value: '45,820 kg', color: 'text-amber-400' },
                    { label: 'Active Karigars', value: '142 Present', color: 'text-blue-400' },
                    { label: 'Weekly Revenue', value: 'Rs. 18,40,900', color: 'text-emerald-400' },
                    { label: 'Material Loss Ratio', value: '0.04% Alert', color: 'text-red-400' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-[#161A1F] border border-white/5 p-4 rounded-sm">
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">
                        {stat.label}
                      </p>
                      <p className={`font-mono text-base font-black ${stat.color}`}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Simulated Local Server Activity Feed */}
                <div className="bg-[#08090C] border border-white/5 p-4 rounded-sm font-mono text-[10px] space-y-2">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>SYS MONITOR FEED</span>
                    <span>127.0.0.1</span>
                  </div>
                  <div className="h-[1px] bg-white/5 my-2" />
                  <div className="flex items-center gap-2 text-blue-400">
                    <span className="text-gray-700">➜</span>
                    <span>SQLite Local sync: 41 entries replicated successfully.</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <span className="text-gray-700">➜</span>
                    <span>Camera Node 01: Person detected (Confidence 98%).</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-500">
                    <span className="text-gray-700">➜</span>
                    <span>Peshgi threshold warning: Karigar "Hamid" advance alert.</span>
                  </div>
                </div>

                {/* Mobile sync visualizer */}
                <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Smartphone size={20} className="text-blue-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">Mobile Handheld Mesh</h4>
                      <p className="text-[10px] text-gray-500">Auto-pairing active via Local WiFi</p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-mono font-bold">
                    CONNECTED
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <section className="border-y border-white/[0.06] bg-[#0A0C0F]/50 backdrop-blur-md px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between gap-y-8 gap-x-12">
          {[
            { value: '40+', label: 'Manufacturing Industries' },
            { value: '30+', label: 'Integrated Currencies' },
            { value: '6+', label: 'Multilingual Scripts' },
            { value: '100%', label: 'Offline Capability' },
            { value: 'PKR 2,500', label: 'Starting Price / Mo' },
          ].map((s, i) => (
            <motion.div 
              key={s.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex-1 min-w-[150px] text-center"
            >
              <h4 className="font-mono text-2xl sm:text-3xl font-bold text-white mb-1.5">{s.value}</h4>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ DETAILED FEATURES GRID ═══ */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        
        {/* Header Title */}
        <div className="max-w-xl mb-16 space-y-4">
          <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">
            CORE FEATURES
          </p>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-none">
            Everything your factory needs. Nothing it doesn't.
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Engineered specifically to solve the real operational challenges on manufacturing floors, without bloated cloud overheads or complicated interfaces.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {[
            {
              icon: <Database size={24} className="text-blue-400" />,
              title: 'Offline-First Database Replicator',
              desc: 'Built using double-ciphered local SQLite that reconciles with Supabase cloud instantly upon connection. Zero reliance on continuous internet.'
            },
            {
              icon: <Layers size={24} className="text-amber-400" />,
              title: 'Barcode & SKU Inventory Engine',
              desc: 'Scan, store, and manage raw raw material bales, yards of fabrics, chemical batches, and custom packaging boxes. Auto-triggers reorder levels.'
            },
            {
              icon: <Smartphone size={24} className="text-emerald-400" />,
              title: 'Mobile Floor Handhelds',
              desc: 'Workers log piece-rate counts, daily handovers, and attendance directly from handheld Android terminals paired instantly via local WiFi.'
            },
            {
              icon: <ShieldCheck size={24} className="text-red-400" />,
              title: 'AI Sentinel Zone CCTV',
              desc: 'Draw software boundaries around restricted areas. Triggers instant local machine and push alerts for unauthorized human or vehicle entries.'
            },
            {
              icon: <BarChart4 size={24} className="text-indigo-400" />,
              title: 'Double-Entry Mandi Accounting',
              desc: 'Log cash receipts, bank transactions, and ledger credits. Generate trial balances, profit & loss, and aging accounts instantly.'
            },
            {
              icon: <Globe2 size={24} className="text-teal-400" />,
              title: 'Multilingual Regional Support',
              desc: 'Switch between Urdu Nastaliq and English translations instantly to accommodate local workers, accounting teams, and administrators.'
            }
          ].map((feature, i) => (
            <motion.div 
              key={feature.title}
              variants={fadeIn}
              whileHover={{ y: -8, borderColor: 'rgba(96,165,250,0.3)' }}
              className="bg-[#0F1114] border border-white/5 hover:border-white/10 p-8 rounded-sm transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-sm bg-white/5 flex items-center justify-center border border-white/10">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">{feature.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══ DETAILED COMPARISON TABLE ═══ */}
      <section className="py-20 px-6 bg-[#0A0C0F]/30 border-y border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Why not just use Excel?
            </h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Most local factories rely on spreadsheets. Here is how specialized offline-first automation compares.
            </p>
          </div>

          {/* Desktop Table View */}
          <div className="overflow-x-auto border border-white/5 rounded-sm bg-[#0F1114]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#0A0C0F]">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Operational Needs</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-blue-400 text-center">Noxis ERP</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">Spreadsheets</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">Cloud Systems</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['100% Offline Local Network', '✅ Full Support', '✅ Manual Copy', '❌ Fails completely'],
                  ['Karigar Piece-Rate Calculations', '✅ Automated', '❌ High Formula Errors', '❌ Custom Dev required'],
                  ['Peshgi Advance Tracking', '✅ Automated', '❌ Complex Ledgering', '❌ Generic Add-ons'],
                  ['Real-time AI CCTV Integration', '✅ Built-in', '❌ Not Possible', '❌ Cloud Storage Fees'],
                  ['Urdu Nastaliq Interface', '✅ Full Native', '❌ Text only', '❌ Not Available'],
                  ['Implementation Period', '10 Minutes', 'DIY Build', '3 to 6 Months'],
                  ['Cost Structure', 'Fixed Local Subscription', 'Free Software Only', 'Heavy Monthly User Caps'],
                ].map((row, i) => (
                  <tr key={i} className={`border-b border-white/5 hover:bg-white/[0.01] transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'}`}>
                    <td className="p-4 text-xs font-bold text-gray-300">{row[0]}</td>
                    <td className="p-4 text-xs font-bold text-blue-400 text-center">{row[1]}</td>
                    <td className="p-4 text-xs text-gray-500 text-center">{row[2]}</td>
                    <td className="p-4 text-xs text-gray-500 text-center">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ HIGH INTENSITY CALL TO ACTION ═══ */}
      <section className="py-24 px-6 text-center max-w-4xl mx-auto relative z-10">
        
        {/* Shimmering Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full mb-8">
          <Sparkles size={12} className="text-blue-400 animate-spin" />
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
            3-Day Free Trial Available
          </span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tighter text-white mb-6 leading-none">
          Take absolute control <br className="hidden sm:inline" />
          of your workshop floor.
        </h2>
        <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Setup took under ten minutes. No dedicated hardware or internet dependencies required. Start preventing material leaks and automated payslips immediately.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-4 max-w-md mx-auto">
          <Link
            href="/download"
            className="flex-1 bg-[#60A5FA] hover:bg-blue-400 text-black font-extrabold text-sm tracking-wider py-4 rounded-sm transition-all shadow-[0_0_30px_rgba(96,165,250,0.2)] active:scale-95 text-center"
          >
            Download Free Trial
          </Link>
          <a
            href="https://wa.me/923334355475?text=Hi,%20I%20want%20to%20schedule%20a%20demo%20for%20Noxis%20ERP"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-[#25D366] hover:bg-[#20ba59] text-black font-extrabold text-sm tracking-wider py-4 rounded-sm transition-all shadow-[0_0_30px_rgba(37,211,102,0.15)] active:scale-95 text-center"
          >
            Regional Demo WhatsApp
          </a>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/[0.06] bg-[#050607] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <img 
              src="/logos/noxis.png" 
              alt="Noxis" 
              className="w-5 h-5 object-contain"
              onError={e => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <span className="font-extrabold text-sm tracking-wider">NOXIS</span>
            <span className="text-xs text-gray-600">by Omnora Labs</span>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-xs font-semibold uppercase tracking-widest text-gray-500">
            {[
              { label: 'Platform Download', href: '/download' },
              { label: 'Pricing Tiers', href: '/pricing' },
              { label: 'Operational Blog', href: '/blog' },
              { label: 'Developer Docs', href: '/docs' },
              { label: 'Privacy Policy', href: '/privacy' },
            ].map(l => (
              <Link key={l.href} href={l.href} className="hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          <p className="text-xs text-gray-600 text-center md:text-right">
            © 2026 Omnora Labs · Engineered for Manufacturing 🇵🇰
          </p>
        </div>
      </footer>
    </div>
  )
}
