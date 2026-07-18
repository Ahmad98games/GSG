"use client";

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";

import { useSidebarState } from "@/hooks/useSidebarState";
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation';
import { 
  Users, Search, Filter, 
  ChevronRight, CreditCard, UserPlus, 
  Briefcase, Banknote,
  CheckCircle2, X, Calendar, AlertCircle, MessageCircle,
  Zap
} from "lucide-react";
import { sendWhatsAppAlert, ALERT_TEMPLATES } from "@/lib/whatsapp/alertEngine";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "@/components/ui/EmptyState";
import DataFreshness from "@/components/ui/DataFreshness";
import { SummaryCard } from "@/components/ui/SummaryCard";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/useToast";
import { humanizeError } from "@/lib/utils/errors";
import { emitWageSignal } from "@/lib/network/signalCollector";
import { 
  createColumnHelper, 
  flexRender, 
  getCoreRowModel, 
  useReactTable,
} from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Decimal } from "decimal.js";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from 'next/image';
import FinancialAmount from "@/components/ui/FinancialAmount";
import { useRowHighlight } from "@/hooks/useRowHighlight";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { Skeleton, KpiCardSkeleton, CardGridSkeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState as NewEmptyState, FieldError } from "@/components/ui/StateViews";
import { useDebounce } from "@/hooks/useDebounce";
import { useVirtualizer } from '@tanstack/react-virtual';

// --- Types ---

interface Karigar {
  id: string;
  karigar_code: string;
  name: string;
  phone: string | null;
  photo_url: string | null;
  wage_type: 'piece_rate' | 'daily_wage' | 'monthly_salary';
  piece_rate: number | null;
  daily_rate: number | null;
  monthly_salary: number | null;
  current_advance: number;
  status: 'active' | 'inactive' | 'on_leave';
  skill_type: string;
  joining_date: string;
  karigar_grades: { grade_name: string } | null;
}

interface Grade {
  id: string;
  grade_name: string;
}

const columnHelper = createColumnHelper<Karigar>();

// --- Validation Schemas ---

const karigarSchema = z.object({
  name: z.string().min(1, "Worker name is required"),
  father_name: z.string().optional(),
  cnic: z.string().optional(),
  phone: z.string().optional().refine(val => {
    if (!val) return true;
    const digits = val.replace(/[^0-9]/g, '');
    return digits.length >= 10 && digits.length <= 13;
  }, "Enter a valid phone number"),
  address: z.string().optional(),
  skill_type: z.string().min(1, "Skill type is required"),
  grade_id: z.string().min(1, "Grade is required"),
  wage_type: z.enum(['piece_rate', 'daily_wage', 'monthly_salary']),
  rate: z.coerce.number().min(0, "Rate cannot be negative"),
  joining_date: z.string().min(1, "Joining date is required"),
}).refine(data => {
  if (data.wage_type === 'piece_rate' && data.rate <= 0) return false;
  return true;
}, {
  message: "Enter piece rate amount",
  path: ["rate"]
}).refine(data => {
  if (data.wage_type === 'daily_wage' && data.rate <= 0) return false;
  return true;
}, {
  message: "Enter daily rate amount",
  path: ["rate"]
});

type KarigarFormValues = z.infer<typeof karigarSchema>;

const attendanceSchema = z.object({
  date: z.string().min(1),
  status: z.enum(['present', 'absent', 'half_day', 'leave', 'holiday']),
  notes: z.string().max(100).optional(),
});

const advanceSchema = z.object({
  amount: z.coerce.number().positive(),
  reason: z.enum(['Medical', 'Festival', 'Emergency', 'Other']),
  notes: z.string().optional(),
});

// --- Main Component ---

export default function KarigarsPage() {
  const { profile } = useBusinessProfile();
  const { t, features, fmt } = useIndustryConfig();
  const workerTerm = t.worker;
  const workerTermPlural = t.workers;
  const supabase = createClient();
  const queryClient = useQueryClient();
  const toast = useToast();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [attendingKarigar, setAttendingKarigar] = useState<Karigar | null>(null);
  const [advancingKarigar, setAdvancingKarigar] = useState<Karigar | null>(null);
  const [logOutputKarigar, setLogOutputKarigar] = useState<Karigar | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  // Memoized handlers
  const handleLogOutput = React.useCallback((k: Karigar) => {
    setLogOutputKarigar(k);
  }, []);

  const handleAttend = React.useCallback((k: Karigar) => {
    setAttendingKarigar(k);
  }, []);

  const handleAdvance = React.useCallback((k: Karigar) => {
    setAdvancingKarigar(k);
  }, []);

  const handleDelete = React.useCallback(async (karigar: Karigar) => {
    if (!confirm(`Are you sure you want to deactivate ${karigar.name}?`)) return;

    try {
      const { error } = await supabase
        .from('karigars')
        .update({ status: 'inactive' })
        .eq('id', karigar.id);

      if (!error) {
        import('@/stores/undoStore').then(({ useUndoStore }) => {
          useUndoStore.getState().pushAction({
            description: `Deactivated ${karigar.name}`,
            undo: async () => {
              const supabaseClient = createClient();
              await supabaseClient
                .from('karigars')
                .update({ status: 'active' })
                .eq('id', karigar.id);
              queryClient.invalidateQueries({ queryKey: ['karigars'] });
            }
          });
        });

        toast.success(`${karigar.name} deactivated`, { message: 'Press Ctrl+Z to undo' });
        queryClient.invalidateQueries({ queryKey: ['karigars'] });
      } else {
        toast.error('Failed to deactivate worker', humanizeError(error, 'deactivate karigar'));
      }
    } catch (err) {
      toast.error('Failed to deactivate worker', humanizeError(err, 'deactivate karigar'));
    }
  }, [supabase, queryClient, toast]);

  // Queries
  const { data: karigars = [], isLoading, error: karigarsError, refetch: refetchKarigars } = useQuery({
    queryKey: ['karigars', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('karigars')
        .select('*, karigar_grades(grade_name)')
        .eq('business_id', profile?.id)
        .order('name');
      if (error) throw error;
      setLastFetchedAt(new Date());
      return data as Karigar[];
    },
    enabled: !!profile?.id,
    staleTime: 10 * 60 * 1000,
  });

  const { data: attendanceToday = [] } = useQuery({
    queryKey: ['attendance_today', profile?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('karigar_id')
        .eq('business_id', profile?.id)
        .eq('log_date', today)
        .eq('status', 'present');
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['karigar_grades', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('karigar_grades').select('*').eq('business_id', profile?.id);
      if (error) throw error;
      return data as Grade[];
    },
    enabled: !!profile?.id,
    staleTime: 30 * 60 * 1000,
  });

  // Query active batches for production logging modal in the parent to avoid on-mount fetch
  const { data: activeBatches = [] } = useQuery({
    queryKey: ['active_batches_karigars', profile?.id],
    queryFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      try {
        const { data, error } = await supabase
          .from('production_batches')
          .select('id, batch_no, sku_id, skus(name, unit)')
          .eq('business_id', profile?.id)
          .neq('status', 'completed')
          .order('created_at', { ascending: false })
          .abortSignal(controller.signal)
          .limit(50);
        if (error) throw error;
        return data;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    enabled: !!profile?.id,
    staleTime: 10 * 60 * 1000,
  });

  const { mutate: markAttendance } = useOptimisticMutation<any, any>({
    queryKey: ['attendance_today', profile?.id],
    optimisticUpdate: (current, variables) => {
      const { karigarId, status, date } = variables;
      const existing = current.find(
        (a: any) => a.karigar_id === karigarId
      );
      if (existing) {
        return current.map((a: any) =>
          a.karigar_id === karigarId
            ? { ...a, status }
            : a
        );
      }
      return [...current, {
        karigar_id: karigarId,
        status,
        log_date: date,
        id: `temp_${karigarId}`,
      }];
    },
    mutationFn: async (variables) => {
      const { error } = await supabase
        .from('attendance_logs')
        .upsert({
          business_id: profile?.id,
          karigar_id: variables.karigarId,
          log_date: variables.date,
          status: variables.status,
          notes: variables.notes,
        }, {
          onConflict: 'business_id,karigar_id,log_date'
        });
      if (error) throw error;
    },
    successMessage: undefined,
    errorMessage: 'Attendance queued — will sync when online',
    undoDescription: 'Attendance mark',
  });

  const { mutate: logProduction } = useOptimisticMutation<any, any>({
    queryKey: ['active_batches_karigars', profile?.id],
    optimisticUpdate: (current, variables) => {
      return current;
    },
    mutationFn: async (variables) => {
      const { error } = await supabase
        .from('karigar_production_logs')
        .insert({
          business_id: profile?.id,
          karigar_id: variables.karigar_id,
          batch_id: variables.batch_id,
          sku_id: variables.sku_id,
          qty_produced: variables.qty_produced,
          piece_rate_used: variables.piece_rate_used,
          quality_grade: variables.quality_grade,
          department: variables.department,
          time_taken_minutes: variables.time_taken_minutes,
        });
      if (error) throw error;
    },
    successMessage: 'Production logged',
    undoDescription: 'Logged Production',
    undoFn: async (variables) => {
      const supabaseClient = createClient();
      await supabaseClient
        .from('karigar_production_logs')
        .delete()
        .eq('business_id', profile?.id)
        .eq('karigar_id', variables.karigar_id)
        .eq('qty_produced', variables.qty_produced)
        .order('created_at', { ascending: false })
        .limit(1);
    }
  });

  // Summary Stats
  const stats = useMemo(() => {
    const active = karigars.filter(k => k.status === 'active');
    const totalAdvances = karigars.reduce((acc, k) => acc.plus(new Decimal(k.current_advance)), new Decimal(0));
    
    // Honest payroll estimation based on active contracts
    const estMonthlyPayroll = active.reduce((acc, k) => {
      let monthly = new Decimal(0);
      if (k.wage_type === 'monthly_salary') {
        monthly = new Decimal(k.monthly_salary || 0);
      } else if (k.wage_type === 'daily_wage') {
        monthly = new Decimal(k.daily_rate || 0).times(26); // Standard 26-day industrial month
      }
      return acc.plus(monthly);
    }, new Decimal(0));

    return {
      activeCount: active.length,
      presentCount: attendanceToday.length,
      advancesOutstanding: totalAdvances,
      monthlyPayrollEst: estMonthlyPayroll
    };
  }, [karigars, attendanceToday]);

  const exportToExcel = () => {
    if (!karigars || karigars.length === 0) {
      toast.error('No data to export')
      return
    }
    
    const data = karigars.map((k: Karigar) => ({
      'Karigar Code': k.karigar_code,
      'Name': k.name,
      'Phone': k.phone || '',
      'Wage Type': k.wage_type,
      'Piece Rate': k.piece_rate || 0,
      'Daily Rate': k.daily_rate || 0,
      'Monthly Salary': k.monthly_salary || 0,
      'Current Advance': k.current_advance || 0,
      'Status': k.status,
      'Skill Type': k.skill_type || '',
      'Joining Date': k.joining_date || '',
    }))
    
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Karigars')
    XLSX.writeFile(wb,
      `noxis_karigars_${new Date().toISOString().split('T')[0]}.xlsx`
    )
    
    toast.success('Karigars registry exported to Excel')
  }

  const columns = useMemo(() => {
    const cols: any[] = [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => {
          const k = info.row.original;
          const initials = k.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '';
          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#60A5FA]/20 flex items-center justify-center text-[10px] font-bold text-[#60A5FA] flex-shrink-0 overflow-hidden relative">
                {k.photo_url ? (
                  <Image src={k.photo_url} alt={k.name} fill className="object-cover" />
                ) : (
                  initials
                )}
              </div>
              <span className="text-sm text-white font-medium">{k.name}</span>
            </div>
          );
        }
      }),
      columnHelper.accessor("karigar_code", {
        header: "Code",
        cell: (info) => {
          const k = info.row.original;
          return (
            <Link
              href={`/karigars/${k.id}`}
              className="text-[#60A5FA] hover:text-blue-300 transition-colors text-sm font-mono font-bold"
            >
              {k.karigar_code}
            </Link>
          );
        }
      }),
      columnHelper.accessor("karigar_grades.grade_name", {
        header: "Grade",
        cell: (info) => (
          <span className="text-xs text-gray-500">
            {info.getValue() || "—"}
          </span>
        ),
      }),
      columnHelper.accessor("wage_type", {
        header: "Pay Type",
        cell: (info) => {
          const type = info.getValue();
          const colors = {
            piece_rate: "text-electric-blue bg-electric-blue/10",
            daily_wage: "text-amber-500 bg-amber-500/10",
            monthly_salary: "text-emerald bg-emerald/10"
          };
          return <span className={cn("px-2 py-0.5 text-[9px] uppercase font-black rounded-sm", colors[type])}>{type.replace('_', ' ')}</span>;
        }
      })
    ];

    if (features.pieceRateWages) {
      cols.push(
        columnHelper.accessor("id", {
          id: "rate",
          header: () => <div className="text-right">{`Rate per ${t.productionUnit}`}</div>,
          cell: (info) => {
            const k = info.row.original;
            let rate = 0;
            let unit = "";
            if (k.wage_type === 'piece_rate') { rate = k.piece_rate || 0; unit = ` / ${t.productionUnit}`; }
            if (k.wage_type === 'daily_wage') { rate = k.daily_rate || 0; unit = " / day"; }
            if (k.wage_type === 'monthly_salary') { rate = k.monthly_salary || 0; unit = " / mo"; }
            return (
              <FinancialAmount 
                value={rate} 
                unit={unit}
                className="text-right"
              />
            );
          }
        })
      );
    }

    if (features.peshgiAdvances) {
      cols.push(
        columnHelper.accessor("current_advance", {
          header: () => <div className="text-right">{t.advance}</div>,
          cell: (info) => <FinancialAmount value={info.getValue()} />,
        })
      );
    }

    cols.push(
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const s = info.getValue();
          const colors = { active: "bg-emerald", inactive: "bg-gray-700", on_leave: "bg-amber-500" };
          return (
            <div className="flex items-center space-x-2">
               <div className={cn("w-1.5 h-1.5 rounded-full", colors[s])} />
               <span className="text-[10px] uppercase font-bold text-gray-500">{s.replace('_', ' ')}</span>
            </div>
          );
        }
      }),
      columnHelper.display({
        id: "actions",
        cell: (info) => {
          const k = info.row.original;
          const meta = info.table.options.meta as any;
          return (
            <div className="flex justify-end space-x-4">
               {k.wage_type === 'piece_rate' && (
                 <button 
                   onClick={() => meta?.onLogOutput(k)}
                   className="text-[10px] uppercase font-black text-sandstone-gold hover:text-white transition-colors flex items-center bg-transparent border-none cursor-pointer"
                 >
                   <Zap size={10} className="mr-1" /> {features.pieceRateWages ? 'Log Output' : 'Log Work'}
                 </button>
               )}
               <button onClick={() => meta?.onAttend(k)} className="text-[10px] uppercase font-black text-gray-600 hover:text-white transition-colors">Attend</button>
               <button onClick={() => meta?.onAdvance(k)} className="text-[10px] uppercase font-black text-gray-600 hover:text-white transition-colors">Advance</button>
               <button onClick={() => meta?.onDelete(k)} className="text-[10px] uppercase font-black text-red-500 hover:text-red-400 transition-colors">Remove</button>
               <Link href={`/karigars/${k.id}`} className="text-gray-500 hover:text-white"><ChevronRight size={16} /></Link>
            </div>
          );
        }
      })
    );

    return cols;
  }, [features, t, fmt]);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const filteredKarigars = useMemo(
    () =>
      karigars.filter((k) =>
        k.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      ),
    [karigars, debouncedSearch]
  );

  const table = useReactTable({
    data: filteredKarigars,
    columns,
    getCoreRowModel: getCoreRowModel(),
    initialState: { pagination: { pageSize: 100_000 } },
    meta: {
      onLogOutput: handleLogOutput,
      onAttend: handleAttend,
      onAdvance: handleAdvance,
      onDelete: handleDelete,
    }
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start ?? 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? rowVirtualizer.getTotalSize() - (virtualRows[virtualRows.length - 1]?.end ?? 0)
      : 0;

  if (isLoading) return (
    <div className="p-6 bg-noxis-bg">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      <CardGridSkeleton count={6} />
    </div>
  );

  if (karigarsError) return (
    <div className="min-h-screen bg-noxis-bg flex items-center justify-center p-8">
      <ErrorState
        message="Could not load workers registry"
        detail={(karigarsError as Error).message}
        onRetry={refetchKarigars}
      />
    </div>
  );

  if (!karigars || karigars.length === 0) return (
    <div className="min-h-screen bg-noxis-bg text-slate-200 p-6 flex flex-col">
      {/* Header with Register button still visible in zero-data state */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white">
            {workerTermPlural} Registry
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Human Resource Management &amp; Payouts
          </p>
        </div>
        <button
          onClick={() => setIsRegisterOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-electric-blue text-onyx text-sm font-semibold rounded-sm hover:brightness-110 transition-all shadow-lg"
        >
          <UserPlus size={14} />
          <span>Register {workerTerm}</span>
        </button>
      </div>

      {/* Clean empty state — no broken numbers, no skeleton placeholders */}
      <div className="flex-1 flex items-center justify-center">
        <NewEmptyState
          icon="👷"
          title="No workers registered yet"
          description="Add your first karigar to start tracking attendance, advances, and wages."
          action={{ label: `Register First ${workerTerm}`, onClick: () => setIsRegisterOpen(true) }}
        />
      </div>

      <AnimatePresence>
         {isRegisterOpen && (
           <RegisterKarigarModal 
            grades={grades}
            onClose={() => setIsRegisterOpen(false)} 
            onSuccess={(msg) => { setSuccessToast(msg); setIsRegisterOpen(false); queryClient.invalidateQueries({ queryKey: ['karigars'] }); }} 
           />
         )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen bg-noxis-bg text-slate-200 p-6">
      <main className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              {workerTermPlural} Registry
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Human Resource Management & Payouts
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsRegisterOpen(true)}
               className="flex items-center space-x-2 px-4 py-2 bg-electric-blue text-onyx text-sm font-semibold rounded-sm hover:brightness-110 transition-all shadow-lg"
             >
                <UserPlus size={14} />
                <span>Register {workerTerm}</span>
             </button>
          </div>
        </div>
           {/* Summary Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <SummaryCard label={`Total ${workerTermPlural}`} value={stats.activeCount} isCurrency={false} sub="Active duty" />
              <SummaryCard label="Present Today" value={stats.presentCount} isCurrency={false} sub="Attendance logged" />
              <SummaryCard label={t.advance} value={stats.advancesOutstanding.toNumber()} sub="Total outstanding" />
              <SummaryCard label="Est. Payroll" value={stats.monthlyPayrollEst.toNumber()} sub="Projected this month" />
            </div>

            <div className="flex justify-end">
               <DataFreshness 
                 lastFetchedAt={lastFetchedAt} 
                 onRefresh={() => queryClient.invalidateQueries({ queryKey: ['karigars'] })} 
               />
            </div>

           {/* Table Controls */}
           <div className="bg-surface border border-white/5 p-4 flex items-center justify-between">
              <div className="relative w-96">
                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                 <input 
                  type="text" 
                  placeholder={`Search by name or ${workerTerm} code...`} 
                  className="w-full bg-onyx border border-white/5 pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-electric-blue/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => toast.info('Coming soon', 'Filtering controls will be available in the next iteration.')}
                    className="p-2 border border-white/5 text-gray-500 hover:text-white hover:bg-white/5"
                  >
                    <Filter size={16} />
                  </button>
                 <button onClick={exportToExcel}
                   className="flex items-center gap-1.5
                     px-3 py-1.5 text-xs font-medium
                     border border-white/10 text-gray-400
                     hover:border-white/20 hover:text-white
                     transition-colors">
                   ↓ Export Excel
                 </button>
              </div>
           </div>

           {/* Main Registry Table */}
           <div className="bg-surface border border-white/5 flex-1 overflow-auto">
              {isLoading ? (
                <div className="p-20 space-y-4">
                   {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-white/[0.02] animate-pulse" />)}
                </div>
              ) : karigars.length === 0 ? (
                <EmptyState 
                  icon={Briefcase}
                  page="karigars"
                  action={{
                    label: `Onboard First ${workerTerm}`,
                    onClick: () => setIsRegisterOpen(true)
                  }}
                />
              ) : (
                <div
                  ref={parentRef}
                  className="overflow-x-auto overflow-y-auto"
                  style={{ maxHeight: 'calc(100vh - 200px)' }}
                >
                   <table className="w-full text-left">
                      <thead className="bg-[#1A1D21] border-b border-white/10 sticky top-0 z-10">
                         {table.getHeaderGroups().map(hg => (
                           <tr key={hg.id}>
                              {hg.headers.map(h => (
                                <th key={h.id} className="px-6 py-4 table-header">
                                   {flexRender(h.column.columnDef.header, h.getContext())}
                                </th>
                              ))}
                           </tr>
                         ))}
                      </thead>
                      <tbody>
                         {paddingTop > 0 && (
                           <tr>
                             <td style={{ height: `${paddingTop}px` }} colSpan={columns.length} />
                           </tr>
                         )}
                         {virtualRows.map((virtualRow) => {
                           const row = rows[virtualRow.index];
                           return (
                             <KarigarRow key={row.id} row={row} i={virtualRow.index} />
                           );
                         })}
                         {paddingBottom > 0 && (
                           <tr>
                             <td style={{ height: `${paddingBottom}px` }} colSpan={columns.length} />
                           </tr>
                         )}
                      </tbody>
                   </table>
                </div>
              )}
           </div>
      </main>

      {/* Modals — each in its own AnimatePresence to avoid cross-modal exit diffing */}
      <AnimatePresence>
         {isRegisterOpen && (
           <RegisterKarigarModal 
            grades={grades}
            onClose={() => setIsRegisterOpen(false)} 
            onSuccess={(msg) => { setSuccessToast(msg); setIsRegisterOpen(false); queryClient.invalidateQueries({ queryKey: ['karigars'] }); }} 
           />
         )}
      </AnimatePresence>
      <AnimatePresence>
         {attendingKarigar && (
           <AttendanceModal 
            karigar={attendingKarigar}
            onClose={() => setAttendingKarigar(null)}
            onSuccess={(msg) => { setSuccessToast(msg); setAttendingKarigar(null); }}
            onMark={markAttendance}
           />
         )}
      </AnimatePresence>
      <AnimatePresence>
         {advancingKarigar && (
           <AdvanceModal 
            karigar={advancingKarigar}
            onClose={() => setAdvancingKarigar(null)}
            onSuccess={(msg) => { setSuccessToast(msg); setAdvancingKarigar(null); queryClient.invalidateQueries({ queryKey: ['karigars'] }); }}
           />
         )}
      </AnimatePresence>

      {/* LogProductionModal rendered via portal — mounts outside this page's render tree
          so setLogOutputKarigar() does NOT trigger table/virtualizer re-renders */}
      {logOutputKarigar &&
        typeof document !== 'undefined' &&
        createPortal(
          <LogProductionModal
            karigar={logOutputKarigar}
            batches={activeBatches}
            onClose={() => setLogOutputKarigar(null)}
            onLog={logProduction}
            onSaved={() => {
              setSuccessToast(`Logged production output for ${logOutputKarigar.name} ✓`);
              setLogOutputKarigar(null);
              queryClient.invalidateQueries({
                queryKey: ['karigars']
              });
              queryClient.invalidateQueries({
                queryKey: ['production-logs']
              });
            }}
          />,
          document.body
        )
      }

      {/* Toast Notification */}
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
    </div>
  );
}

// --- Sub-Components ---


const KarigarRow = React.memo(
  function KarigarRow({ row, i }: { row: any; i: number }) {
    const controls = useRowHighlight(row.original.current_advance);
    
    return (
       <motion.tr 
         animate={controls}
         custom={controls}
         key={row.id} 
         className="border-b border-white/4 hover:bg-white/[0.02] transition-colors cursor-pointer"
       >
         {row.getVisibleCells().map((cell: any) => (
           <td key={cell.id} className="px-4 py-2.5 text-sm text-gray-200 border-b border-white/[0.04]">
             {flexRender(cell.column.columnDef.cell, cell.getContext())}
           </td>
         ))}
       </motion.tr>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.row.original === nextProps.row.original &&
      prevProps.i === nextProps.i
    );
  }
);

function RegisterKarigarModal({ grades, onClose, onSuccess }: { grades: Grade[], onClose: () => void, onSuccess: (msg: string) => void }) {
  const { profile } = useBusinessProfile();
  const supabase = createClient();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useIndustryConfig();
  const workerTerm = t.worker;

  const { register, handleSubmit, watch, formState: { errors } } = useForm<KarigarFormValues>({
    resolver: zodResolver(karigarSchema),
    mode: "onChange",
    defaultValues: {
      joining_date: new Date().toISOString().split('T')[0],
      wage_type: 'piece_rate',
      rate: 0
    }
  });

  const wageType = watch("wage_type");

  const onSubmit = async (values: KarigarFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('karigars').insert({
        business_id: profile?.id,
        name: values.name,
        father_name: values.father_name,
        cnic: values.cnic,
        phone: values.phone,
        address: values.address,
        skill_type: values.skill_type,
        grade_id: values.grade_id,
        wage_type: values.wage_type,
        piece_rate: values.wage_type === 'piece_rate' ? values.rate : null,
        daily_rate: values.wage_type === 'daily_wage' ? values.rate : null,
        monthly_salary: values.wage_type === 'monthly_salary' ? values.rate : null,
        joining_date: values.joining_date,
        status: 'active'
      }).select().single();

      if (error) throw error;

      // Telemetry — Emit anonymous wage signal silently
      if (profile?.industry_key && profile?.city) {
        const pieceRate = values.wage_type === 'piece_rate' ? values.rate : null;
        const dailyRate = values.wage_type === 'daily_wage' ? values.rate : null;
        const monthlySalary = values.wage_type === 'monthly_salary' ? values.rate : null;
        emitWageSignal(
          profile.industry_key,
          profile.city,
          profile.country_code || 'PK',
          values.wage_type,
          pieceRate || dailyRate || monthlySalary || 0,
          profile.currency || 'PKR'
        ).catch(() => {});
      }

      onSuccess(`Successfully registered ${values.name} into the registry.`);
    } catch (err: unknown) {
      toast.error("Onboarding failed", humanizeError(err, 'register worker'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm">
       <motion.div 
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        className="w-full max-w-xl bg-surface border-l border-white/5 h-full flex flex-col shadow-2xl"
       >
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
             <div className="flex items-center space-x-3">
                <div className="p-3 bg-electric-blue/10 text-electric-blue">
                   <UserPlus size={24} />
                </div>
                <div>
                   <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Onboard {workerTerm}</h2>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Personnel Registry System v9.0</p>
                </div>
             </div>
             <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-8 space-y-8">
             <div className="space-y-6">
                <SectionHeader icon={Users} label="Identity Profile" />
                <div className="grid grid-cols-2 gap-6">
                   <div className="col-span-2 space-y-2">
                      <Label>Full Name</Label>
                      <Input {...register("name")} placeholder="e.g. Muhammad Ahmed" />
                      <FieldError message={errors.name?.message} />
                   </div>
                   <div className="space-y-2">
                      <Label>Father&apos;s Name</Label>
                      <Input {...register("father_name")} />
                   </div>
                   <div className="space-y-2">
                      <Label>CNIC Number</Label>
                      <Input {...register("cnic")} placeholder="XXXXX-XXXXXXX-X" />
                   </div>
                   <div className="space-y-2 col-span-2">
                      <Label>Phone Number</Label>
                      <Input {...register("phone")} placeholder="e.g. 03001234567" />
                      <FieldError message={errors.phone?.message} />
                   </div>
                </div>
             </div>

             <div className="space-y-6">
                <SectionHeader icon={Briefcase} label="Employment Contract" />
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <Label>Artisan Grade</Label>
                      <select {...register("grade_id")} className="w-full bg-onyx border border-white/10 p-3 text-xs text-white outline-none focus:border-electric-blue transition-all">
                         <option value="">Select Grade</option>
                         {grades.map(g => <option key={g.id} value={g.id}>{g.grade_name}</option>)}
                      </select>
                      <FieldError message={errors.grade_id?.message} />
                   </div>
                   <div className="space-y-2">
                      <Label>Skill Vertical</Label>
                      <Input {...register("skill_type")} placeholder="e.g. Stitching" />
                      <FieldError message={errors.skill_type?.message} />
                   </div>
                   <div className="space-y-2">
                      <Label>Pay Model</Label>
                      <select {...register("wage_type")} className="w-full bg-onyx border border-white/10 p-3 text-xs text-white outline-none">
                         <option value="piece_rate">Piece Rate (Standard)</option>
                         <option value="daily_wage">Daily Wage</option>
                         <option value="monthly_salary">Fixed Monthly</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <Label>
                         {wageType === 'piece_rate' ? 'Rate per Piece (PKR)' : wageType === 'daily_wage' ? 'Daily Rate (PKR)' : 'Monthly Base (PKR)'}
                      </Label>
                      <Input type="number" {...register("rate")} />
                      <FieldError message={errors.rate?.message} />
                   </div>
                </div>
             </div>
          </form>

          <div className="p-8 bg-onyx border-t border-white/5 flex items-center space-x-4">
             <button onClick={onClose} className="flex-1 py-4 text-[10px] uppercase font-bold text-gray-500 hover:text-white transition-colors">Discard Draft</button>
             <button 
              onClick={handleSubmit(onSubmit)} 
              disabled={isSubmitting}
              className="flex-[2] py-4 bg-electric-blue text-onyx text-[10px] font-black uppercase tracking-widest shadow-xl hover:brightness-110 disabled:opacity-50"
             >
                {isSubmitting ? "Syncing..." : `Commit ${workerTerm} to Registry`}
             </button>
          </div>
       </motion.div>
    </div>
  );
}

function AttendanceModal({ karigar, onClose, onSuccess, onMark }: { karigar: Karigar, onClose: () => void, onSuccess: (msg: string) => void, onMark: (v: any) => Promise<void> }) {
  const { profile } = useBusinessProfile();
  const supabase = createClient();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit } = useForm<z.infer<typeof attendanceSchema>>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: { date: new Date().toISOString().split('T')[0], status: 'present' }
  });

  const onSubmit = async (values: z.infer<typeof attendanceSchema>) => {
    setIsSubmitting(true);
    try {
      await onMark({
        table: 'attendance_logs',
        operation: 'upsert',
        data: {
          business_id: profile?.id,
          karigar_id: karigar.id,
          log_date: values.date,
          status: values.status,
          notes: values.notes
        },
        karigarId: karigar.id,
        status: values.status,
        date: values.date,
        notes: values.notes
      });
      onSuccess(`Attendance logged for ${karigar.name}`);
    } catch (err: unknown) {
      toast.error("Logging failed", humanizeError(err, 'log attendance'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
       <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-surface border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-6 bg-onyx border-b border-white/5 flex items-center justify-between">
             <div className="flex items-center space-x-3">
                <Calendar className="text-electric-blue" size={18} />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Mark Attendance</h3>
             </div>
             <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
             <div className="space-y-2">
                <Label>Log Date <span className="text-[10px] text-gray-500">(past dates allowed)</span></Label>
                <Input type="date" max={new Date().toISOString().split('T')[0]} {...register("date")} />
             </div>
             <div className="space-y-2">
                <Label>Shift Status</Label>
                <select {...register("status")} className="w-full bg-onyx border border-white/10 p-3 text-xs text-white outline-none">
                   <option value="present">Present (Full Day)</option>
                   <option value="half_day">Half Day</option>
                   <option value="absent">Absent</option>
                   <option value="leave">On Leave</option>
                </select>
             </div>
             <div className="space-y-2">
                <Label>Notes <span className="text-[10px] text-gray-500">(optional)</span></Label>
                <textarea
                  {...register("notes")}
                  rows={2}
                  placeholder="e.g. Doctor leave, emergency absence..."
                  className="w-full bg-onyx border border-white/10 p-3 text-xs text-white outline-none resize-none placeholder:text-gray-600"
                />
             </div>
             <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-emerald text-onyx text-[10px] font-black uppercase tracking-widest shadow-lg">
                {isSubmitting ? "Logging..." : "Commit Attendance"}
             </button>
          </form>
       </motion.div>
    </div>
  );
}

function AdvanceModal({ karigar, onClose, onSuccess }: { karigar: Karigar, onClose: () => void, onSuccess: (msg: string) => void }) {
  const { profile } = useBusinessProfile();
  const supabase = createClient();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t, fmt } = useIndustryConfig();
  const { register, handleSubmit, watch: watchAdvance } = useForm<z.infer<typeof advanceSchema>>({
    resolver: zodResolver(advanceSchema),
    defaultValues: { reason: 'Medical' }
  });

  const onSubmit = async (values: z.infer<typeof advanceSchema>) => {
    setIsSubmitting(true);
    try {
      // 1. Log Advance
      const { error: advError } = await supabase.from('karigar_advances').insert({
        business_id: profile?.id,
        karigar_id: karigar.id,
        amount: values.amount,
        reason: values.reason,
        status: 'pending'
      });
      if (advError) throw advError;

      // 2. Update Karigar Balance
      const { error: updateError } = await supabase.from('karigars').update({
        current_advance: Number(karigar.current_advance) + Number(values.amount)
      }).eq('id', karigar.id);
      if (updateError) throw updateError;

      onSuccess(`Advance of ${fmt(values.amount)} issued to ${karigar.name}`);
    } catch (err: unknown) {
      toast.error("Transaction failed", humanizeError(err, 'issue advance'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
       <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-surface border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-6 bg-onyx border-b border-white/5 flex items-center justify-between">
             <div className="flex items-center space-x-3">
                 <Banknote className="text-amber-500" size={18} />
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest">{`Issue ${t.advance}`}</h3>
             </div>         
             <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
          </div>
          <div className="p-6 bg-amber-500/5 border-b border-white/5 flex items-center justify-between">
             <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Current Outstanding</span>
             <span className="font-mono text-amber-500 font-bold">{fmt(karigar.current_advance)}</span>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
             <div className="space-y-2">
                <Label>Advance Amount ({profile?.currency || 'PKR'})</Label>
                <input type="number" {...register("amount")} className="w-full bg-onyx border border-white/10 p-4 text-2xl font-mono text-center text-sandstone-gold outline-none" placeholder="0.00" />
             </div>
             <div className="space-y-2">
                <Label>Reason for Disbursement</Label>
                <select {...register("reason")} className="w-full bg-onyx border border-white/10 p-3 text-xs text-white outline-none">
                   <option>Medical</option>
                   <option>Festival</option>
                   <option>Emergency</option>
                   <option>Other</option>
                </select>
             </div>
             <div className="flex flex-col space-y-3">
               <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-sandstone-gold text-onyx text-[10px] font-black uppercase tracking-widest shadow-lg">
                  {isSubmitting ? "Processing..." : "Disburse Funds"}
               </button>
               
               <button 
                 type="button"
                 onClick={() => {
                   const msg = ALERT_TEMPLATES.advance_request({ name: karigar.name, amount: String(watchAdvance('amount')), reason: watchAdvance('reason') });
                   sendWhatsAppAlert(karigar.phone || '', msg);
                 }}
                 className="w-full py-3 border border-[#25D366]/30 text-[#25D366] text-[10px] font-black uppercase tracking-widest hover:bg-[#25D366]/5 flex items-center justify-center space-x-2"
               >
                  <MessageCircle size={14} />
                  <span>Send WhatsApp Alert</span>
               </button>
             </div>
          </form>
       </motion.div>
    </div>
  );
}

interface LogProductionModalProps {
  karigar: Karigar;
  batches: any[];
  onClose: () => void;
  onSaved: () => void;
  onLog: (v: any) => Promise<void>;
}

function LogProductionModal({ karigar, batches = [], onClose, onSaved, onLog }: LogProductionModalProps) {
  const { profile } = useBusinessProfile();
  const supabase = createClient();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t, features, fmt } = useIndustryConfig();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      log_date: new Date().toISOString().split('T')[0],
      batch_id: '',
      department: 'stitching',
      qty_produced: '',
      piece_rate_used: karigar.piece_rate || 0,
      quality_grade: 'A',
      time_taken_minutes: ''
    }
  });

  const selectedGrade = watch('quality_grade');

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const selectedBatch = batches.find((b: any) => b.id === values.batch_id);
      const skuId = selectedBatch?.sku_id || null;
      const unit = selectedBatch?.skus?.unit || 'pcs';

      await onLog({
        table: 'karigar_production_logs',
        operation: 'insert',
        data: {
          business_id: profile?.id,
          karigar_id: karigar.id,
          batch_id: values.batch_id || null,
          sku_id: skuId,
          qty_produced: Number(values.qty_produced),
          piece_rate_used: Number(values.piece_rate_used),
          quality_grade: values.quality_grade,
          department: values.department,
          time_taken_minutes: values.time_taken_minutes ? Number(values.time_taken_minutes) : null
        },
        karigar_id: karigar.id,
        batch_id: values.batch_id || null,
        sku_id: skuId,
        qty_produced: Number(values.qty_produced),
        piece_rate_used: Number(values.piece_rate_used),
        quality_grade: values.quality_grade,
        department: values.department,
        time_taken_minutes: values.time_taken_minutes ? Number(values.time_taken_minutes) : null
      });

      onSaved();
    } catch (err: unknown) {
      toast.error("Transaction failed", humanizeError(err, 'log production'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
       <motion.div 
         initial={{ scale: 0.95, opacity: 0 }} 
         animate={{ scale: 1, opacity: 1 }} 
         className="max-w-md w-full bg-surface border border-white/10 shadow-2xl overflow-hidden"
       >
          <div className="p-6 bg-onyx border-b border-white/5 flex items-center justify-between">
             <div className="flex items-center space-x-3">
                <Zap className="text-electric-blue" size={18} />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{`Log ${t.production}`}</h3>
             </div>
             <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
          </div>
          
          <div className="p-6 bg-blue-500/5 border-b border-white/5 flex flex-col space-y-1">
             <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{t.worker}</span>
             <span className="text-sm text-white font-bold">{karigar.name} ({karigar.karigar_code})</span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
             <div className="space-y-2">
                <Label>Log Date</Label>
                <Input type="date" {...register("log_date", { required: true })} />
             </div>

             <div className="space-y-2">
                <Label>Active Batch</Label>
                <select 
                  {...register("batch_id", { required: true })} 
                  className={cn(
                    "w-full bg-onyx border p-3 text-xs text-white outline-none focus:border-electric-blue transition-all",
                    errors.batch_id ? "border-red-500/50" : "border-white/10"
                  )}
                >
                   <option value="">Select Batch...</option>
                   {batches.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.batch_no} — {b.skus?.name}</option>
                   ))}
                </select>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label>Department</Label>
                   <select {...register("department")} className="w-full bg-onyx border border-white/10 p-3 text-xs text-white outline-none focus:border-electric-blue">
                      <option value="cutting">Cutting</option>
                      <option value="stitching">Stitching</option>
                      <option value="finishing">Finishing</option>
                      <option value="packing">Packing</option>
                      <option value="other">Other</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <Label>Time Taken (Min)</Label>
                   <Input type="number" placeholder="Optional" {...register("time_taken_minutes")} />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label>{`${t.productionUnit} Produced`}</Label>
                   <Input 
                     type="number" 
                     placeholder="0" 
                     {...register("qty_produced", { required: true, min: 1 })} 
                     className={cn(
                       "w-full bg-onyx border p-3 text-xs text-white outline-none focus:border-electric-blue transition-all",
                       errors.qty_produced ? "border-red-500/50" : "border-white/10"
                     )}
                   />
                </div>
                <div className="space-y-2">
                   <Label>{`Rate per ${t.productionUnit} (${profile?.currency || 'PKR'})`}</Label>
                   <Input 
                     type="number" 
                     step="0.0001" 
                     {...register("piece_rate_used", { required: true })} 
                     className={cn(
                       "w-full bg-onyx border p-3 text-xs text-white outline-none focus:border-electric-blue transition-all",
                       errors.piece_rate_used ? "border-red-500/50" : "border-white/10"
                     )}
                   />
                </div>
             </div>

             <div className="space-y-2">
                <Label>{`${t.qualityGrade} Grading`}</Label>
                <div className="grid grid-cols-4 gap-2">
                   {['A', 'B', 'C', 'rejected'].map(g => (
                      <button 
                        key={g} 
                        type="button"
                        onClick={() => setValue('quality_grade', g)}
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

             <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-[#C5A059] disabled:opacity-50 text-black text-[10px] font-black uppercase tracking-widest shadow-lg">
                {isSubmitting ? "Logging..." : `Commit ${t.production}`}
             </button>
          </form>
       </motion.div>
    </div>
  );
}

// --- Helpers ---

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType, label: string }) {
  return (
    <div className="flex items-center space-x-3 border-b border-white/5 pb-3">
       <Icon size={14} className="text-gray-500" />
       <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{label}</span>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] uppercase font-bold text-gray-600 tracking-widest">{children}</label>;
}

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
  <input ref={ref} {...props} className="w-full bg-onyx border border-white/10 p-3 text-xs text-white focus:border-electric-blue outline-none transition-all" />
));
Input.displayName = "Input";

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return <div className="text-[9px] text-critical-red uppercase font-bold mt-1 flex items-center space-x-1">
    <AlertCircle size={10} />
    <span>{children}</span>
  </div>;
}
