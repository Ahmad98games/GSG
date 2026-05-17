"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0F1113] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center space-y-8">
        <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
          <ShieldAlert className="text-red-500" size={40} />
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Access Restricted</h1>
          <p className="text-sm text-gray-400 leading-relaxed">Your role does not have permission to access this module. Contact your administrator to request access.</p>
        </div>
        <button onClick={() => router.push('/dashboard')} className="inline-flex items-center space-x-2 px-6 py-3 bg-white/5 border border-white/10 text-[10px] uppercase font-black tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all rounded-sm">
          <ArrowLeft size={14} /><span>Return to Dashboard</span>
        </button>
      </motion.div>
    </div>
  );
}
