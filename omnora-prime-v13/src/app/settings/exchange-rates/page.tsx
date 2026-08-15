"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, Plus, Search, Filter,
  TrendingUp, TrendingDown, Clock,
  History, ShieldCheck, X, Save,
  RefreshCw, DollarSign
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";

import { useSidebarState } from "@/hooks/useSidebarState";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";

const CURRENCIES = ['PKR', 'USD', 'AED', 'GBP', 'EUR', 'CNY'];

export default function ExchangeRatesPage() {
  const { isCollapsed } = useSidebarState();
  const { businessId } = usePersona();
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['exchange_rates', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('business_id', businessId)
        .order('effective_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!businessId
  });

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter">
      
      
      <main className={cn( "transition-all duration-300 min-h-screen flex flex-col")}>
        <header className="h-20 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex flex-col">
            <h1 className="text-xl font-black uppercase tracking-tighter text-white">
              Exchange Rates
            </h1>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">Global Currency Mesh • Multi-Entity Ledger</p>
          </div>

          <div className="ml-auto flex items-center space-x-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 px-6 py-2.5 bg-[#0070F3] text-white text-[10px] uppercase tracking-widest font-black hover:brightness-110 shadow-lg transition-all"
            >
               <Plus size={14} />
               <span>Add Exchange Rate</span>
            </button>
          </div>
        </header>

        <div className="p-8 max-w-[1200px] mx-auto w-full space-y-8">
           <section className="bg-[#1A1D21] border border-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                 <h2 className="text-[10px] uppercase font-black text-gray-500 tracking-widest text-white">Historical Currency Pairs</h2>
                 <div className="flex items-center space-x-2 text-[9px] font-bold text-gray-600 uppercase">
                    <Clock size={12} />
                    <span>Real-time Sync Active</span>
                 </div>
              </div>
              
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-[#0F1113] text-[9px] uppercase font-black text-gray-600 tracking-widest border-b border-white/5">
                          <th className="px-6 py-4">From Currency</th>
                          <th className="px-6 py-4">To Currency</th>
                          <th className="px-6 py-4 text-center">Conversion Rate</th>
                          <th className="px-6 py-4">Effective Date</th>
                          <th className="px-6 py-4">Source</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {isLoading ? (
                         <tr><td colSpan={5} className="p-20 text-center animate-pulse uppercase tracking-[0.3em] text-gray-700 text-[10px]">Scanning Rate Matrix...</td></tr>
                       ) : rates.length === 0 ? (
                         <tr><td colSpan={5} className="p-20 text-center italic text-gray-600 uppercase tracking-widest text-[10px]">No exchange rates documented</td></tr>
                       ) : rates.map((rate: any) => (
                         <tr key={rate.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="px-6 py-4">
                               <div className="flex items-center space-x-2">
                                  <div className="w-6 h-4 bg-white/5 flex items-center justify-center text-[8px] font-black">{rate.from_currency}</div>
                                  <span className="text-xs font-bold text-white uppercase">{rate.from_currency}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex items-center space-x-2">
                                  <div className="w-6 h-4 bg-white/5 flex items-center justify-center text-[8px] font-black">{rate.to_currency}</div>
                                  <span className="text-xs font-bold text-white uppercase">{rate.to_currency}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <span className="text-sm font-black font-mono text-emerald-500">
                                  {Number(rate.rate).toFixed(6)}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-[10px] text-gray-500 font-bold uppercase">
                               {rate.effective_date}
                            </td>
                            <td className="px-6 py-4">
                               <span className="px-2 py-0.5 bg-white/5 text-[8px] font-black text-gray-500 uppercase rounded-sm border border-white/5">
                                  {rate.source}
                               </span>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </section>
        </div>
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-[#1A1D21] border border-white/10 w-full max-w-md shadow-2xl p-8 space-y-8"
             >
                <div className="flex justify-between items-start">
                   <div className="space-y-1">
                      <h3 className="text-lg font-black uppercase tracking-widest text-white">New Rate Definition</h3>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Update Financial Transformation Layer</p>
                   </div>
                   <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-all"><X size={20} /></button>
                </div>

                <AddRateForm businessId={businessId} onSuccess={() => {
                   queryClient.invalidateQueries({ queryKey: ['exchange_rates'] });
                   setIsModalOpen(false);
                }} />
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddRateForm({ businessId, onSuccess }: any) {
  const supabase = createClient();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const onSubmit = async (data: any) => {
    const { error } = await supabase.from('exchange_rates').insert({
       business_id: businessId,
       from_currency: data.from,
       to_currency: data.to,
       rate: Number(data.rate),
       effective_date: data.date,
       source: 'manual'
    });

    if (!error) {
       onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
       <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
             <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest">From</label>
             <select {...register('from')} className="w-full bg-[#0F1113] border border-white/10 px-4 py-3 text-xs text-white outline-none focus:border-[#0070F3]">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>
          <div className="space-y-1">
             <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest">To</label>
             <select {...register('to')} className="w-full bg-[#0F1113] border border-white/10 px-4 py-3 text-xs text-white outline-none focus:border-[#0070F3]">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>
       </div>

       <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Exchange Rate</label>
          <input 
             type="number" 
             step="0.000001" 
             {...register('rate')} 
             className="w-full bg-[#0F1113] border border-white/10 px-4 py-3 text-sm font-black font-mono text-emerald-500 outline-none focus:border-[#0070F3]" 
             placeholder="1.000000"
          />
       </div>

       <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Effective Date</label>
          <input 
             type="date" 
             {...register('date')} 
             className="w-full bg-[#0F1113] border border-white/10 px-4 py-3 text-xs text-white outline-none focus:border-[#0070F3]" 
             defaultValue={new Date().toISOString().split('T')[0]}
          />
       </div>

       <button 
         type="submit" 
         disabled={isSubmitting}
         className="w-full py-4 bg-[#0070F3] text-white text-xs font-black uppercase tracking-[0.3em] hover:brightness-110 shadow-xl transition-all disabled:opacity-50"
       >
          {isSubmitting ? 'Processing...' : 'Authorize Rate Posting'}
       </button>
    </form>
  );
}
