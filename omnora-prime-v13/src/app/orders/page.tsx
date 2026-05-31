"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingCart, Plus, Filter, Search, 
  ArrowRight, FileText, Clock, 
  CheckCircle2, AlertTriangle, MoreVertical,
  Calendar, Download, ExternalLink, RefreshCw
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";

import { cn } from "@/lib/utils";
import Decimal from "decimal.js";
import { useRouter } from "next/navigation";

// --- Components ---

const Badge = ({ children, variant = "default" }: any) => {
  const styles: any = {
    default: "bg-white/5 text-gray-400 border border-white/10",
    emerald: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    red: "bg-red-500/10 text-red-500 border border-red-500/20",
    blue: "bg-[#0070F3]/10 text-[#0070F3] border border-[#0070F3]/20",
    purple: "bg-purple-500/10 text-purple-500 border border-purple-500/20",
    gold: "bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20"
  };
  return (
    <span className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-[2px]", styles[variant])}>
      {children}
    </span>
  );
};

// --- Page Component ---

export default function SalesOrdersPage() {
  const { fmt, businessId } = usePersona();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState("");

  // Queries
  const { data: orders, isLoading } = useQuery({
    queryKey: ['sales_orders', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, party:parties(name), items:order_items(count)')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: !!businessId
  });

  // Mutations
  const convertToInvoice = useMutation({
    mutationFn: async (order: any) => {
      // 1. Create Invoice
      const { data: inv, error: invError } = await supabase
        .from('invoices')
        .insert({
          business_id: businessId,
          party_id: order.party_id,
          invoice_no: `INV-ORD-${order.order_number}`,
          total: order.total_amount,
          status: 'draft',
          issue_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();
      
      if (invError) throw invError;

      // 2. Update Order Status
      const { error: updError } = await supabase
        .from('orders')
        .update({ status: 'invoiced' })
        .eq('id', order.id);
      
      if (updError) throw updError;

      return inv;
    },
    onSuccess: (inv) => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders', businessId] });
      router.push(`/invoices/${inv.id}`);
    }
  });

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o: any) => 
      o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
      o.party?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  if (isLoading) return (
    <div className="min-h-screen bg-[#0F1113] flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.5em] text-gray-700 animate-pulse">
      Retrieving Order Manifests...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter">
      
      
      <main className="transition-all duration-300 min-h-screen flex flex-col pb-20">
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
           <div className="flex items-center space-x-3">
              <ShoppingCart size={18} className="text-[#C5A059]" />
              <h1 className="text-[10px] uppercase font-black tracking-[0.4em] text-white">Registry / Sales Orders</h1>
           </div>
           
           <div className="ml-auto flex items-center space-x-4">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                 <input 
                   type="text" 
                   placeholder="Search orders..." 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="bg-black/40 border border-white/10 pl-10 pr-4 py-1.5 text-[10px] uppercase font-bold tracking-widest text-white w-[250px] focus:border-[#C5A059]/50 outline-none transition-all placeholder:text-gray-700"
                 />
              </div>
              <button className="flex items-center space-x-2 bg-[#C5A059] hover:brightness-110 text-black px-6 py-1.5 text-[10px] uppercase font-black tracking-widest transition-all shadow-lg shadow-[#C5A059]/10">
                 <Plus size={12} />
                 <span>New Order</span>
              </button>
           </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">
           {/* SUMMARY ROW */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#1A1D21] border border-white/5 p-4 flex items-center justify-between">
                 <div>
                    <p className="text-[8px] uppercase font-black text-gray-500 tracking-widest mb-1">Open Orders</p>
                    <h4 className="text-xl font-mono font-black text-white">{orders?.filter((o: any) => o.status === 'pending').length || 0}</h4>
                 </div>
                 <div className="p-2 bg-blue-500/5 text-blue-500 rounded-sm"><Clock size={16} /></div>
              </div>
              <div className="bg-[#1A1D21] border border-white/5 p-4 flex items-center justify-between">
                 <div>
                    <p className="text-[8px] uppercase font-black text-gray-500 tracking-widest mb-1">In Production</p>
                    <h4 className="text-xl font-mono font-black text-amber-500">{orders?.filter((o: any) => o.status === 'in_production').length || 0}</h4>
                 </div>
                 <div className="p-2 bg-amber-500/5 text-amber-500 rounded-sm"><RefreshCw size={16} /></div>
              </div>
              <div className="bg-[#1A1D21] border border-white/5 p-4 flex items-center justify-between">
                 <div>
                    <p className="text-[8px] uppercase font-black text-gray-500 tracking-widest mb-1">Ready for Delivery</p>
                    <h4 className="text-xl font-mono font-black text-emerald-500">{orders?.filter((o: any) => o.status === 'ready').length || 0}</h4>
                 </div>
                 <div className="p-2 bg-emerald-500/5 text-emerald-500 rounded-sm"><CheckCircle2 size={16} /></div>
              </div>
              <div className="bg-[#1A1D21] border border-white/5 p-4 flex items-center justify-between">
                 <div>
                    <p className="text-[8px] uppercase font-black text-gray-500 tracking-widest mb-1">Total Pipeline</p>
                    <h4 className="text-xl font-mono font-black text-[#C5A059]">{fmt(orders?.reduce((acc: number, o: any) => acc + Number(o.total_amount), 0) || 0)}</h4>
                 </div>
                 <div className="p-2 bg-[#C5A059]/5 text-[#C5A059] rounded-sm"><ShoppingCart size={16} /></div>
              </div>
           </div>

           {/* ORDERS TABLE */}
           <div className="bg-[#1A1D21] border border-white/5 flex flex-col">
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="text-[9px] uppercase font-black text-gray-600 tracking-[0.2em] border-b border-white/5">
                          <th className="p-4">Order #</th>
                          <th className="p-4">Customer identity</th>
                          <th className="p-4">Placement Date</th>
                          <th className="p-4">Items</th>
                          <th className="p-4 text-right">Order Value</th>
                          <th className="p-4">Fulfillment Status</th>
                          <th className="p-4">Expected Date</th>
                          <th className="p-4 text-right">Operational Actions</th>
                       </tr>
                    </thead>
                    <tbody className="text-[11px]">
                       {filteredOrders.length > 0 ? filteredOrders.map((order: any) => (
                         <tr key={order.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors group">
                            <td className="p-4">
                               <div className="flex items-center space-x-2">
                                  <span className="text-[#C5A059] font-mono font-bold">{order.order_number}</span>
                                  <ExternalLink size={10} className="text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                               </div>
                            </td>
                            <td className="p-4">
                               <p className="font-bold text-white uppercase tracking-tight">{order.party?.name || 'Walk-in Customer'}</p>
                            </td>
                            <td className="p-4 text-gray-400 font-mono">{order.order_date}</td>
                            <td className="p-4">
                               <div className="flex items-center space-x-2">
                                  <Badge>{order.items?.[0]?.count || 0} Units</Badge>
                               </div>
                            </td>
                            <td className="p-4 text-right font-mono font-black text-white">{fmt(order.total_amount)}</td>
                            <td className="p-4">
                               <Badge variant={
                                 order.status === 'invoiced' ? 'emerald' : 
                                 order.status === 'ready' ? 'blue' :
                                 order.status === 'in_production' ? 'amber' :
                                 order.status === 'cancelled' ? 'red' : 'default'
                               }>
                                  {order.status.replace('_', ' ')}
                               </Badge>
                            </td>
                            <td className="p-4">
                               <div className="flex items-center space-x-2 text-gray-500">
                                  <Calendar size={12} />
                                  <span className="font-mono">{order.expected_date || 'TBD'}</span>
                               </div>
                            </td>
                            <td className="p-4 text-right">
                               <div className="flex items-center justify-end space-x-2">
                                  {order.status === 'ready' && (
                                    <button 
                                      onClick={() => convertToInvoice.mutate(order)}
                                      disabled={convertToInvoice.isPending}
                                      className="flex items-center space-x-1 bg-[#0070F3] hover:brightness-110 text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-all"
                                    >
                                       <FileText size={10} />
                                       <span>Invoice</span>
                                    </button>
                                  )}
                                  <button className="p-1.5 hover:bg-white/5 text-gray-700 hover:text-white transition-colors rounded-sm">
                                     <MoreVertical size={14} />
                                  </button>
                               </div>
                            </td>
                         </tr>
                       )) : (
                         <tr>
                            <td colSpan={8} className="p-20 text-center">
                               <div className="flex flex-col items-center opacity-20">
                                  <ShoppingCart size={48} strokeWidth={1} />
                                  <p className="text-[10px] uppercase font-black tracking-widest mt-4">No order manifest records found</p>
                               </div>
                            </td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}

