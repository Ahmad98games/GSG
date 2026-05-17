"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { usePersona } from "@/hooks/usePersona";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function MomentumBar() {
  const { businessId } = usePersona();
  const supabase = createClient();

  const { data: momentumData, isLoading } = useQuery({
    queryKey: ["production-momentum", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_production_momentum", {
        p_business_id: businessId,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  if (isLoading || !momentumData) return null;

  const { today_units, momentum } = momentumData;

  const getStatus = () => {
    if (momentum > 1.1) return { label: "Above pace ↑", color: "text-emerald-500", bar: "bg-emerald-500" };
    if (momentum >= 0.9) return { label: "On pace →", color: "text-[#0070F3]", bar: "bg-[#0070F3]" };
    if (momentum >= 0.7) return { label: "Below pace ↓", color: "text-amber-500", bar: "bg-amber-500" };
    return { label: "Significantly behind", color: "text-red-500", bar: "bg-red-500" };
  };

  const status = getStatus();
  const barWidth = Math.min(momentum * 100, 150);

  return (
    <div className="w-full bg-[#1A1D21]/50 backdrop-blur-md border-b border-white/5 px-8 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <div className="flex flex-col">
          <span className="text-[8px] uppercase font-black text-gray-600 tracking-widest">Today's Pace</span>
          <span className={cn("text-[10px] font-black uppercase tracking-widest", status.color)}>
            {status.label}
          </span>
        </div>
        
        <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
            className={cn("h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]", status.bar)}
          />
          {momentum > 1 && (
             <div className="absolute left-[100%] top-0 h-full w-[1px] bg-white/20" />
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-right">
          <span className="text-[8px] uppercase font-black text-gray-600 tracking-widest block">Output Today</span>
          <span className="text-xs font-mono font-black text-white">{today_units} Units</span>
        </div>
      </div>
    </div>
  );
}
