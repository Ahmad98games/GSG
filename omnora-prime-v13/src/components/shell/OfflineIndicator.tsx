'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const updateStatus = () => {
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (!online) {
        setWasOffline(true);
      }
      if (online && wasOffline) {
        setShowReconnected(true);
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          setShowReconnected(false);
        }, 3000);
      }
      setIsOnline(online);
    };

    updateStatus();

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, [wasOffline]);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`fixed bottom-4 right-6 z-[100] flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-2xl transition-all duration-300 pointer-events-none ${
        showReconnected
          ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
          : 'bg-[#0B0F17] border border-[#08EBF6]/40 text-[#08EBF6] shadow-[0_0_15px_rgba(8,235,246,0.25)]'
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          showReconnected ? 'bg-black' : 'bg-[#08EBF6] animate-pulse'
        }`}
      />
      {showReconnected ? (
        <span className="flex items-center gap-1.5"><Wifi size={13} /> Cloud Synced</span>
      ) : (
        <span className="flex items-center gap-1.5"><WifiOff size={13} /> Offline Mode (Local Workstation)</span>
      )}
    </div>
  );
}
