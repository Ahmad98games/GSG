'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Package, Users, Hammer, AlertTriangle } from 'lucide-react';
import { useLicense } from '@/hooks/useLicense';
import { cn } from '@/lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

function colorFromPct(pct: number): { bar: string; text: string; border: string } {
  if (pct >= 100) return { bar: 'bg-red-500',   text: 'text-red-400',   border: 'border-red-500/30' };
  if (pct >= 80)  return { bar: 'bg-amber-500',  text: 'text-amber-400', border: 'border-amber-500/30' };
  return              { bar: 'bg-blue-500',   text: 'text-blue-400',  border: 'border-blue-500/20' };
}

// ── FreeLimitBar ──────────────────────────────────────────────────────────────

/**
 * Renders usage progress bars for SKUs, Parties, and Karigars.
 * Only visible when on the free tier AND at least one resource is ≥ 60% full.
 * Clicking navigates to /settings/license.
 */
export function FreeLimitBar() {
  const router = useRouter();
  const { isFree, skuUsagePct, partyUsagePct, karigarUsagePct, skuCount, partyCount, karigarCount, limit } = useLicense();

  // Only render on free tier
  if (!isFree) return null;

  // Only render when at least one resource is approaching limit
  const maxPct = Math.max(skuUsagePct, partyUsagePct, karigarUsagePct);
  if (maxPct < 60) return null;

  const bars: Array<{
    label: string;
    icon: React.ElementType;
    pct: number;
    count: number;
    max: number;
  }> = [
    { label: 'Items',     icon: Package, pct: skuUsagePct,     count: skuCount,     max: limit('max_skus')     },
    { label: 'Customers', icon: Users,   pct: partyUsagePct,   count: partyCount,   max: limit('max_parties')  },
    { label: 'Workers',   icon: Hammer,  pct: karigarUsagePct, count: karigarCount, max: limit('max_karigars') },
  ].filter((b) => b.pct >= 60);  // Only show bars that matter

  const overallColors = colorFromPct(maxPct);

  return (
    <button
      onClick={() => router.push('/settings/license')}
      className={cn(
        'w-full mx-0 my-2 px-3 py-2.5 rounded-sm border text-left transition-all duration-200',
        'bg-noxis-overlay hover:bg-noxis-overlay-hover',
        overallColors.border,
      )}
      title="Click to upgrade your plan"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <AlertTriangle size={10} className={cn('flex-shrink-0', overallColors.text)} />
        <span className={cn('text-[9px] font-black uppercase tracking-widest', overallColors.text)}>
          {maxPct >= 100 ? 'Limit Reached — Upgrade Now' : 'Approaching Free Limit'}
        </span>
      </div>

      <div className="space-y-1.5">
        {bars.map(({ label, icon: Icon, pct, count, max }) => {
          const c = colorFromPct(pct);
          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1">
                  <Icon size={8} className={cn('flex-shrink-0', c.text)} />
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                </div>
                <span className={cn('text-[8px] font-black', c.text)}>
                  {count}/{max}
                </span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', c.bar)}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </button>
  );
}
