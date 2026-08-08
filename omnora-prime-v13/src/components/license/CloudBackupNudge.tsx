'use client';

import React, { useEffect, useState } from 'react';
import { Cloud, X, HardDrive, AlertTriangle } from 'lucide-react';
import { useLicense } from '@/hooks/useLicense';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'noxis_cloud_nudge_shown';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const DELAY_MS    = 30_000;               // 30 seconds after app opens

/**
 * CloudBackupNudge
 *
 * Appears 30 seconds after the app opens, once per 24 hours.
 * Only visible on the free tier (no cloud backup available).
 * Warns the user their data exists only on this PC and offers an upgrade path.
 */
export function CloudBackupNudge() {
  const { isFree } = useLicense();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isFree) return;

    // Check cooldown — never show more than once per 24h
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown) {
      const elapsed = Date.now() - parseInt(lastShown, 10);
      if (elapsed < COOLDOWN_MS) return;
    }

    const timer = setTimeout(() => {
      setVisible(true);
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, [mounted, isFree]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  };

  if (!mounted || !isFree || !visible) return null;

  const waUrl = `https://wa.me/923264742678?text=${encodeURIComponent(
    'Hi, I want to activate cloud backup for my Noxis Hub. Please share the Pro plan details.'
  )}`;

  return (
    <div
      className={cn(
        'relative w-full rounded-sm border border-amber-500/30 bg-amber-500/[0.04]',
        'p-3 flex gap-3 items-start transition-all duration-300',
      )}
      role="alert"
    >
      {/* Icon */}
      <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-sm bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <HardDrive size={14} className="text-amber-400" />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <AlertTriangle size={10} className="text-amber-400 flex-shrink-0" />
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">
            Data Stored on This PC Only
          </p>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your business data — invoices, inventory, and payroll — exists only on this computer.
          A hard drive failure will permanently erase it.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-black rounded-sm text-[10px] font-black uppercase tracking-wider hover:bg-amber-400 transition-colors"
          >
            <Cloud size={10} />
            Enable Cloud Backup
          </a>
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
        title="Remind me tomorrow"
        aria-label="Dismiss cloud backup nudge"
      >
        <X size={14} />
      </button>
    </div>
  );
}
