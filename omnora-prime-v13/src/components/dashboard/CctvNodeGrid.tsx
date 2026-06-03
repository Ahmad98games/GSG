"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { 
  Shield, Camera, Activity, 
  Wifi, WifiOff, AlertTriangle, 
  ChevronRight, BarChart2 
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePersona } from "@/hooks/usePersona";

export default function CctvNodeGrid() {
  const { t } = usePersona();
  const supabase = createClient();
  const { profile } = useBusinessProfile();

  const { data: nodes = [], isLoading } = useQuery({
    queryKey: ['cctv-nodes', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cctv_nodes')
        .select('*')
        .eq('business_id', profile?.id)
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
    refetchInterval: 60_000,
  });

  if (isLoading) return <div className="col-span-4 h-32 bg-surface/50 border border-white/5 animate-pulse" />;
  if (nodes.length === 0) return null;

  return (
    <div className="col-span-4 space-y-6">
        <div className="flex items-center justify-between">
           <div className="flex items-center space-x-2">
              <Shield size={14} className="text-electric-blue" />
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-white font-bold">{t('cctv.sentinel_title')}</h3>
           </div>
           <span className="text-[9px] text-gray-500 uppercase font-mono tracking-tighter">{t('cctv.live_active')}</span>
        </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {nodes.map((node: any) => (
             <NodeCard key={node.id} node={node} />
          ))}
       </div>
    </div>
  );
}

function NodeCard({ node }: { node: any }) {
  const { t } = usePersona();
  const isOnline = node.status === 'online';
  const isFault = ['obscured', 'offline', 'degraded'].includes(node.status);

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="bg-surface border border-white/5 p-4 flex items-center space-x-4 relative overflow-hidden group rounded-none"
    >
       <div className={cn(
         "w-1 h-full absolute left-0 top-0 transition-colors",
         isOnline ? "bg-emerald" : isFault ? "bg-critical-red" : "bg-gray-700"
       )} />
       
       <div className="p-2.5 bg-onyx border border-white/5 text-gray-500 group-hover:text-white transition-colors">
          <Camera size={18} />
       </div>

       <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
             <h4 className="text-[11px] font-bold text-white truncate uppercase tracking-wider">{node.node_label}</h4>
             <div className={cn(
               "w-1.5 h-1.5 rounded-full",
               isOnline ? "bg-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-critical-red"
             )} />
          </div>
          <div className="flex items-center mt-1 space-x-3 text-[9px] text-gray-500 uppercase font-mono">
             <span className="truncate">{node.location_desc || t('cctv.exterior')}</span>
             <span>•</span>
             <span className={cn(isOnline ? "text-emerald" : "text-critical-red font-bold")}>
                {isOnline ? t('cctv.streaming') : node.status.replace('_', ' ')}
             </span>
          </div>
       </div>

        {/* Hover: Stats Sparkline Simulation - Removed Gradient for Design Compliance */}
        <div className="absolute right-0 top-0 h-full w-24 bg-onyx/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
           <BarChart2 size={24} className="text-electric-blue/20" />
        </div>
    </motion.div>
  );
}

