"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
import { 
  Shield, Lock, Terminal, Cpu, Database, Mail, Globe, 
  Sparkles, MessageSquare, Code2, Layers, Smartphone, 
  Braces, ArrowLeft, ArrowRight, Menu, X, Info, Zap, 
  Network, Eye, Calendar, ChevronDown, ChevronUp, FileText, CheckCircle2
} from "lucide-react";
import { SectionReveal, FloatingOrb, GlowCard } from "@/components/ui/AnimatedComponents";

const BUILD_DATE = new Date().toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
});

export default function AboutPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <div className="bg-[#030406] text-white font-sans min-h-screen selection:bg-sandstone-gold/30 selection:text-white overflow-x-hidden relative flex flex-col justify-between">
      
      {/* Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sandstone-gold via-[#00E5FF] to-sandstone-gold z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* Floating Decorative Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <FloatingOrb color="rgba(197,160,89,0.05)" size={700} x="10%" y="15%" delay={0} blur={140} />
        <FloatingOrb color="rgba(0,229,255,0.03)" size={600} x="85%" y="60%" delay={3} blur={130} />
        <FloatingOrb color="rgba(255,255,255,0.01)" size={500} x="50%" y="80%" delay={1} blur={120} />
      </div>

      {/* Top Header Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#030406]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-[76px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="w-9 h-9 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-sandstone-gold/50 group-hover:bg-sandstone-gold/10 transition-colors">
              <Image 
                src="/logos/noxis.png" 
                alt="Noxis" 
                width={22} 
                height={22} 
                className="object-contain"
                priority
              />
            </div>
            <span className="font-extrabold text-lg tracking-wider text-white group-hover:text-[#E8D5B5] transition-colors">NOXIS</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Pricing', href: '/pricing' }, 
              { label: 'Reviews', href: '/reviews' }, 
              { label: 'Blog', href: '/blog' }, 
              { label: 'Docs', href: '/docs' },
              { label: 'About', href: '/about' }
            ].map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="text-xs font-bold tracking-[0.15em] uppercase text-gray-400 hover:text-white transition-colors relative group"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/download"
              className="text-xs font-bold tracking-widest uppercase text-black bg-sandstone-gold hover:bg-[#D4B77A] px-6 py-2.5 rounded-sm transition-all shadow-[0_0_20px_rgba(197,160,89,0.15)]"
            >
              Download
            </Link>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-400 hover:text-white transition-colors">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/[0.06] bg-[#030406]">
            <div className="px-6 py-8 flex flex-col gap-6">
              {[
                { label: 'Pricing', href: '/pricing' }, 
                { label: 'Reviews', href: '/reviews' }, 
                { label: 'Blog', href: '/blog' }, 
                { label: 'Docs', href: '/docs' },
                { label: 'About', href: '/about' }
              ].map((link) => (
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
                className="block text-center font-bold text-sm tracking-widest uppercase text-black bg-sandstone-gold hover:bg-[#D4B77A] py-3.5 rounded-sm"
              >
                Free Trial Download
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 pt-36 pb-28 px-6 max-w-6xl mx-auto w-full flex flex-col space-y-32">
        
        {/* Section 1: Hero Identity */}
        <SectionReveal className="text-center flex flex-col items-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 border border-[#C5A059]/20 bg-[#C5A059]/5 mb-2">
            <Sparkles size={12} className="text-sandstone-gold animate-pulse" />
            <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-sandstone-gold">
              Industrial Automation Manifest
            </span>
          </div>
          <h1 className="text-4xl sm:text-7xl font-black tracking-tight text-white leading-none uppercase max-w-4xl">
            THE INDUSTRIAL OPERATING <span className="text-transparent bg-clip-text bg-gradient-to-r from-sandstone-gold via-white to-[#00E5FF]">SYSTEM</span>
          </h1>
          <p className="text-[#94A3B8] text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-medium">
            Noxis Hub is a localized, local-first industrial ERP engineered by Omnora Labs to orchestrate piece-rate karigar payroll, real-time inventories, local mesh networks, and edge CCTV vision grids on physical floor environments.
          </p>
          <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase flex items-center gap-3">
            <span>NOXIS HUB v13.0</span>
            <span>•</span>
            <span>BUILD: {BUILD_DATE}</span>
          </div>
          <div className="w-16 h-[1px] bg-white/10" />
        </SectionReveal>

        {/* Section 2: Live Operational Stats Grid */}
        <SectionReveal delay={0.05}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value="40+" label="Industrial Verticals" sub="Textiles, Mills, Pharma & Logistics" />
            <StatCard value="130k+" label="Sandboxed Code Lines" sub="Rust, TS, SQLite & C++ Modules" />
            <StatCard value="100%" label="Offline Resilient" sub="0% Data Transmission Leakage" />
            <StatCard value="0.12ms" label="Local Vision Inference" sub="Sentinel AI CCTV Frame Rate" />
          </div>
        </SectionReveal>

        {/* Section 3: Detailed Philosophy / Mission */}
        <SectionReveal delay={0.1}>
          <div className="glass-panel border border-white/5 p-8 md:p-14 rounded-xl bg-[#090A0E]/60 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-[2px] bg-gradient-to-r from-sandstone-gold to-[#00E5FF]" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-6">
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-white flex items-center gap-2">
                  <Zap size={14} className="text-sandstone-gold" />
                  Engineering for the Raw Physical Floor
                </h2>
                <blockquote className="text-gray-300 text-sm md:text-base leading-relaxed font-semibold italic">
                  "This software is specifically developed, designed, and engineered for industries all around the world — not for the corporate boardroom or a single region. Our tools are built for the people on the factory floor: textile owners, managers, floor supervisors, weavers, and exporters."
                </blockquote>
                <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                  Most modern software fails when the network drops. In the industrial heartlands of South Asia and globally, internet drops are fatal to production pipelines. Noxis works completely offline, pairing local workstations with supervisor phones over a localized mesh network to run inventory scans, log weaver outputs, calculate payouts, and fire intrusion warning alarms.
                </p>
              </div>
              <div className="lg:col-span-4 bg-[#030406]/70 border border-white/5 p-6 rounded-lg space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white font-mono">Our Core Commitments</h3>
                <ul className="space-y-3 font-medium text-[11px] text-gray-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-sandstone-gold shrink-0 mt-0.5" />
                    <span><strong className="text-white">Zero Telemetry Leakage:</strong> Trade ledgers, finances, and wages stay localized.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-sandstone-gold shrink-0 mt-0.5" />
                    <span><strong className="text-white">Nastaliq Translation:</strong> Complete Urdu interface support for supervisors.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-sandstone-gold shrink-0 mt-0.5" />
                    <span><strong className="text-white">No Seat-Rental Cost:</strong> Single server lifetime license, zero cloud rents.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </SectionReveal>

        {/* Section 4: Visual Architecture Flow / Pipeline Schematic */}
        <SectionReveal delay={0.15} className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Network size={18} className="text-[#00E5FF]" />
              <h3 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 font-mono">Local Mesh Architecture</h3>
            </div>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest border border-white/5 px-2 py-0.5 rounded font-mono">Topology Mode: Master-Node Mesh</span>
          </div>

          <div className="bg-[#050608]/90 border border-white/5 rounded-xl p-8 space-y-8 relative overflow-hidden">
            {/* Visual Node Diagram */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
              
              <SchematicNode 
                title="Android Edge Nodes" 
                subtitle="Weaver Mobile Apps" 
                details="Expo SDK 51 / React Native" 
                desc="Supervisors log piece-rate operations directly on the floor. Runs without cellular networks or outside links."
                icon={Smartphone}
                color="border-[#00E5FF]/20 text-[#00E5FF] bg-[#00E5FF]/5"
              />

              <div className="hidden lg:flex flex-col justify-center items-center">
                <span className="text-[10px] text-gray-500 font-mono uppercase font-bold tracking-widest mb-1">Local Mesh</span>
                <div className="w-full h-[1px] bg-gradient-to-r from-[#00E5FF] to-sandstone-gold flex items-center justify-center">
                  <ArrowRight size={14} className="text-sandstone-gold shrink-0" />
                </div>
                <span className="text-[8px] text-gray-600 font-mono uppercase tracking-wider mt-1">WebSockets / LAN Bridge</span>
              </div>

              <SchematicNode 
                title="PC Master Node" 
                subtitle="Office Workstation Server" 
                details="Next.js 16 / Electron Engine" 
                desc="Orchestrates operations, computes piece-rate payouts, displays local Sentinel CCTV overlays, and issues local alerts."
                icon={Cpu}
                color="border-[#C5A059]/20 text-sandstone-gold bg-[#C5A059]/5"
              />

              <div className="hidden lg:flex flex-col justify-center items-center">
                <span className="text-[10px] text-gray-500 font-mono uppercase font-bold tracking-widest mb-1">Encrypted Sync</span>
                <div className="w-full h-[1px] bg-gradient-to-r from-sandstone-gold to-[#10B981] flex items-center justify-center">
                  <ArrowRight size={14} className="text-[#10B981] shrink-0" />
                </div>
                <span className="text-[8px] text-gray-600 font-mono uppercase tracking-wider mt-1">AES-256 SSL Pipeline</span>
              </div>

            </div>

            {/* Bottom local vs cloud storage row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5 relative z-10">
              <div className="bg-[#0A0C10]/60 border border-white/5 p-5 rounded-lg flex gap-4 items-start">
                <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-md text-[#EF4444]">
                  <Database size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Isolated SQLite Node (100% Local DB)</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Primary operational transactions (ledger sheets, wages, worker attendance, and local CCTV parameters) are committed directly to your hard drive partition at <code className="text-gray-300 font-mono text-[10px]">Noxis-Local.db</code>. Securely locked.
                  </p>
                </div>
              </div>

              <div className="bg-[#0A0C10]/60 border border-white/5 p-5 rounded-lg flex gap-4 items-start">
                <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/20 rounded-md text-[#10B981]">
                  <Database size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Encrypted Supabase Syncer (Cloud Backup)</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Provides remote dashboard access, worldwide reporting, and automatic offsite backups. Syncing operates in the background and can be deactivated with a single toggle in settings to sandbox the workstation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SectionReveal>

        {/* Section 5: Core Technical Pillars */}
        <SectionReveal delay={0.2} className="space-y-8">
          <div className="flex items-center space-x-3">
            <Layers size={18} className="text-sandstone-gold" />
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 font-mono">Core Product Pillars</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PillarCard 
              icon={Network} 
              title="Local Wi-Fi Mesh" 
              desc="Supervisors log worker operations directly from their Android phones on the factory floor. The mobile clients communicate with the PC workstation over local routers without needing internet access, keeping output logging instantaneous."
            />
            <PillarCard 
              icon={Shield} 
              title="Localized Sandboxing" 
              desc="Your trade data belongs to you. Financial records, karigar files, advance ledger balances, and payroll calculations are stored on your workstation's disk. Omnora Labs does not collect, analyze, or monetize your business history."
            />
            <PillarCard 
              icon={Eye} 
              title="Sentinel AI CCTV" 
              desc="Convert your factory's CCTV analog feeds into intelligent boundaries. Draw virtual lines on the floor cameras inside the app. Noxis runs localized OpenCV and TensorFlow models to issue local PC alarm triggers when boundaries are breached."
            />
          </div>
        </SectionReveal>

       

        {/* Section 7: Founders Card */}
        <SectionReveal delay={0.25} className="space-y-8">
          <div className="flex items-center space-x-3">
            <Terminal size={18} className="text-sandstone-gold" />
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 font-mono font-bold">The Architect</h3>
          </div>
          
          <GlowCard 
            glowColor="rgba(197,160,89,0.08)"
            className="bg-[#0C0E12] border border-white/5 p-8 md:p-12 rounded-xl hover:border-white/10 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-sandstone-gold/5 rounded-full blur-3xl" />
            <div className="flex flex-col md:flex-row gap-8 relative z-10">
              <div className="shrink-0 flex flex-col items-center">
                <div className="w-28 h-28 rounded-full bg-sandstone-gold/10 border-2 border-sandstone-gold flex items-center justify-center text-4xl font-black text-sandstone-gold font-mono shadow-[0_0_30px_rgba(197,160,89,0.2)]">
                  AM
                </div>
                <div className="mt-4 text-center">
                  <span className="text-[10px] font-bold text-sandstone-gold uppercase tracking-[0.2em] font-mono">Lead Engineer</span>
                </div>
              </div>
              <div className="flex-1 space-y-6">
                <div>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tight">Ahmad Mahboob</h4>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Founder, Systems Architect, Lead Developer</p>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-1">
                  <Pill>5.5 Years Industrial Experience</Pill>
                  <Pill>React Native Specialist</Pill>
                  <Pill>Edge Systems Engineering</Pill>
                  <Pill>Interactive Game Development</Pill>
                  <Pill>Digital Media Architect</Pill>
                </div>
                
                <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                  Ahmad leads systems design, core compilation parameters, and industrial engineering at Omnora Labs. With a professional background in web architecture, digital media, and game development, he approaches industrial software with a unique design philosophy — building products that provide consumer-grade responsiveness while maintaining the rugged stability required by heavy manufacturing floors.
                </p>

                <div className="border-l-2 border-[#00E5FF]/40 pl-4 py-1">
                  <p className="text-[11px] text-gray-300 italic">
                    "Factory floor environments are hostile. They have dust, extreme temperatures, power failures, and unstable networks. Our engineering goal with Noxis is simple: create software that refuses to crash, communicates locally, and gives business owners absolute control over their operational data."
                  </p>
                </div>
              </div>
            </div>
          </GlowCard>
        </SectionReveal>

        {/* Section 8: Technical Specifications Table */}
        <SectionReveal delay={0.28} className="space-y-8">
          <div className="flex items-center space-x-3">
            <Code2 size={18} className="text-[#00E5FF]" />
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 font-mono">Technical Specifications</h3>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#08090C]">
            <table className="w-full text-left text-xs font-mono border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-white/5 bg-[#040507]">
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-500">Parameter</th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-300">Technical Details</th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-500">Engine / Library Context</th>
                </tr>
              </thead>
              <tbody>
                <SpecRow param="Local Storage Database" detail="SQLite sandboxed, 4MB starter schema, index-optimized" tech="Drizzle ORM / node-sqlite3" />
                <SpecRow param="Mesh Communication" detail="WebSockets over localized LAN, TCP protocol pipes" tech="Node.js ws / TCP sockets" />
                <SpecRow param="Intrusion Vision Frame Rate" detail="0.12ms inference, smart polygons, intrusion alerts" tech="OpenCV / TensorFlow.js WASM" />
                <SpecRow param="Desktop Container Wrapper" detail="Hardware hooks, isolated runtime, local SQLite locks" tech="Electron / Next.js app wrapper" />
                <SpecRow param="Urdu Localization Engine" detail="Nastaliq web font fallback rendering, localized JSON" tech="Next.js ClientI18nProvider" />
                <SpecRow param="Remote Cloud Synchronizer" detail="AES-256 transit SSL, user-triggered background syncs" tech="Supabase clients / JS Auth" />
              </tbody>
            </table>
          </div>
        </SectionReveal>

        {/* Section 9: Detailed FAQ Accordion */}
        <SectionReveal delay={0.3} className="space-y-8">
          <div className="flex items-center space-x-3">
            <Info size={18} className="text-sandstone-gold" />
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 font-mono">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-4">
            <FaqItem 
              question="Does Noxis require an internet connection to function?"
              answer="No. Noxis is built on a strict Local-First Architecture. Your piece-rate calculations, worker ledgers, inventory records, and CCTV surveillance alerts run completely on your local workstation's hardware. An internet connection is only required if you choose to sync your database to the Supabase cloud for remote reporting or offsite backups."
            />
            <FaqItem 
              question="How do supervisors connect their mobile phones to the master workstation offline?"
              answer="The master workstation runs a local WebSocket server within your office. Supervisors connect their Android phones to the factory's local Wi-Fi router. Even without internet, the mobile apps communicate directly with the local workstation to log attendance, yardage, and inventory scans."
            />
            <FaqItem 
              question="What is the difference between the local SQLite database and Supabase?"
              answer="SQLite is your primary local database located on your office PC. It is fast, isolated, and safe. Supabase is a secure cloud database. When you activate cloud synchronization, Noxis encrypts and pushes changes from your local SQLite database to Supabase, enabling remote viewing of dashboards from anywhere in the world."
            />
            <FaqItem 
              question="How does Sentinel AI CCTV protect my factory floor data privacy?"
              answer="Unlike cloud-based security cameras that upload your video streams to external servers, Sentinel AI processes all video frames locally on your workstation's CPU/GPU. No video data is ever sent to the cloud, ensuring absolute confidentiality for your floor operations."
            />
          </div>
        </SectionReveal>

        {/* Section 10: Support Ticket Form */}
        <SectionReveal delay={0.32} className="pt-12 border-t border-white/5 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-white">Corporate Support & Inquiries</h4>
                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                  Have questions about custom hardware integration, large-scale textile router mesh pairing, or local database deployment? Contact the engineering team at Omnora Labs directly.
                </p>
                <div className="space-y-2 pt-2 text-[11px] text-gray-500">
                  <p>© 2026 Omnora Labs. All rights reserved.</p>
                  <p>Noxis and its logos are trademarks of Omnora Labs.</p>
                </div>
                <div className="flex space-x-6 pt-2 text-[10px] font-bold uppercase tracking-wider text-sandstone-gold">
                  <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
                  <Link href="/terms" className="hover:underline">Terms of Service</Link>
                </div>
              </div>

              <div className="h-[1px] bg-white/5" />

              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-white font-mono">Operations & Support</h4>
                <div className="flex items-center space-x-3 group">
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-sm text-gray-400 group-hover:text-white transition-colors">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Support Email</p>
                    <a href="mailto:[EMAIL_ADDRESS]" className="text-xs text-gray-300 font-bold hover:text-white transition-colors">omnora@noxis.app</a>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <SupportForm />
            </div>
          </div>
        </SectionReveal>

      </main>

      {/* Footer Navigation */}
      <footer className="border-t border-white/[0.06] bg-[#020304] py-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center">
              <Image 
                src="/logos/noxis.png" 
                alt="Noxis" 
                width={16} 
                height={16} 
                className="object-contain" 
              />
            </div>
            <span className="font-extrabold text-sm tracking-wider">NOXIS</span>
            <span className="text-xs text-gray-600">by Omnora Labs</span>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-xs font-semibold uppercase tracking-widest text-gray-500">
            {[
              { label: 'Download', href: '/download' }, 
              { label: 'Pricing', href: '/pricing' }, 
              { label: 'Reviews', href: '/reviews' }, 
              { label: 'Blog', href: '/blog' }, 
              { label: 'Docs', href: '/docs' }, 
              { label: 'Privacy', href: '/privacy' },
              { label: 'About', href: '/about' }
            ].map((l) => (
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
  );
}

function StatCard({ value, label, sub }: { value: string, label: string, sub: string }) {
  return (
    <div className="bg-[#090A0E]/50 border border-white/5 p-6 rounded-lg text-center backdrop-blur-sm hover:border-[#C5A059]/30 hover:bg-[#090A0E]/75 transition-all">
      <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sandstone-gold via-white to-[#00E5FF] tracking-tight">{value}</p>
      <p className="text-xs font-bold text-white uppercase tracking-wider mt-2">{label}</p>
      <p className="text-[9px] text-gray-500 mt-1 uppercase font-medium">{sub}</p>
    </div>
  );
}

function SchematicNode({ title, subtitle, details, desc, icon: Icon, color }: { title: string, subtitle: string, details: string, desc: string, icon: any, color: string }) {
  return (
    <div className={`p-6 border rounded-lg space-y-4 relative ${color} flex-1`}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-white">{title}</h4>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{subtitle}</p>
        </div>
        <div className="p-2 bg-white/5 border border-white/10 rounded">
          <Icon size={16} />
        </div>
      </div>
      <div className="text-[10px] text-gray-500 font-mono tracking-tight">{details}</div>
      <p className="text-[11px] text-gray-400 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}

function PillarCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-[#090A0E]/50 border border-white/5 p-6 rounded-lg space-y-4 hover:border-white/10 transition-colors">
      <div className="p-3 bg-white/5 border border-white/10 rounded-md w-12 h-12 flex items-center justify-center text-sandstone-gold">
        <Icon size={20} />
      </div>
      <h4 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h4>
      <p className="text-xs text-gray-400 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}

function TimelineItem({ year, title, desc }: { year: string, title: string, desc: string }) {
  return (
    <div className="relative group">
      <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full border border-sandstone-gold bg-[#030406] group-hover:scale-125 transition-transform" />
      <div className="space-y-1 pl-4">
        <span className="text-[10px] font-black font-mono text-sandstone-gold tracking-widest bg-sandstone-gold/10 px-2 py-0.5 border border-sandstone-gold/20 rounded-sm">{year}</span>
        <h4 className="text-sm font-bold text-white uppercase tracking-wider pt-2">{title}</h4>
        <p className="text-xs text-gray-400 leading-relaxed max-w-3xl font-medium">{desc}</p>
      </div>
    </div>
  );
}

function SpecRow({ param, detail, tech }: { param: string, detail: string, tech: string }) {
  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.01]">
      <td className="p-4 font-bold text-white text-[11px] uppercase tracking-wide">{param}</td>
      <td className="p-4 text-gray-300 font-medium text-[11px]">{detail}</td>
      <td className="p-4 text-gray-500 font-mono text-[10px] uppercase">{tech}</td>
    </tr>
  );
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-[#090A0E]/50 border border-white/5 rounded-lg overflow-hidden transition-colors hover:border-white/10">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-white uppercase tracking-wider focus:outline-none"
      >
        <span>{question}</span>
        {isOpen ? <ChevronUp size={16} className="text-sandstone-gold" /> : <ChevronDown size={16} className="text-gray-500" />}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-white/5 text-xs sm:text-sm text-gray-400 leading-relaxed font-medium">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 py-1 bg-white/[0.02] border border-white/5 rounded-full text-[9px] font-bold uppercase tracking-widest text-gray-400">
      {children}
    </span>
  );
}

const SupportForm = () => {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Software Feedback",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    try {
      const response = await fetch("https://formspree.io/f/xvgzkpee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", phone: "", subject: "Software Feedback", message: "" });
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#0C0E12] border border-white/5 p-6 rounded-lg space-y-4 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-sandstone-gold/40" />
      <h4 className="text-xs font-black uppercase tracking-widest text-white mb-2 flex items-center">
        <Mail size={14} className="text-sandstone-gold mr-2 animate-pulse" />
        Submit Support Ticket
      </h4>
      <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
        Submit feedback, feature requests, or license upgrading inquiries directly to Omnora Labs support engineers.
      </p>

      {status === "success" ? (
        <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
          <div className="w-10 h-10 bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] flex items-center justify-center rounded-full text-lg">
            ✓
          </div>
          <h5 className="text-[10px] font-black text-white uppercase tracking-tight">Support Ticket Received</h5>
          <p className="text-[9px] text-slate-500 max-w-xs leading-relaxed font-semibold">
            Thank you! Your ticket has been logged with Formspree. Our team will review the system parameters and email you.
          </p>
          <button 
            type="button" 
            onClick={() => setStatus("idle")} 
            className="text-[9px] font-black text-sandstone-gold uppercase tracking-widest hover:underline pt-2"
          >
            Create new ticket
          </button>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#030406] border border-white/5 focus:border-sandstone-gold focus:outline-none px-3 py-2 text-[10px] text-white uppercase tracking-wider font-semibold rounded-none transition-colors"
                placeholder="YOUR NAME"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#030406] border border-white/5 focus:border-sandstone-gold focus:outline-none px-3 py-2 text-[10px] text-white font-mono rounded-none transition-colors"
                placeholder="you@factory.com"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Phone / WhatsApp</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#030406] border border-white/5 focus:border-sandstone-gold focus:outline-none px-3 py-2 text-[10px] text-white font-mono rounded-none transition-colors"
                placeholder="+923000000000"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Subject</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-[#030406] border border-white/5 focus:border-sandstone-gold focus:outline-none px-3 py-2 text-[10px] text-white uppercase tracking-wider font-semibold rounded-none transition-colors"
              >
                <option value="Software Feedback">Software Feedback</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Report Bug / Anomaly">Report Bug / Anomaly</option>
                <option value="Hardware Integration">Hardware Integration</option>
                <option value="Upgrade Inquiry">Upgrade Inquiry</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Support Request Details</label>
            <textarea
              required
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-[#030406] border border-white/5 focus:border-sandstone-gold focus:outline-none px-3 py-2 text-[10px] text-white tracking-wider rounded-none transition-colors resize-none"
              placeholder="SPECIFY SYSTEM DETAILS, OR ANY ISSUES ENCOUNTERED..."
            />
          </div>

          {status === "error" && (
            <div className="text-[9px] font-black text-[#EF4444] uppercase tracking-widest bg-[#EF4444]/5 p-2 border border-[#EF4444]/20 text-center">
              ⚠️ Transmission failed. Please email omnora@noxis.app instead.
            </div>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full bg-sandstone-gold text-black py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.01] hover:bg-[#D4B77A] disabled:opacity-50 transition-all cursor-pointer"
          >
            {status === "submitting" ? "Transmitting Support Ticket..." : "Submit Support Ticket"}
          </button>
        </>
      )}
    </form>
  );
};
