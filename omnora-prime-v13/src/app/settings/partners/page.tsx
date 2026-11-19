"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Handshake, Plus, Search, 
  Trash2, Mail, Phone,
  XCircle, Loader2,
  ArrowLeft, MessageSquare, CheckCircle2,
  Building, Truck, ShieldCheck, Factory, Briefcase
} from "lucide-react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { usePersona } from "@/hooks/usePersona";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";

export interface Partner {
  id: string;
  partner_name: string;
  partner_industry: string;
  relationship_type: 'vendor' | 'client' | 'logistics' | 'agent' | 'contractor';
  status: 'active' | 'on_hold' | 'terminated';
  contact_person: string;
  email: string;
  phone: string;
  address?: string;
}

const DEFAULT_BENCHMARK_PARTNERS: Partner[] = [
  {
    id: "part_01",
    partner_name: "Al-Karam Textile Mills Ltd",
    partner_industry: "Fabric & Cotton Yarn Supply",
    relationship_type: "vendor",
    status: "active",
    contact_person: "Haji Munir Ahmed",
    email: "procurement@alkaram-textile.pk",
    phone: "+92 300 8472911",
    address: "Plot 18, SITE Industrial Area, Karachi"
  },
  {
    id: "part_02",
    partner_name: "TCS Express & Freight Logistics",
    partner_industry: "Inter-City Cargo & Dispatch",
    relationship_type: "logistics",
    status: "active",
    contact_person: "Noman Siddiqui",
    email: "corporate.dispatch@tcs.com.pk",
    phone: "+92 321 9283741",
    address: "Cargo Terminal Hub, Lahore / Karachi Expressway"
  },
  {
    id: "part_03",
    partner_name: "Sitara Dyeing & Washing Plant",
    partner_industry: "Industrial Fabric Finishing",
    relationship_type: "contractor",
    status: "active",
    contact_person: "Ustad Tariq Mehmood",
    email: "washing.dyeing@sitaratex.com",
    phone: "+92 333 4819203",
    address: "Samundri Road, Faisalabad"
  },
  {
    id: "part_04",
    partner_name: "Metro Wholesale & Export Hub",
    partner_industry: "B2B Bulk Garments Distribution",
    relationship_type: "client",
    status: "active",
    contact_person: "Khurram Shehzad",
    email: "orders@metrowholesale.pk",
    phone: "+92 301 5566778",
    address: "Boulton Market, M.A. Jinnah Road, Karachi"
  },
  {
    id: "part_05",
    partner_name: "Pak YKK Trims, Buttons & Zippers",
    partner_industry: "Haberdashery & Accessories",
    relationship_type: "vendor",
    status: "active",
    contact_person: "Muhammad Imran",
    email: "sales@pakaccessories.com",
    phone: "+92 345 1122334",
    address: "Shah Alam Market, Lahore"
  }
];

export default function PartnersSettingsPage() {
  const { businessId } = usePersona();
  const supabase = createClient();
  const toast = useToast();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [relationshipFilter, setRelationshipFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<Partner>>({
    partner_name: "",
    partner_industry: "Textile & Garments",
    relationship_type: "vendor",
    status: "active",
    contact_person: "",
    email: "",
    phone: "",
    address: ""
  });

  // Local storage helper
  const getStorageKey = useCallback(() => {
    return `noxis_partners_registry_${businessId || 'local'}`;
  }, [businessId]);

  const saveToLocal = useCallback((items: Partner[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(getStorageKey(), JSON.stringify(items));
      } catch (err) {
        console.warn('[Partners] Storage save error:', err);
      }
    }
  }, [getStorageKey]);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    let cached: Partner[] = [];
    
    // 1. Check local storage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(getStorageKey());
        if (raw) {
          cached = JSON.parse(raw);
        }
      } catch {}
    }

    if (cached && cached.length > 0) {
      setPartners(cached);
      setLoading(false);
    } else {
      // Pre-seed with industrial benchmark partners
      setPartners(DEFAULT_BENCHMARK_PARTNERS);
      saveToLocal(DEFAULT_BENCHMARK_PARTNERS);
      setLoading(false);
    }

    // 2. Background sync with Supabase if online
    if (businessId && businessId !== 'local') {
      try {
        const { data, error } = await supabase
          .from('business_partners')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setPartners(data);
          saveToLocal(data);
        }
      } catch {
        // Safe offline fallback
      }
    }
  }, [businessId, getStorageKey, saveToLocal, supabase]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partner_name?.trim()) return;

    setIsSubmitting(true);
    const newPartner: Partner = {
      id: "part_" + Date.now(),
      partner_name: formData.partner_name.trim(),
      partner_industry: formData.partner_industry?.trim() || "General Industry",
      relationship_type: (formData.relationship_type as any) || "vendor",
      status: (formData.status as any) || "active",
      contact_person: formData.contact_person?.trim() || "Key Representative",
      email: formData.email?.trim() || "",
      phone: formData.phone?.trim() || "",
      address: formData.address?.trim() || ""
    };

    const updated = [newPartner, ...partners];
    setPartners(updated);
    saveToLocal(updated);
    setShowModal(false);
    setFormData({
      partner_name: "",
      partner_industry: "Textile & Garments",
      relationship_type: "vendor",
      status: "active",
      contact_person: "",
      email: "",
      phone: "",
      address: ""
    });
    setIsSubmitting(false);
    toast.success("Partner Onboarded", `${newPartner.partner_name} added to supply chain mesh.`);

    // Background sync
    if (businessId && businessId !== 'local') {
      try {
        await supabase
          .from('business_partners')
          .insert([{ ...newPartner, business_id: businessId }]);
      } catch {}
    }
  };

  const deletePartner = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your partner registry?`)) return;
    const updated = partners.filter(p => p.id !== id);
    setPartners(updated);
    saveToLocal(updated);
    toast.success("Partner Removed", `${name} removed from registry.`);

    if (businessId && businessId !== 'local') {
      try {
        await supabase
          .from('business_partners')
          .delete()
          .eq('id', id);
      } catch {}
    }
  };

  const togglePartnerStatus = async (id: string) => {
    const updated = partners.map(p => {
      if (p.id !== id) return p;
      const nextStatus = p.status === 'active' ? 'on_hold' : 'active';
      return { ...p, status: nextStatus as any };
    });
    setPartners(updated);
    saveToLocal(updated);
    toast.success("Status Updated", "Partner operational status changed.");

    if (businessId && businessId !== 'local') {
      const p = updated.find(x => x.id === id);
      if (p) {
        try {
          await supabase
            .from('business_partners')
            .update({ status: p.status })
            .eq('id', id);
        } catch {}
      }
    }
  };

  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      const matchesSearch = 
        p.partner_name.toLowerCase().includes(search.toLowerCase()) ||
        p.partner_industry.toLowerCase().includes(search.toLowerCase()) ||
        p.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
        p.phone?.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase());

      const matchesType = 
        relationshipFilter === "all" || p.relationship_type === relationshipFilter;

      return matchesSearch && matchesType;
    });
  }, [partners, search, relationshipFilter]);

  const cleanPhoneForWa = (rawPhone: string) => {
    const digits = rawPhone.replace(/[^0-9]/g, '');
    if (digits.startsWith('0')) return '92' + digits.slice(1);
    return digits;
  };

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'logistics': return <Truck size={14} className="text-cyan-400" />;
      case 'contractor': return <Factory size={14} className="text-amber-400" />;
      case 'client': return <Building size={14} className="text-emerald-400" />;
      default: return <Briefcase size={14} className="text-[#C5A059]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 font-inter flex flex-col">
      <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-40">
         <Link href="/settings" className="mr-6 p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all">
            <ArrowLeft size={18} />
         </Link>
         <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#C5A059]/10 text-[#C5A059] rounded-sm">
               <Handshake size={18} />
            </div>
            <div>
               <h1 className="text-sm font-black uppercase tracking-widest text-white">Strategic Partners & Supply Mesh</h1>
               <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Commercial Vendors, Logistics & Industrial Contractors</p>
            </div>
         </div>
         
         <button 
           onClick={() => setShowModal(true)}
           className="ml-auto flex items-center space-x-2 px-6 py-2.5 bg-[#C5A059] text-black text-[10px] uppercase tracking-widest font-black transition-all hover:brightness-110 shadow-lg shadow-[#C5A059]/10"
         >
            <Plus size={14} />
            <span>Onboard Partner</span>
         </button>
      </header>

      <div className="flex-1 p-8 max-w-[1300px] mx-auto w-full space-y-6">
         {/* Search & Category Filter Bar */}
         <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center space-x-4 bg-white/5 border border-white/10 p-3.5 rounded-sm">
               <Search className="text-slate-500" size={16} />
               <input 
                 type="text" 
                 placeholder="Search partners by company name, representative, phone, or industry..."
                 className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-slate-500 font-medium"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
               />
               {search && (
                 <button onClick={() => setSearch('')} className="text-gray-500 hover:text-white text-xs">Clear</button>
               )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-white/5 border border-white/10 rounded-sm">
              {[
                { id: 'all', label: 'All Partners' },
                { id: 'vendor', label: 'Vendors & Mills' },
                { id: 'logistics', label: 'Logistics / Cargo' },
                { id: 'contractor', label: 'Dyeing / Stitching' },
                { id: 'client', label: 'B2B Buyers' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setRelationshipFilter(f.id)}
                  className={cn(
                    "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-sm whitespace-nowrap transition-all",
                    relationshipFilter === f.id
                      ? "bg-[#C5A059] text-black shadow"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
         </div>

         {/* Partners Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              <div className="col-span-full py-20 text-center text-slate-500 font-mono text-[11px] uppercase tracking-widest flex items-center justify-center gap-3">
                 <Loader2 size={16} className="animate-spin text-[#C5A059]" />
                 <span>Synchronizing Strategic Partner Registry...</span>
              </div>
            ) : filteredPartners.length === 0 ? (
              <div className="col-span-full py-20 text-center space-y-4 bg-white/[0.02] border border-white/5 rounded-sm">
                 <Users size={40} className="mx-auto text-slate-700" strokeWidth={1} />
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No matching partners found</p>
                 <button
                   onClick={() => { setSearch(''); setRelationshipFilter('all'); }}
                   className="text-[10px] text-[#C5A059] uppercase font-black tracking-widest hover:underline"
                 >
                   Reset Filters
                 </button>
              </div>
            ) : filteredPartners.map(partner => (
              <motion.div 
                layout
                key={partner.id}
                className="bg-[#121417] border border-white/10 p-5 rounded-sm space-y-5 hover:border-[#C5A059]/40 transition-all group flex flex-col justify-between shadow-lg"
              >
                 <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                       <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            {getRelationshipIcon(partner.relationship_type)}
                            <h3 className="text-white text-sm font-bold tracking-tight">{partner.partner_name}</h3>
                          </div>
                          <p className="text-[10px] text-gray-400 font-mono">{partner.partner_industry}</p>
                       </div>
                       
                       <button 
                         onClick={() => deletePartner(partner.id, partner.partner_name)} 
                         title="Remove Partner"
                         className="p-1.5 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                       >
                          <Trash2 size={14} />
                       </button>
                    </div>

                    <div className="flex items-center gap-2">
                       <span className="text-[8px] px-2 py-0.5 bg-white/5 text-slate-400 font-black uppercase rounded-sm border border-white/5">
                         {partner.relationship_type}
                       </span>
                       <button
                         onClick={() => togglePartnerStatus(partner.id)}
                         className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border cursor-pointer transition-colors",
                            partner.status === 'active' 
                              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20" 
                              : "text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20"
                         )}
                       >
                         {partner.status === 'active' ? '● Operational' : '○ On Hold'}
                       </button>
                    </div>

                    <div className="space-y-2 pt-1 border-t border-white/5 text-[11px]">
                       {partner.contact_person && (
                         <div className="text-gray-400 flex items-center justify-between">
                            <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Representative</span>
                            <span className="text-gray-200 font-medium">{partner.contact_person}</span>
                         </div>
                       )}

                       {partner.phone && (
                         <div className="text-gray-400 flex items-center justify-between">
                            <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Direct Line</span>
                            <span className="text-gray-300 font-mono select-all">{partner.phone}</span>
                         </div>
                       )}

                       {partner.email && (
                         <div className="text-gray-400 flex items-center justify-between">
                            <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Email</span>
                            <span className="text-gray-300 font-mono select-all truncate max-w-[180px]">{partner.email}</span>
                         </div>
                       )}

                       {partner.address && (
                         <p className="text-[10px] text-gray-500 line-clamp-1 italic pt-1">{partner.address}</p>
                       )}
                    </div>
                 </div>

                 {/* Commercial Quick Action Bar */}
                 <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                    {partner.phone && (
                      <a
                        href={`https://wa.me/${cleanPhoneForWa(partner.phone)}?text=${encodeURIComponent(`Salam ${partner.contact_person || partner.partner_name}, this is from Noxis Enterprise Operations.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider rounded-sm transition-all"
                      >
                         <MessageSquare size={11} />
                         <span>WhatsApp</span>
                      </a>
                    )}

                    {partner.phone && (
                      <a
                        href={`tel:${partner.phone}`}
                        className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-sm transition-all"
                        title="Call Partner"
                      >
                         <Phone size={12} />
                      </a>
                    )}

                    {partner.email && (
                      <a
                        href={`mailto:${partner.email}?subject=Commercial Inquiry - Noxis Hub`}
                        className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-sm transition-all"
                        title="Email Partner"
                      >
                         <Mail size={12} />
                      </a>
                    )}
                 </div>
              </motion.div>
            ))}
         </div>
      </div>

      {/* Onboarding Modal */}
      <AnimatePresence>
         {showModal && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/75">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#121417] border border-white/10 w-full max-w-lg p-7 rounded-sm shadow-2xl space-y-6"
              >
                 <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-2.5">
                       <ShieldCheck size={18} className="text-[#C5A059]" />
                       <h3 className="text-xs font-black uppercase tracking-widest text-white">Partner Onboarding Specification</h3>
                    </div>
                    <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-all">
                       <XCircle size={18} />
                    </button>
                 </div>

                 <form onSubmit={handleAddPartner} className="space-y-4">
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                         Partner / Company Legal Name *
                       </label>
                       <input 
                         required
                         placeholder="e.g. Kohinoor Textile Mills Ltd"
                         value={formData.partner_name}
                         onChange={e => setFormData({...formData, partner_name: e.target.value})}
                         className="w-full bg-[#0A0A0B] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-[#C5A059] transition-all outline-none rounded-sm" 
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Supply Chain Role</label>
                          <select 
                            value={formData.relationship_type}
                            onChange={e => setFormData({...formData, relationship_type: e.target.value as Partner['relationship_type']})}
                            className="w-full bg-[#0A0A0B] border border-white/10 px-3 py-2 text-xs text-white outline-none rounded-sm"
                          >
                             <option value="vendor">Vendor / Mill Supplier</option>
                             <option value="logistics">Logistics / Courier Transporter</option>
                             <option value="contractor">Sub-Contractor (Washing/Dyeing)</option>
                             <option value="client">Client / Bulk B2B Buyer</option>
                             <option value="agent">Sales & Commission Agent</option>
                          </select>
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Industry Domain</label>
                          <input 
                            placeholder="e.g. Yarn / Grey Fabric"
                            value={formData.partner_industry || ''}
                            onChange={e => setFormData({...formData, partner_industry: e.target.value})}
                            className="w-full bg-[#0A0A0B] border border-white/10 px-3 py-2 text-xs text-white outline-none rounded-sm" 
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Direct Phone / WhatsApp *</label>
                          <input 
                            type="text"
                            required
                            placeholder="+92 300 1234567"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full bg-[#0A0A0B] border border-white/10 px-3 py-2 text-xs text-white font-mono outline-none rounded-sm" 
                          />
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Representative Name</label>
                          <input 
                            placeholder="e.g. Tariq Mehmood"
                            value={formData.contact_person}
                            onChange={e => setFormData({...formData, contact_person: e.target.value})}
                            className="w-full bg-[#0A0A0B] border border-white/10 px-3 py-2 text-xs text-white outline-none rounded-sm" 
                          />
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Email Address</label>
                       <input 
                         type="email"
                         placeholder="orders@partnercompany.com"
                         value={formData.email}
                         onChange={e => setFormData({...formData, email: e.target.value})}
                         className="w-full bg-[#0A0A0B] border border-white/10 px-3 py-2 text-xs text-white outline-none rounded-sm" 
                       />
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Physical Address / City</label>
                       <input 
                         placeholder="Plot / Industrial Area, City"
                         value={formData.address}
                         onChange={e => setFormData({...formData, address: e.target.value})}
                         className="w-full bg-[#0A0A0B] border border-white/10 px-3 py-2 text-xs text-white outline-none rounded-sm" 
                       />
                    </div>

                    <div className="pt-3 flex gap-3">
                       <button 
                         type="button" 
                         onClick={() => setShowModal(false)}
                         className="flex-1 py-2.5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all text-gray-400"
                       >
                          Cancel
                       </button>
                       <button 
                         type="submit"
                         disabled={isSubmitting}
                         className="flex-1 py-2.5 bg-[#C5A059] text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
                       >
                          {isSubmitting ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Commit to Mesh"}
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
