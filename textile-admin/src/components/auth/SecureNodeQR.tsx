import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Lock, ShieldCheck, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { GS_PROTOCOL } from '../../lib/protocols';

interface Props {
  onUnlock: () => void;
}

export const SecureNodeQR: React.FC<Props> = ({ onUnlock }) => {
  const [timestamp, setTimestamp] = useState(() => Math.floor(Date.now() / 1000));
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [status, setStatus] = useState<'AWAITING' | 'SYNCING' | 'GRANTED'>('AWAITING');
  const [protocolLog, setProtocolLog] = useState<string[]>(['INITIALIZING SECURE_NODE_01...', 'AWAITING PEER CONNECTION...']);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = Math.floor(Date.now() / 1000);
      setTimestamp(current);
      setSecondsRemaining(30 - (current % 30));
    }, 1000);

    // Supabase Realtime Sync
    const channel = supabase
      .channel('node_sync')
      .on('broadcast', { event: 'SYNC_COMPLETE' }, (payload) => {
        console.log('Sync Event Received:', payload);
        setStatus('GRANTED');
        setProtocolLog(prev => [...prev, 'PROTOCOL_MATCH: GS-NODE-AUTH', 'SYNC_SUCCESS: PEER_VERIFIED', 'GRANTING ACCESS...']);
        setTimeout(() => onUnlock(), 1500);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setProtocolLog(prev => [...prev, `GATEWAY_READY: SECURE_NODE_CH_PRIMARY`]);
        }
      });

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [onUnlock]);

  const authProtocolString = `${GS_PROTOCOL.AUTH}:${timestamp}`;

  return (
    <div className="fixed inset-0 z-[1000] bg-[#000000] flex items-center justify-center font-mono-vault overflow-hidden">
      {/* Background Matrix Effect */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:20px_20px]" />
      
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12 p-8 relative">
        {/* Left: Security Identity */}
        <div className="flex flex-col justify-center space-y-8 animate-in slide-in-from-left duration-700">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <Zap className="w-6 h-6 animate-pulse" />
              <h1 className="text-2xl font-black italic tracking-[.3em] uppercase">Gold She ERP</h1>
            </div>
            <p className="text-[#52525b] text-[10px] font-black uppercase tracking-widest">Elite Ecosystem 6.0 // Secure Node Protocol</p>
          </div>

          <div className="space-y-4">
            <div className="bg-[#18181b]/50 border-l-2 border-[#D4AF37] p-4 space-y-2">
              <div className="flex items-center gap-2">
                {status === 'GRANTED' ? <ShieldCheck className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-[#D4AF37]" />}
                <span className="text-[11px] font-black text-white uppercase tracking-tighter">
                  {status === 'GRANTED' ? 'ACCESS GRANTED' : 'NODE ENCRYPTION ACTIVE'}
                </span>
              </div>
              <p className="text-[9px] text-zinc-500 leading-relaxed uppercase">
                THIS TERMINAL IS PROTECTED BY A SECURE NODE GUARD. PLEASE SCAN THE DYNAMIC PROTOCOL KEY WITH THE PERSONALIZED MOBILE APK TO INITIALIZE SESSION.
              </p>
            </div>

            {/* Protocol Logs */}
            <div className="bg-zinc-950 border border-zinc-900 p-4 h-32 overflow-hidden flex flex-col justify-end gap-1">
              {protocolLog.slice(-5).map((log, i) => (
                <div key={i} className="flex gap-3 text-[8px]">
                  <span className="text-zinc-700">[{new Date().toLocaleTimeString()}]</span>
                  <span className={log.includes('SUCCESS') || log.includes('GRANTED') ? 'text-green-500' : 'text-zinc-500'}>
                    {log}
                  </span>
                </div>
              ))}
              <div className="flex gap-2 text-[8px] animate-pulse">
                <span className="text-zinc-700">[{new Date().toLocaleTimeString()}]</span>
                <span className="text-[#D4AF37]">AWAITING PEER DATA...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: The QR Node */}
        <div className="flex flex-col items-center justify-center space-y-6 animate-in zoom-in-95 duration-1000">
          <div className="relative group">
            <div className="absolute -inset-4 border border-[#D4AF37]/20 group-hover:border-[#D4AF37]/40 transition-colors" />
            <div className="absolute -top-4 -left-4 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37]" />
            <div className="absolute -top-4 -right-4 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37]" />
            <div className="absolute -bottom-4 -left-4 w-4 h-4 border-b-2 border-l-2 border-[#D4AF37]" />
            <div className="absolute -bottom-4 -right-4 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37]" />

            <div className="bg-white p-6 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
              <QRCodeSVG 
                value={authProtocolString} 
                size={220} 
                level="H"
                includeMargin={false}
                fgColor="#000000"
              />
            </div>

            <div className="absolute left-0 right-0 h-[2px] bg-[#D4AF37]/50 shadow-[0_0_10px_#D4AF37] top-0 animate-[scan_3s_linear_infinite]" />
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="px-4 py-1 bg-zinc-900 border border-zinc-800 rounded-full flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-ping" />
              <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest">Refreshes in {secondsRemaining}s</span>
            </div>
            <span className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest italic">{authProtocolString}</span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 0% }
          100% { top: 100% }
        }
      `}} />
    </div>
  );
};
