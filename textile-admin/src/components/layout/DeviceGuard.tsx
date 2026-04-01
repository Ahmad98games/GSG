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
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 text-gold animate-spin mb-4" />
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Verifying Hardware Identity...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <ShieldAlert className="text-red-500 w-10 h-10" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">Access Denied</h1>
            <p className="text-zinc-400 text-sm">
              This device is not authorized to access the system ledger. 
              Please contact the administrator and provide the hardware identifier below.
            </p>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-2">
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Hardware Identifier (UUID)</p>
            <p className="font-mono text-gold text-sm break-all font-bold">{deviceUuid}</p>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Retry Authorization
          </button>
          
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
            Identity-Linked Scanning Active
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
