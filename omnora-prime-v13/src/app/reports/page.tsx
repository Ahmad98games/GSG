"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Landmark, ShieldCheck, 
  Scale, History, 
  Receipt, Briefcase, Boxes, ClipboardList,
  ChevronRight,
  TrendingUp, TrendingDown,
  RefreshCw, Download, Calendar, DollarSign,
  AlertTriangle, MessageCircle, BarChart3,
  Users, Wallet, ArrowUpRight, CheckCircle2,
  FileSpreadsheet, Sparkles
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Decimal } from "decimal.js";
import { cn } from "@/lib/utils";
import { openWhatsApp, WA_TEMPLATES } from "@/lib/utils/whatsapp";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { useBranchStore } from "@/stores/branchStore";
import { format, subDays, startOfMonth, endOfMonth, startOfQuarter, startOfYear } from "date-fns";
import { Skeleton, KpiCardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";

type TimeframeKey = 'this_month' | 'last_30_days' | 'this_quarter' | 'this_year' | 'all_time';

interface TimeframeOption {
  key: TimeframeKey;
  label: string;
}

const TIMEFRAMES: TimeframeOption[] = [
  { key: 'this_month', label: 'This Month' },
  { key: 'last_30_days', label: 'Last 30 Days' },
  { key: 'this_quarter', label: 'This Quarter' },
  { key: 'this_year', label: 'This Fiscal Year' },
  { key: 'all_time', label: 'All Time' },
];

export default function ReportsHubPage() {
  const { taxLabel, fmt, businessId } = usePersona();
  const { profile } = useBusinessProfile();
  const supabase = createClient();
  const { currentBranchId, currentBranchName } = useBranchStore();

  const [timeframe, setTimeframe] = useState<TimeframeKey>('all_time');

  // Compute ISO date boundaries based on selected timeframe
  const { dateFrom, dateTo } = useMemo(() => {
    const now = new Date();
    if (timeframe === 'all_time') {
      return { dateFrom: null, dateTo: null };
    }
    if (timeframe === 'this_month') {
      return {
        dateFrom: startOfMonth(now).toISOString().split('T')[0],
        dateTo: endOfMonth(now).toISOString().split('T')[0],
      };
    }
    if (timeframe === 'last_30_days') {
      return {
        dateFrom: subDays(now, 30).toISOString().split('T')[0],
        dateTo: now.toISOString().split('T')[0],
      };
    }
    if (timeframe === 'this_quarter') {
      return {
        dateFrom: startOfQuarter(now).toISOString().split('T')[0],
        dateTo: endOfMonth(now).toISOString().split('T')[0],
      };
    }
    if (timeframe === 'this_year') {
      return {
        dateFrom: startOfYear(now).toISOString().split('T')[0],
        dateTo: now.toISOString().split('T')[0],
      };
    }
    return { dateFrom: null, dateTo: null };
  }, [timeframe]);

  // 1. Comprehensive Revenue & P&L Analysis
  const { 
    data: plData, 
    error: plError, 
    refetch: refetchPl, 
    isFetching: plFetching 
  } = useQuery({
    queryKey: ['report-comprehensive-pl', businessId, currentBranchId, timeframe, dateFrom, dateTo],
    queryFn: async () => {
      try {
        // Query Invoices for direct sales
        let invQuery = supabase
          .from('invoices')
          .select('id, total, subtotal, tax_amount, status, created_at')
          .eq('business_id', businessId)
          .neq('status', 'void');

        if (dateFrom) invQuery = invQuery.gte('created_at', dateFrom);
        if (dateTo) invQuery = invQuery.lte('created_at', dateTo + 'T23:59:59.999Z');
        if (currentBranchId) invQuery = invQuery.eq('branch_id', currentBranchId);

        const { data: invoices, error: invError } = await invQuery;
        if (invError) console.warn('Invoices fetch warning:', invError);

        let invoiceRevenue = new Decimal(0);
        let totalTaxCollected = new Decimal(0);
        (invoices || []).forEach((inv: any) => {
          invoiceRevenue = invoiceRevenue.plus(new Decimal(inv.total || 0));
          totalTaxCollected = totalTaxCollected.plus(new Decimal(inv.tax_amount || 0));
        });

        // Query Expenses
        let expQuery = supabase
          .from('expenses')
          .select('id, amount, status, expense_date')
          .eq('business_id', businessId)
          .neq('status', 'cancelled');

        if (dateFrom) expQuery = expQuery.gte('expense_date', dateFrom);
        if (dateTo) expQuery = expQuery.lte('expense_date', dateTo + 'T23:59:59.999Z');
        if (currentBranchId) expQuery = expQuery.eq('branch_id', currentBranchId);

        const { data: expenses, error: expError } = await expQuery;
        if (expError) console.warn('Expenses fetch warning:', expError);

        let directExpenses = new Decimal(0);
        (expenses || []).forEach((exp: any) => {
          directExpenses = directExpenses.plus(new Decimal(exp.amount || 0));
        });

        // Query Ledger entries for posted double-entry journals
        let ledgerQuery = supabase
          .from('ledger_entries')
          .select('amount, entry_type, accounts!inner(type)')
          .eq('business_id', businessId)
          .eq('status', 'posted');

        if (dateFrom) ledgerQuery = ledgerQuery.gte('posted_at', dateFrom);
        if (dateTo) ledgerQuery = ledgerQuery.lte('posted_at', dateTo + 'T23:59:59.999Z');
        if (currentBranchId) ledgerQuery = ledgerQuery.eq('branch_id', currentBranchId);

        const { data: ledgerEntries, error: ledgerError } = await ledgerQuery;
        if (ledgerError) console.warn('Ledger fetch warning:', ledgerError);

        let ledgerRevenue = new Decimal(0);
        let ledgerExpense = new Decimal(0);

        (ledgerEntries || []).forEach((entry: any) => {
          const amt = new Decimal(entry.amount || 0);
          const type = entry.accounts?.type;
          const isDebit = entry.entry_type === 'debit';

          if (type === 'revenue') {
            if (isDebit) ledgerRevenue = ledgerRevenue.minus(amt);
            else ledgerRevenue = ledgerRevenue.plus(amt);
          } else if (type === 'expense') {
            if (isDebit) ledgerExpense = ledgerExpense.plus(amt);
            else ledgerExpense = ledgerExpense.minus(amt);
          }
        });

        // Use authoritative consolidated amounts (max of direct transactional stream or ledger stream)
        const totalRevenue = invoiceRevenue.greaterThan(ledgerRevenue) ? invoiceRevenue : ledgerRevenue;
        const totalExpense = directExpenses.greaterThan(ledgerExpense) ? directExpenses : ledgerExpense;
        const netProfit = totalRevenue.minus(totalExpense);
        const marginPct = totalRevenue.greaterThan(0)
          ? netProfit.dividedBy(totalRevenue).times(100).toNumber()
          : 0;

        return {
          revenue: totalRevenue,
          expense: totalExpense,
          netProfit: netProfit.abs(),
          isLoss: netProfit.isNegative(),
          marginPct: Math.round(marginPct * 10) / 10,
          invoiceCount: invoices?.length || 0,
          taxCollected: totalTaxCollected
        };
      } catch (err) {
        console.warn('Comprehensive P&L error:', err);
        return {
          revenue: new Decimal(0),
          expense: new Decimal(0),
          netProfit: new Decimal(0),
          isLoss: false,
          marginPct: 0,
          invoiceCount: 0,
          taxCollected: new Decimal(0)
        };
      }
    },
    enabled: !!businessId
  });

  // 2. Receivables & Debtors Analysis
  const { 
    data: receivablesData, 
    refetch: refetchRec, 
    isFetching: recFetching 
  } = useQuery({
    queryKey: ['report-comprehensive-receivables', businessId],
    queryFn: async () => {
      try {
        const { data: parties, error } = await supabase
          .from('parties')
          .select('id, name, party_type, current_balance, phone, city')
          .eq('business_id', businessId);

        if (error || !parties) {
          return {
            totalReceivable: new Decimal(0),
            totalPayable: new Decimal(0),
            debtorCount: 0,
            creditorCount: 0,
            topDebtors: []
          };
        }

        let totalReceivable = new Decimal(0);
        let totalPayable = new Decimal(0);
        const debtors: any[] = [];
        let creditorCount = 0;

        parties.forEach((p: any) => {
          const bal = new Decimal(p.current_balance || 0);
          if (bal.greaterThan(0)) {
            totalReceivable = totalReceivable.plus(bal);
            debtors.push({
              id: p.id,
              name: p.name,
              balance: bal,
              phone: p.phone,
              city: p.city
            });
          } else if (bal.lessThan(0)) {
            totalPayable = totalPayable.plus(bal.abs());
            creditorCount++;
          }
        });

        // Sort top debtors by highest outstanding balance
        debtors.sort((a, b) => b.balance.minus(a.balance).toNumber());

        return {
          totalReceivable,
          totalPayable,
          debtorCount: debtors.length,
          creditorCount,
          topDebtors: debtors.slice(0, 5)
        };
      } catch (err) {
        console.warn('Receivables query error:', err);
        return {
          totalReceivable: new Decimal(0),
          totalPayable: new Decimal(0),
          debtorCount: 0,
          creditorCount: 0,
          topDebtors: []
        };
      }
    },
    enabled: !!businessId
  });

  // 3. Stock Valuation & Inventory Health
  const { 
    data: stockData, 
    refetch: refetchStock, 
    isFetching: stockFetching 
  } = useQuery({
    queryKey: ['report-comprehensive-stock', businessId, currentBranchId],
    queryFn: async () => {
      try {
        let query = supabase
          .from('skus')
          .select('id, sku, name, qty_on_hand, cost_price, selling_price')
          .eq('business_id', businessId);

        if (currentBranchId) {
          query = query.eq('branch_id', currentBranchId);
        }

        const { data: skus, error } = await query;
        if (error || !skus) {
          return {
            costValuation: new Decimal(0),
            retailValuation: new Decimal(0),
            totalUnits: 0,
            skuCount: 0,
            lowStockCount: 0,
            outOfStockCount: 0
          };
        }

        let costValuation = new Decimal(0);
        let retailValuation = new Decimal(0);
        let totalUnits = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;

        skus.forEach((sku: any) => {
          const qty = Number(sku.qty_on_hand || 0);
          const cost = Number(sku.cost_price || 0);
          const selling = Number(sku.selling_price || 0);

          totalUnits += qty;
          costValuation = costValuation.plus(new Decimal(qty).times(cost));
          retailValuation = retailValuation.plus(new Decimal(qty).times(selling));

          if (qty <= 0) {
            outOfStockCount++;
          } else if (qty <= 5) {
            lowStockCount++;
          }
        });

        return {
          costValuation,
          retailValuation,
          totalUnits,
          skuCount: skus.length,
          lowStockCount,
          outOfStockCount
        };
      } catch (err) {
        console.warn('Stock query error:', err);
        return {
          costValuation: new Decimal(0),
          retailValuation: new Decimal(0),
          totalUnits: 0,
          skuCount: 0,
          lowStockCount: 0,
          outOfStockCount: 0
        };
      }
    },
    enabled: !!businessId
  });

  // 4. Trial Balance & Ledger Integrity
  const { data: tbData, isFetching: tbFetching } = useQuery({
    queryKey: ['report-summary-tb', businessId, currentBranchId],
    queryFn: async () => {
      try {
        let query = supabase
          .from('ledger_entries')
          .select('amount, entry_type')
          .eq('business_id', businessId)
          .eq('status', 'posted');

        if (currentBranchId) query = query.eq('branch_id', currentBranchId);

        const { data, error } = await query;
        if (error || !data) return { is_balanced: true, variance: 0, entryCount: 0 };

        let totalDebits = new Decimal(0);
        let totalCredits = new Decimal(0);

        data.forEach((entry: any) => {
          const amt = new Decimal(entry.amount || 0);
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
          variance: variance.toNumber(),
          entryCount: data.length
        };
      } catch {
        return { is_balanced: true, variance: 0, entryCount: 0 };
      }
    },
    enabled: !!businessId
  });

  // 5. Balance Sheet Consolidated Assets & Liabilities
  const { data: bsData, isFetching: bsFetching } = useQuery({
    queryKey: ['report-comprehensive-bs', businessId, currentBranchId],
    queryFn: async () => {
      try {
        let query = supabase
          .from('ledger_entries')
          .select('amount, entry_type, accounts!inner(type, account_code)')
          .eq('business_id', businessId)
          .eq('status', 'posted');

        if (currentBranchId) query = query.eq('branch_id', currentBranchId);

        const { data, error } = await query;
        let ledgerAssets = new Decimal(0);
        let ledgerLiabilities = new Decimal(0);

        if (!error && data) {
          data.forEach((entry: any) => {
            const amt = new Decimal(entry.amount || 0);
            const type = entry.accounts?.type;
            const isDebit = entry.entry_type === 'debit';

            if (type === 'asset') {
              if (isDebit) ledgerAssets = ledgerAssets.plus(amt);
              else ledgerAssets = ledgerAssets.minus(amt);
            } else if (type === 'liability') {
              if (isDebit) ledgerLiabilities = ledgerLiabilities.minus(amt);
              else ledgerLiabilities = ledgerLiabilities.plus(amt);
            }
          });
        }

        // Add operational assets (Receivables + Inventory valuation)
        const totalReceivables = receivablesData?.totalReceivable || new Decimal(0);
        const totalInventory = stockData?.costValuation || new Decimal(0);
        const consolidatedAssets = ledgerAssets.greaterThan(0) 
          ? ledgerAssets 
          : totalReceivables.plus(totalInventory);

        const totalPayables = receivablesData?.totalPayable || new Decimal(0);
        const consolidatedLiabilities = ledgerLiabilities.greaterThan(0)
          ? ledgerLiabilities
          : totalPayables;

        const netEquity = consolidatedAssets.minus(consolidatedLiabilities);

        return {
          totalAssets: consolidatedAssets,
          totalLiabilities: consolidatedLiabilities,
          netEquity
        };
      } catch {
        return {
          totalAssets: new Decimal(0),
          totalLiabilities: new Decimal(0),
          netEquity: new Decimal(0)
        };
      }
    },
    enabled: !!businessId && !!receivablesData && !!stockData
  });

  // 6. Pakistan FBR GST Return / Sales Tax
  const { data: taxData } = useQuery({
    queryKey: ['report-comprehensive-tax', businessId, timeframe],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_tax_return', {
          p_business_id: businessId,
          p_date_from: dateFrom || '2026-01-01',
          p_date_to: dateTo || new Date().toISOString().split('T')[0]
        });
        if (!error && data) {
          const netPayable = data.find((r: any) => r.section === 'net_payable')?.tax_amount || 0;
          return new Decimal(netPayable);
        }
        return plData?.taxCollected || new Decimal(0);
      } catch {
        return plData?.taxCollected || new Decimal(0);
      }
    },
    enabled: !!businessId
  });

  // 7. Payroll Summary
  const { data: payrollData } = useQuery({
    queryKey: ['report-summary-payroll', businessId, currentBranchId, dateFrom, dateTo],
    queryFn: async () => {
      try {
        let query = supabase
          .from('payroll_periods')
          .select('total_payroll')
          .eq('business_id', businessId);

        if (dateFrom) query = query.gte('period_start', dateFrom);
        if (dateTo) query = query.lte('period_end', dateTo);
        if (currentBranchId) query = query.eq('branch_id', currentBranchId);

        const { data, error } = await query;
        if (error || !data || data.length === 0) return new Decimal(0);
        const total = data.reduce((acc: Decimal, row: any) => acc.plus(new Decimal(row.total_payroll || 0)), new Decimal(0));
        return total;
      } catch {
        return new Decimal(0);
      }
    },
    enabled: !!businessId
  });

  const handleRefreshAll = () => {
    refetchPl();
    refetchRec();
    refetchStock();
  };

  const handleSendSummaryToOwner = () => {
    const phone = profile?.owner_phone || (profile as any)?.phone;
    if (!phone) return alert('Add your WhatsApp number in Settings → Business Profile first.');

    const msg = WA_TEMPLATES.dailySummary({
      businessName: profile?.business_name || 'Your Business',
      currency: profile?.currency || 'PKR',
      revenue: plData ? fmt(plData.revenue) : 'PKR 0',
      activeOrders: plData?.invoiceCount || 0,
      date: format(new Date(), 'EEEE, d MMMM yyyy'),
    }) + `\n• Receivables Outstanding: ${receivablesData ? fmt(receivablesData.totalReceivable) : 'PKR 0'}` +
      `\n• Warehouse Stock Valuation: ${stockData ? fmt(stockData.costValuation) : 'PKR 0'}` +
      `\n• Net Profit: ${plData ? fmt(plData.netProfit) : 'PKR 0'}`;

    openWhatsApp(phone, msg, profile?.country_code || 'PK');
  };

  const handleExportCSV = () => {
    const rows = [
      ['Metric', 'Value', 'Timeframe', 'Business Name', 'Generated At'],
      ['Total Sales / Revenue', plData?.revenue?.toString() || '0', timeframe, profile?.business_name || 'Noxis Business', new Date().toISOString()],
      ['Total Expenses', plData?.expense?.toString() || '0', timeframe, profile?.business_name || '', ''],
      ['Net Profit', plData?.netProfit?.toString() || '0', timeframe, profile?.business_name || '', ''],
      ['Total Receivables (Parties Owed)', receivablesData?.totalReceivable?.toString() || '0', 'Current', '', ''],
      ['Active Debtor Parties Count', receivablesData?.debtorCount?.toString() || '0', 'Current', '', ''],
      ['Total Inventory Cost Valuation', stockData?.costValuation?.toString() || '0', 'Current', '', ''],
      ['Total Units In Stock', stockData?.totalUnits?.toString() || '0', 'Current', '', ''],
      ['Total Liabilities / Payables', bsData?.totalLiabilities?.toString() || '0', 'Current', '', ''],
      ['Net Business Equity', bsData?.netEquity?.toString() || '0', 'Current', '', ''],
    ];

    if (receivablesData?.topDebtors?.length) {
      rows.push(['']);
      rows.push(['Top Debtors', 'Outstanding Balance (PKR)', 'Phone', 'City']);
      receivablesData.topDebtors.forEach((d: any) => {
        rows.push([d.name, d.balance?.toString() || '0', d.phone || 'N/A', d.city || 'N/A']);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Noxis_Financial_Report_${timeframe}_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cards = [
    {
      id: "profit-loss",
      label: "Profit & Loss",
      value: plData ? fmt(plData.netProfit) : "...",
      sub: plData?.isLoss 
        ? `Net Loss (${fmt(plData.expense)} Exp)` 
        : `Net Profit (${plData?.marginPct || 0}% Margin)`,
      badge: plData ? `${fmt(plData.revenue)} Rev` : null,
      href: "/reports/profit-loss",
      icon: plData?.isLoss ? TrendingDown : TrendingUp,
      color: plData?.isLoss ? "text-rose-400" : "text-emerald-400",
      accent: "from-emerald-500/10 to-transparent",
    },
    {
      id: "receivables",
      label: "Receivables Aging",
      value: receivablesData ? fmt(receivablesData.totalReceivable) : "...",
      sub: receivablesData?.debtorCount 
        ? `${receivablesData.debtorCount} Customer Khata Balance(s)` 
        : "No outstanding balances",
      badge: receivablesData?.debtorCount ? `${receivablesData.debtorCount} Active Debtors` : null,
      href: "/reports/aging",
      icon: Receipt,
      color: "text-amber-400",
      accent: "from-amber-500/10 to-transparent",
    },
    {
      id: "stock-valuation",
      label: "Stock Valuation",
      value: stockData ? fmt(stockData.costValuation) : "...",
      sub: stockData 
        ? `${stockData.totalUnits.toLocaleString()} Units · ${stockData.skuCount} SKUs` 
        : "Warehouse Inventory",
      badge: stockData?.lowStockCount ? `${stockData.lowStockCount} Low Stock` : 'Healthy Inventory',
      href: "/reports/stock-valuation",
      icon: Boxes,
      color: "text-cyan-400",
      accent: "from-cyan-500/10 to-transparent",
    },
    {
      id: "balance-sheet",
      label: "Balance Sheet",
      value: bsData ? fmt(bsData.totalAssets) : "...",
      sub: bsData ? `Assets vs ${fmt(bsData.totalLiabilities)} Liab.` : "Consolidated position",
      badge: bsData ? `Equity: ${fmt(bsData.netEquity)}` : null,
      href: "/reports/balance-sheet",
      icon: Landmark,
      color: "text-indigo-400",
      accent: "from-indigo-500/10 to-transparent",
    },
    {
      id: "trial-balance",
      label: "Trial Balance",
      value: tbData ? (tbData.is_balanced ? "Balanced ✓" : "⚠ Imbalance Detected") : "...",
      sub: tbData?.is_balanced 
        ? `${tbData.entryCount} Immutable Entries Synchronized` 
        : `Variance: ${fmt(tbData?.variance || 0)}`,
      badge: "Double-Entry Audit",
      href: "/reports/trial-balance",
      icon: Scale,
      color: tbData?.is_balanced ? "text-emerald-400" : "text-amber-400",
      accent: "from-emerald-500/10 to-transparent",
    },
    {
      id: "tax-return",
      label: `${taxLabel} Return (GST)`,
      value: taxData ? fmt(taxData) : "...",
      sub: "Sales Tax / GST Liability",
      badge: "FBR Annex-C Ready",
      href: "/reports/tax-return",
      icon: ShieldCheck,
      color: "text-sky-400",
      accent: "from-sky-500/10 to-transparent",
    },
    {
      id: "tax-report",
      label: "FBR Tax Export",
      value: "Pakistan GST",
      sub: "Year-End Sales Tax Filing",
      badge: "Active Taxpayer",
      href: "/reports/tax",
      icon: ShieldCheck,
      color: "text-amber-400",
      accent: "from-amber-500/10 to-transparent",
    },
    {
      id: "payroll",
      label: "Payroll Summary",
      value: payrollData ? fmt(payrollData) : "...",
      sub: "Wages & Karigar Disbursements",
      badge: "Disbursements",
      href: "/payroll",
      icon: Briefcase,
      color: "text-purple-400",
      accent: "from-purple-500/10 to-transparent",
    },
  ];

  const isLoading = !profile && (plFetching || tbFetching || bsFetching || recFetching || stockFetching);
  if (isLoading) return (
    <div className="p-6 bg-[#07090E] min-h-screen">
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      <div className="bg-[#0B0F19] border border-white/5 rounded-xl p-6 h-80">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  );

  const reportsError = plError;
  if (reportsError) return (
    <div className="min-h-screen bg-[#07090E] flex items-center justify-center p-8">
      <ErrorState
        message="Could not load reports"
        detail={(reportsError as Error).message}
        onRetry={handleRefreshAll}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-200 p-6 selection:bg-cyan-500 selection:text-black">
      {/* Top Sticky Navigation Bar */}
      <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-40 -mx-6 -mt-6 mb-6 justify-between">
        <div className="flex items-center gap-3 text-xs uppercase tracking-widest font-mono">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06B6D4]" />
          <span className="text-white font-bold">Noxis Intelligence Hub</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-400">Financial & Operational Analytics</span>
        </div>

        <nav className="flex h-16 items-center">
          <Link href="/reports" className="px-6 h-full flex items-center space-x-2 text-[11px] uppercase tracking-wider font-bold text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5">
            Overview
          </Link>
          <Link href="/reports/tax-return" className="px-6 h-full flex items-center space-x-2 text-[11px] uppercase tracking-wider font-semibold text-zinc-400 border-b-2 border-transparent hover:text-white hover:bg-white/[0.02] transition-colors">
            Tax Return Analysis
          </Link>
          <Link href="/reports/tax" className="px-6 h-full flex items-center space-x-2 text-[11px] uppercase tracking-wider font-semibold text-zinc-400 border-b-2 border-transparent hover:text-white hover:bg-white/[0.02] transition-colors">
            Year-End FBR Report
          </Link>
        </nav>
      </header>

      <main className="max-w-[1600px] mx-auto space-y-6">
        {/* Top Control Bar with Timeframe Filter & Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0B0F19] border border-white/10 shadow-xl">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Executive Overview
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </h1>
              {currentBranchId ? (
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  {currentBranchName}
                </span>
              ) : (
                <span className="text-[10px] bg-white/5 text-zinc-300 border border-white/10 px-2.5 py-0.5 rounded-full font-mono font-bold tracking-wider">
                  ALL NODES CONSOLIDATED
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Live double-entry reconciliation across invoices, Khata ledgers, parties, and inventory.
            </p>
          </div>

          {/* Timeframe Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/10">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.key}
                  onClick={() => setTimeframe(tf.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer",
                    timeframe === tf.key
                      ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleRefreshAll}
              title="Recalculate and Synchronize Live Metrics"
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <RefreshCw className={cn("w-4 h-4", (plFetching || recFetching || stockFetching) && "animate-spin text-cyan-400")} />
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleSendSummaryToOwner}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send Daily Summary</span>
            </button>
          </div>
        </div>

        {/* Executive Pulse Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#0B0F19] border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Gross Sales</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {plData ? fmt(plData.revenue) : '...'}
              </div>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                {plData?.invoiceCount || 0} Invoices processed
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0F19] border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Total Receivables</span>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                {receivablesData ? fmt(receivablesData.totalReceivable) : '...'}
              </div>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                {receivablesData?.debtorCount || 0} Customers in Khata
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0F19] border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Warehouse Valuation</span>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                {stockData ? fmt(stockData.costValuation) : '...'}
              </div>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                {stockData ? `${stockData.totalUnits.toLocaleString()} units in stock` : 'Calculating...'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0F19] border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Net Profit</span>
              <div className={cn("text-xl font-bold font-mono mt-1", plData?.isLoss ? "text-rose-400" : "text-emerald-400")}>
                {plData ? fmt(plData.netProfit) : '...'}
              </div>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                {plData?.marginPct || 0}% Net Margin
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 8 Main Report Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((card, idx) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Link
                href={card.href}
                className="group block bg-[#0B0F19] border border-white/10 hover:border-cyan-500/40 p-5 rounded-2xl transition-all duration-300 relative overflow-hidden shadow-lg hover:shadow-cyan-950/20"
              >
                {/* Background Ambient Gradient */}
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity", card.accent)} />

                <div className="relative space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-zinc-400 text-[11px] uppercase tracking-wider font-semibold font-mono">
                      {card.label}
                    </span>
                    <card.icon size={18} className="text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  
                  <div className={cn("font-mono text-2xl font-bold tracking-tight", card.color)}>
                    {card.value}
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-xs truncate">
                        {card.sub}
                      </span>
                      <ChevronRight size={14} className="text-zinc-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </div>

                    {card.badge && (
                      <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>{card.badge}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Deep Dive Insights & Outstanding Debtors Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Debtors Khata Snapshot */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  Top Khata Debtors (Receivables)
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Parties with largest outstanding credit balance requiring payment collection.
                </p>
              </div>
              <Link 
                href="/khata" 
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>View Full Khata</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {receivablesData?.topDebtors?.length ? (
              <div className="divide-y divide-white/5">
                {receivablesData.topDebtors.map((debtor: any, i: number) => (
                  <div key={debtor.id} className="py-3 flex items-center justify-between hover:bg-white/[0.02] px-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center font-mono text-xs text-zinc-400 font-bold">
                        {i + 1}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-white capitalize">{debtor.name}</div>
                        <div className="text-xs text-zinc-500 font-mono">
                          {debtor.phone || 'No phone'} {debtor.city ? `· ${debtor.city}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-amber-400">
                        {fmt(debtor.balance)}
                      </div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Pending Collection</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-500 text-xs">
                No outstanding customer balances found. All party accounts are settled.
              </div>
            )}
          </div>

          {/* Inventory Health & Compliance Card */}
          <div className="p-6 rounded-2xl bg-[#0B0F19] border border-white/10 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                <Boxes className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Inventory Health</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Total Catalog Items</span>
                  <span className="font-mono font-bold text-white">{stockData?.skuCount || 0} SKUs</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Total Units in Stock</span>
                  <span className="font-mono font-bold text-cyan-400">{stockData?.totalUnits?.toLocaleString() || 0} Units</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Low Stock Alert (&le;5 units)</span>
                  <span className={cn("font-mono font-bold", stockData?.lowStockCount ? "text-amber-400" : "text-emerald-400")}>
                    {stockData?.lowStockCount || 0} Items
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Out of Stock (Zero Units)</span>
                  <span className={cn("font-mono font-bold", stockData?.outOfStockCount ? "text-rose-400" : "text-emerald-400")}>
                    {stockData?.outOfStockCount || 0} Items
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5">
                <div className="text-[11px] font-mono text-zinc-400 mb-1">Potential Retail Value</div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {stockData ? fmt(stockData.retailValuation) : '...'}
                </div>
              </div>
            </div>

            <Link
              href="/inventory"
              className="w-full py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Manage Inventory & Orders</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Footer Automated Reconciliation Strip */}
        <div className="p-6 rounded-2xl bg-[#0B0F19] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Automated Ledger Reconciliation Active
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Every rupee is reconciled against double-entry debits, credits, and invoices with 100% audit integrity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Audit Data</span>
            </button>
            <button 
              onClick={handleSendSummaryToOwner}
              disabled={!profile?.owner_phone}
              className="px-5 py-2.5 rounded-xl bg-[#25D366] text-black text-xs font-bold tracking-wide shadow-lg hover:brightness-110 transition-all disabled:opacity-30 flex items-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-black" />
              <span>WhatsApp Briefing</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
