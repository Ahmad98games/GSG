
"use client";

import React from "react";
import AnimatedNumber from "./AnimatedNumber";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon?: React.ElementType;
  color?: string;
  className?: string;
}

export function SummaryCard({ 
  label, 
  value, 
  sub, 
  icon: Icon, 
  color = "text-[#C5A059]",
  className 
}: SummaryCardProps) {
  return (
    <div className={cn(
      "rounded-sm bg-[#111418] border border-white/[0.06] p-5 hover:border-white/[0.1] transition-colors relative overflow-hidden group",
      className
    )}>
      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-1/3 h-[1px] bg-gradient-to-r from-[#60A5FA] to-transparent opacity-60" />
      
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          {/* Label */}
          <p className="text-xxs font-semibold tracking-wide-md uppercase text-gray-500">
            {label}
          </p>
          
          {/* Value */}
          <div className={cn("mt-2 font-mono text-2xl font-semibold tabular-nums", color)}>
            <AnimatedNumber value={value.toString()} />
          </div>
          
          {/* Sub label */}
          {sub && (
            <p className="mt-1 text-xxs text-gray-600">
              {sub}
            </p>
          )}
        </div>

        {Icon && (
          <div className="p-2 bg-white/5 rounded-sm text-gray-600 group-hover:text-white transition-colors">
            <Icon size={16} />
          </div>
        )}
      </div>
    </div>
  );
}
