"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Can } from "@/components/rbac/Can";
import { motion } from "framer-motion";
import { 
  TrendingUp, Download, Calendar, 
  ArrowDownRight, FileText, Search,
  Filter, Printer, ChevronDown
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { useLicense } from "@/hooks/useLicense";
import { createClient } from "@/lib/supabase/client";

import { useSidebarState } from "@/hooks/useSidebarState";
import Link from "next/link";
import { cn } from "@/lib/utils";
import IndustrialEmptyState from "@/components/ui/IndustrialEmptyState";
import { useRouter } from "next/navigation";
import { Decimal } from "decimal.js";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/useToast";

interface PLRow {
  section: string;
  account_code: string | null;
  account_name: string;
  amount: number;
  is_subtotal: boolean;
}

export default function ProfitLossPage() {
  const router = useRouter();
  const { fmt, fmtDate, t, businessId } = usePersona();
  const { tier } = useLicense();
  const { isCollapsed } = useSidebarState();
  const toast = useToast();
  
  const supabase = createClient();

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

  const [selectedBranch, setSelectedBranch] = useState<string>("all");

  const { data: branches } = useQuery({
    queryKey: ['branches', businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from('branches').select('id, name');
      if (error) throw error;
      return data;
    },
    enabled: !!businessId && tier === 'elite'
  });

  const { data, isLoading } = useQuery<PLRow[]>({
    queryKey: ['profit-loss', dateRange, selectedBranch, businessId],
    queryFn: async () => {
      let query = supabase
        .from('ledger_entries')
        .select('amount, entry_type, posted_at, branch_id, accounts!inner(id, account_code, name, type)')
        .eq('business_id', businessId)
        .eq('status', 'posted')
        .gte('posted_at', dateRange.start)
        .lte('posted_at', dateRange.end + 'T23:59:59.999Z');
      
      if (selectedBranch && selectedBranch !== 'all') {
        query = query.eq('branch_id', selectedBranch);
      }
      
      const { data: entries, error } = await query;
      if (error) throw error;

      const accountBalances: { [id: string]: { code: string; name: string; type: string; debits: Decimal; credits: Decimal } } = {};
      
      (entries || []).forEach((entry: any) => {
        const acc = entry.accounts;
        if (!acc) return;
        
        if (!accountBalances[acc.id]) {
          accountBalances[acc.id] = {
            code: acc.account_code,
            name: acc.name,
            type: acc.type,
            debits: new Decimal(0),
            credits: new Decimal(0)
          };
        }
        
        const amt = new Decimal(entry.amount);
        if (entry.entry_type === 'debit') {
          accountBalances[acc.id].debits = accountBalances[acc.id].debits.plus(amt);
        } else {
          accountBalances[acc.id].credits = accountBalances[acc.id].credits.plus(amt);
        }
      });
      
      const accountsList = Object.values(accountBalances).map(acc => {
        let balance = new Decimal(0);
        if (acc.type === 'asset' || acc.type === 'expense') {
          balance = acc.debits.minus(acc.credits);
        } else {
          balance = acc.credits.minus(acc.debits);
        }
        return {
          code: acc.code,
          name: acc.name,
          type: acc.type,
          balance: balance
        };
      });

      const revenueAccounts = accountsList.filter(a => a.type === 'revenue' && !a.balance.isZero());
      const totalRevenue = accountsList
        .filter(a => a.type === 'revenue')
        .reduce((sum, a) => sum.plus(a.balance), new Decimal(0));
      
      const cogsAccounts = accountsList.filter(a => a.code === '5001' && !a.balance.isZero());
      const totalCogs = accountsList
        .filter(a => a.code === '5001')
        .reduce((sum, a) => sum.plus(a.balance), new Decimal(0));
        
      const grossProfit = totalRevenue.minus(totalCogs);
      
      const expenseAccounts = accountsList.filter(a => a.type === 'expense' && a.code !== '5001' && !a.balance.isZero());
      const totalExpenses = accountsList
        .filter(a => a.type === 'expense' && a.code !== '5001')
        .reduce((sum, a) => sum.plus(a.balance), new Decimal(0));
        
      const netProfit = grossProfit.minus(totalExpenses);

      const rows: PLRow[] = [];
      
      revenueAccounts.forEach(a => {
        rows.push({
          section: 'revenue',
          account_code: a.code,
          account_name: a.name,
          amount: a.balance.toNumber(),
          is_subtotal: false
        });
      });
      rows.push({
        section: 'revenue',
        account_code: null,
        account_name: 'Total Revenue',
        amount: totalRevenue.toNumber(),
        is_subtotal: true
      });
      
      cogsAccounts.forEach(a => {
        rows.push({
          section: 'cogs',
          account_code: a.code,
          account_name: a.name,
          amount: a.balance.toNumber(),
          is_subtotal: false
        });
      });
      rows.push({
        section: 'cogs',
        account_code: null,
        account_name: 'Gross Profit',
        amount: grossProfit.toNumber(),
        is_subtotal: true
      });
      
      expenseAccounts.forEach(a => {
        rows.push({
          section: 'operating_expense',
          account_code: a.code,
          account_name: a.name,
          amount: a.balance.toNumber(),
          is_subtotal: false
        });
      });
      rows.push({
        section: 'operating_expense',
        account_code: null,
        account_name: 'Total Operating Expenses',
        amount: totalExpenses.toNumber(),
        is_subtotal: true
      });
      
      rows.push({
        section: 'net_profit',
        account_code: null,
        account_name: netProfit.isNegative() ? 'Net Loss' : 'Net Profit',
        amount: netProfit.abs().toNumber(),
        is_subtotal: true
      });
      
      return rows;
    },
    enabled: !!businessId
  });

  const revenueRows = data?.filter(r => r.section === 'revenue' && !r.is_subtotal) || [];
  const totalRevenue = data?.find(r => r.section === 'revenue' && r.is_subtotal)?.amount || 0;
  
  const cogsRows = data?.filter(r => r.section === 'cogs' && !r.is_subtotal) || [];
  const grossProfit = data?.find(r => r.section === 'cogs' && r.is_subtotal)?.amount || 0;
  const grossMarginPct = totalRevenue > 0 ? new Decimal(grossProfit).div(totalRevenue).times(100).toNumber() : 0;

  const expenseRows = data?.filter(r => r.section === 'operating_expense' && !r.is_subtotal) || [];
  const totalExpenses = data?.find(r => r.section === 'operating_expense' && r.is_subtotal)?.amount || 0;
  
  const netProfitRow = data?.find(r => r.section === 'net_profit');
  const netProfit = netProfitRow?.amount || 0;
  const isProfit = netProfitRow?.account_name === 'Net Profit';

  const hasData = (data?.length || 0) > 0;

  const exportExcel = () => {
    if (!data) return;
    const excelRows = data.map(r => ({
      'Section': r.section.toUpperCase(),
      'Account Code': r.account_code || '—',
      'Account Name': r.account_name,
      'Amount': r.amount
    }));
    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Profit & Loss');
    XLSX.writeFile(wb, `profit_loss_${dateRange.start}_to_${dateRange.end}.xlsx`);
    toast.success('Excel Export', 'Profit & Loss statement exported to Excel successfully');
  };

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter print:bg-white print:text-black">
      
      
      <main className={` transition-all duration-300 print:pl-0`}>
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-surface/50 backdrop-blur-md sticky top-0 z-40 print:hidden">
          <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
            <Link href="/reports" className="hover:text-white transition-colors">Reports Hub</Link>
            <span className="mx-3 opacity-30">/</span>
            <span className="text-white">Profit & Loss</span>
          </div>

          <div className="ml-auto flex items-center space-x-4">
             {tier === 'elite' && branches && branches.length > 0 && (
               <div className="flex items-center bg-white/5 border border-white/10 rounded-sm px-3 py-1.5 text-[10px] text-gray-400">
                 <Filter size={14} className="mr-2" />
                 <select 
                   value={selectedBranch}
                   onChange={(e) => setSelectedBranch(e.target.value)}
                   className="bg-transparent border-none text-white focus:ring-0 outline-none cursor-pointer"
                 >
                   <option value="all">All Branches</option>
                   {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                 </select>
               </div>
             )}
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
                <span>Excel</span>
             </button>
             <button 
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-1.5 bg-[#C5A059] text-black text-[10px] uppercase tracking-widest font-bold hover:bg-[#D4AF37] transition-colors"
             >
                <Printer size={14} />
                <span>PDF</span>
             </button>
          </div>
        </header>

        <div className="p-12 max-w-[1000px] mx-auto print:p-0 print:max-w-full">
          {isLoading ? (
             <div className="py-40 text-center text-xs uppercase tracking-[0.4em] text-gray-600 animate-pulse font-mono">Running Financial Analytics...</div>
          ) : !hasData ? (
             <IndustrialEmptyState 
                title="No Data for this Period"
                description="No ledger entries found for the selected date range."
                actionLabel="Create Invoice"
                onAction={() => router.push('/invoices/new')}
             />
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#1A1D21] border border-white/5 shadow-2xl p-16 space-y-12 relative overflow-hidden print:bg-white print:text-black print:border-none print:shadow-none print:p-8"
            >
              {/* Statement Header */}
              <div className="text-center space-y-2 border-b border-white/10 pb-8 relative z-10 print:border-black">
                <h1 className="text-4xl font-bold text-white tracking-[0.1em] uppercase print:text-black">Profit & Loss Statement</h1>
                <p className="text-gray-500 text-[10px] uppercase tracking-[0.2em] font-bold">
                  Fiscal Period: {fmtDate(dateRange.start)} — {fmtDate(dateRange.end)}
                </p>
                {selectedBranch !== 'all' && (
                  <p className="text-[#C5A059] text-[10px] uppercase font-bold tracking-widest">
                    Branch: {branches?.find((b: any) => b.id === selectedBranch)?.name}
                  </p>
                )}
              </div>

              {/* Revenue Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-white/5 pb-2 print:border-black">
                  <h3 className="text-[11px] uppercase tracking-[0.3em] text-[#C5A059] font-black">I. Revenue</h3>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Amount</span>
                </div>
                <div className="space-y-2">
                  {revenueRows.map((row) => (
                    <div key={row.account_name} className="flex justify-between items-center text-sm py-1">
                      <span className="text-gray-400 uppercase tracking-tight print:text-gray-700">{row.account_name}</span>
                      <span className="font-mono text-white print:text-black">{fmt(row.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-4 font-bold border-t border-white/5 mt-2 print:border-black">
                    <span className="text-xs text-white uppercase tracking-widest print:text-black">Total Revenue</span>
                    <span className="font-mono text-lg text-[#C5A059] print:text-black">{fmt(totalRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* COGS Section */}
              <div className="space-y-4">
                <h3 className="text-[11px] uppercase tracking-[0.3em] text-gray-500 font-black">II. Cost of Goods Sold</h3>
                <div className="space-y-2">
                  {cogsRows.map((row) => (
                    <div key={row.account_name} className="flex justify-between items-center text-sm py-1">
                      <span className="text-gray-400 uppercase tracking-tight print:text-gray-700">{row.account_name}</span>
                      <span className="font-mono text-gray-400 print:text-gray-600">({fmt(row.amount)})</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-sm border border-white/5 mt-4 print:bg-gray-50 print:border-black">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white font-bold uppercase tracking-widest print:text-black">Gross Profit</span>
                      <span className="text-[9px] text-gray-500 uppercase font-bold">Margin: {grossMarginPct.toFixed(2)}%</span>
                    </div>
                    <span className="font-mono text-xl font-bold text-[#C5A059] print:text-black">{fmt(grossProfit)}</span>
                  </div>
                </div>
              </div>

              {/* Expense Section */}
              <div className="space-y-4">
                <h3 className="text-[11px] uppercase tracking-[0.3em] text-gray-500 font-black">III. Operating Expenses</h3>
                <div className="space-y-2">
                  {expenseRows.map((row) => (
                    <div key={row.account_name} className="flex justify-between items-center text-sm py-1">
                      <span className="text-gray-400 uppercase tracking-tight print:text-gray-700">{row.account_name}</span>
                      <span className="font-mono text-white print:text-black">{fmt(row.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-4 font-bold border-t border-white/5 mt-2 print:border-black">
                    <span className="text-xs text-white uppercase tracking-widest print:text-black">Total Operating Expenses</span>
                    <span className="font-mono text-white print:text-black">{fmt(totalExpenses)}</span>
                  </div>
                </div>
              </div>

              {/* Net Result */}
              <Can permission="view:profit" fallback={
                <div className="p-10 border border-white/5 bg-white/[0.01] text-center mt-12">
                  <span className="text-xs text-gray-500 uppercase tracking-widest">Net Profit / Loss Restricted</span>
                </div>
              }>
                <div className={cn(
                  "p-10 border flex flex-col items-center justify-center space-y-3 mt-12",
                  isProfit ? "bg-[#C5A059]/5 border-[#C5A059]/20" : "bg-red-500/5 border-red-500/20",
                  "print:border-2 print:border-black print:bg-white"
                )}>
                  <span className="text-[10px] uppercase tracking-[0.5em] font-black text-gray-500">Statement Bottom Line</span>
                  <div className="flex items-center space-x-6">
                    <span className={cn(
                      "text-6xl font-black font-mono tracking-tighter",
                      isProfit ? "text-[#C5A059]" : "text-red-500",
                      "print:text-black"
                    )}>
                      {fmt(netProfit)}
                    </span>
                    {isProfit ? <TrendingUp className="text-[#C5A059]" size={40} /> : <ArrowDownRight className="text-red-500" size={40} />}
                  </div>
                  <span className={cn(
                    "text-[10px] uppercase font-bold tracking-[0.3em]",
                    isProfit ? "text-[#C5A059]" : "text-red-500",
                    "print:text-black"
                  )}>
                    {isProfit ? "Net Operational Profit" : "Net Operational Loss"}
                  </span>
                </div>
              </Can>

              {/* Footer */}
              <div className="pt-20 text-center opacity-30 text-[8px] uppercase tracking-widest print:opacity-100 print:text-black">
                Generated by Noxis Intelligence Hub • {new Date().toLocaleString()}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
