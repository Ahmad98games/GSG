"use client";

import React, { useState, useMemo, useEffect } from "react";
import { BusinessProfile } from "@/store/BusinessProfileStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { 
  Truck, Package, CheckCircle2,
  Search, Filter, Printer,
  Loader2
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";

import { useSidebarState } from "@/hooks/useSidebarState";
import { cn } from "@/lib/utils";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import EmptyState from "@/components/ui/EmptyState";

// --- Types ---
interface DispatchOrder {
  id: string;
  invoice_no: string;
  party: { name: string; address?: string };
  items: { qty: number; unit: string; description: string }[];
  total_amount: number;
  status: string; // posted, etc.
  metadata: {
    dispatch_status?: 'pending' | 'packed' | 'dispatched' | 'delivered' | 'returned';
    priority?: 'normal' | 'high' | 'urgent';
    vehicle_info?: string;
    driver_name?: string;
  };
  issue_date: string;
}

export default function DispatchCenterPage() {
  const { fmt } = usePersona();
  const { isCollapsed } = useSidebarState();
  const { profile } = useBusinessProfile();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [printingOrder, setPrintingOrder] = useState<DispatchOrder | null>(null);

  // Data Fetching
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['dispatch_orders', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, party:parties(name, address), items:invoice_items(qty, unit, description)')
        .eq('business_id', profile?.id)
        .eq('status', 'posted')
        .order('issue_date', { ascending: false });
      
      if (error) throw error;
      return (data || []).map((inv: DispatchOrder) => ({
        ...inv,
        metadata: inv.metadata || {}
      })) as DispatchOrder[];
    },
    enabled: !!profile?.id
  });

  const stats = useMemo(() => {
    const pending = invoices.filter(i => (i.metadata?.dispatch_status || 'pending') === 'pending').length;
    const outForDelivery = invoices.filter(i => i.metadata?.dispatch_status === 'dispatched').length;
    const deliveredToday = invoices.filter(i => i.metadata?.dispatch_status === 'delivered').length; // Should ideally filter by date too
    return { pending, outForDelivery, deliveredToday };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = inv.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            inv.party?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const dStatus = inv.metadata?.dispatch_status || 'pending';
      const matchesStatus = statusFilter === "All" || dStatus === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const updateStatus = async (invoiceId: string, newStatus: string) => {
    const { data: currentInv } = await supabase.from('invoices').select('metadata').eq('id', invoiceId).single();
    const newMetadata = { ...(currentInv?.metadata || {}), dispatch_status: newStatus };
    
    const { error } = await supabase
      .from('invoices')
      .update({ metadata: newMetadata })
      .eq('id', invoiceId);
    
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['dispatch_orders'] });
    }
  };

  

  if (printingOrder) {
    return <DispatchNote order={printingOrder} onBack={() => setPrintingOrder(null)} profile={profile} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 font-inter flex">
      
      
      <main className={cn( "flex-1 transition-all duration-300 min-h-screen flex flex-col")}>
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-40">
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-electric-blue/10 text-electric-blue rounded-sm">
                 <Truck size={18} />
              </div>
              <div>
                 <h1 className="text-sm font-black uppercase tracking-widest text-white">Dispatch Center</h1>
                 <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Order fulfillment and delivery tracking</p>
              </div>
           </div>
           
           <div className="ml-auto flex items-center space-x-4">
              <button className="px-6 py-2 bg-white/5 border border-white/10 text-white text-[10px] uppercase tracking-widest font-black hover:bg-white/10 transition-all">
                 Mark All Delivered
              </button>
              <button className="px-6 py-2 bg-electric-blue text-onyx text-[10px] uppercase tracking-widest font-black hover:brightness-110 transition-all shadow-lg">
                 New Dispatch Order
              </button>
           </div>
        </header>

        <div className="flex-1 p-8 max-w-[1600px] mx-auto w-full space-y-8">
           {/* Summary Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard 
                label="Pending Dispatch" 
                value={stats.pending} 
                icon={Package} 
                color="text-amber-500" 
                subtext="Invoices awaiting packing"
              />
              <SummaryCard 
                label="Out for Delivery" 
                value={stats.outForDelivery} 
                icon={Truck} 
                color="text-electric-blue" 
                subtext="Currently with transport"
              />
              <SummaryCard 
                label="Delivered Today" 
                value={stats.deliveredToday} 
                icon={CheckCircle2} 
                color="text-emerald" 
                subtext="Successful handovers"
              />
           </div>

           {/* Filters & Search */}
           <div className="flex flex-col md:flex-row gap-4 items-center bg-white/5 border border-white/10 p-4 rounded-sm">
              <div className="relative flex-1">
                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                 <input 
                   type="text" 
                   placeholder="Search Invoice # or Customer..." 
                   className="w-full bg-[#0A0A0B] border border-white/10 pl-10 pr-4 py-2 text-xs text-white focus:border-electric-blue/50 outline-none transition-all"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              <div className="flex items-center space-x-3">
                 <select 
                   value={statusFilter}
                   onChange={(e) => setStatusFilter(e.target.value)}
                   className="bg-[#0A0A0B] border border-white/10 px-4 py-2 text-[10px] uppercase font-bold text-gray-400 outline-none focus:border-electric-blue/50"
                 >
                    <option>All Status</option>
                    <option>Pending</option>
                    <option>Packed</option>
                    <option>Dispatched</option>
                    <option>Delivered</option>
                    <option>Returned</option>
                 </select>
                 <button className="p-2 border border-white/10 text-gray-500 hover:text-white transition-all">
                    <Filter size={16} />
                 </button>
              </div>
           </div>

           {/* Queue Table */}
           <div className="bg-white/5 border border-white/10 rounded-sm overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                 <h3 className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Active Dispatch Queue</h3>
                 <span className="text-[9px] text-gray-600 font-mono italic">Real-time sync active</span>
              </div>

              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                   <Loader2 size={24} className="text-electric-blue animate-spin" />
                </div>
              ) : filteredInvoices.length === 0 ? (
                <EmptyState 
                   icon={Truck}
                   title="No Pending Dispatch"
                   body="All posted invoices have been fulfilled. New invoices will appear here once they are posted in the ledger."
                />
              ) : (
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="bg-[#0A0A0B] border-b border-white/10 text-[10px] uppercase font-black text-gray-600 tracking-widest">
                            <th className="px-6 py-4">Invoice #</th>
                            <th className="px-6 py-4">Party / Customer</th>
                            <th className="px-6 py-4">Items Summary</th>
                            <th className="px-6 py-4 text-right">Total Amount</th>
                            <th className="px-6 py-4 text-center">Dispatch Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                         </tr>
                      </thead>
                      <tbody>
                         {filteredInvoices.map((inv) => (
                           <tr key={inv.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                              <td className="px-6 py-5">
                                 <span className="text-xs font-bold text-white font-mono uppercase">{inv.invoice_no}</span>
                              </td>
                              <td className="px-6 py-5">
                                 <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-300 uppercase tracking-tight">{inv.party?.name}</span>
                                    <span className="text-[9px] text-gray-600 font-mono truncate max-w-[200px]">{inv.party?.address || "No address provided"}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-5">
                                 <div className="flex items-center space-x-2">
                                    <span className="text-[10px] font-bold text-gray-400">{inv.items.length} SKUs</span>
                                    <span className="text-[9px] text-gray-600 px-1.5 py-0.5 bg-white/5 rounded-sm">
                                       {inv.items[0]?.description.substring(0, 15)}...
                                    </span>
                                 </div>
                              </td>
                              <td className="px-6 py-5 text-right font-mono text-xs font-bold text-sandstone-gold">
                                 {fmt(inv.total_amount)}
                              </td>
                              <td className="px-6 py-5 text-center">
                                 <StatusBadge status={inv.metadata?.dispatch_status || 'pending'} />
                              </td>
                              <td className="px-6 py-5 text-right">
                                 <div className="flex items-center justify-end space-x-2">
                                    <button 
                                      onClick={() => updateStatus(inv.id, 'packed')}
                                      className="p-2 text-gray-600 hover:text-amber-500 transition-colors" title="Mark Packed">
                                       <Package size={14} />
                                    </button>
                                    <button 
                                      onClick={() => updateStatus(inv.id, 'dispatched')}
                                      className="p-2 text-gray-600 hover:text-electric-blue transition-colors" title="Mark Dispatched">
                                       <Truck size={14} />
                                    </button>
                                    <button 
                                      onClick={() => setPrintingOrder(inv)}
                                      className="p-2 text-gray-600 hover:text-white transition-colors" title="Print Dispatch Note">
                                       <Printer size={14} />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
              )}
           </div>
        </div>
      </main>
    </div>
  );
}

// --- Internal Components ---

function SummaryCard({ label, value, icon: Icon, color, subtext }: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  subtext: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 p-6 rounded-sm space-y-4">
       <div className="flex items-center justify-between">
          <div className={cn("p-2 bg-white/5 rounded-sm", color)}>
             <Icon size={18} />
          </div>
          <span className="text-2xl font-black font-mono text-white">{value}</span>
       </div>
       <div className="space-y-1">
          <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-widest">{label}</h4>
          <p className="text-[9px] text-gray-600 font-bold">{subtext}</p>
       </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-gray-500/10", text: "text-gray-500", label: "Pending" },
    packed: { bg: "bg-amber-500/10", text: "text-amber-500", label: "Packed" },
    dispatched: { bg: "bg-blue-500/10", text: "text-blue-500", label: "In Transit" },
    delivered: { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Delivered" },
    returned: { bg: "bg-red-500/10", text: "text-red-500", label: "Returned" },
  };
  const config = configs[status] || configs.pending;
  return (
    <span className={cn("px-2 py-1 rounded-sm text-[9px] uppercase font-black tracking-widest", config.bg, config.text)}>
       {config.label}
    </span>
  );
}

function DispatchNote({ order, onBack, profile }: { order: DispatchOrder, onBack: () => void, profile: BusinessProfile | null }) {
  useEffect(() => {
    // window.print();
  }, []);

  return (
    <div className="min-h-screen bg-white text-black p-12 font-inter print:p-0">
       <div className="max-w-[800px] mx-auto space-y-12">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-black pb-8">
             <div className="space-y-2">
                <h1 className="text-3xl font-black uppercase tracking-tighter">{profile?.business_name || "Noxis Hub"}</h1>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{profile?.address || "Operations Unit"}</p>
                <p className="text-[10px] font-bold text-gray-600 uppercase">Contact: {profile?.phone || "N/A"}</p>
             </div>
             <div className="text-right space-y-1">
                <h2 className="text-4xl font-black text-gray-200 uppercase mb-4">Dispatch Note</h2>
                <p className="text-[10px] font-bold">DATE: <span className="font-mono">{new Date().toLocaleDateString()}</span></p>
                <p className="text-[10px] font-bold">INV REF: <span className="font-mono">{order.invoice_no}</span></p>
             </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-12">
             <div className="space-y-4">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Consignee (Client)</p>
                <div className="space-y-1">
                   <p className="text-xl font-black uppercase">{order.party?.name}</p>
                   <p className="text-[10px] font-bold text-gray-700 leading-relaxed uppercase">{order.party?.address || "No address provided."}</p>
                </div>
             </div>
             <div className="space-y-4 text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Logistics Provider</p>
                <div className="space-y-1 text-[10px] font-bold">
                   <p>Vehicle: ____________________</p>
                   <p>Driver ID: ____________________</p>
                   <p>Gate Exit: ____________________</p>
                </div>
             </div>
          </div>

          {/* Items */}
          <div className="space-y-4">
             <table className="w-full border-collapse">
                <thead>
                   <tr className="border-b border-black text-[10px] uppercase font-black text-gray-500">
                      <th className="py-3 text-left">SKU Description</th>
                      <th className="py-3 text-center w-24">Unit</th>
                      <th className="py-3 text-right w-24">Qty Dispatched</th>
                      <th className="py-3 text-right w-24">Condition</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                   {order.items.map((item, i) => (
                     <tr key={i} className="text-[11px] font-bold">
                        <td className="py-4 uppercase tracking-tight">{item.description}</td>
                        <td className="py-4 text-center uppercase">{item.unit}</td>
                        <td className="py-4 text-right font-mono">{item.qty}</td>
                        <td className="py-4 text-right text-[9px] text-gray-400 uppercase">Good</td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>

          {/* Signatures */}
          <div className="pt-24 grid grid-cols-3 gap-12">
             <div className="space-y-4">
                <div className="h-[1px] bg-black/30" />
                <p className="text-[9px] font-black text-center uppercase text-gray-400">Warehouse Release</p>
             </div>
             <div className="space-y-4">
                <div className="h-[1px] bg-black/30" />
                <p className="text-[9px] font-black text-center uppercase text-gray-400">Logistics Officer</p>
             </div>
             <div className="space-y-4">
                <div className="h-[1px] bg-black/30" />
                <p className="text-[9px] font-black text-center uppercase text-gray-400">Received By (Customer)</p>
             </div>
          </div>

          {/* Footer */}
          <div className="pt-16 text-center space-y-2">
             <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Noxis Industrial Cloud Fulfillment • Transaction Verifiable via Hub Node</p>
             <button onClick={onBack} className="print:hidden px-8 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all">Back to Dashboard</button>
             <button onClick={() => window.print()} className="print:hidden ml-4 px-8 py-2 border border-black text-black text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all">Execute Print</button>
          </div>
       </div>

       <style jsx global>{`
          @media print {
             @page { margin: 0; }
             body { margin: 1.6cm; background: white !important; }
             .print\\:hidden { display: none !important; }
          }
       `}</style>
    </div>
  );
}
