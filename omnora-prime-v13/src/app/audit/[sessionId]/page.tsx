"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, Barcode, CheckCircle2, 
  AlertCircle, Save, Loader2, Search,
  TrendingUp, TrendingDown, Package,
  History
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePersona } from "@/hooks/usePersona";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { humanizeError } from '@/lib/utils/errors';

export default function AuditSessionPage() {
  const { sessionId } = useParams();
  const { businessId, fmt } = usePersona();
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const toast = useToast();
  
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  // 1. Fetch Session Details
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['audit_session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  // 2. Fetch SKUs in Scope
  const { data: skus = [], isLoading: skusLoading } = useQuery({
    queryKey: ['audit_skus', sessionId, session?.scope],
    queryFn: async () => {
      let query = supabase.from('skus').select('*').eq('business_id', businessId);
      
      if (session?.scope === 'category') {
        query = query.in('category', session.scope_details);
      } else if (session?.scope === 'custom') {
        query = query.in('id', session.scope_details);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!session
  });

  // 3. Fetch Existing Counts
  const { data: existingCounts = [] } = useQuery({
    queryKey: ['audit_counts', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_counts')
        .select('*')
        .eq('session_id', sessionId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!session
  });

  // Initialize counts from existing data
  useEffect(() => {
    if (existingCounts.length > 0) {
      const initial: Record<string, number> = {};
      existingCounts.forEach((c: any) => {
        initial[c.sku_id] = c.physical_qty;
      });
      setCounts(prev => ({ ...initial, ...prev }));
    }
  }, [existingCounts]);

  // Barcode Scanner Listener
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      
      // Typical barcode scanners send characters rapidly
      if (currentTime - lastKeyTime > 100) {
        buffer = "";
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length > 2) {
          const sku = skus.find((s: any) => s.sku_code === buffer || s.barcode === buffer);
          if (sku) {
            setLastScanned(sku.sku_code);
            const input = document.getElementById(`count-${sku.id}`);
            input?.focus();
            (input as HTMLInputElement)?.select();
          }
          buffer = "";
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [skus]);

  const stats = useMemo(() => {
    const totalItems = skus.length;
    const scannedItems = Object.keys(counts).length;
    let totalVarianceValue = 0;

    skus.forEach((sku: any) => {
      const physical = counts[sku.id] ?? sku.stock_qty;
      const variance = physical - sku.stock_qty;
      totalVarianceValue += variance * (sku.cost_price || 0);
    });

    return { totalItems, scannedItems, totalVarianceValue };
  }, [skus, counts]);

  const filteredSkus = skus.filter((s: any) => 
    s.sku_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCountChange = (skuId: string, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setCounts(prev => ({ ...prev, [skuId]: num }));
    }
  };

  const handleFinalize = async () => {
    if (!confirm("Are you sure you want to finalize this audit? This will lock the session and may create stock adjustments.")) return;
    
    setIsFinalizing(true);
    try {
      // 1. Save all counts
      const countsToInsert = skus.map((sku: any) => ({
        session_id: sessionId,
        sku_id: sku.id,
        system_qty: sku.stock_qty,
        physical_qty: counts[sku.id] ?? sku.stock_qty,
        variance: (counts[sku.id] ?? sku.stock_qty) - sku.stock_qty,
        business_id: businessId
      }));

      const { error: countsError } = await supabase.from('audit_counts').upsert(countsToInsert, { onConflict: 'session_id,sku_id' });
      if (countsError) throw countsError;

      // 2. Mark session as finalized
      const { error: sessionError } = await supabase
        .from('audit_sessions')
        .update({ 
          status: 'finalized',
          finalized_at: new Date().toISOString(),
          total_variance_value: stats.totalVarianceValue
        })
        .eq('id', sessionId);
      if (sessionError) throw sessionError;

      // 3. Create stock adjustments if variance exists (Optional depending on business rules)
      // For now, we'll just navigate back
      router.push('/audit');
      toast.success('Audit session finalized successfully');
    } catch (err: any) {
      toast.error(humanizeError(err, 'finalize audit'));
    } finally {
      setIsFinalizing(false);
    }
  };

  if (sessionLoading || skusLoading) return <div className="p-20 text-center uppercase font-black text-gray-500 animate-pulse">Initializing Audit Engine...</div>;

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 p-6">
      <main className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => router.push('/audit')} className="p-2 hover:bg-white/5 rounded-sm transition-all">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black text-white uppercase tracking-tighter">{session?.label}</h1>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full">In Progress</span>
                <span className="text-[9px] font-bold text-gray-600 uppercase">Scope: {session?.scope}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
             <div className="flex items-center space-x-2 px-4 py-2 bg-black/40 border border-white/5 rounded-sm">
                <Barcode size={16} className="text-electric-blue" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Scanner Active</span>
             </div>
             <button 
               onClick={handleFinalize}
               disabled={isFinalizing}
               className="flex items-center space-x-2 px-6 py-2.5 bg-emerald text-onyx text-[10px] font-black uppercase tracking-widest rounded-sm hover:brightness-110 shadow-lg disabled:opacity-50"
             >
               {isFinalizing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
               <span>Finalize Session</span>
             </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <StatBox label="Total Items" value={stats.totalItems} icon={Package} />
           <StatBox label="Scanned" value={`${stats.scannedItems} / ${stats.totalItems}`} icon={History} color="text-blue-400" />
           <StatBox 
             label="Net Variance Value" 
             value={fmt(stats.totalVarianceValue)} 
             icon={stats.totalVarianceValue < 0 ? TrendingDown : TrendingUp} 
             color={stats.totalVarianceValue < 0 ? "text-red-500" : "text-emerald-500"} 
           />
           <div className="bg-[#1A1D21] border border-white/5 p-4 rounded-sm flex items-center space-x-4">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                 <input 
                   placeholder="SEARCH SKU / BARCODE..." 
                   className="w-full bg-[#0F1113] border border-white/5 p-2 pl-10 text-[10px] text-white font-black uppercase tracking-widest outline-none focus:border-electric-blue" 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
           </div>
        </div>

        {/* Count Sheet Table */}
        <div className="bg-[#1A1D21] border border-white/5 rounded-sm overflow-hidden shadow-2xl">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-[#0F1113] border-b border-white/10 text-[10px] uppercase font-black text-gray-600">
                    <th className="px-6 py-4">SKU Info</th>
                    <th className="px-6 py-4 text-center">System Qty</th>
                    <th className="px-6 py-4 text-center w-[200px]">Physical Count</th>
                    <th className="px-6 py-4 text-center">Variance</th>
                    <th className="px-6 py-4 text-right">Value Diff</th>
                 </tr>
              </thead>
              <tbody className="text-[11px]">
                 {filteredSkus.map((sku: any, idx: number) => {
                    const physical = counts[sku.id] ?? sku.stock_qty;
                    const variance = physical - sku.stock_qty;
                    const valDiff = variance * (sku.cost_price || 0);
                    const isLastScanned = lastScanned === sku.sku_code;

                    return (
                       <tr 
                        key={sku.id} 
                        className={cn(
                          "border-b border-white/5 transition-all group",
                          isLastScanned ? "bg-electric-blue/5 border-l-2 border-l-electric-blue" : "hover:bg-white/[0.02]"
                        )}
                       >
                          <td className="px-6 py-4">
                             <p className="font-mono text-gray-500 text-[10px]">{sku.sku_code}</p>
                             <p className="font-bold text-white uppercase mt-0.5">{sku.name}</p>
                          </td>
                          <td className="px-6 py-4 text-center font-mono text-gray-400">
                             {sku.stock_qty}
                          </td>
                          <td className="px-6 py-4">
                             <input 
                               id={`count-${sku.id}`}
                               type="number"
                               value={counts[sku.id] ?? ""}
                               placeholder={sku.stock_qty.toString()}
                               onChange={(e) => handleCountChange(sku.id, e.target.value)}
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') {
                                   const next = document.getElementById(`count-${filteredSkus[idx + 1]?.id}`);
                                   next?.focus();
                                   (next as HTMLInputElement)?.select();
                                 }
                               }}
                               className="w-full bg-[#0F1113] border border-white/10 p-3 text-center text-sm font-black text-white focus:border-electric-blue focus:bg-electric-blue/5 outline-none rounded-sm transition-all"
                             />
                          </td>
                          <td className={cn(
                            "px-6 py-4 text-center font-black",
                            variance === 0 ? "text-gray-600" : variance > 0 ? "text-emerald-500" : "text-red-500"
                          )}>
                             {variance > 0 ? '+' : ''}{variance}
                          </td>
                          <td className={cn(
                            "px-6 py-4 text-right font-mono font-bold",
                            valDiff === 0 ? "text-gray-700" : valDiff > 0 ? "text-emerald-500" : "text-red-500"
                          )}>
                             {fmt(valDiff)}
                          </td>
                       </tr>
                    );
                 })}
                 {filteredSkus.length === 0 && (
                   <tr>
                     <td colSpan={5} className="p-20 text-center uppercase font-black text-gray-700 tracking-widest opacity-30 italic">No matching SKUs found in scope</td>
                   </tr>
                 )}
              </tbody>
           </table>
        </div>
      </main>

      <style jsx global>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

function StatBox({ label, value, icon: Icon, color = "text-white" }: any) {
  return (
    <div className="bg-[#1A1D21] border border-white/5 p-4 rounded-sm space-y-2">
       <div className="flex items-center justify-between">
          <p className="text-[9px] uppercase font-black text-gray-600 tracking-widest">{label}</p>
          <Icon size={14} className="text-gray-700" />
       </div>
       <h4 className={cn("text-lg font-black font-mono tracking-tighter", color)}>{value}</h4>
    </div>
  );
}
