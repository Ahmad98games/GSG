"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  ShieldCheck, ArrowRight, FileText, 
  CreditCard, Clock, Landmark,
  Package, Truck, HelpCircle
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

export default function ClientPortalLandingPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const businessSlug = params.businessSlug as string;
  const toast = useToast();

  const { data: business, isLoading } = useQuery({
    queryKey: ['portal_business', businessSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('slug', businessSlug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!businessSlug
  });

  if (isLoading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.5em] text-gray-800">Authenticating Portal Access...</div>;
  if (!business) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white uppercase tracking-widest text-xs font-black">Portal Context Undefined</div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-inter selection:bg-[#C5A059] selection:text-black">
      <header className="h-20 border-b border-white/5 flex items-center px-12 justify-between bg-black/50 backdrop-blur-xl sticky top-0 z-50">
         <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-[#C5A059] flex items-center justify-center">
               <img src="/logos/noxis.png" alt="Noxis" className="w-6 h-6 invert" />
            </div>
            <div>
               <h1 className="text-sm font-black uppercase tracking-tighter leading-none">{business.business_name}</h1>
               <p className="text-[9px] font-black text-[#C5A059] uppercase tracking-widest mt-1">Industrial Client Portal</p>
            </div>
         </div>
         <div className="flex items-center space-x-8">
            <nav className="hidden md:flex items-center space-x-6 text-[10px] font-black uppercase tracking-widest text-gray-500">
               <Link href={`/portal/${businessSlug}`} className="text-white">Dashboard</Link>
               <Link href={`/portal/${businessSlug}/invoices`} className="hover:text-white transition-colors">Documents</Link>
               <button 
                 onClick={() => toast.info("Support Hub", "Logistics Support node is currently offline. Please contact via WhatsApp.")} 
                 className="hover:text-white transition-colors bg-transparent border-none text-[10px] font-black uppercase tracking-widest cursor-pointer"
               >
                 Support
               </button>
            </nav>
            <button 
              onClick={() => { router.push("/"); }}
              className="px-6 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all cursor-pointer"
            >
              Sign Out
            </button>
         </div>
      </header>

      <main className="max-w-7xl mx-auto p-12 space-y-16">
         <section className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
               <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 rounded-full">
                  <ShieldCheck size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Secure Industrial Link Verified</span>
               </div>
               <h2 className="text-6xl font-black uppercase tracking-tighter leading-[0.9]">Welcome to your <br/> <span className="text-gray-600">Operations Hub.</span></h2>
               <p className="text-gray-500 max-w-xl text-lg font-medium leading-relaxed">
                  Real-time visibility into your orders, invoices, and logistics streams. Managed and secured by Noxis Hub.
               </p>
            </motion.div>
         </section>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PortalCard 
               title="My Invoices" 
               desc="Access all current and historical commercial documents and payment statuses." 
               icon={FileText} 
               onClick={() => router.push(`/portal/${businessSlug}/invoices`)}
            />
            <PortalCard 
               title="Order Tracking" 
               desc="Monitor the real-time production and dispatch status of your active shipments." 
               icon={Package} 
               onClick={() => toast.info("Order Tracking", "Order Tracking telemetry stream is currently synchronizing.")}
            />
            <PortalCard 
               title="Payment Methods" 
               desc="Configure secure industrial payment gateways for automated reconciliation." 
               icon={Landmark} 
               onClick={() => toast.info("Payment Gateways", "Secure Industrial Ledger Gateways are coming soon.")}
            />
         </div>

          <section className="bg-[#111111] border border-white/5 p-12 flex flex-col md:flex-row items-center justify-between">
             <div className="space-y-2 mb-8 md:mb-0">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Need Technical Assistance?</h3>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Our logistics support team is active 24/7 on the mesh.</p>
             </div>
             <button 
               onClick={() => toast.info("Support Node", "Live chat interface is offline. Contact local operator directly via WhatsApp.")}
               className="px-10 py-4 bg-[#C5A059] text-black text-[11px] font-black uppercase tracking-[0.2em] hover:brightness-110 shadow-2xl transition-all cursor-pointer"
             >
               Open Support Node
             </button>
          </section>
       </main>

       <footer className="p-12 border-t border-white/5 opacity-30">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
             <p className="text-[10px] font-bold uppercase tracking-widest">© 2026 Omnora Labs • Noxis Industrial Ecosystem</p>
             <div className="flex items-center space-x-6 text-[10px] font-bold uppercase tracking-widest">
                <Link href="/privacy">Privacy Protocol</Link>
                <Link href="/privacy">Service Terms</Link>
                <Link href="/docs#data-safety">Security Audit</Link>
             </div>
          </div>
      </footer>
    </div>
  );
}

function PortalCard({ title, desc, icon: Icon, onClick }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="bg-[#111111] border border-white/5 p-8 space-y-8 cursor-pointer group hover:border-[#C5A059]/30 transition-all"
    >
       <div className="p-4 bg-white/5 text-gray-400 group-hover:bg-[#C5A059]/10 group-hover:text-[#C5A059] transition-all inline-block">
          <Icon size={24} />
       </div>
       <div className="space-y-3">
          <h4 className="text-xl font-black uppercase tracking-tight">{title}</h4>
          <p className="text-sm text-gray-500 font-medium leading-relaxed">{desc}</p>
       </div>
       <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-700 group-hover:text-white transition-colors pt-4">
          <span>Access Node</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
       </div>
    </motion.div>
  );
}
