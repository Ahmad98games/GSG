"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function WhatsNewPage() {
  const router = useRouter();
  const [changelog, setChangelog] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchChangelog() {
      try {
        const res = await fetch('/api/changelog');
        const data = await res.json();
        setChangelog(data.changelog || '');
      } catch (err) {
        console.error("Failed to load changelog", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchChangelog();
  }, []);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem('noxis_last_seen_version', '13.1.0');
    }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 p-6 md:p-12 font-sans selection:bg-[#08EBF6] selection:text-black flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-[#0B0F17] border border-white/10 rounded-2xl p-8 space-y-6 shadow-2xl relative overflow-hidden"
      >
        {/* Glow Header */}
        <div className="flex items-center space-x-3 border-b border-white/10 pb-6">
          <div className="p-3 bg-[#08EBF6]/10 text-[#08EBF6] rounded-xl border border-[#08EBF6]/30 shadow-[0_0_15px_rgba(8,235,246,0.3)]">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white uppercase">What&apos;s New in Noxis Hub</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#08EBF6] text-black">
                v13.0.0
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              System performance, operational fixes, and feature upgrades
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
          {isLoading ? (
            <div className="py-12 text-center text-xs font-mono text-slate-500 uppercase tracking-widest animate-pulse">
              Loading Release Notes...
            </div>
          ) : (
            <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed bg-[#030712] p-5 rounded-xl border border-white/10">
              {changelog}
            </pre>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={handleDismiss}
            className="px-6 py-3 bg-[#08EBF6] text-black text-xs font-black uppercase tracking-widest rounded-xl hover:brightness-110 flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(8,235,246,0.3)] transition-all"
          >
            <span>Got it, Continue to Workstation</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
