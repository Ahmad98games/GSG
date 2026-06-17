"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { humanizeError } from '@/lib/utils/errors';

interface LineItem { description: string; qty: number; rate: number; }

export default function NewRecurringInvoicePage() {
  const router = useRouter();
  const { businessId } = usePersona();
  const supabase = createClient();
  const toast = useToast();

  const [partyId, setPartyId] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState("");
  const [autoPost, setAutoPost] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: "", qty: 1, rate: 0 }]);

  const { data: parties } = useQuery({
    queryKey: ['parties_list', businessId],
    queryFn: async () => {
      const { data } = await supabase.from('parties').select('id, name').eq('business_id', businessId).eq('party_type', 'customer').order('name');
      return data || [];
    },
    enabled: !!businessId
  });

  const addLine = () => setLineItems([...lineItems, { description: "", qty: 1, rate: 0 }]);
  const removeLine = (i: number) => setLineItems(lineItems.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: keyof LineItem, val: string | number) => {
    const updated = [...lineItems];
    (updated[i] as any)[field] = val;
    setLineItems(updated);
  };

  const total = lineItems.reduce((s, item) => s + item.qty * item.rate, 0);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!partyId) throw new Error("Select a customer");
      if (lineItems.length === 0) throw new Error("Add at least one line item");
      const { error } = await supabase.from('recurring_invoices').insert({
        business_id: businessId,
        party_id: partyId,
        line_items: lineItems,
        frequency,
        next_run_date: startDate,
        end_date: endDate || null,
        auto_post: autoPost,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Recurring invoice template saved'); router.push('/invoices/recurring'); },
    onError: (err: any) => toast.error(humanizeError(err, 'save recurring invoice')),
  });

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 p-6">
      <main className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-white transition-colors"><ArrowLeft size={16} /></button>
          <div><h1 className="text-lg font-semibold tracking-tight text-white">New Recurring Invoice</h1><p className="text-xs text-gray-500 mt-0.5">Set up an automated billing template</p></div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1A1D21] border border-white/5 p-8 space-y-8">
          {/* Customer */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Customer</label>
            <select value={partyId} onChange={e => setPartyId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-electric-blue/50 appearance-none text-white [&>option]:bg-[#1A1D21]">
              <option value="">Select Customer...</option>
              {parties?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Line Items</label>
              <button onClick={addLine} className="flex items-center space-x-1 text-electric-blue text-[10px] font-bold uppercase tracking-widest hover:underline"><Plus size={12} /><span>Add Item</span></button>
            </div>
            {lineItems.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_100px_120px_40px] gap-3 items-center">
                <input value={item.description} onChange={e => updateLine(i, 'description', e.target.value)} placeholder="Description" className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-electric-blue/50" />
                <input type="number" value={item.qty} onChange={e => updateLine(i, 'qty', Number(e.target.value))} placeholder="Qty" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-right focus:outline-none focus:border-electric-blue/50" />
                <input type="number" value={item.rate} onChange={e => updateLine(i, 'rate', Number(e.target.value))} placeholder="Rate" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-right focus:outline-none focus:border-electric-blue/50" />
                <button onClick={() => removeLine(i)} className="p-2 text-red-500/50 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
              </div>
            ))}
            <div className="flex justify-end pt-2 border-t border-white/5">
              <span className="text-sm font-mono font-bold text-[#C5A059]">Total: {total.toLocaleString()}</span>
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Frequency</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-electric-blue/50 appearance-none text-white [&>option]:bg-[#1A1D21]">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-electric-blue/50" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">End Date (Optional)</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-electric-blue/50" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Auto-Post</label>
              <div className="flex items-center space-x-3 h-[46px]">
                <button onClick={() => setAutoPost(!autoPost)} className={cn("w-12 h-6 rounded-full transition-colors relative", autoPost ? "bg-emerald-500" : "bg-white/10")}>
                  <div className={cn("w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all", autoPost ? "left-[26px]" : "left-0.5")} />
                </button>
                <span className="text-xs text-gray-400">{autoPost ? 'Invoices will be auto-posted' : 'Invoices saved as draft'}</span>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="pt-4 flex justify-end">
            <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex items-center space-x-2 px-8 py-3 bg-electric-blue text-black font-bold uppercase tracking-widest text-[11px] hover:brightness-110 transition-all disabled:opacity-50 rounded-sm">
              {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>{saveMutation.isPending ? 'Saving...' : 'Save Template'}</span>
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
