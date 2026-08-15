"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingCart, Download, Printer, Plus, Trash2, 
  ChevronLeft, Search, User, Truck, 
  Calendar, FileText, CreditCard
} from "lucide-react";

import { useSidebarState } from "@/hooks/useSidebarState";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Decimal } from "decimal.js";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface POItem {
  id: string;
  description: string;
  qty: number;
  unit: string;
  rate: number;
  total: number;
}

export default function POGenerator() {
  const { isCollapsed } = useSidebarState();
  const { profile } = useBusinessProfile();
  const { fmt, businessId } = usePersona();
  const supabase = createClient();
  

  const [supplier, setSupplier] = useState({
    name: "",
    address: "",
    phone: "",
    contactPerson: ""
  });
  const [poNo, setPoNo] = useState(`PO-${format(new Date(), "yyyyMMdd")}-001`);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [deliveryDate, setDeliveryDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [items, setItems] = useState<POItem[]>([
    { id: '1', description: "", qty: 1, unit: "units", rate: 0, total: 0 }
  ]);
  const [terms, setTerms] = useState("Standard 30 days credit.");
  const [notes, setNotes] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [isSupplierSearchOpen, setIsSupplierSearchOpen] = useState(false);

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers-search-po', supplierSearch],
    queryFn: async () => {
      if (!supplierSearch || supplierSearch.length < 2) return [];
      const { data } = await supabase
        .from('parties')
        .select('*')
        .eq('business_id', businessId)
        .ilike('name', `%${supplierSearch}%`)
        .limit(5);
      return data || [];
    },
    enabled: !!businessId && supplierSearch.length >= 2
  });

  const totals = useMemo(() => {
    const total = items.reduce((acc: Decimal, item: POItem) => acc.plus(new Decimal(item.total)), new Decimal(0));
    return {
      total: total.toNumber()
    };
  }, [items]);

  const handleAddItem = () => {
    setItems([...items, { 
      id: Math.random().toString(36).substr(2, 9), 
      description: "", 
      qty: 1, 
      unit: "units", 
      rate: 0, 
      total: 0 
    }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof POItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'qty' || field === 'rate') {
          updatedItem.total = new Decimal(updatedItem.qty).times(new Decimal(updatedItem.rate)).toNumber();
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSelectSupplier = (p: any) => {
    setSupplier({
      name: p.name,
      address: p.address || "",
      phone: p.phone || "",
      contactPerson: p.contact_name || ""
    });
    setSupplierSearch("");
    setIsSupplierSearchOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200">
      
      
      <main className={cn( "transition-all duration-300 min-h-screen flex flex-col print:p-0")}>
        <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8 print:hidden">
          <div className="flex items-center space-x-4">
            <Link href="/generators" className="p-2 bg-white/5 rounded-sm hover:bg-white/10 transition-colors">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Purchase Order</h1>
              <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-bold mt-1">
                Formal procurement documents for your suppliers
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
            {/* Form Panel */}
            <div className="glass-panel p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Supplier */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-electric-blue pl-3">Supplier Information</h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Supplier Name</label>
                      <div className="relative">
                        <input 
                          type="text"
                          value={supplier.name}
                          onChange={(e) => {
                            setSupplier({...supplier, name: e.target.value});
                            setSupplierSearch(e.target.value);
                            setIsSupplierSearchOpen(true);
                          }}
                          className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50 transition-colors"
                          placeholder="Search supplier..."
                        />
                        {isSupplierSearchOpen && suppliers.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-[#1A1D21] border border-white/10 z-50 mt-1 shadow-2xl">
                            {suppliers.map((p: any) => (
                              <button 
                                key={p.id}
                                onClick={() => handleSelectSupplier(p)}
                                className="w-full px-4 py-2 text-left text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                              >
                                {p.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Office Address</label>
                      <textarea 
                        value={supplier.address}
                        onChange={(e) => setSupplier({...supplier, address: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none h-20 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* PO Meta */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-electric-blue pl-3">Order Details</h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">PO #</label>
                      <input 
                        type="text"
                        value={poNo}
                        onChange={(e) => setPoNo(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Order Date</label>
                        <input 
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Exp. Delivery</label>
                        <input 
                          type="date"
                          value={deliveryDate}
                          onChange={(e) => setDeliveryDate(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-electric-blue pl-3">Items to Procure</h3>
                  <button onClick={handleAddItem} className="flex items-center space-x-2 text-[10px] font-black uppercase text-electric-blue">
                    <Plus size={14} />
                    <span>Add Item</span>
                  </button>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="py-3 text-[10px] font-black uppercase text-gray-500 tracking-widest">Item Description</th>
                      <th className="py-3 text-[10px] font-black uppercase text-gray-500 tracking-widest w-24 text-center">Qty</th>
                      <th className="py-3 text-[10px] font-black uppercase text-gray-500 tracking-widest w-32 text-right">Rate</th>
                      <th className="py-3 text-[10px] font-black uppercase text-gray-500 tracking-widest w-32 text-right">Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {items.map((item) => (
                      <tr key={item.id} className="group">
                        <td className="py-2 pr-4">
                          <input 
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm text-white"
                            placeholder="Description..."
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input 
                            type="number"
                            value={item.qty}
                            onChange={(e) => handleUpdateItem(item.id, 'qty', Number(e.target.value))}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm text-center text-white"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input 
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleUpdateItem(item.id, 'rate', Number(e.target.value))}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm text-right text-white"
                          />
                        </td>
                        <td className="py-2 pl-4 text-right text-sm font-mono text-white">
                          {fmt(item.total)}
                        </td>
                        <td className="py-2 text-right">
                          <button onClick={() => handleRemoveItem(item.id)} className="text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Terms & Conditions</label>
                      <textarea 
                        value={terms}
                        onChange={(e) => setTerms(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none h-24 resize-none"
                      />
                    </div>
                 </div>
                 <div className="p-6 bg-white/5 rounded-sm flex flex-col justify-center items-end">
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Total Order Value</p>
                    <p className="text-3xl font-black text-white font-mono mt-1">{fmt(totals.total)}</p>
                 </div>
              </div>

              <div className="flex justify-end pt-4">
                <button onClick={() => window.print()} className="bg-electric-blue text-white px-12 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest hover:brightness-110 flex items-center space-x-3">
                  <Printer size={16} />
                  <span>Print Purchase Order</span>
                </button>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="w-full max-w-[595px] mx-auto bg-white text-black p-12 pb-24 shadow-2xl space-y-12 min-h-[842px] relative print:fixed print:inset-0 print:m-0 print:shadow-none">
               <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">{profile?.business_name || "Noxis Industrial"}</h2>
                    <div className="text-[9px] text-gray-600 uppercase font-medium leading-relaxed">
                      {profile?.address}<br />
                      {profile?.phone}
                    </div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter text-gray-200">PURCHASE ORDER</h1>
                    <p className="text-[10px] font-black uppercase tracking-widest mt-2"># {poNo}</p>
                    <p className="text-[10px] font-bold text-gray-400">Date: {format(new Date(date), "dd MMM yyyy")}</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-12 border-t border-gray-100 pt-8">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Vendor:</h3>
                    <div className="space-y-1">
                      <p className="text-sm font-black uppercase">{supplier.name || "Vendor Name"}</p>
                      <p className="text-[9px] text-gray-600 uppercase whitespace-pre-wrap">{supplier.address || "Vendor Address"}</p>
                      {supplier.phone && <p className="text-[9px] text-gray-600">Contact: {supplier.phone}</p>}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ship To:</h3>
                    <div className="space-y-1">
                      <p className="text-sm font-black uppercase">{profile?.business_name}</p>
                      <p className="text-[9px] text-gray-600 uppercase">{profile?.address}</p>
                    </div>
                  </div>
               </div>

               <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-black">
                      <th className="py-4 text-[10px] font-black uppercase tracking-widest">Item Description</th>
                      <th className="py-4 text-[10px] font-black uppercase tracking-widest w-20 text-center">Qty</th>
                      <th className="py-4 text-[10px] font-black uppercase tracking-widest w-32 text-right">Rate</th>
                      <th className="py-4 text-[10px] font-black uppercase tracking-widest w-32 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="py-4">
                          <p className="text-xs font-bold uppercase">{item.description || `Line Item ${idx+1}`}</p>
                        </td>
                        <td className="py-4 text-center">
                          <p className="text-xs font-mono">{item.qty} {item.unit}</p>
                        </td>
                        <td className="py-4 text-right">
                          <p className="text-xs font-mono">{fmt(item.rate)}</p>
                        </td>
                        <td className="py-4 text-right">
                          <p className="text-xs font-black font-mono">{fmt(item.total)}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>

               <div className="flex justify-between items-start border-t border-gray-100 pt-8">
                  <div className="max-w-[300px] space-y-4">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Expected Delivery:</h3>
                      <p className="text-xs font-bold">{format(new Date(deliveryDate), "dd MMMM yyyy")}</p>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Terms:</h3>
                      <p className="text-[9px] text-gray-600 italic">{terms}</p>
                    </div>
                  </div>
                  <div className="w-64 space-y-4">
                     <div className="flex justify-between items-center border-t-2 border-black pt-4">
                        <span className="text-xs font-black uppercase tracking-widest">Total Amount</span>
                        <span className="text-xl font-black font-mono">{fmt(totals.total)}</span>
                     </div>
                  </div>
               </div>

               <div className="pt-20 flex justify-end">
                  <div className="text-center space-y-2">
                    <div className="h-[1px] bg-black w-48" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Authorized Signature</p>
                  </div>
               </div>

               <div className="text-center opacity-5 pointer-events-none absolute bottom-12 left-0 right-0">
                  <p className="text-[80px] font-black tracking-tighter uppercase italic opacity-20">NOXIS HUB</p>
               </div>

               <div style={{
                 position: 'absolute',
                 bottom: 0,
                 left: 0,
                 right: 0,
                 borderTop: '1px solid #e5e7eb',
                 padding: '8px 24px',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'space-between',
                 backgroundColor: '#ffffff'
               }}>
                 <span style={{
                   fontSize: 9,
                   color: '#9CA3AF',
                   fontFamily: 'Inter, sans-serif',
                   letterSpacing: '0.05em',
                 }}>
                   🔒 Securely logged by Noxis Hub
                 </span>
                 <span style={{
                   fontSize: 9,
                   color: '#9CA3AF',
                   fontFamily: 'Inter, sans-serif',
                   letterSpacing: '0.05em',
                 }}>
                   Powered by Omnora Labs · noxishub.app
                 </span>
               </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background: white !important;
          }
          .custom-scrollbar::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
