"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Layers, Plus, Search, Filter,
  Play, Pause, CheckCircle2,
  AlertTriangle, Hammer, ArrowRight,
  TrendingUp, BarChart3, Clock, X,
  RefreshCw, Check, Sparkles
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { useToast } from "@/hooks/useToast";
import { useSidebarState } from "@/hooks/useSidebarState";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProductionBatchesPage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isCollapsed } = useSidebarState();
  const { fmt, t, businessId } = usePersona();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch batches with 100% offline-first local SQLite API
  const { data: batches = [], isLoading, refetch } = useQuery({
    queryKey: ['production_batches', businessId, statusFilter],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/production/batches?business_id=${businessId || 'local'}&status=${statusFilter}`);
        if (!res.ok) throw new Error('Failed to fetch batches');
        const json = await res.json();
        return json.data || [];
      } catch (err) {
        console.warn('[Batches Query] Fallback error:', err);
        return [];
      }
    },
    refetchInterval: 10000,
  });

  // Fetch SKUs for the create batch modal
  const { data: skus = [] } = useQuery({
    queryKey: ['skus_for_batches', businessId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/skus?business_id=${businessId || 'local'}`);
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || json.skus || [];
      } catch {
        return [];
      }
    },
  });

  // Advance / Update batch mutation
  const updateBatchMutation = useMutation({
    mutationFn: async ({ id, status, actual_qty }: { id: string; status?: string; actual_qty?: number }) => {
      const res = await fetch('/api/production/batches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, actual_qty }),
      });
      if (!res.ok) throw new Error('Failed to update batch');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production_batches'] });
      toast.success('Batch State Updated', 'Local production mesh synced successfully.');
    },
    onError: (err: any) => {
      toast.error('Update Failed', err.message);
    }
  });

  const filteredBatches = batches.filter((b: any) => 
    (b.batch_no || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (b.sku?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.sku_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
      className="min-h-screen text-slate-200 font-inter transition-colors duration-200"
      style={{
        backgroundColor: 'var(--color-bg, #0B0E14)',
        color: 'var(--color-text, #E2E8F0)'
      }}
    >
      <main className="transition-all duration-300 min-h-screen flex flex-col">
        {/* TOP HEADER */}
        <header 
          className="h-20 border-b flex items-center px-8 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200"
          style={{
            backgroundColor: 'var(--color-card-bg, #111622)',
            borderColor: 'var(--color-card-border, rgba(255,255,255,0.08))'
          }}
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <Layers size={18} className="text-cyan-400" />
              <h1 className="text-xl font-black uppercase tracking-tight text-white">
                Batch Registry & Traceability
              </h1>
            </div>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-[0.2em] mt-0.5">
              Industrial Manufacturing Cycle & Output Control
            </p>
          </div>

          <div className="ml-auto flex items-center space-x-3">
            <button
              onClick={() => refetch()}
              className="p-2.5 rounded text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
              title="Refresh Local Mesh"
            >
              <RefreshCw size={14} />
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs uppercase tracking-wider font-bold rounded shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
               <Plus size={15} />
               <span>New Production Batch</span>
            </button>
          </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full space-y-6">
           {/* FILTERS & TELEMETRY STATUS */}
           <div 
             className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded border transition-colors duration-200"
             style={{
               backgroundColor: 'var(--color-card-bg, #131823)',
               borderColor: 'var(--color-card-border, rgba(255,255,255,0.08))'
             }}
           >
              <div className="flex flex-wrap items-center gap-4">
                 <div className="relative w-72">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search Batch ID, SKU, or notes..." 
                      className="w-full pl-9 pr-4 py-2 text-xs rounded outline-none transition-colors"
                      style={{
                        backgroundColor: 'var(--color-input-bg, #0A0D14)',
                        borderColor: 'var(--color-card-border, rgba(255,255,255,0.08))',
                        borderWidth: '1px',
                        color: 'var(--color-text, #E2E8F0)'
                      }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <div className="flex items-center space-x-1.5">
                    {['all', 'open', 'in_progress', 'completed'].map(status => (
                       <button 
                         key={status} 
                         onClick={() => setStatusFilter(status)}
                         className={cn(
                           "px-3.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded border transition-all cursor-pointer",
                           statusFilter === status 
                             ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm" 
                             : "bg-white/[0.02] text-slate-400 border-white/[0.06] hover:bg-white/[0.06] hover:text-white"
                         )}
                       >
                          {status.replace('_', ' ')}
                       </button>
                    ))}
                 </div>
              </div>
              <div className="flex items-center space-x-2 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded">
                 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                 <span>Local Mesh Active (100% Offline Ready)</span>
              </div>
           </div>

           {/* BATCH GRID */}
           {isLoading ? (
             <div className="py-24 text-center font-mono text-xs uppercase tracking-[0.3em] text-slate-500 animate-pulse">
               Scanning Manufacturing Cycles...
             </div>
           ) : filteredBatches.length === 0 ? (
             <div 
               className="p-12 text-center rounded border border-dashed flex flex-col items-center justify-center space-y-4"
               style={{
                 backgroundColor: 'var(--color-card-bg, #131823)',
                 borderColor: 'var(--color-card-border, rgba(255,255,255,0.1))'
               }}
             >
               <Layers size={36} className="text-slate-600" />
               <div className="space-y-1">
                 <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Production Batches Found</h3>
                 <p className="text-xs text-slate-400 max-w-sm">
                   Create your first production batch to initiate piece-rate tracking, material allocation, and cost accounting.
                 </p>
               </div>
               <button
                 onClick={() => setIsCreateModalOpen(true)}
                 className="px-4 py-2 bg-cyan-500 text-black font-bold text-xs uppercase tracking-wider rounded hover:bg-cyan-400 transition"
               >
                 Create First Batch
               </button>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBatches.map((batch: any) => (
                   <BatchCard 
                     key={batch.id} 
                     batch={batch} 
                     fmt={fmt}
                     onUpdateStatus={(newStatus: string) => {
                       updateBatchMutation.mutate({ id: batch.id, status: newStatus });
                     }}
                     onAddOutput={(qty: number) => {
                       const current = Number(batch.actual_qty) || 0;
                       updateBatchMutation.mutate({ id: batch.id, actual_qty: current + qty });
                     }}
                   />
                ))}
             </div>
           )}
        </div>
      </main>

      {/* CREATE BATCH MODAL */}
      <CreateBatchModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        skus={skus}
        businessId={businessId}
      />
    </div>
  );
}

function BatchCard({ batch, fmt, onUpdateStatus, onAddOutput }: any) {
  const planned = Number(batch.planned_qty) || 1;
  const actual = Number(batch.actual_qty) || 0;
  const progress = Math.min(100, Math.round((actual / planned) * 100));
  const skuName = batch.sku?.name || batch.sku_name || 'Standard Production Assembly';
  const skuUnit = batch.sku?.unit || batch.sku_unit || 'units';

  return (
    <div 
      className="p-6 rounded border space-y-6 group transition-all relative overflow-hidden"
      style={{
        backgroundColor: 'var(--color-card-bg, #131824)',
        borderColor: 'var(--color-card-border, rgba(255,255,255,0.08))'
      }}
    >
       <div className="flex justify-between items-start gap-3">
          <div className="space-y-1.5 min-w-0">
             <div className="flex items-center gap-2">
               <span className="text-[10px] font-mono font-bold uppercase text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded">
                 {batch.batch_no}
               </span>
               <span className={cn(
                 "text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded",
                 batch.status === 'completed' ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                 batch.status === 'in_progress' ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" :
                 "bg-amber-500/20 text-amber-300 border border-amber-500/30"
               )}>
                 {batch.status ? batch.status.replace('_', ' ') : 'open'}
               </span>
             </div>
             <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
               {skuName}
             </h3>
          </div>
       </div>

       <div className="grid grid-cols-2 gap-4 p-3.5 rounded bg-black/40 border border-white/[0.04]">
          <div className="space-y-0.5">
             <p className="text-[9px] font-mono font-bold uppercase text-slate-400">Target Output</p>
             <p className="text-xl font-bold font-mono text-white">
               {batch.planned_qty} <span className="text-[11px] text-slate-400 font-normal">{skuUnit}</span>
             </p>
          </div>
          <div className="space-y-0.5">
             <p className="text-[9px] font-mono font-bold uppercase text-slate-400">Completed Qty</p>
             <p className="text-xl font-bold font-mono text-emerald-400">
               {actual} <span className="text-[11px] text-slate-400 font-normal">{skuUnit}</span>
             </p>
          </div>
       </div>

       {/* CYCLE PROGRESS BAR */}
       <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-mono uppercase text-slate-400 font-medium">
             <span>Cycle Completion</span>
             <span className="text-white font-bold">{progress}% Complete</span>
          </div>
          <div className="h-2 bg-black/50 w-full rounded-full overflow-hidden p-0.5 border border-white/[0.08]">
             <div 
               className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(6,182,212,0.4)]" 
               style={{ width: `${Math.max(2, progress)}%` }} 
             />
          </div>
       </div>

       {/* QUICK ACTION BUTTONS */}
       <div className="flex items-center gap-2 pt-1">
         {batch.status === 'open' && (
           <button
             onClick={() => onUpdateStatus('in_progress')}
             className="flex-1 py-1.5 px-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded text-[11px] font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
           >
             <Play size={12} />
             <span>Start Cycle</span>
           </button>
         )}
         {batch.status === 'in_progress' && (
           <>
             <button
               onClick={() => onAddOutput(10)}
               className="flex-1 py-1.5 px-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded text-[11px] font-mono font-bold transition flex items-center justify-center gap-1 cursor-pointer"
               title="Log +10 Completed Output"
             >
               <span>+10 Output</span>
             </button>
             <button
               onClick={() => onUpdateStatus('completed')}
               className="flex-1 py-1.5 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
             >
               <Check size={12} />
               <span>Mark Done</span>
             </button>
           </>
         )}
         {batch.status === 'completed' && (
           <div className="flex-1 py-1 px-2 text-center text-[10px] font-mono text-emerald-400 bg-emerald-500/10 rounded border border-emerald-500/20">
             Cycle Fulfilled
           </div>
         )}
       </div>

       {/* FOOTER */}
       <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
          <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono">
             <Clock size={12} className="text-slate-500" />
             <span>{batch.created_at ? format(new Date(batch.created_at), 'MMM dd, yyyy') : 'Live Node'}</span>
          </div>
          <Link href={`/production/batches/${batch.id}/costing`}>
             <button className="flex items-center space-x-1 text-[11px] font-mono font-bold text-amber-400 hover:text-amber-300 transition-colors">
                <span>Batch Costing</span>
                <ArrowRight size={13} />
             </button>
          </Link>
       </div>
    </div>
  );
}

function CreateBatchModal({ isOpen, onClose, skus, businessId }: any) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [selectedSkuId, setSelectedSkuId] = useState("");
  const [plannedQty, setPlannedQty] = useState("100");
  const [batchNo, setBatchNo] = useState(`BAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plannedQty || Number(plannedQty) <= 0) {
      toast.error('Invalid Quantity', 'Please enter a planned output greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/production/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId || 'local',
          sku_id: selectedSkuId || (skus[0]?.id || null),
          planned_qty: Number(plannedQty),
          batch_no: batchNo,
          notes: notes
        }),
      });

      if (!res.ok) throw new Error('Failed to create batch');
      
      queryClient.invalidateQueries({ queryKey: ['production_batches'] });
      toast.success('Batch Launched', `Production batch ${batchNo} initialized in local mesh.`);
      onClose();
    } catch (err: any) {
      toast.error('Creation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div 
        className="w-full max-w-md rounded-lg border p-6 space-y-5 shadow-2xl relative"
        style={{
          backgroundColor: 'var(--color-card-bg, #111622)',
          borderColor: 'var(--color-card-border, rgba(255,255,255,0.12))'
        }}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-cyan-400" />
            <h3 className="text-base font-bold text-white uppercase tracking-tight">New Production Batch</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase">Batch Identifier</label>
            <input
              type="text"
              value={batchNo}
              onChange={(e) => setBatchNo(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded border outline-none font-mono"
              style={{
                backgroundColor: 'var(--color-input-bg, #0A0D14)',
                borderColor: 'var(--color-card-border, rgba(255,255,255,0.1))',
                color: 'var(--color-text, #E2E8F0)'
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase">Target Product (SKU)</label>
            <select
              value={selectedSkuId}
              onChange={(e) => setSelectedSkuId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded border outline-none"
              style={{
                backgroundColor: 'var(--color-input-bg, #0A0D14)',
                borderColor: 'var(--color-card-border, rgba(255,255,255,0.1))',
                color: 'var(--color-text, #E2E8F0)'
              }}
            >
              <option value="">Standard Production Assembly (Generic)</option>
              {skus.map((sku: any) => (
                <option key={sku.id} value={sku.id}>
                  {sku.name} ({sku.sku_code || 'SKU'}) - {sku.unit || 'pcs'}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase">Planned Output Quantity</label>
            <input
              type="number"
              min="1"
              value={plannedQty}
              onChange={(e) => setPlannedQty(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded border outline-none font-mono"
              style={{
                backgroundColor: 'var(--color-input-bg, #0A0D14)',
                borderColor: 'var(--color-card-border, rgba(255,255,255,0.1))',
                color: 'var(--color-text, #E2E8F0)'
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase">Production Notes & Specs</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Operator assignment, material grade, or machine line notes..."
              className="w-full px-3 py-2 text-xs rounded border outline-none resize-none"
              style={{
                backgroundColor: 'var(--color-input-bg, #0A0D14)',
                borderColor: 'var(--color-card-border, rgba(255,255,255,0.1))',
                color: 'var(--color-text, #E2E8F0)'
              }}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs uppercase tracking-wider rounded transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Initializing...' : 'Launch Cycle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
