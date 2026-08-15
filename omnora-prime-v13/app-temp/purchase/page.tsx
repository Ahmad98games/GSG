"use client";

import React, { useMemo, useState } from "react";
import { 
  Plus, Search, Filter, 
  FileText, Truck, AlertCircle,
  MoreVertical, Eye, XCircle, PackageCheck,
  TrendingUp, Clock, ShoppingBag
} from "lucide-react";
import { motion } from "framer-motion";
import { usePersona } from "@/hooks/usePersona";
import { usePurchaseOrders, useUpdatePOStatus } from "@/hooks/usePurchaseQueries";
import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/useToast";
import { humanizeError } from '@/lib/utils/errors';

import { useSidebarState } from "@/hooks/useSidebarState";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import IndustrialEmptyState from "@/components/ui/IndustrialEmptyState";

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const { t, fmt, fmtDate, currency } = usePersona();
  const { isCollapsed } = useSidebarState();
  const { data: pos, isLoading, error, refetch } = usePurchaseOrders();
  const toast = useToast();
  const updateStatus = useUpdatePOStatus();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const filteredPos = useMemo(() => {
    if (!pos) return [];
    return pos.filter((po: any) => {
      const matchNo = po.po_number?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchSupplier = po.supplier?.name?.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchNo || matchSupplier;
    });
  }, [pos, debouncedSearch]);

  const summary = useMemo(() => {
    if (!pos) return { open: 0, pending: 0, monthValue: 0 };
    
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      open: pos.filter((p: any) => p.status === 'sent' || p.status === 'partially_received').length,
      pending: pos.filter((p: any) => p.status === 'sent').length,
      monthValue: pos
        .filter((p: any) => new Date(p.order_date) >= firstDayOfMonth && p.status !== 'cancelled')
        .reduce((acc: number, p: any) => acc + Number(p.total), 0)
    };
  }, [pos]);

  return (
    <div className="min-h-screen bg-onyx text-slate-200 font-inter">
      <main className="transition-all duration-300 min-h-screen flex flex-col">
        <header className="h-20 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#60A5FA]/10 text-[#60A5FA] rounded-sm">
                 <ShoppingBag size={18} />
              </div>
              <div>
                 <h1 className="text-xl font-bold tracking-tight text-white">Procurement Registry</h1>
                 <p className="text-xxs font-semibold tracking-wide-md uppercase text-gray-500">Inbound Logistics & Supplier Management</p>
              </div>
           </div>
           
           <div className="ml-auto flex items-center space-x-4">
              <div className="relative group">
                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                 <input 
                   type="text" 
                   placeholder="Search PO # or Supplier..."
                   className="bg-white/5 border border-white/10 text-[10px] text-white pl-10 pr-4 py-1.5 focus:border-electric-blue outline-none transition-all w-64 animate-all"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              <Link 
                href="/purchase/new"
                className="flex items-center space-x-2 px-4 py-1.5 bg-electric-blue text-onyx text-[10px] uppercase tracking-widest font-bold hover:brightness-110 transition-colors"
              >
                 <Plus size={14} />
                 <span>New Purchase Order</span>
              </Link>
           </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">
           {/* Summary Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard 
                label="Open Orders" 
                value={isLoading ? "..." : summary.open.toString()} 
                sub="Active Procurement"
                icon={Clock}
                color="blue"
              />
              <SummaryCard 
                label="Pending Receipt" 
                value={isLoading ? "..." : summary.pending.toString()} 
                sub="Awaiting Delivery"
                icon={Truck}
                color="amber"
              />
              <SummaryCard 
                label="Monthly Value" 
                value={isLoading ? "..." : fmt(summary.monthValue)} 
                sub="Last 30 Days"
                icon={TrendingUp}
                color="emerald"
              />
           </div>

           {/* PO Table Container */}
           <div className="bg-surface border border-white/5 overflow-hidden">
              {isLoading ? (
                <div className="p-8">
                  <TableSkeleton rows={6} cols={6} />
                </div>
              ) : error ? (
                <div className="p-12 flex flex-col items-center justify-center">
                  <ErrorState
                    message="Could not load purchase orders registry"
                    detail={(error as Error).message}
                    onRetry={refetch}
                  />
                </div>
              ) : filteredPos.length === 0 ? (
                <div className="p-12">
                  <IndustrialEmptyState 
                    title="No Purchase Orders"
                    description="Start your procurement cycle by creating a new Purchase Order for your suppliers."
                    icon="data"
                  />
                </div>
              ) : (
                <table className="w-full text-left">
                   <thead className="bg-[#1A1D21] border-b border-white/10">
                      <tr>
                         <th className="px-6 py-4 table-header">PO Details</th>
                         <th className="px-6 py-4 table-header">Supplier</th>
                         <th className="px-6 py-4 table-header text-center">Dates</th>
                         <th className="px-6 py-4 table-header text-right">Total Value</th>
                         <th className="px-6 py-4 table-header text-center">Status</th>
                         <th className="px-6 py-4 table-header text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/[0.02]">
                      {filteredPos.map((po: any) => (
                        <tr 
                          key={po.id} 
                          className="h-14 hover:bg-white/[0.01] transition-all group cursor-pointer border-b border-white/5"
                          onClick={() => router.push(`/purchase/${po.id}`)}
                        >
                         <td className="px-6 py-4">
                            <div className="flex flex-col">
                               <span className="text-white text-xs font-bold uppercase tracking-tight">{po.po_number}</span>
                               <span className="text-[9px] font-mono text-gray-500">System Ref: {po.id.slice(0,8)}</span>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <span className="text-[10px] font-bold text-electric-blue uppercase">{po.supplier?.name}</span>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex flex-col items-center text-[10px] font-medium text-gray-500 uppercase">
                               <span className="flex items-center space-x-1">
                                  <Clock size={10} />
                                  <span>Ordered: {fmtDate(po.order_date)}</span>
                               </span>
                               <span className="flex items-center space-x-1 mt-1 text-gray-600">
                                  <Truck size={10} />
                                  <span>Expect: {po.expected_by ? fmtDate(po.expected_by) : 'TBD'}</span>
                               </span>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-right font-mono text-sm text-white font-bold">
                            {fmt(po.total)}
                         </td>
                         <td className="px-6 py-4 text-center">
                            <POStatusBadge status={po.status} />
                         </td>
                         <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2" onClick={e => e.stopPropagation()}>
                               <Link 
                                 href={`/purchase/${po.id}`}
                                 className="p-2 hover:bg-white/5 rounded-sm text-gray-500 hover:text-white transition-all"
                                 title="View Details"
                               >
                                  <Eye size={14} />
                               </Link>
                               {['sent', 'partially_received'].includes(po.status) && (
                                 <Link 
                                   href={`/purchase/grn/new?poId=${po.id}`}
                                   className="p-2 hover:bg-emerald/10 rounded-sm text-emerald/60 hover:text-emerald transition-all"
                                   title="Receive Stock"
                                 >
                                    <PackageCheck size={14} />
                                 </Link>
                               )}
                               {po.status === 'draft' && (
                                 <button 
                                   className="p-2 hover:bg-red-500/10 rounded-sm text-gray-500 hover:text-red-500 transition-all"
                                   title="Cancel Order"
                                   onClick={async () => {
                                     if (confirm(`Are you sure you want to cancel Purchase Order ${po.po_number}?`)) {
                                       try {
                                         await updateStatus.mutateAsync({ id: po.id, status: 'cancelled' });
                                         toast.success("Order Cancelled", `Purchase Order ${po.po_number} status updated to cancelled.`);
                                       } catch (err: any) {
                                         toast.error('Cancellation failed', humanizeError(err, 'cancel purchase order'));
                                       }
                                     }
                                   }}
                                 >
                                    <XCircle size={14} />
                                 </button>
                               )}
                            </div>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
              )}
           </div>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ label, value, sub, icon: Icon, color }: any) {
  const colors: any = {
    blue: "border-electric-blue/20 bg-electric-blue/5 text-electric-blue",
    amber: "border-amber-500/20 bg-amber-500/5 text-amber-500",
    emerald: "border-emerald/20 bg-emerald/5 text-emerald"
  };

  return (
    <div className={cn("p-6 border rounded-sm space-y-4", colors[color])}>
       <div className="flex justify-between items-start">
          <div className="space-y-1">
             <span className="text-[9px] uppercase font-black tracking-widest opacity-60">{label}</span>
             <p className="text-3xl font-mono font-black tracking-tighter">{value}</p>
          </div>
          <div className="p-2 bg-white/10 rounded-sm">
             <Icon size={16} />
          </div>
       </div>
       <div className="pt-2 border-t border-white/5 text-[9px] uppercase font-bold opacity-40 tracking-widest">
          {sub}
       </div>
    </div>
  );
}

function POStatusBadge({ status }: { status: string }) {
  const configs: any = {
    draft: { label: "Draft", style: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
    sent: { label: "Ordered", style: "bg-electric-blue/10 text-electric-blue border-electric-blue/20" },
    partially_received: { label: "Partial", style: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    received: { label: "Received", style: "bg-emerald/10 text-emerald border-emerald/20" },
    cancelled: { label: "Cancelled", style: "bg-red-500/10 text-red-500 border-red-500/20" }
  };

  const config = configs[status] || configs.draft;
  return (
    <span className={cn(
      "px-3 py-1 text-[9px] font-black uppercase tracking-widest border rounded-full",
      config.style
    )}>
       {config.label}
    </span>
  );
}
