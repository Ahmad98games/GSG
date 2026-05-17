"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock, Package } from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ExpiryWidget() {
  const { businessId } = usePersona();
  const supabase = createClient();

  const { data: expiringBatches } = useQuery({
    queryKey: ['expiring_batches', businessId],
    queryFn: async () => {
      const thirtyDaysOut = new Date();
      thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
      const { data, error } = await supabase
        .from('sku_batches')
        .select('*, sku:skus(name, sku_code)')
        .eq('business_id', businessId)
        .gt('qty_remaining', 0)
        .lte('expiry_date', thirtyDaysOut.toISOString().split('T')[0])
        .order('expiry_date', { ascending: true })
        .limit(8);
      if (error) return [];
      return data || [];
    },
    enabled: !!businessId,
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (!expiringBatches || expiringBatches.length === 0) return null;

  const getDaysLeft = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);

  return (
    <div className="bg-[#1A1D21] border border-white/5 p-6 space-y-4 rounded-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle size={14} className="text-amber-500" />
          <h3 className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Expiring Soon</h3>
        </div>
        <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-sm">
          {expiringBatches.length} Batches
        </span>
      </div>
      <div className="space-y-2">
        {expiringBatches.map((batch: any) => {
          const days = getDaysLeft(batch.expiry_date);
          const isUrgent = days < 7;
          return (
            <Link href={`/stock/${batch.sku_id}/batches`} key={batch.id} className={cn(
              "flex items-center justify-between p-3 border rounded-sm transition-all hover:bg-white/[0.03] cursor-pointer",
              isUrgent ? "border-red-500/20 bg-red-500/5" : "border-amber-500/10 bg-amber-500/5"
            )}>
              <div className="flex items-center space-x-3">
                <div className={cn("p-1.5 rounded-sm", isUrgent ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500")}>
                  <Package size={12} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white uppercase">{batch.sku?.name || 'Unknown'}</p>
                  <p className="text-[9px] text-gray-500 font-mono">Batch: {batch.batch_number} • Qty: {Number(batch.qty_remaining).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock size={10} className={isUrgent ? "text-red-500" : "text-amber-500"} />
                <span className={cn("text-[10px] font-black uppercase", isUrgent ? "text-red-500" : "text-amber-500")}>
                  {days < 0 ? 'EXPIRED' : `${days}d left`}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
