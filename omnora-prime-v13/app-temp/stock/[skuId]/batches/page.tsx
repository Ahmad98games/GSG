"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, AlertTriangle, Calendar, Hash, Layers, ArrowLeft, Loader2, Save } from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { humanizeError } from '@/lib/utils/errors';

export default function SkuBatchesPage() {
  const params = useParams();
  const router = useRouter();
  const skuId = params.skuId as string;
  const { businessId, fmt, fmtDate } = usePersona();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ batch_number: '', lot_number: '', manufacture_date: '', expiry_date: '', qty_received: 0, cost_price: 0, notes: '' });

  const { data: sku } = useQuery({
    queryKey: ['sku', skuId],
    queryFn: async () => { const { data } = await supabase.from('skus').select('*').eq('id', skuId).single(); return data; }
  });

  const { data: batches, isLoading } = useQuery({
    queryKey: ['sku_batches', skuId],
    queryFn: async () => {
      const { data, error } = await supabase.from('sku_batches').select('*').eq('sku_id', skuId).eq('business_id', businessId).order('expiry_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!businessId && !!skuId
  });

  const addBatch = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('sku_batches').insert({
        business_id: businessId, sku_id: skuId, ...form, qty_remaining: form.qty_received,
        manufacture_date: form.manufacture_date || null, expiry_date: form.expiry_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sku_batches'] }); setShowAdd(false); setForm({ batch_number: '', lot_number: '', manufacture_date: '', expiry_date: '', qty_received: 0, cost_price: 0, notes: '' }); toast.success('Batch added successfully'); },
    onError: (err: any) => toast.error(humanizeError(err, 'add batch')),
  });

  const getExpiryColor = (expiryDate: string | null) => {
    if (!expiryDate) return "";
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
    if (days < 0) return "bg-red-500/20 border-red-500/30";
    if (days < 7) return "bg-red-500/10 border-red-500/20";
    if (days <= 30) return "bg-amber-500/10 border-amber-500/20";
    return "";
  };

  const getExpiryBadge = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
    if (days < 0) return <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20 rounded-sm">Expired</span>;
    if (days < 7) return <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20 rounded-sm">{days}d left</span>;
    if (days <= 30) return <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-sm">{days}d left</span>;
    return <span className="text-[9px] text-gray-500 font-mono">{days}d</span>;
  };

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 p-6">
      <main className="max-w-[1200px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-white transition-colors"><ArrowLeft size={16} /></button>
            <div><h1 className="text-lg font-semibold tracking-tight text-white">Batch Management</h1><p className="text-xs text-gray-500 mt-0.5">{sku?.name || 'SKU'} — {sku?.sku_code || ''}</p></div>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center space-x-2 px-4 py-2 bg-electric-blue text-black text-sm font-semibold rounded-sm hover:brightness-110 shadow-lg"><Plus size={14} /><span>Add Batch</span></button>
        </div>

        {/* FIFO Notice */}
        <div className="bg-blue-500/5 border border-blue-500/10 p-4 flex items-center space-x-3 rounded-sm">
          <Layers size={16} className="text-blue-400 flex-shrink-0" />
          <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">FIFO Enabled — Oldest batches are consumed first when creating invoices</p>
        </div>

        {isLoading ? (
          <div className="py-20 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-gray-600 animate-pulse">Loading Batches...</div>
        ) : !batches || batches.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <Package size={48} className="mx-auto text-gray-700" />
            <h3 className="text-lg font-bold text-white">No Batches Recorded</h3>
            <p className="text-sm text-gray-500">Add batch information for lot tracking and expiry management.</p>
          </div>
        ) : (
          <div className="bg-[#1A1D21] border border-white/5 overflow-hidden">
            <table className="w-full border-collapse">
              <thead><tr className="bg-[#0F1113] text-[9px] uppercase font-black text-gray-600 tracking-[0.2em] border-b border-white/5">
                <th className="px-6 py-4 text-left">Batch #</th><th className="px-6 py-4 text-left">Lot</th><th className="px-6 py-4 text-left">Mfg Date</th><th className="px-6 py-4 text-left">Expiry</th><th className="px-6 py-4 text-right">Received</th><th className="px-6 py-4 text-right">Remaining</th><th className="px-6 py-4 text-right">Cost</th>
              </tr></thead>
              <tbody className="divide-y divide-white/[0.03]">
                {batches.map((batch: any, i: number) => (
                  <tr key={batch.id} className={cn("hover:bg-white/[0.02] transition-colors", getExpiryColor(batch.expiry_date))}>
                    <td className="px-6 py-4"><div className="flex items-center space-x-2"><Hash size={12} className="text-gray-600" /><span className="text-xs font-bold text-white font-mono">{batch.batch_number}</span>{i === 0 && <span className="px-1.5 py-0.5 text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-sm">FIFO Next</span>}</div></td>
                    <td className="px-6 py-4 text-[10px] text-gray-400 font-mono">{batch.lot_number || '—'}</td>
                    <td className="px-6 py-4 text-[10px] text-gray-400 font-mono">{batch.manufacture_date || '—'}</td>
                    <td className="px-6 py-4"><div className="flex items-center space-x-2"><span className="text-[10px] text-gray-400 font-mono">{batch.expiry_date || '—'}</span>{getExpiryBadge(batch.expiry_date)}</div></td>
                    <td className="px-6 py-4 text-right text-xs font-mono font-bold text-gray-400">{Number(batch.qty_received).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-xs font-mono font-bold text-white">{Number(batch.qty_remaining).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-xs font-mono text-gray-400">{batch.cost_price ? fmt(batch.cost_price) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Batch Modal */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setShowAdd(false)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-[#1A1D21] border border-white/10 p-8 max-w-lg w-full space-y-6 rounded-lg shadow-2xl">
                <h2 className="text-xl font-bold text-white">Add New Batch</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Batch Number *</label><input value={form.batch_number} onChange={e => setForm({...form, batch_number: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-electric-blue/50" /></div>
                  <div className="space-y-1"><label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Lot Number</label><input value={form.lot_number} onChange={e => setForm({...form, lot_number: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-electric-blue/50" /></div>
                  <div className="space-y-1"><label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Manufacture Date</label><input type="date" value={form.manufacture_date} onChange={e => setForm({...form, manufacture_date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-electric-blue/50" /></div>
                  <div className="space-y-1"><label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Expiry Date</label><input type="date" value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-electric-blue/50" /></div>
                  <div className="space-y-1"><label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Qty Received *</label><input type="number" value={form.qty_received} onChange={e => setForm({...form, qty_received: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-electric-blue/50" /></div>
                  <div className="space-y-1"><label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Cost Price</label><input type="number" value={form.cost_price} onChange={e => setForm({...form, cost_price: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-electric-blue/50" /></div>
                </div>
                <div className="space-y-1"><label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Notes</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-electric-blue/50 resize-none" /></div>
                <div className="flex justify-end space-x-3">
                  <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                  <button onClick={() => addBatch.mutate()} disabled={addBatch.isPending || !form.batch_number || !form.qty_received} className="flex items-center space-x-2 px-6 py-2.5 bg-electric-blue text-black font-bold text-sm rounded-sm hover:brightness-110 disabled:opacity-50">
                    {addBatch.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}<span>{addBatch.isPending ? 'Saving...' : 'Save Batch'}</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
