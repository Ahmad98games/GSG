"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Cloud, Globe, Cpu, ShieldAlert, Mail, ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// --- Types ---
interface PrivacySection {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}

export default function PrivacyPolicyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07080A] flex items-center justify-center text-gray-500 uppercase tracking-widest text-[10px] font-mono">Loading Security Protocols...</div>}>
      <PrivacyContent />
    </Suspense>
  );
}

function PrivacyContent() {
  const searchParams = useSearchParams();
  const source = searchParams.get('source');
  const [activeSection, setActiveSection] = useState('custody');
  
  const returnHref = source === 'hub' ? '/dashboard' : '/';
  const returnLabel = source === 'hub' ? 'Return to Hub' : 'Back to Home';

  const sections: PrivacySection[] = [
    {
      id: "custody",
      icon: <Lock className="w-4 h-4" />,
      title: "1. Zero-Knowledge Local Custody",
      content: (
        <div className="space-y-4">
          <p>
            Noxis Hub operates under a strict Zero-Knowledge paradigm. All primary transaction records, worker ledgers (Khata), cashflow journals, and inventory metrics are written directly to your physical workstation partition.
          </p>
          <p className="text-slate-400">
            Omnora Labs does not operate server-side data extraction or global profiling engines. We have zero remote access vectors, zero backdoor privileges, and zero custody of your operational databases.
          </p>
        </div>
      )
    },
    {
      id: "sync",
      icon: <Cloud className="w-4 h-4" />,
      title: "2. Cloud Replicator & Telemetry",
      content: (
        <div className="space-y-4">
          <p>
            When cloud synchronization features are explicitly enabled, the Noxis Replicator engine periodically pushes database write-ahead log (WAL) records to the Supabase network cloud.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li><strong>Transit Encryption:</strong> All database replications utilize TLS 1.3 cryptographic transport configurations.</li>
            <li><strong>Rest Encryption:</strong> Cloud hosting nodes protect customer tables using hardware-accelerated AES-256 block storage encryption.</li>
            <li><strong>Offline Lock:</strong> Disabling the sync component immediately stops all outbound packets. The application operates in a completely isolated local air-gapped system format.</li>
          </ul>
        </div>
      )
    },
    {
      id: "surveillance",
      icon: <Cpu className="w-4 h-4" />,
      title: "3. Sentinel AI & CCTV Streams",
      content: (
        <div className="space-y-4">
          <p>
            The Sentinel AI CCTV module processes RTSP video streams directly on your workstation hardware accelerators (such as CPU/GPU/NPU cores).
          </p>
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2">Local Memory Processing</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              No video frames, camera streams, employee facial hashes, or movement logs are ever transmitted to Omnora Labs or any third-party cloud infrastructure. Detections and safety check overlays are processed entirely in physical memory and logged directly onto your local SQLite database node.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "mesh",
      icon: <Globe className="w-4 h-4" />,
      title: "4. Node Pairing & Network Routing",
      content: (
        <div className="space-y-4">
          <p>
            Pairing between the workstation node and the Android mobile client utilizes a localized TCP/IP mesh bridge.
          </p>
          <p className="text-slate-400">
            All worker check-ins, barcode scans, and real-time inventory adjustments made via paired handheld devices route directly through your local office router. Network packets are signed with HMAC-SHA256 tokens to prevent local spoofing attacks, never traversing external public routers unless cloud sync is active.
          </p>
        </div>
      )
    },
    {
      id: "telemetry",
      icon: <ShieldAlert className="w-4 h-4" />,
      title: "5. License Handshakes & Analytics",
      content: (
        <div className="space-y-4">
          <p>
            To prevent software duplication and validate active trial allocations, the client executes a periodic cryptographic handshake check with the license verification server.
          </p>
          <p className="text-slate-400">
            This ping transmits basic operational telemetry only, restricted to: License Key validation, UUID hardware hashes, operating system platform tags, and application version identifiers. No operational ledger amounts, customer profiles, or stock logs are included in license check telemetry.
          </p>
        </div>
      )
    },
    {
      id: "erasure",
      icon: <Shield className="w-4 h-4" />,
      title: "6. Data Control & Partition Purging",
      content: (
        <div className="space-y-4">
          <p>
            Because you retain complete custody of your local workstation nodes, you maintain absolute data control.
          </p>
          <div className="p-4 bg-amber-500/5 border border-amber-500/10 text-slate-400 text-xs leading-relaxed rounded-sm">
            <strong className="text-white block mb-1">⚠️ HARDWARE PURGE DIRECTIVE</strong>
            You may instantly terminate your database records at any time. Deleting the local database folder and purging your browser or client cache will permanently erase your ledger files. If cloud synchronization was active, you must trigger a manual "Cloud Wipe" from the settings console to completely drop remote Supabase table entries.
          </div>
        </div>
      )
    },
    {
      id: "governance",
      icon: <Mail className="w-4 h-4" />,
      title: "7. Inquiries & Board Governance",
      content: (
        <div className="space-y-4">
          <p>
            For compliance queries, cryptographic audit reports, or specific data retention details, you can consult with the Omnora Labs governance board.
          </p>
          <p>
            Contact the engineering and security team directly at <a href="mailto:omnorainfo28@gmail.com" className="text-[#00E5FF] hover:underline font-mono">omnorainfo28@gmail.com</a>.
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
              <span className="text-[8px] text-gray-500 font-mono tracking-widest uppercase mt-0.5">Privacy & Security Protocols</span>
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
                <Shield size={16} className="text-[#C5A059]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">Security Sections</h3>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Our architecture guarantees absolute local ownership of all warehouse ledger details.
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
              <span>CIPHER MODE: SECURED</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-8 space-y-16 z-10">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest bg-[#C5A059]/10 border border-[#C5A059]/20 px-3 py-1 rounded-full">
                Zero-Knowledge Guarantee
              </span>
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none uppercase">
                Privacy <span className="text-[#C5A059]">Policy</span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
                Last updated on June 5, 2026. This policy lays down our data localization terms, zero-knowledge storage, local video telemetry rules, and licensing handshake parameters.
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
              <span>Noxis Core Security Policy v13.0</span>
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
