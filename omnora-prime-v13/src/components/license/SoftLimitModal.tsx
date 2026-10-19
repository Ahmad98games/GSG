'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Package, Users, ShieldAlert } from 'lucide-react';

export type SoftLimitType = 'sku' | 'party';

interface SoftLimitModalProps {
  isOpen: boolean;
  type: SoftLimitType;
  onClose: () => void;
}

export function SoftLimitModal({ isOpen, type, onClose }: SoftLimitModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const isSku = type === 'sku';

  const title = isSku 
    ? "You have reached the 200 items limit on Free plan" 
    : "You have reached the 50 party accounts limit on Free plan";

  const description = isSku
    ? "Free tier includes up to 200 inventory items. Upgrade to Pro or Elite to add unlimited products and batch-tracked inventory."
    : "Free tier includes up to 50 customer and supplier accounts. Upgrade to Pro or Elite to manage unlimited parties and ledgers.";

  const Icon = isSku ? Package : Users;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-[#0F1114] border border-amber-500/30 rounded-lg p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Icon size={22} />
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
              Free Plan Soft Limit
            </span>
            <h3 className="text-base font-bold text-white tracking-tight mt-1">
              {title}
            </h3>
          </div>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed bg-black/40 p-3.5 rounded border border-white/5">
          {description}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white rounded-sm text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Not now
          </button>
          
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push('/settings/license?upgrade=true');
            }}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs rounded-sm transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center gap-1.5"
          >
            <span>See Plans</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
