// src/components/ui/AuditErrorModal.tsx
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ShieldAlert, X, ExternalLink } from "lucide-react";

interface AuditErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMsg?: string;
}

export default function AuditErrorModal({ isOpen, onClose, errorMsg }: AuditErrorModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-onyx/90 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-surface border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          {/* Industrial Header Decoration */}
          <div className="h-1 bg-sandstone-gold w-full" />
          
          <div className="p-8 space-y-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-sandstone-gold/10 border border-sandstone-gold/20 rounded-sm">
                  <Lock className="text-sandstone-gold" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-widest">Access Protocol Blocked</h3>
                  <p className="text-[10px] text-sandstone-gold font-bold uppercase tracking-[0.2em] mt-1">Error Code: PERIOD_LOCKED</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-400 leading-relaxed">
                The operation was rejected by the **Forensic Protection Layer**. You are attempting to modify a financial record belonging to a **Filed Tax Period**.
              </p>
              
              <div className="p-4 bg-white/5 border border-white/5 space-y-3">
                <div className="flex items-center space-x-2">
                  <ShieldAlert size={14} className="text-sandstone-gold" />
                  <span className="text-[10px] uppercase font-bold text-white">System Policy Enforcement</span>
                </div>
                <p className="text-[11px] text-gray-500 font-mono italic">
                  "Data integrity is mandated by GAAP/IFRS standards. Modifications to locked periods require explicit Admin Unlock Authorization."
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col space-y-3">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] uppercase tracking-[0.3em] font-bold transition-all"
              >
                Acknowledge Protocol
              </button>
              
              <button 
                className="w-full py-4 bg-sandstone-gold text-onyx text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-gold-400 transition-all flex items-center justify-center space-x-2"
              >
                <ExternalLink size={14} />
                <span>Request Admin Unlock</span>
              </button>
            </div>
          </div>

          {/* Forensic Watermark */}
          <div className="absolute bottom-4 right-4 opacity-[0.03] pointer-events-none select-none">
             <ShieldAlert size={120} />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

