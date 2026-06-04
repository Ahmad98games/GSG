"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileText, Key, Cloud, ShieldAlert, Cpu, AlertCircle, HelpCircle, ArrowLeft } from "lucide-react";
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

// --- Page Component ---
export default function TermsOfServicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-gray-500 uppercase tracking-widest text-[10px]">Loading Service Agreements...</div>}>
      <TermsContent />
    </Suspense>
  );
}

function TermsContent() {
  const searchParams = useSearchParams();
  const source = searchParams.get('source');
  
  const returnHref = source === 'hub' ? '/dashboard' : '/';
  const returnLabel = source === 'hub' ? 'Return to Hub' : 'Return to Home';

  const sections: TermsSection[] = [
    {
      id: "agreement",
      icon: <FileText className="w-5 h-5" />,
      title: "1. Acceptance of Terms",
      content: "By downloading, installing, or utilizing Noxis Hub, you enter into a legally binding agreement with Omnora Labs LLC. If you do not accept these terms in their entirety, you must uninstall the application and terminate your workspace."
    },
    {
      id: "licensing",
      icon: <Key className="w-5 h-5" />,
      title: "2. EULA & Trial Limitations",
      content: (
        <>
          <p className="mb-2">Noxis Hub is licensed, not sold. Your license permits deployment on registered workstations.</p>
          <ul className="list-disc pl-5 space-y-2 text-gray-400">
            <li><strong className="text-gray-300">Trial Mode:</strong> Free trial licenses provide complete workspace access for evaluation. Upon expiry, write permissions are disabled, transitioning the Hub into Read-Only mode.</li>
            <li><strong className="text-gray-300">Elite License:</strong> Standard commercial use requires an active subscription key. Unlicensed deployment or reverse engineering is strictly prohibited.</li>
          </ul>
        </>
      )
    },
    {
      id: "local-first",
      icon: <ShieldAlert className="w-5 h-5" />,
      title: "3. Local Node Custody & Password Loss",
      content: (
        <>
          <p className="mb-2">Noxis Hub works on a Local-First Architecture. Your data resides on your physical drive, not on our servers.</p>
          <p className="text-gray-400"><strong className="text-gray-300">Loss of Keys:</strong> Database encryption keys and master passwords are stored locally on your workstation. Omnora Labs does not maintain backups of your local encryption passwords and cannot recover lost workspace keys. Backing up the database is entirely your responsibility.</p>
        </>
      )
    },
    {
      id: "cloud-sync",
      icon: <Cloud className="w-5 h-5" />,
      title: "4. Cloud Synchronization",
      content: "Optional cloud synchronization utilizes Supabase backend services. While we enforce SSL transit encryption and AES-256 data storage, the uptime, reliability, and hosting physical security are governed by Supabase’s independent terms of service."
    },
    {
      id: "surveillance",
      icon: <Cpu className="w-5 h-5" />,
      title: "5. AI Sentinel surveillance Regulations",
      content: "If you activate local CCTV monitoring and AI Sentinel perimeter detection, you agree to comply with all local labor regulations, employee privacy laws, and industrial monitoring disclosure laws in your jurisdiction. Omnora Labs is not liable for unauthorized or non-compliant camera placements."
    },
    {
      id: "warranty",
      icon: <AlertCircle className="w-5 h-5" />,
      title: "6. Operational Disclaimer",
      content: "Noxis Hub is designed to assist with factory workflows, stock registers, and worker ledger logs. However, it is not a substitute for certified accounting services. All generated tax invoices, profit-loss ledgers, and payroll calculators should be audited by professional accounts before official tax filing."
    },
    {
      id: "support",
      icon: <HelpCircle className="w-5 h-5" />,
      title: "7. Support & Jurisdiction",
      content: "These terms are governed by the commercial laws of Pakistan. All support tickets, updates, and custom setups are managed by the Omnora Labs engineering board."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-300 font-inter selection:bg-sandstone-gold/30 selection:text-white">
      {/* Background Glows */}
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
              TERMS OF <span className="text-sandstone-gold">SERVICE</span>
            </h1>
            <div className="flex flex-col md:flex-row md:items-center md:space-x-6 text-[10px] uppercase tracking-[0.3em] font-mono text-gray-500 font-bold">
              <span>Noxis Industrial Hub</span>
              <span className="hidden md:inline">•</span>
              <span>Effective Date: June 5, 2026</span>
              <span className="hidden md:inline">•</span>
              <span className="text-sandstone-gold/80">Developed by Ahmad Mahboob</span>
            </div>
          </div>
        </motion.div>

        {/* Content Sections */}
        <div className="space-y-12">
          {sections.map((section: TermsSection, idx: number) => (
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
