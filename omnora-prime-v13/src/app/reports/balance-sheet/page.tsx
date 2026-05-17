"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Download, 
  ShieldCheck, AlertCircle, 
  Search, Calendar, Printer
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";

import { useSidebarState } from "@/hooks/useSidebarState";
import Link from "next/link";
import { cn } from "@/lib/utils";
import IndustrialEmptyState from "@/components/ui/IndustrialEmptyState";
import { useRouter } from "next/navigation";
import { Decimal } from "decimal.js";

interface ReportRow {
  section: string;
  account_code: string | null;
  account_name: string;
  amount: number;
  is_subtotal: boolean;
}

export default function BalanceSheetPage() {
  const router = useRouter();
  const { fmt, fmtDate, businessId } = usePersona();
  const { isCollapsed } = useSidebarState();
  const supabase = createClient();

  
  const [asAtDate, setAsAtDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: rows, isLoading } = useQuery<ReportRow[]>({
    queryKey: ['balance-sheet', asAtDate, businessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_balance_sheet', {
        p_business_id: businessId,
        p_as_at_date: asAtDate
      });
      if (error) throw error;
      return data;
    },
    enabled: !!businessId
  });

  
  
  const currentAssets = rows?.filter(r => r.section === 'current_asset' && !r.is_subtotal) || [];
  const totalCurrentAssets = rows?.find(r => r.section === 'current_asset' && r.is_subtotal)?.amount || 0;
  
  const fixedAssets = rows?.filter(r => r.section === 'fixed_asset' && !r.is_subtotal) || [];
  const totalFixedAssets = rows?.find(r => r.section === 'fixed_asset' && r.is_subtotal)?.amount || 0;
  
  const totalAssets = rows?.find(r => r.section === 'total_assets')?.amount || 0;

  const liabilities = rows?.filter(r => r.section === 'current_liability' && !r.is_subtotal) || [];
  const totalLiabilities = rows?.find(r => r.section === 'current_liability' && r.is_subtotal)?.amount || 0;

  const equityRows = rows?.filter(r => r.section === 'equity' && !r.is_subtotal) || [];
  const totalEquity = rows?.find(r => r.section === 'equity' && r.is_subtotal)?.amount || 0;
  
  const totalLE = rows?.find(r => r.section === 'total_le')?.amount || 0;

  const isBalanced = new Decimal(totalAssets).equals(new Decimal(totalLE));
  const hasData = (rows?.length ?? 0) > 0;

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter print:bg-white print:text-black">
      
      
      <main className={` transition-all duration-300 print:pl-0`}>
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-surface/50 backdrop-blur-md sticky top-0 z-40 print:hidden">
          <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
            <Link href="/reports" className="hover:text-white transition-colors">Reports Hub</Link>
            <span className="mx-3 opacity-30">/</span>
            <span className="text-white">Balance Sheet</span>
          </div>

          <div className="ml-auto flex items-center space-x-4">
             <div className="flex items-center bg-white/5 border border-white/10 rounded-sm overflow-hidden text-[10px] text-gray-400">
                <span className="ml-3 font-bold uppercase tracking-widest text-[9px]">As At</span>
                <input 
                  type="date" 
                  value={asAtDate} 
                  onChange={(e) => setAsAtDate(e.target.value)}
                  className="bg-transparent border-none text-white px-3 py-1.5 focus:ring-0 outline-none w-40"
                />
             </div>
             <button 
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-1.5 bg-[#C5A059] text-black text-[10px] uppercase tracking-widest font-bold hover:bg-[#D4AF37] transition-colors"
             >
                <Printer size={14} />
                <span>Print Statement</span>
             </button>
          </div>
        </header>

        <div className="p-12 max-w-[1200px] mx-auto space-y-8 print:p-0 print:max-w-full">
          {isLoading ? (
             <div className="py-40 text-center text-xs uppercase tracking-[0.4em] text-gray-600 animate-pulse font-mono">Calculating Financial Position...</div>
          ) : !hasData ? (
             <IndustrialEmptyState 
                title="Balance Sheet Empty"
                description="No financial position data available for this date."
                actionLabel="Review Ledger"
                onAction={() => router.push('/reports/ledger')}
             />
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block">
                {/* Assets Column */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  className="bg-[#1A1D21] border border-white/5 p-10 space-y-10 print:bg-white print:text-black print:border-none print:p-8"
                >
                  <h2 className="text-xl font-bold text-white uppercase tracking-widest border-b border-white/10 pb-4 print:text-black print:border-black">Assets</h2>
                  
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059] font-black">Current Assets</h3>
                      <div className="space-y-2">
                        {currentAssets.map((row) => (
                          <div key={row.account_name} className="flex justify-between items-center text-xs py-1">
                            <span className="text-gray-400 uppercase tracking-tight print:text-gray-700">{row.account_name}</span>
                            <span className="font-mono text-white print:text-black">{fmt(row.amount)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between pt-2 border-t border-white/5 font-bold text-sm text-white print:border-black print:text-black">
                        <span className="uppercase tracking-widest text-[10px]">Total Current Assets</span>
                        <span className="font-mono">{fmt(totalCurrentAssets)}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059] font-black">Fixed Assets</h3>
                      <div className="space-y-2">
                        {fixedAssets.map((row) => (
                          <div key={row.account_name} className="flex justify-between items-center text-xs py-1">
                            <span className="text-gray-400 uppercase tracking-tight print:text-gray-700">{row.account_name}</span>
                            <span className={cn("font-mono", row.amount < 0 ? "text-red-500" : "text-white print:text-black")}>
                              {row.amount < 0 ? `(${fmt(Math.abs(row.amount))})` : fmt(row.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between pt-2 border-t border-white/5 font-bold text-sm text-white print:border-black print:text-black">
                        <span className="uppercase tracking-widest text-[10px]">Total Fixed Assets</span>
                        <span className="font-mono">{fmt(totalFixedAssets)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 p-6 bg-white/5 border border-white/5 flex justify-between items-center print:bg-gray-50 print:border-black">
                    <span className="text-xs font-bold text-white uppercase tracking-[0.2em] print:text-black">Total Assets</span>
                    <span className="text-2xl font-bold font-mono text-[#C5A059] print:text-black">{fmt(totalAssets)}</span>
                  </div>
                </motion.div>

                {/* Liabilities & Equity Column */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  className="bg-[#1A1D21] border border-white/5 p-10 space-y-10 print:bg-white print:text-black print:border-none print:p-8 print:mt-12"
                >
                  <h2 className="text-xl font-bold text-white uppercase tracking-widest border-b border-white/10 pb-4 print:text-black print:border-black">Liabilities & Equity</h2>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059] font-black">Liabilities</h3>
                      <div className="space-y-2">
                        {liabilities.map((row) => (
                          <div key={row.account_name} className="flex justify-between items-center text-xs py-1">
                            <span className="text-gray-400 uppercase tracking-tight print:text-gray-700">{row.account_name}</span>
                            <span className="font-mono text-white print:text-black">{fmt(row.amount)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between pt-2 border-t border-white/5 font-bold text-sm text-white print:border-black print:text-black">
                        <span className="uppercase tracking-widest text-[10px]">Total Liabilities</span>
                        <span className="font-mono">{fmt(totalLiabilities)}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059] font-black">Equity</h3>
                      <div className="space-y-2">
                        {equityRows.map((row) => (
                          <div key={row.account_name} className="flex justify-between items-center text-xs py-1">
                            <span className="text-gray-400 uppercase tracking-tight print:text-gray-700">{row.account_name}</span>
                            <span className="font-mono text-white print:text-black">{fmt(row.amount)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between pt-2 border-t border-white/5 font-bold text-sm text-white print:border-black print:text-black">
                        <span className="uppercase tracking-widest text-[10px]">Total Equity</span>
                        <span className="font-mono">{fmt(totalEquity)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 p-6 bg-white/5 border border-white/5 flex justify-between items-center print:bg-gray-50 print:border-black">
                    <span className="text-xs font-bold text-white uppercase tracking-[0.2em] print:text-black">Total Liabilities & Equity</span>
                    <span className="text-2xl font-bold font-mono text-[#C5A059] print:text-black">{fmt(totalLE)}</span>
                  </div>
                </motion.div>
              </div>

              <div className={cn(
                "p-4 flex items-center justify-center space-x-3 border print:border-2 print:border-black print:bg-white print:text-black",
                isBalanced ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" : "bg-red-500/5 border-red-500/20 text-red-500"
              )}>
                {isBalanced ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
                <span className="text-[10px] uppercase tracking-[0.3em] font-black">
                  {isBalanced ? "Accounting Equation Verified (A = L + E)" : "Imbalance Detected: Accounting Equation Failure"}
                </span>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
