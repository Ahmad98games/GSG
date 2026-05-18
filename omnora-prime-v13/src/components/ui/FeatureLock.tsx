"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lock, Crown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";

interface FeatureLockProps {
  title?: string;
  description?: string;
  requiredTier?: "pro" | "elite";
}

export default function FeatureLock({ 
  title = "Exclusive Elite Feature", 
  description = "This advanced module is reserved for our Elite tier partners. Upgrade now to unlock WhatsApp Business API, real-time anomalies, and multi-branch intelligence.",
  requiredTier = "elite"
}: FeatureLockProps) {
  const { info } = useToast();

  const handleUpgradeClick = () => {
    window.open('https://noxishub.app/pricing', '_blank');
    info(
      'Visit noxishub.app/pricing to upgrade.',
      'After payment, enter your new license key in Settings → License.'
    );
  };

  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center overflow-hidden rounded-2xl bg-[#0A0A0B] border border-white/5">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,160,89,0.05),transparent_70%)]" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center max-w-md p-8"
      >
        <div className="mx-auto w-20 h-20 bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-full flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(197,160,89,0.1)]">
          <Lock size={32} className="text-[#C5A059]" />
        </div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/20 text-[#C5A059] text-[9px] uppercase tracking-[0.2em] font-black mb-4">
          <Crown size={10} />
          <span>{requiredTier} Only</span>
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight mb-4">{title}</h2>
        
        <p className="text-slate-400 text-sm leading-relaxed mb-10">
          {description}
        </p>

        <div className="flex flex-col gap-4">
          <button 
            onClick={handleUpgradeClick}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-[#C5A059] text-black rounded-xl font-bold uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_rgba(197,160,89,0.2)] cursor-pointer"
          >
            <span>{requiredTier.toLowerCase() === 'elite' ? 'View Elite Plans' : 'View Pro Plans'}</span>
            <ArrowRight size={14} />
          </button>
          
          <Link 
            href="/dashboard"
            className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-bold hover:text-white transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </motion.div>

      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-24 h-24 border-t border-l border-white/10 rounded-tl-2xl" />
      <div className="absolute bottom-0 right-0 w-24 h-24 border-b border-r border-white/10 rounded-br-2xl" />
    </div>
  );
}
