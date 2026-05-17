import React from 'react';
import { cn } from '@/lib/utils';

interface AmountDisplayProps {
  value: string | number;
  currency?: string;
  className?: string;
  showCurrency?: boolean;
}

/**
 * AmountDisplay Component
 * 
 * CRITICAL: Financial data must maintain numerical integrity (1,2,3)
 * and LTR direction even in RTL (Urdu/Arabic) modes for table alignment.
 */
export const AmountDisplay: React.FC<AmountDisplayProps> = ({ 
  value, 
  currency = 'PKR', 
  className,
  showCurrency = true 
}) => {
  return (
    <span 
      className={cn(
        "num-data inline-flex items-center gap-1",
        className
      )}
    >
      {showCurrency && (
        <span className="text-[10px] opacity-40 font-bold uppercase tracking-widest">{currency}</span>
      )}
      <span>{value}</span>
    </span>
  );
};
