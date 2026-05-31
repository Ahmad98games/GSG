"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollReveal3D } from "@/components/ui/AnimatedComponents";
import { 
  FileText, Download, Printer, Plus, Trash2, 
  ChevronLeft, Search, User, 
  Mail, Phone, MapPin, Globe, CreditCard
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
import { formatCurrency, CurrencyCode, CURRENCIES } from "@/lib/currency/currencyEngine";
import { numberToWords } from "@/utils/NumberToWords";

interface LineItem {
  id: string;
  description: string;
  qty: string | number;
  unit: string;
  rate: string | number;
  total: number;
}

export default function InvoiceGenerator() {
  const { isCollapsed } = useSidebarState();
  const { profile, taxName, taxRate: profileTaxRate, currency: profileCurrency } = useBusinessProfile();
  const { fmt, businessId } = usePersona();
  const supabase = createClient();
  

  const [activeTab, setActiveTab] = useState<"invoice" | "challan">("invoice");
  const [billTo, setBillTo] = useState({
    name: "",
    address: "",
    phone: "",
    email: ""
  });
  const [invoiceNo, setInvoiceNo] = useState(`INV-${format(new Date(), "yyyyMMdd")}-001`);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: "", qty: 1, unit: "units", rate: 0, total: 0 }
  ]);
  const [taxRate, setTaxRate] = useState(0);
  const [currency, setCurrency] = useState<CurrencyCode>('PKR');

  useEffect(() => {
    if (profile) {
      setTaxRate(profile.tax_rate || 0);
      setCurrency((profile.currency as CurrencyCode) || 'PKR');
    }
  }, [profile]);
  const [notes, setNotes] = useState("");
  const [partySearch, setPartySearch] = useState("");
  const [isPartySearchOpen, setIsPartySearchOpen] = useState(false);

  // Party Search
  const { data: parties = [] } = useQuery({
    queryKey: ['parties-search', partySearch],
    queryFn: async () => {
      if (!partySearch || partySearch.length < 2) return [];
      const { data } = await supabase
        .from('parties')
        .select('*')
        .eq('business_id', businessId)
        .ilike('name', `%${partySearch}%`)
        .limit(5);
      return data || [];
    },
    enabled: !!businessId && partySearch.length >= 2
  });

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((acc: Decimal, item: LineItem) => acc.plus(new Decimal(item.total)), new Decimal(0));
    const taxAmount = subtotal.times(new Decimal(taxRate).div(100));
    const total = subtotal.plus(taxAmount);
    return {
      subtotal: subtotal.toNumber(),
      taxAmount: taxAmount.toNumber(),
      total: total.toNumber()
    };
  }, [lineItems, taxRate]);

  const [docHash] = useState(() => Math.random().toString(36).substring(7).toUpperCase());

  const handleAddItem = () => {
    setLineItems([...lineItems, { 
      id: Math.random().toString(36).substr(2, 9), 
      description: "", 
      qty: 1, 
      unit: "units", 
      rate: 0, 
      total: 0 
    }]);
  };

  const handleRemoveItem = (id: string) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'qty' || field === 'rate') {
          const q = new Decimal(updatedItem.qty || 0);
          const r = new Decimal(updatedItem.rate || 0);
          updatedItem.total = q.times(r).toNumber();
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSelectParty = (party: any) => {
    setBillTo({
      name: party.name,
      address: party.address || "",
      phone: party.phone || "",
      email: party.email || ""
    });
    setPartySearch("");
    setIsPartySearchOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200">
      
      
      <main className={cn( "transition-all duration-300 min-h-screen flex flex-col print:p-0 print:pl-0")}>
        <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/generators" className="p-2 bg-white/5 rounded-sm hover:bg-white/10 transition-colors">
                <ChevronLeft size={20} />
              </Link>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Invoice Generator</h1>
                <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-bold mt-1">
                  Create professional billing and delivery documents
                </p>
              </div>
            </div>
            
            <div className="flex items-center bg-white/5 p-1 rounded-sm">
              <button 
                onClick={() => setActiveTab("invoice")}
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm",
                  activeTab === "invoice" ? "bg-electric-blue text-white shadow-lg" : "text-gray-500 hover:text-white"
                )}
              >
                Invoice
              </button>
              <button 
                onClick={() => setActiveTab("challan")}
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm",
                  activeTab === "challan" ? "bg-electric-blue text-white shadow-lg" : "text-gray-500 hover:text-white"
                )}
              >
                Challan
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
            {/* Form Panel */}
            <ScrollReveal3D className="no-print">
              <div className="glass-panel p-8 space-y-8 no-print">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bill To */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-electric-blue pl-3">Recipient Details</h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Customer Name</label>
                      <div className="relative">
                        <input 
                          type="text"
                          value={billTo.name}
                          onChange={(e) => {
                            setBillTo({...billTo, name: e.target.value});
                            setPartySearch(e.target.value);
                            setIsPartySearchOpen(true);
                          }}
                          className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50 transition-colors"
                          placeholder="Search or enter manually"
                        />
                        {isPartySearchOpen && parties.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-[#1A1D21] border border-white/10 z-50 mt-1 shadow-2xl">
                            {parties.map((p: any) => (
                              <button 
                                key={p.id}
                                onClick={() => handleSelectParty(p)}
                                className="w-full px-4 py-2 text-left text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-colors flex items-center space-x-2"
                              >
                                <User size={12} />
                                <span>{p.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Address</label>
                      <textarea 
                        value={billTo.address}
                        onChange={(e) => setBillTo({...billTo, address: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50 transition-colors h-20 resize-none"
                        placeholder="Street, City, State, Country"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Phone</label>
                        <input 
                          type="text"
                          value={billTo.phone}
                          onChange={(e) => setBillTo({...billTo, phone: e.target.value})}
                          className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50 transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Email</label>
                        <input 
                          type="email"
                          value={billTo.email}
                          onChange={(e) => setBillTo({...billTo, email: e.target.value})}
                          className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meta Details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-electric-blue pl-3">Document Info</h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">{activeTab === "invoice" ? "Invoice" : "Challan"} #</label>
                      <input 
                        type="text"
                        value={invoiceNo}
                        onChange={(e) => setInvoiceNo(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Currency</label>
                      <select 
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                        className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50 transition-colors"
                      >
                        {Object.keys(CURRENCIES).map(c => (
                          <option key={c} value={c}>{CURRENCIES[c as CurrencyCode].name} ({c})</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Date</label>
                        <input 
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50 transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Due Date</label>
                        <input 
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-electric-blue pl-3">Line Items</h3>
                  <button 
                    onClick={handleAddItem}
                    className="flex items-center space-x-2 text-[10px] font-black uppercase text-electric-blue hover:text-white transition-colors"
                  >
                    <Plus size={14} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left py-3 text-[10px] font-black uppercase text-gray-500 tracking-widest">Description</th>
                        <th className="text-center py-3 text-[10px] font-black uppercase text-gray-500 tracking-widest w-20">Qty</th>
                        <th className="text-center py-3 text-[10px] font-black uppercase text-gray-500 tracking-widest w-24">Unit</th>
                        <th className="text-right py-3 text-[10px] font-black uppercase text-gray-500 tracking-widest w-32">Rate</th>
                        <th className="text-right py-3 text-[10px] font-black uppercase text-gray-500 tracking-widest w-32">Total</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {lineItems.map((item) => (
                        <tr key={item.id} className="group">
                          <td className="py-2 pr-4">
                            <input 
                              type="text"
                              value={item.description}
                              onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                              className="w-full bg-transparent border-none focus:ring-0 text-sm text-white"
                              placeholder="Service or Product name"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input 
                              type="number"
                              value={item.qty || ''}
                              onChange={(e) => handleUpdateItem(item.id, 'qty', e.target.value)}
                              className="w-full bg-transparent border-none focus:ring-0 text-sm text-center text-white"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input 
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                              className="w-full bg-transparent border-none focus:ring-0 text-sm text-center text-white"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input 
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate || ''}
                              onChange={(e) => handleUpdateItem(item.id, 'rate', e.target.value)}
                              className="w-full bg-transparent border-none focus:ring-0 text-sm text-right text-white"
                            />
                          </td>
                          <td className="py-2 pl-4 text-right text-sm font-mono text-white">
                            {formatCurrency(item.total, currency)}
                          </td>
                          <td className="py-2 text-right">
                            <button 
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-gray-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-electric-blue pl-3">Notes & Terms</h3>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50 transition-colors h-32 resize-none"
                    placeholder="Enter payment terms, shipping notes, etc."
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-electric-blue pl-3">Summary</h3>
                  <div className="space-y-2 p-4 bg-white/5 rounded-sm">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 uppercase font-black">Subtotal</span>
                      <span className="text-white font-mono">{formatCurrency(totals.subtotal, currency)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 uppercase font-black">{taxName} Rate (%)</span>
                      <input 
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        className="w-16 bg-white/5 border border-white/5 px-2 py-1 text-right text-white focus:outline-none focus:border-electric-blue/50 transition-colors"
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 uppercase font-black">{taxName} Amount</span>
                      <span className="text-white font-mono">{formatCurrency(totals.taxAmount, currency)}</span>
                    </div>
                    <div className="h-[1px] bg-white/10 my-2" />
                    <div className="flex justify-between text-base">
                      <span className="text-electric-blue uppercase font-black">Total</span>
                      <span className="text-white font-black font-mono">{formatCurrency(totals.total, currency)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={handlePrint}
                  className="no-print bg-electric-blue text-white px-8 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg flex items-center space-x-3"
                >
                  <Printer size={16} />
                  <span>Generate & Print</span>
                </button>
              </div>
            </div>
            </ScrollReveal3D>

            {/* Preview Panel */}
            <ScrollReveal3D className="sticky top-24 w-full max-w-[595px] mx-auto print:static">
              <div className="overflow-hidden rounded-sm border border-white/10 bg-white shadow-2xl flex flex-col h-[842px] w-full text-black font-sans print:fixed print:inset-0 print:m-0 print:border-none print:shadow-none print:w-full print:max-w-none print:h-auto invoice-preview relative">
              <div className="flex-1 p-12 pb-24 space-y-12 overflow-y-auto print:overflow-visible custom-scrollbar print:p-8">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      {profile?.logo_url ? (
                        <div className="w-16 h-16 relative grayscale print:grayscale-0">
                          <img src={profile.logo_url} alt={profile.business_name || 'Logo'} className="object-contain" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-black flex items-center justify-center rounded-sm">
                           <img src="/logos/noxis.png" alt="Noxis" className="w-10 h-10 invert" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">{profile?.business_name || "Noxis Industrial Hub"}</h2>
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-600 leading-relaxed uppercase font-medium">
                      {profile?.address || "Street Address, Industrial Area"}<br />
                      {profile?.phone || "Contact: +1 XXXXXXXXXX"}<br />
                      {profile?.tax_number ? `${taxName}: ${profile.tax_number}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-5xl font-black uppercase italic tracking-tighter text-gray-200 print:text-gray-300 mb-4">{activeTab === "invoice" ? "INVOICE" : "CHALLAN"}</h1>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400"># {invoiceNo}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date: {format(new Date(date), "dd MMM yyyy")}</p>
                      {activeTab === "invoice" && <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Due: {format(new Date(dueDate), "dd MMM yyyy")}</p>}
                    </div>
                  </div>
                </div>

                {/* Recipient */}
                <div className="grid grid-cols-2 gap-12 border-t border-gray-100 pt-8">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bill To:</h3>
                    <div className="space-y-1">
                      <p className="text-sm font-black uppercase">{billTo.name || "Customer Name"}</p>
                      <p className="text-[10px] text-gray-600 uppercase whitespace-pre-wrap">{billTo.address || "Customer Address"}</p>
                      <p className="text-[10px] text-gray-600">{billTo.phone && `Phone: ${billTo.phone}`}</p>
                    </div>
                  </div>
                  {activeTab === "challan" && (
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Delivery Details:</h3>
                      <div className="space-y-1">
                        <p className="text-[10px] text-gray-600 uppercase">Method: Self Pickup / Transport</p>
                        <p className="text-[10px] text-gray-600 uppercase">Ref #: {invoiceNo}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Table */}
                <div className="space-y-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-black">
                        <th className="text-left py-4 text-[10px] font-black uppercase tracking-widest">Description</th>
                        <th className="text-center py-4 text-[10px] font-black uppercase tracking-widest w-20">Qty</th>
                        {activeTab === "invoice" && (
                          <>
                            <th className="text-right py-4 text-[10px] font-black uppercase tracking-widest w-32">Rate</th>
                            <th className="text-right py-4 text-[10px] font-black uppercase tracking-widest w-32">Total</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lineItems.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="py-4">
                            <p className="text-xs font-bold uppercase">{item.description || `Item Line ${idx + 1}`}</p>
                          </td>
                          <td className="py-4 text-center">
                            <p className="text-xs font-mono">{item.qty} {item.unit}</p>
                          </td>
                          {activeTab === "invoice" && (
                            <>
                              <td className="py-4 text-right">
                                <p className="text-xs font-mono">{formatCurrency(item.rate, currency)}</p>
                              </td>
                              <td className="py-4 text-right">
                                <p className="text-xs font-black font-mono">{formatCurrency(item.total, currency)}</p>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-between items-start border-t border-gray-100 pt-8">
                  <div className="max-w-[300px]">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Notes:</h3>
                    <p className="text-[9px] text-gray-600 leading-relaxed italic">{notes || "Standard terms and conditions apply. Payment is expected by the due date mentioned above."}</p>
                  </div>
                  {activeTab === "invoice" ? (
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-400 uppercase font-black tracking-widest">Subtotal</span>
                        <span className="font-mono">{formatCurrency(totals.subtotal, currency)}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-400 uppercase font-black tracking-widest">{taxName} ({taxRate}%)</span>
                        <span className="font-mono">{formatCurrency(totals.taxAmount, currency)}</span>
                      </div>
                      <div className="h-[1px] bg-gray-100 my-4" />
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-widest">Total Payable</span>
                        <span className="text-xl font-black font-mono">{formatCurrency(totals.total, currency)}</span>
                      </div>
                      <div className="pt-4 mt-4 border-t border-gray-100">
                        <p className="text-[7px] uppercase font-black text-gray-400 mb-1">Amount in Words</p>
                        <p className="text-[9px] font-bold italic text-gray-800">{numberToWords(totals.total, currency)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-12 mt-12">
                      <div className="text-center space-y-4">
                        <div className="h-[1px] w-32 bg-black mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Prepared By</p>
                      </div>
                      <div className="text-center space-y-4">
                        <div className="h-[1px] w-32 bg-black mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Received By</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 pt-8 flex justify-between items-end">
                   <div className="space-y-2">
                     <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Generated via Noxis Hub Intelligence</p>
                     <p className="text-[8px] text-gray-400 font-mono">HASH: {docHash}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-xs font-black uppercase italic tracking-tighter">Thank you for your business</p>
                   </div>
                </div>

                {/* Watermark */}
                {!profile?.logo_url && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-[-45deg] z-0">
                    <span className="text-[120px] font-black tracking-[0.5em]">NOXIS</span>
                  </div>
                )}
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
            </ScrollReveal3D>
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
