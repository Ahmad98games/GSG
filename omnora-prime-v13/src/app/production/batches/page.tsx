"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Layers, Plus, Search, Filter,
  Play, Pause, CheckCircle2,
  AlertTriangle, Hammer, ArrowRight,
  TrendingUp, BarChart3, Clock
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";

import { useSidebarState } from "@/hooks/useSidebarState";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";

export default function ProductionBatchesPage() {
  const { isCollapsed } = useSidebarState();
  const { fmt, t, businessId } = usePersona();
  const supabase = createClient();
  
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['production_batches', businessId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('production_batches')
        .select('*, sku:skus(name, unit)')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!businessId
  });

  const filteredBatches = batches.filter((b: any) => 
    b.batch_no.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.sku?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter">
      
      
      <main className={cn( "transition-all duration-300 min-h-screen flex flex-col")}>
        <header className="h-20 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex flex-col">
            <h1 className="text-xl font-black uppercase tracking-tighter text-white">
              Batch Registry
            </h1>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">Manufacturing Cycle Control</p>
          </div>

          <div className="ml-auto flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-6 py-2.5 bg-[#C5A059] text-black text-[10px] uppercase tracking-widest font-black hover:brightness-110 shadow-lg transition-all">
               <Plus size={14} />
               <span>New Production Batch</span>
            </button>
          </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">
           {/* FILTERS */}
           <div className="flex items-center justify-between bg-[#1A1D21] border border-white/5 p-4">
              <div className="flex items-center space-x-6">
                 <div className="relative w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Search Batch ID or SKU..." 
                      className="w-full bg-[#0F1113] border border-white/10 pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-[#0070F3]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <div className="flex items-center space-x-2">
                    {['all', 'open', 'in_progress', 'completed'].map(status => (
                       <button 
                         key={status} 
                         onClick={() => setStatusFilter(status)}
                         className={cn(
                           "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-all",
                           statusFilter === status ? "bg-white text-black border-white" : "bg-white/5 text-gray-500 border-white/5 hover:border-white/10"
                         )}
                       >
                          {status}
                       </button>
                    ))}
                 </div>
              </div>
              <div className="flex items-center space-x-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                 <Clock size={14} />
                 <span>Syncing Local Mesh...</span>
              </div>
           </div>

           {/* BATCH GRID */}
           {isLoading ? (
             <div className="py-20 text-center font-mono text-[10px] uppercase tracking-[0.5em] text-gray-800 animate-pulse">Scanning Active Cycles...</div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBatches.map((batch: any) => (
                   <BatchCard key={batch.id} batch={batch} fmt={fmt} />
                ))}
             </div>
           )}
        </div>
      </main>
    </div>
  );
}

function BatchCard({ batch, fmt }: any) {
  const progress = Math.min(100, Math.round((batch.actual_qty || 0) / batch.planned_qty * 100));

  return (
    <div className="bg-[#1A1D21] border border-white/5 p-8 space-y-8 group hover:border-[#0070F3]/30 transition-all relative overflow-hidden">
       {/* Background Accent */}
       <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/5 rotate-45 group-hover:bg-[#0070F3]/5 transition-all" />

       <div className="flex justify-between items-start">
          <div className="space-y-1">
             <span className="text-[9px] font-black uppercase text-[#0070F3] tracking-widest bg-[#0070F3]/10 px-2 py-0.5">Batch {batch.batch_no}</span>
             <h3 className="text-xl font-black uppercase tracking-tighter text-white group-hover:text-[#0070F3] transition-colors">{batch.sku?.name}</h3>
          </div>
          <StatusBadge status={batch.status} />
       </div>

       <div className="grid grid-cols-2 gap-8">
          <div className="space-y-1">
             <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Planned Qty</p>
             <p className="text-2xl font-black font-mono text-white tracking-tighter">{batch.planned_qty} <span className="text-xs text-gray-600 ml-1">{batch.sku?.unit}</span></p>
          </div>
          <div className="space-y-1">
             <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Actual Output</p>
             <p className="text-2xl font-black font-mono text-emerald-500 tracking-tighter">{batch.actual_qty || 0}</p>
          </div>
       </div>

       <div className="space-y-3">
          <div className="flex justify-between text-[9px] font-black uppercase text-gray-500">
             <span>Cycle Progress</span>
             <span>{progress}% Complete</span>
          </div>
          <div className="h-1.5 bg-white/5 w-full">
             <div 
               className="h-full bg-[#0070F3] transition-all duration-1000 shadow-[0_0_15px_rgba(0,112,243,0.3)]" 
               style={{ width: `${progress}%` }} 
             />
          </div>
       </div>

       <div className="flex items-center justify-between pt-6 border-t border-white/5">
          <div className="flex items-center space-x-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
             <Clock size={12} />
             <span>Started {format(new Date(batch.created_at), 'MMM dd, yyyy')}</span>
          </div>
          <Link href={`/production/batches/${batch.id}/costing`}>
             <button className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059] hover:text-white transition-all">
                <span>Analyze Costs</span>
                <ArrowRight size={14} />
             </button>
          </Link>
       </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    open: "bg-blue-500",
    in_progress: "bg-[#0070F3]",
    paused: "bg-amber-500",
    completed: "bg-emerald-500",
    cancelled: "bg-red-500"
  };
  return (
    <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]", configs[status])} />
  );
}
