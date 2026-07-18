"use client";

import React, { useState, useMemo, useEffect } from "react";
import { BusinessProfile } from "@/store/BusinessProfileStore";
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
import { useToast } from "@/hooks/useToast";
import { useRouter } from 'next/navigation';
import InvoiceSelector from "@/components/ui/InvoiceSelector";
import { humanizeError } from '@/lib/utils/errors';
import { Skeleton } from "@/components/ui/Skeleton";
import { generateDeliveryChallan } from '@/lib/dispatch/generateChallan';

// --- Types ---
interface DispatchOrder {
  id: string;
  invoice_no: string;
  party: { name: string; address?: string };
  items: { qty: number; unit: string; description: string }[];
  total_amount: number;
  status: string;
  metadata: {
    dispatch_status?: 'pending' | 'packed' | 'out_for_delivery' | 'delivered' | 'returned' | 'cancelled';
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
  const router = useRouter();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [printingOrder, setPrintingOrder] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State for the new dispatch modal
  const [newDispatchOpen, setNewDispatchOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [driverName, setDriverName] = useState('');
  const [vehicleNum, setVehicleNum] = useState('');
  const [saving, setSaving] = useState(false);

  const loadOrders = async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('dispatch_orders')
        .select(`
          *,
          party:parties(id, name, address),
          invoice:invoices(
            id, invoice_no, total,
            items:invoice_items(qty, unit, description)
          )
        `)
        .eq('business_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('[Dispatch]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profile?.id) return;

    const timeout = setTimeout(() => {
      setLoading(false);
    }, 6000);

    loadOrders().then(() => {
      clearTimeout(timeout);
    });

    return () => clearTimeout(timeout);
  }, [profile?.id]);

  const stats = useMemo(() => {
    const pending = orders.filter(o => o.status === 'pending' || o.status === 'packed').length;
    const outForDelivery = orders.filter(o => o.status === 'out_for_delivery').length;
    const deliveredToday = orders.filter(o => o.status === 'delivered').length;
    return { pending, outForDelivery, deliveredToday };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const partyName = order.party?.name || "";
      const invNo = order.invoice?.invoice_no || "";
      const matchesSearch = invNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            partyName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "All" || statusFilter === "All Status" || 
                            order.status.toLowerCase() === statusFilter.toLowerCase() ||
                            (statusFilter === "Dispatched" && order.status === "out_for_delivery");
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  if (printingOrder) {
    // Normalize printingOrder to fit DispatchOrder shape
    const normalizedOrder: DispatchOrder = {
      id: printingOrder.id,
      invoice_no: printingOrder.invoice?.invoice_no || '—',
      party: printingOrder.party || { name: 'No customer', address: '' },
      items: printingOrder.invoice?.items || [],
      total_amount: printingOrder.invoice?.total || 0,
      status: printingOrder.status,
      metadata: {
        dispatch_status: printingOrder.status,
        driver_name: printingOrder.driver_name,
        vehicle_info: printingOrder.vehicle_number
      },
      issue_date: printingOrder.created_at || new Date().toISOString()
    };
    return <DispatchNote order={normalizedOrder} onBack={() => setPrintingOrder(null)} profile={profile} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 font-inter flex">
      <main className={cn("flex-1 transition-all duration-300 min-h-screen flex flex-col")}>
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
              <button 
                onClick={async () => {
                  const pendingIds = orders
                    .filter(o => o.status !== 'delivered'
                      && o.status !== 'cancelled'
                      && o.status !== 'returned')
                    .map(o => o.id)

                  if (pendingIds.length === 0) {
                    toast.info('No pending orders to mark')
                    return
                  }

                  if (!confirm(
                    `Mark ${pendingIds.length} order${pendingIds.length > 1 ? 's' : ''} as delivered?`
                  )) return

                  const { error } = await supabase
                    .from('dispatch_orders')
                    .update({
                      status: 'delivered',
                      delivered_at: new Date().toISOString(),
                    })
                    .in('id', pendingIds)
                    .eq('business_id', profile?.id)

                  if (!error) {
                    toast.success(`${pendingIds.length} orders marked as delivered`)
                    loadOrders()
                  } else {
                    toast.error(humanizeError(error, 'mark orders as delivered'))
                  }
                }}
                className="px-6 py-2 bg-white/5 border border-white/10 text-white text-[10px] uppercase tracking-widest font-black hover:bg-white/10 transition-all"
              >
                 Mark All Delivered
              </button>
              <button 
                onClick={() => setNewDispatchOpen(true)}
                className="px-6 py-2 bg-[#60A5FA] text-black text-[10px] uppercase tracking-widest font-black hover:brightness-110 transition-all shadow-lg"
              >
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
                color="text-[#60A5FA]" 
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
                   className="w-full bg-[#0A0A0B] border border-white/10 pl-10 pr-4 py-2 text-xs text-white focus:border-[#60A5FA]/50 outline-none transition-all"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              <div className="flex items-center space-x-3">
                 <select 
                   value={statusFilter}
                   onChange={(e) => setStatusFilter(e.target.value)}
                   className="bg-[#0A0A0B] border border-white/10 px-4 py-2 text-[10px] uppercase font-bold text-gray-400 outline-none focus:border-[#60A5FA]/50"
                 >
                    <option>All Status</option>
                    <option>Pending</option>
                    <option>Packed</option>
                    <option>Dispatched</option>
                    <option>Delivered</option>
                    <option>Returned</option>
                 </select>
                  <button 
                    onClick={() => toast.info("Filter", "Advanced logistical filtering is coming soon")}
                    className="p-2 border border-white/10 text-gray-500 hover:text-white transition-all"
                  >
                     <Filter size={16} />
                  </button>
              </div>
           </div>

           {/* Queue Table */}
           <div className="bg-[#0F1114] border border-white/6 rounded-sm overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                 <h3 className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Active Dispatch Queue</h3>
                 <span className="text-[9px] text-gray-600 font-mono italic">Real-time sync active</span>
              </div>

              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-4 bg-[#0F1114] border border-white/5 animate-pulse rounded-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded-sm" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-8 w-24 rounded-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="text-4xl mb-4">📦</div>
                  <p className="text-sm font-medium text-white mb-2">
                    No dispatch orders yet
                  </p>
                  <p className="text-xs text-gray-500 max-w-xs">
                    Create a dispatch order when you are ready to send goods to a customer.
                  </p>
                  <button
                    onClick={() => setNewDispatchOpen(true)}
                    className="mt-5 px-5 py-2.5 text-xs font-bold bg-[#60A5FA] text-black hover:bg-blue-400 transition-colors"
                  >
                    + New Dispatch Order
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {filteredOrders.map(order => (
                    <DispatchOrderRow
                      key={order.id}
                      order={order}
                      onStatusChange={loadOrders}
                      businessId={profile?.id}
                      onPrint={setPrintingOrder}
                    />
                  ))}
                </div>
              )}
           </div>
        </div>
      </main>

      {/* New Dispatch Modal */}
      {newDispatchOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F1114] border border-white/10 rounded-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <p className="text-sm font-semibold text-white">
                New Dispatch Order
              </p>
              <button
                onClick={() => setNewDispatchOpen(false)}
                className="text-gray-600 hover:text-gray-300 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Invoice selector */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 block mb-1.5">
                  Invoice / Order *
                </label>
                <InvoiceSelector
                  businessId={profile?.id}
                  onSelect={setSelectedInvoice}
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 block mb-1.5">
                  Driver Name
                </label>
                <input
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                  placeholder="e.g. Ali Driver"
                  className="w-full bg-[#161A1F] border border-white/8 text-white text-sm px-3 py-2.5 outline-none focus:border-[#60A5FA]/40 placeholder:text-gray-700"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 block mb-1.5">
                  Vehicle / Transporter
                </label>
                <input
                  value={vehicleNum}
                  onChange={e => setVehicleNum(e.target.value)}
                  placeholder="e.g. LHR-1234 / TCS"
                  className="w-full bg-[#161A1F] border border-white/8 text-white text-sm px-3 py-2.5 outline-none focus:border-[#60A5FA]/40 placeholder:text-gray-700"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setNewDispatchOpen(false)}
                  className="flex-1 py-2.5 text-sm border border-white/10 text-gray-400 hover:border-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!profile?.id) return;
                    setSaving(true);
                    try {
                      const { error } = await supabase
                        .from('dispatch_orders')
                        .insert({
                          business_id: profile.id,
                          invoice_id: selectedInvoice?.id || null,
                          party_id: selectedInvoice?.party_id || null,
                          status: 'pending',
                          driver_name: driverName.trim() || null,
                          vehicle_number: vehicleNum.trim() || null,
                        });

                      if (error) throw error;

                      toast.success('Dispatch order created');
                      setNewDispatchOpen(false);
                      setDriverName('');
                      setVehicleNum('');
                      setSelectedInvoice(null);
                      loadOrders();
                    } catch (err: any) {
                      toast.error(humanizeError(err, 'create dispatch order'));
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="flex-1 py-2.5 text-sm font-bold bg-[#60A5FA] text-black hover:bg-blue-400 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Creating...' : 'Create Dispatch'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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

function DispatchOrderRow({
  order, onStatusChange, businessId, onPrint
}: {
  order: any
  onStatusChange: () => void
  businessId?: string
  onPrint: (order: any) => void
}) {
  const supabase = createClient()
  const [updating, setUpdating] = useState(false)

  const STATUS_CONFIG: Record<string, {
    label: string; color: string; next: string | null
  }> = {
    pending:          { label: 'Pending',       color: 'text-amber-400 bg-amber-500/10',    next: 'packed' },
    packed:           { label: 'Packed',         color: 'text-blue-400 bg-blue-500/10',      next: 'out_for_delivery' },
    out_for_delivery: { label: 'Out for Delivery', color: 'text-purple-400 bg-purple-500/10', next: 'delivered' },
    delivered:        { label: 'Delivered',      color: 'text-emerald-400 bg-emerald-500/10', next: null },
    returned:         { label: 'Returned',       color: 'text-red-400 bg-red-500/10',        next: null },
    cancelled:        { label: 'Cancelled',      color: 'text-gray-500 bg-white/5',          next: null },
  }

  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

  const advanceStatus = async () => {
    if (!config.next || updating) return
    setUpdating(true)
    try {
      const update: any = { status: config.next }
      if (config.next === 'delivered') {
        update.delivered_at = new Date().toISOString()
      }
      if (config.next === 'out_for_delivery') {
        update.dispatched_at = new Date().toISOString()
      }
      await supabase
        .from('dispatch_orders')
        .update(update)
        .eq('id', order.id)
        .eq('business_id', businessId)
      onStatusChange()
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 bg-[#0F1114] border border-white/6 rounded-sm hover:border-white/10 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-sm bg-white/5 border border-white/8 flex items-center justify-center text-gray-500 text-xs font-mono">
          📦
        </div>
        <div>
          <p className="text-sm font-medium text-white">
            {order.party?.name || 'No customer'}
          </p>
          <p className="text-[10px] text-gray-600 mt-0.5">
            {order.invoice?.invoice_no || '—'}
            {order.driver_name ? ` · ${order.driver_name}` : ''}
            {order.vehicle_number ? ` · ${order.vehicle_number}` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${config.color}`}>
          {config.label}
        </span>

        {config.next && (
          <button
            onClick={advanceStatus}
            disabled={updating}
            className="text-[10px] font-semibold text-[#60A5FA] border border-[#60A5FA]/25 px-3 py-1.5 hover:bg-[#60A5FA]/10 transition-colors disabled:opacity-40"
          >
            {updating ? '...' : `Mark ${STATUS_CONFIG[config.next]?.label}`}
          </button>
        )}

        <button 
          onClick={() => onPrint(order)}
          className="p-2 text-gray-500 hover:text-white transition-colors"
          title="Print Dispatch Note"
        >
          <Printer size={14} />
        </button>
      </div>
    </div>
  )
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
                <p className="text-[10px] font-bold">DATE: <span className="font-mono">{new Date(order.issue_date).toLocaleDateString()}</span></p>
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
                   <p>Vehicle: {order.metadata.vehicle_info || "____________________"}</p>
                   <p>Driver Name: {order.metadata.driver_name || "____________________"}</p>
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
                   {order.items.length === 0 && (
                     <tr>
                       <td colSpan={4} className="py-4 text-center text-xs text-gray-400">No items on this invoice.</td>
                     </tr>
                   )}
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
             <button
                onClick={() => generateDeliveryChallan({
                  businessName: profile?.business_name || 'Noxis Hub',
                  businessAddress: profile?.address || undefined,
                  businessPhone: profile?.phone || undefined,
                  challanNumber: order.invoice_no,
                  challanDate: new Date(order.issue_date).toLocaleDateString('en-PK'),
                  dispatchOrder: {
                    id: order.id,
                    vehicle_number: order.metadata.vehicle_info,
                    driver_name: order.metadata.driver_name,
                    delivery_address: order.party.address,
                  },
                  party: {
                    name: order.party.name,
                    address: order.party.address,
                  },
                  items: order.items.map(item => ({
                    name: item.description,
                    quantity: item.qty,
                    unit: item.unit,
                  })),
                  currency: (profile as any)?.currency || 'PKR',
                })}
                className="print:hidden ml-4 px-8 py-2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all"
              >
                📄 Print Challan PDF
              </button>
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
