"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';

type SyncState = 'synced' | 'syncing' | 'pending' | 'offline' | 'error';

export default function SyncIndicator({ isCollapsed }: { isCollapsed?: boolean }) {
  const [state, setState] = useState<SyncState>('synced');
  const [pendingCount, setPendingCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchStatus = async () => {
    if (!mounted) return;
    try {
      if (!navigator.onLine) {
        setState('offline');
        return;
      }

      const res = await fetch('/api/sync/status');
      if (!res.ok) {
        console.error('[SyncIndicator] Fetch failed with status:', res.status);
        setState('error');
        return;
      }
      
      const data = await res.json();
      setPendingCount(data.pending_count || 0);

      if (data.pending_count > 0) {
        setState('pending');
      } else {
        setState('synced');
      }
    } catch (error: any) {
      console.error('[SyncIndicator] Error fetching status:', error.message);
      setState('error');
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [mounted]);

  const handleRetry = () => {
    setState('syncing');
    fetchStatus();
  };

  const config = {
    synced: {
      dot: 'bg-emerald-500',
      text: 'All changes saved',
      icon: Cloud,
      color: 'text-emerald-500'
    },
    syncing: {
      dot: 'bg-blue-500 animate-pulse',
      text: 'Syncing...',
      icon: RefreshCw,
      color: 'text-blue-500'
    },
    pending: {
      dot: 'bg-amber-500',
      text: `${pendingCount} changes pending`,
      icon: Cloud,
      color: 'text-amber-500'
    },
    offline: {
      dot: 'bg-red-500',
      text: 'Working offline',
      icon: CloudOff,
      color: 'text-red-500'
    },
    error: {
      dot: 'bg-red-500',
      text: 'Sync failed — tap to retry',
      icon: AlertCircle,
      color: 'text-red-500'
    }
  };

  const current = config[state];
  const Icon = current.icon;

  return (
    <div 
      className={cn(
        "mt-auto px-4 py-3 border-t border-white/5 cursor-pointer group hover:bg-white/5 transition-colors",
        state === 'error' && "bg-red-500/5"
      )}
      onClick={state === 'error' ? handleRetry : undefined}
    >
      <div className={cn("flex items-center space-x-3", isCollapsed && "justify-center space-x-0")}>
        <div className="relative">
          <div className={cn("w-2 h-2 rounded-full", current.dot)} />
          {state === 'syncing' && (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="absolute -inset-1 border border-blue-500/50 rounded-full border-t-transparent"
            />
          )}
        </div>
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className={cn("text-[10px] font-black uppercase tracking-widest leading-none", current.color)}>
              {state === 'offline' ? 'Offline' : state === 'error' ? 'Error' : 'Sync Status'}
            </span>
            <span className="text-[9px] text-gray-500 font-bold uppercase mt-1 truncate max-w-[140px]">
              {current.text}
            </span>
          </div>
        )}
        {!isCollapsed && (
          <div className="ml-auto opacity-20 group-hover:opacity-40 transition-opacity">
            <Icon size={12} />
          </div>
        )}
      </div>
    </div>
  );
}
