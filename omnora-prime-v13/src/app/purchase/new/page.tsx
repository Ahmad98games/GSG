"use client";
import { useEffect, useMemo, useState } from 'react';
import React from 'react';
// src/app/purchase/new/page.tsx
import { useRouter, useSearchParams } from "next/navigation";
import { usePersona } from "@/hooks/usePersona";
import { useSuppliers, useCreatePO, useSupplierScorecards } from "@/hooks/usePurchaseQueries";
import { createClient } from "@/lib/supabase/client";
import { 
  Plus, Trash2, Save, ShoppingCart, 
  Search, Calendar, Clock, AlertTriangle,
  ChevronDown, User, FileText, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Decimal } from "decimal.js";

interface POLineItem {
  sku_id: string;
  sku_code: string;
  description: string;
  qty_ordered: number;
  unit: string;
  unit_cost: number;
  line_total: number;
}

export default function NewPurchaseOrder() {
  const { t, fmt, persona } = usePersona();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const { data: suppliers } = useSuppliers();
  const { data: scorecards } = useSupplierScorecards();
  const createPO = useCreatePO();

  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [expectedBy, setExpectedBy] = useState("");
  const [items, setItems] = useState<POLineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [isSearchingSkus, setIsSearchingSkus] = useState(false);
  const [skuSearchResults, setSkuSearchResults] = useState<any[]>([]);
  const [skuSearchQuery, setSkuSearchQuery] = useState("");

  const activeScorecard = useMemo(() => 
    scorecards?.find((s: any) => s.supplier_id === selectedSupplierId), 
  [scorecards, selectedSupplierId]);

  // Pre-fill from suggestions if present
  useEffect(() => {
    const suggestedSupplier = searchParams.get("supplierId");
    const suggestedSku = searchParams.get("skuId");
    const suggestedQty = searchParams.get("qty");
    
    if (suggestedSupplier) setSelectedSupplierId(suggestedSupplier);
    if (suggestedSku) {
      // Fetch SKU details and add to items
      const fetchSku = async () => {
        const { data } = await supabase.from('skus').select('*').eq('id', suggestedSku).single();
        if (data) {
          const newItem: POLineItem = {
            sku_id: data.id,
            sku_code: data.sku_code,
            description: data.name,
            qty_ordered: Number(suggestedQty) || 1,
            unit: data.unit || 'unit',
            unit_cost: data.cost_price || 0,
            line_total: (Number(suggestedQty) || 1) * (data.cost_price || 0)
          };
          setItems([newItem]);
        }
      };
      fetchSku();
    }
  }, [searchParams, supabase, persona]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc.plus(item.line_total), new Decimal(0));
    const taxPct = persona?.tax_rate || 0;
    const taxAmount = subtotal.times(taxPct / 100);
    const total = subtotal.plus(taxAmount);
    return { subtotal, taxAmount, total };
  }, [items, persona]);

  const addItem = () => {
    const newItem: POLineItem = {
      sku_id: "",
      sku_code: "",
      description: "",
      qty_ordered: 1,
      unit: 'unit',
      unit_cost: 0,
      line_total: 0
    };
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, field: keyof POLineItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'qty_ordered' || field === 'unit_cost') {
      item.line_total = Number(new Decimal(item.qty_ordered || 0).times(item.unit_cost || 0).toFixed(2));
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const searchSkus = async (query: string) => {
    setSkuSearchQuery(query);
    if (query.length < 2) {
      setSkuSearchResults([]);
      return;
    }
    setIsSearchingSkus(true);
    const { data } = await supabase
      .from('skus')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(5);
    setSkuSearchResults(data || []);
    setIsSearchingSkus(false);
  };

  const selectSku = (index: number, sku: any) => {
    updateItem(index, 'sku_id', sku.id);
    updateItem(index, 'sku_code', sku.sku_code);
    updateItem(index, 'description', sku.name);
    updateItem(index, 'unit', sku.unit || 'unit');
    updateItem(index, 'unit_cost', sku.cost_price || 0);
    setSkuSearchResults([]);
    setSkuSearchQuery("");
  };

  const handleSave = async (status: 'draft' | 'sent') => {
    if (!selectedSupplierId) {
      alert("Please select a supplier");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one item");
      return;
    }

    const payload = {
      business_id: persona?.id,
      supplier_id: selectedSupplierId,
      status,
      expected_by: expectedBy || null,
      subtotal: totals.subtotal.toNumber(),
      tax_pct: persona?.tax_rate || 0,
      tax_amount: totals.taxAmount.toNumber(),
      total: totals.total.toNumber(),
      notes,
      items: items.map(i => ({
        sku_id: i.sku_id || null,
        description: i.description,
        qty_ordered: i.qty_ordered,
        unit: i.unit,
        unit_cost: i.unit_cost
      }))
    };

    createPO.mutate(payload, {
      onSuccess: () => {
        alert("Purchase Order created successfully");
        router.push("/purchase");
      },
      onError: (err: any) => {
        alert("Failed to create PO: " + err.message);
      }
    });
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-electric-blue/10 rounded-sm">
            <ShoppingCart className="text-electric-blue" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight">New {t('purchase_order') || 'Purchase Order'}</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium">Procurement Management System</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => handleSave('draft')}
            className="px-6 py-2 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 transition-colors"
          >
            Save Draft
          </button>
          <button 
            onClick={() => handleSave('sent')}
            className="px-6 py-2 bg-electric-blue text-onyx text-[10px] uppercase tracking-widest font-bold hover:bg-blue-400 transition-colors flex items-center space-x-2"
          >
            <CheckCircle2 size={14} />
            <span>Issue & Send</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Details & Items */}
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-surface border border-white/5 p-6">
            <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-6 flex items-center">
              <User size={12} className="mr-2" />
              <span>{t('supplier') || 'Supplier'} Intelligence</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-gray-500 font-medium">{t('supplier') || 'Supplier'}</label>
                <select 
                  className="industrial-input"
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                >
                  <option value="">Select Supplier...</option>
                  {suppliers?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase text-gray-500 font-medium">Expected Delivery</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="date" 
                    className="industrial-input pl-10"
                    value={expectedBy}
                    onChange={(e) => setExpectedBy(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {activeScorecard && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-onyx/50 border border-white/5 grid grid-cols-3 gap-4"
              >
                <div className="space-y-1">
                  <p className="text-[9px] uppercase text-gray-500">On-Time Delivery</p>
                  <p className={cn(
                    "text-lg font-bold",
                    activeScorecard.on_time_delivery_pct >= 90 ? "text-emerald" : 
                    activeScorecard.on_time_delivery_pct >= 80 ? "text-sandstone-gold" : "text-critical-red"
                  )}>
                    {Number(activeScorecard.on_time_delivery_pct).toFixed(1)}%
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase text-gray-500">Rejection Rate</p>
                  <p className={cn(
                    "text-lg font-bold",
                    activeScorecard.rejection_rate_pct <= 2 ? "text-emerald" : 
                    activeScorecard.rejection_rate_pct <= 5 ? "text-sandstone-gold" : "text-critical-red"
                  )}>
                    {Number(activeScorecard.rejection_rate_pct).toFixed(1)}%
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase text-gray-500">Last Order</p>
                  <p className="text-lg font-bold text-white">
                    {activeScorecard.last_order_date ? new Date(activeScorecard.last_order_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </motion.div>
            )}
          </section>

          <section className="bg-surface border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-onyx/30">
              <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center">
                <FileText size={12} className="mr-2" />
                <span>Line Items</span>
              </h3>
              <button 
                onClick={addItem}
                className="flex items-center space-x-1 text-[10px] font-bold text-electric-blue uppercase tracking-widest hover:text-white transition-colors"
              >
                <Plus size={12} />
                <span>Add Item</span>
              </button>
            </div>

            <table className="w-full text-left border-collapse">
              <thead className="bg-onyx/50 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold w-1/3">Description / SKU</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold text-center">Qty</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold text-center">Unit</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold text-right">Unit Cost</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold text-right">Total</th>
                  <th className="px-6 py-4 text-center"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {items.map((item, index) => (
                    <motion.tr 
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="border-b border-white/5 hover:bg-white/[0.01] transition-colors"
                    >
                      <td className="px-6 py-4 relative">
                        <div className="space-y-1">
                          <input 
                            className="bg-transparent text-xs font-bold text-white w-full outline-none focus:border-b border-electric-blue"
                            placeholder="Type to search SKU..."
                            value={item.description}
                            onChange={(e) => {
                              updateItem(index, 'description', e.target.value);
                              searchSkus(e.target.value);
                            }}
                          />
                          {item.sku_code && <p className="text-[10px] font-mono text-gray-500">{item.sku_code}</p>}
                        </div>
                        {/* SKU Search Dropdown */}
                        {skuSearchQuery && skuSearchResults.length > 0 && (
                          <div className="absolute left-6 top-full z-50 bg-surface border border-white/10 shadow-2xl min-w-[200px]">
                            {skuSearchResults.map(sku => (
                              <button 
                                key={sku.id}
                                onClick={() => selectSku(index, sku)}
                                className="w-full text-left px-4 py-2 text-xs hover:bg-electric-blue/10 border-b border-white/5 flex flex-col"
                              >
                                <span className="font-bold">{sku.name}</span>
                                <span className="text-[10px] text-gray-500 font-mono">{sku.sku_code} | {fmt(sku.cost_price)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="number"
                          className="bg-onyx border border-white/10 px-2 py-1 text-xs w-20 text-center font-mono outline-none focus:border-electric-blue"
                          value={item.qty_ordered}
                          onChange={(e) => updateItem(index, 'qty_ordered', Number(e.target.value))}
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[10px] uppercase font-bold text-gray-500">{item.unit}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <input 
                          type="number"
                          className="bg-onyx border border-white/10 px-2 py-1 text-xs w-24 text-right font-mono outline-none focus:border-electric-blue text-sandstone-gold"
                          value={item.unit_cost}
                          onChange={(e) => updateItem(index, 'unit_cost', Number(e.target.value))}
                        />
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs font-bold text-white">
                        {fmt(item.line_total)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => removeItem(index)}
                          className="text-gray-700 hover:text-critical-red transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {items.length === 0 && (
              <div className="p-12 text-center">
                <AlertTriangle className="mx-auto text-gray-800 mb-4" size={32} />
                <p className="text-xs text-gray-500 uppercase tracking-widest">No items added to this order.</p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Totals & Notes */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-surface border border-white/5 p-6">
            <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-8">Order Summary</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-white font-mono">{fmt(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">{persona?.tax_label || 'Tax'} ({persona?.tax_rate || 0}%)</span>
                <span className="text-white font-mono">{fmt(totals.taxAmount)}</span>
              </div>
              <div className="pt-4 border-t border-white/5 flex justify-between">
                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Total Payable</span>
                <span className="text-xl font-bold text-electric-blue font-mono">{fmt(totals.total)}</span>
              </div>
            </div>
          </section>

          <section className="bg-surface border border-white/5 p-6">
            <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-4">Internal Notes</h3>
            <textarea 
              rows={4}
              className="industrial-input resize-none"
              placeholder="Shipping instructions, payment terms, etc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>

          <div className="p-6 bg-electric-blue/5 border border-electric-blue/20 rounded-sm">
            <div className="flex items-start space-x-3">
              <Clock className="text-electric-blue mt-0.5" size={16} />
              <div>
                <h4 className="text-[10px] font-bold text-white uppercase mb-1">Stock Impact</h4>
                <p className="text-[10px] text-gray-500 leading-relaxed uppercase">
                  Issuing this PO will not update physical stock. Stock will be increased only upon **GRN Acceptance**.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .industrial-input {
          width: 100%;
          background: #121417;
          border: 1px solid #2D3139;
          padding: 0.75rem 1rem;
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
          border-radius: 2px;
        }
        .industrial-input:focus {
          border-color: #60A5FA;
          box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.2);
        }
        select.industrial-input {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          background-size: 1rem;
        }
      `}</style>
    </div>
  );
}
