"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
import { 
  Shield, Terminal, Cpu, Database, Mail, 
  Sparkles, Code2, Layers, Smartphone, 
  ArrowRight, Info, Zap, Network, Eye, 
  ChevronDown, ChevronUp, CheckCircle2, HardDrive
} from "lucide-react";
import { SectionReveal, FloatingOrb, GlowCard } from "@/components/ui/AnimatedComponents";
import PublicNavbar from '@/components/shell/PublicNavbar';

const BUILD_DATE = new Date().toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
});

export default function AboutPage() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <div className="bg-[#030712] text-white font-sans min-h-screen selection:bg-[#08EBF6]/30 selection:text-white overflow-x-hidden relative flex flex-col justify-between">
      
      {/* Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#5FA5FA] via-[#08EBF6] to-[#FFFFFF] z-[100] origin-left shadow-[0_0_10px_#08EBF6]"
        style={{ scaleX }}
      />

      {/* Background Decorative Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <FloatingOrb color="rgba(8,235,246,0.05)" size={700} x="10%" y="15%" delay={0} blur={140} />
        <FloatingOrb color="rgba(95,165,250,0.03)" size={600} x="85%" y="60%" delay={3} blur={130} />
      </div>

      <PublicNavbar />

      <main className="relative z-10 flex-1 pt-36 pb-28 px-6 max-w-6xl mx-auto w-full flex flex-col space-y-28">
        
        {/* Section 1: Core System Architecture */}
        <SectionReveal className="text-center flex flex-col items-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 border border-[#08EBF6]/30 bg-[#08EBF6]/10 mb-2">
            <Sparkles size={12} className="text-[#08EBF6]" />
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-[#08EBF6]">
              System Architecture & Core Specifications
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-none uppercase max-w-4xl">
            LOCAL-FIRST INDUSTRIAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#08EBF6] via-white to-[#5FA5FA]">ERP ENGINE</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-normal">
            Noxis Hub runs locally on your PC hard drive and office Wi-Fi network. It handles piece-rate Karigar wage calculations, yarn and fabric inventory tracking, and on-site RTSP camera streams without requiring an active internet connection.
          </p>
          <div className="text-[10px] text-gray-400 font-mono tracking-widest uppercase flex items-center gap-3">
            <span>CORE: v13.0-STABLE</span>
            <span>•</span>
            <span>COMPILED: {BUILD_DATE}</span>
          </div>
        </SectionReveal>

        {/* Section 2: Technical Metrics */}
        <SectionReveal delay={0.05}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
            <StatCard value="Offline" label="Network Dependency" sub="Runs Without Internet" />
            <StatCard value="SQLite" label="Primary Storage" sub="Local Database on Hard Drive" />
            <StatCard value="Office Wi-Fi" label="Mobile Connection" sub="Direct LAN Socket Streaming" />
            <StatCard value="RTSP / IP" label="Camera Video" sub="On-Premise Stream Decoding" />
          </div>
        </SectionReveal>

        {/* Section 3: Engineering Specifications */}
        <SectionReveal delay={0.1}>
          <div className="border border-white/10 p-8 md:p-12 rounded-xl bg-[#090A0E]/80 backdrop-blur-md relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-[#08EBF6] font-mono flex items-center gap-2">
                  <Zap size={14} />
                  Fault-Tolerant Floor Engineering
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Industrial manufacturing environments experience frequent power disruptions, electrical noise, and unstable ISP infrastructure. Cloud-dependent ERP software freezes or drops uncommitted records during internet drops.
                </p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Noxis writes directly to your hard drive using SQLite with Write-Ahead Logging (WAL). Mobile floor supervisor phones synchronize production entries across your office Wi-Fi router. If internet or power cuts out, your data remains safe and available on your local computer.
                </p>
              </div>
              <div className="lg:col-span-4 bg-[#030406] border border-white/10 p-6 rounded-lg space-y-3 font-mono">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-white">System Invariants</h3>
                <ul className="space-y-2.5 text-[11px] text-gray-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-[#08EBF6] shrink-0 mt-0.5" />
                    <span>Zero cloud lockouts on trade ledgers.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-[#08EBF6] shrink-0 mt-0.5" />
                    <span>Local master node serves floor clients.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-[#08EBF6] shrink-0 mt-0.5" />
                    <span>Raw frames processed in local memory.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </SectionReveal>

        {/* Section 4: Network Topology & IPC Pipeline */}
        <SectionReveal delay={0.15} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Network size={16} className="text-[#08EBF6]" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-300 font-mono">Network Topology</h3>
            </div>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded">
              Topology: Master-to-Edge Sync
            </span>
          </div>

          <div className="bg-[#050608] border border-white/10 rounded-xl p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
              <SchematicNode 
                title="Android Edge Client" 
                subtitle="Supervisor Device" 
                details="React Native / SQLite Mirror" 
                desc="Logs piece-rate actions, inventory transfers, and worker attendance directly via local AP."
                icon={Smartphone}
                color="border-[#08EBF6]/30 text-[#08EBF6] bg-[#08EBF6]/5"
              />

              <div className="hidden lg:flex flex-col items-center justify-center">
                <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mb-1">Local Socket</span>
                <div className="w-full h-[1px] bg-gradient-to-r from-[#08EBF6] to-[#5FA5FA] flex items-center justify-center">
                  <ArrowRight size={14} className="text-[#5FA5FA]" />
                </div>
                <span className="text-[8px] text-gray-500 font-mono mt-1">WS / JSON Delta</span>
              </div>

              <SchematicNode 
                title="PC Master Node" 
                subtitle="On-Premise Workstation" 
                details="Node.js Engine / SQLite Master" 
                desc="Maintains global application state, executes wage calculations, and hosts RTSP feed pipelines."
                icon={Cpu}
                color="border-[#5FA5FA]/30 text-[#5FA5FA] bg-[#5FA5FA]/5"
              />

              <div className="hidden lg:flex flex-col items-center justify-center">
                <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mb-1">Opt-In Sync</span>
                <div className="w-full h-[1px] bg-gradient-to-r from-[#5FA5FA] to-[#10B981] flex items-center justify-center">
                  <ArrowRight size={14} className="text-[#10B981]" />
                </div>
                <span className="text-[8px] text-gray-500 font-mono mt-1">TLS / Encrypted Snapshot</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div className="bg-[#0A0C10] border border-white/5 p-4 rounded-lg flex gap-3 items-start">
                <HardDrive size={18} className="text-[#08EBF6] shrink-0 mt-1" />
                <div className="space-y-1">
                  <h4 className="text-xs font-mono font-bold text-white uppercase">Primary Local Data Store</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Transactional records, Karigar ledger adjustments, and system audit logs write directly to disk via atomic commits.
                  </p>
                </div>
              </div>

              <div className="bg-[#0A0C10] border border-white/5 p-4 rounded-lg flex gap-3 items-start">
                <Database size={18} className="text-[#10B981] shrink-0 mt-1" />
                <div className="space-y-1">
                  <h4 className="text-xs font-mono font-bold text-white uppercase">Disaster Recovery Snapshots</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Encrypted remote synchronization runs asynchronously when WAN connection is detected. Deactivatable by the user.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SectionReveal>

        {/* Section 5: Engine Architecture Specs */}
        <SectionReveal delay={0.2} className="space-y-6">
          <div className="flex items-center space-x-2">
            <Layers size={16} className="text-[#08EBF6]" />
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-300 font-mono">Module Architecture</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PillarCard 
              icon={Network} 
              title="LAN Synchronization Bus" 
              desc="Runs an internal WebSocket server on the master machine. Floor clients query and dispatch payloads over local subnets without routing packets outside the firewall."
            />
            <PillarCard 
              icon={Shield} 
              title="Fixed-Precision Accounting Core" 
              desc="Float calculation rounding errors are eliminated using integer/fixed-precision arithmetic. Karigar piece-rates calculate accurately against actual delivery manifests and weighbridge scale readings."
            />
            <PillarCard 
              icon={Eye} 
              title="On-Site RTSP Video Stream Pipeline" 
              desc="Connect up to 6 on-site IP cameras via RTSP. Draw boundary tripwires to alert staff when restricted inventory areas are accessed without third-party cloud fees."
            />
          </div>
        </SectionReveal>

        {/* Section 6: Systems Engineering Lead */}
        <SectionReveal delay={0.25} className="space-y-6">
          <div className="flex items-center space-x-2">
            <Terminal size={16} className="text-[#08EBF6]" />
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-300 font-mono">Engineering & Maintenance</h3>
          </div>
          
          <GlowCard 
            glowColor="rgba(8,235,246,0.05)"
            className="bg-[#0C0E12] border border-white/10 p-6 md:p-8 rounded-xl relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 rounded bg-[#08EBF6]/10 border border-[#08EBF6]/30 flex items-center justify-center text-xl font-bold font-mono text-[#08EBF6] shrink-0">
                AM
              </div>
              <div className="space-y-3 flex-1">
                <div>
                  <h4 className="text-lg font-bold text-white uppercase tracking-tight">Ahmad Mahboob</h4>
                  <p className="text-[11px] font-mono text-[#08EBF6] uppercase">Systems Architect & Lead Developer · Omnora</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Pill>Local-First Systems</Pill>
                  <Pill>Electron / Node Native Hooks</Pill>
                  <Pill>SQLite Database Architecture</Pill>
                  <Pill>RTSP Camera Streaming</Pill>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed font-mono">
                  Responsible for desktop runtime packaging, low-latency IPC bridges between the Electron main process and renderer, native database indexing, and local Wi-Fi device synchronization.
                </p>
              </div>
            </div>
          </GlowCard>
        </SectionReveal>

        {/* Section 7: Technical Specifications Table */}
        <SectionReveal delay={0.28} className="space-y-6">
          <div className="flex items-center space-x-2">
            <Code2 size={16} className="text-[#08EBF6]" />
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-300 font-mono">Technical Specifications</h3>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#08090C]">
            <table className="w-full text-left text-xs font-mono border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-white/10 bg-[#040507]">
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Subsystem</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-200">Specification / Protocol</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Implementation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <SpecRow param="Persistence Layer" detail="Embedded relational database with WAL enabled" tech="SQLite 3.x" />
                <SpecRow param="Local Network Protocol" detail="Bidirectional local event streaming over office Wi-Fi" tech="ws / TCP Sockets" />
                <SpecRow param="Vision Frame Pipeline" detail="Decoded RTSP byte arrays via hardware acceleration" tech="OpenCV / WebAssembly" />
                <SpecRow param="Desktop Container" detail="Standalone isolated renderer with secure preload bridges" tech="Electron / Node.js" />
                <SpecRow param="State Management" detail="Normalized unidirectional in-memory store" tech="Zustand / Reactive Store" />
                <SpecRow param="Backup System" detail="Encrypted snapshots stored locally or synced over TLS 1.3" tech="AES-256 Encrypted Sync" />
              </tbody>
            </table>
          </div>
        </SectionReveal>

        {/* Section 8: FAQ */}
        <SectionReveal delay={0.3} className="space-y-6">
          <div className="flex items-center space-x-2">
            <Info size={16} className="text-[#08EBF6]" />
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-300 font-mono">Engineering FAQ</h3>
          </div>

          <div className="space-y-3">
            <FaqItem 
              question="What happens when the local master workstation loses power?"
              answer="Transactions write directly to disk using atomic commits. If a sudden power cut occurs, unwritten frame buffers or uncommitted socket packets are rolled back to the last stable transaction boundary upon boot, preventing corrupted databases."
            />
            <FaqItem 
              question="Does the mobile companion app require an internet data package?"
              answer="No. As long as the mobile device is connected to the same Wi-Fi router or access point as the PC workstation, data transmits through the local subnet. It does not hit external cellular networks or WAN gateways."
            />
            <FaqItem 
              question="How are CCTV feeds captured and analyzed locally?"
              answer="Noxis establishes an on-premise RTSP handshake with local NVR/DVR units or IP cameras. Decoded video frames are inspected on the local machine's processor. Video feeds never egress outside the local network."
            />
          </div>
        </SectionReveal>

        {/* Section 9: Support & Ticket */}
        <SectionReveal delay={0.32} className="pt-8 border-t border-white/10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4 font-mono">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">System Logs & Inquiries</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                For custom hardware adapters, IP camera stream configurations, or local network topology inquiries, file a ticket directly.
              </p>
              <div className="space-y-1 text-[11px] text-gray-500">
                <p>© 2026 Omnora. All systems documented.</p>
                <p>Noxis Hub Architecture Manifest.</p>
              </div>
            </div>
            
            <div>
              <SupportForm />
            </div>
          </div>
        </SectionReveal>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#020304] py-12 px-6 relative z-10 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wider text-white">NOXIS HUB</span>
            <span className="text-xs text-gray-500">by Omnora</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-400">
            {['Download', 'Pricing', 'Docs', 'Privacy', 'About'].map((item) => (
              <Link key={item} href={`/${item.toLowerCase()}`} className="hover:text-white transition-colors">
                {item}
              </Link>
            ))}
          </div>

          <p className="text-xs text-gray-500">
            © 2026 Omnora. Built for localized production.
          </p>
        </div>
      </footer>

    </div>
  );
}

function StatCard({ value, label, sub }: { value: string, label: string, sub: string }) {
  return (
    <div className="bg-[#090A0E] border border-white/10 p-5 rounded-lg text-center hover:border-[#08EBF6]/30 transition-all">
      <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-[11px] font-bold text-gray-300 uppercase tracking-wider mt-1">{label}</p>
      <p className="text-[9px] text-gray-500 mt-0.5 uppercase">{sub}</p>
    </div>
  );
}

function SchematicNode({ title, subtitle, details, desc, icon: Icon, color }: { title: string, subtitle: string, details: string, desc: string, icon: any, color: string }) {
  return (
    <div className={`p-5 border rounded-lg space-y-3 relative ${color} flex-1 font-mono`}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-xs font-bold uppercase text-white">{title}</h4>
          <p className="text-[10px] text-gray-400 uppercase">{subtitle}</p>
        </div>
        <div className="p-1.5 bg-white/5 border border-white/10 rounded">
          <Icon size={14} />
        </div>
      </div>
      <div className="text-[10px] text-gray-400 bg-black/40 px-2 py-0.5 rounded border border-white/5">{details}</div>
      <p className="text-[11px] text-gray-400 leading-normal font-sans">{desc}</p>
    </div>
  );
}

function PillarCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-[#090A0E] border border-white/10 p-5 rounded-lg space-y-3 hover:border-white/20 transition-colors">
      <div className="p-2 bg-white/5 border border-white/10 rounded-md w-10 h-10 flex items-center justify-center text-[#08EBF6]">
        <Icon size={18} />
      </div>
      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">{title}</h4>
      <p className="text-xs text-gray-400 leading-relaxed font-sans">{desc}</p>
    </div>
  );
}

function SpecRow({ param, detail, tech }: { param: string, detail: string, tech: string }) {
  return (
    <tr className="hover:bg-white/[0.02] transition-colors">
      <td className="p-3.5 font-bold text-white text-[11px] tracking-wide">{param}</td>
      <td className="p-3.5 text-gray-300 text-[11px]">{detail}</td>
      <td className="p-3.5 text-[#08EBF6] text-[10px]">{tech}</td>
    </tr>
  );
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-[#090A0E] border border-white/10 rounded-lg overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-xs text-white uppercase tracking-wider focus:outline-none"
      >
        <span>{question}</span>
        {isOpen ? <ChevronUp size={14} className="text-[#08EBF6]" /> : <ChevronDown size={14} className="text-gray-500" />}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 pt-1 border-t border-white/5 text-xs text-gray-400 leading-relaxed">
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
    <span className="px-2.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-mono font-medium text-gray-300">
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
    subject: "Technical Inquiry",
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
        setFormData({ name: "", email: "", phone: "", subject: "Technical Inquiry", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#0C0E12] border border-white/10 p-5 rounded-lg space-y-3 font-mono">
      <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center">
        <Mail size={13} className="text-[#08EBF6] mr-2" />
        Technical Query Transmission
      </h4>

      {status === "success" ? (
        <div className="py-4 text-center space-y-2">
          <div className="w-8 h-8 mx-auto bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center rounded-full text-xs">
            ✓
          </div>
          <p className="text-[10px] text-gray-400 uppercase">Payload Delivered</p>
          <button 
            type="button" 
            onClick={() => setStatus("idle")} 
            className="text-[9px] text-[#08EBF6] uppercase hover:underline"
          >
            Submit Another
          </button>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[8px] text-gray-500 uppercase">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#030406] border border-white/10 focus:border-[#08EBF6] px-2.5 py-1.5 text-[10px] text-white outline-none rounded"
                placeholder="Ident"
              />
            </div>
            <div>
              <label className="text-[8px] text-gray-500 uppercase">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#030406] border border-white/10 focus:border-[#08EBF6] px-2.5 py-1.5 text-[10px] text-white outline-none rounded"
                placeholder="contact@endpoint"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[8px] text-gray-500 uppercase">Contact / Wire</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#030406] border border-white/10 focus:border-[#08EBF6] px-2.5 py-1.5 text-[10px] text-white outline-none rounded"
                placeholder="+92..."
              />
            </div>
            <div>
              <label className="text-[8px] text-gray-500 uppercase">Target Pipeline</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-[#030406] border border-white/10 focus:border-[#08EBF6] px-2.5 py-1.5 text-[10px] text-white outline-none rounded"
              >
                <option value="Technical Inquiry">Technical Inquiry</option>
                <option value="Local Deployment">Local Deployment</option>
                <option value="Bug / Error Dump">Bug / Error Dump</option>
                <option value="CCTV RTSP Integration">CCTV RTSP Integration</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[8px] text-gray-500 uppercase">Payload Details</label>
            <textarea
              required
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-[#030406] border border-white/10 focus:border-[#08EBF6] px-2.5 py-1.5 text-[10px] text-white outline-none rounded resize-none"
              placeholder="Specify hardware parameters, errors, or environment configurations..."
            />
          </div>

          {status === "error" && (
            <div className="text-[9px] text-[#EF4444] bg-[#EF4444]/10 p-2 border border-[#EF4444]/20 text-center rounded">
              Transmission error. Retry or transmit directly to omnora@noxis.app
            </div>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full bg-[#08EBF6] text-black py-2.5 text-[10px] font-bold uppercase tracking-wider hover:bg-[#5FA5FA] transition-colors rounded disabled:opacity-50"
          >
            {status === "submitting" ? "Transmitting..." : "Dispatch Packet"}
          </button>
        </>
      )}
    </form>
  );
};