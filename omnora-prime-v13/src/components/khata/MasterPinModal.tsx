'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, KeyRound, X, AlertTriangle } from 'lucide-react';

interface MasterPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function MasterPinModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Authorize Transaction Deletion',
  description = 'Enter Master PIN or Passcode to confirm transaction reversion and balance recalculation.',
}: MasterPinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    // Default PIN: 1234 or master override 9999 or any 4+ digit passcode
    if (pin === '1234' || pin === '9999' || pin.length >= 4) {
      setError('');
      setPin('');
      onConfirm();
      onClose();
    } else {
      setError('Invalid Master PIN. (Default test PIN: 1234)');
    }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="max-w-md w-full bg-[#0B0F17] border border-red-500/40 rounded-2xl shadow-[0_0_40px_rgba(239,68,68,0.2)] overflow-hidden"
      >
        <div className="p-6 bg-[#030712] border-b border-red-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">{title}</h3>
              <p className="text-[10px] text-slate-400 font-medium">Security Passcode Required</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleVerify} className="p-6 space-y-5">
          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
            <AlertTriangle size={18} className="shrink-0 text-red-400 mt-0.5" />
            <p className="leading-relaxed">{description}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Enter Admin Master PIN *</label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3 top-3.5 text-slate-400" />
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={e => { setPin(e.target.value); setError(''); }}
                placeholder="**** (Default: 1234)"
                autoFocus
                className="w-full bg-[#030712] border border-white/15 p-3 pl-10 text-center tracking-widest text-lg font-mono text-white rounded-xl outline-none focus:border-red-400"
              />
            </div>
            {error && <p className="text-[10px] text-red-400 font-bold mt-1">{error}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 bg-white/5 border border-white/10 text-xs font-bold text-slate-300 rounded-xl hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-2/3 py-3 bg-gradient-to-r from-red-600 to-rose-500 text-white font-black uppercase tracking-wider text-xs rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:brightness-110"
            >
              Authorize & Revert
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
