"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Plus, Search,
  Layers, Package, AlertTriangle, CheckCircle2,
  Lock, Eye, X, ArrowRight,
  FileText, History,
  TrendingUp, TrendingDown
} from "lucide-react";
import { useRouter } from "next/navigation";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/hooks/useToast";
import { humanizeError } from '@/lib/utils/errors';

interface AuditSession {
  id: string;
  label: string;
  status: 'open' | 'finalized' | 'locked' | 'in_progress';
  created_at: string;
  counts_count?: { count: number }[];
  variances?: { variance: number }[];
}

const auditSessionSchema = z.object({
  label: z.string().min(1, "Session label is required"),
});

export default function AuditPage() {
  const { businessId, fmt } = usePersona();
  const supabase = createClient();
  const toast = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'recon' | 'log'>('recon');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Audit Sessions Query
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['audit_sessions', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_sessions')
        .select('*, counts_count:audit_counts(count), variances:audit_counts(variance)')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!businessId
  });

  // Audit Trail Query
  const { data: auditTrail = [], isLoading: isTrailLoading } = useQuery({
    queryKey: ['audit_trail', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_trail')
        .select('*')
        .eq('business_id', businessId)
        .order('performed_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!businessId && activeTab === 'log'
  });

  const stats = useMemo(() => {
    return {
      active: (sessions || []).filter((s: AuditSession) => s.status === 'open').length,
      finalized: (sessions || []).filter((s: AuditSession) => s.status === 'finalized').length,
      lastVariance: (sessions || [])[0]?.variances?.reduce((acc: number, v: any) => acc + Number(v.variance || 0), 0) || 0
    };
  }, [sessions]);

  const handleCreateSession = async (values: any) => {
    try {
      const { data, error } = await supabase.from('audit_sessions').insert({
        business_id: businessId,
        label: values.label,
        status: 'in_progress',
        scope: values.scope,
        scope_details: values.scopeDetails,
        notes: values.notes,
        started_at: new Date().toISOString(),
        created_by: (await supabase.auth.getUser()).data.user?.id
      }).select().single();

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['audit_sessions'] });
      setIsModalOpen(false);
      router.push(`/audit/${data.id}`);
      toast.success('Audit session created');
    } catch (err: any) {
      toast.error(humanizeError(err, 'create audit session'));
    }
  };

  const formatChangeDescription = (row: any) => {
    const table = row.table_name;
    const action = row.action;
    const newVals = row.new_values || {};
    const oldVals = row.old_values || {};

    if (table === 'invoices') {
      return `Invoice #${newVals.invoice_number || oldVals.invoice_number} ${action === 'UPDATE' ? 'modified' : action.toLowerCase() + 'ed'}`;
    }
    if (table === 'skus') {
      return `Stock adjustment: ${newVals.sku_code || oldVals.sku_code}`;
    }
    if (table === 'karigars') {
      return `Karigar ${newVals.name || oldVals.name} records changed`;
    }
    return `${table} record ${action.toLowerCase()}ed`;
  };

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 p-6">
      <main className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">Audit & Compliance</h1>
            <p className="text-xs text-gray-500 mt-0.5">Fraud Prevention & Integrity Management</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-electric-blue text-onyx text-sm font-semibold rounded-sm hover:brightness-110 shadow-lg transition-all">
            <Plus size={14} />
            <span>Initiate Audit Session</span>
          </button>
        </div>

        <div className="flex space-x-8 border-b border-white/5 mb-8">
          {['recon', 'log'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={cn("pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all", activeTab === tab ? "text-white border-b-2 border-electric-blue" : "text-gray-600 hover:text-white")}>
              {tab === 'recon' ? 'Inventory Recon' : 'Change Log (Fraud)'}
            </button>
          ))}
        </div>

        <div className="p-8 space-y-8">
          {activeTab === 'recon' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard label="Active Sessions" value={stats.active} sub="Currently in progress" icon={Layers} color="text-blue-500" />
              <SummaryCard label="Total Finalized" value={stats.finalized} sub="Historical reconciliations" icon={History} color="text-emerald-500" />
              <SummaryCard label="Last Session Variance" value={fmt(stats.lastVariance)} sub="Net stock difference" icon={stats.lastVariance < 0 ? TrendingDown : TrendingUp} color={stats.lastVariance < 0 ? "text-red-500" : "text-emerald-500"} />
            </div>
          )}

          <div className="bg-[#1A1D21] border border-white/5 rounded-sm overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
              <h2 className="text-[10px] uppercase font-black text-gray-500 tracking-widest">{activeTab === 'recon' ? 'Inventory Recon Registry' : 'Fraud Prevention Change Log'}</h2>
            </div>

            {activeTab === 'recon' ? (
              isLoading ? <div className="p-20 space-y-4">{[1,2,3].map(i => <div key={i} className="h-12 bg-white/5 animate-pulse rounded-sm" />)}</div> :
              sessions.length === 0 ? <EmptyState icon={Package} title="No audit sessions" body="Start a session to begin reconciliation." action={{ label: "Initiate Audit Session", onClick: () => setIsModalOpen(true) }} /> :
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="bg-[#0F1113] border-b border-white/10 text-[10px] uppercase font-black text-gray-600"><th className="px-6 py-4">ID</th><th className="px-6 py-4">Label</th><th className="px-6 py-4">Created</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                  <tbody className="text-sm">
                    {sessions.map((s: AuditSession) => (
                      <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                        <td className="px-6 py-4 font-mono text-[10px] text-gray-500">{s.id.slice(0,8)}</td>
                        <td className="px-6 py-4 font-bold text-white uppercase">{s.label}</td>
                        <td className="px-6 py-4 text-gray-500 text-[10px]">{new Date(s.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4"><StatusPill status={s.status} /></td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/audit/${s.id}`} className="p-2 bg-white/5 hover:bg-electric-blue hover:text-onyx inline-block rounded-sm transition-all">
                            <ArrowRight size={16} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              isTrailLoading ? <div className="p-20 space-y-4">{[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-white/5 animate-pulse rounded-sm" />)}</div> :
              auditTrail.length === 0 ? <div className="p-20 text-center text-gray-500 uppercase font-black text-[10px] tracking-widest opacity-30 italic">Empty Trail</div> :
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="bg-[#0F1113] border-b border-white/10 text-[10px] uppercase font-black text-gray-600"><th className="px-6 py-4">Time</th><th className="px-6 py-4">Table</th><th className="px-6 py-4">Change</th><th className="px-6 py-4 text-right">Action</th></tr></thead>
                  <tbody className="text-[10px]">
                    {auditTrail.map((row: any) => (
                      <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                        <td className="px-6 py-4 text-gray-500 font-mono">{new Date(row.performed_at).toLocaleTimeString()}</td>
                        <td className="px-6 py-4 font-black uppercase text-white/40">{row.table_name}</td>
                        <td className="px-6 py-4 font-bold text-white uppercase tracking-tighter">{formatChangeDescription(row)}</td>
                        <td className="px-6 py-4 text-right"><span className={cn("px-2 py-1 rounded-sm font-black", row.action === 'INSERT' ? "bg-emerald-500/10 text-emerald-500" : row.action === 'UPDATE' ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500")}>{row.action}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>{isModalOpen && <AddAuditModal onClose={() => setIsModalOpen(false)} onSubmit={handleCreateSession} />}</AnimatePresence>
      <AnimatePresence>{successToast && <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-8 right-8 bg-[#C5A059] text-black px-6 py-3 rounded-sm font-bold uppercase text-xs shadow-2xl">{successToast}</motion.div>}</AnimatePresence>
    </div>
  );
}

function SummaryCard({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="bg-[#1A1D21] border border-white/5 p-6 space-y-4 rounded-sm shadow-sm">
      <div className="flex justify-between items-start"><div className="p-2 bg-white/5 text-gray-600 rounded-sm"><Icon size={20} /></div><p className="text-[10px] uppercase font-black text-gray-600 tracking-widest">{label}</p></div>
      <div><h4 className={cn("text-2xl font-black font-mono tracking-tighter", color)}>{value}</h4><p className="text-[10px] uppercase font-bold text-gray-700 mt-1">{sub}</p></div>
    </div>
  );
}

function StatusPill({ status }: any) {
  const configs: any = { 
    open: "bg-blue-500/10 text-blue-400", 
    in_progress: "bg-amber-500/10 text-amber-500",
    finalized: "bg-emerald-500/10 text-emerald-500" 
  };
  return <span className={cn("px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full", configs[status] || "bg-gray-500/10 text-gray-500")}>{status.replace('_', ' ')}</span>;
}

function AddAuditModal({ onClose, onSubmit }: any) {
  const { businessId } = usePersona();
  const supabase = createClient();
  const { register, handleSubmit, watch, setValue } = useForm({ 
    defaultValues: {
      label: `Stock Count ${new Date().toLocaleDateString()}`,
      scope: 'full',
      scopeDetails: [] as string[],
      notes: ''
    }
  });

  const selectedScope = watch('scope');
  const watchedDetails = watch('scopeDetails') || [];

  // Reset details when scope changes
  useEffect(() => {
    setValue('scopeDetails', []);
  }, [selectedScope, setValue]);

  // Fetch unique categories
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['sku_categories_audit', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skus')
        .select('category')
        .eq('business_id', businessId);
      if (error) throw error;
      const unique = Array.from(new Set((data || []).map((s: any) => s.category).filter(Boolean))) as string[];
      return unique;
    },
    enabled: !!businessId && selectedScope === 'category'
  });

  // Custom SKU search
  const [skuSearchTerm, setSkuSearchTerm] = useState("");
  const { data: searchedSkus = [], isLoading: isSkuSearching } = useQuery({
    queryKey: ['sku_search_audit', businessId, skuSearchTerm],
    queryFn: async () => {
      if (!skuSearchTerm || skuSearchTerm.length < 2) return [];
      const { data, error } = await supabase
        .from('skus')
        .select('id, name, sku_code')
        .eq('business_id', businessId)
        .ilike('name', `%${skuSearchTerm}%`)
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!businessId && skuSearchTerm.length >= 2 && selectedScope === 'custom'
  });

  // Fetch detailed info of selected custom SKUs for display
  const { data: selectedSkusList = [] } = useQuery({
    queryKey: ['selected_skus_details_audit', businessId, watchedDetails],
    queryFn: async () => {
      if (watchedDetails.length === 0) return [];
      const { data, error } = await supabase
        .from('skus')
        .select('id, name, sku_code')
        .in('id', watchedDetails);
      if (error) throw error;
      return data || [];
    },
    enabled: !!businessId && watchedDetails.length > 0 && selectedScope === 'custom'
  });

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCategoryToggle = (cat: string) => {
    if (watchedDetails.includes(cat)) {
      setValue('scopeDetails', watchedDetails.filter((c: string) => c !== cat));
    } else {
      setValue('scopeDetails', [...watchedDetails, cat]);
    }
  };

  const handleAddCustomSku = (sku: any) => {
    if (!watchedDetails.includes(sku.id)) {
      setValue('scopeDetails', [...watchedDetails, sku.id]);
    }
    setSkuSearchTerm("");
  };

  const handleRemoveCustomSku = (skuId: string) => {
    setValue('scopeDetails', watchedDetails.filter((id: string) => id !== skuId));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        onClick={e => e.stopPropagation()} 
        className="max-w-2xl w-full bg-[#1A1D21] border border-white/10 p-10 space-y-8 rounded-sm shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Establish Audit Session</h3>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Configure reconciliation parameters</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-sm transition-colors"><X size={20} className="text-gray-500" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Session Label</label>
                  <input {...register("label")} className="w-full bg-[#0F1113] border border-white/5 p-4 text-sm text-white focus:border-electric-blue outline-none rounded-sm transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Audit Scope</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'full', label: 'Full Inventory', sub: 'All SKUs in system' },
                      { id: 'category', label: 'By Category', sub: 'Selected categories only' },
                      { id: 'custom', label: 'Custom SKUs', sub: 'Specific manual selection' }
                    ].map(s => (
                      <button 
                        key={s.id}
                        type="button"
                        onClick={() => setValue('scope', s.id)}
                        className={cn(
                          "w-full text-left p-4 border transition-all flex justify-between items-center group",
                          selectedScope === s.id ? "bg-electric-blue border-electric-blue" : "bg-[#0F1113] border-white/5 hover:border-white/10"
                        )}
                      >
                        <div>
                          <p className={cn("text-[10px] font-black uppercase tracking-widest", selectedScope === s.id ? "text-onyx" : "text-white")}>{s.label}</p>
                          <p className={cn("text-[9px] font-bold uppercase", selectedScope === s.id ? "text-onyx/60" : "text-gray-600")}>{s.sub}</p>
                        </div>
                        <div className={cn("w-4 h-4 border flex items-center justify-center rounded-full", selectedScope === s.id ? "border-onyx bg-onyx" : "border-white/10")}>
                          {selectedScope === s.id && <div className="w-1.5 h-1.5 bg-electric-blue rounded-full" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
             </div>

             <div className="space-y-6">
                {selectedScope === 'category' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest block">Select Categories</label>
                    <div className="p-4 bg-[#0F1113] border border-white/5 min-h-[100px] max-h-[150px] overflow-y-auto custom-scrollbar space-y-2">
                      {isCategoriesLoading ? (
                        <p className="text-[9px] uppercase tracking-widest text-gray-600 animate-pulse font-bold">Loading Categories...</p>
                      ) : categories.length === 0 ? (
                        <p className="text-[9px] uppercase tracking-widest text-gray-600 italic font-bold">No categories found</p>
                      ) : (
                        categories.map((cat: string) => (
                          <label key={cat} className="flex items-center space-x-3 cursor-pointer text-xs text-gray-300 hover:text-white uppercase font-bold">
                            <input 
                              type="checkbox"
                              checked={watchedDetails.includes(cat)}
                              onChange={() => handleCategoryToggle(cat)}
                              className="rounded bg-black border-white/10 text-electric-blue focus:ring-0"
                            />
                            <span>{cat}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {selectedScope === 'custom' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest block">Custom SKU Selection</label>
                    <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                       <input 
                         placeholder="Type at least 2 chars to search..." 
                         value={skuSearchTerm}
                         onChange={(e) => setSkuSearchTerm(e.target.value)}
                         className="w-full bg-[#0F1113] border border-white/5 p-3 pl-10 text-xs text-white focus:border-electric-blue outline-none rounded-sm transition-all font-mono" 
                       />
                       {skuSearchTerm.length >= 2 && (
                         <div className="absolute top-full left-0 right-0 bg-[#1A1D21] border border-white/10 z-50 mt-1 shadow-2xl rounded-sm overflow-hidden divide-y divide-white/5">
                           {isSkuSearching ? (
                             <p className="p-3 text-[9px] uppercase text-gray-500 animate-pulse font-bold">Searching SKUs...</p>
                           ) : searchedSkus.length === 0 ? (
                             <p className="p-3 text-[9px] uppercase text-gray-500 font-bold italic">No matching SKUs found</p>
                           ) : (
                             searchedSkus.map((sku: any) => (
                               <button 
                                 key={sku.id}
                                 type="button"
                                 onClick={() => handleAddCustomSku(sku)}
                                 className="w-full px-4 py-3 text-left text-xs text-gray-300 hover:bg-electric-blue/10 hover:text-white transition-colors flex justify-between items-center"
                               >
                                 <span>{sku.name}</span>
                                 <span className="font-mono text-[9px] text-gray-500">{sku.sku_code}</span>
                               </button>
                             ))
                           )}
                         </div>
                       )}
                    </div>
                    <div className="p-4 bg-[#0F1113] border border-white/5 min-h-[100px] max-h-[150px] overflow-y-auto custom-scrollbar space-y-2">
                       {selectedSkusList.length === 0 ? (
                         <p className="text-[9px] text-gray-600 italic uppercase font-bold text-center mt-6">Search and select SKUs above</p>
                       ) : (
                         selectedSkusList.map((sku: any) => (
                           <div key={sku.id} className="flex justify-between items-center bg-white/5 px-3 py-1.5 rounded-sm">
                             <div className="flex flex-col">
                               <span className="text-[10px] font-bold text-white uppercase">{sku.name}</span>
                               <span className="text-[8px] font-mono text-gray-500 mt-0.5">{sku.sku_code}</span>
                             </div>
                             <button 
                               type="button" 
                               onClick={() => handleRemoveCustomSku(sku.id)} 
                               className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-red-500 transition-colors"
                             >
                               <X size={12} />
                             </button>
                           </div>
                         ))
                       )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Audit Notes (Optional)</label>
                  <textarea {...register("notes")} placeholder="Explain the purpose of this audit..." className="w-full bg-[#0F1113] border border-white/5 p-4 text-xs text-white focus:border-electric-blue outline-none rounded-sm min-h-[120px] resize-none" />
                </div>
             </div>
          </div>

          <button type="submit" className="w-full py-5 bg-electric-blue text-onyx text-[10px] font-black uppercase tracking-[0.2em] hover:brightness-110 transition-all rounded-sm shadow-[0_20px_40px_rgba(0,112,243,0.2)]">
            Start Counting →
          </button>
        </form>
      </motion.div>
    </div>
  );
}
