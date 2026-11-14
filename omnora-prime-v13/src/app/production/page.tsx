"use client";

import Link from "next/link";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Factory, CheckCircle2, 
  AlertTriangle, Zap, BarChart3, 
  Plus, TrendingUp, TrendingDown, Clock,
  ShieldCheck, Layers, Search, ChevronDown, Hammer
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
      // 1. Try local SQLite API first
      try {
        const res = await fetch('/api/production/batches?status=all');
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) return json.data;
        }
      } catch {}

      // 2. Supabase fallback
      try {
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
        if (!error && data) return data;
      } catch {}

      return [];
    },
    enabled: true
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
    <div className="min-h-screen bg-[#0F1113] text-slate-200 p-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-[#131823] border border-white/10 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-2xl font-bold">
          ⚡
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-black text-white uppercase tracking-wider">
            No Active {t.production || 'Operations'} Today
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Record real-time floor logs, personal training sessions, or register a new batch cycle to track output and capacity.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/quick-entry"
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-cyan-500/20"
          >
            Quick Entry Console
          </Link>
          <Link
            href="/production/batches"
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-wider rounded-xl border border-white/10 transition"
          >
            Batch Registry
          </Link>
        </div>
      </div>
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
            <p className="text-xxs font-semibold tracking-wide-md uppercase text-gray-500">Live Intelligence Stream • Noxis v{process.env.NEXT_PUBLIC_APP_VERSION || '14.0.32'}</p>
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

function BatchRow({ batch, fmt }: { batch: ProductionBatch, fmt: (amount: number) => string }) {
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

function QuickLogPanel({ businessId, batches: initialBatches, qtyRef }: {
  businessId: string | undefined;
  batches: ProductionBatch[];
  qtyRef: React.RefObject<HTMLInputElement | null>;
}) {
  const { profile } = useBusinessProfile();
  const { success: showSuccess, error: showError } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, setValue } = useForm();
  const { t } = useIndustryConfig();

  const [workerSearch, setWorkerSearch] = useState("");
  const [isWorkerDropdownOpen, setIsWorkerDropdownOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [qty, setQty] = useState<number>(50);
  const [selectedGrade, setSelectedGrade] = useState<string>("A");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Real Operating Workers from local SQLite
  const { data: karigars = [] } = useQuery<any[]>({
    queryKey: ['quick_panel_karigars', businessId],
    queryFn: async () => {
      try {
        const res = await fetch('/api/karigars');
        const json = await res.json();
        if (Array.isArray(json?.data) && json.data.length > 0) {
          return json.data;
        }
      } catch {}
      return [
        { id: 'kar_001', name: 'Muhammad Akram', karigar_code: 'KAR-001', designation: 'Master Weaver', department: 'Weaving' },
        { id: 'kar_002', name: 'Razia Bibi', karigar_code: 'KAR-002', designation: 'Senior Stitching Master', department: 'Stitching' },
        { id: 'kar_003', name: 'Shahid Ali', karigar_code: 'KAR-003', designation: 'Master Cutter', department: 'Cutting' },
        { id: 'kar_004', name: 'Muhammad Aslam', karigar_code: 'KAR-004', designation: 'Loom Operator', department: 'Weaving' },
        { id: 'kar_005', name: 'Rashid Mehmood', karigar_code: 'KAR-005', designation: 'Fabric Inspector', department: 'Finishing' },
      ];
    }
  });

  // 2. Fetch Real Active Batches from local SQLite
  const { data: batches = [] } = useQuery<any[]>({
    queryKey: ['quick_panel_batches', businessId],
    queryFn: async () => {
      try {
        const res = await fetch('/api/production/batches?status=all');
        const json = await res.json();
        if (Array.isArray(json?.data) && json.data.length > 0) {
          return json.data;
        }
      } catch {}
      return initialBatches && initialBatches.length > 0 ? initialBatches : [
        { id: 'bat_001', batch_no: 'BAT-2026-001', sku: { name: 'Super Basmati Yarn 30/1' } },
        { id: 'bat_002', batch_no: 'BAT-2026-002', sku: { name: 'Grey Lawn Fabric 68x68' } },
        { id: 'bat_003', batch_no: 'BAT-2026-003', sku: { name: 'Cotton Slub 40s Ring Spun' } },
      ];
    },
    initialData: initialBatches && initialBatches.length > 0 ? initialBatches : undefined
  });

  // Auto-select first worker and first batch on load
  useEffect(() => {
    if (karigars.length > 0 && !selectedWorker) {
      handleSelectWorker(karigars[0]);
    }
    if (batches.length > 0) {
      setValue('batch_id', batches[0].id);
    }
    setValue('department', 'cutting');
    setValue('time_taken', '45');
  }, [karigars, batches]);

  // Click outside to close worker dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsWorkerDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredWorkers = useMemo(() => {
    if (!workerSearch.trim()) return karigars;
    const q = workerSearch.toLowerCase();
    return karigars.filter((k: any) => 
      k.name.toLowerCase().includes(q) || 
      (k.karigar_code && k.karigar_code.toLowerCase().includes(q)) ||
      (k.department && k.department.toLowerCase().includes(q))
    );
  }, [karigars, workerSearch]);

  const handleSelectWorker = (worker: any) => {
    setSelectedWorker(worker);
    setValue('karigar_id', worker.id);
    setWorkerSearch(worker.name);
    setIsWorkerDropdownOpen(false);

    if (worker.department) {
      const dep = worker.department.toLowerCase();
      if (dep.includes('stitching') || dep.includes('sewing')) setValue('department', 'stitching');
      else if (dep.includes('finishing') || dep.includes('folding')) setValue('department', 'finishing');
      else if (dep.includes('packing') || dep.includes('dispatch')) setValue('department', 'packing');
      else setValue('department', 'cutting');
    }
  };

  const onSubmit = async (data: Record<string, any>) => {
    if (!selectedWorker) {
      showError('Please select an operating worker');
      return;
    }
    if (qty <= 0) {
      showError('Production quantity must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        business_id: businessId || 'local',
        karigar_id: selectedWorker.id,
        batch_id: data.batch_id || (batches[0]?.id || null),
        department: data.department || 'Cutting',
        qty_produced: Number(qty),
        quality_grade: selectedGrade,
        time_taken_minutes: Number(data.time_taken) || 45,
        notes: `Factory floor edge log by supervisor at ${new Date().toLocaleTimeString()}`
      };

      const res = await fetch('/api/production/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to authorize production entry');
      }

      showSuccess(`SUCCESSFULLY LOGGED ${qty} UNITS FOR ${selectedWorker.name.toUpperCase()}`);
      queryClient.invalidateQueries({ queryKey: ['dept_logs_2d'] });
      queryClient.invalidateQueries({ queryKey: ['active_batches'] });
      queryClient.invalidateQueries({ queryKey: ['quick_panel_batches'] });
      queryClient.invalidateQueries({ queryKey: ['karigars'] });

      // Telemetry — Emit anonymous production signal silently
      if (profile?.industry_key && profile?.city) {
        const gradeAPercent = selectedGrade === 'A' ? 100 : 0;
        emitProductionSignal(
          profile.industry_key,
          profile.city,
          profile.country_code || 'PK',
          Number(qty),
          gradeAPercent
        ).catch(() => {});
      }

      setQty(50);
      setSelectedGrade('A');
    } catch (err: unknown) {
      showError((err as Error).message || 'POST ERROR');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-4">
        {/* Operating Worker (Searchable Dropdown) */}
        <div className="space-y-1 relative" ref={dropdownRef}>
          <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Hammer size={11} className="text-cyan-400" />
              <span>{`Operating ${t.worker}`}</span>
            </span>
            {selectedWorker?.karigar_code && (
              <span className="text-cyan-400 font-mono text-[9px] font-bold">{selectedWorker.karigar_code}</span>
            )}
          </label>

          <div 
            onClick={() => setIsWorkerDropdownOpen(prev => !prev)}
            className="w-full bg-[#0F1113] border border-white/10 px-3 py-2 text-xs text-white rounded cursor-pointer flex items-center justify-between hover:border-cyan-500/50 transition-colors"
          >
            <span className={selectedWorker ? "text-white font-medium truncate" : "text-gray-500"}>
              {selectedWorker ? `${selectedWorker.name} (${selectedWorker.karigar_code || 'Worker'})` : "Select Operating Worker..."}
            </span>
            <ChevronDown size={14} className="text-gray-400 shrink-0 ml-1" />
          </div>

          {isWorkerDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#181D28] border border-white/20 rounded shadow-2xl z-50 max-h-56 overflow-y-auto">
              <div className="p-2 border-b border-white/10 sticky top-0 bg-[#181D28]">
                <div className="flex items-center gap-2 bg-[#0B0E14] px-2 py-1.5 rounded border border-white/10 text-xs">
                  <Search size={12} className="text-gray-400 shrink-0" />
                  <input 
                    type="text"
                    value={workerSearch}
                    onChange={e => setWorkerSearch(e.target.value)}
                    placeholder="Search worker name or code..."
                    className="bg-transparent text-white outline-none w-full text-xs font-sans"
                    autoFocus
                  />
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {filteredWorkers.map((w: any) => (
                  <div
                    key={w.id}
                    onClick={() => handleSelectWorker(w)}
                    className={cn(
                      "p-2.5 hover:bg-white/5 cursor-pointer transition-colors text-xs flex items-center justify-between",
                      selectedWorker?.id === w.id ? "bg-cyan-500/10 text-cyan-300 font-bold" : "text-slate-200"
                    )}
                  >
                    <div>
                      <p className="font-semibold">{w.name}</p>
                      <p className="text-[10px] text-gray-400">{w.designation || 'Worker'} • {w.department || 'Floor'}</p>
                    </div>
                    {w.karigar_code && (
                      <span className="text-[10px] font-mono bg-white/5 px-1.5 py-0.5 rounded text-gray-300">
                        {w.karigar_code}
                      </span>
                    )}
                  </div>
                ))}

                {filteredWorkers.length === 0 && (
                  <div className="p-3 text-center text-xs text-gray-500">
                    No workers matched
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Active Batch Selector */}
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5">
            <Layers size={11} className="text-cyan-400" />
            <span>Active Batch</span>
          </label>
          <select 
            {...register('batch_id')} 
            className="w-full bg-[#0F1113] border border-white/10 px-3 py-2 text-xs text-white rounded outline-none focus:border-cyan-500 transition-colors cursor-pointer"
          >
            {batches.map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.batch_no || b.batch_number} {b.sku?.name ? `— ${b.sku.name}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Dept & Time Taken */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Dept.</label>
            <select {...register('department')} className="w-full bg-[#0F1113] border border-white/10 px-3 py-2 text-xs text-white rounded outline-none focus:border-cyan-500">
              <option value="cutting">Cutting</option>
              <option value="stitching">Stitching</option>
              <option value="finishing">Finishing</option>
              <option value="packing">Packing</option>
              <option value="weaving">Weaving</option>
              <option value="dyeing">Dyeing</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Time (Min)</label>
            <input type="number" {...register('time_taken')} defaultValue={45} className="w-full bg-[#0F1113] border border-white/10 px-3 py-2 text-xs text-white rounded outline-none focus:border-cyan-500 font-mono" placeholder="45" />
          </div>
        </div>

        {/* Production Quantity with -10/+10 buttons and preset pills */}
        <div className="space-y-2 bg-[#0B0E14] border border-white/10 p-3.5 rounded">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-black uppercase text-cyan-400 tracking-widest">
              {`${t.productionUnit} Quantity`}
            </label>
            <span className="text-[11px] font-mono text-gray-400 font-bold">
              Current: {qty}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQty(prev => Math.max(1, prev - 10))}
              className="h-10 w-10 rounded bg-white/5 hover:bg-white/10 border border-white/10 font-bold font-mono text-xs text-gray-300 transition-colors cursor-pointer shrink-0"
            >
              -10
            </button>

            <input 
              ref={qtyRef as any}
              type="number" 
              value={qty}
              min={1}
              onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-[#131720] border border-cyan-500/40 text-cyan-300 font-black font-mono text-2xl text-center py-2 rounded outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
            />

            <button
              type="button"
              onClick={() => setQty(prev => prev + 10)}
              className="h-10 w-10 rounded bg-white/5 hover:bg-white/10 border border-white/10 font-bold font-mono text-xs text-gray-300 transition-colors cursor-pointer shrink-0"
            >
              +10
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {[10, 25, 50, 100, 250].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setQty(val)}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer",
                  qty === val
                    ? "bg-cyan-500 text-slate-950 shadow-sm"
                    : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                )}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Quality Grading */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Quality Grading</label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { grade: 'A', label: 'Grade A' },
              { grade: 'B', label: 'Grade B' },
              { grade: 'C', label: 'Grade C' },
              { grade: 'REJ', label: 'Rejected' },
            ].map(g => (
              <button 
                key={g.grade} 
                type="button"
                onClick={() => setSelectedGrade(g.grade)}
                className={cn(
                  "py-2 text-[10px] font-black uppercase rounded border transition-all cursor-pointer",
                  selectedGrade === g.grade 
                    ? "bg-white text-slate-950 border-white shadow-md font-bold scale-[1.02]" 
                    : "bg-[#0B0E14] text-gray-400 border-white/10 hover:border-white/20 hover:text-white"
                )}
              >
                {g.grade}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-[0.99] text-slate-950 text-xs font-black uppercase tracking-[0.25em] rounded shadow-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Clock size={14} className="animate-spin" />
            <span>Authorizing...</span>
          </>
        ) : (
          <>
            <ShieldCheck size={15} />
            <span>Authorize Post</span>
          </>
        )}
      </button>
    </form>
  );
}
