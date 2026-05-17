// src/components/portal/PortalPaymentModal.tsx
"use client";

import React, { useState } from "react";
import { 
  X, CreditCard, Smartphone, Building2, 
  CheckCircle2, Loader2, ArrowRight, ShieldCheck, Phone
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface PortalPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  customer: any;
  businessSlug: string;
  onSuccess: () => void;
}

export default function PortalPaymentModal({ 
  isOpen, onClose, invoice, customer, businessSlug, onSuccess 
}: PortalPaymentModalProps) {
  const supabase = createClient();
  const [method, setMethod] =  useState <'jazzcash' | 'easypaisa' | 'bank' | 'card'>('jazzcash');
  const [phone, setPhone] =  useState ("");
  const [isProcessing, setIsProcessing] =  useState (false);
  const [isSuccess, setIsSuccess] =  useState (false);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // 1. Record initiation in portal_payments
      const { data: paymentRecord, error: pError } = await supabase
        .from("portal_payments")
        .insert({
          invoice_id: invoice.id,
          customer_id: customer.customerId,
          gateway: method,
          amount: invoice.balance_due,
          currency: 'PKR',
          status: 'pending'
        })
        .select()
        .single();

      if (pError) throw pError;

      // 2. Call Gateway API (Simulated for this demo phase)
      // In production, invoke the gateway initiate function
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Update status (Simulated success)
      await supabase
        .from("portal_payments")
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString(),
          gateway_txn_id: `PTL-${Date.now()}` 
        })
        .eq("id", paymentRecord.id);

      // 4. Record the financial transaction (DEBIT Receivable, CREDIT Cash)
      // This would normally be an Edge Function 'post-transaction'
      
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 3000);

    } catch (err: any) {
      alert("Payment failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-onyx/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface border border-white/10 w-full max-w-lg rounded-sm shadow-2xl relative overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
           <div>
              <h2 className="text-xl font-bold text-white tracking-tighter">Settlement Secure</h2>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Inv: {invoice.invoice_no}</p>
           </div>
           <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
              <X size={20} />
           </button>
        </div>

        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-12 text-center space-y-6"
            >
               <div className="w-20 h-20 bg-emerald/10 rounded-full flex items-center justify-center mx-auto border border-emerald/20">
                  <CheckCircle2 size={40} className="text-emerald" />
               </div>
               <div>
                  <h3 className="text-2xl font-bold text-white tracking-tighter">Transaction Complete</h3>
                  <p className="text-sm text-gray-500 mt-2">Your payment has been processed and your statement updated.</p>
               </div>
               <p className="text-[9px] text-gray-600 font-mono">Confirmation sent via WhatsApp link.</p>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-8">
               {/* Summary */}
               <div className="bg-onyx/50 p-6 rounded-sm border border-white/5 space-y-4">
                  <div className="flex justify-between items-baseline">
                     <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Outstanding Due</span>
                     <span className="text-2xl font-bold text-white font-mono">Rs. {invoice.balance_due.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-600 uppercase font-black">
                     <span>Account Holder</span>
                     <span>{customer.name}</span>
                  </div>
               </div>

               {/* Methods */}
               <div className="space-y-4">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Select Gateway</label>
                  <div className="grid grid-cols-2 gap-4">
                     <MethodButton active={method === 'jazzcash'} icon={Smartphone} label="JazzCash" onClick={() => setMethod('jazzcash')} />
                     <MethodButton active={method === 'easypaisa'} icon={Smartphone} label="EasyPaisa" onClick={() => setMethod('easypaisa')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <MethodButton active={method === 'bank'} icon={Building2} label="Bank Transfer" onClick={() => setMethod('bank')} />
                     <MethodButton active={method === 'card'} icon={CreditCard} label="Credit Card" onClick={() => setMethod('card')} />
                  </div>
               </div>

               {/* Interaction Area */}
               {(method === 'jazzcash' || method === 'easypaisa') && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center">
                       <Phone size={12} className="mr-2" /> Wallet Phone Number
                    </label>
                    <input 
                      placeholder="03XXXXXXXXX"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-onyx border border-white/10 p-4 text-sm text-white focus:border-electric-blue outline-none transition-all font-mono"
                    />
                    <p className="text-[9px] text-gray-600 italic">You will receive a prompt on your phone.</p>
                 </motion.div>
               )}

               <button 
                 onClick={handlePayment}
                 disabled={isProcessing}
                 className="w-full bg-electric-blue text-onyx py-5 font-bold uppercase tracking-widest text-[11px] flex items-center justify-center rounded-sm transition-all hover:brightness-110 disabled:opacity-50"
               >
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : (
                    <>Authorize Payment <ArrowRight size={16} className="ml-2" /></>
                  )}
               </button>

               <div className="flex items-center justify-center space-x-2 text-[9px] text-gray-600 uppercase font-black tracking-widest pt-4">
                  <ShieldCheck size={12} />
                  <span>Encrypted by NOXIS Sentinel AI</span>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

interface MethodButtonProps {
  active: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

function MethodButton({ active, icon: Icon, label, onClick }: MethodButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`p-5 border flex items-center space-x-3 transition-all rounded-sm text-left ${
        active ? 'border-electric-blue bg-white/5 text-white' : 'border-white/10 text-gray-600 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="text-[9px] font-bold uppercase tracking-widest leading-tight">{label}</span>
    </button>
  );
}

