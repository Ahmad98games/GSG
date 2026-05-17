"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { usePersona } from "@/hooks/usePersona";
import { useSidebarState } from "@/hooks/useSidebarState";

import { 
  TrendingUp, TrendingDown, Wallet, 
  AlertCircle, ArrowRight, ChevronRight, ChevronDown,
  Calendar, Briefcase, FileText, ShoppingCart, Loader2,
  CheckCircle2, ShieldCheck
} from "lucide-react";
import { 
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from "recharts";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface CashflowSource {
  type: 'invoice' | 'purchase_order' | 'payroll' | 'other';
  amount: number;
  party?: string;
  supplier?: string;
  invoice_number?: string;
}

interface CashflowForecast {
  forecast_date: string;
  expected_inflows: number;
  expected_outflows: number;
  net_position: number;
  cumulative_position: number;
  inflow_sources: CashflowSource[];
  outflow_sources: CashflowSource[];
  risk_level: 'healthy' | 'warning' | 'critical';
}

export default function CashFlowForecastPage() {
  const { isCollapsed } = useSidebarState();
  const { fmt, t, businessId } = usePersona();
  const supabase = createClient();
  const [days, setDays] = useState(30);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const { data: forecast = [], isLoading } = useQuery<CashflowForecast[]>({
    queryKey: ['cashflow_forecast', businessId, days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cashflow_forecast', {
        p_business_id: businessId,
        p_days: days
      });
      if (error) throw error;
      return data;
    },
    enabled: !!businessId
  });

  const summary = useMemo(() => {
    if (forecast.length === 0) return null;
    const currentCash = Number(forecast[0].cumulative_position) - (Number(forecast[0].expected_inflows) - Number(forecast[0].expected_outflows));
    const next30 = forecast.slice(0, 30);
    const inflows30 = next30.reduce((acc: number, d: CashflowForecast) => acc + Number(d.expected_inflows), 0);
    const outflows30 = next30.reduce((acc: number, d: CashflowForecast) => acc + Number(d.expected_outflows), 0);
    const criticalDate = forecast.find((d: CashflowForecast) => d.risk_level === 'critical');

    return {
      currentCash,
      inflows30,
      outflows30,
      net30: inflows30 - outflows30,
      criticalDate
    };
  }, [forecast]);

  

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter">
      
      
      <main className={cn( "transition-all duration-300 min-h-screen flex flex-col")}>
        <header className="h-20 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
           <div className="flex flex-col">
              <h1 className="text-xl font-black uppercase tracking-tighter text-white">
                {t('cashflow.title', 'Cash Flow Forecast')}
              </h1>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">Projected inflows and outflows for the next {days} days</p>
           </div>

           <div className="ml-auto flex bg-white/5 p-1 rounded-sm border border-white/5">
              {[30, 60, 90].map((d) => (
                <button 
                  key={d}
                  onClick={() => setDays(d)}
                  className={cn(
                    "px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                    days === d ? "bg-electric-blue text-onyx shadow-lg" : "text-gray-500 hover:text-white"
                  )}
                >
                  {d} Days
                </button>
              ))}
           </div>
        </header>

        <div className="p-12 max-w-[1600px] mx-auto w-full space-y-10">
           {/* Danger Alert */}
           {summary?.criticalDate && (
             <div className="bg-red-500 text-white p-6 flex items-center justify-between border-l-8 border-white/20 animate-pulse-slow">
                <div className="flex items-center space-x-6">
                   <div className="p-3 bg-white/10 rounded-full">
                      <AlertCircle size={24} />
                   </div>
                   <div>
                      <h4 className="text-sm font-black uppercase tracking-widest">
                         Cash shortfall projected on {format(new Date(summary.criticalDate.forecast_date), 'dd MMM yyyy')}
                      </h4>
                      <p className="text-xs font-medium opacity-80 mt-1">
                         Estimated deficit: <span className="font-bold">{fmt(Math.abs(Number(summary.criticalDate.cumulative_position)))}</span>. Review your receivables or negotiate payment terms.
                      </p>
                   </div>
                </div>
             </div>
           )}

           {/* Summary Row */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <SummaryCard 
                label={t('cashflow.current_balance', "Cash & Bank Balance")} 
                value={fmt(summary?.currentCash || 0)} 
                icon={Wallet} 
                color="text-sandstone-gold"
              />
              <SummaryCard 
                label="Expected Inflows (30D)" 
                value={fmt(summary?.inflows30 || 0)} 
                icon={TrendingUp} 
                color="text-emerald-500"
              />
              <SummaryCard 
                label="Expected Outflows (30D)" 
                value={fmt(summary?.outflows30 || 0)} 
                icon={TrendingDown} 
                color={Number(summary?.outflows30) > Number(summary?.inflows30) ? "text-red-500" : "text-gray-400"}
              />
              <SummaryCard 
                label={t('cashflow.net_30', "Net 30-Day Position")} 
                value={fmt(summary?.net30 || 0)} 
                icon={TrendingUp} 
                color={Number(summary?.net30) >= 0 ? "text-emerald-500" : "text-red-500"}
              />
           </div>

           {/* Main Chart */}
           <div className="bg-[#1A1D21] border border-white/5 p-8 relative">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Liquidity Projection</h3>
                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-1">Cumulative Position vs Daily Flows</p>
                 </div>
                 <div className="flex items-center space-x-6">
                    <LegendItem color="#0070F3" label="Cumulative Cash" isArea />
                    <LegendItem color="#10B981" label="Daily Inflows" />
                    <LegendItem color="#EF4444" label="Daily Outflows" />
                 </div>
              </div>

              <div className="h-[400px] w-full">
                 {isLoading ? (
                   <div className="h-full flex items-center justify-center">
                      <Loader2 className="animate-spin text-electric-blue" size={32} />
                   </div>
                 ) : (
                   <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={forecast}>
                        <defs>
                           <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={summary?.criticalDate ? "#EF4444" : "#0070F3"} stopOpacity={0.15}/>
                              <stop offset="95%" stopColor={summary?.criticalDate ? "#EF4444" : "#0070F3"} stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis 
                          dataKey="forecast_date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#4B5563', fontSize: 10}}
                          tickFormatter={(val) => format(new Date(val), 'dd MMM')}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#4B5563', fontSize: 10}}
                          tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                        />
                        <Tooltip 
                          content={<CustomTooltip fmt={fmt} />}
                        />
                        {summary?.criticalDate && (
                           <ReferenceLine 
                             x={summary.criticalDate.forecast_date} 
                             stroke="#EF4444" 
                             strokeDasharray="5 5" 
                             label={{ value: 'Cash shortfall begins here', position: 'insideTopLeft', fill: '#EF4444', fontSize: 10, fontWeight: 'bold' }}
                           />
                        )}
                        <Bar dataKey="expected_inflows" fill="#10B981" barSize={20} radius={[2, 2, 0, 0]} />
                        <Bar dataKey="expected_outflows" fill="#EF4444" fillOpacity={0.7} barSize={20} radius={[2, 2, 0, 0]} />
                        <Area 
                          type="monotone" 
                          dataKey="cumulative_position" 
                          stroke={summary?.criticalDate ? "#EF4444" : "#0070F3"} 
                          fillOpacity={1} 
                          fill="url(#colorCash)" 
                          strokeWidth={3} 
                        />
                      </ComposedChart>
                   </ResponsiveContainer>
                 )}
              </div>
           </div>

           {/* Detail Table */}
           <div className="bg-[#1A1D21] border border-white/5 rounded-sm overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                 <h3 className="text-xs font-black text-white uppercase tracking-widest">Daily Drill-down</h3>
                 <span className="text-[9px] text-gray-500 font-mono italic">Granular cash-flow events</span>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] uppercase font-black text-gray-500 tracking-widest">
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4 text-right">Inflows</th>
                          <th className="px-6 py-4 text-right">Outflows</th>
                          <th className="px-6 py-4 text-right">Net</th>
                          <th className="px-6 py-4 text-right">Cumulative</th>
                          <th className="px-6 py-4 text-center">Risk</th>
                          <th className="px-6 py-4">Sources</th>
                       </tr>
                    </thead>
                    <tbody>
                       {forecast.map((d: CashflowForecast) => (
                         <React.Fragment key={d.forecast_date}>
                           <tr className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group cursor-pointer" onClick={() => setExpandedDate(expandedDate === d.forecast_date ? null : d.forecast_date)}>
                              <td className="px-6 py-4 text-xs font-bold text-white uppercase tracking-tight">
                                 {format(new Date(d.forecast_date), 'dd MMM yyyy')}
                                 <span className="ml-2 text-[9px] text-gray-600 font-normal">{format(new Date(d.forecast_date), 'EEEE')}</span>
                              </td>
                              <td className="px-6 py-4 text-right text-xs font-mono text-emerald-500 font-bold">{Number(d.expected_inflows) > 0 ? fmt(d.expected_inflows) : '-'}</td>
                              <td className="px-6 py-4 text-right text-xs font-mono text-red-400 font-bold">{Number(d.expected_outflows) > 0 ? fmt(d.expected_outflows) : '-'}</td>
                              <td className={cn("px-6 py-4 text-right text-xs font-mono font-black", Number(d.net_position) >= 0 ? "text-slate-400" : "text-red-500")}>{fmt(d.net_position)}</td>
                              <td className={cn("px-6 py-4 text-right text-xs font-mono font-black", Number(d.cumulative_position) >= 0 ? "text-white" : "text-red-500")}>{fmt(d.cumulative_position)}</td>
                              <td className="px-6 py-4 text-center">
                                 <RiskDot level={d.risk_level} />
                              </td>
                              <td className="px-6 py-4">
                                 {(d.inflow_sources.length > 0 || d.outflow_sources.length > 0) && (
                                   <div className="flex items-center text-[9px] font-black text-electric-blue uppercase tracking-widest">
                                      {d.inflow_sources.length + d.outflow_sources.length} Events
                                      {expandedDate === d.forecast_date ? <ChevronDown size={14} className="ml-1" /> : <ChevronRight size={14} className="ml-1" />}
                                   </div>
                                 )}
                              </td>
                           </tr>
                           {expandedDate === d.forecast_date && (
                             <tr className="bg-black/20 border-b border-white/5">
                               <td colSpan={7} className="px-12 py-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                     <div className="space-y-4">
                                        <h5 className="text-[9px] font-black uppercase text-gray-500 tracking-widest border-b border-white/5 pb-2">Projected Inflows</h5>
                                        {d.inflow_sources.length > 0 ? d.inflow_sources.map((s: CashflowSource, i: number) => (
                                          <SourceRow key={i} source={s} fmt={fmt} isOutflow={false} />
                                        )) : <p className="text-[9px] text-gray-700 italic">No inflows scheduled for this date</p>}
                                     </div>
                                     <div className="space-y-4">
                                        <h5 className="text-[9px] font-black uppercase text-gray-500 tracking-widest border-b border-white/5 pb-2">Projected Outflows</h5>
                                        {d.outflow_sources.length > 0 ? d.outflow_sources.map((s: CashflowSource, i: number) => (
                                          <SourceRow key={i} source={s} fmt={fmt} isOutflow={true} />
                                        )) : <p className="text-[9px] text-gray-700 italic">No outflows scheduled for this date</p>}
                                     </div>
                                  </div>
                               </td>
                             </tr>
                           )}
                         </React.Fragment>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* Recommendations */}
           <div className="bg-[#1A1D21] border border-white/5 p-8 space-y-8">
              <div>
                 <h3 className="text-xs font-black text-white uppercase tracking-widest italic">CFO Action Plan</h3>
                 <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-1">Rule-based optimization strategies</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <Recommendation 
                   forecast={forecast}
                   fmt={fmt}
                   type="receivables"
                 />
                 <Recommendation 
                   forecast={forecast}
                   fmt={fmt}
                   type="payroll"
                 />
                 <Recommendation 
                   forecast={forecast}
                   fmt={fmt}
                   type="purchases"
                 />
              </div>
           </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-red {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pulse-red {
          animation: pulse-red 2s infinite;
        }
      `}</style>
    </div>
  );
}

// --- Internal Components ---

function SummaryCard({ label, value, icon: Icon, color }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-[#1A1D21] border border-white/5 p-6 space-y-4 group">
       <div className="flex items-center justify-between">
          <div className="p-2 bg-white/5 text-gray-500 group-hover:text-electric-blue transition-colors">
             <Icon size={18} />
          </div>
          <span className={cn("text-2xl font-black font-mono tracking-tighter", color)}>{value}</span>
       </div>
       <div className="space-y-1">
          <h4 className="text-[10px] uppercase font-black text-gray-600 tracking-widest">{label}</h4>
          <div className="h-0.5 w-8 bg-white/5 group-hover:w-full group-hover:bg-electric-blue/30 transition-all duration-500" />
       </div>
    </div>
  );
}

function LegendItem({ color, label, isArea }: { color: string, label: string, isArea?: boolean }) {
  return (
    <div className="flex items-center space-x-2">
       <div className={cn("h-2 rounded-full", isArea ? "w-4" : "w-2")} style={{ backgroundColor: color }} />
       <span className="text-[9px] uppercase font-black text-gray-500 tracking-widest">{label}</span>
    </div>
  );
}

function RiskDot({ level }: { level: string }) {
  if (level === 'healthy') return <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto" />;
  if (level === 'warning') return <div className="w-2 h-2 rounded-full bg-amber-500 mx-auto shadow-[0_0_8px_rgba(245,158,11,0.5)]" />;
  return <div className="w-2.5 h-2.5 rounded-full bg-red-500 mx-auto animate-pulse-red shadow-[0_0_12px_rgba(239,68,68,0.7)]" />;
}

function SourceRow({ source, fmt, isOutflow }: {
  source: CashflowSource;
  fmt: (v: number | string) => string;
  isOutflow: boolean;
}) {
  const Icon = source.type === 'invoice' ? FileText : source.type === 'purchase_order' ? ShoppingCart : Briefcase;
  return (
    <div className="flex items-center justify-between group/row">
       <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-white/5 text-gray-600 group-hover/row:text-white transition-colors">
             <Icon size={12} />
          </div>
          <div className="flex flex-col">
             <span className="text-[10px] font-bold text-slate-300 uppercase leading-none">{source.party || source.supplier || (source.type === 'payroll' ? 'Monthly Payroll' : 'External Event')}</span>
             <span className="text-[8px] text-gray-600 font-mono mt-1">{source.invoice_number || source.type.replace('_', ' ')}</span>
          </div>
       </div>
       <span className={cn("text-[11px] font-black font-mono", isOutflow ? "text-red-400" : "text-emerald-500")}>
          {isOutflow ? '-' : '+'}{fmt(source.amount)}
       </span>
    </div>
  );
}

function CustomTooltip({ active, payload, fmt }: {
  active?: boolean;
  payload?: { payload: CashflowForecast }[];
  fmt: (v: number | string) => string;
}) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#1A1D21] border border-white/10 p-4 shadow-2xl space-y-3">
         <p className="text-[10px] font-black uppercase tracking-widest text-white border-b border-white/5 pb-2">
           {format(new Date(data.forecast_date), 'dd MMMM yyyy')}
         </p>
         <div className="space-y-1">
            <div className="flex justify-between space-x-8">
               <span className="text-[9px] uppercase font-bold text-gray-500">Inflows</span>
               <span className="text-[10px] font-mono text-emerald-500 font-black">{fmt(data.expected_inflows)}</span>
            </div>
            <div className="flex justify-between space-x-8">
               <span className="text-[9px] uppercase font-bold text-gray-500">Outflows</span>
               <span className="text-[10px] font-mono text-red-500 font-black">{fmt(data.expected_outflows)}</span>
            </div>
            <div className="flex justify-between space-x-8 pt-2 border-t border-white/5">
               <span className="text-[9px] uppercase font-bold text-white">Cumulative</span>
               <span className={cn("text-[10px] font-mono font-black", Number(data.cumulative_position) >= 0 ? "text-electric-blue" : "text-red-500")}>{fmt(data.cumulative_position)}</span>
            </div>
         </div>
      </div>
    );
  }
  return null;
}

function Recommendation({ forecast, fmt, type }: {
  forecast: CashflowForecast[];
  fmt: (v: number | string) => string;
  type: 'receivables' | 'payroll' | 'purchases';
}) {
  const criticalDays = forecast.filter((d: CashflowForecast) => d.risk_level === 'critical');
  
  if (type === 'receivables') {
     const totalOutstandingInflows = forecast.reduce((acc: number, d: CashflowForecast) => {
        return acc + d.inflow_sources.filter((s: CashflowSource) => s.type === 'invoice').reduce((a: number, s: CashflowSource) => a + Number(s.amount), 0);
     }, 0);

     if (criticalDays.length > 0 && totalOutstandingInflows > Math.abs(Number(criticalDays[0].cumulative_position))) {
        return (
          <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 space-y-4">
             <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center">
                <CheckCircle2 size={14} className="mr-2" />
                Receivables Opportunity
             </h4>
             <p className="text-xs text-slate-300 font-medium leading-relaxed">
                You have {fmt(totalOutstandingInflows)} in projected inflows. Expediting collection on just 20% of these will resolve the upcoming shortfall on {format(new Date(criticalDays[0].forecast_date), 'dd MMM')}.
             </p>
          </div>
        );
     }
  }

  if (type === 'payroll') {
     const payrollDay = forecast.find((d: CashflowForecast) => d.outflow_sources.some((s: CashflowSource) => s.type === 'payroll'));
     if (payrollDay && payrollDay.risk_level !== 'healthy') {
        return (
          <div className="bg-amber-500/5 border border-amber-500/20 p-6 space-y-4">
             <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center">
                <Calendar size={14} className="mr-2" />
                Payroll Safeguard
             </h4>
             <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Monthly payroll of {fmt(payrollDay.outflow_sources.find((s: CashflowSource) => s.type === 'payroll')!.amount)} is due soon. Current projection shows a tight margin. Consider delaying non-critical purchases.
             </p>
          </div>
        );
     }
  }

  if (type === 'purchases') {
     const largePO = forecast.find((d: CashflowForecast) => d.outflow_sources.some((s: CashflowSource) => s.type === 'purchase_order' && Number(s.amount) > 100000));
     if (largePO && largePO.risk_level !== 'healthy') {
        return (
          <div className="bg-red-500/5 border border-red-500/20 p-6 space-y-4">
             <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center">
                <ArrowRight size={14} className="mr-2" />
                Term Negotiation
             </h4>
             <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Large purchase due on {format(new Date(largePO.forecast_date), 'dd MMM')}. Negotiating a 14-day extension would stabilize the cumulative cash line.
             </p>
          </div>
        );
     }
  }

  return (
    <div className="bg-white/5 border border-white/10 p-6 flex flex-col items-center justify-center text-center space-y-2 opacity-40">
       <ShieldCheck size={24} className="text-gray-500" />
       <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">Maintain Current Strategy</span>
    </div>
  );
}
