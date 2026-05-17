
"use client";

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { calculateStockForecast, ConsumptionHistory } from '@/lib/intelligence/forecasting';
import { motion } from 'framer-motion';
import { TrendingDown, AlertTriangle, Calendar, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ForecastBadgeProps {
  skuId: string;
  currentQty: number;
  businessId: string;
}

export default function ForecastBadge({ skuId, currentQty, businessId }: ForecastBadgeProps) {
  const supabase = createClient();

  // Fetch last 90 days of "remove" adjustments for this SKU
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['stock-history', skuId],
    queryFn: async () => {
      // Assuming movements are in audit log or a dedicated table.
      // For this implementation, we check 'local_audit_log' which is synced to cloud.
      // event_type: 'stock_adjustment', payload contains { type: 'remove', quantity: X }
      const { data, error } = await supabase
        .from('audit_logs') // Assuming cloud table is audit_logs
        .select('created_at, payload')
        .eq('business_id', businessId)
        .eq('target_id', skuId)
        .eq('event_type', 'stock_adjustment')
        .gte('created_at', new Date(Date.now() - 90 * 86400000).toISOString());

      if (error) return [];

      return (data as any[])
        .filter((d: any) => d.payload?.type === 'remove')
        .map((d: any) => ({
          date: d.created_at,
          qty: Number(d.payload?.quantity || 0)
        })) as ConsumptionHistory[];
    },
    enabled: !!skuId && !!businessId,
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  const forecast = useMemo(() => {
    return calculateStockForecast(currentQty, history);
  }, [currentQty, history]);

  if (isLoading) return <div className="w-16 h-4 bg-white/5 animate-pulse rounded-sm" />;
  if (forecast.daysRemaining === Infinity || isNaN(forecast.daysRemaining)) return null;

  const isCritical = forecast.daysRemaining <= 7;
  const isWarning = forecast.daysRemaining <= 14;

  return (
    <div className="flex flex-col space-y-1">
      <div className={cn(
        "inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest border transition-all",
        isCritical ? "bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]" :
        isWarning ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
        "bg-emerald/10 border-emerald/20 text-emerald"
      )}>
        {isCritical ? <Zap size={10} className="animate-pulse" /> : <Calendar size={10} />}
        <span>
          {forecast.daysRemaining} Days Left
        </span>
      </div>
      
      <div className="flex items-center space-x-2 text-[8px] text-gray-600 font-bold uppercase px-1">
         <TrendingDown size={8} />
         <span>{forecast.burnRate.toFixed(2)} / day burn</span>
      </div>

      {forecast.depletionDate && (
        <p className="text-[8px] text-gray-700 italic px-1">
          Est: {format(forecast.depletionDate, 'MMM dd')}
        </p>
      )}
    </div>
  );
}
