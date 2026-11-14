"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { clearDemoData } from '@/lib/demo/demoSeed';
import { useRouter } from 'next/navigation';

export function DemoModeBanner() {
  const [isActive, setIsActive] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkState = () => {
      if (typeof window !== 'undefined') {
        const active = localStorage.getItem('noxis_demo_mode_active') === 'true';
        setIsActive(active);
      }
    };

    checkState();
    window.addEventListener('noxis_demo_mode_changed', checkState);
    return () => {
      window.removeEventListener('noxis_demo_mode_changed', checkState);
    };
  }, []);

  const handleClear = async () => {
    setIsClearing(true);
    try {
      const res = await clearDemoData();
      if (res.success) {
        setIsActive(false);
        router.refresh();
      }
    } finally {
      setIsClearing(false);
    }
  };

  if (!isActive) return null;

  return (
    <div
      data-resilience-banner="demo-mode"
      className="w-full bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-200 select-none z-40 transition-all duration-300"
    >
      <div className="flex items-center space-x-2.5">
        <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
          <Sparkles size={12} className="animate-pulse" />
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-black uppercase tracking-wider text-amber-300">
            DEMO MODE ACTIVE
          </span>
          <span className="text-amber-200/80 hidden sm:inline">
            — Realistic textile mill data loaded (Al-Madina Textile Mills).
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleClear}
        disabled={isClearing}
        className="h-7 px-3 rounded bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 border border-amber-500/40 text-amber-100 font-semibold text-[11px] flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
      >
        {isClearing ? (
          <>
            <Loader2 size={12} className="animate-spin" />
            <span>Clearing...</span>
          </>
        ) : (
          <>
            <Trash2 size={12} />
            <span>Clear Demo Data</span>
          </>
        )}
      </button>
    </div>
  );
}

