"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Cloud, Globe, Cpu, AlertTriangle, Mail, ArrowLeft } from "lucide-react";
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

// --- Page Component ---

export default function PrivacyPolicyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-gray-500 uppercase tracking-widest text-[10px]">Loading Security Protocols...</div>}>
      <PrivacyContent />
    </Suspense>
  );
}

function PrivacyContent() {
  const searchParams = useSearchParams();
  const source = searchParams.get('source');
  
  const returnHref = source === 'hub' ? '/dashboard' : '/';
  const returnLabel = source === 'hub' ? 'Return to Hub' : 'Return to Home';

  const sections: PrivacySection[] = [
    {
      id: "intro",
      icon: <Shield className="w-5 h-5" />,
      title: "1. Introduction & Enterprise Entity",
      content: "Noxis Hub and the Noxis Core Ecosystem are proprietary assets owned and managed exclusively by Omnora Labs LLC. Registered Office: Lahore, Pakistan. We are committed to protecting the sensitive operational data of your business. This policy explains how data is handled within the Noxis ecosystem."
    },
    {
      id: "local",
      icon: <Lock className="w-5 h-5" />,
      title: "2. Data Localization Guarantee",
      content: (
        <>
          <p className="mb-2">Unlike standard SaaS tools, Noxis is built on a hardened Local-First Architecture with a strict Data Localization Guarantee.</p>
          <ul className="list-disc pl-5 space-y-2 text-gray-400">
            <li><strong className="text-gray-300">Data Localization Guarantee:</strong> Noxis Hub does not upload your factory's ledger balances, karigar files, or production volumes to external clouds. Your financial records are 100% sandboxed within your local SQLite/workstation partition.</li>
            <li><strong className="text-gray-300">No Access:</strong> Omnora Labs cannot access, view, or sell your local data. You have 100% ownership and physical control over your information.</li>
          </ul>
        </>
      )
    },
    {
      id: "cloud",
      icon: <Cloud className="w-5 h-5" />,
      title: "3. Data Synchronization (Supabase & Cloud)",
      content: (
        <>
          <p className="mb-2">To enable worldwide access and secure backups, Noxis utilizes Supabase for data synchronization.</p>
          <ul className="list-disc pl-5 space-y-2 text-gray-400">
            <li><strong className="text-gray-300">Encryption:</strong> Data synced to the cloud is encrypted during transit and at rest.</li>
            <li><strong className="text-gray-300">Control:</strong> Users can toggle cloud synchronization on or off via the Industrial Hub Settings.</li>
            <li><strong className="text-gray-300">Third-Party Disclaimer:</strong> While we secure the sync, the uptime and physical security of cloud servers are managed by Supabase (Third-party provider).</li>
          </ul>
        </>
      )
    },
    {
      id: "network",
      icon: <Globe className="w-5 h-5" />,
      title: "4. Local Network & Mesh Connectivity",
      content: (
        <>
          <p className="mb-2"><strong className="text-gray-300">TCP/Mesh Bridge:</strong> The communication between the Noxis Mobile App and the PC Master Node happens over your local LAN or Mesh network.</p>
          <p><strong className="text-gray-300">Offline Security:</strong> Messaging and pairing features are designed to work without an internet connection, ensuring that internal communication never leaves your physical premises.</p>
        </>
      )
    },
    {
      id: "cctv",
      icon: <Cpu className="w-5 h-5" />,
      title: "5. CCTV & AI Surveillance Ethics",
      content: (
        <>
          <p className="mb-2"><strong className="text-gray-300">Local Processing:</strong> All AI detection overlays and CCTV monitoring features are processed locally on the user s hardware.</p>
          <p><strong className="text-gray-300">Liability:</strong> The user (Factory/Business Owner) is responsible for ensuring that digital monitoring complies with local labor laws and that employees are informed of surveillance.</p>
        </>
      )
    },
    {
      id: "liability",
      icon: <AlertTriangle className="w-5 h-5" />,
      title: "6. Limitation of Liability (EULA Integration)",
      content: (
        <>
          <p className="mb-2"><strong className="text-gray-300">As-Is Software:</strong> Noxis is provided as-is While engineered for maximum stability (130k+ lines of tested code), Omnora Labs is not liable for data loss due to hardware failure, unauthorized local access, or user negligence.</p>
          <p><strong className="text-gray-300">No Financial Guarantee:</strong> Financial reports (P&L, Balance Sheets) are for operational assistance. Final audits should be verified by professional accountants.</p>
        </>
      )
    },
    {
      id: "contact",
      icon: <Mail className="w-5 h-5" />,
      title: "7. Contact Information",
      content: "For any technical queries or legal clarifications regarding Noxis, please contact the engineering team at Omnora Labs."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-300 font-inter selection:bg-sandstone-gold/30 selection:text-white">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-sandstone-gold/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 space-y-4"
        >
          <Link 
            href={returnHref}
            className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 hover:text-sandstone-gold transition-colors"
          >
            <ArrowLeft size={14} />
            <span>{returnLabel}</span>
          </Link>
          
          <div className="pt-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-2 italic">
              PRIVACY <span className="text-sandstone-gold">POLICY</span>
            </h1>
            <div className="flex flex-col md:flex-row md:items-center md:space-x-6 text-[10px] uppercase tracking-[0.3em] font-mono text-gray-500 font-bold">
              <span>Noxis Industrial Hub</span>
              <span className="hidden md:inline">•</span>
              <span>Last Updated: May 6, 2026</span>
              <span className="hidden md:inline">•</span>
              <span className="text-sandstone-gold/80">Developed by Ahmad Mahboob</span>
            </div>
          </div>
        </motion.div>

        {/* Content Sections */}
        <div className="space-y-12">
          {sections.map((section: PrivacySection, idx: number) => (
            <motion.section
              key={section.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group"
            >
              <div className="flex items-start space-x-4">
                <div className="mt-1 p-2 bg-white/5 rounded-sm group-hover:bg-sandstone-gold/10 group-hover:text-sandstone-gold transition-all">
                  {section.icon}
                </div>
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-white tracking-tight group-hover:text-sandstone-gold transition-colors">
                    {section.title}
                  </h2>
                  <div className="text-[13px] leading-relaxed text-gray-400 font-medium">
                    {section.content}
                  </div>
                </div>
              </div>
            </motion.section>
          ))}
        </div>

        {/* Footer */}
        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-24 pt-8 border-t border-white/5 text-center"
        >
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-sandstone-gold animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40">Industrial Security Protocol v13.0</span>
          </div>
          <p className="text-[11px] font-mono text-gray-600 font-bold">
            © 2026 Noxis Hub. Engineered by Omnora Labs. All trade records remain completely localized within your local workstation node.
          </p>
        </motion.footer>
      </div>
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=JetBrains+Mono:wght@700&display=swap');
        
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains+Mono', monospace; }
        
        body {
          background-color: #0A0A0B;
        }
      `}</style>
    </div>
  );
}
