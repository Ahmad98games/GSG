"use client";
import { useEffect, useRef, useState } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, AlertCircle, ShieldCheck } from 'lucide-react';
import { useBranchStore } from '@/stores/branchStore';
import { usePersona } from '@/hooks/usePersona';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { createClient } from '@/lib/supabase/client';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { cn } from '@/lib/utils';

/**
 * BranchSwitcher
 * Living in the top bar, this is the primary context switcher for multi-site operations.
 * Design: Electric Slate v9.0
 */
export default function BranchSwitcher() {
  const { branches, activeBranch, activeBranchId, setActiveBranch, fetchBranches, isLoading } = useBranchStore();
  const { profile } = useBusinessProfile();
  const { t } = usePersona();
  const [isOpen, setIsOpen] = useState(false);
  const [tier, setTier] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<any>(null);
  const supabase = createClient();

  useOnClickOutside(containerRef, () => setIsOpen(false));

  useEffect(() => {
    if (profile?.id) {
      fetchBranches(profile.id);
      
      // Elite gate: verify license tier
      const fetchTier = async () => {
        const { data } = await supabase
          .from('licenses')
          .select('tier')
          .eq('tenant_id', profile.id)
          .eq('status', 'active')
          .limit(1)
          .single();
        if (data) setTier(data.tier);
      };
      fetchTier();
    }
  }, [profile?.id, fetchBranches, supabase]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') setIsOpen(true);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        setActiveIndex(prev => (prev < branches.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        if (activeIndex >= 0) {
          const b = branches[activeIndex];
          if (b.status !== 'suspended') {
            setActiveBranch(b.id);
            setIsOpen(false);
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  if (isLoading && !activeBranch) {
    return (
      <div className="h-8 w-40 bg-white/5 animate-pulse rounded-sm ml-4" />
    );
  }

  const isElite = tier === 'elite';
  const hasMultipleBranches = branches.length > 1;
  const canSwitch = isElite && hasMultipleBranches;

  // Single-location or Non-Elite render
  if (!canSwitch) {
    return (
      <div className="flex items-center space-x-2 px-4 py-1.5 text-gray-400 cursor-default select-none border-l border-white/5 ml-4">
        <span className="text-[10px] font-mono text-sandstone-gold font-bold uppercase tracking-wider">
          {activeBranch?.code || 'HQ'}
        </span>
        <span className="text-xs font-medium text-white truncate max-w-[150px]">
          {activeBranch?.name || profile?.business_name}
        </span>
      </div>
    );
  }

  return (
    <div 
      className="relative ml-4 border-l border-white/5" 
      ref={containerRef} 
      onKeyDown={handleKeyDown}
      role="combobox" 
      aria-expanded={isOpen} 
      aria-haspopup="listbox"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center space-x-2 px-4 py-1.5 hover:bg-white/5 transition-all group outline-none focus:bg-white/5",
          isOpen ? "bg-white/5" : "bg-transparent"
        )}
      >
        <span className="text-[10px] font-mono text-sandstone-gold font-bold uppercase tracking-wider">
          {activeBranch?.code}
        </span>
        <span className="text-xs font-medium text-white truncate max-w-[150px] flex items-center">
          {activeBranch?.name}
          {activeBranch?.status === 'suspended' && (
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 ml-2" />
          )}
        </span>
        <ChevronDown 
          size={14} 
          className={cn("text-gray-500 transition-transform duration-200", isOpen && "rotate-180")} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 250, damping: 30 }}
            className="absolute top-full left-0 mt-1 w-64 bg-surface border border-white/10 shadow-2xl z-[100] overflow-hidden"
            role="listbox"
          >
            <div className="p-2 border-b border-white/5 bg-onyx/50">
              <span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold">
                {t('select_branch')}
              </span>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto py-1 custom-scrollbar">
              {branches.map((branch, idx) => (
                <BranchOption 
                  key={branch.id} 
                  branch={branch} 
                  isFocused={idx === activeIndex}
                  isActive={branch.id === activeBranchId}
                  onSelect={(id) => {
                    setActiveBranch(id);
                    setIsOpen(false);
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface BranchOptionProps {
  branch: any;
  isActive: boolean;
  isFocused: boolean;
  onSelect: (id: string) => void;
}

function BranchOption({ branch, isActive, isFocused, onSelect }: BranchOptionProps) {
  const isSuspended = branch.status === 'suspended';

  return (
    <button
      role="option"
      aria-selected={isActive}
      disabled={isSuspended}
      onClick={() => !isSuspended && onSelect(branch.id)}
      className={cn(
        "w-full flex items-center justify-between px-4 py-2.5 transition-all text-left group border-l-[3px] outline-none",
        isActive ? "bg-electric-blue/5 border-electric-blue" : "border-transparent",
        !isActive && isFocused && "bg-white/5",
        !isActive && !isFocused && "hover:bg-white/[0.02]",
        isSuspended ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      )}
    >
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <span className={cn(
            "text-[9px] font-mono font-bold uppercase",
            isSuspended ? "text-amber-500" : "text-sandstone-gold"
          )}>
            {branch.code}
          </span>
          <span className={cn(
            "text-xs font-medium",
            isActive ? "text-white" : "text-gray-400 group-hover:text-white"
          )}>
            {branch.name}
          </span>
        </div>
        <div className="flex items-center mt-0.5 space-x-2">
          {branch.is_headquarters && (
            <span className="text-[8px] font-mono bg-white/10 text-gray-500 px-1 rounded-sm uppercase">HQ</span>
          )}
          {branch.city && (
            <span className="text-[9px] text-gray-600 uppercase tracking-tighter">{branch.city}</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center">
        {isSuspended && <AlertCircle size={12} className="text-amber-500" />}
        {isActive && !isSuspended && <ShieldCheck size={14} className="text-electric-blue" />}
      </div>
    </button>
  );
}
