import React, { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useDevices } from '../../hooks/useDevices';

interface DeviceGuardProps {
  children: React.ReactNode;
}

export const DeviceGuard: React.FC<DeviceGuardProps> = ({ children }) => {
  const [deviceUuid, setDeviceUuid] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const { updateLastActive } = useDevices();

  useEffect(() => {
    const checkDevice = async () => {
      // 1. Get or Generate Device UUID
      let uuid = localStorage.getItem('textile_device_uuid');
      if (!uuid) {
        uuid = crypto.randomUUID();
        localStorage.setItem('textile_device_uuid', uuid);
      }
      setDeviceUuid(uuid);

      // 2. Check if authorized in Supabase
      try {
        const { data, error } = await supabase
          .from('authorized_devices')
          .select('status')
          .eq('device_uuid', uuid)
          .eq('status', 'active')
          .single();

        if (error || !data) {
          setIsAuthorized(false);
        } else {
          setIsAuthorized(true);
          updateLastActive(uuid);
        }
      } catch {
        setIsAuthorized(false);
      } finally {
        setChecking(false);
      }
    };

    checkDevice();
  }, [updateLastActive]);

  if (checking) {
    return (
      <div className="min-h-screen bg-base-p flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-10 h-10 text-electric-blue animate-spin mb-6 shadow-[0_0_20px_rgba(96,165,250,0.2)]" />
        <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-[0.4em] font-black animate-pulse">Verifying Identity...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-base-p flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-base-s border border-white/5 rounded-[2px] p-12 text-center space-y-10 shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
          <div className="w-20 h-20 bg-red-500/5 rounded-[2px] flex items-center justify-center mx-auto mb-4 border border-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.05)]">
            <ShieldAlert className="text-red-500 w-10 h-10" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-xl font-black text-white uppercase tracking-[0.2em] font-mono italic">Access Denied</h1>
            <p className="text-zinc-600 text-xs leading-relaxed font-mono uppercase tracking-widest">
              This device is not linked to the industrial registry. 
              Contact the administrator with the following identifier.
            </p>
          </div>

          <div className="bg-base-p border border-white/5 p-6 rounded-[2px] space-y-3 shadow-inner">
            <p className="text-[9px] text-zinc-700 uppercase font-black tracking-[0.4em] font-mono">Hardware Identifier</p>
            <p className="font-mono text-electric-blue text-xs break-all font-black uppercase tracking-tighter shadow-sm">{deviceUuid}</p>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-electric-blue text-base-p font-black py-4 rounded-[2px] transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95"
          >
            <RefreshCw size={16} />
            Retry Link
          </button>
          
          <p className="text-[9px] text-zinc-800 uppercase tracking-[0.5em] font-black font-mono">
            Identity Persistence Active
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
