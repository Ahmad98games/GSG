"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Key, Cloud, ShieldAlert, Cpu, AlertCircle, HelpCircle, ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// --- Types ---
interface TermsSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}

export default function TermsOfServicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07080A] flex items-center justify-center text-gray-500 uppercase tracking-widest text-[10px] font-mono">Loading Terms & EULA...</div>}>
      <TermsContent />
    </Suspense>
  );
}

function TermsContent() {
  const searchParams = useSearchParams();
  const source = searchParams.get('source');
  const [activeSection, setActiveSection] = useState('agreement');
  
  const returnHref = source === 'hub' ? '/dashboard' : '/';
  const returnLabel = source === 'hub' ? 'Return to Hub' : 'Back to Home';

  const sections: TermsSection[] = [
    {
      id: "agreement",
      icon: <FileText className="w-4 h-4" />,
      title: "1. Acceptance of Terms",
      content: (
        <div className="space-y-4">
          <p>
            This End-User License Agreement (EULA) is a binding legal contract between you (either an individual or a registered corporate entity) and Omnora Labs. By downloading, deploying, or utilizing Noxis Hub, you agree to be bound by the terms of this agreement.
          </p>
          <p className="text-slate-400">
            If you do not agree to these terms, you are not authorized to install or use Noxis Hub. You must immediately delete all local binaries and terminate your workspace database nodes.
          </p>
        </div>
      )
    },
    {
      id: "licensing",
      icon: <Key className="w-4 h-4" />,
      title: "2. EULA & Trial Limitations",
      content: (
        <div className="space-y-4">
          <p>
            Noxis Hub is proprietary software licensed, not sold. Omnora Labs grants you a non-exclusive, non-transferable license to execute the software on authorized workstations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2">Evaluation (Trial) Mode</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Free trial licenses allow full evaluation for exactly 3 calendar days from node activation. Upon expiry, database write mutations are programmatically locked, transitioning the app to Read-Only mode.
              </p>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2">Commercial Licenses</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Standard and Enterprise tier deployments require an active, validated cryptographic license key. Unauthorized key sharing, redistribution, or reverse engineering of binaries is strictly prohibited.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "local-first",
      icon: <ShieldAlert className="w-4 h-4" />,
      title: "3. Local Node Custody & Password Loss",
      content: (
        <div className="space-y-4">
          <p>
            Noxis Hub runs on a decentralized Local-First Architecture. All database files (including SQLite write-ahead logs, local keys, and employee schemas) are stored directly on your physical hardware partition.
          </p>
          <div className="p-4 bg-amber-500/5 border border-amber-500/10 text-slate-400 text-xs leading-relaxed rounded-sm">
            <strong className="text-white block mb-1">⚠️ CRITICAL DATA NOTICE</strong>
            Omnora Labs does not maintain database backups, user passwords, or local encryption keys on cloud servers. If you lose your master database encryption password or local recovery keys, your data cannot be recovered. Regular external backups of the SQLite database are entirely your custody.
          </div>
        </div>
      )
    },
    {
      id: "cloud-sync",
      icon: <Cloud className="w-4 h-4" />,
      title: "4. Cloud Replicator & Backend Services",
      content: (
        <div className="space-y-4">
          <p>
            Optional multi-terminal synchronization and offsite backups are processed via Supabase cloud endpoints.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li>Data in transit is encrypted using TLS 1.3 protocols. Datastores at rest utilize AES-256 bit encryption.</li>
            <li>Operational availability, server uptime, and global routing tables are governed by Supabase's independent SLA guidelines.</li>
            <li>You can disable cloud sync at any time in settings to operate in a fully sandboxed offline air-gapped node mode.</li>
          </ul>
        </div>
      )
    },
    {
      id: "surveillance",
      icon: <Cpu className="w-4 h-4" />,
      title: "5. AI Sentinel CCTV & surveillance Ethics",
      content: (
        <div className="space-y-4">
          <p>
            Noxis Hub includes Sentinel AI modules for RTSP camera streaming, worker safety checks, and movement logging.
          </p>
          <p>
            All video feeds and neural network detections are processed strictly in memory on local hardware accelerators. No CCTV feeds are ever uploaded to cloud telemetry. You are legally responsible for complying with local employee disclosure and surveillance laws in your jurisdiction.
          </p>
        </div>
      )
    },
    {
      id: "warranty",
      icon: <AlertCircle className="w-4 h-4" />,
      title: "6. Warranty & Accounting Disclaimer",
      content: (
        <div className="space-y-4">
          <p>
            THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. Omnora Labs does not warrant that the operations will be uninterrupted or error-free.
          </p>
          <p className="text-slate-400">
            Noxis Hub provides operational calculations for raw materials, payroll wages, and ledgers. It does not replace certified tax advisors or professional legal bookkeeping. Always verify auto-generated financial reports before filing official tax logs.
          </p>
        </div>
      )
    },
    {
      id: "support",
      icon: <HelpCircle className="w-4 h-4" />,
      title: "7. Jurisdiction & Board Support",
      content: (
        <div className="space-y-4">
          <p>
            This EULA is governed by and construed in accordance with the corporate laws of Pakistan.
          </p>
          <p>
            Technical support SLA tiers, custom hardware driver integration, and billing disputes are managed by the Omnora Labs engineering board.
          </p>
        </div>
      )
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#040608] text-[#94A3B8] font-sans selection:bg-[#C5A059]/30 selection:text-white pb-32">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#C5A059]/[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#00E5FF]/[0.01] rounded-full blur-[120px]" />
      </div>

      {/* ═══ HEADER NAVIGATION ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#040608]/85 backdrop-blur-xl border-b border-white/[0.04] py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-8 h-8 flex items-center justify-center bg-white/5 group-hover:bg-[#C5A059]/10 border border-white/10 group-hover:border-[#C5A059]/30 rounded-sm transition-all">
              <img src="/logos/noxis.png" alt="Noxis Logo" width={20} height={20} className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-extrabold tracking-wider leading-none text-sm">NOXIS</span>
              <span className="text-[8px] text-gray-500 font-mono tracking-widest uppercase mt-0.5">EULA & Service Agreements</span>
            </div>
          </Link>

          <Link href={returnHref} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white flex items-center space-x-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{returnLabel}</span>
          </Link>
        </div>
      </nav>

      {/* ═══ MAIN LAYOUT ═══ */}
      <div className="max-w-7xl mx-auto px-6 pt-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left Sidebar Menu */}
          <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit space-y-6 z-10">
            <div className="bg-[#0A0D10] border border-white/[0.04] p-6 rounded-sm space-y-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[#C5A059]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">Document Sections</h3>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Please read this license agreement carefully before initiating your localized database nodes.
              </p>
              
              <div className="space-y-1 pt-2">
                {sections.map(section => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                      setActiveSection(section.id);
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
            
            <div className="bg-[#0A0D10] border border-white/[0.04] p-5 rounded-sm flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-widest text-slate-600">
              <span>STATUS: VALIDATED EULA</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-8 space-y-16 z-10">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest bg-[#C5A059]/10 border border-[#C5A059]/20 px-3 py-1 rounded-full">
                Legal Framework
              </span>
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none uppercase">
                Terms of <span className="text-[#C5A059]">Service</span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
                Last updated on June 5, 2026. This document governs node operations, license lifecycle policy, local encryption standards, and liabilities inside the Noxis Hub network.
              </p>
            </motion.div>

            <div className="space-y-16">
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="pt-12 border-t border-white/[0.05] scroll-mt-28">
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white tracking-tight uppercase flex items-center gap-3">
                      <span className="text-[#C5A059] font-mono text-sm">0{sections.indexOf(section) + 1}.</span>
                      {section.title.split('. ')[1]}
                    </h2>
                    <div className="text-sm text-[#94A3B8] leading-relaxed font-medium pl-6 border-l border-white/[0.02]">
                      {section.content}
                    </div>
                  </div>
                </section>
              ))}
            </div>

            {/* Footer */}
            <footer className="pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-slate-600">
              <span>Noxis Core EULA v13.0</span>
              <span>© {new Date().getFullYear()} Omnora Labs · Sandboxed Node Architecture</span>
            </footer>
          </div>

        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@700&display=swap');
        .font-sans { font-family: 'Outfit', sans-serif; }
        .font-mono { font-family: 'JetBrains+Mono', monospace; }
        body { background-color: #040608; }
      `}</style>
    </div>
  );
}
