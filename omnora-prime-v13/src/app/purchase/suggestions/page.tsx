"use client";

import React, { useMemo } from "react";
import { 
  AlertTriangle, ArrowRight, ShoppingCart, 
  Settings, History, TrendingDown,
  Package, User, ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";
import { usePersona } from "@/hooks/usePersona";
import { useReorderSuggestions } from "@/hooks/usePurchaseQueries";

import { useSidebarState } from "@/hooks/useSidebarState";
import Link from "next/link";
import { cn } from "@/lib/utils";
import IndustrialEmptyState from "@/components/ui/IndustrialEmptyState";
import { WhatsAppSender, WhatsAppTemplates } from "@/lib/whatsapp/WhatsAppSender";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { MessageCircle } from "lucide-react";

export default function ReorderSuggestionsPage() {
  const { t, fmt, businessId } = usePersona();
  const { profile } = useBusinessProfile();
  const { isCollapsed } = useSidebarState();
  const { data: suggestions, isLoading } = useReorderSuggestions();

  const handleSendToOwner = () => {
    if (!suggestions || suggestions.length === 0 || !profile?.owner_phone) return;
    
    const items = suggestions.map((s: any) => ({ name: s.name, qty: s.qty_on_hand }));
    const message = WhatsAppTemplates.lowStock(items);
    
    WhatsAppSender.send({ phone: profile.owner_phone, message }, profile?.tier || 'starter');
  };

  const summary = useMemo(() => {
    if (!suggestions) return { count: 0, totalCost: 0, bySupplier: {} as any };
    
    const count = suggestions.length;
    const totalCost = suggestions.reduce((acc: number, s: any) => acc + Number(s.estimated_po_value), 0);
    
    const bySupplier: any = {};
    suggestions.forEach((s: any) => {
      const supplierName = s.last_supplier_name || "Unknown Supplier";
      if (!bySupplier[supplierName]) {
        bySupplier[supplierName] = { cost: 0, skus: 0, id: s.last_supplier_id };
      }
      bySupplier[supplierName].cost += Number(s.estimated_po_value);
      bySupplier[supplierName].skus += 1;
    });

    return { count, totalCost, bySupplier };
  }, [suggestions]);

  

  return (
    <div className="min-h-screen bg-onyx text-slate-200 font-inter">
      
      
      <main className={` transition-all duration-300 min-h-screen flex flex-col`}>
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-surface/50 backdrop-blur-md sticky top-0 z-40">
           <div className="flex items-center space-x-3">
              <AlertTriangle size={18} className="text-sandstone-gold" />
              <h1 className="text-[10px] uppercase font-black tracking-[0.4em] text-white">Inventory Intelligence / Reorder Engine</h1>
           </div>
           
           <div className="ml-auto flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                 <History size={14} />
                 <span>Last Scan: 2 mins ago</span>
               </div>
               <button 
                 onClick={handleSendToOwner}
                 disabled={!profile?.owner_phone || !suggestions?.length}
                 className="flex items-center space-x-2 px-4 py-1.5 bg-[#25D366] text-white text-[10px] uppercase tracking-widest font-black hover:brightness-110 transition-all disabled:opacity-30"
               >
                  <MessageCircle size={14} />
                  <span>Send Summary to Owner</span>
               </button>
              </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">
           <div className="space-y-2">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Stock <span className="text-sandstone-gold">Depletion Alert</span></h2>
              <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">
                 {summary.count} SKUs currently below critical threshold · Estimated restock cost: {fmt(summary.totalCost)}
              </p>
           </div>

           {/* Suggestions Table */}
           <div className="bg-surface border border-white/5 overflow-hidden">
              <table className="w-full text-left">
                 <thead className="bg-onyx/50 border-b border-white/5 font-bold text-[10px] text-gray-500 uppercase tracking-widest">
                    <tr>
                       <th className="px-6 py-4">SKU / Component</th>
                       <th className="px-6 py-4 text-center">Current Stock</th>
                       <th className="px-6 py-4 text-center">Threshold</th>
                       <th className="px-6 py-4 text-center">Required</th>
                       <th className="px-6 py-4 text-right">Est. Unit Cost</th>
                       <th className="px-6 py-4 text-right">Est. Total</th>
                       <th className="px-6 py-4">Last Known Supplier</th>
                       <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/[0.02]">
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="py-20 text-center text-[10px] uppercase tracking-[0.4em] text-gray-600 animate-pulse">Running Depletion Analysis...</td>
                      </tr>
                    ) : suggestions?.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-20">
                          <IndustrialEmptyState 
                            title="Inventory Fully Optimized"
                            description="All SKUs are currently above their reorder thresholds. No procurement action required."
                            icon="data"
                          />
                        </td>
                      </tr>
                    ) : suggestions?.map((s: any) => (
                      <tr key={s.sku_id} className="hover:bg-white/[0.01] transition-all group">
                         <td className="px-6 py-4">
                            <div className="flex flex-col">
                               <span className="text-white text-xs font-bold uppercase tracking-tight">{s.name}</span>
                               <span className="text-[9px] font-mono text-electric-blue">{s.sku_code}</span>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-center">
                            <span className="text-xs font-mono font-bold text-critical-red">{s.qty_on_hand} {s.unit}</span>
                         </td>
                         <td className="px-6 py-4 text-center">
                            <span className="text-xs font-mono text-gray-500">{s.reorder_level} {s.unit}</span>
                         </td>
                         <td className="px-6 py-4 text-center">
                            <span className="text-xs font-mono font-bold text-emerald">+{s.qty_to_order}</span>
                         </td>
                         <td className="px-6 py-4 text-right font-mono text-xs text-gray-400">
                            {fmt(s.estimated_unit_cost)}
                         </td>
                         <td className="px-6 py-4 text-right font-mono text-sm text-white font-bold">
                            {fmt(s.estimated_po_value)}
                         </td>
                         <td className="px-6 py-4">
                            <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center space-x-2">
                               <User size={10} className="text-gray-700" />
                               <span>{s.last_supplier_name || "New Vendor Required"}</span>
                            </span>
                         </td>
                         <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                               <Link 
                                 href={`/purchase/new?supplierId=${s.last_supplier_id}&skuId=${s.sku_id}&qty=${s.qty_to_order}`}
                                 className="p-2 hover:bg-electric-blue/10 rounded-sm text-electric-blue/60 hover:text-electric-blue transition-all"
                                 title="Create PO"
                               >
                                  <ShoppingCart size={14} />
                               </Link>
                               <Link 
                                 href={`/stock/${s.sku_id}`}
                                 className="p-2 hover:bg-white/5 rounded-sm text-gray-500 hover:text-white transition-all"
                                 title="Edit Threshold"
                               >
                                  <Settings size={14} />
                               </Link>
                            </div>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           {/* Batch Summary Panel */}
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 bg-surface border border-white/5 p-8 flex items-center justify-between">
                 <div className="space-y-1">
                    <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Estimated Reorder Capital Required</span>
                    <p className="text-4xl font-black font-mono text-sandstone-gold tracking-tighter">{fmt(summary.totalCost)}</p>
                 </div>
                 <div className="flex items-center space-x-8">
                    <div className="text-right">
                       <span className="text-[9px] uppercase text-gray-600 font-bold tracking-widest">Critical Shortfalls</span>
                       <p className="text-xl font-mono font-bold text-critical-red">{summary.count}</p>
                    </div>
                    <Link 
                      href="/purchase/new"
                      className="px-8 py-4 bg-white/5 border border-white/10 text-[10px] uppercase tracking-[0.2em] font-black hover:bg-white/10 transition-all"
                    >
                       Manual PO Override
                    </Link>
                 </div>
              </div>

              <div className="lg:col-span-4 bg-surface border border-white/5 p-6 space-y-6">
                 <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Grouped by Last Supplier</h3>
                 <div className="space-y-4">
                    {Object.entries(summary.bySupplier).map(([name, data]: [string, any]) => (
                      <div key={name} className="flex items-center justify-between text-[11px] group">
                         <div className="flex flex-col">
                            <span className="text-white font-bold uppercase">{name}</span>
                            <span className="text-[9px] text-gray-600 uppercase">{data.skus} Depleted SKUs</span>
                         </div>
                         <div className="text-right">
                            <span className="font-mono text-sandstone-gold font-bold">{fmt(data.cost)}</span>
                            <Link 
                              href={`/purchase/new?supplierId=${data.id}`}
                              className="block text-[8px] text-electric-blue uppercase font-bold opacity-0 group-hover:opacity-100 transition-all"
                            >
                               Batch Order
                            </Link>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
