'use client';

import React, { useState } from 'react';
import { ShieldAlert, PhoneCall, RefreshCw, Lock, AlertTriangle } from 'lucide-react';

interface BannedLockdownModalProps {
  hwid?: string;
  userName?: string;
  brandName?: string;
  reason?: string;
  onRefresh?: () => void;
}

export default function BannedLockdownModal({
  hwid = 'HWID-DETECTED',
  userName = 'Workstation User',
  brandName = 'Registered Business',
  reason = 'Account or Machine Access Suspended by Administrator',
  onRefresh,
}: BannedLockdownModalProps) {
  const [checking, setChecking] = useState(false);

  const handleWhatsAppContact = () => {
    const msg = encodeURIComponent(
      `Salam Ahmad / Omnora Labs,\n\nMy Noxis Hub access is restricted.\n\n• Machine HWID: ${hwid}\n• User Name: ${userName}\n• Brand / Business: ${brandName}\n\nPlease review and restore my access.`
    );
    window.open(`https://wa.me/923264742678?text=${msg}`, '_blank');
  };

  const handleRecheck = async () => {
    setChecking(true);
    if (onRefresh) {
      await onRefresh();
    } else {
      window.location.reload();
    }
    setTimeout(() => setChecking(false), 1500);
  };

  return (
    <div 
      className="fixed inset-0 z-[999999] bg-[#050608]/98 backdrop-blur-2xl flex items-center justify-center p-4 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="w-full max-w-xl bg-gradient-to-b from-[#180808] to-[#0d0404] border-2 border-red-500/40 rounded-2xl p-8 shadow-[0_0_80px_rgba(239,68,68,0.25)] text-center relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Big Alert Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-inner">
          <ShieldAlert className="w-10 h-10 animate-pulse text-red-500" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black tracking-wider text-white uppercase mb-2">
          Workstation Access Restricted
        </h2>
        <p className="text-sm text-red-300/90 font-medium mb-6">
          {reason}
        </p>

        {/* Machine & Brand Details Card */}
        <div className="bg-black/60 border border-red-500/20 rounded-xl p-4 text-left mb-6 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-bold uppercase tracking-wider">Business / Brand:</span>
            <span className="text-white font-semibold">{brandName}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-bold uppercase tracking-wider">Registered User:</span>
            <span className="text-zinc-300 font-medium">{userName}</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
            <span className="text-zinc-500 font-bold uppercase tracking-wider">Machine HWID:</span>
            <span className="text-red-400 font-mono text-[11px] truncate max-w-[260px] select-all font-semibold">
              {hwid}
            </span>
          </div>
        </div>

        <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
          This system has been locked by Omnora central administration. All ERP POS transactions, stock movements, and accounting functions are disabled on this device.
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleWhatsAppContact}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/50 cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            Contact Administrator
          </button>

          <button
            type="button"
            onClick={handleRecheck}
            disabled={checking}
            className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking Status...' : 'Check Status Again'}
          </button>
        </div>

        <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-6 font-mono">
          Noxis Sovereign Hub • Security Enforcement Subsystem
        </p>
      </div>
    </div>
  );
}

