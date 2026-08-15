"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, Plus, Search, Filter, 
  TrendingUp, TrendingDown, Info, 
  ArrowLeft, ChevronRight, DollarSign,
  PieChart as PieChartIcon, Layers,
  Users, Zap, Package, Target, AlertTriangle
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";

import { cn } from "@/lib/utils";
import Decimal from "decimal.js";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useParams, useRouter } from "next/navigation";

// --- Components ---

const CostSection = ({ title, icon: Icon, items, subtotal, colorClass }: any) => {
  const { fmt } = usePersona();
  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center space-x-2 text-gray-500">
             <Icon size={14} />
             <h3 className="text-[10px] uppercase font-black tracking-widest">{title}</h3>
          </div>
          <span className={cn("text-xs font-mono font-black", colorClass)}>{fmt(subtotal)}</span>
       </div>
       <div className="space-y-2">
          {items.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center text-[11px] group">
               <div className="flex flex-col">
                  <span className="text-white font-bold uppercase tracking-tight">{item.description}</span>
                  <span className="text-[9px] text-gray-600 font-mono">{item.qty} {item.unit} @ {fmt(item.rate)}</span>
               </div>
               <span className="text-gray-400 font-mono group-hover:text-white transition-colors">{fmt(item.amount)}</span>
            </div>
          ))}
          {items.length === 0 && <p className="text-[10px] text-gray-700 italic">No entries in this sector</p>}
       </div>
    </div>
  );
};

// --- Page Component ---

export default function BatchCostingPage() {
  const params = useParams();
  const router = useRouter();
  const { businessId, fmt } = usePersona();
  const supabase = createClient();
  
  const batchId = params.batchId as string;

  // Queries
  const { data: batch, isLoading: batchLoading } = useQuery({
    queryKey: ['production_batch', batchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_batches')
        .select('*, sku:skus(*)')
        .eq('id', batchId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  const { data: costItems, isLoading: costsLoading } = useQuery({
    queryKey: ['batch_cost_items', batchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batch_cost_items')
        .select('*')
        .eq('batch_id', batchId);
      if (error) return [];
      return data || [];
    },
    enabled: !!batchId
  });

  const { data: laborLogs } = useQuery({
    queryKey: ['batch_labor_logs', batchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('karigar_production_logs')
        .select('*, karigar:karigars(name)')
        .eq('batch_id', batchId);
      if (error) return [];
      return data || [];
    },
    enabled: !!batchId
  });

  // Logic
  const processed = useMemo(() => {
    if (!batch) return null;

    const rawMaterials = costItems?.filter((i: any) => i.category === 'Raw Material') || [];
    const labor = laborLogs?.map((l: any) => ({
      description: l.karigar?.name || 'Worker',
      qty: l.qty_produced,
      unit: l.unit || 'pcs',
      rate: l.effective_earning / l.qty_produced,
      amount: l.effective_earning,
      category: 'Labor'
    })) || [];
    const overhead = costItems?.filter((i: any) => i.category === 'Overhead') || [];

    const subRaw = rawMaterials.reduce((sum: number, i: any) => sum + Number(i.amount), 0);
    const subLabor = labor.reduce((sum: number, i: any) => sum + Number(i.amount), 0);
    const subOverhead = overhead.reduce((sum: number, i: any) => sum + Number(i.amount), 0);
    
    const totalCost = new Decimal(subRaw).plus(subLabor).plus(subOverhead);
    const units = new Decimal(batch.qty_produced || 1);
    const costPerUnit = totalCost.dividedBy(units);
    const salePrice = new Decimal(batch.sku?.sale_price || 0);
    const marginPerUnit = salePrice.minus(costPerUnit);
    const totalMargin = marginPerUnit.times(units);
    const marginPct = salePrice.isZero() ? 0 : marginPerUnit.dividedBy(salePrice).times(100);

    return {
      rawMaterials, labor, overhead,
      subRaw, subLabor, subOverhead,
      totalCost, costPerUnit, salePrice,
      marginPerUnit, totalMargin, marginPct,
      chartData: [
        { name: 'Raw Material', value: subRaw, color: '#0070F3' },
        { name: 'Labor', value: subLabor, color: '#F59E0B' },
        { name: 'Overhead', value: subOverhead, color: '#8B5CF6' }
      ]
    };
  }, [batch, costItems, laborLogs]);

  if (batchLoading) return (
    <div className="min-h-screen bg-[#0F1113] flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.5em] text-gray-700 animate-pulse">
      Calculating Batch Fiscal Mass...
    </div>
  );

  if (!batch) return (
    <div className="min-h-screen bg-[#0F1113] flex flex-col items-center justify-center space-y-4">
      <AlertTriangle className="text-red-500" size={48} />
      <h1 className="text-white uppercase font-black tracking-widest">Batch Registry Not Found</h1>
      <button onClick={() => router.back()} className="text-[10px] text-gray-500 hover:text-white uppercase font-black tracking-widest border border-white/10 px-6 py-2 transition-all">Back to Production</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter">
      
      
      <main className="transition-all duration-300 min-h-screen flex flex-col pb-20">
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
           <button onClick={() => router.back()} className="flex items-center space-x-2 text-gray-500 hover:text-white transition-colors mr-8 group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Batch Control</span>
           </button>
           <div className="h-4 w-px bg-white/10 mx-4" />
           <div className="flex flex-col">
              <h1 className="text-xs font-black uppercase tracking-widest text-white">{batch.batch_number}</h1>
              <p className="text-[8px] text-gray-500 font-black uppercase tracking-tighter mt-0.5">{batch.sku?.name}</p>
           </div>
           
           <div className="ml-auto flex items-center space-x-3">
              <Badge variant={batch.status === 'completed' ? 'emerald' : 'amber'}>{batch.status}</Badge>
              <button className="flex items-center space-x-2 bg-[#C5A059] hover:brightness-110 text-black px-6 py-1.5 text-[10px] uppercase font-black tracking-widest transition-all">
                 <Plus size={12} />
                 <span>Add Cost Item</span>
              </button>
           </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* LEFT: COST BREAKDOWN */}
           <section className="bg-[#1A1D21] border border-white/5 p-8 space-y-10">
              <div className="flex items-center space-x-3">
                 <Calculator size={18} className="text-[#C5A059]" />
                 <h2 className="text-[10px] uppercase font-black tracking-[0.3em] text-white">Batch Fiscal Breakdown</h2>
              </div>

              <div className="space-y-8">
                 <CostSection title="Raw Materials" icon={Package} items={processed?.rawMaterials || []} subtotal={processed?.subRaw} colorClass="text-blue-500" />
                 <CostSection title="Labor (Karigar)" icon={Users} items={processed?.labor || []} subtotal={processed?.subLabor} colorClass="text-amber-500" />
                 <CostSection title="Indirect Overhead" icon={Zap} items={processed?.overhead || []} subtotal={processed?.subOverhead} colorClass="text-purple-500" />
              </div>

              <div className="pt-8 border-t-2 border-black/20 space-y-6">
                 <div className="flex justify-between items-end">
                    <div>
                       <p className="text-[9px] uppercase font-black text-gray-600 tracking-widest mb-1">Cumulative Batch Cost</p>
                       <h4 className="text-4xl font-mono font-black text-[#C5A059] tracking-tighter">{fmt(new Decimal(processed?.totalCost || 0).toNumber())}</h4>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] uppercase font-black text-gray-600 tracking-widest mb-1">Cost Per Unit</p>
                       <h4 className="text-xl font-mono font-black text-white">{fmt(new Decimal(processed?.costPerUnit || 0).toNumber())}</h4>
                    </div>
                 </div>

                 <div className="grid grid-cols-3 gap-4">
                    <div className="bg-black/20 p-4 border border-white/5">
                       <p className="text-[8px] uppercase font-black text-gray-600 mb-1">Sale Price</p>
                       <p className="text-sm font-mono font-bold text-white">{fmt(new Decimal(processed?.salePrice || 0).toNumber())}</p>
                    </div>
                    <div className="bg-black/20 p-4 border border-white/5">
                       <p className="text-[8px] uppercase font-black text-gray-600 mb-1">Unit Margin</p>
                       <p className={cn(
                         "text-sm font-mono font-bold",
                         new Decimal(processed?.marginPerUnit || 0).gt(0) ? "text-emerald-500" : "text-red-500"
                       )}>{fmt(new Decimal(processed?.marginPerUnit || 0).toNumber())}</p>
                    </div>
                    <div className="bg-black/20 p-4 border border-white/5">
                       <p className="text-[8px] uppercase font-black text-gray-600 mb-1">Batch Margin</p>
                       <p className={cn(
                         "text-sm font-mono font-bold",
                         new Decimal(processed?.totalMargin || 0).gt(0) ? "text-emerald-500" : "text-red-500"
                       )}>{fmt(new Decimal(processed?.totalMargin || 0).toNumber())}</p>
                    </div>
                 </div>
              </div>
           </section>

           {/* RIGHT: ANALYTICS */}
           <section className="space-y-8">
              <div className="bg-[#1A1D21] border border-white/5 p-8 h-[400px] flex flex-col">
                 <div className="flex items-center space-x-3 mb-8">
                    <PieChartIcon size={18} className="text-blue-500" />
                    <h2 className="text-[10px] uppercase font-black tracking-[0.3em] text-white">Cost Distribution</h2>
                 </div>
                 <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie
                            data={processed?.chartData}
                            innerRadius={80}
                            outerRadius={110}
                            paddingAngle={5}
                            dataKey="value"
                          >
                             {processed?.chartData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                             ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1A1D21', border: '1px solid rgba(255,255,255,0.05)', fontSize: '10px' }}
                            formatter={(val: any) => fmt(val)}
                          />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="flex justify-center space-x-6 mt-4">
                    {processed?.chartData.map((item) => (
                      <div key={item.name} className="flex items-center space-x-2">
                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                         <span className="text-[9px] uppercase font-black text-gray-500 tracking-widest">{item.name}</span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="bg-[#1A1D21] border border-white/5 p-8 space-y-6">
                 <div className="flex items-center space-x-3">
                    <Target size={18} className="text-emerald-500" />
                    <h2 className="text-[10px] uppercase font-black tracking-[0.3em] text-white">Profitability Analysis</h2>
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] uppercase font-black text-gray-600">Batch Margin Efficiency</span>
                       <span className={cn(
                         "text-xl font-mono font-black",
                         new Decimal(processed?.marginPct || 0).gt(20) ? "text-emerald-500" : "text-amber-500"
                       )}>{processed?.marginPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${Math.min(new Decimal(processed?.marginPct || 0).toNumber(), 100)}%` }}
                         className={cn(
                           "h-full",
                           new Decimal(processed?.marginPct || 0).gt(20) ? "bg-emerald-500" : "bg-amber-500"
                         )}
                       />
                    </div>
                 </div>

                 <div className="p-4 bg-white/[0.02] border border-white/5 space-y-4">
                    <p className="text-[10px] text-gray-500 italic leading-relaxed">
                       {new Decimal(processed?.marginPct || 0).gt(25) ? 
                         "High performance batch. Production efficiency is above industrial benchmarks for this SKU category." : 
                         "Standard performance. Review labor overheads to optimize unit profitability in future cycles."}
                    </p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button className="bg-white/5 hover:bg-white/10 border border-white/5 p-4 flex items-center justify-between group transition-all">
                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-500 group-hover:text-white">Audit Trail</span>
                    <ChevronRight size={14} className="text-gray-700 group-hover:translate-x-1 transition-transform" />
                 </button>
                 <button className="bg-white/5 hover:bg-white/10 border border-white/5 p-4 flex items-center justify-between group transition-all">
                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-500 group-hover:text-white">Export Summary</span>
                    <ChevronRight size={14} className="text-gray-700 group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>
           </section>
        </div>
      </main>
    </div>
  );
}

const Badge = ({ children, variant = "default" }: any) => {
  const styles: any = {
    default: "bg-white/5 text-gray-400 border border-white/10",
    emerald: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
  };
  return (
    <span className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-[2px]", styles[variant])}>
      {children}
    </span>
  );
};
