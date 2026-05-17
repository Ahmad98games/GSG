"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { 
  X, Banknote, Landmark, CreditCard, 
  Plus, Trash2, CheckCircle2, Calculator 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { IndustrialMath } from "@/lib/finance/IndustrialMath";

const paymentSchema = z.object({
  payment_date: z.string(),
  splits: z.array(z.object({
    mode: z.enum(['cash','bank_transfer','cheque','digital_wallet']),
    amount: z.coerce.number().positive(),
    reference: z.string().optional(),
  })).min(1),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentModalProps {
  invoiceId: string;
  partyId: string;
  balanceDue: number;
  currency?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ invoiceId, partyId, balanceDue, currency = "PKR", onClose, onSuccess }: PaymentModalProps) {
  const [isSubmitting, setIsSubmitting] =  useState (false);
  const supabase = createClient();

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema) as any,
    defaultValues: {
      payment_date: new Date().toISOString().split('T')[0],
      splits: [{ mode: 'cash', amount: balanceDue }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "splits" });
  const watchSplits = watch("splits");
  const totalPaid = watchSplits.reduce((acc: number, s: any) => acc + (Number(s.amount) || 0), 0);
  const remainingAfter = IndustrialMath.subtract(balanceDue, totalPaid);

  const onSubmit = async (values: PaymentFormValues) => {
    setIsSubmitting(true);
    try {
      // 1. Create Payment Record
      const { data: payment, error: payError } = await supabase
        .from('payments')
        .insert({
          business_id: (await supabase.auth.getUser()).data.user?.id, // Should be business_id from profile
          invoice_id: invoiceId,
          party_id: partyId,
          total_amount: totalPaid,
          payment_date: values.payment_date,
          notes: values.notes
        })
        .select()
        .single();

      if (payError) throw payError;

      // 2. Create Payment Splits
      await supabase.from('payment_splits').insert(
        values.splits.map(s => ({
          payment_id: payment.id,
          mode: s.mode,
          amount: s.amount,
          reference: s.reference
        }))
      );

      // 3. Post to Ledger
      // Group by account (Cash or Bank)
      const { data: receivableAcc } = await supabase.from('accounts').select('id').eq('account_code', 'ACREC').single();
      const { data: cashAcc } = await supabase.from('accounts').select('id').eq('account_code', 'CASH').single();
      
      if (receivableAcc && cashAcc) {
        await supabase.functions.invoke('post-transaction', {
          body: {
            txRef: `PAY-${payment.id.slice(0,8)}`,
            entries: [
              { entry_type: 'debit', account_id: cashAcc.id, amount: totalPaid, description: `Payment received for Invoice #${invoiceId}` },
              { entry_type: 'credit', account_id: receivableAcc.id, party_id: partyId, amount: totalPaid, description: `Payment against Invoice #${invoiceId}` }
            ]
          }
        });
      }

      // 4. Update Invoice Status
      const newPaidAmount = (await supabase.from('invoices').select('paid_amount').eq('id', invoiceId).single()).data?.paid_amount + totalPaid;
      const { error: invError } = await supabase
        .from('invoices')
        .update({ 
          paid_amount: newPaidAmount,
          status: newPaidAmount >= balanceDue ? 'paid' : 'partially_paid'
        })
        .eq('id', invoiceId);

      if (invError) throw invError;

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Payment reconciliation failed. Ledger state remains unchanged.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-onyx/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-surface border border-white/10 w-full max-w-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-onyx/50">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-emerald/10 text-emerald">
                <Calculator size={18} />
             </div>
             <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Reconcile Payment</h2>
                <p className="text-[10px] text-gray-500 font-mono tracking-tighter">System Ref: {invoiceId}</p>
             </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
           {/* Summary Banner */}
           <div className="flex items-center justify-between p-6 bg-onyx border border-white/5">
              <div className="space-y-1">
                 <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Outstanding Balance</span>
                 <div className="text-2xl font-bold text-white font-mono flex items-baseline">
                    <span className="text-xs text-sandstone-gold mr-2">{currency}</span>
                    {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                 </div>
              </div>
              <div className="text-right space-y-1">
                 <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Remaining After</span>
                 <div className={cn(
                   "text-2xl font-bold font-mono flex items-baseline justify-end",
                   remainingAfter <= 0 ? "text-emerald" : "text-sandstone-gold"
                 )}>
                    {remainingAfter.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                 </div>
              </div>
           </div>

           <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                 <div className="flex items-center justify-between text-[10px] uppercase text-gray-500 font-bold tracking-widest pb-2 border-b border-white/5">
                    <span className="w-40">Payment Mode</span>
                    <span className="flex-1">Reference / Cheque #</span>
                    <span className="w-32 text-right">Amount</span>
                    <span className="w-10"></span>
                 </div>

                 {fields.map((field: any, index: number) => (
                    <div key={field.id} className="flex items-center gap-4">
                       <select {...register(`splits.${index}.mode`)} className="w-40 industrial-input">
                          <option value="cash">Cash</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="cheque">Cheque</option>
                          <option value="digital_wallet">Digital Wallet</option>
                       </select>
                       <input 
                        {...register(`splits.${index}.reference`)} 
                        className="flex-1 industrial-input" 
                        placeholder="Reference #" 
                       />
                       <input 
                        type="number" 
                        {...register(`splits.${index}.amount`)} 
                        className="w-32 industrial-input text-right font-mono" 
                       />
                       <button onClick={() => remove(index)} className="w-10 text-gray-700 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                       </button>
                    </div>
                 ))}

                 <button 
                  type="button"
                  onClick={() => append({ mode: 'cash', amount: remainingAfter > 0 ? remainingAfter : 0 })}
                  className="flex items-center space-x-2 text-[10px] uppercase font-bold text-emerald hover:text-emerald-400 transition-colors"
                 >
                    <Plus size={14} />
                    <span>Add Payment Split</span>
                 </button>
              </div>

              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                 <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Total Transaction Value</span>
                    <span className="text-[11px] font-mono text-white">{currency} {totalPaid.toLocaleString()}</span>
                 </div>
                 <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-emerald hover:bg-emerald-600 text-onyx font-bold uppercase tracking-widest text-[11px] transition-all flex items-center space-x-2"
                 >
                    {isSubmitting ? "Processing Transaction..." : "Commit Payment to Ledger"}
                    {!isSubmitting && <CheckCircle2 size={14} />}
                 </button>
              </div>
           </form>
        </div>
      </motion.div>

      <style jsx global>{`
        .industrial-input {
          width: 100%;
          background: #121417;
          border: 1px solid #2D3139;
          padding: 0.75rem 1rem;
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

