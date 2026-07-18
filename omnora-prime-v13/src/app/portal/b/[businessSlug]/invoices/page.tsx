"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  FileText, Download, ArrowLeft, 
  Search, Filter, Calendar,
  CreditCard, CheckCircle2, Clock
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function ClientPortalInvoicesPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const businessSlug = params.businessSlug as string;

  const { data: business } = useQuery({
    queryKey: ['portal_business', businessSlug],
    queryFn: async () => {
      const { data, error } = await supabase.from('business_profiles').select('*').eq('slug', businessSlug).single();
      if (error) throw error;
      return data;
    }
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['portal_invoices', business?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('business_id', business?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!business?.id
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-inter">
      <header className="h-20 border-b border-white/5 flex items-center px-12 justify-between bg-black/50 backdrop-blur-xl sticky top-0 z-50">
         <div className="flex items-center space-x-4">
            <button onClick={() => router.push(`/portal/b/${businessSlug}`)} className="p-2 hover:bg-white/5 text-gray-500 hover:text-white transition-all mr-2">
               <ArrowLeft size={20} />
            </button>
            <div>
               <h1 className="text-sm font-black uppercase tracking-tighter leading-none">Commercial Invoices</h1>
               <p className="text-[9px] font-black text-[#C5A059] uppercase tracking-widest mt-1">{business?.business_name}</p>
            </div>
         </div>
      </header>

      <main className="max-w-7xl mx-auto p-12 space-y-12">
         <div className="flex items-center justify-between">
            <div className="space-y-1">
               <h2 className="text-3xl font-black uppercase tracking-tighter">Billing Records</h2>
               <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Historical archive of all industrial transactions.</p>
            </div>
            <div className="flex items-center space-x-4">
               <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input type="text" placeholder="Search Ref No..." className="bg-white/5 border border-white/10 pl-10 pr-4 py-2 text-[10px] uppercase font-bold text-white outline-none focus:border-[#C5A059] w-48" />
               </div>
            </div>
         </div>

         {isLoading ? (
           <div className="py-40 text-center font-mono text-[10px] uppercase tracking-[0.5em] text-gray-800 animate-pulse">Syncing Document Store...</div>
         ) : invoices.length === 0 ? (
           <div className="h-96 flex flex-col items-center justify-center opacity-20 italic">
              <FileText size={60} strokeWidth={0.5} />
              <p className="text-[10px] uppercase tracking-widest mt-4">No billing records found in your portal context</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 gap-4">
              {invoices.map((inv: any) => (
                <motion.div 
                  key={inv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#111111] border border-white/5 p-6 hover:border-[#C5A059]/20 transition-all group flex items-center justify-between"
                >
                   <div className="flex items-center space-x-6">
                      <div className="w-12 h-12 bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-[#C5A059] transition-colors">
                         <FileText size={20} />
                      </div>
                      <div className="space-y-1">
                         <h4 className="text-sm font-black font-mono tracking-tighter">{inv.invoice_no}</h4>
                         <div className="flex items-center space-x-4 text-[9px] font-black uppercase tracking-widest text-gray-600">
                            <span className="flex items-center space-x-1"><Calendar size={10} /> <span>{new Date(inv.issue_date).toLocaleDateString()}</span></span>
                            <span className={cn(
                              "flex items-center space-x-1",
                              inv.status === 'paid' ? "text-emerald-500" : "text-amber-500"
                            )}>
                               {inv.status === 'paid' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                               <span>{inv.status}</span>
                            </span>
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center space-x-12">
                      <div className="text-right space-y-1">
                         <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">Amount Due</p>
                         <p className="text-lg font-black font-mono tracking-tighter">{(inv.total).toLocaleString('en-US', { style: 'currency', currency: 'PKR' })}</p>
                      </div>
                      <button className="p-3 bg-white/5 hover:bg-[#C5A059] hover:text-black transition-all rounded-sm">
                         <Download size={18} />
                      </button>
                   </div>
                </motion.div>
              ))}
           </div>
         )}
      </main>
    </div>
  );
}
