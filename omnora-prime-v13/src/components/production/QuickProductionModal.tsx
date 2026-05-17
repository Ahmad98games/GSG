"use client";

import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Factory, Plus, ShieldCheck, 
  AlertTriangle, CheckCircle2, Search,
  Clock, Hammer, Layers
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { usePersona } from "@/hooks/usePersona";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickProductionModal({ isOpen, onClose }: QuickLogModalProps) {
  const { businessId, t } = usePersona();
  const { success: showSuccess, error: showError } = useToast();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const qtyRef = useRef<HTMLInputElement>(null);
  const { ref: registerRef, ...qtyRegister } = register('qty', { required: true, min: 1 });

  // Fetch batches for selection
  const { data: batches = [] } = useQuery({
    queryKey: ['active_batches_modal', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_batches')
        .select('id, batch_no, skus(name)')
        .eq('business_id', businessId)
        .neq('status', 'completed')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!businessId
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => qtyRef.current?.focus(), 100);
    }
  }, [isOpen]);


  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('karigar_production_logs').insert({
         business_id: businessId,
         karigar_id: data.karigar_id,
         batch_id: data.batch_id,
         department: data.department,
         qty_produced: Number(data.qty),
         quality_grade: data.grade,
         time_taken_minutes: Number(data.time_taken) || null,
         piece_rate_used: 0 
      });

      if (error) throw error;

      showSuccess(`SUCCESSFULLY LOGGED ${data.qty} UNITS`);
      reset({ ...data, qty: '', grade: '' });
      queryClient.invalidateQueries({ queryKey: ['dept_stats'] });
      queryClient.invalidateQueries({ queryKey: ['active_batches'] });
      
      // Close modal after delay
      setTimeout(onClose, 1000);
    } catch (err: any) {
      showError(err.message || 'POST ERROR');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedGrade = watch('grade');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#1A1D21] border border-white/10 w-full max-w-lg pointer-events-auto relative overflow-hidden"
            >
              {/* Industrial Accent */}
              <div className="h-1 w-full bg-[#0070F3]" />

              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/10 text-blue-500">
                      <Factory size={20} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-widest text-white">Live Input Console</h2>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Global Edge Entry • Shortcut [N]</p>
                    </div>
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-2 text-gray-500 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest flex items-center">
                        <Hammer size={10} className="mr-1" /> Operating Worker ID
                      </label>
                      <input 
                        {...register('karigar_id', { required: true })} 
                        className={cn(
                          "w-full bg-[#0F1113] border px-4 py-2.5 text-xs text-white outline-none focus:border-[#0070F3] transition-all",
                          errors.karigar_id ? "border-red-500/50" : "border-white/10"
                        )} 
                        placeholder="Search code..." 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest flex items-center">
                        <Layers size={10} className="mr-1" /> Active Batch
                      </label>
                      <select 
                        {...register('batch_id', { required: true })} 
                        className={cn(
                          "w-full bg-[#0F1113] border px-4 py-2.5 text-xs text-white outline-none focus:border-[#0070F3] transition-all",
                          errors.batch_id ? "border-red-500/50" : "border-white/10"
                        )}
                      >
                        <option value="">Select Batch...</option>
                        {batches.map((b: any) => (
                          <option key={b.id} value={b.id}>{b.batch_no} — {b.skus?.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Department</label>
                      <select {...register('department')} className="w-full bg-[#0F1113] border border-white/10 px-4 py-2.5 text-xs text-white outline-none focus:border-[#0070F3]">
                        <option value="cutting">Cutting</option>
                        <option value="stitching">Stitching</option>
                        <option value="finishing">Finishing</option>
                        <option value="packing">Packing</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Time Taken (Min)</label>
                      <input type="number" {...register('time_taken')} className="w-full bg-[#0F1113] border border-white/10 px-4 py-2.5 text-xs text-white outline-none focus:border-[#0070F3]" placeholder="Auto" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Production Quantity</label>
                    <input 
                      type="number" 
                      {...qtyRegister}
                      ref={(e) => {
                        registerRef(e);
                        (qtyRef as any).current = e;
                      }}
                      className={cn(
                        "w-full bg-white text-black font-black font-mono text-4xl text-center py-6 outline-none focus:ring-4 transition-all",
                        errors.qty ? "ring-4 ring-red-500/20" : "focus:ring-blue-500/20"
                      )} 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Quality Grading</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['A', 'B', 'C', 'rejected'].map(g => (
                        <button 
                          key={g} 
                          type="button"
                          onClick={() => setValue('grade', g)}
                          className={cn(
                            "py-3 text-[10px] font-black uppercase border transition-all",
                            selectedGrade === g ? "bg-white text-black border-white" : "bg-black/40 text-gray-500 border-white/10 hover:border-white/30"
                          )}
                        >
                          {g === 'rejected' ? 'REJ' : g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#C5A059] disabled:opacity-50 text-black text-xs font-black uppercase tracking-[0.3em] hover:brightness-110 shadow-2xl transition-all"
                  >
                    {isSubmitting ? 'Authorizing...' : 'Authorize Post'}
                  </button>
                </form>

                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center space-x-2">
                      <ShieldCheck size={12} className="text-emerald-500" />
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">End-to-End Verified</span>
                   </div>
                   <div className="flex items-center space-x-2">
                      <Clock size={12} className="text-gray-500" />
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{new Date().toLocaleTimeString()}</span>
                   </div>
                </div>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
