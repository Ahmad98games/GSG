"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Banknote, AlertTriangle, ShieldCheck, 
  X, CheckCircle2, MessageSquare 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { IndustrialMath } from "@/lib/finance/IndustrialMath";
import { usePersona } from "@/hooks/usePersona";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";

interface ApproveAdvanceModalProps {
  karigar: {
    id: string;
    business_id: string;
    name: string;
    karigar_code: string;
    current_advance: number;
    piece_rate?: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApproveAdvanceModal({ karigar, onClose, onSuccess }: ApproveAdvanceModalProps) {
  const supabase = createClient();
  const { fmt } = usePersona();
  const { profile } = useBusinessProfile();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");

  const estimatedMonthly = IndustrialMath.multiply(karigar.piece_rate || 0, 1000); // 1000 units target simulation
  const isHighRisk = Number(amount) > (estimatedMonthly * 2);

  const handleApprove = async () => {
    if (pin !== "1234") return alert("Invalid Authorization PIN."); // Demo PIN

    setIsProcessing(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      // 1. Insert Advance Record
      const { data: advance, error: advErr } = await supabase
        .from('karigar_advances')
        .insert({
          business_id: karigar.business_id,
          karigar_id: karigar.id,
          amount: Number(amount),
          reason,
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .select()
        .single();

      if (advErr) throw advErr;

      // 2. Update Karigar Balance
      const { error: updErr } = await supabase
        .from('karigars')
        .update({ current_advance: IndustrialMath.add(karigar.current_advance, amount) })
        .eq('id', karigar.id);

      if (updErr) throw updErr;

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to process Peshgi.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        onClick={onClose}
        className="absolute inset-0 bg-onyx/90 backdrop-blur-sm" 
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-surface border border-white/10 w-full max-w-md p-8 shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
          <X size={20} />
        </button>

        <div className="flex items-center space-x-3 mb-8">
           <div className="p-3 bg-sandstone-gold/10 text-sandstone-gold">
              <Banknote size={24} />
           </div>
           <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">Approve Peshgi</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Advance Application: {karigar.karigar_code}</p>
           </div>
        </div>

        {!showPin ? (
          <div className="space-y-6">
            <div className="p-4 bg-onyx border border-white/5 space-y-2">
               <span className="text-[10px] uppercase text-gray-500 font-bold">Applicant Details</span>
               <div className="flex justify-between items-center">
                  <span className="text-white font-bold">{karigar.name}</span>
                  <span className="text-xs font-mono text-sandstone-gold">Bal: {fmt(karigar.current_advance)}</span>
               </div>
            </div>

            <div className="space-y-4">
               <div className="space-y-2">
                  <label className="text-[10px] uppercase text-gray-500 font-bold">Advance Amount ({profile?.currency || 'PKR'})</label>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-onyx border border-white/5 p-4 text-xl font-bold text-white font-mono outline-none focus:border-sandstone-gold"
                    placeholder="0.00"
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] uppercase text-gray-500 font-bold">Reason / Notes</label>
                  <textarea 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-onyx border border-white/5 p-4 text-sm text-white outline-none focus:border-sandstone-gold h-24"
                    placeholder="e.g. Medical emergency, family event..."
                  />
               </div>
            </div>

            {isHighRisk && (
              <div className="p-4 bg-critical-red/5 border border-critical-red/20 flex items-start space-x-3">
                 <AlertTriangle size={16} className="text-critical-red mt-0.5" />
                 <p className="text-[10px] text-red-400 leading-relaxed uppercase font-bold">
                    WARNING: Amount exceeds 200% of estimated monthly earnings. High risk of non-recovery.
                 </p>
              </div>
            )}

            <button 
              onClick={() => setShowPin(true)}
              disabled={!amount || !reason}
              className="w-full py-4 bg-sandstone-gold text-onyx font-bold uppercase tracking-widest text-sm hover:bg-yellow-600 transition-all"
            >
               Request Authorization
            </button>
          </div>
        ) : (
          <div className="space-y-8 py-4">
             <div className="text-center space-y-2">
                <ShieldCheck size={48} className="mx-auto text-emerald animate-pulse" />
                <h3 className="text-white font-bold uppercase">Admin Authorization</h3>
                <p className="text-xs text-gray-500">Enter your 4-digit security PIN to finalize {fmt(amount)}</p>
             </div>

             <input 
               type="password"
               maxLength={4}
               value={pin}
               onChange={(e) => setPin(e.target.value)}
               className="w-full bg-onyx border-2 border-white/10 p-6 text-center text-4xl font-mono tracking-[1em] text-white outline-none focus:border-electric-blue"
               autoFocus
             />

             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setShowPin(false)} className="py-4 border border-white/5 text-[10px] uppercase font-bold text-gray-500 hover:text-white transition-colors">
                   Go Back
                </button>
                <button 
                  onClick={handleApprove}
                  disabled={pin.length < 4 || isProcessing}
                  className="py-4 bg-emerald text-onyx font-bold uppercase tracking-widest text-sm hover:bg-green-600 transition-all"
                >
                   {isProcessing ? "Confirming..." : "Finalize"}
                </button>
             </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
