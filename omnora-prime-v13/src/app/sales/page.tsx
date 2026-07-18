"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { usePersona } from "@/hooks/usePersona";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useToast } from "@/hooks/useToast";
import { 
  Users, UserPlus, Search, Phone, MapPin, 
  ChevronRight, X, CheckCircle2, DollarSign,
  TrendingUp, Activity, Inbox, ArrowUpRight,
  MessageCircle, BarChart3, Briefcase, Plus,
  Sparkles, ShieldAlert, Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  stage: 'inquiry' | 'contacted' | 'negotiation' | 'won' | 'lost';
  value: number;
  notes?: string;
  created_at: string;
}

const STAGES = [
  { key: 'inquiry', label: 'Inquiry', color: 'border-blue-500/20 text-blue-400 bg-blue-500/5' },
  { key: 'contacted', label: 'Contacted', color: 'border-amber-500/20 text-amber-400 bg-amber-500/5' },
  { key: 'negotiation', label: 'Negotiation', color: 'border-purple-500/20 text-purple-400 bg-purple-500/5' },
  { key: 'won', label: 'Closed Won', color: 'border-emerald-500/20 text-emerald bg-emerald-500/5' },
  { key: 'lost', label: 'Closed Lost', color: 'border-red-500/20 text-red-400 bg-red-500/5' },
] as const;

export default function SalesPage() {
  const { businessId, fmt } = usePersona();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'pipeline' | 'customers'>('pipeline');
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  // Local storage cache for mock/local CRM leads since they don't block the backend schema
  const [leads, setLeads] = useState<Lead[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`noxis_crm_leads_${businessId}`);
      if (stored) return JSON.parse(stored);
    }
    return [
      { id: "1", name: "Irfan Textiles", company: "Irfan Ltd", phone: "0300-1234567", stage: "negotiation", value: 450000, notes: "Discussing bulk yarn supply", created_at: new Date().toISOString() },
      { id: "2", name: "Al-Hamd Traders", company: "Al-Hamd", phone: "0321-7654321", stage: "inquiry", value: 1200000, notes: "Requires sample fabric dispatch", created_at: new Date().toISOString() },
      { id: "3", name: "Zainab Retail", company: "Zainab Apparel", phone: "0333-8889991", stage: "won", value: 350000, notes: "First trial order paid & completed", created_at: new Date().toISOString() }
    ];
  });

  const saveLeads = (updatedLeads: Lead[]) => {
    setLeads(updatedLeads);
    if (typeof window !== "undefined") {
      localStorage.setItem(`noxis_crm_leads_${businessId}`, JSON.stringify(updatedLeads));
    }
  };

  // Add Lead form state
  const [newLead, setNewLead] = useState({ name: "", company: "", phone: "", value: "", stage: "inquiry" as Lead['stage'], notes: "" });

  // Add Customer form state
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", address: "", credit_limit: "50000", credit_days: "30", notes: "" });
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  // Fetch verified Customers from database
  const { data: customers = [], isLoading: isCustomersLoading, refetch: refetchCustomers } = useQuery({
    queryKey: ['crm_customers', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .eq('business_id', businessId)
        .in('party_type', ['customer', 'both'])
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!businessId
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter((c: any) => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.phone && c.phone.includes(searchTerm))
    );
  }, [customers, searchTerm]);

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name.trim() || !newLead.value) return;

    const lead: Lead = {
      id: Math.random().toString(36).substring(2, 9),
      name: newLead.name.trim(),
      company: newLead.company.trim() || newLead.name.trim(),
      phone: newLead.phone.trim(),
      stage: newLead.stage,
      value: Number(newLead.value) || 0,
      notes: newLead.notes.trim(),
      created_at: new Date().toISOString()
    };

    saveLeads([...leads, lead]);
    setShowAddLead(false);
    setNewLead({ name: "", company: "", phone: "", value: "", stage: "inquiry", notes: "" });
    toast.success("Lead registered in sales pipeline ✓");
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name.trim()) return;

    setIsAddingCustomer(true);
    try {
      const { error } = await supabase
        .from('parties')
        .insert({
          business_id: businessId,
          name: newCustomer.name.trim(),
          party_type: 'customer',
          phone: newCustomer.phone.trim(),
          address: newCustomer.address.trim(),
          credit_limit: Number(newCustomer.credit_limit) || 0,
          credit_days: Number(newCustomer.credit_days) || 0,
          notes: newCustomer.notes.trim()
        });

      if (error) throw error;

      toast.success(`${newCustomer.name} added to CRM Directory! ✓`);
      refetchCustomers();
      setShowAddCustomer(false);
      setNewCustomer({ name: "", phone: "", address: "", credit_limit: "50000", credit_days: "30", notes: "" });
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsAddingCustomer(false);
    }
  };

  const updateLeadStage = (leadId: string, newStage: Lead['stage']) => {
    const updated = leads.map(l => l.id === leadId ? { ...l, stage: newStage } : l);
    saveLeads(updated);
    toast.success("Pipeline deal status updated ✓");
  };

  const pipelineStats = useMemo(() => {
    const active = leads.filter(l => l.stage !== 'won' && l.stage !== 'lost');
    const totalVal = active.reduce((sum, l) => sum + l.value, 0);
    const wonCount = leads.filter(l => l.stage === 'won').length;
    const conversionRate = leads.length > 0 ? Math.round((wonCount / leads.length) * 100) : 0;
    return {
      activeCount: active.length,
      value: totalVal,
      conversionRate
    };
  }, [leads]);

  return (
    <div className="min-h-screen bg-onyx text-slate-200 font-inter">
      <header className="h-20 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-sm">
            <Briefcase size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Sales & Customer Relationship Manager (CRM)</h1>
            <p className="text-xxs font-semibold tracking-wide-md uppercase text-gray-500">Pipeline Deals, Leads, and Customer Accounts</p>
          </div>
        </div>

        <div className="ml-auto flex items-center space-x-3">
          <div className="flex bg-black/40 border border-white/10 p-0.5 rounded-sm">
            <button 
              onClick={() => setActiveTab('pipeline')}
              className={cn("px-4 py-1 text-xs font-bold uppercase tracking-wider transition-all", activeTab === 'pipeline' ? "bg-white text-black rounded-sm" : "text-gray-400 hover:text-white")}
            >
              Pipeline Board
            </button>
            <button 
              onClick={() => setActiveTab('customers')}
              className={cn("px-4 py-1 text-xs font-bold uppercase tracking-wider transition-all", activeTab === 'customers' ? "bg-white text-black rounded-sm" : "text-gray-400 hover:text-white")}
            >
              Customer Directory
            </button>
          </div>

          <button
            onClick={() => activeTab === 'pipeline' ? setShowAddLead(true) : setShowAddCustomer(true)}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-cyan-500 text-black text-[10px] uppercase tracking-widest font-black hover:bg-cyan-400 transition-colors rounded-sm"
          >
            <Plus size={14} />
            <span>{activeTab === 'pipeline' ? "Add Lead" : "New Customer"}</span>
          </button>
        </div>
      </header>

      <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">
        
        {/* KPI Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 bg-[#0E1114] border border-white/5 rounded-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Deals</p>
              <h3 className="text-2xl font-black text-white mt-1">{pipelineStats.activeCount}</h3>
              <p className="text-[9px] text-gray-600 mt-1 uppercase">In Progress Negotiation</p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-sm">
              <Activity size={20} />
            </div>
          </div>

          <div className="p-6 bg-[#0E1114] border border-white/5 rounded-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pipeline Value</p>
              <h3 className="text-2xl font-black text-white mt-1">{fmt(pipelineStats.value)}</h3>
              <p className="text-[9px] text-gray-600 mt-1 uppercase">Projected Revenue</p>
            </div>
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-sm">
              <TrendingUp size={20} />
            </div>
          </div>

          <div className="p-6 bg-[#0E1114] border border-white/5 rounded-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Conversion Rate</p>
              <h3 className="text-2xl font-black text-white mt-1">{pipelineStats.conversionRate}%</h3>
              <p className="text-[9px] text-gray-600 mt-1 uppercase">Deals Won Ratio</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-sm">
              <Award size={20} />
            </div>
          </div>

          <div className="p-6 bg-[#0E1114] border border-white/5 rounded-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Customers Registry</p>
              <h3 className="text-2xl font-black text-white mt-1">{customers.length}</h3>
              <p className="text-[9px] text-gray-600 mt-1 uppercase">Active Corporate Accounts</p>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-sm">
              <Users size={20} />
            </div>
          </div>
        </div>

        {/* Tab 1: Pipeline Kanban Board */}
        {activeTab === 'pipeline' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {STAGES.map(stage => {
              const stageLeads = leads.filter(l => l.stage === stage.key);
              const stageValue = stageLeads.reduce((sum, l) => sum + l.value, 0);

              return (
                <div key={stage.key} className="bg-[#0C0F12] border border-white/5 p-4 rounded-sm flex flex-col min-h-[500px]">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-wider text-white">{stage.label}</span>
                      <span className="text-[9px] font-bold text-gray-600 uppercase mt-0.5">{stageLeads.length} Deals</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-cyan-400">{fmt(stageValue)}</span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {stageLeads.map(lead => (
                      <div key={lead.id} className="p-4 bg-black/40 border border-white/5 rounded-sm relative group hover:border-white/10 transition-colors space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-tight">{lead.name}</h4>
                            <span className="text-[9px] text-gray-500 uppercase">{lead.company}</span>
                          </div>
                          <span className="text-xxs font-black text-cyan-400">{fmt(lead.value)}</span>
                        </div>

                        {lead.notes && (
                          <p className="text-[10px] text-gray-400 italic bg-white/[0.01] p-1.5 border-l border-white/10">
                            {lead.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          <span className="text-[8px] font-mono text-gray-650">Added {new Date(lead.created_at).toLocaleDateString()}</span>
                          <select
                            value={lead.stage}
                            onChange={e => updateLeadStage(lead.id, e.target.value as Lead['stage'])}
                            className="bg-black border border-white/10 text-[9px] font-bold uppercase text-gray-400 rounded-sm py-0.5 px-1 outline-none"
                          >
                            <option value="inquiry">Inquiry</option>
                            <option value="contacted">Contacted</option>
                            <option value="negotiation">Negotiate</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                          </select>
                        </div>
                      </div>
                    ))}

                    {stageLeads.length === 0 && (
                      <div className="h-40 border border-dashed border-white/5 flex items-center justify-center rounded-sm">
                        <span className="text-[9px] uppercase tracking-widest text-gray-700 font-bold">No deals here</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Customer Directory */}
        {activeTab === 'customers' && (
          <div className="bg-[#0C0F12] border border-white/5 rounded-sm overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="relative w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search Customers..."
                  className="w-full bg-black/40 border border-white/10 text-xs text-white pl-10 pr-4 py-1.5 focus:border-cyan-500 outline-none transition-all rounded-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#101316] border-b border-white/15">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-wider">Customer Name</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-wider">Contact Info</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-wider">Credit Limit</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-wider text-right">Current Ledger Balance</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-wider text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {isCustomersLoading ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-xs font-mono uppercase text-gray-600 animate-pulse tracking-widest">
                        Loading CRM Accounts Registry...
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Users className="text-gray-650" size={32} />
                          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">No active customers found</p>
                          <p className="text-xxs text-gray-700 uppercase">Add customer profile from quick action or button</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCustomers.map((customer: any) => (
                    <tr key={customer.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-white text-xs font-bold uppercase tracking-tight">{customer.name}</span>
                          <span className="text-[8px] font-mono text-gray-650 mt-0.5">Ref ID: {customer.id.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-[10px] text-gray-500 uppercase font-medium space-y-0.5">
                          {customer.phone ? (
                            <span className="flex items-center gap-1"><Phone size={10} /> {customer.phone}</span>
                          ) : (
                            <span className="text-gray-600 italic">No Phone</span>
                          )}
                          {customer.address && (
                            <span className="flex items-center gap-1"><MapPin size={10} /> {customer.address}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-300">{fmt(customer.credit_limit)}</span>
                          <span className="text-[8px] font-bold text-gray-600 uppercase mt-0.5">{customer.credit_days} Credit Days Limit</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn(
                          "text-xs font-black",
                          Number(customer.current_balance) > 0 ? "text-cyan-400" : "text-gray-500"
                        )}>
                          {fmt(customer.current_balance)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "px-2 py-0.5 text-[8px] font-black uppercase rounded-sm border",
                          customer.is_blocked 
                            ? "bg-red-500/10 border-red-500/20 text-red-400" 
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        )}>
                          {customer.is_blocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => window.location.href = `/khata?party_id=${customer.id}`}
                          className="px-3 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[9px] uppercase tracking-wider font-bold rounded-sm"
                        >
                          Statement
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {showAddLead && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddLead} className="w-full max-w-md bg-[#0F1114] border border-white/10 rounded-sm p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Add Deal / Lead</h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Lead Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Asif Cloth Store"
                  className="w-full bg-black/40 border border-white/10 text-xs px-3 py-2 outline-none text-white focus:border-cyan-500"
                  value={newLead.name}
                  onChange={e => setNewLead(p => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Company / Branch</label>
                <input 
                  type="text" 
                  placeholder="e.g. Asif Retailers"
                  className="w-full bg-black/40 border border-white/10 text-xs px-3 py-2 outline-none text-white focus:border-cyan-500"
                  value={newLead.company}
                  onChange={e => setNewLead(p => ({ ...p, company: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Deal Value (PKR) *</label>
                  <input 
                    type="number" 
                    required
                    placeholder="0"
                    className="w-full bg-black/40 border border-white/10 text-xs px-3 py-2 outline-none text-white focus:border-cyan-500"
                    value={newLead.value}
                    onChange={e => setNewLead(p => ({ ...p, value: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Stage</label>
                  <select
                    className="w-full bg-black border border-white/10 text-xs px-3 py-2 outline-none text-white focus:border-cyan-500"
                    value={newLead.stage}
                    onChange={e => setNewLead(p => ({ ...p, stage: e.target.value as Lead['stage'] }))}
                  >
                    <option value="inquiry">Inquiry</option>
                    <option value="contacted">Contacted</option>
                    <option value="negotiation">Negotiation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Phone number</label>
                <input 
                  type="text" 
                  placeholder="e.g. 0300-1234567"
                  className="w-full bg-black/40 border border-white/10 text-xs px-3 py-2 outline-none text-white focus:border-cyan-500"
                  value={newLead.phone}
                  onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Notes / Summary</label>
                <textarea 
                  placeholder="Details about client inquiry..."
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 text-xs px-3 py-2 outline-none text-white focus:border-cyan-500"
                  value={newLead.notes}
                  onChange={e => setNewLead(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setShowAddLead(false)}
                className="flex-1 py-2 text-xs border border-white/10 hover:border-white/20 uppercase tracking-widest text-gray-400 font-bold"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-2 bg-cyan-500 text-black text-xs font-black uppercase tracking-widest hover:bg-cyan-400"
              >
                Save Deal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddCustomer} className="w-full max-w-md bg-[#0F1114] border border-white/10 rounded-sm p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Register Corporate Customer</h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Customer Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Muhammad Bilal"
                  className="w-full bg-black/40 border border-white/10 text-xs px-3 py-2 outline-none text-white focus:border-cyan-500"
                  value={newCustomer.name}
                  onChange={e => setNewCustomer(p => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Phone number</label>
                <input 
                  type="text" 
                  placeholder="0321-1234567"
                  className="w-full bg-black/40 border border-white/10 text-xs px-3 py-2 outline-none text-white focus:border-cyan-500"
                  value={newCustomer.phone}
                  onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Address</label>
                <input 
                  type="text" 
                  placeholder="Larechs Market, Lahore"
                  className="w-full bg-black/40 border border-white/10 text-xs px-3 py-2 outline-none text-white focus:border-cyan-500"
                  value={newCustomer.address}
                  onChange={e => setNewCustomer(p => ({ ...p, address: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Credit Limit (PKR)</label>
                  <input 
                    type="number" 
                    placeholder="50000"
                    className="w-full bg-black/40 border border-white/10 text-xs px-3 py-2 outline-none text-white focus:border-cyan-500"
                    value={newCustomer.credit_limit}
                    onChange={e => setNewCustomer(p => ({ ...p, credit_limit: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Credit Days</label>
                  <input 
                    type="number" 
                    placeholder="30"
                    className="w-full bg-black/40 border border-white/10 text-xs px-3 py-2 outline-none text-white focus:border-cyan-500"
                    value={newCustomer.credit_days}
                    onChange={e => setNewCustomer(p => ({ ...p, credit_days: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Notes / Terms</label>
                <textarea 
                  placeholder="Special credit terms or references..."
                  rows={2}
                  className="w-full bg-black/40 border border-white/10 text-xs px-3 py-2 outline-none text-white focus:border-cyan-500"
                  value={newCustomer.notes}
                  onChange={e => setNewCustomer(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setShowAddCustomer(false)}
                className="flex-1 py-2 text-xs border border-white/10 hover:border-white/20 uppercase tracking-widest text-gray-400 font-bold"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isAddingCustomer}
                className="flex-1 py-2 bg-cyan-500 text-black text-xs font-black uppercase tracking-widest hover:bg-cyan-400 disabled:opacity-50"
              >
                {isAddingCustomer ? "Saving..." : "Add Customer"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
