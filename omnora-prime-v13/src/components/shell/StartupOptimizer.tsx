"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { queryClient } from '@/lib/queryClient';
import { cleanupExpiredStorage } from '@/lib/storage/storageManager';
import { useToastStore } from '@/hooks/useToast';

export function StartupOptimizer() {
  const router = useRouter();

  useEffect(() => {
    // 1. Log React mount timing
    try {
      const bootStart = (typeof window !== 'undefined' ? (window as any).__bootStart : null) || Date.now();
      console.log(`[BOOT] React mounted: ${Date.now() - bootStart}ms`);
    } catch {}

    // 2. Prefetch most used routes silently in background after 3000ms idle
    const timer = setTimeout(() => {
      try {
        router.prefetch('/pos');
        router.prefetch('/inventory');
        router.prefetch('/khata');
        router.prefetch('/karigars');
        router.prefetch('/invoices');
      } catch {}
    }, 3000);

    // 3. Listen for Electron process memory warning & auto-purge
    const electronAPI = typeof window !== 'undefined' ? (window as any).electronAPI : null;
    let handleMemWarn: any = null;

    if (electronAPI?.on) {
      handleMemWarn = (_event: any, payload: any) => {
        const data = payload || _event;
        if (data?.level === 'critical') {
          console.warn(`[MEMORY] Critical ceiling triggered (${data.mb}MB). Purging query & localStorage caches.`);
          queryClient.clear();
          cleanupExpiredStorage();
          try {
            useToastStore.getState().addToast({
              type: 'info',
              title: 'Memory Cleaned Up',
              message: 'Caches purged — app optimized for 10+ hr continuous operation',
            });
          } catch {}
        }
      };
      electronAPI.on('system:memory-warning', handleMemWarn);
    }

    return () => {
      clearTimeout(timer);
      if (electronAPI?.off && handleMemWarn) {
        electronAPI.off('system:memory-warning', handleMemWarn);
      }
    };
  }, [router]);

  return null;
}
