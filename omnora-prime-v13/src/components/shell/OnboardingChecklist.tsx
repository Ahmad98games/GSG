"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { createClient } from '@/lib/supabase/client';
import { 
  CheckCircle2, Circle, Package, Users, 
  FileText, Smartphone, Image as ImageIcon, 
  Percent, Sparkles, X 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const ITEMS: ChecklistItem[] = [
  { id: 'add_sku', label: 'Add your first product/SKU', icon: Package },
  { id: 'add_party', label: 'Add a customer or supplier', icon: Users },
  { id: 'create_invoice', label: 'Create your first invoice', icon: FileText },
  { id: 'pair_device', label: 'Pair a mobile device', icon: Smartphone },
  { id: 'add_logo', label: 'Add your business logo', icon: ImageIcon },
  { id: 'config_tax', label: 'Configure your tax rate', icon: Percent },
];

export default function OnboardingChecklist() {
  const { profile } = useBusinessProfile();
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!profile) return;

    // Check account age
    const createdAt = new Date(profile.created_at);
    const now = new Date();
    const ageDays = (now.getTime() - createdAt.getTime()) / 1000 / 60 / 60 / 24;

    if (ageDays < 7 && !isDismissed) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }

    // Load progress from local storage (simplified for now, user asked for SQLite via local_config)
    // We'll use a fetch to get it if we had a proper local_config API
    const saved = localStorage.getItem('onboarding_checklist');
    if (saved) setCompletedIds(JSON.parse(saved));
  }, [profile, isDismissed]);

  const toggleItem = (id: string) => {
    const newIds = completedIds.includes(id) 
      ? completedIds.filter(i => i !== id)
      : [...completedIds, id];
    setCompletedIds(newIds);
    localStorage.setItem('onboarding_checklist', JSON.stringify(newIds));
  };

  if (!isVisible || completedIds.length === ITEMS.length) return null;

  const progress = Math.round((completedIds.length / ITEMS.length) * 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1A1D21] border border-white/5 p-6 space-y-6 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4">
        <button onClick={() => setIsDismissed(true)} className="text-gray-600 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="space-y-1">
        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center">
          <Sparkles size={14} className="text-sandstone-gold mr-2" />
          Onboarding Checklist
        </h3>
        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
          {completedIds.length} of {ITEMS.length} complete — you're almost set up
        </p>
      </div>

      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-sandstone-gold shadow-[0_0_10px_rgba(197,160,89,0.3)]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ITEMS.map((item) => {
          const isDone = completedIds.includes(item.id);
          const Icon = item.icon;

          return (
            <div 
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={cn(
                "flex items-center space-x-3 p-3 border transition-all cursor-pointer group",
                isDone 
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" 
                  : "bg-white/5 border-white/5 text-gray-500 hover:border-white/20"
              )}
            >
              {isDone ? <CheckCircle2 size={14} /> : <Circle size={14} />}
              <div className="flex-1 flex items-center space-x-2">
                <Icon size={12} className={cn(isDone ? "text-emerald-500" : "text-gray-700 group-hover:text-gray-400")} />
                <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
