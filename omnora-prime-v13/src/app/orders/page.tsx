"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingCart, Plus, Filter, Search, 
  ArrowRight, FileText, Clock, 
  CheckCircle2, AlertTriangle, MoreVertical,
  Calendar, Download, ExternalLink, RefreshCw,
  X, User, Phone, Tag, Trash2, Printer, Check,
  Package, ChevronRight, Hash, Layers
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import Decimal from "decimal.js";
import { useRouter } from "next/navigation";

// --- Components ---

const Badge = ({ children, variant = "default" }: any) => {
  const styles: any = {
    default: "bg-white/5 text-gray-400 border border-white/10",
    emerald: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    red: "bg-red-500/10 text-red-400 border border-red-500/20",
    blue: "bg-[#0070F3]/10 text-[#60A5FA] border border-[#0070F3]/20",
    purple: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    gold: "bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20"
  };
  return (
    <span className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-[2px]", styles[variant])}>
      {children}
    </span>
  );
};

interface OrderLineItem {
  id?: string;
  sku_id?: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  notes?: string;
}

// --- Create Order Modal ---

function NewOrderModal({
  isOpen,
  onClose,
  onSuccess,
  businessId,
  fmt
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (order: any) => void;
  businessId: string;
  fmt: (v: number) => string;
}) {
  const supabase = createClient();
  const toast = useToast();

  const [orderNumber, setOrderNumber] = useState(`SO-${Date.now().toString().slice(-6)}`);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<'pending' | 'in_production' | 'ready'>('pending');
  const [partyId, setPartyId] = useState<string>('');
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<OrderLineItem[]>([
    { description: '', quantity: 1, unit: 'Piece', unit_price: 0, total_price: 0 }
  ]);

  // Fetch Parties (Customers)
  const { data: parties = [] } = useQuery({
    queryKey: ['order_parties', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parties')
        .select('id, name, phone, type')
        .order('name');
      if (error) return [];
      return data || [];
    },
    enabled: isOpen
  });

  // Fetch Available SKUs
  const { data: skus = [] } = useQuery({
    queryKey: ['order_skus', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skus')
        .select('id, sku_code, name, unit, sale_price, qty_on_hand, category')
        .order('name');
      if (error) return [];
      return data || [];
    },
    enabled: isOpen
  });

  const addItem = () => {
    setItems(prev => [
      ...prev,
      { description: '', quantity: 1, unit: 'Piece', unit_price: 0, total_price: 0 }
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, updates: Partial<OrderLineItem>) => {
    setItems(prev => {
      const copy = [...prev];
      const item = { ...copy[index], ...updates };
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      item.total_price = Number(new Decimal(qty).times(price).toFixed(2));
      copy[index] = item;
      return copy;
    });
  };

  const handleSkuSelect = (index: number, skuId: string) => {
    const selected = skus.find((s: any) => s.id === skuId);
    if (!selected) {
      updateItem(index, { sku_id: '', description: '' });
      return;
    }
    updateItem(index, {
      sku_id: selected.id,
      description: `${selected.name} (${selected.sku_code})`,
      unit: selected.unit || 'Piece',
      unit_price: selected.sale_price || 0,
      quantity: 1,
      total_price: selected.sale_price || 0
    });
  };

  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.total_price) || 0), 0);
  }, [items]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - (Number(discount) || 0));
  }, [subtotal, discount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!isWalkIn && !partyId) {
      toast.error('Select Customer', 'Please choose a customer or enable Walk-in Customer.');
      return;
    }
    if (isWalkIn && !walkInName.trim()) {
      toast.error('Enter Customer Name', 'Please provide a name for the walk-in customer.');
      return;
    }

    const validItems = items.filter(it => it.description.trim() && it.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Add Order Items', 'Please add at least one line item with description and quantity.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalPartyId = partyId;

      // If walk-in, create quick party in parties table if desired, or use party_id null with walkIn info in notes
      let finalNotes = notes;
      if (isWalkIn) {
        finalNotes = `[Customer: ${walkInName.trim()} | Phone: ${walkInPhone.trim() || 'N/A'}]\n${notes}`.trim();
        try {
          const { data: newParty } = await supabase
            .from('parties')
            .insert({
              business_id: businessId,
              name: walkInName.trim(),
              phone: walkInPhone.trim() || null,
              type: 'customer'
            })
            .select()
            .single();
          if (newParty) finalPartyId = newParty.id;
        } catch {}
      }

      const payload = {
        business_id: businessId,
        order_number: orderNumber.trim() || `SO-${Date.now().toString().slice(-6)}`,
        party_id: finalPartyId || null,
        order_date: orderDate,
        expected_date: expectedDate || null,
        status,
        total_amount: totalAmount,
        notes: finalNotes,
        items: validItems
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to create sales order');
      }

      toast.success('Sales Order Created', `Order ${payload.order_number} has been logged.`);
      onSuccess(json.order);
      onClose();
    } catch (err: any) {
      toast.error('Order Creation Failed', err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#121418] border border-white/10 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl rounded-sm my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1A1D21]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#C5A059]/10 text-[#C5A059] rounded-sm">
              <ShoppingCart size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">New Sales Order</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Create order manifest & production commitment</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top metadata grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1.5">
                Order Number
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value)}
                required
                className="w-full bg-black/50 border border-white/10 px-3 py-2 text-xs font-mono font-bold text-white focus:border-[#C5A059] outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1.5">
                Placement Date
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={e => setOrderDate(e.target.value)}
                required
                className="w-full bg-black/50 border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C5A059] outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1.5">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={e => setExpectedDate(e.target.value)}
                className="w-full bg-black/50 border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C5A059] outline-none"
              />
            </div>
          </div>

          {/* Customer Selection */}
          <div className="bg-white/[0.02] border border-white/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest flex items-center space-x-2">
                <User size={13} className="text-[#C5A059]" />
                <span>Customer Specification</span>
              </span>
              <label className="flex items-center space-x-2 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isWalkIn}
                  onChange={e => setIsWalkIn(e.target.checked)}
                  className="rounded bg-black border-white/20 text-[#C5A059] focus:ring-0"
                />
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Walk-in / Direct Client</span>
              </label>
            </div>

            {isWalkIn ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <input
                    type="text"
                    placeholder="Customer Name (e.g. Tariq Textiles)"
                    value={walkInName}
                    onChange={e => setWalkInName(e.target.value)}
                    required
                    className="w-full bg-black/50 border border-white/10 px-3 py-2 text-xs text-white focus:border-[#C5A059] outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Phone / WhatsApp (e.g. +92 300 1234567)"
                    value={walkInPhone}
                    onChange={e => setWalkInPhone(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 px-3 py-2 text-xs text-white focus:border-[#C5A059] outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <select
                  value={partyId}
                  onChange={e => setPartyId(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 px-3 py-2 text-xs text-white focus:border-[#C5A059] outline-none"
                >
                  <option value="">-- Choose Registered Customer / Party --</option>
                  {parties.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.phone ? `(${p.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest flex items-center space-x-2">
                <Package size={13} className="text-[#60A5FA]" />
                <span>Order Line Items ({items.length})</span>
              </span>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center space-x-1 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white transition-colors"
              >
                <Plus size={12} />
                <span className="text-[10px] uppercase font-bold tracking-wider">Add Item</span>
              </button>
            </div>

            <div className="border border-white/5 bg-black/30 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-[9px] uppercase font-black text-gray-500 tracking-wider">
                    <th className="p-3 w-[30%]">Item / Stock SKU</th>
                    <th className="p-3 w-[25%]">Description</th>
                    <th className="p-3 w-[12%]">Unit</th>
                    <th className="p-3 w-[10%]">Qty</th>
                    <th className="p-3 w-[13%]">Rate ({businessId?.toUpperCase() === 'UAE' ? 'AED' : 'PKR'})</th>
                    <th className="p-3 w-[10%] text-right">Total</th>
                    <th className="p-3 w-[5%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.01]">
                      {/* SKU Dropdown */}
                      <td className="p-2.5">
                        <select
                          value={item.sku_id || ''}
                          onChange={e => handleSkuSelect(idx, e.target.value)}
                          className="w-full bg-black/60 border border-white/10 px-2 py-1.5 text-xs text-white focus:border-[#60A5FA] outline-none"
                        >
                          <option value="">Custom Non-Inventory</option>
                          {skus.map((s: any) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.sku_code}) - Stock: {s.qty_on_hand} {s.unit}
                            </option>
                          ))}
                        </select>
                      </td>
                      {/* Description */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          placeholder="Item description / details"
                          value={item.description}
                          onChange={e => updateItem(idx, { description: e.target.value })}
                          required
                          className="w-full bg-black/60 border border-white/10 px-2 py-1.5 text-xs text-white focus:border-[#60A5FA] outline-none"
                        />
                      </td>
                      {/* Unit */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={e => updateItem(idx, { unit: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 px-2 py-1.5 text-xs text-white focus:border-[#60A5FA] outline-none"
                        />
                      </td>
                      {/* Quantity */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.quantity}
                          onChange={e => updateItem(idx, { quantity: parseFloat(e.target.value) || 0 })}
                          required
                          className="w-full bg-black/60 border border-white/10 px-2 py-1.5 text-xs font-mono text-white focus:border-[#60A5FA] outline-none text-right"
                        />
                      </td>
                      {/* Unit Price */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unit_price}
                          onChange={e => updateItem(idx, { unit_price: parseFloat(e.target.value) || 0 })}
                          required
                          className="w-full bg-black/60 border border-white/10 px-2 py-1.5 text-xs font-mono text-white focus:border-[#60A5FA] outline-none text-right"
                        />
                      </td>
                      {/* Total */}
                      <td className="p-2.5 text-right font-mono font-bold text-white">
                        {fmt(item.total_price)}
                      </td>
                      {/* Remove Button */}
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          disabled={items.length <= 1}
                          className="text-gray-600 hover:text-red-400 disabled:opacity-20 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes & Calculations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1.5">
                Order Notes & Stitching / Production Specs
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Include size breakdown, cutting notes, fabric specs, delivery instructions..."
                className="w-full bg-black/50 border border-white/10 p-3 text-xs text-white focus:border-[#C5A059] outline-none resize-none placeholder:text-gray-700"
              />
            </div>

            <div className="bg-white/[0.02] border border-white/5 p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Subtotal ({items.length} items):</span>
                  <span className="font-mono text-white">{fmt(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Discount Amount:</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] text-gray-600">-</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={discount}
                      onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-24 bg-black/60 border border-white/10 px-2 py-1 text-xs font-mono text-right text-white focus:border-[#C5A059] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059]">Total Order Value</p>
                  <p className="text-[9px] text-gray-500 font-mono">Guaranteed commitment</p>
                </div>
                <span className="text-2xl font-mono font-black text-white">{fmt(totalAmount)}</span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#1A1D21] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Initial Status:</span>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="bg-black/60 border border-white/10 px-3 py-1.5 text-xs text-white font-bold outline-none uppercase"
            >
              <option value="pending">Pending</option>
              <option value="in_production">In Production</option>
              <option value="ready">Ready for Delivery</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2 text-xs uppercase font-bold tracking-wider text-gray-400 hover:text-white transition-colors border border-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#C5A059] hover:brightness-110 text-black text-xs uppercase font-black tracking-widest transition-all shadow-lg shadow-[#C5A059]/20 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <span>Saving Order...</span>
              ) : (
                <>
                  <Check size={14} />
                  <span>Create Order Manifest</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- Order Details Modal / Drawer ---

function OrderDetailsModal({
  order,
  onClose,
  onStatusChange,
  onConvertToInvoice,
  onDelete,
  fmt
}: {
  order: any;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: string) => void;
  onConvertToInvoice: (order: any) => void;
  onDelete: (id: string) => void;
  fmt: (v: number) => string;
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'print'>('details');

  const printOrder = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#121418] border border-white/10 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl rounded-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1A1D21]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#C5A059]/10 text-[#C5A059] rounded-sm">
              <ShoppingCart size={18} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono font-bold text-[#C5A059]">{order.order_number}</span>
                <Badge variant={
                  order.status === 'invoiced' ? 'emerald' : 
                  order.status === 'ready' ? 'blue' :
                  order.status === 'in_production' ? 'amber' :
                  order.status === 'cancelled' ? 'red' : 'default'
                }>
                  {order.status.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                Client: {order.party?.name || 'Walk-in Customer'} • Placed on {order.order_date}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick status stepper bar */}
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-sm">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-3">Order Lifecycle Status</p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'pending', label: 'Pending', color: 'hover:border-white/40' },
                { key: 'in_production', label: 'In Production', color: 'hover:border-amber-500/50' },
                { key: 'ready', label: 'Ready for Delivery', color: 'hover:border-[#60A5FA]/50' },
                { key: 'invoiced', label: 'Invoiced', color: 'hover:border-emerald-500/50' },
                { key: 'cancelled', label: 'Cancelled', color: 'hover:border-red-500/50' }
              ].map(st => (
                <button
                  key={st.key}
                  onClick={() => onStatusChange(order.id, st.key)}
                  className={cn(
                    "px-3 py-1.5 text-[10px] uppercase font-black tracking-widest border transition-all",
                    order.status === st.key
                      ? "bg-[#C5A059] text-black border-[#C5A059]"
                      : "bg-black/40 text-gray-400 border-white/10 hover:text-white"
                  )}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Details Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/30 border border-white/5 p-3">
              <span className="text-[9px] uppercase font-bold text-gray-500 tracking-widest block mb-1">Customer Contact</span>
              <p className="text-xs font-bold text-white">{order.party?.name || 'Walk-in Customer'}</p>
              {order.party?.phone && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{order.party.phone}</p>}
            </div>
            <div className="bg-black/30 border border-white/5 p-3">
              <span className="text-[9px] uppercase font-bold text-gray-500 tracking-widest block mb-1">Placement & Due Date</span>
              <p className="text-xs font-mono text-white">Placed: {order.order_date}</p>
              <p className="text-[10px] text-[#C5A059] font-mono mt-0.5">Due: {order.expected_date || 'TBD'}</p>
            </div>
            <div className="bg-black/30 border border-white/5 p-3">
              <span className="text-[9px] uppercase font-bold text-gray-500 tracking-widest block mb-1">Total Manifest Value</span>
              <p className="text-lg font-mono font-black text-white">{fmt(order.total_amount)}</p>
            </div>
          </div>

          {/* Line Items List */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
              Manifest Line Items ({order.items?.length || 0})
            </p>
            <div className="border border-white/5 bg-black/40 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-[9px] uppercase font-bold text-gray-500 tracking-wider">
                    <th className="p-3">Item Description</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3 text-right">Rate</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((it: any, idx: number) => (
                      <tr key={idx} className="hover:bg-white/[0.01]">
                        <td className="p-3 font-medium text-white">{it.description}</td>
                        <td className="p-3 text-gray-400">{it.unit || 'Piece'}</td>
                        <td className="p-3 text-right font-mono text-white">{it.quantity}</td>
                        <td className="p-3 text-right font-mono text-gray-400">{fmt(it.unit_price)}</td>
                        <td className="p-3 text-right font-mono font-bold text-[#C5A059]">{fmt(it.total_price)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-600 text-xs font-mono">
                        No line item details found for this order.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-sm">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Production Notes & Instructions</p>
              <p className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#1A1D21] flex items-center justify-between">
          <button
            onClick={() => onDelete(order.id)}
            className="flex items-center space-x-1.5 text-red-500 hover:text-red-400 text-xs uppercase font-bold tracking-wider px-3 py-1.5 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={13} />
            <span>Delete Order</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={printOrder}
              className="flex items-center space-x-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs uppercase font-bold tracking-wider text-white transition-colors"
            >
              <Printer size={13} />
              <span>Print Slip</span>
            </button>
            {order.status !== 'invoiced' && (
              <button
                onClick={() => onConvertToInvoice(order)}
                className="flex items-center space-x-1.5 px-5 py-2 bg-[#0070F3] hover:brightness-110 text-white text-xs uppercase font-black tracking-widest transition-all shadow-lg shadow-blue-500/20"
              >
                <FileText size={13} />
                <span>Generate Invoice</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- Main Sales Orders Page ---

export default function SalesOrdersPage() {
  const { fmt, businessId } = usePersona();
  const { profile } = useBusinessProfile();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Resilient Queries: Local API first, fallback to Supabase
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['sales_orders', businessId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/orders?business_id=${businessId || 'local'}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data)) {
            return json.data;
          }
        }
      } catch (err) {
        console.warn('[Orders] API fetch error, trying Supabase directly:', err);
      }

      // Supabase Direct Fallback
      const { data, error } = await supabase
        .from('orders')
        .select('*, party:parties(name, phone), items:order_items(id, description, quantity, unit, unit_price, total_price)')
        .eq('business_id', businessId)
        .order('order_date', { ascending: false });
      
      if (error) return [];
      return data || [];
    },
    enabled: true
  });

  // Status Change Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (!res.ok) {
        // Direct Supabase fallback
        const { error } = await supabase
          .from('orders')
          .update({ status })
          .eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders', businessId] });
      toast.success('Order Status Updated', `Status changed to ${variables.status.replace('_', ' ')}.`);
      if (selectedOrder && selectedOrder.id === variables.id) {
        setSelectedOrder((prev: any) => ({ ...prev, status: variables.status }));
      }
    },
    onError: (err: any) => {
      toast.error('Failed to update status', err.message);
    }
  });

  // Delete Order Mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/orders?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        await supabase.from('order_items').delete().eq('order_id', id);
        const { error } = await supabase.from('orders').delete().eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders', businessId] });
      toast.success('Order Deleted', 'Order manifest removed from database.');
      setSelectedOrder(null);
    },
    onError: (err: any) => {
      toast.error('Failed to delete order', err.message);
    }
  });

  // Convert to Invoice Mutation
  const convertToInvoice = useMutation({
    mutationFn: async (order: any) => {
      // 1. Create Invoice
      const { data: inv, error: invError } = await supabase
        .from('invoices')
        .insert({
          business_id: businessId,
          party_id: order.party_id || null,
          invoice_no: `INV-ORD-${order.order_number}`,
          total: order.total_amount,
          status: 'draft',
          issue_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();
      
      if (invError) throw invError;

      // 2. Insert invoice line items if available
      if (order.items && order.items.length > 0) {
        try {
          const invItems = order.items.map((it: any) => ({
            invoice_id: inv.id,
            business_id: businessId,
            sku_id: it.sku_id || null,
            description: it.description,
            quantity: it.quantity,
            unit_price: it.unit_price,
            total_price: it.total_price
          }));
          await supabase.from('invoice_items').insert(invItems);
        } catch (itemErr) {
          console.warn('[Orders] Could not insert invoice items:', itemErr);
        }
      }

      // 3. Update Order Status
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: 'invoiced' })
      });
      
      return inv;
    },
    onSuccess: (inv) => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders', businessId] });
      toast.success('Invoice Created', 'Sales order successfully converted to invoice.');
      setSelectedOrder(null);
      router.push(`/invoices/${inv.id}`);
    },
    onError: (err: any) => {
      toast.error('Invoice conversion error', err.message);
    }
  });

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o: any) => {
      const matchSearch = 
        (o.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (o.party?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o: any) => o.status === 'pending').length;
    const inProd = orders.filter((o: any) => o.status === 'in_production').length;
    const ready = orders.filter((o: any) => o.status === 'ready').length;
    const pipeline = orders.reduce((acc: number, o: any) => acc + (Number(o.total_amount) || 0), 0);
    return { total, pending, inProd, ready, pipeline };
  }, [orders]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F1113] flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.5em] text-gray-700 animate-pulse">
        Retrieving Order Manifests...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter">
      <main className="transition-all duration-300 min-h-screen flex flex-col pb-20">
        {/* Top Sticky Header */}
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
                placeholder="Search orders or customer..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-black/40 border border-white/10 pl-10 pr-4 py-1.5 text-[10px] uppercase font-bold tracking-widest text-white w-[250px] focus:border-[#C5A059]/50 outline-none transition-all placeholder:text-gray-700"
              />
            </div>
            <button
              onClick={() => setIsNewOrderOpen(true)}
              className="flex items-center space-x-2 bg-[#C5A059] hover:brightness-110 text-black px-6 py-1.5 text-[10px] uppercase font-black tracking-widest transition-all shadow-lg shadow-[#C5A059]/10 cursor-pointer"
            >
              <Plus size={12} />
              <span>New Order</span>
            </button>
          </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">
          {/* SUMMARY STAT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#1A1D21] border border-white/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-[8px] uppercase font-black text-gray-500 tracking-widest mb-1">Open Orders</p>
                <h4 className="text-xl font-mono font-black text-white">{stats.pending}</h4>
              </div>
              <div className="p-2 bg-blue-500/5 text-blue-500 rounded-sm"><Clock size={16} /></div>
            </div>
            <div className="bg-[#1A1D21] border border-white/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-[8px] uppercase font-black text-gray-500 tracking-widest mb-1">In Production</p>
                <h4 className="text-xl font-mono font-black text-amber-500">{stats.inProd}</h4>
              </div>
              <div className="p-2 bg-amber-500/5 text-amber-500 rounded-sm"><RefreshCw size={16} /></div>
            </div>
            <div className="bg-[#1A1D21] border border-white/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-[8px] uppercase font-black text-gray-500 tracking-widest mb-1">Ready for Delivery</p>
                <h4 className="text-xl font-mono font-black text-emerald-500">{stats.ready}</h4>
              </div>
              <div className="p-2 bg-emerald-500/5 text-emerald-500 rounded-sm"><CheckCircle2 size={16} /></div>
            </div>
            <div className="bg-[#1A1D21] border border-white/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-[8px] uppercase font-black text-gray-500 tracking-widest mb-1">Total Pipeline</p>
                <h4 className="text-xl font-mono font-black text-[#C5A059]">{fmt(stats.pipeline)}</h4>
              </div>
              <div className="p-2 bg-[#C5A059]/5 text-[#C5A059] rounded-sm"><ShoppingCart size={16} /></div>
            </div>
          </div>

          {/* STATUS TABS FILTER */}
          <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
            {[
              { id: 'all', label: `All Orders (${orders.length})` },
              { id: 'pending', label: `Pending (${stats.pending})` },
              { id: 'in_production', label: `In Production (${stats.inProd})` },
              { id: 'ready', label: `Ready (${stats.ready})` },
              { id: 'invoiced', label: `Invoiced` },
              { id: 'cancelled', label: `Cancelled` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-colors",
                  statusFilter === tab.id
                    ? "bg-[#C5A059]/10 text-[#C5A059] border-b-2 border-[#C5A059]"
                    : "text-gray-500 hover:text-white"
                )}
              >
                {tab.label}
              </button>
            ))}
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
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-[#C5A059] font-mono font-bold">{order.order_number}</span>
                          <ExternalLink size={10} className="text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-white uppercase tracking-tight">{order.party?.name || 'Walk-in Customer'}</p>
                        {order.party?.phone && <span className="text-[9px] font-mono text-gray-500">{order.party.phone}</span>}
                      </td>
                      <td className="p-4 text-gray-400 font-mono">{order.order_date}</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Badge>{order.items?.length || order.item_count || 1} Items</Badge>
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
                      <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
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
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-white transition-colors rounded-sm"
                            title="View Manifest Details"
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} className="p-20 text-center">
                        <div className="flex flex-col items-center opacity-40">
                          <ShoppingCart size={48} strokeWidth={1} className="text-gray-500 mb-3" />
                          <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">No order manifest records found</p>
                          <button
                            onClick={() => setIsNewOrderOpen(true)}
                            className="mt-4 px-4 py-2 bg-[#C5A059] text-black text-xs uppercase font-bold tracking-wider hover:brightness-110 transition-all"
                          >
                            + Create First Order
                          </button>
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

      {/* NEW ORDER MODAL */}
      <AnimatePresence>
        {isNewOrderOpen && (
          <NewOrderModal
            isOpen={isNewOrderOpen}
            onClose={() => setIsNewOrderOpen(false)}
            onSuccess={() => {
              refetch();
              queryClient.invalidateQueries({ queryKey: ['sales_orders', businessId] });
            }}
            businessId={businessId || 'local'}
            fmt={fmt}
          />
        )}
      </AnimatePresence>

      {/* ORDER DETAILS MODAL */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
            onConvertToInvoice={order => convertToInvoice.mutate(order)}
            onDelete={id => deleteOrderMutation.mutate(id)}
            fmt={fmt}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
