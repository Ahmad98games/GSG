"use client";

import React, { useEffect } from 'react';
import { useBranchStore } from '@/stores/branchStore';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import BranchSwitcher from './BranchSwitcher';
import { Search, Download, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TierBadge } from '../ui/TierBadge';

interface TopBarProps {
  breadcrumb?: {
    label: string;
    href?: string;
    active?: boolean;
  }[];
  actions?: React.ReactNode;
}

export default function TopBar({ breadcrumb, actions }: TopBarProps) {
  const { profile } = useBusinessProfile();
  const fetchBranches = useBranchStore(state => state.fetchBranches);

  // On app load: Fetch branches once on mount
   useEffect (() => {
    if (profile?.id) {
      fetchBranches(profile.id);
    }
  }, [profile?.id, fetchBranches]);

  return (
    <header className="h-16 border-b border-white/5 flex items-center px-8 bg-surface/50 backdrop-blur-md sticky top-0 z-40">
      {/* Brand & Branch Switcher */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black">
          <span className="text-white">NOXIS</span>
        </div>
        
        <div className="h-4 w-px bg-white/10" />
        
        <BranchSwitcher />
        <div className="h-4 w-px bg-white/10" />
        <TierBadge />
      </div>

      {/* Breadcrumbs (Optional) */}
      {breadcrumb && (
        <nav className="ml-8 flex items-center space-x-3 text-[10px] uppercase tracking-widest text-gray-500">
          {breadcrumb.map((item, i) => (
            <React.Fragment key={item.label}>
              {i > 0 && <span className="opacity-30">/</span>}
              <span className={cn(
                item.active ? "text-white font-bold" : "hover:text-white transition-colors cursor-pointer"
              )}>
                {item.label}
              </span>
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Actions */}
      <div className="ml-auto flex items-center space-x-3">
        {actions}
      </div>
    </header>
  );
}

