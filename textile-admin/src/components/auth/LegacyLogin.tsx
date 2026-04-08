import React, { useState } from 'react';
import { Shield, Zap, Lock, ArrowRight, Terminal } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

interface Props {
  onSuccess: (user: User | null) => void;
}

export const LegacyLogin: React.FC<Props> = ({ onSuccess }) => {
  const [email, setEmail] = useState('pakahmad9815@gmail.com');
  const [password, setPassword] = useState('98158302384');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;
      onSuccess(data.user);
    } catch (err: unknown) {
      console.error('Login Error:', err);
      setError('PROTOCOL_REJECTED: BAD_CREDENTIALS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-[#000000] flex items-center justify-center font-mono-vault selection:bg-[#D4AF37]/30">
      {/* Encryption Matrix BG */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:16px_16px]" />
      
      <div className="w-full max-w-md p-8 relative animate-in zoom-in-95 duration-700">
        {/* Tactical Frame */}
        <div className="absolute -top-4 -left-4 w-12 h-12 border-t-2 border-l-2 border-[#D4AF37]/40" />
        <div className="absolute -top-4 -right-4 w-12 h-12 border-t-2 border-r-2 border-[#D4AF37]/40" />
        <div className="absolute -bottom-4 -left-4 w-12 h-12 border-b-2 border-l-2 border-[#D4AF37]/40" />
        <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b-2 border-r-2 border-[#D4AF37]/40" />

        <div className="space-y-8">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 bg-zinc-900 border border-[#D4AF37]/20 flex items-center justify-center rounded-sm">
              <Shield className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-black text-white italic tracking-[0.3em] uppercase">Gold She ERP</h1>
              <p className="text-[9px] text-[#D4AF37] font-black uppercase tracking-[0.4em] opacity-80">Industrial Security Core v7.0</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">Target Identity</label>
                <div className="relative">
                  <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-700" />
                  <input 
                    type="email" required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#09090b] border border-zinc-900 focus:border-[#D4AF37] p-4 pl-11 text-[11px] text-white outline-none transition-all placeholder:text-zinc-800 font-bold"
                    placeholder="admin@goldshe.secure"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">Access Protocol</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-700" />
                  <input 
                    type="password" required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#09090b] border border-zinc-900 focus:border-[#D4AF37] p-4 pl-11 text-[11px] text-white outline-none transition-all placeholder:text-zinc-800"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 p-3 flex items-center gap-3 animate-in fade-in duration-300">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">{error}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#D4AF37] hover:bg-[#C5A028] text-zinc-950 flex items-center justify-center gap-3 group transition-all"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.25em]">Initialize Session</span>
              {loading ? (
                <Zap className="w-4 h-4 animate-spin text-zinc-950" />
              ) : (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>

          <div className="pt-4 flex items-center justify-between border-t border-zinc-900">
            <span className="text-[8px] text-zinc-700 uppercase font-black tracking-widest">Node: SECURE_ROOT_01</span>
            <span className="text-[8px] text-zinc-700 uppercase font-black tracking-widest italic">Auth Mode: Legacy_Over_Pulse</span>
          </div>
        </div>
      </div>
    </div>
  );
};
