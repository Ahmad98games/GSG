// src/components/procurement/ReorderSuggestions.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { usePersona } from "@/hooks/usePersona";
import { useReorderSuggestions } from "@/hooks/usePurchaseQueries";
import { 
  AlertCircle, ArrowRight, Package, 
  ShoppingCart, TrendingDown 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Decimal } from "decimal.js";

export default function ReorderSuggestions({ limit }: { limit?: number }) {
  const { t, fmt } = usePersona();
  const router = useRouter();
  const { data: suggestions, isLoading } = useReorderSuggestions();

  if (isLoading) return <div className="h-40 bg-surface border border-white/5 animate-pulse" />;
  
  const displayItems = limit ? suggestions?.slice(0, limit) : suggestions;

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="bg-surface border border-white/5 p-8 text-center">
        <Package className="mx-auto text-gray-800 mb-4" size={32} />
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{t('procurement.inventory_healthy')}</p>
      </div>
    );
  }

  const totalValue = (suggestions ?? []).reduce(
    (acc: Decimal, s: any) => acc.plus(new Decimal(s.estimated_po_value || 0)), 
    new Decimal(0)
  );

  return (
    <div className="space-y-4">
      {/* Actionable Banner */}
      <div className="bg-sandstone-gold/10 border border-sandstone-gold/20 p-4 flex items-center justify-between rounded-sm">
        <div className="flex items-center space-x-3">
          <AlertCircle className="text-sandstone-gold" size={18} />
          <div>
            <h4 className="text-xs font-bold text-white uppercase">{t('procurement.replenishment_alert')}</h4>
            <p className="text-[9px] text-gray-500 uppercase tracking-wider">
              {t('procurement.items_below_reorder', { count: suggestions.length })} — {t('procurement.total_est_value', { value: fmt(totalValue) })}
            </p>
          </div>
        </div>
        <button 
          onClick={() => router.push("/purchase/suggestions")}
          className="text-[9px] font-bold text-sandstone-gold hover:text-white uppercase tracking-widest flex items-center space-x-1 transition-colors"
        >
          <span>{t('procurement.view_all')}</span>
          <ArrowRight size={10} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <AnimatePresence>
          {(displayItems ?? []).map((s: any) => (
            <motion.div 
              layout
              key={s.sku_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 250, damping: 30 }}
              className="bg-surface border border-white/5 p-4 hover:border-white/20 transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h5 className="text-xs font-bold text-white uppercase">{s.name}</h5>
                  <p className="text-[10px] text-gray-500 font-mono">{s.sku_code}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-critical-red font-mono">
                    {s.qty_on_hand ?? '—'} {s.unit}
                  </p>
                  <p className="text-[9px] text-gray-600 uppercase">{t('procurement.current_stock')}</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-500 uppercase">{t('procurement.shortfall')}</span>
                  <span className="text-[10px] font-bold text-white font-mono">{s.qty_to_order ?? '—'} {s.unit}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[9px] text-gray-500 uppercase">{t('procurement.est_cost')}</span>
                  <span className="text-[10px] font-bold text-sandstone-gold font-mono">
                    {s.estimated_po_value != null ? fmt(new Decimal(s.estimated_po_value)) : '—'}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => router.push(`/purchase/new?supplierId=${s.last_supplier_id}&skuId=${s.sku_id}&qty=${s.qty_to_order}`)}
                className="mt-4 w-full py-2 bg-white/5 border border-white/10 text-[9px] font-bold text-gray-400 uppercase tracking-widest group-hover:bg-electric-blue group-hover:text-onyx group-hover:border-electric-blue transition-all flex items-center justify-center space-x-2 rounded-none"
              >
                <ShoppingCart size={12} />
                <span>{t('procurement.create_draft_po')}</span>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

