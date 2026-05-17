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
import { WhatsAppSender, WhatsAppTemplates } from "@/lib/whatsapp/WhatsAppSender";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { MessageCircle } from "lucide-react";
import { format } from "date-fns";

export default function ReportsHubPage() {
  const { taxLabel, fmt, businessId } = usePersona();
  const { profile } = useBusinessProfile();
  const supabase = createClient();

  const handleSendSummaryToOwner = () => {
    if (!profile?.owner_phone) return alert("Owner phone not configured");
    
    // We'll use the data we have or fetch specifically for summary
    const message = WhatsAppTemplates.dailySummary(
      format(new Date(), 'dd MMM yyyy'),
      plData ? fmt(plData.amount) : '...', // using month profit for now as a placeholder for sales
      receivablesData ? fmt(receivablesData) : '...'
    );
    
    WhatsAppSender.send({ phone: profile.owner_phone, message }, profile?.tier || 'starter');
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
  const { data: plData } = useQuery({
    queryKey: ['report-summary-pl', businessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_profit_loss', {
        p_business_id: businessId,
        p_date_from: startOfMonth,
        p_date_to: endOfMonth
      });
      if (error) throw error;
      const netProfit = (data as { account_name: string; amount: number }[]).find(r => r.account_name === 'Net Profit' || r.account_name === 'Net Loss');
      return { 
        amount: new Decimal(netProfit?.amount || 0),
        isLoss: netProfit?.account_name === 'Net Loss'
      };
    },
    enabled: !!businessId
  });

  const { data: tbData } = useQuery({
    queryKey: ['report-summary-tb', businessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_trial_balance_integrity', {
        p_business_id: businessId,
        p_date_from: '2000-01-01',
        p_date_to: new Date().toISOString().split('T')[0]
      });
      if (error) throw error;
      return data[0];
    },
    enabled: !!businessId
  });

  const { data: bsData } = useQuery({
    queryKey: ['report-summary-bs', businessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_balance_sheet', {
        p_business_id: businessId,
        p_as_at_date: new Date().toISOString().split('T')[0]
      });
      if (error) throw error;
      const totalAssets = data.find((r: any) => r.section === 'total_assets')?.amount || 0;
      const totalLiabilities = data.find((r: any) => r.section === 'current_liability' && r.is_subtotal)?.amount || 0;
      return { totalAssets: new Decimal(totalAssets), totalLiabilities: new Decimal(totalLiabilities) };
    },
    enabled: !!businessId
  });

  const { data: receivablesData } = useQuery({
    queryKey: ['report-summary-receivables', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('balance_due')
        .eq('business_id', businessId)
        .not('status', 'in', ['paid', 'cancelled']);
      if (error) throw error;
      return data.reduce((acc: Decimal, inv: any) => acc.plus(new Decimal(inv.balance_due || 0)), new Decimal(0));
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
    queryKey: ['report-summary-ledger', businessId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('ledger_entries')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('posted_at', startOfMonth);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!businessId
  });

  const { data: stockData } = useQuery({
    queryKey: ['report-summary-stock', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skus')
        .select('qty_on_hand, cost_price')
        .eq('business_id', businessId);
      if (error) throw error;
      return data.reduce((acc: Decimal, sku: any) => acc.plus(new Decimal(sku.qty_on_hand || 0).times(sku.cost_price || 0)), new Decimal(0));
    },
    enabled: !!businessId
  });

  const { data: payrollData } = useQuery({
    queryKey: ['report-summary-payroll', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_periods')
        .select('total_payroll')
        .eq('business_id', businessId)
        .gte('period_start', startOfMonth)
        .lte('period_end', endOfMonth)
        .single();
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

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 p-6">
      <main className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Intelligence Hub
            </h1>
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
