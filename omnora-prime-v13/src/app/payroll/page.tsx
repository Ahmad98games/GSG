"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Banknote, Plus, Lock, Eye, 
  Download, CheckCircle2,
  AlertCircle, X, Filter
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";
import { FeedbackModal } from "@/components/ui/FeedbackModal";

import { cn } from "@/lib/utils";
import { Decimal } from "decimal.js";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { SummaryCard } from "@/components/ui/SummaryCard";

const runPayrollSchema = z.object({
  period_label: z.string().min(1, "Period name is required"),
  period_start: z.string().min(1, "Start date is required"),
  period_end: z.string().min(1, "End date is required"),
  pay_type: z.enum(['all', 'piece_rate', 'daily_wage', 'monthly_salary']),
});

type RunPayrollValues = z.infer<typeof runPayrollSchema>;

export default function PayrollPage() {
  const { businessId, fmt, fmtDate, term, workerTermPlural } = usePersona();
  const supabase = createClient();
  const queryClient = useQueryClient();
  

  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Queries
  const { data: periods = [], isLoading: periodsLoading, error: periodsError } = useQuery({
    queryKey: ['payroll_periods', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_periods')
        .select(`
          *,
          slips_count:payroll_slips(count)
        `)
        .eq('business_id', businessId)
        .order('period_start', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!businessId
  });

  const { data: karigarStats } = useQuery({
    queryKey: ['karigar_payroll_stats', businessId],
    queryFn: async () => {
      const { data: karigars } = await supabase.from('karigars').select('id, current_advance').eq('business_id', businessId).eq('status', 'active');
      const totalAdvances = (karigars || []).reduce((acc: Decimal, k: { current_advance: number }) => acc.plus(new Decimal(k.current_advance)), new Decimal(0));
      return { count: karigars?.length || 0, advances: totalAdvances };
    },
    enabled: !!businessId
  });

  const thisMonthTotal = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return periods
      .filter((p: any) => p.period_start >= startOfMonth)
      .reduce((acc: Decimal, p: any) => acc.plus(new Decimal(p.total_payroll || 0)), new Decimal(0));
  }, [periods]);

  const handleLockPeriod = async (periodId: string) => {
    const pin = prompt("Enter PIN to lock this period (Industrial Security Protocol):");
    if (pin !== "1234") return alert("Unauthorized PIN Access Denied.");

    try {
      // 1. Update period status
      const { error: periodError } = await supabase
        .from('payroll_periods')
        .update({ status: 'locked', locked_at: new Date().toISOString() })
        .eq('id', periodId);

      if (periodError) throw periodError;

      // 2. Fetch all slips in the locked period to know advance deductions
      const { data: currentSlips, error: fetchError } = await supabase
        .from('payroll_slips')
        .select('karigar_id, advance_deduction')
        .eq('period_id', periodId);

      if (fetchError) throw fetchError;

      // 3. Finalize all slips
      const { error: slipsError } = await supabase
        .from('payroll_slips')
        .update({ is_finalized: true })
        .eq('period_id', periodId);

      if (slipsError) throw slipsError;

      // 4. Deduct advance from Karigar outstanding balance
      if (currentSlips && currentSlips.length > 0) {
        for (const slip of currentSlips) {
          if (slip.advance_deduction && Number(slip.advance_deduction) > 0) {
            // Fetch the karigar's current advance
            const { data: karigar, error: karigarFetchErr } = await supabase
              .from('karigars')
              .select('current_advance')
              .eq('id', slip.karigar_id)
              .single();
            
            if (karigarFetchErr) throw karigarFetchErr;

            const newAdvance = Math.max(0, Number(karigar.current_advance || 0) - Number(slip.advance_deduction));
            
            const { error: karigarUpdateErr } = await supabase
              .from('karigars')
              .update({ current_advance: newAdvance })
              .eq('id', slip.karigar_id);

            if (karigarUpdateErr) throw karigarUpdateErr;
          }
        }
      }

      setSuccessToast("Payroll Period Locked and Finalized.");
      queryClient.invalidateQueries({ queryKey: ['payroll_periods'] });
      queryClient.invalidateQueries({ queryKey: ['karigar_payroll_stats'] });
    } catch (err: any) {
      alert("Failed to lock period: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-noxis-bg text-slate-200 p-6">
      <main className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white uppercase italic">
              {term('payroll')} Management
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Human Capital Compensation Hub
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsRunModalOpen(true)}
               className="flex items-center space-x-2 px-4 py-2 bg-noxis-accent text-onyx text-sm font-semibold rounded-sm hover:brightness-110 shadow-lg transition-all"
             >
                <Plus size={14} />
                <span>Run Payroll Period</span>
             </button>
          </div>
        </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SummaryCard label={`This Month ${term('payroll')}`} value={thisMonthTotal.toNumber()} sub="Total This Month" />
              <SummaryCard label={`${workerTermPlural} on ${term('payroll')}`} value={karigarStats?.count || 0} isCurrency={false} sub={`Active ${workerTermPlural}`} />
              <SummaryCard label="Outstanding Advances" value={karigarStats?.advances?.toNumber() || 0} sub="Outstanding Advances" />
            </div>

           {/* Periods Registry */}
           <div className="bg-noxis-surface border border-noxis-border">
              <div className="p-6 border-b border-noxis-border flex items-center justify-between">
                 <h2 className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Payroll Periods</h2>
                 <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-500 hover:text-white"><Filter size={16} /></button>
                 </div>
              </div>

              {periodsError ? (
                <div className="p-20 flex flex-col items-center justify-center text-red-500 space-y-4">
                  <AlertCircle size={40} />
                  <p className="text-xs uppercase font-black tracking-widest">Error Loading Mesh: {periodsError.message}</p>
                </div>
              ) : periodsLoading ? (
                <div className="p-6">
                  <TableSkeleton rows={5} cols={6} />
                </div>
              ) : periods.length === 0 ? (
                <div className="py-20">
                  <EmptyState
                    icon={Banknote}
                    title="No payroll periods yet"
                    body="Run your first payroll period to see workers and earnings here."
                    action={{ 
                      label: 'Run Payroll Period',
                      onClick: () => setIsRunModalOpen(true) 
                    }}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                          <tr className="bg-[#0F1113] border-b border-white/10">
                             <th className="px-6 py-4 table-header">Period</th>
                             <th className="px-6 py-4 table-header">Start Date</th>
                             <th className="px-6 py-4 table-header">End Date</th>
                             <th className="px-6 py-4 table-header">Total Workers</th>
                             <th className="px-6 py-4 table-header">Net Amount</th>
                             <th className="px-6 py-4 table-header">Status</th>
                             <th className="px-6 py-4 table-header text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {periods.map((p: any) => (
                            <tr key={p.id} className="h-11 border-b border-white/5 hover:bg-white/[0.02] transition-all group">
                               <td className="px-4 py-2.5 text-sm text-gray-200">
                                 <span className="text-sm font-bold text-white uppercase">{p.period_label}</span>
                              </td>
                              <td className="px-6 py-0 text-gray-500 font-mono text-xs">{fmtDate(p.period_start)}</td>
                              <td className="px-6 py-0 text-gray-500 font-mono text-xs">{fmtDate(p.period_end)}</td>
                              <td className="px-6 py-0 text-white font-bold">{p.slips_count?.[0]?.count || 0}</td>
                              <td className="px-6 py-0 text-[#C5A059] font-mono font-bold text-sm">{fmt(p.total_payroll || 0)}</td>
                              <td className="px-4 py-2.5 text-sm text-gray-200">
                                 <StatusPill status={p.status} />
                              </td>
                               <td className="px-6 py-0 text-right">
                                 <div className="flex justify-end space-x-3">
                                    <Link href={`/payroll/${p.id}`} className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                                       <Eye size={16} />
                                    </Link>
                                    {p.status === 'open' && (
                                      <button onClick={() => handleLockPeriod(p.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all">
                                         <Lock size={16} />
                                      </button>
                                    )}
                                    <button className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                                       <Download size={16} />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
              )}
           </div>        
      </main>
  
      <AnimatePresence>
        {isRunModalOpen && (
          <RunPayrollModal 
            onClose={() => setIsRunModalOpen(false)} 
            onSuccess={(msg: string) => { 
              setSuccessToast(msg); 
              queryClient.invalidateQueries({ queryKey: ['payroll_periods'] }); 
              setIsRunModalOpen(false); 
              
              const hasShownPayrollFeedback = localStorage.getItem('payroll_feedback_shown');
              if (!hasShownPayrollFeedback) {
                localStorage.setItem('payroll_feedback_shown', 'true');
                setTimeout(() => setFeedbackOpen(true), 3000);
              }
            }} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 right-8 z-[100] bg-emerald text-onyx px-6 py-3 flex items-center space-x-3 shadow-2xl rounded-sm font-bold uppercase text-xs tracking-widest"
          >
            <CheckCircle2 size={18} />
            <span>{successToast}</span>
            <button onClick={() => setSuccessToast(null)} className="ml-4 opacity-50 hover:opacity-100"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        trigger="post_payroll"
      />
    </div>
  );
}


function StatusPill({ status }: { status: string }) {
  const configs: Record<string, string> = {
    open: "bg-blue-500/10 text-blue-400",
    processing: "bg-amber-500/10 text-amber-500",
    locked: "bg-emerald-500/10 text-emerald-500",
    paid: "bg-emerald-500 text-black"
  };
  return (
    <span className={cn("px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full", configs[status] || configs.open)}>
      {status}
    </span>
  );
}

function RunPayrollModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: (msg: string) => void }) {
  const { businessId } = usePersona();
  const supabase = createClient();
  const [isCalculating, setIsCalculating] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<RunPayrollValues>({
    resolver: zodResolver(runPayrollSchema),
    defaultValues: {
      period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      period_end: new Date().toISOString().split('T')[0],
      pay_type: 'all'
    }
  });

  const onSubmit = async (values: RunPayrollValues) => {
    setIsCalculating(true);
    try {
      // 1. Create Period
      const { data: period, error: pError } = await supabase
        .from('payroll_periods')
        .insert({
          business_id: businessId,
          period_label: values.period_label,
          period_start: values.period_start,
          period_end: values.period_end,
          status: 'open'
        })
        .select()
        .single();
      
      if (pError) throw pError;

      // 2. Fetch Karigars
      const { data: karigars } = await supabase
        .from('karigars')
        .select('*')
        .eq('business_id', businessId)
        .eq('status', 'active');

      if (!karigars) throw new Error("No active karigars found");

      // 3. Fetch Production & Attendance for each
      const slips = [];
      let totalPeriodPayroll = new Decimal(0);
      let totalProductionLogsFound = 0;
      let totalAttendanceLogsFound = 0;

      for (const k of karigars) {
        let gross = new Decimal(0);
        let pieceEarning = new Decimal(0);
        let dailyEarning = new Decimal(0);
        let monthlyBase = new Decimal(0);

        if (k.wage_type === 'piece_rate') {
          const { data: prod } = await supabase.rpc('get_karigar_production_summary', {
             p_karigar_id: k.id,
             p_from: values.period_start,
             p_to: values.period_end
          });
          pieceEarning = new Decimal(prod?.[0]?.total_earning || 0);
          if (prod?.[0]?.total_qty > 0) totalProductionLogsFound++;
          gross = pieceEarning;
        } else if (k.wage_type === 'daily_wage') {
          const { count } = await supabase.from('attendance_logs')
            .select('*', { count: 'exact', head: true })
            .eq('karigar_id', k.id)
            .gte('log_date', values.period_start)
            .lte('log_date', values.period_end)
            .eq('status', 'present');
          
          if (count && count > 0) totalAttendanceLogsFound++;
          dailyEarning = new Decimal(count || 0).mul(new Decimal(k.daily_rate || 0));
          gross = dailyEarning;
        } else {
          monthlyBase = new Decimal(k.monthly_salary || 0);
          gross = monthlyBase;
        }

        // Deduct advance (max 25% of gross or current advance)
        const advanceDeduction = Decimal.min(gross.mul(0.25), new Decimal(k.current_advance));
        const net = gross.minus(advanceDeduction);

        slips.push({
          business_id: businessId,
          period_id: period.id,
          karigar_id: k.id,
          piece_rate_earning: pieceEarning.toNumber(),
          daily_wage_earning: dailyEarning.toNumber(),
          monthly_base: monthlyBase.toNumber(),
          gross_earning: gross.toNumber(),
          advance_deduction: advanceDeduction.toNumber(),
          total_deductions: advanceDeduction.toNumber(),
          net_payable: net.toNumber(),
          is_finalized: false
        });

        totalPeriodPayroll = totalPeriodPayroll.plus(net);
      }

      // 4. Batch Insert Slips
      const { error: slipsError } = await supabase.from('payroll_slips').insert(slips);
      if (slipsError) throw slipsError;

      // 5. Update Period Total
      await supabase.from('payroll_periods').update({ 
        total_payroll: totalPeriodPayroll.toNumber() 
      }).eq('id', period.id);

      onSuccess(`Mesh Scanned: Generated ${slips.length} slips. Found ${totalProductionLogsFound} production sessions and ${totalAttendanceLogsFound} attendance logs.`);
    } catch (err: any) {
      alert(`Payroll Generation Failed: ${err.message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
       <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-[#1A1D21] border border-white/10 shadow-2xl">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
             <h3 className="text-[10px] uppercase font-black text-white tracking-widest">Execute Payroll Cycle</h3>
             <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-gray-500">Cycle Label</label>
                <input {...register("period_label")} placeholder="e.g. March 2024 - Batch A" className="w-full bg-[#0F1113] border border-white/5 p-3 text-xs text-white outline-none focus:border-[#0070F3]" />
                {errors.period_label && <p className="text-[9px] text-red-500 uppercase font-bold">{errors.period_label.message}</p>}
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-black text-gray-500">Start Date</label>
                   <input type="date" {...register("period_start")} className="w-full bg-[#0F1113] border border-white/5 p-3 text-xs text-white outline-none" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-black text-gray-500">End Date</label>
                   <input type="date" {...register("period_end")} className="w-full bg-[#0F1113] border border-white/5 p-3 text-xs text-white outline-none" />
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-gray-500">Pay Type Filtering</label>
                <select {...register("pay_type")} className="w-full bg-[#0F1113] border border-white/5 p-3 text-xs text-white outline-none">
                   <option value="all">All Wage Types</option>
                   <option value="piece_rate">Piece Rate Only</option>
                   <option value="daily_wage">Daily Wage Only</option>
                   <option value="monthly_salary">Monthly Salary Only</option>
                </select>
             </div>

             <div className="p-4 bg-blue-500/5 border border-blue-500/10 space-y-2">
                <div className="flex items-center space-x-2 text-[#0070F3]">
                   <AlertCircle size={14} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Protocol Notice</span>
                </div>
                <p className="text-[9px] text-gray-500 leading-relaxed uppercase">
                   This action will scan the mesh for all production and attendance logs within the specified date range. New payroll slips will be generated as DRAFTS.
                </p>
             </div>

             <button 
               type="submit" 
               disabled={isCalculating}
               className="w-full py-4 bg-[#0070F3] text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:brightness-110 disabled:opacity-50"
             >
                {isCalculating ? "Calculating Mesh..." : "Generate Payroll Slips"}
             </button>
          </form>
       </motion.div>
    </div>
  );
}
