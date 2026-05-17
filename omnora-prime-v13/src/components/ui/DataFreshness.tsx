"use client";

import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface DataFreshnessProps {
  lastFetchedAt: Date | null;
  onRefresh?: () => void;
  className?: string;
}

export default function DataFreshness({ lastFetchedAt, onRefresh, className }: DataFreshnessProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  if (!lastFetchedAt) {
    return (
      <div className={cn("flex items-center space-x-2 text-[9px] text-gray-500 font-black uppercase tracking-widest animate-pulse", className)}>
        <RefreshCw size={10} className="animate-spin" />
        <span>Loading Data...</span>
      </div>
    );
  }

  const diffMinutes = (now.getTime() - lastFetchedAt.getTime()) / 1000 / 60;
  const isStale = diffMinutes >= 5;

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <span className={cn(
        "text-[9px] font-black uppercase tracking-widest",
        isStale ? "text-amber-500" : "text-gray-500"
      )}>
        Last updated: {formatDistanceToNow(lastFetchedAt, { addSuffix: true })}
      </span>
      {isStale && (
        <button 
          onClick={onRefresh}
          className="flex items-center space-x-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-black uppercase hover:bg-amber-500 hover:text-black transition-all"
        >
          <AlertCircle size={8} />
          <span>Outdated — Refresh</span>
        </button>
      )}
      {!isStale && onRefresh && (
        <button 
          onClick={onRefresh}
          className="p-1 text-gray-600 hover:text-white transition-colors"
        >
          <RefreshCw size={10} />
        </button>
      )}
    </div>
  );
}
