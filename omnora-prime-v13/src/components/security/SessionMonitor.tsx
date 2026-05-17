"use client";
import { useEffect, useState } from 'react';
import { resetAllStores } from "@/stores";
import { createClient } from "@/lib/supabase/client";

export default function SessionMonitor() {
  const [showWarning, setShowWarning] = useState(false);
  const supabase = createClient();

   useEffect(() => {
    // 1. Listen for warning from Electron
    const cleanupWarning = (window as any).electron?.session?.onWarning(() => {
      setShowWarning(true);
    });

    // 2. Listen for timeout from Electron
    const cleanupTimeout = (window as any).electron?.session?.onTimeout(async () => {
      console.warn('[Security] Auto-signout sequence started...');
      
      // ORDER MATTERS: Clear stores first, then invalidate session
      resetAllStores(); // Line X: Store cleanup
      await supabase.auth.signOut(); // Line Y: Auth invalidation
      
      window.location.href = '/auth/login';
    });

    // 3. User activity tracking (send to main process)
    const handleActivity = () => {
      (window as any).electron?.session?.userActivity();
    };

    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      cleanupWarning?.();
      cleanupTimeout?.();
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [supabase]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="max-w-md w-full bg-onyx border border-electric-blue/30 p-8 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4 tracking-tighter">SESSION EXPIRING</h2>
        <p className="text-gray-400 text-sm mb-8">
          Your session will expire in 60 seconds due to inactivity. 
          Unsaved changes will be lost and local stores will be purged.
        </p>
        <button
          onClick={() => {
            (window as any).electron?.session?.staySignedIn();
            setShowWarning(false);
          }}
          className="w-full bg-electric-blue text-onyx py-4 font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all"
        >
          Stay Signed In
        </button>
        {/* NON-DISMISSIBLE: No close button, no Escape handling in this div */}
      </div>
    </div>
  );
}

