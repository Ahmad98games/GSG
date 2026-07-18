"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Package, Plus, Search, Filter, 
  ArrowRight, CheckCircle2, XCircle, 
  Clock, Share2, TrendingUp,
  RotateCcw, AlertTriangle, MoreVertical,
  ExternalLink, Calendar, Users, Info
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";

import { cn } from "@/lib/utils";
import Decimal from "decimal.js";

// --- Components ---

const Badge = ({ children, variant = "default" }: any) => {
  const styles: any = {
    default: "bg-white/5 text-gray-400 border border-white/10",
    emerald: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    red: "bg-red-500/10 text-red-500 border border-red-500/20",
    blue: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    darkRed: "bg-red-900/20 text-red-700 border border-red-900/30"
  };
  return (
    <span className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-[2px]", styles[variant])}>
      {children}
    </span>
  );
};

// --- Page Component ---

export default function SamplesTrackerPage() {
  const { businessId } = usePersona();
  const supabase = createClient();
  
  const [searchTerm, setSearchTerm] = useState("");

  // Queries
  const { data: samples, isLoading } = useQuery({
    queryKey: ['samples_registry', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('samples')
        .select('*, party:parties(name), items:sample_items(count)')
        .eq('business_id', businessId)
        .order('sent_date', { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: !!businessId
  });

  // Logic
  const filteredSamples = useMemo(() => {
    if (!samples) return [];
    return samples.filter((s: any) => 
      s.sample_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.party?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [samples, searchTerm]);

  const stats = useMemo(() => {
    if (!samples || samples.length === 0) return { sent: 0, returned: 0, converted: 0, rate: 0 };
    const sent = samples.filter((s: any) => s.status === 'sent').length;
    const returned = samples.filter((s: any) => s.status === 'returned').length;
    const converted = samples.filter((s: any) => s.status === 'order_placed').length;
    const rate = (converted / samples.length) * 100;
    return { sent, returned, converted, rate: rate.toFixed(1) };
  }, [samples]);

  if (isLoading) return (
    <div className="min-h-screen bg-[#0F1113] flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.5em] text-gray-700 animate-pulse">
      Profiling Sample Distribution...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter">
      
      
      <main className="transition-all duration-300 min-h-screen flex flex-col pb-20">
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
           <div className="flex items-center space-x-3">
              <Share2 size={18} className="text-[#EC4899]" />
              <h1 className="text-[10px] uppercase font-black tracking-[0.4em] text-white">Registry / Samples Tracker</h1>
           </div>
           
           <div className="ml-auto flex items-center space-x-4">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                 <input 
                   type="text" 
                   placeholder="Search samples..." 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="bg-black/40 border border-white/10 pl-10 pr-4 py-1.5 text-[10px] uppercase font-bold tracking-widest text-white w-[250px] focus:border-[#EC4899]/50 outline-none transition-all placeholder:text-gray-700"
                 />
              </div>
              <button className="flex items-center space-x-2 bg-[#EC4899] hover:brightness-110 text-white px-6 py-1.5 text-[10px] uppercase font-black tracking-widest transition-all shadow-lg shadow-pink-500/10">
                 <Plus size={12} />
                 <span>Log Sample</span>
              </button>
           </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">
           {/* SUMMARY ROW */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#1A1D21] border border-white/5 p-5 flex flex-col justify-between group">
                 <div className="flex justify-between items-start">
                    <p className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Active (Sent)</p>
                    <Clock size={14} className="text-blue-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                 </div>
                 <h4 className="text-2xl font-mono font-black text-white mt-2">{stats.sent}</h4>
              </div>
              <div className="bg-[#1A1D21] border border-white/5 p-5 flex flex-col justify-between group">
                 <div className="flex justify-between items-start">
                    <p className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Returned</p>
                    <RotateCcw size={14} className="text-gray-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                 </div>
                 <h4 className="text-2xl font-mono font-black text-white mt-2">{stats.returned}</h4>
              </div>
              <div className="bg-[#1A1D21] border border-white/5 p-5 flex flex-col justify-between group">
                 <div className="flex justify-between items-start">
                    <p className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Orders Won</p>
                    <CheckCircle2 size={14} className="text-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                 </div>
                 <h4 className="text-2xl font-mono font-black text-emerald-500 mt-2">{stats.converted}</h4>
              </div>
              <div className="bg-[#EC4899]/5 border border-[#EC4899]/10 p-5 flex flex-col justify-between">
                 <div className="flex justify-between items-start">
                    <p className="text-[9px] uppercase font-black text-[#EC4899] tracking-widest">Conversion Rate</p>
                    <TrendingUp size={14} className="text-[#EC4899]" />
                 </div>
                 <div className="flex items-baseline space-x-2 mt-2">
                    <h4 className="text-3xl font-mono font-black text-white">{stats.rate}%</h4>
                    <span className="text-[8px] font-bold text-gray-600 uppercase">Sample to order</span>
                 </div>
              </div>
           </div>

           {/* SAMPLES TABLE */}
           <div className="bg-[#1A1D21] border border-white/5 flex flex-col">
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="text-[9px] uppercase font-black text-gray-600 tracking-[0.2em] border-b border-white/5">
                          <th className="p-4">Sample ID</th>
                          <th className="p-4">Customer Identity</th>
                          <th className="p-4">Asset Matrix</th>
                          <th className="p-4">Dispatch Date</th>
                          <th className="p-4">Expected Return</th>
                          <th className="p-4">Status / Outcome</th>
                          <th className="p-4 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="text-[11px]">
                       {filteredSamples.length > 0 ? filteredSamples.map((s: any) => (
                         <tr key={s.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors group">
                            <td className="p-4">
                               <span className="text-[#EC4899] font-mono font-bold uppercase">{s.sample_number}</span>
                            </td>
                            <td className="p-4">
                               <p className="font-bold text-white uppercase tracking-tight">{s.party?.name || 'Potential Lead'}</p>
                            </td>
                            <td className="p-4">
                               <Badge>{s.items?.[0]?.count || 0} SKUs</Badge>
                            </td>
                            <td className="p-4 text-gray-400 font-mono">{s.sent_date}</td>
                            <td className="p-4 text-gray-500 font-mono italic">{s.return_expected || '—'}</td>
                            <td className="p-4">
                               <Badge variant={
                                 s.status === 'order_placed' ? 'emerald' : 
                                 s.status === 'returned' ? 'blue' :
                                 s.status === 'rejected' ? 'red' :
                                 s.status === 'lost' ? 'darkRed' : 'amber'
                               }>
                                  {s.status.replace('_', ' ')}
                               </Badge>
                            </td>
                            <td className="p-4 text-right">
                               <div className="flex items-center justify-end space-x-2">
                                  <button className="p-1.5 hover:bg-white/5 text-gray-700 hover:text-white transition-colors rounded-sm">
                                     <ExternalLink size={14} />
                                  </button>
                                  <button className="p-1.5 hover:bg-white/5 text-gray-700 hover:text-white transition-colors rounded-sm">
                                     <MoreVertical size={14} />
                                  </button>
                               </div>
                            </td>
                         </tr>
                       )) : (
                         <tr>
                            <td colSpan={7} className="p-20 text-center">
                               <div className="flex flex-col items-center opacity-20">
                                  <Package size={48} strokeWidth={1} />
                                  <p className="text-[10px] uppercase font-black tracking-widest mt-4">No sample vectors in circulation</p>
                               </div>
                            </td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
           
           <div className="p-6 bg-pink-500/5 border border-pink-500/10 rounded-sm">
              <div className="flex items-start space-x-4">
                 <div className="p-2 bg-pink-500/10 text-pink-500"><Info size={16} /></div>
                 <div>
                    <p className="text-[10px] uppercase font-black text-pink-500 tracking-widest mb-1">Industrial Intelligence</p>
                    <p className="text-xs text-pink-500/70 leading-relaxed italic">
                       Samples converted into actual Sales Orders are marked as "Emerald Outcomes". This data node directly impacts your "Authority Score" by showing high market acceptance of your product matrix.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
