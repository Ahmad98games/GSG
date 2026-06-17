"use client";
import { useEffect, useState } from 'react';
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { useToast } from "@/hooks/useToast";
import { humanizeError } from "@/lib/utils/errors";

import { useSidebarState } from "@/hooks/useSidebarState";
import { 
  ClipboardList, Save, Calendar, 
  Users, Layers, CheckCircle2, 
  AlertTriangle, ArrowRight, Zap 
} from "lucide-react";
import { motion } from "framer-motion";
import { IndustrialMath } from "@/lib/finance/IndustrialMath";

export default function DailyProductionLogPage() {
  const { isCollapsed } = useSidebarState();
  const { profile, currency = "PKR" } = useBusinessProfile();
  const supabase = createClient();
  const toast = useToast();
  
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [productionRows, setProductionRows] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Fetch Active Batches
  const { data: batches = [] } = useQuery({
    queryKey: ['active-batches', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('production_batches')
        .select('*, skus(name, unit)')
        .eq('business_id', profile?.id)
        .eq('status', 'in_progress');
      return data || [];
    },
    enabled: !!profile?.id
  });

  // 2. Fetch Active Karigars
  const { data: karigars = [] } = useQuery({
    queryKey: ['active-karigars', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('karigars')
        .select('*')
        .eq('business_id', profile?.id)
        .eq('status', 'active');
      return data || [];
    },
    enabled: !!profile?.id
  });

  // Initialize rows when batch/karigars loaded
   useEffect(() => {
    if (karigars.length > 0) {
      setProductionRows(karigars.map((k: any) => ({
        karigar_id: k.id,
        name: k.name,
        code: k.karigar_code,
        piece_rate: k.piece_rate || 0,
        qty: 0,
        quality: 'A',
        skill: k.skill_type
      })));
    }
  }, [karigars]);

  const updateRow = (id: string, field: string, value: any) => {
    setProductionRows(prev => prev.map(row => 
      row.karigar_id === id ? { ...row, [field]: value } : row
    ));
  };

  const calculateTotalEarning = () => {
    return productionRows.reduce((acc, row) => {
      if (row.quality === 'rejected') return acc;
      const earning = IndustrialMath.multiply(row.qty, row.piece_rate);
      return IndustrialMath.add(acc, earning);
    }, 0);
  };

  const handleSave = async () => {
    if (!selectedBatch) {
      toast.warning("Selection Required", "Select a production batch first.");
      return;
    }
    setIsSaving(true);
    
    try {
      const validRows = productionRows.filter(r => r.qty > 0).map(r => ({
        business_id: profile?.id,
        karigar_id: r.karigar_id,
        batch_id: selectedBatch,
        sku_id: batches.find((b: any) => b.id === selectedBatch)?.output_sku_id,
        log_date: logDate,
        qty_produced: r.qty,
        unit: batches.find((b: any) => b.id === selectedBatch)?.skus?.unit || 'Unit',
        piece_rate_used: r.piece_rate,
        quality_grade: r.quality,
      }));

      const { error } = await supabase.from('karigar_production_logs').insert(validRows);
      if (error) throw error;
      
      toast.success("Logs Sync completed", "Daily production logs synchronized successfully.");
      setProductionRows(prev => prev.map(r => ({ ...r, qty: 0 })));
    } catch (err: any) {
      toast.error("Sync Failed", humanizeError(err, 'save logs'));
    } finally {
      setIsSaving(false);
    }
  };

  

  return (
    <div className="min-h-screen bg-onyx text-slate-200">
      
      
      <main className={` transition-all duration-300`}>
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-surface/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
            <span>Production</span>
            <span className="mx-3 opacity-30">/</span>
            <span className="text-white">Daily Artisan Output Logging</span>
          </div>
          
          <div className="ml-auto flex items-center space-x-3">
             <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-6 py-2 bg-sandstone-gold text-onyx text-[10px] uppercase tracking-widest font-bold hover:bg-yellow-600 transition-colors disabled:opacity-50"
             >
                <Save size={14} />
                <span>{isSaving ? "Syncing..." : "Commit Production Logs"}</span>
             </button>
          </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface border border-white/5 p-6 flex items-center space-x-4">
                 <Calendar className="text-gray-600" size={20} />
                 <div className="flex-1">
                    <span className="text-[9px] uppercase text-gray-500 font-bold block mb-1">Production Date</span>
                    <input 
                      type="date" 
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      className="w-full bg-onyx border border-white/5 text-sm text-white px-2 py-1 outline-none focus:border-electric-blue transition-all"
                    />
                 </div>
              </div>

              <div className="bg-surface border border-white/5 p-6 flex items-center space-x-4">
                 <Layers className="text-gray-600" size={20} />
                 <div className="flex-1">
                    <span className="text-[9px] uppercase text-gray-500 font-bold block mb-1">Active Batch</span>
                    <select 
                      value={selectedBatch}
                      onChange={(e) => setSelectedBatch(e.target.value)}
                      className="w-full bg-onyx border border-white/5 text-sm text-white px-2 py-1 outline-none focus:border-electric-blue transition-all uppercase"
                    >
                       <option value="">Select Batch...</option>
                       {batches.map((b: any) => (
                         <option key={b.id} value={b.id}>{b.batch_no} - {b.skus?.name}</option>
                       ))}
                    </select>
                 </div>
              </div>

              <div className="bg-surface border border-white/5 p-6 flex items-center space-x-4">
                 <Zap className="text-sandstone-gold" size={20} />
                 <div className="flex-1">
                    <span className="text-[9px] uppercase text-gray-500 font-bold block mb-1">Session Value</span>
                    <div className="text-xl font-bold font-mono text-white flex items-baseline">
                       <span className="text-xs text-gray-600 mr-1">{currency}</span>
                       {calculateTotalEarning().toLocaleString()}
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-surface border border-white/5 overflow-hidden">
              <table className="w-full text-left">
                 <thead className="bg-onyx/50 border-b border-white/5 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                    <tr>
                       <th className="px-6 py-4">Artisan (Karigar)</th>
                       <th className="px-6 py-4">Skill / Grade</th>
                       <th className="px-6 py-4 text-right">Standard Rate</th>
                       <th className="px-6 py-4 text-center">Output Qty</th>
                       <th className="px-6 py-4 text-center">Quality</th>
                       <th className="px-6 py-4 text-right">Earning</th>
                    </tr>
                 </thead>
                 <tbody>
                    {productionRows.map((row) => (
                       <tr key={row.karigar_id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                             <div className="flex flex-col">
                                <span className="text-white text-xs font-bold uppercase">{row.name}</span>
                                <span className="text-[10px] text-gray-600 font-mono">{row.code}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-[10px] uppercase font-bold text-gray-500">{row.skill}</td>
                          <td className="px-6 py-4 text-right font-mono text-xs text-gray-400">PKR {row.piece_rate}</td>
                          <td className="px-6 py-4">
                             <input 
                              type="number" 
                              value={row.qty || ""}
                              onChange={(e) => updateRow(row.karigar_id, 'qty', e.target.value)}
                              placeholder="0.00"
                              className="w-24 bg-onyx border border-white/5 text-center text-sm font-bold text-white px-2 py-1 outline-none focus:border-electric-blue ml-auto block"
                             />
                          </td>
                          <td className="px-6 py-4">
                             <select 
                              value={row.quality}
                              onChange={(e) => updateRow(row.karigar_id, 'quality', e.target.value)}
                              className="bg-onyx border border-white/5 text-[10px] uppercase font-bold text-gray-400 px-2 py-1 outline-none mx-auto block"
                             >
                                <option value="A">Grade A</option>
                                <option value="B">Grade B</option>
                                <option value="C">Grade C</option>
                                <option value="rejected">Rejected</option>
                             </select>
                          </td>
                          <td className="px-6 py-4 text-right">
                             {row.quality === 'rejected' ? (
                               <span className="text-[10px] uppercase font-bold text-critical-red">Rejected (0)</span>
                             ) : (
                               <span className="text-sm font-bold font-mono text-sandstone-gold">
                                  {(IndustrialMath.multiply(row.qty, row.piece_rate)).toLocaleString()}
                               </span>
                             )}
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </main>
    </div>
  );
}

