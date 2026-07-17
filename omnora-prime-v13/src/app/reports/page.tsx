"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Landmark, ShieldCheck, 
  Scale, History, 
  Receipt, Briefcase, Boxes, ClipboardList,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Decimal } from "decimal.js";
import { cn } from "@/lib/utils";
import { openWhatsApp, WA_TEMPLATES } from "@/lib/utils/whatsapp";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { useBranchStore } from "@/stores/branchStore";
import { MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { Skeleton, KpiCardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";

export default function ReportsHubPage() {
  const { taxLabel, fmt, businessId } = usePersona();
  const { profile } = useBusinessProfile();
  const supabase = createClient();
  const { currentBranchId, currentBranchName } = useBranchStore();

  const handleSendSummaryToOwner = () => {
    const phone = profile?.owner_phone || (profile as any)?.phone;
    if (!phone) return alert('Add your WhatsApp number in Settings → Business Profile first.');

    const msg = WA_TEMPLATES.dailySummary({
      businessName: profile?.business_name || 'Your Business',
      currency: profile?.currency || 'PKR',
      revenue: plData ? fmt(plData.amount) : '...',
      activeOrders: 0,
      date: format(new Date(), 'EEEE, d MMMM yyyy'),
    });

    openWhatsApp(phone, msg, profile?.country_code || 'PK');
  };
  

  const startOfMonth = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  }, []);

  const endOfMonth = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  }, []);

  const startOfQuarter = useMemo(() => {
    const d = new Date();
    const q = Math.floor(d.getMonth() / 3);
    return new Date(d.getFullYear(), q * 3, 1).toISOString().split('T')[0];
  }, []);

  // Live Data Fetches
  const { data: plData, error: plError, refetch: refetchPl, isPending: plPending } = useQuery({
    queryKey: ['report-summary-pl', businessId, currentBranchId],
    queryFn: async () => {
      let query = supabase
        .from('ledger_entries')
        .select('amount, entry_type, accounts!inner(type)')
        .eq('business_id', businessId)
        .eq('status', 'posted')
        .gte('posted_at', startOfMonth)
        .lte('posted_at', endOfMonth + 'T23:59:59.999Z');

      if (currentBranchId) {
        query = query.eq('branch_id', currentBranchId);
      }

      const { data, error } = await query;
      // Gracefully handle missing accounts table (new business)
      if (error && error.code !== 'PGRST116' && !error.message?.includes('accounts')) {
        throw error;
      }

      let revenue = new Decimal(0);
      let expenses = new Decimal(0);

      (data || []).forEach((entry: any) => {
        const amt = new Decimal(entry.amount || 0);
        const type = entry.accounts?.type;
        const isDebit = entry.entry_type === 'debit';

        if (type === 'revenue') {
          if (isDebit) revenue = revenue.minus(amt);
          else revenue = revenue.plus(amt);
        } else if (type === 'expense') {
          if (isDebit) expenses = expenses.plus(amt);
          else expenses = expenses.minus(amt);
        }
      });

      const netProfit = revenue.minus(expenses);
      return { 
        amount: netProfit.abs(),
        isLoss: netProfit.isNegative()
      };
    },
    enabled: !!businessId
  });

  const { data: tbData, isPending: tbPending } = useQuery({
    queryKey: ['report-summary-tb', businessId, currentBranchId],
    queryFn: async () => {
      let query = supabase
        .from('ledger_entries')
        .select('amount, entry_type')
        .eq('business_id', businessId)
        .eq('status', 'posted');

      if (currentBranchId) {
        query = query.eq('branch_id', currentBranchId);
      }

      const { data, error } = await query;
      if (error) throw error;

      let totalDebits = new Decimal(0);
      let totalCredits = new Decimal(0);

      data.forEach((entry: any) => {
        const amt = new Decimal(entry.amount);
        if (entry.entry_type === 'debit') {
          totalDebits = totalDebits.plus(amt);
        } else {
          totalCredits = totalCredits.plus(amt);
        }
      });

      const variance = totalDebits.minus(totalCredits).abs();
      const isBalanced = variance.lessThanOrEqualTo(0.01);

      return {
        is_balanced: isBalanced,
        variance: variance.toNumber()
      };
    },
    enabled: !!businessId
  });

  const { data: bsData, error: bsError, refetch: refetchBs, isPending: bsPending } = useQuery({
    queryKey: ['report-summary-bs', businessId, currentBranchId],
    queryFn: async () => {
      let query = supabase
        .from('ledger_entries')
        .select('amount, entry_type, accounts!inner(type, account_code)')
        .eq('business_id', businessId)
        .eq('status', 'posted');

      if (currentBranchId) {
        query = query.eq('branch_id', currentBranchId);
      }

      const { data, error } = await query;
      if (error) throw error;

      let totalAssets = new Decimal(0);
      let totalLiabilities = new Decimal(0);

      data.forEach((entry: any) => {
        const amt = new Decimal(entry.amount);
        const type = entry.accounts?.type;
        const code = entry.accounts?.account_code || "";
        const isDebit = entry.entry_type === 'debit';

        if (type === 'asset') {
          if (isDebit) totalAssets = totalAssets.plus(amt);
          else totalAssets = totalAssets.minus(amt);
        } else if (type === 'liability') {
          if (isDebit) totalLiabilities = totalLiabilities.minus(amt);
          else totalLiabilities = totalLiabilities.plus(amt);
        }
      });

      return { totalAssets, totalLiabilities };
    },
    enabled: !!businessId
  });

  const { data: receivablesData, error: recError, refetch: refetchRec, isPending: recPending } = useQuery({
    queryKey: ['report-summary-receivables', businessId, currentBranchId],
    queryFn: async () => {
      let query = supabase
        .from('ledger_entries')
        .select('amount, entry_type, accounts!inner(account_code)')
        .eq('business_id', businessId)
        .eq('status', 'posted')
        .eq('accounts.account_code', '1100');

      if (currentBranchId) {
        query = query.eq('branch_id', currentBranchId);
      }

      const { data, error } = await query;
      // Gracefully handle missing accounts (new business with no chart of accounts)
      if (error && error.code !== 'PGRST116' && !error.message?.includes('accounts')) {
        throw error;
      }

      let balance = new Decimal(0);
      (data || []).forEach((entry: any) => {
        const amt = new Decimal(entry.amount || 0);
        if (entry.entry_type === 'debit') {
          balance = balance.plus(amt);
        } else {
          balance = balance.minus(amt);
        }
      });
      return balance;
    },
    enabled: !!businessId
  });

  const { data: taxData } = useQuery({
    queryKey: ['report-summary-tax', businessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_tax_return', {
        p_business_id: businessId,
        p_date_from: startOfQuarter,
        p_date_to: endOfMonth
      });
      if (error) throw error;
      const netPayable = data.find((r: any) => r.section === 'net_payable')?.tax_amount || 0;
      return new Decimal(netPayable);
    },
    enabled: !!businessId
  });

  const { data: ledgerData } = useQuery({
    queryKey: ['report-summary-ledger', businessId, currentBranchId],
    queryFn: async () => {
      let query = supabase
        .from('ledger_entries')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('posted_at', startOfMonth);

      if (currentBranchId) {
        query = query.eq('branch_id', currentBranchId);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    enabled: !!businessId
  });

  const { data: stockData } = useQuery({
    queryKey: ['report-summary-stock', businessId, currentBranchId],
    queryFn: async () => {
      let query = supabase
        .from('skus')
        .select('qty_on_hand, cost_price')
        .eq('business_id', businessId);

      if (currentBranchId) {
        query = query.eq('branch_id', currentBranchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data.reduce((acc: Decimal, sku: any) => acc.plus(new Decimal(sku.qty_on_hand || 0).times(sku.cost_price || 0)), new Decimal(0));
    },
    enabled: !!businessId
  });

  const { data: payrollData } = useQuery({
    queryKey: ['report-summary-payroll', businessId, currentBranchId],
    queryFn: async () => {
      let query = supabase
        .from('payroll_periods')
        .select('total_payroll')
        .eq('business_id', businessId)
        .gte('period_start', startOfMonth)
        .lte('period_end', endOfMonth);

      if (currentBranchId) {
        query = query.eq('branch_id', currentBranchId);
      }

      const { data, error } = await query.single();
      if (error && error.code !== 'PGRST116') throw error;
      return new Decimal(data?.total_payroll || 0);
    },
    enabled: !!businessId
  });

  const cards = [
    {
      id: "profit-loss",
      label: "Profit & Loss",
      value: plData ? fmt(plData.amount) : "...",
      sub: plData?.isLoss ? "Net Loss this month" : "Net Profit this month",
      href: "/reports/profit-loss",
      icon: TrendingUp,
      color: plData?.isLoss ? "text-red-500" : "text-green-500",
    },
    {
      id: "trial-balance",
      label: "Trial Balance",
      value: tbData ? (tbData.is_balanced ? "Balanced ✓" : "⚠ Imbalance Detected") : "...",
      sub: tbData ? `Variance: ${fmt(tbData.variance)}` : "Checking integrity",
      href: "/reports/trial-balance",
      icon: Scale,
      color: tbData?.is_balanced ? "text-emerald-500" : "text-amber-500",
    },
    {
      id: "balance-sheet",
      label: "Balance Sheet",
      value: bsData ? `${fmt(bsData.totalAssets)}` : "...",
      sub: bsData ? `Assets vs ${fmt(bsData.totalLiabilities)} Liab.` : "Financial position",
      href: "/reports/balance-sheet",
      icon: Landmark,
      color: "text-white",
    },
    {
      id: "receivables",
      label: "Receivables Aging",
      value: receivablesData ? fmt(receivablesData) : "...",
      sub: "Total outstanding amount",
      href: "/reports/aging",
      icon: Receipt,
      color: "text-white",
    },
    {
      id: "tax-return",
      label: `${taxLabel} Return`,
      value: taxData ? fmt(taxData) : "...",
      sub: "Liability this quarter",
      href: "/reports/tax-return",
      icon: ShieldCheck,
      color: "text-white",
    },
    {
      id: "tax-report",
      label: "FBR Tax Export",
      value: "Pakistan GST",
      sub: "Year-End Sales Tax Return",
      href: "/reports/tax",
      icon: ShieldCheck,
      color: "text-amber-400",
    },
    {
      id: "ledger",
      label: "Ledger Report",
      value: ledgerData?.toString() || "...",
      sub: "Total entries this month",
      href: "/reports/ledger",
      icon: History,
      color: "text-white",
    },
    {
      id: "stock-valuation",
      label: "Stock Valuation",
      value: stockData ? fmt(stockData) : "...",
      sub: "Total inventory value",
      href: "/reports/stock-valuation",
      icon: Boxes,
      color: "text-white",
    },
    {
      id: "payroll",
      label: "Payroll Summary",
      value: payrollData ? fmt(payrollData) : "...",
      sub: "This month total payroll",
      href: "/payroll",
      icon: Briefcase,
      color: "text-white",
    },
  ];

  // Use React Query's isPending flags — avoids false "loading" when data is zero/empty
  const isLoading = plPending || tbPending || bsPending || recPending;
  if (isLoading) return (
    <div className="p-6 bg-[#0F1113]">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      <div className="bg-[#0F1114] border border-white/[0.06] rounded-sm p-4 h-80">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  );

  const reportsError = plError || bsError || recError;
  if (reportsError) return (
    <div className="min-h-screen bg-[#0F1113] flex items-center justify-center p-8">
      <ErrorState
        message="Could not load reports"
        detail={(reportsError as Error).message}
        onRetry={() => { refetchPl(); refetchBs(); refetchRec(); }}
      />
    </div>
  );

  // Zero-data empty state: show clean message with zeroes, not skeletons
  if (ledgerData === 0 || ledgerData === null) return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 p-6 flex flex-col">
      <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40 -mx-6 -mt-6 mb-6">
        <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
          <span className="text-white">Reports Overview</span>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon="📊"
          title="No data for this period"
          description="Post your first invoice or record a transaction to see financial reports with real data."
          action={{ label: 'Create first invoice', href: '/invoices/new' }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 p-6">
      <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40 -mx-6 -mt-6 mb-6">
        <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
          <span className="text-white">Reports Overview</span>
        </div>

        <nav className="ml-auto flex h-16 items-center">
          <Link href="/reports" className="px-6 h-full flex items-center space-x-2 text-[10px] uppercase tracking-widest font-black text-electric-blue border-b-2 border-electric-blue bg-white/5">
            Overview
          </Link>
          <Link href="/reports/tax-return" className="px-6 h-full flex items-center space-x-2 text-[10px] uppercase tracking-widest font-black text-gray-500 border-b-2 border-transparent hover:text-white hover:bg-white/[0.02]">
            Tax Return Analysis
          </Link>
          <Link href="/reports/tax" className="px-6 h-full flex items-center space-x-2 text-[10px] uppercase tracking-widest font-black text-gray-500 border-b-2 border-transparent hover:text-white hover:bg-white/[0.02]">
            Year-End FBR Report
          </Link>
        </nav>
      </header>

      <main className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-white">
                Intelligence Hub
              </h1>
              {currentBranchId ? (
                <span className="text-[10px] bg-[#60A5FA]/10 text-[#60A5FA] border border-[#60A5FA]/20 px-2 py-0.5 rounded-sm font-bold">
                  {currentBranchName}
                </span>
              ) : (
                <span className="text-[10px] bg-white/5 text-gray-550 border border-white/8 px-2 py-0.5 rounded-sm font-bold font-mono">
                  ALL BRANCHES CONSOLIDATED
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Real-time Financial & Operational Analytics
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={handleSendSummaryToOwner}
               className="flex items-center space-x-2 px-4 py-2 bg-electric-blue text-onyx text-sm font-semibold rounded-sm hover:brightness-110 shadow-lg transition-all"
             >
                <MessageCircle size={14} />
                <span>Send Daily Summary</span>
             </button>
          </div>
        </div>

        <div className="p-12 max-w-[1400px] mx-auto space-y-12">
          <div className="space-y-2">
            <p className="text-gray-400 max-w-2xl text-base leading-relaxed">
              Consolidated financial oversight driven by immutable double-entry ledger streams. High-fidelity operational data synchronized across all nodes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, idx) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  href={card.href}
                  className="group block bg-[#1A1D21] border border-white/5 p-6 hover:border-[#C5A059]/30 transition-all duration-300 relative"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-500 text-[10px] uppercase tracking-[0.2em] font-bold">
                        {card.label}
                      </span>
                      <card.icon size={16} className="text-gray-600 group-hover:text-[#C5A059] transition-colors" />
                    </div>
                    
                    <div className={cn("font-mono text-2xl font-bold tracking-tight", card.color || "text-[#C5A059]")}>
                      {card.value}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-[10px] uppercase font-medium">
                        {card.sub}
                      </span>
                      <ChevronRight size={12} className="text-gray-700 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Additional Info / CTA */}
          <div className="mt-12 p-8 bg-[#1A1D21]/50 border border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ClipboardList className="text-gray-600" size={24} />
              <div>
                <h4 className="text-white text-sm font-bold uppercase tracking-wider">Automated Reconciliation</h4>
                <p className="text-gray-500 text-xs">All reports are generated directly from the master ledger with 100% accuracy.</p>
              </div>
            </div>
            <button 
              onClick={handleSendSummaryToOwner}
              disabled={!profile?.owner_phone}
              className="flex items-center space-x-3 px-8 py-3 bg-[#25D366] text-white text-[10px] uppercase font-black tracking-[0.2em] shadow-xl hover:brightness-110 transition-all disabled:opacity-30"
            >
              <MessageCircle size={18} />
              <span>Send Daily Summary to Owner</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
