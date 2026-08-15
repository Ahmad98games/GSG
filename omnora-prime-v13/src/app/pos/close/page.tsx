"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  ArrowLeft, 
  Calculator, 
  AlertTriangle, 
  CheckCircle2, 
  Coins, 
  Receipt, 
  Undo2, 
  ShieldAlert 
} from 'lucide-react';
import { usePersona } from '@/hooks/usePersona';
import { Decimal } from 'decimal.js';
import { cn } from '@/lib/utils';
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { createClient } from "@/lib/supabase/client";

export default function CloseSessionPage() {
  const router = useRouter();
  const { t, fmt } = usePersona();
  const { profile } = useBusinessProfile();
  const supabase = createClient();

  // State for active session summary
  const [sessionData, setSessionData] = useState({
    id: null as string | null,
    openedAt: 'N/A',
    terminal: 'POS-01',
    operator: 'Admin',
    metrics: {
      sales: new Decimal(0),
      returns: new Decimal(0),
      taxes: new Decimal(0),
      discounts: new Decimal(0),
      expectedCash: new Decimal(0)
    },
    isLoading: true
  });

  React.useEffect(() => {
    if (!profile?.id) return;
    
    async function fetchSession() {
      setSessionData(prev => ({ ...prev, isLoading: true }));
      
      // 1. Get active session
      const { data: session } = await supabase
        .from('pos_sessions')
        .select('*')
        .eq('business_id', profile?.id)
        .eq('is_closed', false)
        .order('opened_at', { ascending: false })
        .limit(1)
        .single();

      if (session) {
        // 2. Get sales for this session
        const { data: sales } = await supabase
          .from('pos_sales')
          .select('*, pos_payments(*)')
          .eq('session_id', session.id);

        if (sales) {
          const metrics = sales.reduce((acc: any, s: any) => {
            const total = new Decimal(s.total || 0);
            const tax = new Decimal(s.tax_amount || 0);
            const disc = new Decimal(s.discount_amt || 0);
            
            // Check cash payments
            const cashPaid = s.pos_payments
              ? s.pos_payments
                  .filter((p: any) => p.mode === 'cash')
                  .reduce((sum: Decimal, p: any) => sum.plus(p.amount), new Decimal(0))
              : new Decimal(0);

            return {
              sales: acc.sales.plus(total),
              returns: acc.returns, // pos_sales doesn't have status='returned' in migration, maybe later
              taxes: acc.taxes.plus(tax),
              discounts: acc.discounts.plus(disc),
              expectedCash: acc.expectedCash.plus(cashPaid)
            };
          }, {
            sales: new Decimal(0),
            returns: new Decimal(0),
            taxes: new Decimal(0),
            discounts: new Decimal(0),
            expectedCash: new Decimal(session.opening_cash || 0)
          });

          setSessionData({
            id: session.id,
            openedAt: new Date(session.opened_at).toLocaleString(),
            terminal: 'POS-01', // Placeholder or from session record
            operator: 'Admin', // Should fetch from auth.users or profiles
            metrics,
            isLoading: false
          });
        }
      } else {
        setSessionData(prev => ({ ...prev, isLoading: false }));
      }
    }

    fetchSession();
  }, [profile?.id]);

  const [actualCash, setActualCash] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const variance = useMemo(() => {
    if (!actualCash) return new Decimal(0);
    try {
      return new Decimal(actualCash).minus(sessionData.metrics.expectedCash);
    } catch {
      return new Decimal(0);
    }
  }, [actualCash, sessionData.metrics.expectedCash]);

  const isDiscrepancy = variance.abs().gt(1); // Allow 1 unit rounding variance

  const handleEndSession = () => {
    setIsConfirming(true);
  };

  const finalizeSession = async () => {
    if (!sessionData.id) return;
    
    const { error } = await supabase
      .from('pos_sessions')
      .update({
        is_closed: true,
        closed_at: new Date().toISOString(),
        closing_cash: Number(actualCash),
        expected_cash: sessionData.metrics.expectedCash.toNumber(),
        total_sales: sessionData.metrics.sales.toNumber()
      })
      .eq('id', sessionData.id);

    if (!error) {
      router.push('/pos');
    }
  };

  if (sessionData.isLoading) {
    return (
      <div className="min-h-screen bg-[#121417] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-electric-blue/20 border-t-electric-blue animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121417] text-slate-200 selection:bg-electric-blue selection:text-onyx font-inter">
      {/* Top Bar */}
      <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
         <button onClick={() => router.push('/pos')} className="mr-4 p-2 hover:bg-white/5 transition-colors text-gray-500 hover:text-white">
            <ArrowLeft size={20} />
         </button>
         <h1 className="text-sm font-black text-white uppercase tracking-[0.3em]">{t('pos.reconciliation_center') || "Reconciliation Center"}</h1>
         
         <div className="ml-auto flex items-center space-x-6">
            <div className="flex flex-col items-end">
               <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Active Operator</span>
               <span className="text-[10px] font-bold text-white uppercase">{sessionData.operator}</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex items-center space-x-2 text-electric-blue">
               <Lock size={14} />
               <span className="text-[10px] font-black uppercase tracking-widest">Secure Terminal</span>
            </div>
         </div>
      </header>

      <main className="p-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-12 gap-12">
          
          {/* Left Column: Summary */}
          <div className="col-span-12 lg:col-span-7 space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Session Summary</h2>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Registers verification for {sessionData.terminal}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <SummaryCard 
                  label="Gross Sales" 
                  value={fmt(sessionData.metrics.sales)} 
                  icon={Receipt}
               />
               <SummaryCard 
                  label="Returns & Refunds" 
                  value={fmt(sessionData.metrics.returns)} 
                  icon={Undo2}
                  negative
               />
               <SummaryCard 
                  label="Tax Collections" 
                  value={fmt(sessionData.metrics.taxes)} 
                  icon={ShieldAlert}
               />
               <SummaryCard 
                  label="Total Discounts" 
                  value={fmt(sessionData.metrics.discounts)} 
                  icon={Coins}
                  negative
               />
            </div>

            <div className="bg-[#1A1D21] border border-white/5 p-8 space-y-6">
               <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Expected Registry Balance</span>
                  <span className="text-2xl font-mono text-white font-bold">{fmt(sessionData.metrics.expectedCash)}</span>
               </div>
               
               <div className="space-y-4">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Verification Notes</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe any significant discrepancies or operational issues..."
                    className="w-full bg-[#121417] border border-white/10 p-4 text-xs text-white min-h-[120px] focus:border-electric-blue outline-none transition-all placeholder:text-gray-700"
                  />
               </div>
            </div>
          </div>

          {/* Right Column: Reconciliation */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            <div className="bg-[#1A1D21] border border-white/5 p-8 space-y-8 sticky top-28">
               <div className="flex flex-col items-center text-center space-y-4">
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500",
                    isDiscrepancy ? "bg-critical-red/10 text-critical-red" : "bg-emerald-500/10 text-emerald-500"
                  )}>
                    {isDiscrepancy ? <AlertTriangle size={32} /> : <CheckCircle2 size={32} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Physical Count</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Input actual cash detected in drawer</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2 relative">
                     <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-xl">PKR</div>
                     <input 
                        type="number"
                        value={actualCash}
                        onChange={(e) => setActualCash(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#121417] border border-white/10 py-8 pl-20 pr-8 text-4xl font-mono text-white focus:border-electric-blue outline-none transition-all text-right"
                     />
                  </div>

                  <div className="p-6 bg-white/[0.02] border border-white/5 flex items-center justify-between">
                     <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Balance Variance</p>
                        <p className={cn(
                          "text-xl font-mono font-bold",
                          variance.isZero() ? "text-white" :
                          variance.isNegative() ? "text-critical-red" : "text-emerald-500"
                        )}>
                          {variance.isPositive() ? '+' : ''}{fmt(variance)}
                        </p>
                     </div>
                     <Calculator size={24} className="text-gray-700" />
                  </div>

                  <div className="pt-4">
                     <button 
                        onClick={handleEndSession}
                        disabled={!actualCash}
                        className="w-full py-6 bg-electric-blue text-onyx text-[11px] font-black uppercase tracking-[0.4em] hover:brightness-110 transition-all disabled:opacity-50 disabled:grayscale"
                     >
                        Finalize & Close Day
                     </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirming && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 z-[100] bg-onyx/90 backdrop-blur-xl flex items-center justify-center p-6"
            >
               <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                  className="max-w-md w-full bg-[#1A1D21] border border-white/10 p-10 text-center space-y-8"
               >
                  <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500">
                     <ShieldAlert size={40} />
                  </div>
                  
                  <div className="space-y-4">
                     <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Confirm Closure?</h2>
                     <p className="text-sm text-gray-400 font-medium">
                        You are about to finalize the daily registry. This action will post the reconciliation variance to the general ledger and is **immutable**.
                     </p>
                     {isDiscrepancy && (
                        <div className="p-4 bg-critical-red/10 border border-critical-red/20 text-critical-red text-[10px] font-black uppercase tracking-widest">
                           Critical: Variance of {fmt(variance)} will be logged.
                        </div>
                     )}
                  </div>

                  <div className="flex flex-col space-y-4">
                     <button 
                        onClick={finalizeSession}
                        className="w-full py-5 bg-white text-onyx text-[11px] font-black uppercase tracking-[0.3em] hover:bg-slate-200 transition-all"
                     >
                        Post & Authenticate
                     </button>
                     <button 
                        onClick={() => setIsConfirming(false)}
                        className="w-full py-5 text-gray-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                     >
                        Return to Reconciliation
                     </button>
                  </div>
               </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, negative = false }: { 
  label: string, 
  value: string, 
  icon: React.ElementType, 
  negative?: boolean 
}) {
  return (
    <div className="bg-[#1A1D21] border border-white/5 p-6 space-y-4">
       <div className="flex items-center justify-between">
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">{label}</span>
          <Icon size={14} className="text-gray-700" />
       </div>
       <p className={cn(
         "text-xl font-mono font-bold",
         negative ? "text-critical-red" : "text-white"
       )}>
          {negative ? '-' : ''}{value}
       </p>
    </div>
  );
}