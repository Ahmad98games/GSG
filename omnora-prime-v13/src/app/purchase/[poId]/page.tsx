"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  ShoppingCart, Download, Printer, 
  CheckCircle2, AlertTriangle, Truck, 
  History, Building2, User, Clock, 
  ArrowLeft, ChevronRight, Boxes,
  FileCheck, XCircle, MoreVertical, Phone,
  DollarSign, Banknote, CreditCard
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";
import { useUpdatePOStatus } from "@/hooks/usePurchaseQueries";
import { humanizeError } from '@/lib/utils/errors';

import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Decimal from "decimal.js";
import Link from "next/link";
import SupplierPaymentModal from "@/components/procurement/SupplierPaymentModal";

// --- Components ---

const Badge = ({ children, variant = "default" }: any) => {
  const styles: any = {
    default: "bg-white/5 text-gray-400 border border-white/10",
    emerald: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    red: "bg-red-500/10 text-red-500 border border-red-500/20",
    blue: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
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

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { fmt, businessId } = usePersona();
  const supabase = createClient();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const toast = useToast();
  const updateStatus = useUpdatePOStatus();
  
  const poId = params.poId as string;

  // Queries
  const { data: po, isLoading: poLoading } = useQuery({
    queryKey: ['purchase_order', poId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, supplier:parties(*)')
        .eq('id', poId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  const { data: items } = useQuery({
    queryKey: ['po_items', poId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('po_line_items')
        .select('*, sku:skus(sku_code, name)')
        .eq('po_id', poId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!po
  });

  const { data: grns } = useQuery({
    queryKey: ['po_grns', poId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goods_received_notes')
        .select('*')
        .eq('po_id', poId)
        .order('received_date', { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: !!po
  });

  const { data: supplierPayments } = useQuery({
    queryKey: ['supplier_payments', poId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_payments')
        .select('*')
        .eq('po_id', poId)
        .order('payment_date', { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: !!po
  });

  const totalPaid = useMemo(() => {
    return (supplierPayments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  }, [supplierPayments]);

  const { data: business } = useQuery({
    queryKey: ['business_profile', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', businessId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!businessId
  });

  if (poLoading) return (
    <div className="min-h-screen bg-[#0F1113] flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.5em] text-gray-700 animate-pulse">
      Orchestrating Procurement Vector...
    </div>
  );

  if (!po) return (
    <div className="min-h-screen bg-[#0F1113] flex flex-col items-center justify-center space-y-4">
      <AlertTriangle className="text-red-500" size={48} />
      <h1 className="text-white uppercase font-black tracking-widest">Order Not Found</h1>
      <button onClick={() => router.back()} className="text-[10px] text-gray-500 hover:text-white uppercase font-black tracking-widest border border-white/10 px-6 py-2 transition-all">Back to Procurement</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter">
      
      
      <main className="transition-all duration-300 min-h-screen flex flex-col print:pl-0">
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40 print:hidden">
           <button onClick={() => router.back()} className="flex items-center space-x-2 text-gray-500 hover:text-white transition-colors mr-8 group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Supply Chain</span>
           </button>
           <div className="h-4 w-px bg-white/10 mx-4" />
           <h1 className="text-[10px] uppercase font-black tracking-[0.3em] text-gray-400">Order Manifesto: {po.po_number}</h1>
           
           <div className="ml-auto flex items-center space-x-3">
              <button onClick={() => window.print()} className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-4 py-2 text-[10px] uppercase font-black tracking-widest border border-white/5 transition-all">
                 <Printer size={12} />
                 <span>Print</span>
              </button>
              <button 
                onClick={() => toast.info("Export Document", "This feature is coming soon")}
                className="flex items-center space-x-2 bg-[#C5A059] hover:brightness-110 px-6 py-2 text-[10px] uppercase font-black tracking-widest text-black transition-all"
              >
                 <Download size={12} />
                 <span>Export Document</span>
              </button>
           </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full flex flex-col lg:flex-row gap-8 print:p-0 print:max-w-none">
           {/* LEFT: PO DOCUMENT (60%) */}
           <section className="flex-1 lg:max-w-[1000px] print:w-full">
              <div className="bg-white text-black min-h-[1100px] p-12 shadow-2xl shadow-black/50 flex flex-col print:shadow-none print:p-8">
                 {/* Header */}
                 <div className="flex justify-between items-start mb-16">
                    <div className="space-y-4">
                       <div className="w-16 h-16 bg-[#C5A059] flex items-center justify-center">
                          <ShoppingCart size={32} className="text-white" />
                       </div>
                       <div>
                          <h2 className="text-xl font-black uppercase tracking-tighter">{business?.business_name || 'Noxis Industrial Hub'}</h2>
                          <p className="text-[10px] text-gray-500 font-medium max-w-[200px] leading-tight mt-1 uppercase tracking-widest">
                             Factory Procurement Division <br/>
                             {business?.address || 'Phase IV Industrial Area, Karachi'}
                          </p>
                       </div>
                    </div>
                    <div className="text-right">
                       <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-200 mb-4">PURCHASE ORDER</h1>
                       <div className="space-y-1">
                          <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Order Number</p>
                          <p className="text-lg font-mono font-black">{po.po_number}</p>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-12 mb-16">
                    <div className="space-y-4">
                       <p className="text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 pb-2 tracking-widest">Supplier Context</p>
                       <div>
                          <h3 className="text-sm font-black uppercase text-[#C5A059]">{po.supplier?.name}</h3>
                          <p className="text-[11px] text-gray-600 mt-2 leading-relaxed">
                             {po.supplier?.address || 'Supplier address not on file'}
                          </p>
                          <div className="flex items-center space-x-4 mt-3">
                             <div className="flex items-center space-x-2">
                                <Phone size={10} className="text-gray-400" />
                                <span className="text-[10px] font-bold">{po.supplier?.phone}</span>
                             </div>
                          </div>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <p className="text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 pb-2 tracking-widest">Temporal Metadata</p>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Order Date</p>
                             <p className="text-[11px] font-black">{po.order_date}</p>
                          </div>
                          <div>
                             <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Expectation</p>
                             <p className="text-[11px] font-black">{po.expected_by || 'Immediate'}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Line Items Table */}
                 <div className="flex-1">
                    <table className="w-full border-collapse">
                       <thead>
                          <tr className="bg-black text-white text-[9px] uppercase font-black tracking-[0.2em] text-left">
                             <th className="py-4 px-3">Item Specification</th>
                             <th className="py-4 px-3 text-right">Qty</th>
                             <th className="py-4 px-3">Unit</th>
                             <th className="py-4 px-3 text-right">Unit Cost</th>
                             <th className="py-4 px-3 text-right">Extended</th>
                          </tr>
                       </thead>
                       <tbody className="text-[11px]">
                          {items?.map((item: any) => (
                            <tr key={item.id} className="border-b border-gray-100">
                               <td className="py-6 px-3">
                                  <p className="font-black uppercase tracking-tight">{item.sku?.name || item.description}</p>
                                  <p className="text-[9px] text-gray-400 mt-1 font-mono">{item.sku?.sku_code}</p>
                               </td>
                               <td className="py-6 px-3 text-right font-mono font-black">{item.qty_ordered}</td>
                               <td className="py-6 px-3 font-bold uppercase text-gray-500 tracking-widest">{item.unit}</td>
                               <td className="py-6 px-3 text-right font-mono font-bold">{fmt(item.unit_cost)}</td>
                               <td className="py-6 px-3 text-right font-mono font-black">{fmt(item.line_total)}</td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>

                 {/* Totals */}
                 <div className="mt-12 flex justify-end">
                    <div className="w-[350px] space-y-3 bg-gray-50 p-6 rounded-sm">
                       <div className="flex justify-between text-[11px]">
                          <span className="uppercase font-black text-gray-400 tracking-widest">Subtotal</span>
                          <span className="font-mono font-bold">{fmt(po.subtotal)}</span>
                       </div>
                       <div className="flex justify-between text-[11px]">
                          <span className="uppercase font-black text-gray-400 tracking-widest">Tax ({po.tax_pct}%)</span>
                          <span className="font-mono font-bold">{fmt(po.tax_amount)}</span>
                       </div>
                       <div className="flex justify-between pt-4 border-t-2 border-black/5">
                          <span className="text-xs uppercase font-black tracking-[0.2em] text-[#C5A059]">Estimated Total</span>
                          <span className="text-xl font-mono font-black">{fmt(po.total)}</span>
                       </div>
                    </div>
                 </div>

                 <div className="mt-16 grid grid-cols-2 gap-12">
                    <div className="space-y-2">
                       <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest">Instructions & Terms</p>
                       <p className="text-[10px] text-gray-600 leading-relaxed italic">
                          {po.notes || "Standard delivery terms apply. All items must be accompanied by an original tax invoice and delivery challan. Quality inspection will be performed at the receiving dock."}
                       </p>
                    </div>
                    <div className="space-y-4">
                       <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest">Authorization</p>
                       <div className="h-px w-full bg-gray-100" />
                       <div className="flex justify-between items-end">
                          <div>
                             <p className="text-[10px] font-black uppercase">Procurement Manager</p>
                             <p className="text-[8px] text-gray-400 uppercase tracking-widest">Digitally Signed</p>
                          </div>
                          <div className="w-12 h-12 bg-gray-50 border border-gray-100 flex items-center justify-center">
                             <FileCheck size={20} className="text-gray-200" />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </section>

           {/* RIGHT: MANAGEMENT PANEL (40%) */}
           <aside className="w-full lg:w-[450px] space-y-8 print:hidden">
              <div className="bg-[#1A1D21] border border-white/5 p-8 space-y-8 sticky top-24">
                 <div className="flex items-center justify-between">
                    <h3 className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em]">Operations Center</h3>
                    <Badge variant={
                      po.status === 'received' ? 'emerald' : 
                      po.status === 'partially_received' ? 'amber' : 
                      po.status === 'cancelled' ? 'red' : 'blue'
                    }>{po.status.replace('_', ' ')}</Badge>
                 </div>

                 <div className="p-6 bg-white/[0.02] border border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Total Order Value</span>
                       <span className="text-xl font-mono font-black text-[#C5A059]">{fmt(po.total)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                       <span className="uppercase font-bold text-gray-700 tracking-widest">Paid to Supplier</span>
                       <span className="font-mono font-bold text-emerald-500">{fmt(totalPaid)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                       <span className="uppercase font-bold text-gray-700 tracking-widest">Balance Payable</span>
                       <span className="font-mono font-bold text-red-400">{fmt(Number(po.total || 0) - totalPaid)}</span>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <Link 
                      href={`/purchase/grn/new?poId=${poId}`}
                      className="w-full flex items-center justify-center space-x-3 bg-emerald-500 hover:brightness-110 p-4 text-[10px] uppercase font-black tracking-widest text-black transition-all shadow-lg shadow-emerald-500/10"
                    >
                       <Truck size={16} />
                       <span>Receive Stock (GRN)</span>
                    </Link>
                     <button 
                       onClick={async () => {
                         if (po.status === 'received') {
                           toast.warning("Already Received", "This purchase order is already marked as received.");
                           return;
                         }
                         if (po.status === 'cancelled') {
                           toast.error("Cancelled Order", "Cannot receive a cancelled purchase order.");
                           return;
                         }
                         if (confirm("Are you sure you want to mark this purchase order as fully received?")) {
                           try {
                             await updateStatus.mutateAsync({ id: po.id, status: 'received' });
                             toast.success("Order Received", "Purchase order status updated to received.");
                            } catch (err: any) {
                              toast.error('Operation failed', humanizeError(err, 'mark PO received'));
                            }
                         }
                       }}
                       className={cn(
                         "w-full flex items-center justify-center space-x-3 bg-white/5 hover:bg-white/10 p-4 text-[10px] uppercase font-black tracking-widest border border-white/5 transition-all group",
                         (po.status === 'received' || po.status === 'cancelled') && "opacity-60 cursor-not-allowed"
                       )}
                       disabled={po.status === 'received' || po.status === 'cancelled'}
                     >
                        <CheckCircle2 size={16} className="text-gray-600 group-hover:text-emerald-500 transition-colors" />
                        <span>Mark as Fully Received</span>
                     </button>
                    <button onClick={() => setShowPaymentModal(true)} className="w-full flex items-center justify-center space-x-3 bg-[#C5A059] hover:brightness-110 p-4 text-[10px] uppercase font-black tracking-widest text-black transition-all shadow-lg shadow-[#C5A059]/10">
                       <DollarSign size={16} />
                       <span>Record Payment</span>
                    </button>
                 </div>

                 <div className="space-y-4 pt-8 border-t border-white/5">
                    <div className="flex items-center justify-between">
                       <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Receiving History</h4>
                       <Badge>{grns.length} GRNs</Badge>
                    </div>
                    {grns.length > 0 ? (
                      <div className="space-y-2">
                         {grns.map((grn: any) => (
                           <div key={grn.id} className="p-4 bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:border-[#C5A059]/30 transition-all cursor-pointer">
                              <div className="flex items-center space-x-3">
                                 <div className="p-2 bg-[#C5A059]/10 text-[#C5A059] rounded-sm">
                                    <Boxes size={14} />
                                 </div>
                                 <div>
                                    <p className="text-[11px] font-bold text-white uppercase">{grn.grn_number}</p>
                                    <p className="text-[9px] text-gray-500 font-mono">Date: {grn.received_date}</p>
                                 </div>
                              </div>
                              <div className="flex flex-col items-end">
                                 <Badge variant={grn.status === 'accepted' ? 'emerald' : 'amber'}>{grn.status}</Badge>
                                 <ChevronRight size={12} className="text-gray-700 mt-2 group-hover:translate-x-1 transition-transform" />
                              </div>
                           </div>
                         ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-sm">
                         <div className="flex flex-col items-center opacity-20">
                            <Truck size={32} strokeWidth={1} />
                            <p className="text-[9px] uppercase font-black tracking-[0.2em] mt-3">No inventory inwarded yet</p>
                         </div>
                      </div>
                    )}
                 </div>

                 {/* Supplier Payment History */}
                 <div className="space-y-4 pt-8 border-t border-white/5">
                    <div className="flex items-center justify-between">
                       <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Payment History</h4>
                       <Badge>{(supplierPayments || []).length} Payments</Badge>
                    </div>
                    {(supplierPayments || []).length > 0 ? (
                      <div className="space-y-2">
                         {(supplierPayments || []).map((pmt: any) => (
                           <div key={pmt.id} className="p-3 bg-white/[0.02] border border-white/5 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                 <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-sm"><Banknote size={12} /></div>
                                 <div>
                                    <p className="text-[10px] font-bold text-white">{fmt(pmt.amount)}</p>
                                    <p className="text-[9px] text-gray-500 font-mono">{pmt.payment_date} • {pmt.payment_method || 'Cash'}</p>
                                 </div>
                              </div>
                              {pmt.reference && <span className="text-[9px] text-gray-600 font-mono">{pmt.reference}</span>}
                           </div>
                         ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-sm">
                         <p className="text-[9px] uppercase font-black tracking-[0.2em] text-gray-600">No payments recorded yet</p>
                      </div>
                    )}
                 </div>

                 <div className="space-y-2 pt-8 border-t border-white/5">
                     <button 
                       onClick={async () => {
                         if (po.status === 'cancelled') {
                           toast.warning("Already Cancelled", "This purchase order is already cancelled.");
                           return;
                         }
                         if (po.status === 'received') {
                           toast.error("Cannot Cancel", "Cannot cancel an order that has already been received.");
                           return;
                         }
                         if (confirm("Are you sure you want to cancel this purchase order? This action is irreversible.")) {
                           try {
                             await updateStatus.mutateAsync({ id: po.id, status: 'cancelled' });
                             toast.success("Order Cancelled", "Purchase order status updated to cancelled.");
                            } catch (err: any) {
                              toast.error('Cancellation failed', humanizeError(err, 'cancel purchase order'));
                            }
                         }
                       }}
                       className={cn(
                         "w-full flex items-center justify-between p-3 text-[9px] uppercase font-black tracking-widest text-gray-500 hover:text-white transition-all group",
                         (po.status === 'cancelled' || po.status === 'received') && "opacity-60 cursor-not-allowed"
                       )}
                       disabled={po.status === 'cancelled' || po.status === 'received'}
                     >
                        <span className="flex items-center space-x-2">
                           <XCircle size={12} className={cn("text-red-500/50 group-hover:text-red-500 transition-colors", (po.status === 'cancelled' || po.status === 'received') && "text-gray-600")} />
                           <span>Cancel Order Manifesto</span>
                        </span>
                     </button>
                     <button 
                       onClick={() => toast.info("Audit History", "Audit history log stream is coming soon")}
                       className="w-full flex items-center justify-between p-3 text-[9px] uppercase font-black tracking-widest text-gray-500 hover:text-white transition-all group"
                     >
                        <span className="flex items-center space-x-2">
                           <History size={12} />
                           <span>View Audit History</span>
                        </span>
                     </button>
                 </div>
              </div>
           </aside>
        </div>
      </main>

      {po && (
        <SupplierPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          poId={poId}
          partyId={po.supplier_id || ''}
          poTotal={Number(po.total || 0)}
          paidSoFar={totalPaid}
        />
      )}
    </div>
  );
}
