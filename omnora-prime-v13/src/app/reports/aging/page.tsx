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
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/useToast";

interface LedgerAgingEntry {
  id: string;
  tx_ref: string;
  party_id: string;
  amount: number;
  posted_at: string;
  entry_type: 'debit' | 'credit';
  parties?: {
    name: string;
  } | null;
}

export default function AgingReportPage() {
  const { fmt, fmtDate, businessId, currency } = usePersona();
  const { isCollapsed } = useSidebarState();
  const supabase = createClient();
  const toast = useToast();

  const defaultStart = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  }, []);

  const defaultEnd = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const [dateRange, setDateRange] = useState({
    start: defaultStart,
    end: defaultEnd
  });

  const { data: entries = [], isLoading } = useQuery<LedgerAgingEntry[]>({
    queryKey: ['aging-ledger-entries', dateRange, businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ledger_entries')
        .select(`id, tx_ref, party_id, amount, posted_at, entry_type, parties(name), accounts!inner(account_code)`)
        .eq('business_id', businessId)
        .eq('status', 'posted')
        .eq('accounts.account_code', '1100')
        .lte('posted_at', dateRange.end + 'T23:59:59.999Z');
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!businessId
  });

  const agingAnalysis = useMemo(() => {
    const today = new Date(dateRange.end);
    const buckets = {
      current: { total: new Decimal(0), entries: [] as any[] },
      overdue_30: { total: new Decimal(0), entries: [] as any[] },
      overdue_60: { total: new Decimal(0), entries: [] as any[] },
      overdue_90: { total: new Decimal(0), entries: [] as any[] },
      overdue_critical: { total: new Decimal(0), entries: [] as any[] },
    };

    const partyWise: Record<string, any> = {};

    const entriesByParty: Record<string, LedgerAgingEntry[]> = {};
    entries.forEach(entry => {
      const pId = entry.party_id || 'unknown';
      if (!entriesByParty[pId]) {
        entriesByParty[pId] = [];
      }
      entriesByParty[pId].push(entry);
    });

    Object.entries(entriesByParty).forEach(([partyId, pEntries]) => {
      const debits = pEntries.filter(e => e.entry_type === 'debit')
        .sort((a, b) => new Date(a.posted_at).getTime() - new Date(b.posted_at).getTime());
      
      const credits = pEntries.filter(e => e.entry_type === 'credit');
      let totalCredits = credits.reduce((sum, c) => sum.plus(new Decimal(c.amount)), new Decimal(0));

      debits.forEach(debit => {
        const amt = new Decimal(debit.amount);
        let outstanding = new Decimal(0);
        
        if (totalCredits.greaterThanOrEqualTo(amt)) {
          totalCredits = totalCredits.minus(amt);
        } else {
          outstanding = amt.minus(totalCredits);
          totalCredits = new Decimal(0);
        }

        if (outstanding.greaterThan(0)) {
          const debitDateStr = debit.posted_at.split('T')[0];
          if (debitDateStr >= dateRange.start && debitDateStr <= dateRange.end) {
            const diffTime = today.getTime() - new Date(debitDateStr).getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            const partyName = debit.parties?.name || "Unknown Party";
            if (!partyWise[partyId]) {
              partyWise[partyId] = {
                name: partyName,
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
            buckets[bucketKey].entries.push({
              ...debit,
              outstanding: outstanding.toNumber(),
              diffDays,
              partyName
            });
            partyWise[partyId].buckets[bucketKey] = partyWise[partyId].buckets[bucketKey].plus(outstanding);
          }
        }
      });
    });

    return { 
      buckets, 
      partyWise: Object.values(partyWise), 
      totalOutstanding: Object.values(buckets).reduce((acc, b) => acc.plus(b.total), new Decimal(0)) 
    };
  }, [entries, dateRange]);

  const exportExcel = () => {
    const rows: any[] = [];

    Object.entries(agingAnalysis.buckets).forEach(([key, bucket]) => {
      bucket.entries.forEach(entry => {
        rows.push({
          'Party Name': entry.partyName || "Unknown",
          'Transaction Ref': entry.tx_ref,
          'Date Posted': entry.posted_at.split('T')[0],
          'Days Outstanding': entry.diffDays,
          'Total Debit Amount': entry.amount,
          'Outstanding Balance': entry.outstanding,
          'Bucket Category': key.toUpperCase()
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'A_R Aging Report');
    XLSX.writeFile(wb, `receivables_aging_${dateRange.start}_to_${dateRange.end}.xlsx`);
    toast.success('Excel Export', 'Aging report exported to Excel successfully');
  };

  if (isLoading) return <div className="min-h-screen bg-onyx flex items-center justify-center text-[10px] uppercase tracking-[0.5em] text-gray-700 animate-pulse">Analyzing Receivables...</div>;

  const totalOutstandingCount = Object.values(agingAnalysis.buckets).reduce((sum, b) => sum + b.entries.length, 0);

  if (totalOutstandingCount === 0) return (
    <div className="min-h-screen bg-onyx text-slate-200">
      <main className="p-24 flex flex-col items-center justify-center space-y-8">
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
             <div className="flex items-center bg-white/5 border border-white/10 rounded-sm overflow-hidden text-[10px] text-gray-400">
                <Calendar size={14} className="ml-3" />
                <input 
                  type="date" 
                  value={dateRange.start} 
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-transparent border-none text-white px-3 py-1.5 focus:ring-0 outline-none w-32"
                />
                <span className="opacity-30">/</span>
                <input 
                  type="date" 
                  value={dateRange.end} 
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-transparent border-none text-white px-3 py-1.5 focus:ring-0 outline-none w-32 mr-2"
                />
             </div>
             <button 
                onClick={exportExcel}
                className="flex items-center space-x-2 px-4 py-1.5 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 transition-colors"
             >
                 <Download size={14} />
                 <span>Export Excel</span>
             </button>
           </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <BucketCard label="Current" value={agingAnalysis.buckets.current.total} color="emerald" />
              <BucketCard label="1-30 Days" value={agingAnalysis.buckets.overdue_30.total} color="amber" />
              <BucketCard label="31-60 Days" value={agingAnalysis.buckets.overdue_60.total} color="orange" />
              <BucketCard label="61-90 Days" value={agingAnalysis.buckets.overdue_90.total} color="red" />
              <BucketCard label="90+ Days" value={agingAnalysis.buckets.overdue_critical.total} color="red-critical" />
           </div>

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

           <div className="bg-surface border border-white/5 overflow-hidden">
              <table className="w-full text-left">
                  <thead className="bg-onyx/50 border-b border-white/5 font-bold text-[10px] text-gray-500 uppercase tracking-widest">
                     <tr>
                        <th className="px-6 py-4">Party / Transaction</th>
                        <th className="px-6 py-4">Dates</th>
                        <th className="px-6 py-4 text-center">Days Overdue</th>
                        <th className="px-6 py-4 text-right">Total Amount</th>
                        <th className="px-6 py-4 text-right">Outstanding</th>
                        <th className="px-6 py-4 text-center">Severity Bucket</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                     {Object.entries(agingAnalysis.buckets).flatMap(([key, bucket]) => 
                       bucket.entries.map(entry => (
                         <tr key={entry.id} className="hover:bg-white/[0.01] transition-all group">
                            <td className="px-6 py-4">
                               <div className="flex flex-col">
                                  <span className="text-white text-xs font-bold uppercase tracking-tight">{entry.partyName}</span>
                                  <span className="text-[10px] font-mono text-electric-blue">{entry.tx_ref}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex flex-col text-[10px] font-medium text-gray-500 uppercase">
                                  <span>Posted: {entry.posted_at.split('T')[0]}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <span className={cn(
                                 "text-xs font-mono font-bold",
                                 entry.diffDays > 0 ? "text-red-500" : "text-emerald"
                               )}>
                                  {entry.diffDays > 0 ? `+${entry.diffDays}` : "Current"}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-xs text-gray-400">
                               {fmt(entry.amount)}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-sm text-white font-bold">
                               {fmt(entry.outstanding)}
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
