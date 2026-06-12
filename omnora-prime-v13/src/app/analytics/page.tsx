"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  BarChart3, TrendingUp, Users, 
  Package, Activity, DollarSign,
  ArrowUpRight, ArrowDownLeft,
  Calendar, Info, Filter, Download,
  Layers, Wallet, Zap, ShieldCheck,
  Clock
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";

import { cn } from "@/lib/utils";
import Decimal from "decimal.js";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Sector, 
  AreaChart, Area, 
  LineChart, Line
} from "recharts";

// --- Components ---

const MetricCard = ({ label, value, sub, colorClass, icon: Icon }: any) => (
  <div className="bg-[#1A1D21] border border-white/5 p-6 relative overflow-hidden group hover:border-white/10 transition-all">
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
      <Icon size={40} />
    </div>
    <p className="text-[9px] uppercase font-black text-gray-500 tracking-[0.2em] mb-1">{label}</p>
    <div className="flex flex-col">
      <h3 className={cn("text-xl font-black tracking-tight font-mono", colorClass)}>{value}</h3>
      {sub && (
        <div className="flex items-center space-x-1 mt-1">
           <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{sub}</span>
        </div>
      )}
    </div>
  </div>
);

const ChartContainer = ({ title, icon: Icon, children, className }: any) => (
  <div className={cn("bg-[#1A1D21] border border-white/5 p-6 flex flex-col space-y-6", className)}>
    <div className="flex items-center justify-between">
       <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/5 text-gray-500 rounded-sm">
             <Icon size={16} />
          </div>
          <h3 className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em]">{title}</h3>
       </div>
       <div className="flex items-center space-x-2">
          <button className="p-1.5 hover:bg-white/5 text-gray-700 hover:text-white transition-colors"><Filter size={14} /></button>
          <button className="p-1.5 hover:bg-white/5 text-gray-700 hover:text-white transition-colors"><Download size={14} /></button>
       </div>
    </div>
    <div className="flex-1 min-h-[300px]">
       {children}
    </div>
  </div>
);

// --- Page Component ---

export default function AnalyticsDashboard() {
  const { fmt, businessId } = usePersona();
  const supabase = createClient();

  // Queries
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['business_analytics', businessId],
    queryFn: async () => {
      // Fetch data for all charts
      const [
        { data: invoices },
        { data: skus },
        { data: production },
        { data: parties },
        { data: expenses }
      ] = await Promise.all([
        supabase.from('invoices').select('total, issue_date, party_id, status').eq('business_id', businessId),
        supabase.from('skus').select('qty_on_hand, cost_price, category').eq('business_id', businessId),
        supabase.from('karigar_production_logs').select('qty_produced, log_date').eq('business_id', businessId),
        supabase.from('parties').select('id, name'),
        supabase.from('ledger_entries').select('amount, posted_at').eq('business_id', businessId).eq('entry_type', 'debit') // Rough proxy for expenses
      ]);

      return { invoices, skus, production, parties, expenses };
    },
    enabled: !!businessId
  });

  // Data Processing
  const processed = useMemo(() => {
    if (!analyticsData) return null;

    // 1. Revenue Trend (12 Months)
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      return d.toLocaleString('default', { month: 'short' });
    });

    const revenueByMonth = months.map(m => ({ month: m, revenue: 0, count: 0 }));
    analyticsData.invoices?.forEach((inv: any) => {
      const m = new Date(inv.issue_date).toLocaleString('default', { month: 'short' });
      const idx = revenueByMonth.findIndex(item => item.month === m);
      if (idx !== -1) {
        revenueByMonth[idx].revenue += Number(inv.total);
        revenueByMonth[idx].count += 1;
      }
    });

    // 2. Top Customers
    const customerRev: any = {};
    analyticsData.invoices?.forEach((inv: any) => {
      if (!customerRev[inv.party_id]) customerRev[inv.party_id] = 0;
      customerRev[inv.party_id] += Number(inv.total);
    });
    const topCustomers = Object.entries(customerRev)
      .map(([id, total]) => ({
        name: analyticsData.parties?.find((p: any) => p.id === id)?.name || 'Unknown',
        total
      }))
      .sort((a, b) => (b.total as number) - (a.total as number))
      .slice(0, 10);

    // 3. Inventory Donut
    const categoryVal: any = {};
    analyticsData.skus?.forEach((sku: any) => {
      const cat = sku.category || 'Uncategorized';
      if (!categoryVal[cat]) categoryVal[cat] = 0;
      categoryVal[cat] += Number(new Decimal(sku.qty_on_hand).times(sku.cost_price || 0));
    });
    const inventoryDonut = Object.entries(categoryVal).map(([name, value]) => ({ name, value }));

    // 4. Production Area
    const prodTrend: any = {};
    analyticsData.production?.forEach((p: any) => {
      const date = p.log_date;
      if (!prodTrend[date]) prodTrend[date] = 0;
      prodTrend[date] += Number(p.qty_produced);
    });
    const productionArea = Object.entries(prodTrend)
      .map(([date, qty]) => ({ date, qty }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);

    // 5. Metrics Calculation
    const totalRev = analyticsData.invoices?.reduce((sum: number, inv: any) => sum + Number(inv.total), 0) || 0;
    const totalExp = analyticsData.expenses?.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0) || 0;
    const grossProfit = totalRev - totalExp;
    const margin = totalRev > 0 ? (grossProfit / totalRev) * 100 : 0;

    return { 
      revenueTrend: revenueByMonth, 
      topCustomers, 
      inventoryDonut, 
      productionArea,
      metrics: {
        revenue: totalRev,
        expenses: totalExp,
        profit: grossProfit,
        margin: margin.toFixed(1),
        avgInvoice: analyticsData.invoices?.length ? (totalRev / analyticsData.invoices.length).toFixed(0) : 0,
        turnover: "4.2x" // Mocked placeholder for complex calc
      }
    };
  }, [analyticsData]);

  const COLORS = ['#0070F3', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6'];

  if (isLoading) return (
    <div className="min-h-screen bg-[#0F1113] flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.5em] text-gray-700 animate-pulse">
      Aggregating Business Intelligence...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter">
      
      
      <main className="transition-all duration-300 min-h-screen flex flex-col pb-20">
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
           <div className="flex items-center space-x-3">
              <BarChart3 size={18} className="text-[#0070F3]" />
              <h1 className="text-[10px] uppercase font-black tracking-[0.4em] text-white">Authority Dashboard / Analytics</h1>
           </div>
           
           <div className="ml-auto flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 border border-white/5">
                 <Calendar size={12} className="text-gray-500" />
                 <span className="text-[9px] uppercase font-black tracking-widest text-gray-400">YTD Performance</span>
              </div>
              <button className="flex items-center space-x-2 bg-[#0070F3] hover:brightness-110 text-white px-4 py-1.5 text-[9px] uppercase font-black tracking-widest transition-all shadow-lg shadow-blue-500/10">
                 <RefreshCw size={12} />
                 <span>Sync Node</span>
              </button>
           </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">
           {/* KEY METRICS GRID */}
           <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <MetricCard 
                label="Total Revenue YTD" 
                value={fmt(processed?.metrics.revenue || 0)} 
                sub="Gross Billing"
                colorClass="text-white"
                icon={TrendingUp}
              />
              <MetricCard 
                label="Total Expenses YTD" 
                value={fmt(processed?.metrics.expenses || 0)} 
                sub="Net Outflow"
                colorClass="text-red-500"
                icon={ArrowDownLeft}
              />
              <MetricCard 
                label="Gross Profit" 
                value={fmt(processed?.metrics.profit || 0)} 
                sub={`${processed?.metrics.margin}% Margin`}
                colorClass="text-emerald-500"
                icon={DollarSign}
              />
              <MetricCard 
                label="Inventory Turnover" 
                value={processed?.metrics.turnover} 
                sub="Efficiency Score"
                colorClass="text-[#C5A059]"
                icon={Zap}
              />
              <MetricCard 
                label="Avg Invoice Value" 
                value={fmt(processed?.metrics.avgInvoice || 0)} 
                sub="Ticket Size"
                colorClass="text-blue-500"
                icon={Layers}
              />
              <MetricCard 
                label="Collection Days" 
                value="22 Days" 
                sub="Capital Cycle"
                colorClass="text-purple-500"
                icon={Clock}
              />
           </section>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* REVENUE TREND */}
              <ChartContainer title="Revenue Performance Trend" icon={TrendingUp} className="lg:col-span-2">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={processed?.revenueTrend}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                       <XAxis dataKey="month" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                       <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => fmt(val)} />
                       <Tooltip 
                         cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                         contentStyle={{ backgroundColor: '#1A1D21', border: '1px solid rgba(255,255,255,0.05)', fontSize: '10px' }}
                       />
                       <Bar dataKey="revenue" fill="#0070F3" radius={[2, 2, 0, 0]} barSize={40} />
                    </BarChart>
                 </ResponsiveContainer>
              </ChartContainer>

              {/* INVENTORY DISTRIBUTION */}
              <ChartContainer title="Inventory Value Share" icon={Package}>
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                         data={processed?.inventoryDonut}
                         innerRadius={60}
                         outerRadius={80}
                         paddingAngle={5}
                         dataKey="value"
                       >
                         {processed?.inventoryDonut.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" />
                         ))}
                       </Pie>
                       <Tooltip 
                         contentStyle={{ backgroundColor: '#1A1D21', border: '1px solid rgba(255,255,255,0.05)', fontSize: '10px' }}
                         formatter={(val: any) => fmt(val)}
                       />
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="grid grid-cols-2 gap-2 mt-4">
                    {processed?.inventoryDonut.slice(0, 4).map((item, i) => (
                      <div key={item.name} className="flex items-center space-x-2">
                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                         <span className="text-[8px] uppercase font-black text-gray-500 truncate">{item.name}</span>
                      </div>
                    ))}
                 </div>
              </ChartContainer>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* TOP CUSTOMERS */}
              <ChartContainer title="Top 10 High-Value Partners" icon={Users}>
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={processed?.topCustomers} layout="vertical" margin={{ left: 40 }}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                       <XAxis type="number" hide />
                       <YAxis 
                         dataKey="name" 
                         type="category" 
                         stroke="#475569" 
                         fontSize={9} 
                         width={100}
                         tickLine={false}
                         axisLine={false}
                       />
                       <Tooltip 
                         contentStyle={{ backgroundColor: '#1A1D21', border: '1px solid rgba(255,255,255,0.05)', fontSize: '10px' }}
                         formatter={(val: any) => fmt(val)}
                       />
                       <Bar dataKey="total" fill="url(#blueGradient)" radius={[0, 2, 2, 0]} barSize={20}>
                          <defs>
                             <linearGradient id="blueGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#0070F3" />
                                <stop offset="100%" stopColor="#0070F3" stopOpacity={0.3} />
                             </linearGradient>
                          </defs>
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </ChartContainer>

              {/* PRODUCTION OUTPUT */}
              <ChartContainer title="Production Efficiency (30 Days)" icon={Activity}>
                 {(processed?.productionArea?.length ?? 0) > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={processed?.productionArea}>
                          <defs>
                             <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis dataKey="date" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} />
                          <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#1A1D21', border: '1px solid rgba(255,255,255,0.05)', fontSize: '10px' }} />
                          <Area type="monotone" dataKey="qty" stroke="#10B981" fillOpacity={1} fill="url(#colorProd)" strokeWidth={2} />
                       </AreaChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-700">
                       <ShieldCheck size={48} strokeWidth={1} className="opacity-20 mb-4" />
                       <p className="text-[9px] uppercase font-black tracking-widest">No production logging detected</p>
                    </div>
                 )}
              </ChartContainer>
           </div>

           {/* CASH FLOW PREVIEW */}
           <ChartContainer title="Cash Flow Projection (30 Days)" icon={Wallet}>
              <div className="h-[200px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { day: '01 May', flow: 450000 },
                      { day: '05 May', flow: 520000 },
                      { day: '10 May', flow: 480000 },
                      { day: '15 May', flow: 610000 },
                      { day: '20 May', flow: 590000 },
                      { day: '25 May', flow: 750000 },
                      { day: '30 May', flow: 820000 },
                    ]}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                       <XAxis dataKey="day" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                       <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => fmt(val)} />
                       <Tooltip contentStyle={{ backgroundColor: '#1A1D21', border: '1px solid rgba(255,255,255,0.05)', fontSize: '10px' }} />
                       <Line type="stepAfter" dataKey="flow" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3, fill: '#F59E0B', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    </LineChart>
                 </ResponsiveContainer>
              </div>
           </ChartContainer>
        </div>
      </main>
    </div>
  );
}

const RefreshCw = ({ size }: any) => <Activity size={size} />;
