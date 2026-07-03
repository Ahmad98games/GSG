"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Factory, CheckCircle2, 
  AlertTriangle, Zap, BarChart3, 
  Plus, TrendingUp, TrendingDown, Clock,
  ShieldCheck, Layers
} from "lucide-react";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import { createClient } from "@/lib/supabase/client";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useToast } from "@/hooks/useToast";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { emitProductionSignal } from "@/lib/network/signalCollector";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { useForm } from "react-hook-form";
import { Decimal } from "decimal.js";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState as NewEmptyState } from "@/components/ui/StateViews";
import MomentumBar from "@/components/production/MomentumBar";

interface Bottleneck {
  department: string;
  bottleneck_score: number;
  wip_accumulation: number;
  recommendation: string;
}

interface ProductionBatch {
  id: string;
  batch_no: string;
  status: string;
  planned_qty: number;
  actual_qty?: number;
  created_at: string;
  sku?: { name: string; unit: string };
  costs?: { total_cost: number }[];
}

interface ProductionLog {
  department: string;
  qty_produced: number;
  quality_grade: string;
  log_date: string;
  time_taken_minutes: number;
}

export default function ProductionCommandCenter() {
  const { t, features, fmt } = useIndustryConfig();
  const { profile } = useBusinessProfile();
  const businessId = profile?.id;
  const { success: showSuccess, error: showError } = useToast();
  const supabase = createClient();

  const [dateRange] = useState({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });

  const [shiftTime, setShiftTime] = useState("08:00:00");

  // Real-time Shift Timer
  useEffect(() => {
    const start = new Date();
    start.setHours(8, 0, 0, 0); 
    const end = new Date(start);
    end.setHours(16, 0, 0, 0); 

    const updateTimer = () => {
      const nowTime = new Date();
      const diff = end.getTime() - nowTime.getTime();
      if (diff <= 0) {
        setShiftTime("SHIFT OVER");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setShiftTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);


  // 1. Bottleneck Analysis
  const { data: bottlenecks = [] } = useQuery({
    queryKey: ['production_bottlenecks', businessId, dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_bottleneck_analysis', {
        p_business_id: businessId,
        p_from: dateRange.from,
        p_to: dateRange.to
      });
      if (error) throw error;
      return data;
    },
    enabled: !!businessId
  });

  // 2. Active Batches
  const { data: batches = [], isLoading: isBatchesLoading, error: isBatchesError, refetch: refetchBatches } = useQuery({
    queryKey: ['active_batches', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_batches')
        .select(`
          *,
          sku:skus(name, unit),
          costs:batch_cost_items(total_cost)
        `)
        .eq('business_id', businessId)
        .neq('status', 'completed')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!businessId
  });

  // 3. Department Stats (derived from logs for today and yesterday)
  const { data: deptLogs = [] } = useQuery({
    queryKey: ['dept_logs_2d', businessId],
    queryFn: async () => {
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('karigar_production_logs')
        .select('department, qty_produced, quality_grade, log_date, time_taken_minutes')
        .eq('business_id', businessId)
        .gte('log_date', yesterday);
      if (error) throw error;
      return data;
    },
    enabled: !!businessId
  });

  const criticalBottleneck = useMemo(() => 
    bottlenecks.find((b: Bottleneck) => b.bottleneck_score >= 6), 
  [bottlenecks]);

  const warningBottleneck = useMemo(() => 
    bottlenecks.find((b: Bottleneck) => b.bottleneck_score >= 3 && b.bottleneck_score < 6), 
  [bottlenecks]);

  const qtyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'n' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        qtyRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (isBatchesLoading) return (
    <div className="p-6 bg-[#0F1113]">
      <div className="flex justify-between mb-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      <TableSkeleton rows={8} cols={5} />
    </div>
  );

  if (isBatchesError) return (
    <div className="min-h-screen bg-[#0F1113] flex items-center justify-center p-8">
      <ErrorState
        message="Could not load production command center"
        detail={(isBatchesError as Error).message}
        onRetry={refetchBatches}
      />
    </div>
  );

  if (!batches || (batches.length === 0 && deptLogs.length === 0)) return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 p-6 flex flex-col justify-center">
      <div className="flex justify-between mb-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      <NewEmptyState
        icon="🏭"
        title="No production logged today"
        description="Log your first production entry to track output"
        action={{ label: 'Log production', href: '/quick-entry' }}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter">
      <main className="transition-all duration-300 min-h-screen flex flex-col">
        {/* ALERT BAR */}
        <AnimatePresence>
          {criticalBottleneck && (
            <motion.div 
              initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              className="bg-red-500 text-white px-8 py-2 flex items-center justify-between overflow-hidden"
            >
              <div className="flex items-center space-x-3">
                <AlertTriangle size={16} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  CRITICAL BOTTLENECK: {criticalBottleneck.department} output down {Math.abs(criticalBottleneck.wip_accumulation)} units
                </span>
              </div>
              <span className="text-[10px] font-bold opacity-70 italic">{criticalBottleneck.recommendation}</span>
            </motion.div>
          )}
          {!criticalBottleneck && warningBottleneck && (
            <motion.div 
              initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              className="bg-amber-500 text-black px-8 py-2 flex items-center justify-between overflow-hidden"
            >
              <div className="flex items-center space-x-3">
                <Zap size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  PRODUCTION WARNING: {warningBottleneck.department} performance declining
                </span>
              </div>
              <span className="text-[10px] font-bold opacity-70 italic">{warningBottleneck.recommendation}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HEADER */}
        <header className="h-20 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-24 z-40">
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold tracking-tight text-white uppercase italic">
              {t.production} CommandCenter
            </h1>
            <p className="text-xxs font-semibold tracking-wide-md uppercase text-gray-500">Live Intelligence Stream • Noxis v13.0</p>
          </div>

          <div className="ml-auto flex items-center space-x-6">
            <div className="flex items-center bg-black/30 border border-white/5 px-4 py-2">
              <Clock size={14} className="text-gray-500 mr-2" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shift Time: {shiftTime} Remaining</span>
            </div>
            <button 
              onClick={() => {
                qtyRef.current?.focus();
                qtyRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center space-x-2 px-6 py-2.5 bg-[#0070F3] text-white text-[10px] uppercase tracking-widest font-black hover:brightness-110 shadow-[0_0_20px_rgba(0,112,243,0.3)] transition-all"
            >
               <Plus size={14} />
               <span>Log {t.production} <span className="opacity-50 ml-2">(N)</span></span>
            </button>
          </div>
        </header>


        <MomentumBar />

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT CONTENT */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            {/* DEPT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {['cutting', 'stitching', 'finishing', 'packing'].map(dept => (
                 <DepartmentCard 
                    key={dept} 
                    name={dept} 
                    logs={deptLogs.filter((s: ProductionLog) => s.department === dept)}
                    onLogProduction={() => {
                      qtyRef.current?.focus();
                      qtyRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                 />
               ))}
            </div>

            {/* BATCHES TABLE */}
            <div className="bg-[#1A1D21] border border-white/5 overflow-hidden">
               <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                     <div className="p-2 bg-blue-500/10 text-blue-500"><Layers size={18} /></div>
                     <h2 className="text-[10px] uppercase font-black text-white tracking-widest">Active Production Batches</h2>
                  </div>
                  <button className="text-[9px] font-black uppercase text-gray-500 hover:text-white transition-colors">View All Archive</button>
               </div>
               <div className="overflow-x-auto">
                  {batches.length === 0 ? (
                    <EmptyState 
                      icon={Layers}
                      title="No active batches"
                      body="Start a production batch to track output, costs, and completion across departments."
                      action={{
                        label: "Create First Batch",
                        href: "/production/batches"
                      }}
                    />
                  ) : (
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-[#0F1113] text-[9px] uppercase font-black text-gray-600 tracking-widest">
                             <th className="px-6 py-4">Batch / Product</th>
                             <th className="px-6 py-4">Started</th>
                             <th className="px-6 py-4 text-center">Output Target</th>
                             <th className="px-6 py-4">Progress Matrix</th>
                             <th className="px-6 py-4 text-right">Cost (MTD)</th>
                             <th className="px-6 py-4 text-center">Protocol</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {batches.map((batch: ProductionBatch) => (
                             <BatchRow key={batch.id} batch={batch} fmt={fmt} />
                          ))}
                       </tbody>
                    </table>
                  )}
               </div>
            </div>
          </div>

          {/* RIGHT SIDE PANEL: QUICK LOG */}
          <div className="w-[400px] border-l border-white/5 bg-[#1A1D21]/30 p-8 flex flex-col space-y-8 overflow-y-auto custom-scrollbar">
             <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Live Input Console</h3>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Direct Edge Device Entry</p>
             </div>

             <QuickLogPanel businessId={businessId} batches={batches} qtyRef={qtyRef} />

             <div className="pt-8 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                   <h4 className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Security Protocol</h4>
                   <ShieldCheck size={12} className="text-emerald-500" />
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed italic">
                   All entries are cryptographically signed and verified by the branch controller. Double-entry validation active.
                </p>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DepartmentCard({ name, logs, onLogProduction }: {
  name: string;
  logs: ProductionLog[];
  onLogProduction: () => void;
}) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  const todayLogs = logs.filter((l: ProductionLog) => l.log_date === today);
  const yesterdayLogs = logs.filter((l: ProductionLog) => l.log_date === yesterday);

  const todayOutput = todayLogs.reduce((sum, l) => sum + Number(l.qty_produced), 0);
  const yesterdayOutput = yesterdayLogs.reduce((sum, l) => sum + Number(l.qty_produced), 0);

  const percentChange = useMemo(() => {
    if (yesterdayOutput === 0) return null;
    const change = new Decimal(todayOutput).minus(yesterdayOutput).dividedBy(yesterdayOutput).times(100);
    return change.toDecimalPlaces(1);
  }, [todayOutput, yesterdayOutput]);

  const unitsPerHour = useMemo(() => {
    const logsWithTime = todayLogs.filter((l: ProductionLog) => Number(l.time_taken_minutes) > 0);
    if (logsWithTime.length === 0) return null;
    const totalQty = logsWithTime.reduce((sum, l) => sum + Number(l.qty_produced), 0);
    const totalTime = logsWithTime.reduce((sum, l) => sum + Number(l.time_taken_minutes), 0);
    return (totalQty / totalTime) * 60;
  }, [todayLogs]);

  const efficiency = useMemo(() => {
    if (!unitsPerHour) return null;
    const target = 50; // Default target
    return Math.min(100, Math.round((unitsPerHour / target) * 100));
  }, [unitsPerHour]);

  const gradeDistribution = useMemo(() => {
    const total = todayLogs.length || 1;
    const a = todayLogs.filter((l: ProductionLog) => l.quality_grade === 'A').length;
    const b = todayLogs.filter((l: ProductionLog) => l.quality_grade === 'B').length;
    const r = todayLogs.filter((l: ProductionLog) => l.quality_grade === 'rejected').length;
    return {
      a: (a / total) * 10,
      b: (b / total) * 10,
      r: (r / total) * 10
    };
  }, [todayLogs]);

  if (todayOutput === 0 && yesterdayOutput === 0) {
    return (
      <div className="bg-[#1A1D21] border border-white/5 p-6 flex flex-col items-center justify-center space-y-4 text-center group hover:border-[#0070F3]/30 transition-all min-h-[220px]">
        <h3 className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em]">{name}</h3>
        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">No production logged today</p>
        <button 
          onClick={onLogProduction}
          className="px-4 py-1.5 border border-[#0070F3] text-[#0070F3] text-[9px] font-black uppercase tracking-widest hover:bg-[#0070F3] hover:text-white transition-all"
        >
          Log Production
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1D21] border border-white/5 p-6 space-y-6 group hover:border-[#0070F3]/30 transition-all">
       <div className="flex justify-between items-start">
          <h3 className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em]">{name}</h3>
          <BarChart3 size={14} className="text-gray-700 group-hover:text-blue-500 transition-colors" />
       </div>
       
       <div>
          <span className="text-3xl font-black font-mono text-white tracking-tighter">
             {todayOutput}
          </span>
          {percentChange !== null && (
            <div className={cn(
              "flex items-center mt-1 text-[10px] font-bold",
              percentChange.isPositive() ? "text-emerald-500" : "text-red-500"
            )}>
               {percentChange.isPositive() ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
               <span>{percentChange.abs().toString()}% vs yesterday</span>
            </div>
          )}
       </div>

       <div className="space-y-2">
          <div className="flex justify-between text-[9px] font-black uppercase text-gray-500">
             <span>Efficiency</span>
             <span>{efficiency ? `${efficiency}%` : 'Log time to see efficiency'}</span>
          </div>
          {efficiency !== null && (
            <div className="h-1 bg-white/5 w-full">
               <div className="h-full bg-[#0070F3]" style={{ width: `${efficiency}%` }} />
            </div>
          )}
       </div>

       <div className="flex space-x-1 h-1.5">
          <div style={{ flex: gradeDistribution.a }} className="bg-emerald-500" title="Grade A" />
          <div style={{ flex: gradeDistribution.b }} className="bg-amber-500" title="Grade B" />
          <div style={{ flex: gradeDistribution.r }} className="bg-red-500" title="Rejected" />
       </div>
    </div>
  );
}

function BatchRow({ batch, fmt }: { batch: ProductionBatch, fmt: (v: number | string) => string }) {
  const costToDate = useMemo(() => 
    batch.costs?.reduce((acc: number, c: { total_cost: number }) => acc + Number(c.total_cost), 0) || 0,
  [batch.costs]);

  const progress = Math.min(100, Math.round((batch.actual_qty || 0) / batch.planned_qty * 100));

  return (
    <tr className="group hover:bg-white/[0.02] transition-colors">
       <td className="px-6 py-5">
          <div className="flex items-center space-x-3">
             <div className="w-10 h-10 bg-white/5 flex items-center justify-center font-black text-[10px] text-gray-500">
                {batch.batch_no.slice(-2)}
             </div>
             <div>
                <p className="text-xs font-black text-white uppercase tracking-tight">{batch.sku?.name}</p>
                <p className="text-[9px] text-gray-500 font-mono font-bold tracking-tighter">ID: {batch.batch_no}</p>
             </div>
          </div>
       </td>
       <td className="px-6 py-5">
          <span className="text-[10px] font-bold text-gray-400 uppercase">{format(new Date(batch.created_at), 'MMM dd')}</span>
       </td>
       <td className="px-6 py-5 text-center">
          <span className="text-xs font-black font-mono text-white">{batch.planned_qty}</span>
          <span className="text-[9px] text-gray-600 uppercase ml-1">{batch.sku?.unit}</span>
       </td>
       <td className="px-6 py-5">
          <div className="w-48 space-y-2">
             <div className="flex justify-between text-[8px] font-black uppercase text-gray-500">
                <span>Production Intensity</span>
                <span>{progress}%</span>
             </div>
             <div className="h-1.5 bg-white/5 w-full">
                <div 
                  className="h-full bg-[#0070F3] transition-all duration-500 shadow-[0_0_10px_rgba(0,112,243,0.5)]" 
                  style={{ width: `${progress}%` }} 
                />
             </div>
          </div>
       </td>
       <td className="px-6 py-5 text-right">
          <span className="text-sm font-black font-mono text-white">{fmt(costToDate)}</span>
       </td>
       <td className="px-6 py-5">
          <div className="flex justify-center">
             <StatusPill status={batch.status} />
          </div>
       </td>
    </tr>
  );
}

function StatusPill({ status }: { status: string }) {
  const configs: Record<string, string> = {
    open: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    in_progress: "text-[#0070F3] bg-[#0070F3]/10 border-[#0070F3]/20",
    paused: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    completed: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    cancelled: "text-gray-500 bg-gray-500/10 border-gray-500/20"
  };
  return (
    <span className={cn("px-3 py-1 text-[8px] font-black uppercase tracking-widest border rounded-full", configs[status])}>
       {status.replace('_', ' ')}
    </span>
  );
}

function QuickLogPanel({ businessId, batches, qtyRef }: {
  businessId: string | undefined;
  batches: ProductionBatch[];
  qtyRef: React.RefObject<HTMLInputElement | null>;
}) {
  const { profile } = useBusinessProfile();
  const { success: showSuccess, error: showError } = useToast();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, setValue } = useForm();
  const { t } = useIndustryConfig();
  
  // Destructure ref from register to combine with qtyRef
  const { ref: registerRef, ...qtyRegister } = register('qty', { required: true });

  const onSubmit = async (data: Record<string, string | number>) => {
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

      // Telemetry — Emit anonymous production signal silently
      if (profile?.industry_key && profile?.city) {
        const gradeAPercent = data.grade === 'A' ? 100 : 0;
        emitProductionSignal(
          profile.industry_key,
          profile.city,
          profile.country_code || 'PK',
          Number(data.qty),
          gradeAPercent
        ).catch(() => {});
      }

      showSuccess(`SUCCESSFULLY LOGGED ${data.qty} UNITS`);
      reset({ ...data, qty: '', grade: '' }); 
      queryClient.invalidateQueries({ queryKey: ['dept_logs_2d'] });
      queryClient.invalidateQueries({ queryKey: ['active_batches'] });
    } catch (err: unknown) {
      showError((err as Error).message || 'POST ERROR');
    }
  };

  const selectedGrade = watch('grade');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
       <div className="space-y-4">
          <div className="space-y-1">
             <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest">{`Operating ${t.worker}`}</label>
             <input {...register('karigar_id')} className="w-full bg-[#0F1113] border border-white/10 px-4 py-2.5 text-xs text-white outline-none focus:border-[#0070F3]" placeholder="Search code..." />
          </div>

          <div className="space-y-1">
             <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Active Batch</label>
             <select {...register('batch_id')} className="w-full bg-[#0F1113] border border-white/10 px-4 py-2.5 text-xs text-white outline-none focus:border-[#0070F3]">
                {batches.map((b: ProductionBatch) => (
                   <option key={b.id} value={b.id}>{b.batch_no} — {b.sku?.name}</option>
                ))}
             </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Dept.</label>
                <select {...register('department')} className="w-full bg-[#0F1113] border border-white/10 px-4 py-2.5 text-xs text-white outline-none focus:border-[#0070F3]">
                   <option value="cutting">Cutting</option>
                   <option value="stitching">Stitching</option>
                   <option value="finishing">Finishing</option>
                   <option value="packing">Packing</option>
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Time (Min)</label>
                <input type="number" {...register('time_taken')} className="w-full bg-[#0F1113] border border-white/10 px-4 py-2.5 text-xs text-white outline-none focus:border-[#0070F3]" />
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest">{`${t.productionUnit} Produced`}</label>
             <input 
               type="number" 
               {...qtyRegister}
               ref={(e) => {
                 registerRef(e);
                 (qtyRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
               }}
               className="w-full bg-white text-black font-black font-mono text-4xl text-center py-6 outline-none focus:ring-4 focus:ring-blue-500/20" 
             />
          </div>

          <div className="space-y-2">
             <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest">{`${t.qualityGrade} Grading`}</label>
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
       </div>

       <button type="submit" className="w-full py-4 bg-[#C5A059] text-black text-xs font-black uppercase tracking-[0.3em] hover:brightness-110 shadow-2xl transition-all">
          Authorize Post
       </button>
    </form>
  );
}
