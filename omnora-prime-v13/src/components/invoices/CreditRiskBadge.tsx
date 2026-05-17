"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { usePersona } from "@/hooks/usePersona";
import { ShieldCheck, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditRiskBadgeProps {
  partyId: string;
}

export default function CreditRiskBadge({ partyId }: CreditRiskBadgeProps) {
  const { businessId, fmt } = usePersona();
  const supabase = createClient();

  const { data: risk, isLoading } = useQuery({
    queryKey: ["credit-risk", businessId, partyId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_party_credit_risk", {
        p_business_id: businessId,
        p_party_id: partyId,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!businessId && !!partyId,
  });

  if (isLoading || !risk || !partyId) return null;

  const {
    risk_level,
    risk_score,
    outstanding,
    overdue_invoices,
    avg_days_late,
  } = risk;

  if (risk_level === "low") {
    return (
      <div className="flex items-center space-x-2 text-emerald-500 bg-emerald-500/5 px-3 py-1.5 border border-emerald-500/10 mt-2">
        <ShieldCheck size={14} />
        <span className="text-[10px] font-black uppercase tracking-widest">Low Credit Risk</span>
      </div>
    );
  }

  const isHigh = risk_level === "high";

  return (
    <div className={cn(
      "p-4 border-l-4 mt-2",
      isHigh ? "border-l-red-500 bg-red-500/5" : "border-l-amber-500 bg-amber-500/5"
    )}>
      <div className="flex items-center space-x-2 mb-2">
        {isHigh ? <AlertCircle size={16} className="text-red-500" /> : <AlertTriangle size={16} className="text-amber-500" />}
        <span className={cn(
          "text-[11px] font-black uppercase tracking-widest",
          isHigh ? "text-red-500" : "text-amber-500"
        )}>
          {isHigh ? "High Risk Account" : "Medium Risk Account"}
        </span>
      </div>
      <p className="text-[10px] text-white/80 font-medium">
        {fmt(outstanding)} outstanding, {overdue_invoices} invoices overdue.
      </p>
      <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-wider">
        Average {avg_days_late} days late
      </p>
      {isHigh && (
        <p className="text-[10px] text-red-400 font-bold mt-2 italic">
          Consider collecting outstanding amount before extending further credit.
        </p>
      )}
    </div>
  );
}
