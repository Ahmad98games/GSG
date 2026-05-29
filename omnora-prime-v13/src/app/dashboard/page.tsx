"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import SentinelAlertOverlay from "@/components/alerts/SentinelAlertOverlay";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { usePersona } from "@/hooks/usePersona";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertCircle, Clock, CheckCircle2, Globe, ShieldCheck, 
  TrendingUp, TrendingDown, DollarSign, Package, 
  ShoppingCart, Truck, Wallet, Activity, Zap,
  ArrowUpRight, ArrowDownRight, MessageCircle
} from "lucide-react";
import { sendWhatsAppAlert, ALERT_TEMPLATES } from "@/lib/whatsapp/alertEngine";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Decimal } from 'decimal.js';
import { cn } from "@/lib/utils";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import EmptyState from "@/components/ui/EmptyState";
import OnboardingChecklist from "@/components/shell/OnboardingChecklist";
import DataFreshness from "@/components/ui/DataFreshness";
import DailyBrief from "@/components/dashboard/DailyBrief";
import PatternAlerts from "@/components/dashboard/PatternAlerts";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import WelcomeGuide from "@/components/onboarding/WelcomeGuide";
import CCTVWidget from "@/components/dashboard/CCTVWidget";
import DeadStockWidget from "@/components/dashboard/DeadStockWidget";
import PromiseAlertWidget from "@/components/dashboard/PromiseAlertWidget";
import { useIndustry, useIndustryLabels } from "@/components/providers/IndustryProvider";
import { MobileAppBanner } from "@/components/dashboard/MobileAppBanner";
import { Skeleton, KpiCardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { FeedbackModal } from "@/components/ui/FeedbackModal";


export default function DashboardPage() {
  const { profile, businessName } = useBusinessProfile();
  const { persona, isLoading: isPersonaLoading, fmt, fmtQty, vocab, t, businessId } = usePersona();
  const { activeIndustry } = useIndustry();
  const { getIndustryLabel } = useIndustryLabels();

  const [showWelcome, setShowWelcome] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [show7DayPrompt, setShow7DayPrompt] = useState(false);
  const supabase = createClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    const installDate = localStorage.getItem('noxis_install_date');
    if (!installDate) {
      localStorage.setItem('noxis_install_date', new Date().toISOString());
      return;
    }
    const days = Math.floor((Date.now() - new Date(installDate).getTime()) / (1000 * 60 * 60 * 24));
    const feedbackShown = localStorage.getItem('feedback_7day_shown');
    if (days >= 7 && !feedbackShown) {
      localStorage.setItem('feedback_7day_shown', 'true');
      setShow7DayPrompt(true);
    }
  }, []);
  

  // Realtime Subscriptions
  useEffect(() => {
    if (!businessId) return;

    const channel = supabase.channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices', filter: `business_id=eq.${businessId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ledger_entries', filter: `business_id=eq.${businessId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'anomaly_alerts', filter: `business_id=eq.${businessId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['anomalies'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [businessId, supabase, queryClient]);

  // Fetch KPIs
  const { data: kpis, isLoading: isKpiLoading, error: kpiError, refetch: refetchKpis } = useQuery({
    queryKey: ['dashboard-kpis', businessId],
    queryFn: async () => {
      const now = new Date();
      const startOfMonthStr = format(startOfMonth(now), 'yyyy-MM-dd');
      const todayStr = format(now, 'yyyy-MM-dd');

      const [
        { data: salesMonth, error: salesError },
        { data: receivables, error: recvError },
        { data: skus, error: skusError },
        { data: cash, error: cashError },
        { data: tax, error: taxError },
        { data: pl, error: plError },
        { count: activeOrders, error: ordersError },
        { count: pendingDeliveries, error: logisticsError }
      ] = await Promise.all([
        supabase.from('invoices').select('total').eq('business_id', businessId).gte('issue_date', startOfMonthStr).not('status', 'in', ['cancelled']),
        supabase.from('invoices').select('balance_due').eq('business_id', businessId).not('status', 'in', ['paid', 'cancelled']),
        supabase.from('skus').select('qty_on_hand, cost_price').eq('business_id', businessId),
        supabase.rpc('get_account_balances', { p_business_id: businessId, p_as_at_date: todayStr }),
        supabase.from('ledger_entries').select('amount, entry_type').eq('business_id', businessId).eq('account_id', (await supabase.from('accounts').select('id').eq('business_id', businessId).eq('account_code', '2100').single()).data?.id),
        supabase.rpc('get_profit_loss', { p_business_id: businessId, p_date_from: startOfMonthStr, p_date_to: todayStr }),
        supabase.from('production_batches').select('*', { count: 'exact', head: true }).eq('business_id', businessId).not('status', 'in', ['completed', 'cancelled']),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'posted').not('metadata->>dispatch_status', 'eq', 'delivered')
      ]);

      if (salesError || recvError || skusError || cashError || taxError || plError) {
        console.error("Dashboard Fetch Error:", { salesError, recvError, skusError, cashError, taxError, plError });
      }

      const totalSales = (salesMonth || []).reduce((acc: Decimal, inv: any) => acc.plus(new Decimal(inv.total ?? '0')), new Decimal(0));
      const totalReceivables = (receivables || []).reduce((acc: Decimal, inv: any) => acc.plus(new Decimal(inv.balance_due ?? '0')), new Decimal(0));
      const inventoryValue = (skus || []).reduce((acc: Decimal, s: any) => acc.plus(new Decimal(s.qty_on_hand ?? '0').times(new Decimal(s.cost_price ?? '0'))), new Decimal(0));
      const cashOnHand = new Decimal((cash || []).find((c: any) => c.account_code === '1001' || c.account_code === '1002')?.balance ?? '0');
      const netProfit = new Decimal(pl?.find((r: any) => r.section === 'net_profit' && r.is_subtotal)?.amount ?? '0');
      
      return {
        totalSales: totalSales.toString(),
        totalReceivables: totalReceivables.toString(),
        inventoryValue: inventoryValue.toString(),
        cashOnHand: cashOnHand.toString(),
        netProfit: netProfit.toString(),
        taxLiability: (tax || []).reduce((acc: Decimal, le: any) => 
          le.entry_type === 'credit' 
            ? acc.plus(new Decimal(le.amount ?? '0')) 
            : acc.minus(new Decimal(le.amount ?? '0')), 
          new Decimal(0)
        ).toString(),
        activeOrders: activeOrders || 0,
        pendingDeliveries: pendingDeliveries || 0,
        dataUpdatedAt: new Date().toISOString()
      };
    },
    enabled: !!businessId,
    refetchInterval: 60000,
    staleTime: 60 * 1000
  });


  // Fetch Anomalies
  const { data: anomalies } = useQuery({
    queryKey: ['anomalies', businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from('anomaly_alerts').select('*').eq('business_id', businessId).eq('resolved', false).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
    staleTime: 30 * 1000,
  });

  // Fetch Chart Data (Last 7 Days Sales)
  const { data: chartData = [] } = useQuery({
    queryKey: ['dashboard-velocity', businessId],
    queryFn: async () => {
      const sevenDaysAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('invoices')
        .select('total, issue_date')
        .eq('business_id', businessId)
        .gte('issue_date', sevenDaysAgo)
        .not('status', 'eq', 'cancelled');
      
      if (error) throw error;

      const dailyMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'dd MMM');
        dailyMap[date] = 0;
      }

      data.filter((inv: any) => inv.total !== null).forEach((inv: any) => {
        const date = format(new Date(inv.issue_date), 'dd MMM');
        if (dailyMap[date] !== undefined) {
          dailyMap[date] = new Decimal(dailyMap[date]).plus(new Decimal(inv.total)).toNumber();
        }
      });

      return Object.entries(dailyMap).map(([name, velocity]) => ({ name, velocity }));
    },
    enabled: !!businessId
  });

  // Fetch Seasonal Context
  const { data: seasonalContext } = useQuery({
    queryKey: ['seasonal-context', businessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_seasonal_context', { p_business_id: businessId });
      if (error) throw error;
      return data;
    },
    enabled: !!businessId
  });

  // Fetch Onboarding Status & Activity
  const { data: onboardingData } = useQuery({
    queryKey: ['onboarding-data', businessId],
    queryFn: async () => {
      const [
        { count: skus }, 
        { count: invoices }, 
        { count: parties },
        settingsRes
      ] = await Promise.all([
        supabase.from('skus').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
        supabase.from('parties').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
        fetch('/api/settings').then(res => res.json())
      ]);

      const config = settingsRes?.localConfig || [];
      const complete = config.find((c: any) => c.key === 'onboarding_complete')?.value === 'true';
      const skipped = config.find((c: any) => c.key === 'onboarding_skipped')?.value === 'true';

      return { 
        skus: skus || 0, 
        invoices: invoices || 0, 
        parties: parties || 0,
        complete,
        skipped
      };
    },
    enabled: !!businessId
  });

  const [userEmail, setUserEmail] = useState<string>("");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: any }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, [supabase]);

  useEffect(() => {
    if (profile && onboardingData) {
      const businessCreated = new Date(profile.created_at || Date.now());
      const isNew = (Date.now() - businessCreated.getTime()) < 7 * 24 * 60 * 60 * 1000;
      
      const shouldShow = 
        !onboardingData.complete && 
        !onboardingData.skipped && 
        onboardingData.skus === 0 && 
        onboardingData.invoices === 0 && 
        isNew;

      // Also show if they have some activity now but haven't finished the guide (Step 3)
      const hasSomeActivity = onboardingData.skus > 0 || onboardingData.parties > 0;
      
      if (shouldShow || (hasSomeActivity && !onboardingData.complete && !onboardingData.skipped)) {
        queueMicrotask(() => setShowWelcome(true));
      }
    }
  }, [profile, onboardingData]);

  const handleWelcomeClose = async (skipped = false) => {
    setShowWelcome(false);
    const key = skipped ? 'onboarding_skipped' : 'onboarding_complete';
    
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'local_config',
        data: { [key]: 'true' }
      })
    });
    
    queryClient.invalidateQueries({ queryKey: ['onboarding-data'] });
  };

  const isLoading = isKpiLoading || isPersonaLoading;
  if (isLoading) return (
    <div className="p-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0F1114] border border-white/[0.06] rounded-sm p-4">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="bg-[#0F1114] border border-white/[0.06] rounded-sm p-4">
          <Skeleton className="h-4 w-28 mb-4" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );

  if (kpiError) return (
    <div className="p-6 min-h-screen bg-noxis-bg flex items-center justify-center">
      <ErrorState
        message="Could not load Dashboard KPIs"
        detail={(kpiError as Error).message}
        onRetry={refetchKpis}
      />
    </div>
  );

  const ownerName = profile?.owner_name || userEmail.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-noxis-bg text-noxis-text selection:bg-electric-blue/30">
      
      <SentinelAlertOverlay />
      
      <AnimatePresence>
        {showWelcome && (
          <WelcomeGuide 
            ownerName={ownerName} 
            businessName={businessName || 'Your Business'} 
            industry={profile?.industry_type || 'general'}
            hasActivity={(onboardingData?.skus || 0) > 0 || (onboardingData?.parties || 0) > 0}
            onClose={handleWelcomeClose}
          />
        )}
      </AnimatePresence>
      
      <main className="transition-all duration-300 min-h-screen flex flex-col">
        
        {/* SEASONAL BANNER */}
        <AnimatePresence>
          {seasonalContext?.current_season && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#C5A059] text-black px-8 py-3 flex items-center justify-between overflow-hidden"
            >
              <div className="flex items-center space-x-4">
                <Globe size={18} className="animate-spin-slow" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    {seasonalContext.current_season} ACTIVE — {seasonalContext.days_remaining} DAYS REMAINING
                  </span>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-[11px] font-bold">
                      Target: {fmt(new Decimal(seasonalContext.revenue_target ?? '0'), { compact: true })} | Current: {fmt(new Decimal(kpis?.totalSales ?? '0'), { compact: true })}
                    </span>
                    <div className="w-32 h-1 bg-black/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, ((kpis?.totalSales || 0) / (seasonalContext.revenue_target || 1)) * 100)}%` }}
                        className="h-full bg-black"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase border border-black/20 px-3 py-1 hover:bg-black hover:text-[#C5A059] transition-all cursor-pointer">
                Boost Production
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">
                Dashboard
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {format(new Date(), 'EEEE, d MMMM yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-3">
               <button 
                 onClick={() => {
                   const summary = ALERT_TEMPLATES.daily_summary({
                     date: format(new Date(), 'dd MMM yyyy'),
                     revenue: fmt(new Decimal(kpis?.totalSales || 0)),
                     units: String(kpis?.activeOrders || 0) + " Active Orders",
                     topKarigar: "N/A",
                     lowStockCount: 0
                   });
                   sendWhatsAppAlert(profile?.phone || '', summary);
                 }}
                 className="flex items-center space-x-2 px-4 py-2 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-[10px] font-black uppercase tracking-widest hover:bg-[#25D366]/20 transition-all"
               >
                  <MessageCircle size={14} />
                  <span>Send Daily Summary</span>
               </button>
            </div>
          </div>

          {/* 7-day banner (subtle, dismissable): */}
          {show7DayPrompt && (
            <div className="flex items-center justify-between p-3 mb-4 bg-[#C5A059]/5 border border-[#C5A059]/20 rounded-sm">
              <p className="text-xs text-gray-400">
                You have been using Noxis for a week.
                <span className="text-[#C5A059] ml-1">
                  How is it going?
                </span>
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setFeedbackOpen(true);
                    setShow7DayPrompt(false);
                  }}
                  className="text-xs font-semibold text-[#C5A059] hover:text-amber-300 transition-colors"
                >
                  Share feedback →
                </button>
                <button
                  onClick={() => setShow7DayPrompt(false)}
                  className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <OnboardingChecklist />

          <div className="space-y-4">
            <PromiseAlertWidget />
            <DailyBrief />
            <PatternAlerts />
          </div>

          <MobileAppBanner />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-max">
            <KpiCard 
              label="Monthly Revenue" 
              value={kpis?.totalSales || 0} 
              icon={DollarSign} 
              isLoading={isKpiLoading} 
              chartData={chartData} 
              sub={Number(kpis?.totalSales || 0) > 0 ? "This month" : <Link href="/invoices" className="text-electric-blue hover:underline">Create your first invoice →</Link>}
            />
            <KpiCard 
              label="Net Profit (MTD)" 
              value={kpis?.netProfit || 0} 
              icon={TrendingUp} 
              isLoading={isKpiLoading}
              chartData={chartData.map(d => ({ ...d, velocity: d.velocity * 0.2 }))} 
              sub={Number(kpis?.netProfit || 0) > 0 ? "After expenses" : <Link href="/khata" className="text-electric-blue hover:underline">Record transactions →</Link>}
            />
            <KpiCard 
              label="Accounts Receivable" 
              value={kpis?.totalReceivables || 0} 
              icon={Clock} 
              isLoading={isKpiLoading}
              chartData={chartData.map(d => ({ ...d, velocity: d.velocity * 0.5 }))} 
              sub={Number(kpis?.totalReceivables || 0) > 0 ? "Owed to you by customers" : <Link href="/promises" className="text-electric-blue hover:underline">View payment promises →</Link>}
            />
            <KpiCard 
              label={getIndustryLabel('stock') + " Value"} 
              value={kpis?.inventoryValue || 0} 
              icon={Package} 
              isLoading={isKpiLoading}
              chartData={chartData.map(d => ({ ...d, velocity: d.velocity * 0.3 }))} 
              sub="Current inventory value"
            />
            
            {/* Contextual Industry Widgets */}
            {activeIndustry.dashboardWidgets.includes('karigar_efficiency') && (
              <KpiCard label={getIndustryLabel('persona') + " Efficiency"} value={88} icon={Activity} isPositive trend="4.2%" />
            )}
            
            {activeIndustry.dashboardWidgets.includes('expiry_alerts') && (
              <KpiCard label="Expiry Risks" value={12} icon={AlertCircle} isPositive={false} trend="High" />
            )}

            {activeIndustry.dashboardWidgets.includes('moisture_levels') && (
              <KpiCard label="Avg. Moisture" value="14.2%" icon={Activity} trend="Stable" />
            )}

            <KpiCard 
              label="Pending Logistics" 
              value={kpis?.pendingDeliveries || 0} 
              icon={Truck} 
              isLoading={isKpiLoading} 
              sub={Number(kpis?.pendingDeliveries || 0) > 0 ? "Awaiting delivery" : <Link href="/dispatch" className="text-electric-blue hover:underline">Create dispatch →</Link>}
            />
            <KpiCard 
              label="Liquidity (Cash)" 
              value={kpis?.cashOnHand || 0} 
              icon={Wallet} 
              isLoading={isKpiLoading} 
              sub={Number(kpis?.cashOnHand || 0) > 0 ? "Available cash" : <Link href="/khata" className="text-electric-blue hover:underline">Record a cash entry →</Link>}
            />
            <KpiCard label="Estimated Tax Liab." value={kpis?.taxLiability || 0} icon={ShieldCheck} isLoading={isKpiLoading} />
            <CCTVWidget />
          </div>

          <DeadStockWidget />

          {/* Main Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-noxis-surface border border-noxis-border p-8 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <TrendingUp size={120} />
               </div>
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Financial Velocity</h3>
                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-1">Industrial Output Intensity</p>
                  </div>
                  <div className="flex space-x-4">
                     <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-noxis-accent rounded-full" />
                        <span className="text-[9px] uppercase font-bold text-gray-500">Revenue Stream</span>
                     </div>
                  </div>
               </div>
               <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData}>
                     <defs>
                       <linearGradient id="colorVel" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="var(--color-noxis-accent)" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="var(--color-noxis-accent)" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4B5563', fontSize: 10}} />
                     <YAxis hide />
                     <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--color-noxis-surface)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }}
                        itemStyle={{ color: 'var(--color-noxis-accent)' }}
                     />
                     <Area type="monotone" dataKey="velocity" stroke="var(--color-noxis-accent)" fillOpacity={1} fill="url(#colorVel)" strokeWidth={3} />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Anomaly & Alert Sidebar */}
            <div className="space-y-6">
               <div className="bg-noxis-surface border border-noxis-border p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center">
                      <AlertCircle size={14} className="text-critical-red mr-2" />
                      Anomalies Detected
                    </h3>
                    <span className="text-[9px] bg-critical-red/10 text-critical-red px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{anomalies?.length || 0}</span>
                  </div>
                  
                  <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
                    {anomalies && anomalies.length > 0 ? anomalies.map((alert: any) => (
                      <div key={alert.id} className="p-4 bg-white/5 border border-white/5 hover:border-red-500/30 transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-2">
                          <span className={cn(
                            "text-[8px] uppercase font-black px-1.5 py-0.5 rounded-sm",
                            alert.severity === 'critical' ? "bg-red-500 text-white" : "bg-orange-500 text-white"
                          )}>{alert.severity}</span>
                          <span className="text-[8px] text-gray-600 font-mono">{new Date(alert.created_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[10px] text-white font-bold leading-tight uppercase group-hover:text-red-400 transition-colors">{alert.alert_type.replace(/_/g, ' ')}</p>
                        <p className="text-[9px] text-gray-500 mt-1 line-clamp-2">{alert.payload?.message || "Data integrity variance detected."}</p>
                      </div>
                    )) : (
                      <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-20 py-12">
                        <ShieldCheck size={48} />
                        <span className="text-[10px] uppercase font-black tracking-widest">No Integrity Gaps</span>
                      </div>
                    )}
                  </div>

                  <button className="w-full mt-6 py-3 bg-white/5 border border-white/5 text-[9px] uppercase font-black text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                    View Event History
                  </button>
               </div>
            </div>
          </div>

          {/* Footer Status */}
          <div className="pt-8 border-t border-white/5 flex items-center justify-between">
             <div className="flex space-x-12">
               <DataFreshness lastFetchedAt={kpis?.dataUpdatedAt ? new Date(kpis.dataUpdatedAt) : null} />
               <StatusItem label="Hub Uptime" value="14d 6h 22m" status="OK" />
               <StatusItem label="Sync Pipeline" value="99.9% Reliable" status="OK" />
               <StatusItem label="DB Latency" value="42ms" status="OK" />
             </div>
             <div className="text-[9px] text-gray-700 font-black uppercase tracking-[0.4em]">
                System Protected by Noxis Sentinel
             </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.1);
        }
      `}</style>
      
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        trigger="milestone"
      />
    </div>
  );
}

function KpiCard({ label, value, sub, isLoading }: any) {
  return (
    <div className="rounded-sm bg-noxis-surface border border-noxis-border p-5 hover:border-noxis-border/20 transition-colors relative overflow-hidden">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-1/3 h-[1px] bg-gradient-to-r from-[#60A5FA] to-transparent opacity-60" />
      
      {/* Label */}
      <p className="text-xxs font-semibold tracking-wide-md uppercase text-gray-500">
        {label}
      </p>
      
      {/* Value */}
      <div className="mt-2 font-mono text-2xl font-semibold text-[#C5A059] tabular-nums">
        {isLoading ? <div className="h-8 w-24 bg-white/5 animate-pulse rounded" /> : <AnimatedNumber value={value} />}
      </div>
      
      {/* Sub label */}
      {sub && (
        <p className="text-[11px] text-gray-600 mt-1">
          {sub}
        </p>
      )}
    </div>
  );
}

function StatusItem({ label, value, status }: any) {
  return (
     <div className="flex flex-col">
        <span className="text-xxs font-semibold tracking-wide-md uppercase text-gray-600">{label}</span>
        <div className="flex items-center space-x-2">
           <span className="financial text-xs text-white">{value}</span>
           <span className="text-[8px] font-black text-emerald-500 uppercase">{status}</span>
        </div>
     </div>
  );
}
