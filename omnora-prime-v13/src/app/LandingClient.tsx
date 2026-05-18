"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { 
  Factory, WifiOff, Globe, ArrowRight, Check, 
  ShieldCheck, Zap, Lock, AlertTriangle, Database, 
  ArrowUpRight, Server, Eye, Radio
} from "lucide-react";
import Image from "next/image";

// --- Types & Data ---

type Industry = {
  name: string;
  tags: string[];
  detailed: boolean;
};

const INDUSTRIES: Industry[] = [
  { name: "Textile Manufacturing", tags: ["Stock", "Karigar Payroll", "Batch Tracking"], detailed: true },
  { name: "Pharma & Medical", tags: ["Expiry Tracking", "Cold Chain", "Drug License"], detailed: true },
  { name: "Auto Parts", tags: ["SKU Intelligence", "OEM Codes", "Supplier Scoring"], detailed: true },
  { name: "Wholesale Kiryana", tags: ["POS", "Credit Management", "Stock Valuation"], detailed: true },
  { name: "Rice Mill", tags: ["Batch Processing", "Weight Tracking", "Mandi Rates"], detailed: true },
  { name: "3PL Logistics", tags: ["Dispatch", "Fleet", "Shipment Tracking"], detailed: true },
  { name: "Cloud Kitchen", tags: ["Live Orders", "Menu Management", "Cost Tracking"], detailed: true },
  { name: "Leather Tannery", tags: ["Batch", "Chemical Tracking", "Export Invoicing"], detailed: true },
  { name: "Furniture Mfg", tags: ["BOM", "Production Stages", "Piece-Rate"], detailed: true },
  { name: "Jewelry Workshop", tags: ["Weight Tracking", "Gold Rate", "Karigar"], detailed: true },
  { name: "Construction", tags: ["Material Tracking", "Site Dispatch", "Contractor Pay"], detailed: true },
  { name: "General Mfg", tags: ["Production", "Inventory", "Payroll"], detailed: true },
  // Remaining 14
  ...Array(14).fill(null).map((_, i) => ({
    name: [
      "Marble Works", "Chemical Processing", "Printing & Packaging", "Plastic Injection",
      "Steel Mill", "Mining & Quarrying", "Paints & Coatings", "Electronics Assembly",
      "Glass Fabricators", "Foundry Operations", "Paper Mill", "Food Processing",
      "Garment Factory", "Cosmetics Mfg"
    ][i] || `Industry ${i + 13}`,
    tags: ["Contact for demo"],
    detailed: false
  }))
];

const PRICING = {
  PKR: { lite: "2,500", pro: "6,500", elite: "14,000" },
  USD: { lite: "15", pro: "40", elite: "85" }
};

// --- Components ---

const LOG_MESSAGES = [
  "CCTV Sentinel: Camera #2 (Spindle Room #4) Person detected 98.9% parity",
  "NSP Local Sync: P2P vector clocks converged with Mobile Node #4",
  "Basmati Mandi Sync: Rates updated in SQLite (PKR 8,200 / Maund)",
  "Karigar Ledger: Piece-rate ticket loom #12 processed for Sajid Ali",
  "Sentinel AI: WhatsApp notification auto-routed via jazz-bsp fallback",
  "TCP Broadcast: Synced 18 active local records with SQLite instance",
  "CCTV Sentinel: Camera #1 (Gate East) Vehicle registered - OK",
  "Database Master: Automated local ledger backup generated successfully",
  "NspService: Pair validation verified for Mobile Node #3 (Elite Tier limit: OK)",
];

const DashboardVisual = () => {
  const [logs, setLogs] = useState<string[]>([
    "Omnora Engine: Local offline mesh network active (5km range)",
    "Noxis Core: Double-entry khata database initialized successfully",
    "TCP Daemon: Local host port 4242 online for LAN nodes",
  ]);
  const [revenue, setRevenue] = useState(128450);
  const [activeKarigars, setActiveKarigars] = useState(14);
  const [meshNodes, setMeshNodes] = useState(4);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const logInterval = setInterval(() => {
      setLogs((prev) => {
        const nextMsg = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
        const timestamp = new Date().toLocaleTimeString();
        return [...prev.slice(-6), `[${timestamp}] ${nextMsg}`];
      });
      setRevenue((prev) => prev + Math.floor(Math.random() * 80) - 30);
      setActiveKarigars((prev) => {
        const change = Math.floor(Math.random() * 3) - 1;
        return Math.max(12, Math.min(18, prev + change));
      });
    }, 2500);

    return () => clearInterval(logInterval);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="relative w-full aspect-video bg-[#0A0C0F] border border-white/10 rounded-sm overflow-hidden shadow-2xl flex flex-col font-mono text-xs select-none">
      {/* Browser/Window Top Bar */}
      <div className="h-9 bg-[#111317] border-b border-white/5 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-critical-red/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-sandstone-gold/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald/60" />
          
          {/* Noxis Tab Logo */}
          <div className="ml-4 flex items-center space-x-2 bg-[#1A1D21] px-3 py-1 border border-white/5 rounded-sm">
            <span className="w-2 h-2 rounded-full bg-electric-blue animate-pulse" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none">NOXIS HUB v13.0</span>
          </div>
        </div>

        {/* LAN Mesh Pulse Indicator */}
        <div className="flex items-center space-x-2 bg-emerald/10 border border-emerald/20 px-2.5 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-ping" />
          <span className="text-[8px] font-black text-emerald uppercase tracking-widest">OMNORA MESH: ACTIVE ({meshNodes} NODES)</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Mockup Sidebar */}
        <div className="w-12 md:w-16 bg-[#111317] border-r border-white/5 p-2 flex flex-col space-y-4 items-center pt-6 shrink-0">
          <div className="w-6 h-6 rounded-sm bg-electric-blue/20 flex items-center justify-center text-electric-blue border border-electric-blue/30">
            <Factory size={12} />
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-6 h-6 rounded-sm bg-white/5 border border-white/5 hover:bg-[#1A1D21] transition-colors cursor-pointer" />
          ))}
        </div>

        {/* Mockup Workspace */}
        <div className="flex-1 p-4 md:p-6 flex flex-col justify-between overflow-hidden gap-4">
          
          {/* Row 1: KPI Stats */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 shrink-0">
            <div className="bg-[#111317] border border-white/5 p-3 rounded-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-8 h-[1px] bg-electric-blue" />
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Loom Output Velocity</div>
              <div className="text-[10px] sm:text-xs font-black text-electric-blue mt-1 tabular-nums transition-all">
                {(revenue / 1000).toFixed(2)}m
              </div>
            </div>
            
            <div className="bg-[#111317] border border-white/5 p-3 rounded-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-8 h-[1px] bg-sandstone-gold" />
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Karigars</div>
              <div className="text-[10px] sm:text-xs font-black text-sandstone-gold mt-1 tabular-nums transition-all">
                {activeKarigars} <span className="text-[9px] text-emerald animate-pulse">●</span>
              </div>
            </div>

            <div className="bg-[#111317] border border-white/5 p-3 rounded-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-8 h-[1px] bg-[#9CA3AF]" />
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Offline sync rate</div>
              <div className="text-[10px] sm:text-xs font-black text-white mt-1 tabular-nums">
                99.8%
              </div>
            </div>
          </div>

          {/* Row 2: Live Scrolling Terminal Log Console */}
          <div className="flex-1 bg-black/80 border border-white/5 rounded-sm p-4 flex flex-col overflow-hidden relative group">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2 shrink-0">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-electric-blue" />
                <span className="text-[8px] font-black text-white uppercase tracking-widest">OMNORA ENGINE LOCAL LOG CONSOLE</span>
              </div>
              <span className="text-[8px] text-slate-600 font-mono">115200 BAUD · LAN ONLY</span>
            </div>

            <div ref={containerRef} className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar flex flex-col font-mono text-[9px] text-slate-400 select-text leading-tight">
              {logs.map((log, i) => {
                const isCctv = log.includes("CCTV");
                const isSync = log.includes("Sync") || log.includes("mesh");
                const isError = log.includes("ERR");
                return (
                  <div key={i} className="transition-all duration-300">
                    <span className="text-slate-600 mr-1.5">›</span>
                    <span className={
                      isCctv ? "text-critical-red font-bold" : 
                      isSync ? "text-emerald font-semibold" : 
                      isError ? "text-critical-red underline" : 
                      "text-slate-300"
                    }>
                      {log}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="absolute bottom-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none select-none">
              <span className="text-3xl font-black tracking-tightest text-white">OMNORA</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const LedgerVisual = () => (
  <div className="bg-[#1A1D21] border border-white/10 p-6 rounded-sm font-mono text-xs shadow-xl w-full">
    <div className="flex justify-between border-b border-white/5 pb-4 mb-4 uppercase tracking-widest text-white/40">
      <span>Description</span>
      <div className="flex space-x-6 sm:space-x-12">
        <span>Debit</span>
        <span>Credit</span>
      </div>
    </div>
    <div className="space-y-3">
      {[
        { desc: "Yarn Purchase - Batch #902", deb: "42,500", cre: "0.00" },
        { desc: "Karigar Advance - S. Ahmed", deb: "5,000", cre: "0.00" },
        { desc: "Sale Invoice #INV-204", deb: "0.00", cre: "128,400", highlight: true },
        { desc: "Electricity Bill - LESCO", deb: "18,200", cre: "0.00" },
        { desc: "Petty Cash Reconciliation", deb: "0.00", cre: "2,500" }
      ].map((row, i) => (
        <div key={i} className={`flex justify-between py-1 ${row.highlight ? 'text-sandstone-gold' : 'text-white/60'}`}>
          <span className="truncate pr-4">{row.desc}</span>
          <div className="flex space-x-4 sm:space-x-8 shrink-0">
            <span className="w-16 text-right">{row.deb}</span>
            <span className="w-16 text-right">{row.cre}</span>
          </div>
        </div>
      ))}
    </div>
    <div className="mt-8 pt-4 border-t border-white/10 flex justify-between font-bold text-white uppercase tracking-tighter">
      <span>Trial Balance</span>
      <div className="flex space-x-4 sm:space-x-8">
        <span className="w-16 text-right">65,700</span>
        <span className="w-16 text-right">130,900</span>
      </div>
    </div>
  </div>
);

const PayrollVisual = () => (
  <div className="bg-[#1A1D21] border border-white/10 p-6 rounded-sm shadow-xl overflow-hidden w-full">
    <div className="space-y-4">
      {[
        { name: "Farhan Ali", role: "Master Tailor", status: "Paid", amount: "PKR 45,200" },
        { name: "Ghulam Nabi", role: "Dye Operator", status: "Pending", amount: "PKR 32,800" },
        { name: "Imran Khan", role: "Quality QC", status: "Paid", amount: "PKR 38,000" },
        { name: "Sajid Mehmood", role: "Loader", status: "Peshgi", amount: "PKR 12,500" }
      ].map((row, i) => (
        <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-electric-blue/10 flex items-center justify-center text-electric-blue text-[10px] font-bold">
              {row.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="text-xs font-bold text-white">{row.name}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest">{row.role}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono font-bold text-sandstone-gold">{row.amount}</div>
            <div className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full inline-block ${
              row.status === 'Paid' ? 'bg-emerald/10 text-emerald' : 
              row.status === 'Pending' ? 'bg-sandstone-gold/10 text-sandstone-gold' : 
              'bg-critical-red/10 text-critical-red'
            }`}>
              {row.status}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const CCTVVisual = () => (
  <div className="relative aspect-video bg-black rounded-sm overflow-hidden border border-white/10 group shadow-2xl w-full">
    {/* Grid Overlay */}
    <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-10 pointer-events-none">
       {[...Array(24)].map((_, i) => <div key={i} className="border border-white/20" />)}
    </div>
    {/* Mask/Polygon */}
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon 
        points="20,20 80,20 80,80 20,80" 
        fill="rgba(96, 165, 250, 0.05)" 
        stroke="#60A5FA" 
        strokeWidth="0.5" 
        strokeDasharray="2 2"
      />
      <rect 
        x="45" y="45" width="15" height="25" 
        fill="none" 
        stroke="#EF4444" 
        strokeWidth="0.5"
      />
    </svg>
    {/* Detection Labels */}
    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 text-[9px] font-mono text-white/80 uppercase">
       CAM_01 · WAREHOUSE_EAST
    </div>
    <div className="absolute bottom-4 left-4 flex space-x-2">
       <div className="px-2 py-1 bg-critical-red/20 border border-critical-red/30 text-critical-red text-[9px] font-bold uppercase tracking-widest animate-pulse">
         Breach Detected
       </div>
    </div>
    {/* Bounding Box Label */}
    <div className="absolute top-[41%] left-[45%] px-1 bg-critical-red text-white text-[8px] font-bold uppercase">
      Person 98%
    </div>
  </div>
);

// --- Main Page ---

export default function NoxisHubLanding() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [currency, setCurrency] = useState<'PKR' | 'USD'>('PKR');
  const router = useRouter();
  const supabase = createClient();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function handleAuthRedirect() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Check if profile exists
          const { data: profile } = await supabase
            .from('business_profiles')
            .select('id, onboarding_done')
            .eq('user_id', session.user.id)
            .single();

          if (profile && profile.onboarding_done) {
            router.push("/dashboard");
          } else {
            router.push("/setup");
          }
        } else {
          // If in Electron, go to login immediately
          const isElectron = typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron');
          if (isElectron) {
            router.push("/login");
          } else {
            setChecking(false);
          }
        }
      } catch (err) {
        console.error("Auth redirect failed:", err);
        setChecking(false);
      }
    }

    handleAuthRedirect();

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [supabase, router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#121417] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-2 border-electric-blue/30 border-t-electric-blue rounded-full animate-spin" />
          <span className="text-[10px] text-electric-blue uppercase tracking-[0.3em] font-bold">Initializing Hub...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121417] min-h-screen text-slate-300 font-inter selection:bg-electric-blue selection:text-[#121417] overflow-x-hidden w-full relative">
      
      {/* Section 1: Navigation */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-300 ${
        isScrolled ? 'bg-[#121417]/90 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-10 h-10 flex items-center justify-center bg-white/5 group-hover:bg-electric-blue/10 rounded-sm transition-all shadow-2xl">
              <img
                src="/logos/noxis.png"
                alt="Noxis"
                width={32}
                height={32}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-black tracking-tighter leading-none text-xl">NOXIS</span>
            </div>
          </Link>

          <div className="flex items-center space-x-4 sm:space-x-12 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] sm:tracking-[0.15em] text-white/50">
            <Link href="#pricing" className="hover:text-electric-blue transition-colors">Pricing</Link>
            <Link href="/blog" className="hover:text-electric-blue transition-colors">Blog</Link>
            <Link href="/docs?source=website" className="hover:text-electric-blue transition-colors whitespace-nowrap">Documentation</Link>
          </div>
        </div>
      </nav>

      {/* Section 2: Hero */}
      <section className="relative pt-40 sm:pt-48 pb-20 sm:pb-32 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[radial-gradient(circle_at_center,rgba(96,165,250,0.08)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-electric-blue/10 border border-electric-blue/30 mb-8"
          >
            <Zap className="w-3 h-3 text-electric-blue" />
            <span className="text-[9px] sm:text-[10px] font-bold text-electric-blue uppercase tracking-widest leading-none">Industrial ERP · Offline-First · v13.0</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl xs:text-5xl sm:text-7xl md:text-8xl font-black text-white tracking-tightest mb-8 leading-[0.95] sm:leading-[0.9]"
          >
            Industrial ERP that works<br />
            <span className="text-electric-blue">without the internet.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-sm sm:text-base md:text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-medium"
          >
            Noxis runs your factory floor, warehouse, or wholesale operation entirely offline. 
            Stock, payroll, ledger, and CCTV — all on your local network. Cloud sync when you want it.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-24 max-w-md sm:max-w-none mx-auto"
          >
            <Link href="/signup" className="w-full sm:w-auto bg-electric-blue text-[#121417] px-12 py-5 font-black uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(96,165,250,0.3)] hover:scale-105 transition-transform text-center">
              Get Started
            </Link>
            <Link href="#pricing" className="w-full sm:w-auto border border-white/10 px-12 py-5 font-black uppercase tracking-widest text-sm hover:bg-white/5 transition-all text-center">
              See Pricing
            </Link>
          </motion.div>

          {/* Trust Bar */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-4xl mx-auto border-t border-white/5 pt-12 text-slate-500"
          >
            {[
              { icon: Zap, text: "850ms cold start" },
              { icon: Lock, text: "AES-256-GCM encrypted" },
              { icon: WifiOff, text: "Works on local LAN only" },
              { icon: Globe, text: "Pakistan · UAE · UK · Global" }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-center space-x-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">
                <item.icon className="w-4 h-4 text-electric-blue/50 shrink-0" />
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Hero Visual */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.4, type: "spring", damping: 20 }}
            className="mt-20 sm:mt-32 max-w-5xl mx-auto"
          >
            <DashboardVisual />
          </motion.div>
        </div>
      </section>

      {/* Section 2.5: The Pain-First Analysis */}
      <section className="py-16 sm:py-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-critical-red/5 blur-[150px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-12">
              <div className="space-y-4">
                <h3 className="text-critical-red text-[10px] font-black uppercase tracking-[0.4em] flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-2 shrink-0" />
                  Industrial Leakage Analysis
                </h3>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tightest leading-tight">
                  Stop the bleed.<br />
                  <span className="text-slate-600 italic">Ghost stock does not pay bills.</span>
                </h2>
              </div>
              
              <div className="space-y-8">
                <PainItem 
                  title="Inventory Shrinkage" 
                  desc="Unrecorded material loss averages 8-12% in manual factories. Noxis ties every gram to a barcode." 
                  pain="SHRINKAGE"
                />
                <PainItem 
                  title="The Peshgi Spiral" 
                  desc="Manual advance tracking leads to over-payment and ghost workers. Automated deduction logic breaks the cycle." 
                  pain="OVER-PAYMENT"
                />
                <PainItem 
                  title="Stock Blindness" 
                  desc="Knowing your stock only during month-end audits is a liability. Real-time sub-ledger tracking is a necessity." 
                  pain="BLINDNESS"
                />
              </div>
            </div>

            <div className="relative mt-8 lg:mt-0">
              <div className="bg-[#1A1D21] border border-white/5 p-1 flex flex-col shadow-3xl">
                <div className="h-6 bg-black flex items-center px-3 space-x-1 border-b border-white/5">
                   <div className="w-1.5 h-1.5 rounded-full bg-critical-red/40" />
                   <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                   <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                   <span className="text-[8px] text-gray-700 font-mono ml-4 uppercase">Loss_Leakage_Audit_v13.log</span>
                </div>
                <div className="p-6 sm:p-8 space-y-6">
                   <div className="flex justify-between items-end border-b border-white/5 pb-4">
                      <div>
                        <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-1">Estimated Annual Loss</p>
                        <p className="text-2xl sm:text-3xl font-black text-critical-red tracking-tight">PKR 12.8M</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-1">Leakage Type</p>
                        <p className="text-xs font-bold text-white uppercase">Ghost Stock / Peshgi</p>
                      </div>
                   </div>
                   <div className="space-y-2">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="h-2 bg-white/5 flex items-center justify-between px-2 overflow-hidden relative">
                           <div className="absolute inset-0 bg-critical-red/10 -translate-x-[20%]" />
                           <div className="w-1/2 h-full bg-critical-red/20" />
                           <span className="text-[8px] font-mono text-critical-red relative z-10">ERR_SYNC_GAP_0{i}</span>
                        </div>
                      ))}
                   </div>
                   <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium leading-relaxed italic">
                     *Calculated based on 200+ industrial audits conducted across Sialkot and Faisalabad manufacturing clusters.
                   </p>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-2 sm:-right-6 bg-electric-blue p-4 sm:p-6 shadow-2xl">
                 <p className="text-[9px] sm:text-[10px] font-black text-[#121417] uppercase tracking-widest mb-1">Noxis Correction</p>
                 <p className="text-xl sm:text-2xl font-black text-[#121417] tracking-tight">99.8% Accuracy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2.7: Technical Credibility Grid */}
      <section className="py-20 sm:py-32 px-6 bg-black border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto text-center mb-16 sm:mb-24">
           <h3 className="text-electric-blue text-[10px] font-black uppercase tracking-[0.4em] mb-4">Under the Hood</h3>
           <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tightest">Enterprise Data Integrity</h2>
        </div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-px bg-white/5 border border-white/5">
           <TechItem 
             icon={Database} 
             title="Local-First SQLite Node" 
             desc="Ultra-fast local database engine that handles millions of records with sub-10ms latency. No cloud dependency for core operations."
           />
           <TechItem 
             icon={Server} 
             title="Vector Clock Sync" 
             desc="Advanced conflict resolution protocol that ensures data consistency between offline branches when they eventually reconnect."
           />
           <TechItem 
             icon={ShieldCheck} 
             title="PostgreSQL Mirror" 
             desc="Optional enterprise-tier mirroring to hosted PostgreSQL instances for centralized business intelligence and reporting."
           />
        </div>
      </section>

      {/* Section 4: Feature Deep Dives */}
      <section className="py-16 sm:py-32 space-y-24 sm:space-y-48 px-6">
        {/* ROW 1: Ledger */}
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <div className="order-2 lg:order-1">
            <div className="inline-block px-3 py-1 bg-electric-blue/10 border border-electric-blue/30 text-[10px] font-bold text-electric-blue uppercase tracking-widest mb-6">
              Core Accounting
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tightest mb-8">
              Double-entry Khata Management.
            </h2>
            <p className="text-base sm:text-lg text-slate-400 mb-10 leading-relaxed font-medium">
              Every transaction — sale, purchase, payroll, advance — recorded with debit and credit entries. 
              Trial balance stays accurate in real time. Posted entries are immutable. No editing history.
            </p>
            <div className="space-y-4">
              {[
                "Audit-ready Trial Balance and P&L",
                "Automated tax return filing (GST/VAT)",
                "Reversal entries — never delete posted records"
              ].map((bullet, i) => (
                <div key={i} className="flex items-center space-x-3 text-sm font-bold text-white/80">
                  <Check className="w-5 h-5 text-electric-blue shrink-0" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2 w-full">
             <LedgerVisual />
          </div>
        </div>

        {/* ROW 2: Payroll */}
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <div className="w-full">
            <PayrollVisual />
          </div>
          <div>
            <div className="inline-block px-3 py-1 bg-sandstone-gold/10 border border-sandstone-gold/30 text-[10px] font-bold text-sandstone-gold uppercase tracking-widest mb-6">
              Workforce Management
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tightest mb-8">
              Industrial Workforce Payroll.
            </h2>
            <p className="text-base sm:text-lg text-slate-400 mb-10 leading-relaxed font-medium">
              Piece-rate, daily, and monthly wages calculated from production logs. 
              Peshgi (advance) deductions automated per period. Pay slips generated and optionally sent via WhatsApp.
            </p>
            <div className="space-y-4">
              {[
                "Automatic pay slips sent via WhatsApp (Elite)",
                "Deduction logic for EOBI and Social Security",
                "Karigar performance rankings and efficiency scoring"
              ].map((bullet, i) => (
                <div key={i} className="flex items-center space-x-3 text-sm font-bold text-white/80">
                  <Check className="w-5 h-5 text-sandstone-gold shrink-0" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ROW 3: CCTV */}
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <div className="order-2 lg:order-1">
            <div className="inline-block px-3 py-1 bg-critical-red/10 border border-critical-red/30 text-[10px] font-bold text-critical-red uppercase tracking-widest mb-6">
              Security Intelligence
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tightest mb-8">
              AI-Assisted Sentinel Monitoring.
            </h2>
            <p className="text-base sm:text-lg text-slate-400 mb-10 leading-relaxed font-medium">
              Connect RTSP cameras from any brand. The Python-based vision engine detects persons, fire, 
              and material breach in defined zones. Alerts push to mobile devices instantly via the mesh network.
            </p>
            <div className="space-y-4">
              {[
                "SSD MobileNet V2 detection — 65% confidence threshold",
                "Custom restricted zone polygon drawing",
                "HMAC-signed mobile alerts — cannot be spoofed"
              ].map((bullet, i) => (
                <div key={i} className="flex items-center space-x-3 text-sm font-bold text-white/80">
                  <Check className="w-5 h-5 text-critical-red shrink-0" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2 w-full">
            <CCTVVisual />
          </div>
        </div>
      </section>

      {/* ROW 4: Mobile Bridge */}
      <section className="py-16 sm:py-32 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
           <div className="relative flex justify-center items-center overflow-visible w-full py-8">
              <div className="absolute w-[300px] h-[300px] bg-electric-blue/10 blur-[100px] rounded-full" />
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 relative z-10 scale-[0.8] xs:scale-90 sm:scale-100 transition-transform">
                 {/* Phone Mockup */}
                 <div className="w-32 h-64 bg-[#1A1D21] border-2 border-white/10 rounded-xl p-3 shadow-2xl relative shrink-0">
                    <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-4" />
                    <div className="space-y-2">
                       <div className="h-10 bg-electric-blue/10 border border-electric-blue/20 flex items-center justify-center">
                          <Eye size={16} className="text-electric-blue animate-pulse" />
                       </div>
                       <div className="h-4 w-2/3 bg-white/5 rounded-full" />
                       <div className="h-4 w-full bg-white/5 rounded-full" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-emerald p-1 rounded-full animate-bounce">
                       <Radio size={12} className="text-black" />
                    </div>
                 </div>
                 
                 {/* Connector (Dynamic Line and Label) */}
                 <div className="flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-4 shrink-0">
                    <div className="w-12 sm:w-px h-px sm:h-12 bg-gradient-to-r sm:bg-gradient-to-b from-transparent via-electric-blue to-transparent" />
                    <span className="text-[9px] font-black text-electric-blue uppercase tracking-widest bg-electric-blue/10 px-2.5 py-1 border border-electric-blue/30 whitespace-nowrap">
                       5KM Mesh Network
                    </span>
                    <div className="w-12 sm:w-px h-px sm:h-12 bg-gradient-to-r sm:bg-gradient-to-b from-transparent via-electric-blue to-transparent" />
                 </div>
                 
                 {/* Tablet/Ledger Card Mockup */}
                 <div className="w-48 h-32 bg-[#1A1D21] border-2 border-white/10 rounded-sm p-4 shadow-2xl relative shrink-0">
                    <div className="flex space-x-1 mb-4">
                       <div className="w-2 h-2 rounded-full bg-white/5" />
                       <div className="w-2 h-2 rounded-full bg-white/5" />
                    </div>
                    <div className="space-y-2">
                       <div className="h-3 w-full bg-white/5 rounded-full" />
                       <div className="h-3 w-2/3 bg-white/5 rounded-full" />
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="space-y-8">
              <div className="inline-block px-3 py-1 bg-emerald/10 border border-emerald/30 text-[10px] font-bold text-emerald uppercase tracking-widest mb-6">
                Mobile Connectivity
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tightest leading-tight">
                Noxis Mobile Bridge.<br />
                <span className="text-slate-600 italic">Control your factory from your pocket.</span>
              </h2>
              <p className="text-base sm:text-lg text-slate-400 mb-10 leading-relaxed font-medium">
                Our proprietary mesh protocol allows your mobile devices to communicate with the Central Hub over local Wi-Fi. 
                Get instant CCTV alerts, scan barcodes, and authorize payroll payments without a cellular data plan.
              </p>
              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">P2P Broadcaster</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed">Direct node-to-node communication with 0.4ms latency.</p>
                 </div>
                 <div className="space-y-2">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Biometric Auth</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed">Use FaceID or Fingerprint to sign critical financial records.</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Section 5: Industry Matrix */}
      <section className="py-20 sm:py-32 px-6 bg-[#1A1D21]/50 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 sm:mb-24">
             <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tightest mb-4">Works for your industry.</h2>
             <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] sm:text-[11px]">Bespoke Logic for 26 Industrial Sectors</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 border border-white/5">
            {INDUSTRIES.map((ind, i) => (
              <div key={i} className="bg-[#121417] p-6 sm:p-8 hover:bg-[#1A1D21] transition-colors group relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <h4 className="text-sm font-bold text-white leading-tight pr-4">{ind.name}</h4>
                  <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-electric-blue transition-colors group-hover:translate-x-1 shrink-0" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {ind.tags.map((tag, j) => (
                    <span key={j} className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border rounded-full ${
                      ind.detailed ? 'bg-electric-blue/5 border-electric-blue/20 text-electric-blue/80' : 'bg-white/5 border-white/10 text-slate-500'
                    }`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Pricing Preview */}
      <section id="pricing" className="py-20 sm:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 sm:mb-16 gap-6 sm:gap-8">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tightest mb-4">Enterprise Grade Pricing.</h2>
              <p className="text-slate-400 font-medium text-sm sm:text-base">Transparent, flat-rate licensing. No per-user fees.</p>
            </div>
            
            <div className="bg-[#1A1D21] p-1 border border-white/10 flex shrink-0">
              <button 
                onClick={() => setCurrency('PKR')}
                className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${currency === 'PKR' ? 'bg-electric-blue text-[#121417]' : 'text-slate-500 hover:text-white'}`}
              >
                PKR
              </button>
              <button 
                onClick={() => setCurrency('USD')}
                className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${currency === 'USD' ? 'bg-electric-blue text-[#121417]' : 'text-slate-500 hover:text-white'}`}
              >
                USD
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {/* LITE */}
            <div className="bg-[#1A1D21] border border-white/5 p-8 sm:p-12 flex flex-col hover:border-white/20 transition-all">
              <div className="mb-12">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2">Lite</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{currency}</span>
                  <span className="text-4xl sm:text-5xl font-mono font-black text-white tracking-tighter">
                    {PRICING[currency].lite}
                  </span>
                  <span className="text-xs text-slate-500">/mo</span>
                </div>
              </div>
              <ul className="space-y-5 mb-12 flex-1">
                {[
                  "Up to 5 mobile devices",
                  "Up to 2 security cameras",
                  "10 document scans per day",
                  "WhatsApp sharing (manual)",
                  "1GB document storage",
                ].map((f, i) => (
                  <li key={i} className="flex items-center space-x-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    <div className="w-1 h-1 bg-white/20 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full bg-white/5 border border-white/10 py-5 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all mt-auto">
                Acquire License
              </button>
            </div>

            {/* PRO */}
            <div className="bg-[#1A1D21] border border-electric-blue/40 p-8 sm:p-12 flex flex-col relative shadow-[0_0_50px_rgba(96,165,250,0.1)] sm:scale-105 z-10 transition-all">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-electric-blue text-[#121417] text-[10px] font-black uppercase px-6 py-2 tracking-widest whitespace-nowrap">
                Best Value
              </div>
              <div className="mb-12 mt-4 sm:mt-0">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2">Pro</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{currency}</span>
                  <span className="text-4xl sm:text-5xl font-mono font-black text-white tracking-tighter">
                    {PRICING[currency].pro}
                  </span>
                  <span className="text-xs text-slate-500">/mo</span>
                </div>
              </div>
              <ul className="space-y-5 mb-12 flex-1">
                {[
                  "Up to 15 mobile devices",
                  "Up to 8 security cameras with AI detection",
                  "Unlimited document scans",
                  "Scheduled WhatsApp summaries",
                  "Up to 5 staff users",
                  "10GB document storage",
                ].map((f, i) => (
                  <li key={i} className="flex items-center space-x-3 text-[11px] font-bold text-white uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 bg-electric-blue shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full bg-electric-blue text-[#121417] py-5 text-[11px] font-black uppercase tracking-[0.2em] hover:brightness-110 shadow-[0_0_30px_rgba(96,165,250,0.4)] transition-all mt-auto">
                Get Started
              </button>
            </div>

            {/* ELITE */}
            <div className="bg-[#121417] border border-sandstone-gold/30 p-8 sm:p-12 flex flex-col">
              <div className="mb-12">
                <h3 className="text-sm font-black text-sandstone-gold uppercase tracking-widest mb-2">Enterprise / Elite</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{currency}</span>
                  <span className="text-4xl sm:text-5xl font-mono font-black text-white tracking-tighter">
                    {PRICING[currency].elite}
                  </span>
                  <span className="text-xs text-slate-500">/mo</span>
                </div>
              </div>
              <ul className="space-y-5 mb-12 flex-1">
                {[
                  "Up to 50 mobile devices",
                  "Up to 20 security cameras",
                  "All Pro features",
                  "Up to 25 staff users",
                  "Fire and intrusion detection",
                  "50GB document storage",
                  "Priority support",
                ].map((f, i) => (
                  <li key={i} className="flex items-center space-x-3 text-[11px] font-bold text-slate-300 uppercase tracking-widest">
                    <Check className="w-3 h-3 text-sandstone-gold shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full bg-sandstone-gold/10 border border-sandstone-gold/20 text-sandstone-gold py-5 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-sandstone-gold/20 transition-all mt-auto">
                Contact Enterprise Sales
              </button>
            </div>
          </div>
          
          <div className="mt-12 text-center">
             <p className="text-[10px] font-bold text-electric-blue uppercase tracking-[0.3em]">
               Save 2 months with annual billing
             </p>
          </div>
        </div>
      </section>

      {/* Section 6.5: Contact Form */}
      <section id="contact" className="py-20 sm:py-32 px-6 bg-[#121417]/50 border-t border-white/5 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.03)_0%,transparent_60%)] pointer-events-none" />
        <div className="max-w-xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-block px-3 py-1 bg-electric-blue/10 border border-electric-blue/30 text-[10px] font-bold text-electric-blue uppercase tracking-widest mb-6">
              Get in Touch
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tightest mb-4">
              Request a Live Demo
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              Want to deploy Noxis Hub offline on your factory LAN? Send us a message and our engineers will get back to you within 24 hours.
            </p>
          </div>
          
          <ContactForm />
        </div>
      </section>

      {/* Section 7: Footer */}
      <footer className="bg-[#121417] border-t border-white/5 pt-20 sm:pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 sm:gap-16 mb-20 sm:mb-24">
          <div>
            <h5 className="text-[11px] font-black text-white uppercase tracking-widest mb-6 sm:mb-8">Product</h5>
            <ul className="space-y-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/docs?source=website" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="/download" className="hover:text-white transition-colors">Download Hub</Link></li>
              <li><Link href="/releases" className="hover:text-white transition-colors">Release Notes</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-[11px] font-black text-white uppercase tracking-widest mb-6 sm:mb-8">Legal</h5>
            <ul className="space-y-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <li><Link href="/privacy?source=website" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/license" className="hover:text-white transition-colors">License Agreement</Link></li>
              <li><Link href="/gdpr" className="hover:text-white transition-colors">GDPR Compliance</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-[11px] font-black text-white uppercase tracking-widest mb-6 sm:mb-8">Support</h5>
            <ul className="space-y-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <li><Link href="/docs?source=website" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="#contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><span className="text-white/20">WhatsApp Support (Elite)</span></li>
            </ul>
          </div>
          <div>
            <h5 className="text-[11px] font-black text-white uppercase tracking-widest mb-6 sm:mb-8">Company</h5>
            <ul className="space-y-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <li><Link href="/about" className="hover:text-white transition-colors">About Omnora Labs</Link></li>
              <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              <li className="flex items-center space-x-2">
                <span>Built in Pakistan</span>
                <span>🇵🇰</span>
              </li>
              <li>Serving UAE · UK · Global</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6">
             <Image src="/logos/omnoralabs.png" alt="Omnora Labs" width={80} height={40} className="object-contain opacity-40 hover:opacity-100 transition-opacity" />
             <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center">© 2024 Omnora Labs. Noxis v13.0</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
             <div className="flex items-center space-x-2">
                <ShieldCheck className="w-3 h-3 text-emerald/50 shrink-0" />
                <span>TLS 1.3 Encrypted</span>
             </div>
             <div className="flex items-center space-x-2">
                <WifiOff className="w-3 h-3 text-electric-blue/50 shrink-0" />
                <span>Offline-First</span>
             </div>
             <span>Open Protocol (NSP)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const ContactForm = () => {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [formData, setFormData] = useState({
    name: "",
    factory: "",
    email: "",
    phone: "",
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
        setFormData({ name: "", factory: "", email: "", phone: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#1A1D21] border border-white/10 p-8 sm:p-12 rounded-sm space-y-6 shadow-2xl relative overflow-hidden">
      {status === "success" ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald/10 border border-emerald/20 text-emerald flex items-center justify-center rounded-full text-2xl">
            ✓
          </div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight">Demo Request Received</h3>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-semibold">
            Thank you! Your information has been successfully transmitted via Formspree. Our systems engineer will contact you shortly to coordinate your offline LAN setup.
          </p>
          <button 
            type="button" 
            onClick={() => setStatus("idle")} 
            className="text-[10px] font-black text-electric-blue uppercase tracking-widest hover:underline pt-4"
          >
            Send another inquiry
          </button>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#121417] border border-white/10 focus:border-electric-blue focus:outline-none px-4 py-3 text-xs text-white uppercase tracking-wider font-semibold rounded-none transition-colors"
                placeholder="IMRAN KHAN"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Factory / Company</label>
              <input
                type="text"
                required
                value={formData.factory}
                onChange={(e) => setFormData({ ...formData, factory: e.target.value })}
                className="w-full bg-[#121417] border border-white/10 focus:border-electric-blue focus:outline-none px-4 py-3 text-xs text-white uppercase tracking-wider font-semibold rounded-none transition-colors"
                placeholder="OMNORA TEXTILES"
              />
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#121417] border border-white/10 focus:border-electric-blue focus:outline-none px-4 py-3 text-xs text-white font-mono rounded-none transition-colors"
                placeholder="inquiry@omnora.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Phone / WhatsApp</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#121417] border border-white/10 focus:border-electric-blue focus:outline-none px-4 py-3 text-xs text-white font-mono rounded-none transition-colors"
                placeholder="+92 300 1234567"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Message / System Requirements</label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-[#121417] border border-white/10 focus:border-electric-blue focus:outline-none px-4 py-3 text-xs text-white tracking-wider rounded-none transition-colors resize-none"
              placeholder="SPECIFY YOUR ESTIMATED BATCH COUNT, LAN COVERAGE AREA, OR SECURITY CAMERA QUANTITY..."
            />
          </div>

          {status === "error" && (
            <div className="text-[10px] font-black text-critical-red uppercase tracking-widest bg-critical-red/5 p-3 border border-critical-red/20 text-center">
              ⚠️ An error occurred sending your message. Please try again or WhatsApp support directly.
            </div>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full bg-electric-blue text-[#121417] py-5 font-black uppercase tracking-[0.2em] hover:scale-[1.02] disabled:opacity-50 transition-transform cursor-pointer"
          >
            {status === "submitting" ? "Transmitting..." : "Submit Inquiry"}
          </button>
        </>
      )}
    </form>
  );
};

function PainItem({ title, desc, pain }: { title: string, desc: string, pain: string }) {
  return (
    <div className="flex items-start space-x-4 sm:space-x-6 group">
      <div className="p-4 bg-white/5 border border-white/5 text-gray-500 group-hover:text-critical-red transition-all shrink-0">
         <ArrowUpRight size={18} />
      </div>
      <div>
        <div className="flex items-center space-x-3 mb-1 flex-wrap gap-y-1">
          <h4 className="text-xs font-black text-white uppercase tracking-widest">{title}</h4>
          <span className="text-[8px] font-black text-critical-red bg-critical-red/10 px-2 py-0.5 rounded-full">{pain}</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed font-medium max-w-sm">{desc}</p>
      </div>
    </div>
  );
}

function TechItem({ icon: Icon, title, desc }: { icon: React.ComponentType<{ size?: number | string }>, title: string, desc: string }) {
  return (
    <div className="bg-[#121417] p-6 sm:p-12 space-y-6 hover:bg-[#1A1D21] transition-all group border-b md:border-b-0 md:border-r border-white/5 last:border-b-0 last:border-r-0">
      <div className="p-4 bg-white/5 w-fit border border-white/5 text-gray-500 group-hover:text-electric-blue transition-colors">
        <Icon size={24} />
      </div>
      <h4 className="text-lg font-black text-white uppercase tracking-tight">{title}</h4>
      <p className="text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}
