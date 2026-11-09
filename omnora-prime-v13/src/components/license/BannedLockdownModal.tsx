'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, PhoneCall, RefreshCw, Lock, AlertTriangle, CreditCard, CheckCircle2 } from 'lucide-react';

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
  reason = 'You cannot use this software. Please pay for the license to continue.',
  onRefresh,
}: BannedLockdownModalProps) {
  const [checking, setChecking] = useState(false);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);

  // Prevent scroll and capture keyboard events (no escape or closing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = '';
    };
  }, []);

  const handleWhatsAppContact = () => {
    const msg = encodeURIComponent(
      `Salam Ahmad / Noxis Support,\n\nI want to pay for my license to unblock my software.\n\n• Machine HWID: ${hwid}\n• User / Business: ${brandName} (${userName})\n\nPlease provide payment details and restore my license.`
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
    setTimeout(() => setChecking(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-[999999] bg-[#050608]/98 backdrop-blur-2xl flex items-center justify-center p-4 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="w-full max-w-xl bg-gradient-to-b from-[#1c0808] to-[#0a0303] border-2 border-red-500/50 rounded-2xl p-7 shadow-[0_0_90px_rgba(239,68,68,0.35)] text-center relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-36 bg-red-500/25 rounded-full blur-3xl pointer-events-none" />

        {/* Big Alert Icon */}
        <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-red-500/15 border-2 border-red-500/40 flex items-center justify-center text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
          <ShieldAlert className="w-11 h-11 animate-pulse text-red-500" />
        </div>

        {/* Title */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 font-mono text-[11px] font-bold uppercase tracking-widest mb-3">
          <Lock className="w-3.5 h-3.5 text-red-400" /> License Suspended / Workstation Locked
        </div>

        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase mb-2">
          Access Restricted
        </h2>
        <p className="text-base text-red-200 font-bold mb-1">
          You cannot use this software. Please pay for the license to continue.
        </p>
        <p className="text-xs text-red-400/90 font-medium mb-5" dir="rtl">
          آپ کا سافٹ ویئر ایکسس معطل کر دیا گیا ہے۔ سافٹ ویئر چلانے کے لیے لائسنس کی فیس ادا کریں۔
        </p>

        {/* Machine & Brand Details Card */}
        <div className="bg-black/75 border border-red-500/25 rounded-xl p-4 text-left mb-5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 font-bold uppercase tracking-wider">Business / Brand:</span>
            <span className="text-white font-semibold truncate max-w-[260px]">{brandName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 font-bold uppercase tracking-wider">Registered Owner:</span>
            <span className="text-zinc-300 font-medium">{userName}</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
            <span className="text-zinc-500 font-bold uppercase tracking-wider">Machine HWID:</span>
            <span className="text-red-400 font-mono text-[11px] truncate max-w-[280px] select-all font-semibold">
              {hwid}
            </span>
          </div>
        </div>

        {/* Toggle Payment Info */}
        {showPaymentInfo ? (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 text-left mb-5 space-y-2 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-emerald-300 font-bold uppercase tracking-wider pb-1 border-b border-emerald-500/20">
              <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Official Payment Channels</span>
              <button 
                onClick={() => setShowPaymentInfo(false)}
                className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
              >
                Hide
              </button>
            </div>
            <div className="text-zinc-300 space-y-1">
              <div><strong className="text-white">Raast ID / JazzCash:</strong> <span className="font-mono text-emerald-400 font-bold select-all">03264742678</span></div>
              <div><strong className="text-white">Account Title:</strong> Ahmad Mahboob / Noxis Labs</div>
              <div><strong className="text-white">WhatsApp Proof:</strong> Send screenshot to +92 326 4742678 for instant unlocking.</div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowPaymentInfo(true)}
            className="text-xs text-zinc-400 hover:text-emerald-400 flex items-center justify-center gap-1.5 mx-auto mb-5 underline cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" /> View Bank / Raast Payment Account Details
          </button>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleWhatsAppContact}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/60 cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            Pay for License (WhatsApp)
          </button>

          <button
            type="button"
            onClick={handleRecheck}
            disabled={checking}
            className="w-full py-3.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/15 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Verifying with Server...' : 'I Have Paid (Check Status)'}
          </button>
        </div>

        <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-6 font-mono">
          Noxis Commercial ERP • Workstation Lockout Enforcement
        </p>
      </div>
    </div>
  );
}


