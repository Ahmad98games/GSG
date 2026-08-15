"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Handshake, Plus, Search, 
  ExternalLink, Trash2, Mail, Phone,
  XCircle, Loader2,
  ArrowLeft
} from "lucide-react";

import { useSidebarState } from "@/hooks/useSidebarState";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { usePersona } from "@/hooks/usePersona";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import { humanizeError } from "@/lib/utils/errors";

interface Partner {
  id: string;
  partner_name: string;
  partner_industry: string;
  relationship_type: 'vendor' | 'client' | 'logistics' | 'agent' | 'contractor';
  status: 'active' | 'on_hold' | 'terminated';
  contact_person: string;
  email: string;
  phone: string;
}

export default function PartnersSettingsPage() {
  const { businessId } = usePersona();
  const supabase = createClient();
  const toast = useToast();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<Partner>>({
    partner_name: "",
    relationship_type: "vendor",
    status: "active"
  });

  const fetchPartners = useCallback(async () => {
    if (!businessId) return;
    const { data, error } = await supabase
      .from('business_partners')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (!error) setPartners(data || []);
    setLoading(false);
  }, [businessId, supabase]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('business_partners')
      .insert([{ ...formData, business_id: businessId }]);

    if (!error) {
      setShowModal(false);
      setFormData({ partner_name: "", relationship_type: "vendor", status: "active" });
      fetchPartners();
    } else {
      toast.error("Failed to add partner", humanizeError(error, 'partner'));
    }
    setIsSubmitting(false);
  };

  const deletePartner = async (id: string) => {
    if (!confirm("Are you sure you want to terminate this partnership registry?")) return;
    const { error } = await supabase
      .from('business_partners')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchPartners();
    } else {
      toast.error("Failed to terminate partnership", humanizeError(error, 'terminate partnership'));
    }
  };

  const filteredPartners = partners.filter(p => 
    p.partner_name.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  

  return (
    <div className="min-h-screen bg-black text-slate-200 font-inter flex">
      
      
      <main className={cn( "flex-1 transition-all duration-300 min-h-screen flex flex-col")}>
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-40">
           <Link href="/settings" className="mr-6 p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all">
              <ArrowLeft size={18} />
           </Link>
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-sandstone-gold/10 text-sandstone-gold rounded-sm">
                 <Handshake size={18} />
              </div>
              <div>
                 <h1 className="text-sm font-black uppercase tracking-widest text-white">Strategic Partners</h1>
                 <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Global collaboration & supply chain mesh</p>
              </div>
           </div>
           
           <button 
             onClick={() => setShowModal(true)}
             className="ml-auto flex items-center space-x-2 px-6 py-2 bg-sandstone-gold text-onyx text-[10px] uppercase tracking-widest font-black transition-all hover:brightness-110"
           >
              <Plus size={14} />
              <span>Onboard Partner</span>
           </button>
        </header>

        <div className="flex-1 p-8 max-w-[1200px] mx-auto w-full space-y-6">
           <div className="flex items-center space-x-4 bg-white/5 border border-white/5 p-4 rounded-sm">
              <Search className="text-slate-600" size={18} />
              <input 
                type="text" 
                placeholder="Search partners by name or identity..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-slate-600 font-bold uppercase tracking-widest"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full py-20 text-center text-slate-700 animate-pulse font-mono text-[10px] uppercase tracking-[0.5em]">
                   Scanning Partnership Registry...
                </div>
              ) : filteredPartners.length === 0 ? (
                <div className="col-span-full py-20 text-center space-y-4">
                   <Users size={48} className="mx-auto text-slate-800" strokeWidth={1} />
                   <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">No strategic partners found</p>
                </div>
              ) : filteredPartners.map(partner => (
                <motion.div 
                  layout
                  key={partner.id}
                  className="bg-surface border border-white/5 p-6 rounded-sm space-y-6 hover:border-sandstone-gold/30 transition-all group"
                >
                   <div className="flex justify-between items-start">
                      <div className="space-y-1">
                         <h3 className="text-white font-bold uppercase tracking-tight">{partner.partner_name}</h3>
                         <div className="flex items-center gap-2">
                            <span className="text-[8px] px-1.5 py-0.5 bg-white/5 text-slate-500 font-black uppercase rounded-[2px]">{partner.relationship_type}</span>
                            <span className={cn(
                               "text-[8px] font-black uppercase tracking-widest",
                               partner.status === 'active' ? "text-emerald" : "text-amber-500"
                            )}>{partner.status}</span>
                         </div>
                      </div>
                      <div className="flex gap-1">
                         <button onClick={() => deletePartner(partner.id)} className="p-2 text-slate-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={14} />
                         </button>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <div className="flex items-center gap-3 text-slate-400">
                         <Mail size={14} />
                         <span className="text-[10px] font-mono">{partner.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400">
                         <Phone size={14} />
                         <span className="text-[10px] font-mono">{partner.phone || 'N/A'}</span>
                      </div>
                   </div>

                   <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                         <span className="text-[9px] font-black text-slate-600 uppercase">Mesh Active</span>
                      </div>
                      <button className="text-[9px] font-black uppercase text-sandstone-gold flex items-center gap-1 hover:underline">
                         View Dossier <ExternalLink size={10} />
                      </button>
                   </div>
                </motion.div>
              ))}
           </div>
        </div>
      </main>

      {/* Onboarding Modal */}
      <AnimatePresence>
         {showModal && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/60">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-onyx border border-white/10 w-full max-w-md p-8 rounded-sm shadow-2xl space-y-8"
              >
                 <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Partner Onboarding</h3>
                    <button onClick={() => setShowModal(false)} className="text-slate-600 hover:text-white transition-all">
                       <XCircle size={20} />
                    </button>
                 </div>

                 <form onSubmit={handleAddPartner} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Partner Legal Name</label>
                       <input 
                         required
                         value={formData.partner_name}
                         onChange={e => setFormData({...formData, partner_name: e.target.value})}
                         className="w-full bg-black/50 border border-white/10 px-4 py-3 text-sm text-white focus:border-sandstone-gold transition-all outline-none" 
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Relationship</label>
                          <select 
                            value={formData.relationship_type}
                            onChange={e => setFormData({...formData, relationship_type: e.target.value as Partner['relationship_type']})}
                            className="w-full bg-black/50 border border-white/10 px-4 py-3 text-xs text-white outline-none"
                          >
                             <option value="vendor">Vendor / Supplier</option>
                             <option value="client">Client / Buyer</option>
                             <option value="logistics">Logistics Provider</option>
                             <option value="agent">Sales Agent</option>
                             <option value="contractor">Sub-Contractor</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Industry</label>
                          <input 
                            value={formData.partner_industry || ''}
                            onChange={e => setFormData({...formData, partner_industry: e.target.value})}
                            className="w-full bg-black/50 border border-white/10 px-4 py-3 text-xs text-white" 
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Email Address</label>
                       <input 
                         type="email"
                         value={formData.email}
                         onChange={e => setFormData({...formData, email: e.target.value})}
                         className="w-full bg-black/50 border border-white/10 px-4 py-3 text-xs text-white" 
                       />
                    </div>

                    <div className="pt-4 flex gap-4">
                       <button 
                         type="button" 
                         onClick={() => setShowModal(false)}
                         className="flex-1 py-3 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                       >
                          Cancel
                       </button>
                       <button 
                         type="submit"
                         disabled={isSubmitting}
                         className="flex-1 py-3 bg-sandstone-gold text-onyx text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
                       >
                          {isSubmitting ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Commit Registry"}
                       </button>
                    </div>
                 </form>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
}
