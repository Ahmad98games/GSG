"use client";
import { useEffect, useState } from 'react';
import React from 'react';
// app/portal-manager/page.tsx
import { 
  Users, Globe, Shield, Mail, ToggleLeft, 
  ToggleRight, Search, Plus, Loader2, AlertCircle, 
  ExternalLink, UserCheck, UserPlus, CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function PortalManagerPage() {
  const supabase = createClient();
  const [customers, setCustomers] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    partyId: "",
    email: "",
    name: ""
  });

   useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // 1. Fetch portal customers
    const { data: portalData } = await supabase
      .from("portal_customers")
      .select("*, party:parties(name)");

    // 2. Fetch parties not yet in portal
    const { data: partiesData } = await supabase
      .from("parties")
      .select("id, name")
      .eq("party_type", "customer");

    if (portalData) setCustomers(portalData);
    if (partiesData) setParties(partiesData);
    setLoading(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);

    try {
      const selectedParty = parties.find(p => p.id === formData.partyId);
      
      const { error } = await supabase
        .from("portal_customers")
        .insert({
          business_id: (await supabase.auth.getUser()).data.user?.user_metadata?.business_id, // Get current business ID
          party_id: formData.partyId,
          email: formData.email,
          name: formData.name || selectedParty?.name,
          portal_enabled: true
        });

      if (error) throw error;

      setShowInviteModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setInviting(false);
    }
  };

  const toggleStatus = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("portal_customers")
      .update({ portal_enabled: !current })
      .eq("id", id);

    if (error) alert(error.message);
    else fetchData();
  };

  return (
    <div className="bg-onyx min-h-screen text-gray-300 font-inter p-12 selection:bg-electric-blue selection:text-onyx">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex justify-between items-end">
           <div>
              <div className="flex items-center space-x-3 mb-2">
                 <Globe className="text-electric-blue" size={24} />
                 <h1 className="text-4xl font-bold text-white tracking-tighter">Portal Management</h1>
              </div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                Configure client-facing access and self-service settlements
              </p>
           </div>
           <button 
             onClick={() => setShowInviteModal(true)}
             className="bg-electric-blue text-onyx px-8 py-3 font-bold uppercase tracking-widest text-[10px] flex items-center rounded-sm hover:brightness-110 transition-all"
           >
              <UserPlus size={14} className="mr-2" /> Invite New Customer
           </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-6 bg-surface border border-white/5 p-6 rounded-sm">
           <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
              <input 
                placeholder="Filter by customer name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-onyx border border-white/10 p-4 pl-12 text-sm outline-none focus:border-electric-blue transition-all"
              />
           </div>
           <div className="flex items-center space-x-4">
              <div className="text-right">
                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Global Status</p>
                 <p className="text-xs text-white font-bold">Portal Active</p>
              </div>
              <div className="w-12 h-6 bg-emerald/20 border border-emerald/30 rounded-full relative">
                 <div className="absolute right-1 top-1 w-4 h-4 bg-emerald rounded-full" />
              </div>
           </div>
        </div>

        {/* Customer List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {loading ? (
             Array(3).fill(0).map((_, i) => <div key={i} className="h-48 bg-surface border border-white/5 animate-pulse rounded-sm" />)
           ) : customers.length === 0 ? (
             <div className="col-span-full py-20 text-center bg-surface/30 border border-white/5 rounded-sm">
                <Users size={48} className="mx-auto text-gray-700 mb-4" />
                <h3 className="text-lg font-bold text-gray-500 uppercase tracking-widest">No customers invited to portal</h3>
                <p className="text-sm text-gray-600 mt-2">Start by inviting your customers to view their invoices online.</p>
             </div>
           ) : (
             customers.map(cust => (
               <motion.div 
                 key={cust.id}
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="bg-surface border border-white/10 p-8 rounded-sm space-y-6 hover:border-white/20 transition-all relative overflow-hidden group"
               >
                  <div className={`absolute top-0 left-0 w-1 h-full ${cust.portal_enabled ? 'bg-emerald' : 'bg-red-500'}`} />
                  
                  <div className="flex justify-between items-start">
                     <div className="space-y-1">
                        <h4 className="text-lg font-bold text-white tracking-tight">{cust.name}</h4>
                        <p className="text-[10px] text-electric-blue font-bold uppercase tracking-widest">{cust.party?.name}</p>
                     </div>
                     <button 
                       onClick={() => toggleStatus(cust.id, cust.portal_enabled)}
                       className={`transition-colors ${cust.portal_enabled ? 'text-emerald' : 'text-gray-700'}`}
                     >
                        {cust.portal_enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                     </button>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/5">
                     <div className="flex items-center text-[11px] space-x-3 text-gray-500">
                        <Mail size={14} />
                        <span>{cust.email}</span>
                     </div>
                     <div className="flex items-center text-[11px] space-x-3 text-gray-500">
                        <Shield size={14} />
                        <span>Last Login: {cust.last_login ? new Date(cust.last_login).toLocaleString() : 'Never'}</span>
                     </div>
                  </div>

                  <div className="flex space-x-3">
                     <button className="flex-1 bg-white/5 hover:bg-white/10 text-white p-3 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center">
                        <ExternalLink size={12} className="mr-2" /> View Portal
                     </button>
                     <button className="flex-1 bg-white/5 hover:bg-white/10 text-white p-3 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center">
                        <CreditCard size={12} className="mr-2" /> Ledger
                     </button>
                  </div>
               </motion.div>
             ))
           )}
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
         {showInviteModal && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-onyx/80 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-surface border border-white/10 w-full max-w-lg rounded-sm shadow-2xl relative overflow-hidden p-8"
              >
                 <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-white tracking-tighter">Invite Customer</h2>
                    <button onClick={() => setShowInviteModal(false)} className="text-gray-600 hover:text-white transition-colors">
                       <X size={20} />
                    </button>
                 </div>

                 <form onSubmit={handleInvite} className="space-y-6">
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Select Linked Party</label>
                       <select 
                         required
                         className="w-full bg-onyx border border-white/10 p-4 text-sm text-white focus:border-electric-blue outline-none"
                         value={formData.partyId}
                         onChange={e => setFormData({...formData, partyId: e.target.value})}
                       >
                          <option value="">Choose a customer party...</option>
                          {parties.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                       </select>
                    </div>

                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Contact Name</label>
                       <input 
                         className="w-full bg-onyx border border-white/10 p-4 text-sm text-white focus:border-electric-blue outline-none"
                         value={formData.name}
                         onChange={e => setFormData({...formData, name: e.target.value})}
                       />
                    </div>

                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Portal Email</label>
                       <input 
                         required
                         type="email"
                         className="w-full bg-onyx border border-white/10 p-4 text-sm text-white focus:border-electric-blue outline-none"
                         value={formData.email}
                         onChange={e => setFormData({...formData, email: e.target.value})}
                       />
                    </div>

                    <button 
                      disabled={inviting}
                      className="w-full bg-electric-blue text-onyx py-5 font-bold uppercase tracking-widest text-[11px] flex items-center justify-center rounded-sm transition-all hover:brightness-110 disabled:opacity-50"
                    >
                       {inviting ? <Loader2 size={16} className="animate-spin" /> : (
                         <><UserCheck size={16} className="mr-2" /> Issue Portal Access</>
                       )}
                    </button>
                 </form>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
}

function X({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

