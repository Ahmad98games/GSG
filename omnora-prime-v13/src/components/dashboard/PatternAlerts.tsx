"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { usePersona } from "@/hooks/usePersona";
import { Info, AlertTriangle, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PatternAlert {
  pattern_type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
  action_label: string;
  action_url: string;
}

export default function PatternAlerts() {
  const { businessId } = usePersona();
  const supabase = createClient();

  const { data: patterns, isLoading } = useQuery({
    queryKey: ["pattern-alerts", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("detect_business_patterns", {
        p_business_id: businessId,
      });
      if (error) throw error;
      return data as PatternAlert[];
    },
    enabled: !!businessId,
  });

  if (isLoading || !patterns || patterns.length === 0) return null;

  const severityConfigs = {
    info: {
      border: "border-l-[#0070F3]",
      icon: <Info size={16} className="text-[#0070F3]" />,
      bg: "bg-[#0070F3]/5",
    },
    warning: {
      border: "border-l-amber-500",
      icon: <AlertTriangle size={16} className="text-amber-500" />,
      bg: "bg-amber-500/5",
    },
    critical: {
      border: "border-l-red-500",
      icon: <AlertCircle size={16} className="text-red-500" />,
      bg: "bg-red-500/5",
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      {patterns.slice(0, 3).map((alert, idx) => {
        const config = severityConfigs[alert.severity] || severityConfigs.info;
        return (
          <div
            key={idx}
            className={cn(
              "p-4 border-l-4 transition-all hover:bg-white/[0.02]",
              config.border,
              config.bg,
              "bg-black/20"
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                {config.icon}
                <h4 className="text-[11px] font-black text-white uppercase tracking-wider">
                  {alert.title}
                </h4>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 font-medium mb-4 leading-relaxed">
              {alert.detail}
            </p>
            <Link
              href={alert.action_url}
              className="inline-flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-colors"
            >
              <span>{alert.action_label}</span>
              <ArrowRight size={10} />
            </Link>
          </div>
        );
      })}
    </div>
  );
}
