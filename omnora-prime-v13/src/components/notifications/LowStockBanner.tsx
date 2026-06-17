"use client";

import React from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useBusinessProfileStore } from "@/store/BusinessProfileStore";
import { motion, AnimatePresence } from "framer-motion";

export default function LowStockBanner({ onFilter }: { onFilter: () => void }) {
  const supabase = createClient();
  const { profile } = useBusinessProfileStore();

  const { data: lowStockCount = 0 } = useQuery({
    queryKey: ['low-stock-count', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { count, error } = await supabase
        .from('skus')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', profile.id)
        .eq('is_active', true)
        .filter('qty_on_hand', 'lte', 'reorder_level')
        .gt('reorder_level', 0);
      
      if (error) return 0;
      return count || 0;
    },
    enabled: !!profile?.id,
  });

  if (lowStockCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-sandstone-gold/10 border-b border-sandstone-gold/20"
      >
        <div className="max-w-[1600px] mx-auto px-8 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-sandstone-gold">
            <AlertTriangle size={14} className="animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest font-bold">
              Critical Inventory Alert: {lowStockCount} items below reorder level
            </span>
          </div>
          <button 
            onClick={onFilter}
            className="flex items-center space-x-2 text-[10px] uppercase tracking-widest font-bold text-sandstone-gold hover:text-white transition-colors group"
          >
            <span>View Affected SKUs</span>
            <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

