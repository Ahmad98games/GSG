"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { usePersona } from "@/hooks/usePersona";

import { useSidebarState } from "@/hooks/useSidebarState";
import { 
  FileDown, TrendingUp, AlertCircle, 
  Filter, Calendar, Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Decimal } from "decimal.js";
import { cn } from "@/lib/utils";
import IndustrialEmptyState from "@/components/ui/IndustrialEmptyState";

interface Invoice {
  id: string;
  invoice_number: string;
  party_id: string;
  total_amount: number;
  amount_paid: number;
  due_date: string;
  created_at: string;
  status: string;
  parties?: {
    name: string;
  };
}

export default function AgingReportPage() {
  const { fmt, fmtDate, businessId, currency } = usePersona();
  const { isCollapsed } = useSidebarState();
  const supabase = createClient();

  const [filterParty, setFilterParty] = useState("all");

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['unpaid-invoices', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`*, parties(name)`)
        .eq('business_id', businessId)
        .in('status', ['posted', 'partial']);
      if (error) throw error;
      return data || [];
    },
    enabled: !!businessId
  });

  const agingAnalysis = useMemo(() => {
    const today = new Date();
    const buckets = {
      current: { total: new Decimal(0), invoices: [] as any[] },
      overdue_30: { total: new Decimal(0), invoices: [] as any[] },
      overdue_60: { total: new Decimal(0), invoices: [] as any[] },
      overdue_90: { total: new Decimal(0), invoices: [] as any[] },
      overdue_critical: { total: new Decimal(0), invoices: [] as any[] },
    };

    const partyWise: Record<string, any> = {};

    invoices.forEach(inv => {
      const dueDate = new Date(inv.due_date);
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const outstanding = new Decimal(inv.total_amount).minus(inv.amount_paid || 0);
      if (outstanding.lte(0)) return;

      const partyId = inv.party_id;
      if (!partyWise[partyId]) {
        partyWise[partyId] = {
          name: inv.parties?.name || "Unknown Party",
          total: new Decimal(0),
          buckets: { current: new Decimal(0), overdue_30: new Decimal(0), overdue_60: new Decimal(0), overdue_90: new Decimal(0), overdue_critical: new Decimal(0) }
        };
      }

      partyWise[partyId].total = partyWise[partyId].total.plus(outstanding);

      let bucketKey: keyof typeof buckets = 'current';
      if (diffDays <= 0) bucketKey = 'current';
      else if (diffDays <= 30) bucketKey = 'overdue_30';
      else if (diffDays <= 60) bucketKey = 'overdue_60';
      else if (diffDays <= 90) bucketKey = 'overdue_90';
      else bucketKey = 'overdue_critical';

      buckets[bucketKey].total = buckets[bucketKey].total.plus(outstanding);
      buckets[bucketKey].invoices.push({ ...inv, outstanding: outstanding.toNumber(), diffDays });
      partyWise[partyId].buckets[bucketKey] = partyWise[partyId].buckets[bucketKey].plus(outstanding);
    });

    return { buckets, partyWise: Object.values(partyWise), totalOutstanding: Object.values(buckets).reduce((acc, b) => acc.plus(b.total), new Decimal(0)) };
  }, [invoices]);

  const exportCSV = () => {
    const rows = [
      ["Party", "Invoice #", "Invoice Date", "Due Date", "Days Overdue", "Total", "Paid", "Outstanding", "Bucket"]
    ];

    Object.entries(agingAnalysis.buckets).forEach(([key, bucket]) => {
      bucket.invoices.forEach(inv => {
        rows.push([
          inv.parties?.name || "Unknown",
          inv.invoice_number,
          inv.created_at.split('T')[0],
          inv.due_date,
          inv.diffDays.toString(),
          inv.total_amount.toString(),
          inv.amount_paid.toString(),
          inv.outstanding.toString(),
          key.toUpperCase()
        ]);
      });
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `noxis_aging_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  

  if (isLoading) return <div className="min-h-screen bg-onyx flex items-center justify-center text-[10px] uppercase tracking-[0.5em] text-gray-700 animate-pulse">Analyzing Receivables...</div>;

  if (invoices.length === 0) return (
    <div className="min-h-screen bg-onyx text-slate-200">
      
      <main className={` p-24 flex flex-col items-center justify-center space-y-8`}>
         <div className="w-24 h-24 bg-emerald/10 rounded-full flex items-center justify-center text-emerald">
            <TrendingUp size={48} />
         </div>
         <div className="text-center space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white">All Receivables are Current ✓</h1>
            <p className="text-gray-500 max-w-sm mx-auto">Excellent operational discipline. Your cash flow cycle is fully synchronized with zero overdue invoices.</p>
         </div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-onyx text-slate-200 font-inter">
      <main className="transition-all duration-300 min-h-screen flex flex-col">
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-surface/50 backdrop-blur-md sticky top-0 z-40">
           <div className="flex items-center space-x-3">
              <Calendar size={18} className="text-electric-blue" />
              <h1 className="text-[10px] uppercase font-black tracking-[0.4em] text-white">Reports / A/R Aging Intelligence</h1>
           </div>
           
           <div className="ml-auto flex items-center space-x-4">
              <button 
                onClick={exportCSV}
                className="flex items-center space-x-2 px-4 py-1.5 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 transition-colors"
              >
                 <Download size={14} />
                 <span>Export CSV</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-1.5 bg-electric-blue text-onyx text-[10px] uppercase tracking-widest font-bold hover:brightness-110 transition-colors">
                 <FileDown size={14} />
                 <span>Export PDF</span>
              </button>
           </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">
           {/* Summary Grid */}
           <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <BucketCard label="Current" value={agingAnalysis.buckets.current.total} color="emerald" />
              <BucketCard label="1-30 Days" value={agingAnalysis.buckets.overdue_30.total} color="amber" />
              <BucketCard label="31-60 Days" value={agingAnalysis.buckets.overdue_60.total} color="orange" />
              <BucketCard label="61-90 Days" value={agingAnalysis.buckets.overdue_90.total} color="red" />
              <BucketCard label="90+ Days" value={agingAnalysis.buckets.overdue_critical.total} color="red-critical" />
           </div>

           {/* Total Bar */}
           <div className="bg-surface border border-white/5 p-6 flex items-center justify-between">
              <div className="space-y-1">
                 <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Total Outstanding Receivables</span>
                 <p className="text-3xl font-black font-mono text-white tracking-tighter">{fmt(agingAnalysis.totalOutstanding.toNumber())}</p>
              </div>
              <div className="flex items-center space-x-4">
                 <div className="text-right">
                    <span className="text-[9px] uppercase text-gray-600 font-bold tracking-widest">DSO (Days Sales Outstanding)</span>
                    <p className="text-lg font-mono font-bold text-emerald">24.5 Days</p>
                 </div>
                 <AlertCircle size={32} className="text-gray-800" />
              </div>
           </div>

           {/* Main Table */}
           <div className="bg-surface border border-white/5 overflow-hidden">
              <table className="w-full text-left">
                 <thead className="bg-onyx/50 border-b border-white/5 font-bold text-[10px] text-gray-500 uppercase tracking-widest">
                    <tr>
                       <th className="px-6 py-4">Party / Invoice</th>
                       <th className="px-6 py-4">Dates</th>
                       <th className="px-6 py-4 text-center">Days Overdue</th>
                       <th className="px-6 py-4 text-right">Total Amount</th>
                       <th className="px-6 py-4 text-right">Outstanding</th>
                       <th className="px-6 py-4 text-center">Severity Bucket</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/[0.02]">
                    {Object.entries(agingAnalysis.buckets).flatMap(([key, bucket]) => 
                      bucket.invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-white/[0.01] transition-all group">
                           <td className="px-6 py-4">
                              <div className="flex flex-col">
                                 <span className="text-white text-xs font-bold uppercase tracking-tight">{inv.parties?.name}</span>
                                 <span className="text-[10px] font-mono text-electric-blue">{inv.invoice_number}</span>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex flex-col text-[10px] font-medium text-gray-500 uppercase">
                                 <span>Issued: {inv.created_at.split('T')[0]}</span>
                                 <span>Due: {inv.due_date}</span>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <span className={cn(
                                "text-xs font-mono font-bold",
                                inv.diffDays > 0 ? "text-red-500" : "text-emerald"
                              )}>
                                 {inv.diffDays > 0 ? `+${inv.diffDays}` : "Current"}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right font-mono text-xs text-gray-400">
                              {fmt(inv.total_amount)}
                           </td>
                           <td className="px-6 py-4 text-right font-mono text-sm text-white font-bold">
                              {fmt(inv.outstanding)}
                           </td>
                           <td className="px-6 py-4 text-center">
                              <SeverityBadge bucket={key} />
                           </td>
                        </tr>
                      ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </main>
    </div>
  );
}

function BucketCard({ label, value, color }: { label: string, value: Decimal, color: string }) {
  const colorMap: any = {
    'emerald': 'border-emerald/20 text-emerald',
    'amber': 'border-amber-500/20 text-amber-500',
    'orange': 'border-orange-500/20 text-orange-500',
    'red': 'border-red-500/20 text-red-500',
    'red-critical': 'border-red-600/40 text-red-600 bg-red-600/5'
  };

  return (
    <div className={cn("p-6 bg-surface border rounded-sm space-y-2", colorMap[color])}>
       <span className="text-[9px] uppercase font-black tracking-widest opacity-60">{label}</span>
       <p className="text-xl font-mono font-black">{value.toNumber().toLocaleString()}</p>
    </div>
  );
}

function SeverityBadge({ bucket }: { bucket: string }) {
  const configs: any = {
    current: { label: "Current", style: "bg-emerald/10 text-emerald border-emerald/20" },
    overdue_30: { label: "1-30 Days", style: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    overdue_60: { label: "31-60 Days", style: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
    overdue_90: { label: "61-90 Days", style: "bg-red-500/10 text-red-500 border-red-500/20" },
    overdue_critical: { label: "90+ Days", style: "bg-red-600/20 text-red-600 border-red-600/40 animate-pulse" },
  };

  const config = configs[bucket];
  return (
    <span className={cn(
      "px-3 py-1 text-[9px] font-black uppercase tracking-widest border rounded-full",
      config.style
    )}>
       {config.label}
    </span>
  );
}
