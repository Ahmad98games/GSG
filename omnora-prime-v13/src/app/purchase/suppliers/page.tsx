"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";
import { 
  ScatterChart, Scatter, XAxis, YAxis, 
  ZAxis, Tooltip, ResponsiveContainer, 
  Cell, ReferenceLine, Label
} from "recharts";
import { 
  Users, TrendingUp, AlertTriangle, 
  Search, Filter, ExternalLink, ShieldCheck,
  Star, Award, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function SupplierScorecardPage() {
  const { t, fmt, businessId } = usePersona();
  const router = useRouter();
  const supabase = createClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: suppliers = [], isLoading: sLoading } = useQuery({
    queryKey: ['suppliers_list', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .in('party_type', ['supplier', 'both']);
      if (error) throw error;
      return data;
    },
    enabled: !!businessId
  });

  const { data: scorecards = [], isLoading: scLoading } = useQuery({
    queryKey: ['supplier_scores_intelligent', businessId, suppliers.length],
    queryFn: async () => {
      const scores = await Promise.all(suppliers.map(async (s: any) => {
        const { data, error } = await supabase.rpc('get_supplier_scorecard', {
          p_business_id: businessId,
          p_supplier_id: s.id
        });
        if (error) return { ...s, score_data: { grade: 'N/A', score: 0 } };
        return { ...s, score_data: data };
      }));
      return scores.sort((a, b) => (b.score_data.score || 0) - (a.score_data.score || 0));
    },
    enabled: suppliers.length > 0
  });

  const chartData = useMemo(() => {
    return scorecards?.map((s: any) => ({
      name: s.name,
      x: Number(s.score_data.on_time_rate || 0),
      y: Number(s.score_data.avg_lead_days || 0),
      z: (s.score_data.score || 0) * 2,
      id: s.id
    })) || [];
  }, [scorecards]);

  if (sLoading || scLoading) return <div className="min-h-screen bg-[#0F1113] flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.5em] text-gray-700 animate-pulse">Analyzing Supplier Network Integrity...</div>;

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-12 bg-[#0F1113] min-h-screen text-slate-200">
      <header className="flex items-center justify-between mb-12 border-b border-white/5 pb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-500/10 rounded-sm">
            <Users className="text-blue-500" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Supplier Intelligence Hub</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">Performance Analytics • Noxis Industrial v13.0</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-8 bg-[#1A1D21] border border-white/5 p-8 relative min-h-[500px]">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-black">Reliability Matrix (On-Time vs Lead Time)</h3>
             <div className="flex items-center space-x-2 text-[9px] font-black uppercase text-emerald-500">
                <ShieldCheck size={12} />
                <span>Verification Active</span>
             </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="On-Time Rate" 
                  unit="%" 
                  domain={[0, 100]} 
                  stroke="#374151" 
                  tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 'bold' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Avg Lead Days" 
                  unit="d" 
                  domain={[0, 30]} 
                  stroke="#374151"
                  tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 'bold' }}
                />
                <ZAxis type="number" dataKey="z" range={[50, 400]} name="Score" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#0F1113] border border-white/10 p-4 shadow-2xl space-y-2">
                          <p className="text-xs font-black text-white uppercase tracking-tight border-b border-white/5 pb-2">{data.name}</p>
                          <p className="text-[9px] text-gray-500 uppercase font-black">On-Time: <span className="text-emerald-500">{data.x}%</span></p>
                          <p className="text-[9px] text-gray-500 uppercase font-black">Lead Time: <span className="text-blue-400">{data.y} Days</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine x={80} stroke="#374151" strokeDasharray="3 3" />
                <ReferenceLine y={10} stroke="#374151" strokeDasharray="3 3" />
                <Scatter name="Suppliers" data={chartData} onClick={(data: any) => router.push(`/parties/${data.id}`)}>
                  {chartData.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.x >= 80 && entry.y <= 10 ? '#10B981' : entry.x < 80 ? '#EF4444' : '#0070F3'} 
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Intelligence Side Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#1A1D21] border border-white/5 p-8 space-y-6">
            <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Reliability Benchmarks</h3>
            <div className="space-y-4">
               <BenchmarkRow label="Network Average Score" value="72.4" />
               <BenchmarkRow label="On-Time Compliance" value="84.1%" />
               <BenchmarkRow label="Critical Risk Entities" value="2" />
            </div>
          </div>

          <div className="p-8 bg-blue-500/5 border border-blue-500/10 space-y-4">
             <div className="flex items-center space-x-2 text-blue-500">
                <Info size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Decision Matrix</span>
             </div>
             <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-bold">
                Scores are recalculated every 24 hours based on Goods Received Notes (GRN) vs Purchase Order expected dates.
             </p>
          </div>
        </div>
      </div>

      <section className="bg-[#1A1D21] border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
          <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Comprehensive Reliability Ranking</h3>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700" />
            <input 
              className="bg-[#0F1113] border border-white/10 pl-10 pr-4 py-2 text-[10px] text-white uppercase font-bold tracking-widest outline-none focus:border-blue-500 w-64"
              placeholder="Search registry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#0F1113] border-b border-white/5 text-[9px] uppercase font-black text-gray-600 tracking-[0.2em]">
              <th className="px-6 py-5">Supplier Entity</th>
              <th className="px-6 py-5 text-center">Score Card</th>
              <th className="px-6 py-5 text-center">On-Time %</th>
              <th className="px-6 py-5 text-center">Lead Days</th>
              <th className="px-6 py-5 text-center">Volume</th>
              <th className="px-6 py-5 text-right">Protocol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {scorecards
              .filter((s: any) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((s: any) => (
              <tr key={s.id} className="hover:bg-white/[0.01] transition-colors group">
                <td className="px-6 py-6">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white uppercase tracking-tight">{s.name}</span>
                    <span className="text-[9px] text-gray-600 font-bold tracking-widest mt-1 uppercase">{s.party_type}</span>
                  </div>
                </td>
                <td className="px-6 py-6 text-center">
                   <div className="flex flex-col items-center group/tooltip relative">
                      <GradeBadge grade={s.score_data.grade} />
                      <span className="text-[11px] font-black font-mono text-white mt-1">{s.score_data.score}</span>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#0F1113] border border-white/10 p-4 opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50 pointer-events-none shadow-2xl">
                         <div className="space-y-2">
                            <TooltipRow label="On-Time Rate" value={`${s.score_data.on_time_rate}%`} />
                            <TooltipRow label="Avg Lead Days" value={`${s.score_data.avg_lead_days}d`} />
                            <TooltipRow label="Total Orders" value={s.score_data.total_orders} />
                         </div>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-6 text-center">
                  <span className={cn(
                    "text-xs font-mono font-black",
                    s.score_data.on_time_rate >= 90 ? "text-emerald-500" : s.score_data.on_time_rate >= 70 ? "text-blue-400" : "text-red-500"
                  )}>
                    {s.score_data.on_time_rate}%
                  </span>
                </td>
                <td className="px-6 py-6 text-center">
                  <span className="text-xs font-mono font-bold text-gray-500">{s.score_data.avg_lead_days} Days</span>
                </td>
                <td className="px-6 py-6 text-center">
                  <span className="text-xs font-mono font-bold text-gray-400">{s.score_data.total_orders}</span>
                </td>
                <td className="px-6 py-6 text-right">
                  <button 
                    onClick={() => router.push(`/parties/${s.id}`)}
                    className="text-gray-700 hover:text-white transition-colors p-2 bg-white/5 hover:bg-white/10"
                  >
                    <ExternalLink size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const configs: any = {
    'A': "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    'B': "bg-blue-500/10 text-blue-500 border-blue-500/20",
    'C': "bg-amber-500/10 text-amber-500 border-amber-500/20",
    'D': "bg-red-500/10 text-red-500 border-red-500/20",
    'N/A': "bg-white/5 text-gray-500 border-white/5"
  };
  return (
    <span className={cn("px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] border rounded-sm", configs[grade] || configs['N/A'])}>
      {grade}
    </span>
  );
}

function BenchmarkRow({ label, value }: any) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
       <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{label}</span>
       <span className="text-xs font-black font-mono text-white">{value}</span>
    </div>
  );
}

function TooltipRow({ label, value }: any) {
  return (
    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
       <span className="text-gray-500">{label}:</span>
       <span className="text-white">{value}</span>
    </div>
  );
}
