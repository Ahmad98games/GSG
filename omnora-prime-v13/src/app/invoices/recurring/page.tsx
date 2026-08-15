"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { RefreshCw, Plus, Calendar, Users, Pause, Play, CheckCircle2, ArrowLeft } from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { FeatureGate } from "@/components/ui/FeatureGate";

export default function RecurringInvoicesPage() {
  const router = useRouter();
  const { businessId, fmt } = usePersona();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['recurring_invoices', businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from('recurring_invoices')
        .select('*, party:parties(name, phone)').eq('business_id', businessId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!businessId
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from('recurring_invoices').update({ is_active: !isActive }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring_invoices'] }),
  });

  const triggerCron = async () => {
    const res = await fetch('/api/cron/recurring-invoices', { method: 'POST' });
    const data = await res.json();
    alert(`Processed ${data.processed} recurring invoices.`);
    queryClient.invalidateQueries({ queryKey: ['recurring_invoices'] });
  };

  const freqStyle = (f: string) => f === 'weekly' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : f === 'monthly' ? "bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20" : "bg-purple-500/10 text-purple-500 border-purple-500/20";

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 p-6">
      <FeatureGate feature="recurringInvoices">
        <main className="max-w-[1600px] mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.push('/invoices')} className="text-gray-500 hover:text-white transition-colors"><ArrowLeft size={16} /></button>
              <div><h1 className="text-lg font-semibold tracking-tight text-white">Recurring Invoices</h1><p className="text-xs text-gray-500 mt-0.5">Automated Invoice Templates</p></div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={triggerCron} className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 transition-colors rounded-sm"><RefreshCw size={12} /><span>Run Now</span></button>
              <Link href="/invoices/recurring/new" className="flex items-center space-x-2 px-4 py-2 bg-electric-blue text-black text-sm font-semibold rounded-sm hover:brightness-110 shadow-lg"><Plus size={14} /><span>New Template</span></Link>
            </div>
          </div>

          {isLoading ? (
            <div className="py-40 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-gray-600 animate-pulse">Loading Recurring Templates...</div>
          ) : !templates || templates.length === 0 ? (
            <div className="py-40 text-center space-y-6">
              <RefreshCw size={48} className="mx-auto text-gray-700" />
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">No Recurring Templates</h3>
              <p className="text-sm text-gray-500">Set up recurring invoices to auto-bill customers on schedule.</p>
              <Link href="/invoices/recurring/new" className="inline-flex items-center space-x-2 px-6 py-3 bg-electric-blue text-black text-[10px] uppercase tracking-widest font-black hover:brightness-110"><Plus size={14} /><span>Create First Template</span></Link>
            </div>
          ) : (
            <div className="bg-[#1A1D21] border border-white/5 overflow-hidden">
              <table className="w-full border-collapse">
                <thead><tr className="bg-[#0F1113] text-[9px] uppercase font-black text-gray-600 tracking-[0.2em] border-b border-white/5">
                  <th className="px-6 py-4 text-left">Customer</th><th className="px-6 py-4 text-left">Frequency</th><th className="px-6 py-4 text-left">Next Run</th><th className="px-6 py-4 text-right">Amount</th><th className="px-6 py-4 text-center">Auto-Post</th><th className="px-6 py-4 text-center">Status</th><th className="px-6 py-4 text-right">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {templates.map((tmpl: any) => {
                    const lineTotal = (tmpl.line_items as any[])?.reduce((s: number, i: any) => s + (Number(i.qty || 1) * Number(i.rate || 0)), 0) || 0;
                    return (
                      <motion.tr key={tmpl.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-5"><div className="flex items-center space-x-3"><div className="w-8 h-8 bg-white/5 flex items-center justify-center text-gray-500 rounded-sm"><Users size={14} /></div><div><p className="text-xs font-bold text-white uppercase">{tmpl.party?.name || 'Unknown'}</p><p className="text-[9px] text-gray-600 font-mono">{tmpl.id.substring(0, 8)}</p></div></div></td>
                        <td className="px-6 py-5"><span className={cn("px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border rounded-sm", freqStyle(tmpl.frequency))}>{tmpl.frequency}</span></td>
                        <td className="px-6 py-5"><div className="flex items-center space-x-2 text-[10px] text-gray-400 font-mono"><Calendar size={12} className="text-gray-600" /><span>{tmpl.next_run_date}</span></div></td>
                        <td className="px-6 py-5 text-right font-mono font-bold text-white text-sm">{fmt(lineTotal)}</td>
                        <td className="px-6 py-5 text-center">{tmpl.auto_post ? <span className="inline-flex items-center space-x-1 text-emerald-500 text-[9px] font-black uppercase"><CheckCircle2 size={10} /><span>Yes</span></span> : <span className="text-[9px] text-gray-600 font-black uppercase">Draft</span>}</td>
                        <td className="px-6 py-5 text-center"><span className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border rounded-sm", tmpl.is_active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20")}>{tmpl.is_active ? 'Active' : 'Paused'}</span></td>
                        <td className="px-6 py-5 text-right"><button onClick={() => toggleActive.mutate({ id: tmpl.id, isActive: tmpl.is_active })} className={cn("p-2 rounded-sm transition-all", tmpl.is_active ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20")} title={tmpl.is_active ? 'Pause' : 'Resume'}>{tmpl.is_active ? <Pause size={14} /> : <Play size={14} />}</button></td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </FeatureGate>
    </div>
  );
}
