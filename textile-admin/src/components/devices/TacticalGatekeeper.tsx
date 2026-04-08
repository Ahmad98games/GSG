import React, { useState, useEffect } from 'react';
import { 
  Shield, Smartphone, Plus, X, 
  AlertCircle, Zap, Battery, Signal, 
  Radio
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { DeviceNode } from '../layout/DashboardLayout';
import { GS_PROTOCOL } from '../../lib/protocols';
import { supabase } from '../../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';

interface Props {
  onNodeSync: (node: DeviceNode | null) => void;
  activeNode: DeviceNode | null;
}

export const TacticalGatekeeper: React.FC<Props> = ({ onNodeSync, activeNode }) => {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkToken, setLinkToken] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  
  // Real-time listener for Confirmation
  useEffect(() => {
    if (!showLinkModal) return;

    const channel = supabase.channel('handshake_sync')
      .on('broadcast', { event: 'NODE_CONFIRM' }, ({ payload }) => {
        console.log('NODE_CONFIRM received:', payload);
        onNodeSync({
            id: payload.deviceId,
            name: payload.deviceName,
            battery: payload.battery || 100,
            signalStrength: payload.signal || 'strong',
            status: 'connected',
            lastActive: new Date().toISOString()
        });
        setShowLinkModal(false);
      })
      .on('broadcast', { event: 'NODE_TELEMETRY' }, ({ payload }) => {
        if (activeNode && payload.deviceId === activeNode.id) {
          onNodeSync({
            ...activeNode,
            battery: payload.battery,
            signalStrength: payload.signal,
            lastActive: new Date().toISOString()
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [showLinkModal, onNodeSync, activeNode]);


  useEffect(() => {
    if (showLinkModal) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            const timestamp = Date.now();
            setLinkToken(`${GS_PROTOCOL.BATCH}-LINK:${timestamp}`);
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showLinkModal]);

  const openLinkModal = () => {
    const timestamp = Date.now();
    setLinkToken(`${GS_PROTOCOL.BATCH}-LINK:${timestamp}`);
    setTimeLeft(15);
    setShowLinkModal(true);
  };

  const handleDisconnect = () => {
    if (window.confirm('EXECUTE REMOTE_KILL? THIS WILL LOCK THE FIELD NODE IMMEDIATELY.')) {
      supabase.channel('handshake_sync').send({
        type: 'broadcast',
        event: 'NODE_REVOKE',
        payload: { targetId: activeNode?.id }
      });
      onNodeSync(null);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-700 font-mono-vault">
      {/* Header Panel */}
      <div className="bg-[#18181b] border border-[#27272a] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#D4AF37]" />
        
        <div>
          <div className="flex items-center gap-3">
            <Shield className="text-[#D4AF37] w-6 h-6" />
            <h2 className="text-xl font-black text-white italic tracking-[.2em] uppercase">Tactical Gatekeeper</h2>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 font-bold tracking-widest uppercase">
            Node_Control_Panel // GS_Ecosystem_Security_v7
          </p>
        </div>

        <button 
          onClick={openLinkModal}
          className="px-6 py-3 bg-[#D4AF37] hover:bg-[#C5A028] text-zinc-950 flex items-center gap-3 transition-all active:scale-95 group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[.2em]">Link New Security Node</span>
        </button>
      </div>

      {/* Main Pulse Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
        {/* Device Identity Card */}
        <div className={cn(
          "md:col-span-2 bg-[#09090b] border p-8 flex flex-col justify-between transition-all duration-500",
          activeNode ? "border-[#D4AF37]/30" : "border-zinc-900 border-dashed"
        )}>
          {activeNode ? (
            <>
              <div className="space-y-8">
                <div className="flex justify-between items-start">
                  <div className="flex gap-6">
                    <div className="w-16 h-16 bg-zinc-900 border border-[#D4AF37]/20 flex items-center justify-center rounded-sm">
                      <Smartphone className="w-8 h-8 text-[#D4AF37]" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{activeNode.name}</h3>
                      <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-1">UUID: {activeNode.id}</p>
                      <div className="flex items-center gap-3 mt-4">
                        <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-sm">
                          Handshake_Verified
                        </span>
                        <span className="text-[9px] text-zinc-600 font-black uppercase">Session_TTL: 14h 22m</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-4">
                    <div className="flex flex-col items-end">
                       <span className="text-[9px] text-zinc-600 font-black uppercase mb-1">Battery_Pulse</span>
                       <div className="flex items-center gap-3">
                         <span className="text-lg font-black text-white">{activeNode.battery}%</span>
                         <Battery className={cn("w-5 h-5", activeNode.battery < 20 ? "text-red-500 animate-pulse" : "text-green-400")} />
                       </div>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[9px] text-zinc-600 font-black uppercase mb-1">Industrial_Signal</span>
                       <div className="flex items-center gap-3">
                         <span className="text-lg font-black text-white uppercase">{activeNode.signalStrength}</span>
                         <Signal className="w-5 h-5 text-[#D4AF37]" />
                       </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 pt-8 border-t border-zinc-900">
                   {[
                     { l: 'ENC_MODE', v: 'X3DH_ACTIVE' },
                     { l: 'FS_LATENCY', v: '<45ms' },
                     { l: 'PACKET_STATUS', v: 'SYMMETRIC' },
                     { l: 'SYNC_PROTOCOL', v: 'GS_v6_PULSE' },
                   ].map((s, i) => (
                     <div key={i} className="space-y-1">
                       <p className="text-[8px] text-zinc-600 font-black uppercase tracking-[.2em]">{s.l}</p>
                       <p className="text-[10px] text-zinc-200 font-black uppercase tracking-widest">{s.v}</p>
                     </div>
                   ))}
                </div>
              </div>

              <div className="flex justify-between items-center mt-12 bg-red-500/[0.02] border border-red-500/10 p-4 rounded-sm">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-red-500 w-4 h-4" />
                  <span className="text-[9px] text-red-500/80 font-black uppercase tracking-[.2em]">Emergency Override Protocol // Authorized Access Only</span>
                </div>
                <button 
                  onClick={handleDisconnect}
                  className="px-6 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Terminate_Session
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-30">
              <Radio className="w-12 h-12 text-[#D4AF37] animate-pulse" />
              <p className="text-[11px] font-black uppercase tracking-[.4em] italic text-[#D4AF37]">Waiting for Security Handshake...</p>
            </div>
          )}
        </div>

        {/* Real-time Event Log */}
        <div className="bg-[#18181b] border border-[#27272a] p-6 flex flex-col rounded-sm">
           <h4 className="text-[10px] font-black text-white italic uppercase tracking-[.2em] mb-4 flex items-center gap-2">
             <Zap className="w-3 h-3 text-[#D4AF37]" /> SECURITY_LOGS
           </h4>
           <div className="flex-1 overflow-auto space-y-4 custom-scrollbar pr-2">
              {([
                { t: '12:04:22', e: 'SESSION_ROOT_OPENED', s: 'neutral' },
                { t: '12:04:45', e: 'NODE_AUTH_GEN_REQ', s: 'warning' },
                activeNode && { t: '12:05:01', e: `NODE_${activeNode.name.toUpperCase()}_LINKED`, s: 'success' },
              ].filter(Boolean) as { t: string, e: string, s: string }[]).map((log, i) => (
                <div key={i} className="flex gap-3 text-[9px] border-b border-zinc-900 pb-3">
                  <span className="text-[#D4AF37] font-black italic">{log.t}</span>
                  <span className={cn(
                    "font-black uppercase tracking-tighter",
                    log.s === 'success' ? "text-green-500" : log.s === 'warning' ? "text-yellow-500" : "text-zinc-500"
                  )}>{log.e}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Handshake Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" />
          <div className="bg-[#09090b] border border-[#D4AF37]/30 w-full max-w-sm p-10 relative animate-in zoom-in-95 duration-500 text-center space-y-8">
            <button 
              onClick={() => setShowLinkModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-white italic uppercase tracking-[.2em]">Security Handshake</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Scan this key with your mobile device</p>
            </div>

            <div className="p-4 bg-white rounded-sm inline-block shadow-[0_0_50px_rgba(212,175,55,0.1)]">
              <QRCodeSVG value={linkToken} size={180} level="H" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-6">
                <div className="flex flex-col items-center">
                  <span className="text-[20px] font-black text-[#D4AF37]">{timeLeft}s</span>
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Protocol Refresh</span>
                </div>
                <div className="h-8 w-[1px] bg-zinc-900" />
                <div className="flex flex-col items-center">
                  <span className="text-[20px] font-black text-[#D4AF37]">GSv7</span>
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Core Version</span>
                </div>
              </div>
              <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#D4AF37] transition-all duration-1000 ease-linear"
                  style={{ width: `${(timeLeft/15)*100}%` }}
                />
              </div>
            </div>

            <p className="text-[9px] text-[#D4AF37] font-black uppercase animate-pulse">
              [ LISTENING FOR MOBILE CONFIRMATION... ]
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
