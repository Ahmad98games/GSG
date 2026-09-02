"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  CheckCircle2, Copy, Download, Monitor, 
  ShieldCheck, Check, ArrowRight 
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import PublicNavbar from "@/components/shell/PublicNavbar";

function SuccessContent() {
  const searchParams = useSearchParams();
  const licenseKey = searchParams.get('key') || "PROP-2026-XXXX-XXXX";
  const tier = (searchParams.get('tier') || "PRO").toUpperCase();
  const hwid = searchParams.get('hwid') || "";
  const [copied, setCopied] = useState(false);

  const copyKey = () => {
    navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadUrl = `/api/download-software?licenseKey=${encodeURIComponent(licenseKey)}&redirect=true`;

  return (
    <div className="max-w-3xl mx-auto text-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 bg-[#08EBF6]/10 border border-[#08EBF6]/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(8,235,246,0.3)]"
      >
        <CheckCircle2 className="text-[#08EBF6] w-10 h-10" />
      </motion.div>

      <div className="inline-flex items-center gap-2 bg-[#08EBF6]/10 border border-[#08EBF6]/30 px-4 py-1.5 rounded-full mb-4">
        <ShieldCheck size={14} className="text-[#08EBF6]" />
        <span className="text-[10px] font-black text-[#08EBF6] uppercase tracking-widest">
          {tier} Tier · Cryptographically Signed
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-3 uppercase">
        License Key Generated
      </h1>
      <p className="text-gray-400 text-sm max-w-lg mx-auto mb-10 font-medium leading-relaxed">
        Your payment confirmation has been registered. Your official offline-first license key is ready to activate.
      </p>

      {/* License Key Box */}
      <div className="bg-[#0A0D10] border border-[#08EBF6]/30 p-8 sm:p-10 mb-8 relative rounded-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.25em]">
            Official Offline License Key
          </p>
          {hwid && (
            <span className="text-[10px] font-mono text-[#5FA5FA]">
              HWID: {hwid}
            </span>
          )}
        </div>
        
        <div className="text-2xl sm:text-3xl font-mono font-black text-[#08EBF6] tracking-wider break-all select-all py-4 px-3 bg-black/60 rounded border border-white/5">
          {licenseKey}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={copyKey}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#08EBF6] hover:bg-[#08EBF6]/90 text-black font-black text-xs uppercase tracking-widest rounded-sm transition-all shadow-[0_0_20px_rgba(8,235,246,0.3)] cursor-pointer"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? "Key Copied to Clipboard!" : "Copy License Key"}</span>
          </button>

          <a
            href={downloadUrl}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-widest rounded-sm transition-all border border-white/15 cursor-pointer"
          >
            <Download size={16} />
            <span>Download .exe Installer</span>
          </a>
        </div>
      </div>

      {/* 3 Step Activation Guide */}
      <div className="bg-[#0B0F17] border border-white/10 p-6 sm:p-8 rounded-md text-left mb-10 space-y-4">
        <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/10 pb-3">
          How to Activate on your PC (3 Steps)
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-[#08EBF6]">STEP 01</span>
            <p className="text-xs font-bold text-white uppercase">Install App</p>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Download and run <span className="text-white font-mono">Noxis Setup.exe</span> on your Windows PC.
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-[#08EBF6]">STEP 02</span>
            <p className="text-xs font-bold text-white uppercase">Go to Settings</p>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Open Noxis Hub, click <span className="text-white">Settings → License & System</span> in sidebar.
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-[#08EBF6]">STEP 03</span>
            <p className="text-xs font-bold text-white uppercase">Paste & Unlock</p>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Paste your license key and click <span className="text-white font-bold">Activate</span>. Runs 100% offline!
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-8 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
        <span>🔒 Zero Cloud Lock-In</span>
        <span>•</span>
        <span>⚡ 100% Local Processing</span>
        <span>•</span>
        <span>💬 WhatsApp: +92 326 4742678</span>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="bg-[#040608] min-h-screen text-gray-300 font-sans pt-28 pb-20 px-6">
      <PublicNavbar />
      <Suspense fallback={<div className="text-center py-20 text-xs font-mono text-gray-500">Loading order confirmation...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
