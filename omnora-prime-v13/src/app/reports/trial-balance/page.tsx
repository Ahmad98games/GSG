"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Landmark, Download, Calendar, 
  AlertTriangle, CheckCircle2,
  ArrowRight, FileSpreadsheet
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";

import { useSidebarState } from "@/hooks/useSidebarState";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Decimal } from "decimal.js";

interface TBRow {
  account_code: string;
  account_name: string;
  account_type: string;
  debit_balance: number;
  credit_balance: number;
}

export default function TrialBalancePage() {
  const { fmt, businessId } = usePersona();
  const { isCollapsed } = useSidebarState();
  const supabase = createClient();

  
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const { data: rows, isLoading: isRowsLoading } = useQuery<TBRow[]>({
    queryKey: ['trial-balance-rows', dateRange, businessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_trial_balance', {
        p_business_id: businessId,
        p_date_from: dateRange.from,
        p_date_to: dateRange.to
      });
      if (error) throw error;
      return data;
    },
    enabled: !!businessId
  });

  const { data: integrity, isLoading: isIntegrityLoading } = useQuery({
    queryKey: ['trial-balance-integrity', dateRange, businessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_trial_balance_integrity', {
        p_business_id: businessId,
        p_date_from: dateRange.from,
        p_date_to: dateRange.to
      });
      if (error) throw error;
      return data[0];
    },
    enabled: !!businessId
  });

  const isLoading = isRowsLoading || isIntegrityLoading;
  const isUnbalanced = integrity && !integrity.is_balanced;

  

  const exportCSV = () => {
    if (!rows) return;
    const headers = ["Account Code", "Account Name", "Type", "Debit", "Credit"];
    const csvRows = rows.map(r => [
      r.account_code,
      r.account_name,
      r.account_type,
      r.debit_balance.toString(),
      r.credit_balance.toString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trial_balance_${dateRange.from}_to_${dateRange.to}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter">
      
      
      <main className={` transition-all duration-300`}>
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-surface/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
            <Link href="/reports" className="hover:text-white transition-colors">Reports Hub</Link>
            <span className="mx-3 opacity-30">/</span>
            <span className="text-white">Trial Balance</span>
          </div>

          <div className="ml-auto flex items-center space-x-4">
             <div className="flex items-center bg-white/5 border border-white/10 rounded-sm overflow-hidden text-[10px] text-gray-400">
                <Calendar size={14} className="ml-3" />
                <input 
                  type="date" 
                  value={dateRange.from} 
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="bg-transparent border-none text-white px-3 py-1.5 focus:ring-0 outline-none w-32"
                />
                <span className="opacity-30">/</span>
                <input 
                  type="date" 
                  value={dateRange.to} 
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="bg-transparent border-none text-white px-3 py-1.5 focus:ring-0 outline-none w-32 mr-2"
                />
             </div>
             <button 
              onClick={exportCSV}
              className="flex items-center space-x-2 px-4 py-1.5 bg-[#1A1D21] border border-white/10 text-[10px] uppercase tracking-widest font-bold hover:bg-white/5 transition-colors"
             >
                <FileSpreadsheet size={14} className="text-[#C5A059]" />
                <span>Export CSV</span>
             </button>
          </div>
        </header>

        <div className="p-12 max-w-[1200px] mx-auto space-y-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="py-32 flex flex-col items-center justify-center space-y-4 font-mono"
              >
                <div className="w-12 h-12 border-2 border-[#C5A059]/20 border-t-[#C5A059] animate-spin rounded-full" />
                <span className="text-[10px] uppercase tracking-[0.4em] text-gray-500 font-bold">Verifying Ledger Integrity...</span>
              </motion.div>
            ) : isUnbalanced ? (
              <motion.div 
                key="unbalanced"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/5 border border-red-500/20 p-12 text-center space-y-6"
              >
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="text-red-500" size={40} />
                </div>
                <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">System Imbalance Detected</h2>
                <p className="text-gray-400 max-w-lg mx-auto text-sm">
                  The ledger currently has a variance of <span className="text-red-500 font-mono font-bold">{fmt(integrity.variance)}</span>. 
                  This indicates a data integrity failure in double-entry streams.
                </p>
                <div className="flex items-center justify-center space-x-4 pt-6">
                  <Link href="/reports/ledger" className="px-8 py-3 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 transition-all flex items-center">
                    Review Raw Ledger <ArrowRight size={14} className="ml-2" />
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="table"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 flex items-center space-x-3">
                  <CheckCircle2 className="text-emerald-500" size={20} />
                  <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">Ledger Integrity: Balanced</span>
                </div>

                <div className="bg-[#1A1D21] border border-white/5 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-[#0F1113] text-[10px] text-gray-500 uppercase tracking-widest font-bold border-b border-white/5">
                      <tr>
                        <th className="px-8 py-5">Account Code</th>
                        <th className="px-8 py-5">Account Name</th>
                        <th className="px-8 py-5">Account Type</th>
                        <th className="px-8 py-5 text-right">Debit Balance</th>
                        <th className="px-8 py-5 text-right">Credit Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                      {rows?.map((row) => (
                        <tr key={row.account_code} className="hover:bg-white/[0.01] transition-colors group">
                          <td className="px-8 py-4 font-mono text-xs text-gray-500">{row.account_code}</td>
                          <td className="px-8 py-4 text-xs font-bold text-white uppercase tracking-tight">{row.account_name}</td>
                          <td className="px-8 py-4 text-[10px] text-gray-600 uppercase font-bold">{row.account_type}</td>
                          <td className={cn(
                            "px-8 py-4 text-right font-mono text-sm",
                            row.debit_balance > 0 ? "text-white font-bold" : "text-gray-800"
                          )}>
                            {row.debit_balance > 0 ? fmt(row.debit_balance) : "—"}
                          </td>
                          <td className={cn(
                            "px-8 py-4 text-right font-mono text-sm",
                            row.credit_balance > 0 ? "text-[#C5A059] font-bold" : "text-gray-800"
                          )}>
                            {row.credit_balance > 0 ? fmt(row.credit_balance) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-white/5 border-t-2 border-white/10">
                      <tr>
                        <td colSpan={3} className="px-8 py-6 text-xs font-bold text-white uppercase tracking-[0.2em]">Totals</td>
                        <td className="px-8 py-6 text-right font-mono text-xl font-bold text-white">{fmt(integrity?.total_debits || 0)}</td>
                        <td className="px-8 py-6 text-right font-mono text-xl font-bold text-[#C5A059]">{fmt(integrity?.total_credits || 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
