"use client";

import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";

const accountSchema = z.object({
  account_code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  description: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountSchema>;

interface AddAccountModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddAccountModal({ onClose, onSuccess }: AddAccountModalProps) {
  const { profile } = useBusinessProfile();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema)
  });

  const onSubmit = async (values: AccountFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('accounts').insert({
        ...values,
        business_id: profile?.id,
        is_system: false,
        is_active: true
      });
      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      alert(`Failed to add account: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
       <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-[#1A1D21] border border-white/10 shadow-2xl">
          <div className="p-6 bg-[#0F1113] border-b border-white/5 flex items-center justify-between">
             <h3 className="text-[10px] uppercase font-black text-white tracking-widest">New Ledger Account</h3>
             <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Account Code</label>
                <input {...register("account_code")} placeholder="e.g. 1000" className="w-full bg-[#0F1113] border border-white/10 p-3 text-sm text-white focus:border-electric-blue outline-none" />
                {errors.account_code && <p className="text-[9px] text-red-500 font-bold uppercase">{errors.account_code.message}</p>}
             </div>
             <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Account Name</label>
                <input {...register("name")} placeholder="e.g. Cash in Hand" className="w-full bg-[#0F1113] border border-white/10 p-3 text-sm text-white focus:border-electric-blue outline-none" />
                {errors.name && <p className="text-[9px] text-red-500 font-bold uppercase">{errors.name.message}</p>}
             </div>
             <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Type</label>
                <select {...register("type")} className="w-full bg-[#0F1113] border border-white/10 p-3 text-xs text-white outline-none">
                   <option value="asset">Asset</option>
                   <option value="liability">Liability</option>
                   <option value="equity">Equity</option>
                   <option value="revenue">Revenue</option>
                   <option value="expense">Expense</option>
                </select>
             </div>
             <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-electric-blue text-onyx text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all">
                {isSubmitting ? "Creating..." : "Create Account"}
             </button>
          </form>
       </motion.div>
    </div>
  );
}
