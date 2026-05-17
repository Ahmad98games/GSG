"use client";

import React, { useState, useEffect, useMemo } from "react";

import { useSidebarState } from "@/hooks/useSidebarState";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ClipboardCheck, Clock, User, AlertTriangle, 
  Settings2, Activity, Users, Send, CheckCircle2,
  Package, HardHat, Info, Zap
} from "lucide-react";
import { format } from "date-fns";
import HandoverCard from "@/components/production/HandoverCard";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const handoverSchema = z.object({
  shift_type: z.enum(['morning', 'evening', 'night']),
  supervisor_name: z.string().min(1, "Supervisor name required"),
  total_units_produced: z.coerce.number().min(0),
  batches_completed: z.array(z.string()).default([]),
  batches_in_progress: z.array(z.string()).default([]),
  machines_down: z.string().max(300).optional(),
  materials_shortage: z.string().max(300).optional(),
  issues_encountered: z.string().max(300).optional(),
  quality_rejections: z.coerce.number().min(0),
  pending_work: z.string().optional(),
  materials_needed: z.string().optional(),
  next_shift_instructions: z.string().optional(),
  workers_present: z.coerce.number().min(0),
  workers_absent: z.coerce.number().min(0),
  overtime_workers: z.coerce.number().min(0),
});

type HandoverForm = z.infer<typeof handoverSchema>;

export default function ShiftHandoverPage() {
  const { isCollapsed } = useSidebarState();
  const { profile } = useBusinessProfile();
  const { t, fmt, businessId } = usePersona();
  const supabase = createClient();
  const queryClient = useQueryClient();
  

  const [activeTab, setActiveTab] = useState<'morning' | 'evening' | 'night'>('morning');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<HandoverForm>({
    resolver: zodResolver(handoverSchema),
    defaultValues: {
      shift_type: 'morning',
      total_units_produced: 0,
      quality_rejections: 0,
      workers_present: 0,
      workers_absent: 0,
      overtime_workers: 0,
      batches_completed: [],
      batches_in_progress: []
    }
  });

  const selectedShift = watch("shift_type");

  // Fetch Production Stats for Today
  const { data: productionStats } = useQuery({
    queryKey: ['production_stats_today', businessId],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('karigar_production_logs')
        .select('effective_qty')
        .eq('business_id', businessId)
        .eq('log_date', today);
      
      if (error) throw error;
      const total = (data || []).reduce((acc: number, log: any) => acc + Number(log.effective_qty), 0);
      return { total };
    },
    enabled: !!businessId
  });

  // Auto-fill production stats
  useEffect(() => {
    if (productionStats?.total) {
      setValue("total_units_produced", productionStats.total);
    }
  }, [productionStats, setValue]);

  // Fetch Active Batches
  const { data: activeBatches = [] } = useQuery({
    queryKey: ['active_batches_handover', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_batches')
        .select('id, batch_code, status')
        .eq('business_id', businessId)
        .not('status', 'in', '("completed","cancelled")');
      if (error) throw error;
      return data;
    },
    enabled: !!businessId
  });

  // Fetch Recent Handovers
  const { data: handovers = [], isLoading: handoversLoading } = useQuery({
    queryKey: ['shift_handovers', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shift_handovers')
        .select('*')
        .eq('business_id', businessId)
        .order('shift_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!businessId
  });

  const submitMutation = useMutation({
    mutationFn: async (values: HandoverForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('shift_handovers').insert({
        ...values,
        business_id: businessId,
        submitted_by: user?.id,
        shift_date: format(new Date(), 'yyyy-MM-dd')
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSuccessMsg("Handover submitted. Next shift will see this.");
      reset();
      queryClient.invalidateQueries({ queryKey: ['shift_handovers'] });
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('shift_handovers').update({
        status: 'acknowledged',
        acknowledged_by: user?.id,
        acknowledged_at: new Date().toISOString()
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift_handovers'] });
    }
  });

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 selection:bg-[#C5A059]/30">
      
      
      <main className={cn( "transition-all duration-300 min-h-screen flex flex-col")}>
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
            <ClipboardCheck size={14} className="text-[#C5A059] mr-2" />
            <span>Production</span>
            <span className="mx-3 opacity-30">/</span>
            <span className="text-white">Shift Handover</span>
          </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Left Panel: Submission Form */}
              <div className="space-y-8">
                 <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">End of Shift Handover</h1>
                    <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-bold mt-1">
                       Shift: <span className="text-[#C5A059]">{selectedShift}</span> · {format(new Date(), 'dd MMMM yyyy')}
                    </p>
                 </div>

                 {/* Shift Selector */}
                 <div className="flex bg-white/5 p-1 rounded-sm border border-white/5">
                    {['morning', 'evening', 'night'].map((s) => (
                      <button 
                        key={s}
                        type="button"
                        onClick={() => setValue("shift_type", s as any)}
                        className={cn(
                          "flex-1 py-3 text-[9px] font-black uppercase tracking-[0.2em] transition-all",
                          selectedShift === s ? "bg-[#C5A059] text-black shadow-lg" : "text-gray-500 hover:text-white"
                        )}
                      >
                         {s}
                         <span className="block text-[7px] opacity-60 font-mono mt-0.5">
                            {s === 'morning' ? '06:00-14:00' : s === 'evening' ? '14:00-22:00' : '22:00-06:00'}
                         </span>
                      </button>
                    ))}
                 </div>

                 <form onSubmit={handleSubmit((d) => submitMutation.mutate(d))} className="space-y-10">
                    
                    {/* Section 1: Production */}
                    <div className="space-y-6">
                       <FormSectionTitle icon={Activity} label="Production Summary" />
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <Label>Total Units Produced</Label>
                             <input type="number" {...register("total_units_produced")} className="w-full bg-[#0F1113] border border-white/10 p-4 text-xl font-mono text-[#C5A059] outline-none focus:border-[#C5A059]" />
                          </div>
                          <div className="space-y-2">
                             <Label>Quality Rejections</Label>
                             <input type="number" {...register("quality_rejections")} className="w-full bg-[#0F1113] border border-white/10 p-4 text-xl font-mono text-red-500 outline-none focus:border-red-500" />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <Label>Batches Completed</Label>
                          <select multiple {...register("batches_completed")} className="w-full bg-[#0F1113] border border-white/10 p-3 text-xs text-white h-24 focus:border-[#C5A059]">
                             {activeBatches.map((b: any) => <option key={b.id} value={b.batch_code}>{b.batch_code}</option>)}
                          </select>
                       </div>
                    </div>

                    {/* Section 2: Issues */}
                    <div className="space-y-6">
                       <FormSectionTitle icon={AlertTriangle} label="Operational Issues" />
                       <div className="space-y-4">
                          <div className="space-y-2">
                             <Label>Machines/Equipment Down</Label>
                             <textarea {...register("machines_down")} placeholder="e.g. Cutting machine #3 belt broken" className="w-full bg-[#0F1113] border border-white/10 p-4 text-xs text-white h-20 outline-none focus:border-amber-500 transition-all" />
                          </div>
                          <div className="space-y-2">
                             <Label>Materials Shortage</Label>
                             <textarea {...register("materials_shortage")} placeholder="e.g. Blue thread running low" className="w-full bg-[#0F1113] border border-white/10 p-4 text-xs text-white h-20 outline-none focus:border-amber-500 transition-all" />
                          </div>
                       </div>
                    </div>

                    {/* Section 3: Next Shift */}
                    <div className="space-y-6">
                       <FormSectionTitle icon={Zap} label="Next Shift Handover" />
                       <div className="space-y-4">
                          <div className="space-y-2">
                             <Label>Pending Work / Priorities</Label>
                             <textarea {...register("pending_work")} placeholder="What the next shift must complete first" className="w-full bg-[#0F1113] border border-white/10 p-4 text-xs text-white h-24 outline-none focus:border-[#0070F3] transition-all" />
                          </div>
                          <div className="space-y-2">
                             <Label>Special Instructions</Label>
                             <textarea {...register("next_shift_instructions")} className="w-full bg-[#0F1113] border border-white/10 p-4 text-xs text-white h-24 outline-none focus:border-[#0070F3] transition-all" />
                          </div>
                       </div>
                    </div>

                    {/* Section 4: Attendance */}
                    <div className="space-y-6">
                       <FormSectionTitle icon={Users} label="Workforce Snapshot" />
                       <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                             <Label>Present</Label>
                             <input type="number" {...register("workers_present")} className="w-full bg-[#0F1113] border border-white/10 p-4 text-center font-mono text-white outline-none focus:border-emerald-500" />
                          </div>
                          <div className="space-y-2">
                             <Label>Absent</Label>
                             <input type="number" {...register("workers_absent")} className="w-full bg-[#0F1113] border border-white/10 p-4 text-center font-mono text-white outline-none focus:border-red-500" />
                          </div>
                          <div className="space-y-2">
                             <Label>Overtime</Label>
                             <input type="number" {...register("overtime_workers")} className="w-full bg-[#0F1113] border border-white/10 p-4 text-center font-mono text-white outline-none focus:border-blue-500" />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4 pt-6">
                       <Label>Supervisor Name</Label>
                       <input type="text" {...register("supervisor_name")} className="w-full bg-white/5 border border-white/10 p-4 text-sm font-bold text-white outline-none focus:border-[#C5A059]" />
                       {errors.supervisor_name && <p className="text-red-500 text-[10px] uppercase font-bold">{errors.supervisor_name.message}</p>}
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full py-6 bg-[#C5A059] text-black font-black uppercase tracking-[0.3em] text-xs shadow-[0_0_30px_rgba(197,160,89,0.2)] hover:shadow-[0_0_50px_rgba(197,160,89,0.3)] transition-all flex items-center justify-center space-x-4 disabled:opacity-50"
                    >
                       {isSubmitting ? <Loader /> : (
                         <>
                           <Send size={16} />
                           <span>Submit Handover Record</span>
                         </>
                       )}
                    </button>
                 </form>
              </div>

              {/* Right Panel: Recent Handovers */}
              <div className="space-y-8">
                 <div>
                    <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center">
                       <Clock size={14} className="mr-2" />
                       Historical Sequence
                    </h2>
                    <p className="text-[9px] text-gray-700 uppercase font-bold tracking-[0.2em] mt-1">Last 7 Operational Cycles</p>
                 </div>

                 <div className="space-y-6 max-h-[1200px] overflow-y-auto pr-4 custom-scrollbar">
                    {handoversLoading ? (
                      <div className="space-y-6">
                         {[1,2,3].map(i => <div key={i} className="h-64 bg-white/[0.02] animate-pulse border border-white/5" />)}
                      </div>
                    ) : handovers.length === 0 ? (
                      <div className="py-20 text-center opacity-20">
                         <ClipboardCheck size={48} className="mx-auto mb-4" />
                         <span className="text-[10px] uppercase font-black tracking-widest">No Records Found</span>
                      </div>
                    ) : (
                      handovers.map((h: any) => (
                        <HandoverCard 
                          key={h.id} 
                          handover={h} 
                          onAcknowledge={(id) => acknowledgeMutation.mutate(id)}
                          isAcknowledging={acknowledgeMutation.isPending && acknowledgeMutation.variables === h.id}
                        />
                      ))
                    )}
                 </div>
              </div>
           </div>
        </div>
      </main>

      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-black px-8 py-4 flex items-center space-x-4 shadow-2xl rounded-sm font-black uppercase text-xs tracking-[0.2em]"
          >
            <CheckCircle2 size={20} />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 2px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}

function FormSectionTitle({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex items-center space-x-3 border-b border-white/5 pb-2">
       <Icon size={14} className="text-gray-500" />
       <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</h3>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">{children}</label>;
}

function Loader() {
  return <div className="w-4 h-4 border-2 border-black/20 border-t-black animate-spin rounded-full" />;
}
