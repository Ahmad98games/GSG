// app/purchase/success/page.tsx
"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { 
  CheckCircle2, Copy, Download, BookOpen, 
  Mail, ShieldCheck, ChevronRight 
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const licenseKey = searchParams.get('key') || "XXXX-XXXX-XXXX-XXXX";

  const copyKey = () => {
    navigator.clipboard.writeText(licenseKey);
    alert("License key copied to clipboard!");
  };

  return (
    <div className="bg-onyx min-h-screen text-gray-300 font-inter pt-40 pb-20 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-emerald/10 border border-emerald/20 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <CheckCircle2 className="text-emerald w-10 h-10" />
        </motion.div>

        <h1 className="text-4xl font-bold text-white tracking-tighter mb-4">Industrial License Activated</h1>
        <p className="text-gray-400 mb-12">Your payment has been verified. A copy of this license has been sent to your billing email.</p>

        {/* License Key Box */}
        <div className="bg-surface border border-white/5 p-10 mb-12 relative group">
           <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mb-6">Your License Key</p>
           <div className="text-2xl md:text-4xl font-mono font-bold text-white tracking-widest break-all">
             {licenseKey}
           </div>
           <button 
             onClick={copyKey}
             className="mt-8 inline-flex items-center space-x-2 text-xs font-bold text-electric-blue uppercase tracking-widest hover:text-white transition-colors"
           >
             <Copy size={16} />
             <span>Copy to Clipboard</span>
           </button>
        </div>

        {/* Next Steps */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
           <Link 
             href="/download"
             className="bg-electric-blue text-onyx p-8 flex flex-col items-center justify-center space-y-4 hover:brightness-110 transition-all rounded-sm group"
           >
              <Download size={32} />
              <div className="text-center">
                 <h4 className="text-sm font-bold uppercase tracking-widest">Download Hub</h4>
                 <p className="text-[10px] font-bold opacity-70">Windows 10/11 (.exe)</p>
              </div>
           </Link>
           <Link 
             href="/docs/getting-started/installation"
             className="bg-white/5 border border-white/10 p-8 flex flex-col items-center justify-center space-y-4 hover:bg-white/10 transition-all rounded-sm"
           >
              <BookOpen size={32} className="text-white" />
              <div className="text-center">
                 <h4 className="text-sm font-bold uppercase tracking-widest text-white">Setup Guide</h4>
                 <p className="text-[10px] font-bold text-gray-500">View Documentation</p>
              </div>
           </Link>
        </div>

        <div className="flex items-center justify-center space-x-8">
           <div className="flex items-center space-x-2 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
              <Mail className="w-4 h-4" />
              <span>Receipt Sent</span>
           </div>
           <div className="flex items-center space-x-2 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" />
              <span>Elite Tier Verified</span>
           </div>
        </div>
      </div>
    </div>
  );
}

