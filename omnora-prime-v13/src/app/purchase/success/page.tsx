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
import { OrderConfirmation } from "@/components/download/OrderConfirmation";

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

        {/* Order Confirmation & Secure R2 Presigned Download */}
        <div className="mb-12">
          <OrderConfirmation 
            orderId={searchParams.get('order_id') || searchParams.get('orderId') || searchParams.get('session_id') || 'ORD-2026-PAID'} 
            licenseKey={licenseKey}
            status="PAID"
          />
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

