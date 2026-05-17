"use client";

import React from 'react';
import { useTierStore } from '@/stores/tierStore';
import { cn } from '@/lib/utils';
import { Shield, Zap, Crown } from 'lucide-react';

interface TierBadgeProps {
  className?: string;
  showIcon?: boolean;
}

export function TierBadge({ className, showIcon = true }: TierBadgeProps) {
  const { tier } = useTierStore();

  const configs = {
    lite: {
      label: 'Lite',
      color: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
      icon: Shield
    },
    pro: {
      label: 'Pro',
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      icon: Zap
    },
    elite: {
      label: 'Elite',
      color: 'text-[#C5A059] bg-[#C5A059]/10 border-[#C5A059]/20',
      icon: Crown
    }
  };

  const config = configs[tier] || configs.lite;
  const Icon = config.icon;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest",
      config.color,
      className
    )}>
      {showIcon && <Icon size={10} />}
      <span>{config.label}</span>
    </div>
  );
}
