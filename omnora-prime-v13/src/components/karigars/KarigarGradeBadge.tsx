'use client';

import React from 'react';
import { getGradeInfo, KarigarGradeValue } from '@/lib/karigars/gradeSystem';
import { cn } from '@/lib/utils';
import { Crown, Sparkles, Award, GraduationCap } from 'lucide-react';

interface KarigarGradeBadgeProps {
  grade?: string | null;
  showDetails?: boolean;
  className?: string;
}

export const KarigarGradeBadge: React.FC<KarigarGradeBadgeProps> = ({
  grade,
  showDetails = false,
  className
}) => {
  const info = getGradeInfo(grade);

  const icons: Record<KarigarGradeValue, React.ReactNode> = {
    MASTER: <Crown size={12} className="text-amber-400 shrink-0" />,
    A: <Sparkles size={11} className="text-emerald-400 shrink-0" />,
    B: <Award size={11} className="text-blue-400 shrink-0" />,
    C: <GraduationCap size={11} className="text-purple-400 shrink-0" />
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-sm",
        info.badgeClass,
        className
      )}
      title={`${info.description} (Multiplier: ${info.rateMultiplier}×)`}
    >
      {icons[info.value]}
      <span>{info.label}</span>
      {showDetails && (
        <span className="opacity-75 font-mono text-[8px]">
          ({info.rateMultiplier}×)
        </span>
      )}
    </span>
  );
};

export default KarigarGradeBadge;
