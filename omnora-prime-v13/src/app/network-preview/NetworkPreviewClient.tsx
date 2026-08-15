'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Users, ArrowUpRight, ShieldCheck, Cpu, Zap, Download } from 'lucide-react';
import Link from 'next/link';

const ACTIVE_COUNTRIES = [
  { code: 'PK', flag: '🇵🇰', name: 'Pakistan', x: 480, y: 210, size: 24, desc: 'Primary Manufacturing (Textiles, Agri, Leather)' },
  { code: 'AE', flag: '🇦🇪', name: 'UAE', x: 380, y: 250, size: 18, desc: 'Pakistani Diaspora Garment & Trade Hubs' },
  { code: 'BD', flag: '🇧🇩', name: 'Bangladesh', x: 620, y: 220, size: 20, desc: 'Garment & High-Volume Apparel Production' },
  { code: 'TR', flag: '🇹🇷', name: 'Turkey', x: 220, y: 140, size: 18, desc: 'Euro-Asian Industrial Manufacturing Center' },
  { code: 'ID', flag: '🇮🇩', name: 'Indonesia', x: 740, y: 360, size: 16, desc: 'Textile & Advanced Food Processing' },
  { code: 'VN', flag: '🇻🇳', name: 'Vietnam', x: 700, y: 260, size: 16, desc: 'Garment & Electronics Assembly' },
  { code: 'MA', flag: '🇲🇦', name: 'Morocco', x: 80, y: 220, size: 14, desc: 'Textile & Leather Manufacturing for Europe' },
  { code: 'ET', flag: '🇪🇹', name: 'Ethiopia', x: 320, y: 350, size: 12, desc: 'Emerging High-Growth Garment Corridors' },
  { code: 'GB', flag: '🇬🇧', name: 'UK', x: 120, y: 80, size: 14, desc: 'Diaspora Light Industrial SMEs' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada', x: 60, y: 50, size: 12, desc: 'Diaspora Supply Chain Partners' },
];

const INDUSTRIES = [
  { name: 'Textile & Fabric', icon: '🧵' },
  { name: 'Garment & Apparel', icon: '👔' },
  { name: 'Rice Mill & Grain', icon: '🌾' },
  { name: 'Pharmaceutical', icon: '💊' },
  { name: 'Auto Parts & Engineering', icon: '⚙️' },
  { name: 'Food Processing', icon: '🍱' },
  { name: 'Construction Materials', icon: '🧱' },
  { name: 'Leather & Footwear', icon: '👞' },
];

export default function NetworkPreviewClient() {
  const supabase = createClient();
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<any | null>(null);
  
  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('network_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_visible', true);
      setTotalCount(count || 0);
    };
    fetchCount();
  }, []);

  return (
    <div className="min-h-screen bg-[#07090B] text-gray-200 select-none flex flex-col font-sans overflow-x-hidden relative">
      {/* Dynamic Background Grid and Lights */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-electric-blue/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-200px] right-1/2 w-[600px] h-[300px] bg-electric-blue/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-20 border-b border-white/5 bg-[#0C0F12]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Globe className="text-electric-blue group-hover:rotate-12 transition-transform" size={20} />
          <span className="text-sm font-black uppercase tracking-widest text-white italic">Noxis Hub</span>
        </Link>
        <Link href="/download" className="flex items-center gap-1.5 px-4 py-2 border border-white/10 text-xs font-bold uppercase tracking-widest text-gray-300 hover:border-white/20 hover:text-white transition-all bg-white/[0.02]">
          <Download size={12} />
          <span>Get Noxis</span>
        </Link>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-12 w-full flex-1 space-y-12 relative z-10">
        
        {/* Page Title & Hook */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-electric-blue/5 border border-electric-blue/20 px-3.5 py-1.5 rounded-full mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-electric-blue animate-pulse" />
            <span className="text-[10px] font-black text-electric-blue uppercase tracking-widest">
              Live B2B Factory Ledger
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase italic">
            Noxis Factory Network
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            Discover verified industrial manufacturers, liquidate surplus materials, and trade directly with trust. Join the premier digital supply network across Pakistan, Middle East, and Mediterranean markets.
          </p>
          <div className="text-2xl font-black font-mono text-electric-blue tracking-tight pt-2">
            {totalCount !== null ? (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {totalCount} Verified Factories & Counting
              </motion.span>
            ) : (
              <span className="opacity-50 animate-pulse">Connecting Ledger...</span>
            )}
          </div>
        </div>

        {/* CSS/SVG Interactive Map */}
        <section className="relative bg-[#0C0F12] border border-white/5 rounded-sm p-4 md:p-8 shadow-2xl overflow-hidden">
          {/* Tactical Overlay Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <Cpu className="text-electric-blue animate-pulse" size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Active Supply Chain Nodes Mapping
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Live Node Sync</span>
            </div>
          </div>

          {/* Minimalist Tech Map SVG */}
          <div className="relative w-full aspect-[800/450] bg-black/40 border border-white/[0.02] rounded-sm flex items-center justify-center">
            <svg viewBox="0 0 800 450" className="w-full h-full text-white/5 opacity-80 transition-opacity">
              {/* Grid Lines */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Minimalist continent outlines (artistic representation of Europe/Asia/Africa) */}
              {/* North America / Canada */}
              <path d="M 10 30 Q 30 20 60 40 T 110 50 Q 80 80 50 70 Z" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" />
              {/* UK / Western Europe */}
              <path d="M 100 70 Q 120 60 140 80 T 170 100 Q 150 120 120 110 Z" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" />
              {/* Mediterranean / Turkey / Middle East */}
              <path d="M 180 120 Q 220 130 250 150 T 320 200 Q 360 220 400 240 Q 350 280 300 260 Z" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" />
              {/* Africa / Morocco / Ethiopia */}
              <path d="M 60 200 Q 100 220 140 250 T 200 320 Q 250 380 300 390 T 320 350 Q 240 320 150 280 Z" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" />
              {/* South Asia / Pakistan / India */}
              <path d="M 420 180 Q 480 200 520 220 T 580 280 Q 550 320 500 340 T 450 280 Z" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" />
              {/* Southeast Asia / Indonesia / Vietnam */}
              <path d="M 640 240 Q 700 250 740 280 T 780 350 Q 720 380 680 330 Z" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" />

              {/* Connecting tech-routes / visual networks */}
              <path d="M 480 210 Q 380 250 380 250" fill="none" stroke="rgba(0,229,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
              <path d="M 480 210 Q 620 220 620 220" fill="none" stroke="rgba(0,229,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
              <path d="M 380 250 Q 220 140 220 140" fill="none" stroke="rgba(0,229,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
              <path d="M 620 220 Q 700 260 700 260" fill="none" stroke="rgba(0,229,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
              <path d="M 700 260 Q 740 360 740 360" fill="none" stroke="rgba(0,229,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
              <path d="M 220 140 Q 120 80 120 80" fill="none" stroke="rgba(0,229,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
              <path d="M 120 80 Q 60 50 60 50" fill="none" stroke="rgba(0,229,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
              <path d="M 220 140 Q 80 220 80 220" fill="none" stroke="rgba(0,229,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
              <path d="M 380 250 Q 320 350 320 350" fill="none" stroke="rgba(0,229,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
            </svg>

            {/* Pulsating active countries nodes overlay */}
            {ACTIVE_COUNTRIES.map((c) => (
              <div
                key={c.code}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ left: `${(c.x / 800) * 100}%`, top: `${(c.y / 450) * 100}%` }}
                onMouseEnter={() => setHoveredCountry(c)}
                onMouseLeave={() => setHoveredCountry(null)}
              >
                {/* Glowing Core */}
                <div className="relative">
                  <div className="absolute inset-0 w-4 h-4 bg-electric-blue rounded-full opacity-60 blur-md group-hover:scale-150 transition-all duration-300" />
                  <div className="absolute inset-0 w-3 h-3 bg-electric-blue rounded-full animate-ping opacity-75" />
                  <div className="relative w-3 h-3 bg-[#00E5FF] rounded-full border border-white/40 shadow-[0_0_10px_#00E5FF]" />
                </div>

                {/* Country Tiny Name Label */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#0C0F12]/90 border border-white/10 rounded-sm text-[8px] font-black uppercase text-gray-400 group-hover:text-white tracking-widest shadow-lg flex items-center gap-1 whitespace-nowrap">
                  <span>{c.flag}</span>
                  <span>{c.code}</span>
                </div>
              </div>
            ))}

            {/* Dynamic Hover Tooltip Inside Map */}
            <AnimatePresence>
              {hoveredCountry && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute bottom-6 left-6 max-w-sm p-4 bg-[#0F1216] border border-electric-blue/30 shadow-2xl rounded-sm backdrop-blur-md pointer-events-none"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">{hoveredCountry.flag}</span>
                    <h4 className="text-xs font-black uppercase text-white tracking-widest">{hoveredCountry.name}</h4>
                    <span className="ml-auto text-[8px] font-black px-1.5 py-0.5 bg-electric-blue/15 text-electric-blue border border-electric-blue/20 uppercase rounded-sm">ACTIVE</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                    {hoveredCountry.desc}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Industry Focus Grid */}
        <section className="space-y-6">
          <div className="text-center md:text-left space-y-1">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">
              Broad Industrial Infrastructure Integration
            </h2>
            <p className="text-lg font-bold text-white uppercase italic">
              Active Manufacturing Verticals
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {INDUSTRIES.map((ind, idx) => (
              <div key={idx} className="relative group p-5 bg-[#0C0F12] border border-white/5 hover:border-white/10 transition-all rounded-sm flex items-center gap-4 overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.015)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-2xl bg-white/5 p-2 rounded-sm shrink-0 group-hover:scale-105 transition-transform duration-300">
                  {ind.icon}
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase text-white tracking-tight leading-snug">
                    {ind.name}
                  </h3>
                  <span className="text-[8px] font-black uppercase tracking-widest text-electric-blue/70">
                    Active Listings
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Supply Trust Signals */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {[
            {
              icon: ShieldCheck,
              title: 'Verified Ledger Verification',
              desc: 'No ghost profiles or empty leads. Every node represents a real factory holding a verified Noxis ledger with valid transactions.',
            },
            {
              icon: Zap,
              title: 'Direct Collaborative Liquidations',
              desc: 'Sell raw materials, dye batches, excess fabric, or packaging elements directly. Save on storage and retrieve working capital.',
            },
            {
              icon: Users,
              title: 'Local & Global Collaborative Network',
              desc: 'Seamlessly coordinate between primary domestic units and international diaspora supply coordinators in UAE, UK, and Canada.',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-6 bg-[#0C0F12]/50 border border-white/5 rounded-sm space-y-3">
                <div className="w-10 h-10 bg-electric-blue/5 border border-electric-blue/15 text-electric-blue flex items-center justify-center rounded-sm">
                  <Icon size={18} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-white">{item.title}</h3>
                <p className="text-[11px] text-gray-400 leading-relaxed font-medium">{item.desc}</p>
              </div>
            );
          })}
        </section>

        {/* Global Invitation CTA */}
        <section className="p-8 md:p-12 bg-gradient-to-r from-electric-blue/[0.03] to-blue-500/[0.01] border border-electric-blue/20 rounded-sm text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.02)_0%,transparent_80%)] pointer-events-none" />
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white italic">
            Join the Sovereign Industrial Grid
          </h2>
          <p className="text-xs md:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed font-medium">
            Take your manufacturing facility online on Noxis Network. Register your SKU catalogs, list surplus inventory, and coordinate logistics inside a single system.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/download"
              className="w-full sm:w-auto px-8 py-4 bg-electric-blue text-black font-black uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all text-xs shadow-[0_0_30px_rgba(0,229,255,0.2)] text-center"
            >
              Join the Network — Download Noxis
            </Link>
            <Link
              href="/docs"
              className="w-full sm:w-auto px-8 py-4 border border-white/10 text-gray-300 font-bold uppercase tracking-widest hover:border-white/20 hover:text-white transition-all text-xs bg-white/[0.01] text-center"
            >
              Read Network Protocol
            </Link>
          </div>
          <div className="text-[9px] text-gray-600 font-bold uppercase tracking-widest pt-2">
            🔒 Fully Encrypted Node Control • GDPR & Local Data Privacy Compliant
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0C0F12] px-6 py-8 text-center text-xs text-gray-600 font-bold uppercase tracking-widest relative z-20">
        <p>© {new Date().getFullYear()} Omnora Labs. All Rights Reserved. Noxis Sovereign Industrial Grid v13.0</p>
      </footer>
    </div>
  );
}
