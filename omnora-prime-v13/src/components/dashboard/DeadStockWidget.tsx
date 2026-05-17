"use client";

import React, { useEffect, useState } from 'react';
import { Archive, ArrowRight, AlertTriangle, Package, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { usePersona } from '@/hooks/usePersona';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface DeadStockItem {
  sku_id: string;
  sku_code: string;
  name: string;
  qty_on_hand: number;
  unit: string;
  stock_value: number;
  days_since_movement: number;
}

export default function DeadStockWidget() {
  const { businessId } = usePersona();
  const [items, setItems] = useState<DeadStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      if (!businessId) return;
      const { data, error } = await supabase.rpc('get_dead_stock', { 
        p_business_id: businessId,
        p_days: 90
      });
      if (data) setItems(data);
      setLoading(false);
    }
    fetchData();
  }, [businessId]);

  if (loading || items.length === 0) return null;

  const totalValue = items.reduce((acc, item) => acc + Number(item.stock_value), 0);

  return (
    <div className="glass-panel border-white/5 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Archive size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white italic">Slow-Moving Items</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mt-0.5">Items with no movement in 90+ days</p>
          </div>
        </div>
        <Link href="/inventory" className="text-[10px] font-black uppercase text-gray-500 hover:text-white flex items-center space-x-2 transition-colors">
          <span>View Inventory</span>
          <ArrowRight size={12} />
        </Link>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center space-x-4">
        <AlertTriangle className="text-amber-500" size={24} />
        <div className="space-y-0.5">
          <p className="text-xs font-black text-white uppercase tracking-tight">
            PKR {totalValue.toLocaleString()} tied up in slow-moving stock
          </p>
          <p className="text-[10px] text-amber-500/70 font-bold uppercase">Consider discounting or bundling these items to free up cash.</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-5 px-4 py-2 text-[9px] font-black uppercase text-gray-600 tracking-widest border-b border-white/5">
          <span>SKU Code</span>
          <span className="col-span-2">Name</span>
          <span>Days Inactive</span>
          <span className="text-right">Value (PKR)</span>
        </div>
        {items.map((item) => (
          <motion.div 
            key={item.sku_id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-5 px-4 py-3 bg-white/[0.02] border-l-2 border-transparent hover:bg-white/[0.05] transition-all group"
            style={{ borderLeftColor: item.days_since_movement >= 180 ? '#ef4444' : item.days_since_movement >= 120 ? '#f97316' : '#f59e0b' }}
          >
            <span className="text-[10px] font-mono text-gray-400 group-hover:text-white">{item.sku_code}</span>
            <span className="text-[10px] font-bold text-white uppercase col-span-2">{item.name}</span>
            <span className={cn(
              "text-[10px] font-black uppercase",
              item.days_since_movement >= 180 ? "text-red-500" :
              item.days_since_movement >= 120 ? "text-orange-500" : "text-amber-500"
            )}>
              {item.days_since_movement} Days
            </span>
            <span className="text-[10px] font-mono text-white text-right">
              {Number(item.stock_value).toLocaleString()}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-gray-600 uppercase">Total Stuck Capital</span>
          <span className="text-lg font-black text-white italic">PKR {totalValue.toLocaleString()}</span>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded text-[9px] font-black uppercase text-gray-400 hover:text-white transition-all">
            Bundle Items
          </button>
          <button className="px-4 py-2 bg-amber-500 text-black rounded text-[9px] font-black uppercase hover:bg-amber-400 transition-all">
            Discount Stock
          </button>
        </div>
      </div>
    </div>
  );
}
