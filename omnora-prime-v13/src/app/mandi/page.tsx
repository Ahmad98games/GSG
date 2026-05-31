"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart2, Plus, Calendar, 
  Info, MapPin, Tag, Activity, Clock,
  ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";

import { cn } from "@/lib/utils";
import { LineChart, Line, ResponsiveContainer } from "recharts";

// --- Types ---

interface MandiRate {
  id: string;
  commodity: string;
  rate_per_unit: number;
  unit: string;
  rate_date: string;
  market_name: string;
  notes: string | null;
  business_id: string;
}

interface MandiCard {
  name: string;
  current: number;
  unit: string;
  changeDay: number;
  changeWeek: number;
  sparkData: { rate: number }[];
}

// --- Components ---

interface RateCardProps {
  commodity: string;
  rate: number;
  unit: string;
  changeDay: number;
  changeWeek: number;
  sparkData: { rate: number }[];
}

const RateCard = ({ commodity, rate, unit, changeDay, changeWeek, sparkData }: RateCardProps) => {
  const { fmt } = usePersona();
  return (
    <div className="bg-[#1A1D21] border border-white/5 p-6 space-y-6 group hover:border-[#C5A059]/30 transition-all">
       <div className="flex justify-between items-start">
          <div>
             <h3 className="text-sm font-black uppercase text-white tracking-tight">{commodity}</h3>
             <p className="text-[9px] uppercase font-bold text-gray-600 tracking-widest mt-0.5">Primary Mandi Market</p>
          </div>
          <div className="p-2 bg-white/5 text-gray-500 rounded-sm group-hover:text-[#C5A059] transition-colors">
             <BarChart2 size={16} />
          </div>
       </div>

       <div className="flex items-baseline space-x-2">
          <h4 className="text-3xl font-mono font-black text-[#C5A059] tracking-tighter">{fmt(rate)}</h4>
          <span className="text-[10px] font-black uppercase text-gray-600">/ {unit}</span>
       </div>

       <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
          <div>
             <p className="text-[8px] uppercase font-black text-gray-700 mb-1">Vs Yesterday</p>
             <div className={cn(
               "flex items-center space-x-1 text-[10px] font-black font-mono",
               changeDay >= 0 ? "text-emerald-500" : "text-red-500"
             )}>
                {changeDay >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                <span>{Math.abs(changeDay).toFixed(1)}%</span>
             </div>
          </div>
          <div>
             <p className="text-[8px] uppercase font-black text-gray-700 mb-1">Vs Last Week</p>
             <div className={cn(
               "flex items-center space-x-1 text-[10px] font-black font-mono",
               changeWeek >= 0 ? "text-emerald-500" : "text-red-500"
             )}>
                {changeWeek >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                <span>{Math.abs(changeWeek).toFixed(1)}%</span>
             </div>
          </div>
       </div>

       <div className="h-12 w-full mt-4 opacity-30 group-hover:opacity-100 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
             <LineChart data={sparkData}>
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke={changeDay >= 0 ? "#10B981" : "#EF4444"} 
                  strokeWidth={2} 
                  dot={false} 
                />
             </LineChart>
          </ResponsiveContainer>
       </div>
    </div>
  );
};

// --- Page Component ---

export default function MandiRateTrackerPage() {
  const { businessId, fmt } = usePersona();
  const supabase = createClient();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Queries
  const { data: rates, isLoading } = useQuery<MandiRate[]>({
    queryKey: ['mandi_rates_registry', businessId, selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mandi_rates')
        .select('*')
        .eq('business_id', businessId)
        .order('rate_date', { ascending: false });
      if (error) return [];
      return (data as MandiRate[]) || [];
    },
    enabled: !!businessId
  });

  // Logic
  const processed = useMemo(() => {
    if (!rates) return { cards: [], history: [] };
    
    const commodities = Array.from(new Set(rates.map((r: MandiRate) => r.commodity)));
    const uniqueCards: MandiCard[] = commodities.map(name => {
      const commRates = rates.filter((r: MandiRate) => r.commodity === name).sort((a: MandiRate, b: MandiRate) => new Date(b.rate_date).getTime() - new Date(a.rate_date).getTime());
      const current = commRates[0];
      const prev = commRates[1];
      const lastWeek = commRates.find((r: MandiRate) => new Date(r.rate_date) <= new Date(new Date(current.rate_date).getTime() - 7 * 24 * 60 * 60 * 1000));

      const changeDay = prev ? ((current.rate_per_unit - prev.rate_per_unit) / prev.rate_per_unit) * 100 : 0;
      const changeWeek = lastWeek ? ((current.rate_per_unit - lastWeek.rate_per_unit) / lastWeek.rate_per_unit) * 100 : 0;
      
      const sparkData = commRates.slice(0, 7).reverse().map((r: MandiRate) => ({ rate: Number(r.rate_per_unit) }));

      return {
        name,
        current: current.rate_per_unit,
        unit: current.unit,
        changeDay,
        changeWeek,
        sparkData
      };
    });

    return { cards: uniqueCards, history: rates };
  }, [rates]);

  if (isLoading) return (
    <div className="min-h-screen bg-[#0F1113] flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.5em] text-gray-700 animate-pulse">
      Intercepting Market Price Feeds...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter">
      
      
      <main className="transition-all duration-300 min-h-screen flex flex-col pb-20">
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
           <div className="flex items-center space-x-3">
              <Activity size={18} className="text-[#C5A059]" />
              <h1 className="text-[10px] uppercase font-black tracking-[0.4em] text-white">Market Intel / Mandi Rates</h1>
           </div>
           
           <div className="ml-auto flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-black/40 border border-white/5 px-4 py-1.5 rounded-sm">
                 <Calendar size={14} className="text-[#C5A059]" />
                 <input 
                   type="date" 
                   value={selectedDate}
                   onChange={(e) => setSelectedDate(e.target.value)}
                   className="bg-transparent text-[10px] font-black uppercase tracking-widest text-white outline-none"
                 />
              </div>
              <button className="flex items-center space-x-2 bg-[#C5A059] hover:brightness-110 text-black px-6 py-1.5 text-[10px] uppercase font-black tracking-widest transition-all shadow-lg shadow-amber-500/10">
                 <Plus size={12} />
                 <span>Log Today&apos;s Rate</span>
              </button>
           </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">
           {/* RATE CARDS GRID */}
           <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {processed.cards.length > 0 ? processed.cards.map((item: MandiCard) => (
                <RateCard 
                  key={item.name}
                  commodity={item.name}
                  rate={item.current}
                  unit={item.unit}
                  changeDay={item.changeDay}
                  changeWeek={item.changeWeek}
                  sparkData={item.sparkData}
                />
              )) : (
                <div className="col-span-full bg-[#1A1D21] border border-dashed border-white/5 p-20 flex flex-col items-center justify-center opacity-30 text-center">
                   <Tag size={48} strokeWidth={1} />
                   <p className="text-[10px] uppercase font-black tracking-[0.3em] mt-4">No commodity price data tracked</p>
                </div>
              )}
           </section>

           {/* RATE HISTORY TABLE */}
           <div className="bg-[#1A1D21] border border-white/5 flex flex-col">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                 <h3 className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Chronological Price Diary</h3>
                 <div className="flex items-center space-x-2">
                    <Clock size={14} className="text-gray-700" />
                    <span className="text-[9px] uppercase font-black text-gray-700 tracking-widest">Data stream latency: 0ms</span>
                 </div>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="text-[9px] uppercase font-black text-gray-600 tracking-[0.2em] border-b border-white/5">
                          <th className="p-4">Date</th>
                          <th className="p-4">Commodity</th>
                          <th className="p-4">Market Origin</th>
                          <th className="p-4 text-right">Price per Unit</th>
                          <th className="p-4">Unit</th>
                          <th className="p-4 text-right">Trend Change</th>
                          <th className="p-4">Remarks</th>
                       </tr>
                    </thead>
                    <tbody className="text-[11px]">
                       {processed.history.length > 0 ? processed.history.map((rate: MandiRate, i: number) => {
                         const prev = processed.history.slice(i+1).find((r: MandiRate) => r.commodity === rate.commodity);
                         const change = prev ? ((rate.rate_per_unit - prev.rate_per_unit) / prev.rate_per_unit) * 100 : null;

                         return (
                           <tr key={rate.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors">
                              <td className="p-4 text-gray-400 font-mono">{rate.rate_date}</td>
                              <td className="p-4 font-bold text-white uppercase tracking-tight">{rate.commodity}</td>
                              <td className="p-4">
                                 <div className="flex items-center space-x-2 text-gray-500">
                                    <MapPin size={10} />
                                    <span className="uppercase tracking-widest text-[9px] font-bold">{rate.market_name}</span>
                                 </div>
                              </td>
                              <td className="p-4 text-right font-mono font-black text-[#C5A059]">{fmt(rate.rate_per_unit)}</td>
                              <td className="p-4 text-gray-500 uppercase font-bold text-[9px] tracking-widest">{rate.unit}</td>
                              <td className="p-4 text-right">
                                 {change !== null ? (
                                   <div className={cn(
                                     "flex items-center justify-end space-x-1 font-mono font-bold",
                                     change >= 0 ? "text-emerald-500" : "text-red-500"
                                   )}>
                                      <span>{change >= 0 ? '+' : ''}{change.toFixed(1)}%</span>
                                   </div>
                                 ) : <span className="text-gray-800">BASE</span>}
                              </td>
                              <td className="p-4 text-gray-600 italic truncate max-w-[200px]">{rate.notes || '—'}</td>
                           </tr>
                         );
                       }) : (
                         <tr>
                            <td colSpan={7} className="p-20 text-center text-gray-700 italic uppercase font-black text-[9px] tracking-widest">No historical rate records</td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>

           <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-sm">
              <div className="flex items-start space-x-4">
                 <div className="p-2 bg-amber-500/10 text-amber-500"><Info size={16} /></div>
                 <div>
                    <p className="text-[10px] uppercase font-black text-amber-500 tracking-widest mb-1">Price Intel Disclaimer</p>
                    <p className="text-xs text-amber-500/70 leading-relaxed italic">
                       Rates displayed are user-logged market benchmarks for the Pakistan commodity market. These serve as a price diary for trading decisions and do not represent guaranteed real-time market quotes.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
