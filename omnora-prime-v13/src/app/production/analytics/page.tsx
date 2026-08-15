"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, TrendingUp, TrendingDown, 
  BarChart3, Download, Search,
  Zap, ShieldCheck, User,
  Award, Star, Filter,
  FileText, Hammer, ChevronRight
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";

import { useSidebarState } from "@/hooks/useSidebarState";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";

export default function WorkforceIntelligencePage() {
  const { isCollapsed } = useSidebarState();
  const { fmt, t, businessId, workerTerm, workerTermPlural } = usePersona();
  const supabase = createClient();
  

  const [activeDept, setActiveDept] = useState('all');
  const [dateRange] = useState({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });

  const { data: rankings = [], isLoading } = useQuery({
    queryKey: ['karigar_rankings', businessId, dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_karigar_efficiency_ranking', {
        p_business_id: businessId,
        p_from: dateRange.from,
        p_to: dateRange.to
      });
      if (error) throw error;
      return data;
    },
    enabled: !!businessId
  });

  const filteredRankings = useMemo(() => 
    activeDept === 'all' ? rankings : rankings.filter((r: any) => r.department === activeDept),
  [rankings, activeDept]);

  const insights = useMemo(() => {
    if (rankings.length === 0) return null;
    const topPerformer = [...rankings].sort((a,b) => b.total_units - a.total_units)[0];
    const topQuality = [...rankings].sort((a,b) => b.quality_score - a.quality_score)[0];
    
    const avgEff = rankings.reduce((acc: number, r: any) => acc + Number(r.efficiency_score), 0) / rankings.length;
    
    return { topPerformer, topQuality, avgEff };
  }, [rankings]);

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter">
      
      
      <main className={cn( "transition-all duration-300 min-h-screen flex flex-col")}>
        <header className="h-20 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex flex-col">
            <h1 className="text-xl font-black uppercase tracking-tighter text-white">
              Workforce Intelligence
            </h1>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">Efficiency Leaderboard • Analytics Engine</p>
          </div>

          <div className="ml-auto flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-6 py-2.5 bg-white/5 text-gray-400 text-[10px] uppercase tracking-widest font-black hover:text-white transition-all">
               <Download size={14} />
               <span>Export PDF Report</span>
            </button>
          </div>
        </header>

        <div className="p-12 max-w-[1400px] mx-auto w-full space-y-12">
           {/* INSIGHT CARDS */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {insights && (
                 <>
                    <InsightCard 
                       label="Top Performer" 
                       name={insights.topPerformer.karigar_name} 
                       sub={`${insights.topPerformer.total_units} Units • ${insights.topPerformer.efficiency_score} u/hr`}
                       icon={Trophy}
                       color="text-yellow-500"
                    />
                    <InsightCard 
                       label="Highest Quality" 
                       name={insights.topQuality.karigar_name} 
                       sub={`${insights.topQuality.quality_score}% Grade A Consistency`}
                       icon={ShieldCheck}
                       color="text-emerald-500"
                    />
                    <InsightCard 
                       label="System Average Efficiency" 
                       name={`${insights.avgEff.toFixed(1)} Units/HR`} 
                       sub="Current Cycle Average"
                       icon={Zap}
                       color="text-[#0070F3]"
                    />
                 </>
              )}
           </div>

           {/* LEADERBOARD SECTION */}
           <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                 <div className="flex space-x-2">
                    {['all', 'cutting', 'stitching', 'finishing', 'packing'].map(dept => (
                       <button 
                         key={dept} 
                         onClick={() => setActiveDept(dept)}
                         className={cn(
                           "px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                           activeDept === dept ? "bg-[#0070F3] text-white" : "bg-white/5 text-gray-500 hover:text-white"
                         )}
                       >
                          {dept}
                       </button>
                    ))}
                 </div>
                 <div className="flex items-center space-x-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <Filter size={14} />
                    <span>Last 30 Days</span>
                 </div>
              </div>

              {isLoading ? (
                <div className="py-20 text-center font-mono text-[10px] uppercase tracking-[0.5em] text-gray-800 animate-pulse">Syncing Leaderboard Context...</div>
              ) : (
                <div className="space-y-4">
                   {filteredRankings.map((rank: any, idx: number) => (
                      <RankRow 
                         key={rank.karigar_id} 
                         rank={rank} 
                         position={idx + 1}
                      />
                   ))}
                </div>
              )}
           </div>
        </div>
      </main>
    </div>
  );
}

function InsightCard({ label, name, sub, icon: Icon, color }: any) {
  return (
    <div className="bg-[#1A1D21] border border-white/5 p-8 space-y-6 relative overflow-hidden group">
       <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Icon size={40} className={color} />
       </div>
       <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">{label}</p>
          <h4 className="text-xl font-black uppercase tracking-tight text-white">{name}</h4>
       </div>
       <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest leading-none">{sub}</p>
    </div>
  );
}

function RankRow({ rank, position }: any) {
  const getRankColor = (pos: number) => {
    if (pos === 1) return "text-yellow-500";
    if (pos === 2) return "text-slate-400";
    if (pos === 3) return "text-orange-400";
    return "text-gray-700";
  };

  const getQualityColor = (score: number) => {
     if (score >= 90) return "bg-emerald-500";
     if (score >= 70) return "bg-amber-500";
     return "bg-red-500";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: position * 0.05 }}
      className="bg-[#1A1D21] border border-white/5 p-6 flex items-center group hover:border-white/10 transition-all"
    >
       <div className={cn("w-16 text-3xl font-black font-mono tracking-tighter", getRankColor(position))}>
          #{position}
       </div>

       <div className="flex items-center space-x-4 w-64">
          <div className="w-10 h-10 bg-white/5 flex items-center justify-center text-gray-500">
             <User size={20} />
          </div>
          <div>
             <h4 className="text-xs font-black uppercase text-white">{rank.karigar_name}</h4>
             <p className="text-[9px] font-mono text-gray-600 font-bold">{rank.karigar_code}</p>
          </div>
       </div>

       <div className="flex-1 grid grid-cols-3 gap-8 items-center px-12">
          <div className="space-y-1">
             <p className="text-[8px] font-black uppercase text-gray-600 tracking-widest">Total Output</p>
             <p className="text-lg font-black font-mono text-white tracking-tighter">{rank.total_units}</p>
          </div>

          <div className="space-y-2">
             <div className="flex justify-between text-[8px] font-black uppercase text-gray-600">
                <span>Quality Score</span>
                <span>{rank.quality_score}%</span>
             </div>
             <div className="h-1 bg-white/5 w-full">
                <div className={cn("h-full transition-all duration-1000", getQualityColor(rank.quality_score))} style={{ width: `${rank.quality_score}%` }} />
             </div>
          </div>

          <div className="space-y-1 text-right">
             <p className="text-[8px] font-black uppercase text-gray-600 tracking-widest">Efficiency</p>
             <p className="text-lg font-black font-mono text-[#0070F3] tracking-tighter">{rank.efficiency_score} <span className="text-[10px] text-gray-600 ml-1">U/HR</span></p>
          </div>
       </div>

       <div className="flex items-center space-x-6 pl-12 border-l border-white/5">
          <div className="text-gray-800 flex flex-col items-center">
             <BarChart3 size={14} />
             <span className="text-[8px] font-black mt-1">REAL-TIME</span>
          </div>
          <button className="p-2 text-gray-700 hover:text-white transition-all">
             <ChevronRight size={20} />
          </button>
       </div>
    </motion.div>
  );
}
