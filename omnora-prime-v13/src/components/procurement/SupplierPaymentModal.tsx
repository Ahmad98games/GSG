"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Loader2, Save, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  poId: string;
  partyId: string;
  poTotal: number;
  paidSoFar: number;
}

export default function SupplierPaymentModal({ isOpen, onClose, poId, partyId, poTotal, paidSoFar }: Props) {
  const { businessId, fmt } = usePersona();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const remaining = poTotal - paidSoFar;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const amt = Number(amount);
      if (!amt || amt <= 0) throw new Error("Enter a valid amount");

      // 1. Fetch system accounts Cash (1001) and Accounts Payable (2001)
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id, account_code')
        .eq('business_id', businessId)
        .in('account_code', ['1001', '2001']);

      if (accountsError) throw accountsError;
      
      const cashAccount = accounts?.find((a: any) => a.account_code === '1001');
      const apAccount = accounts?.find((a: any) => a.account_code === '2001');

      if (!cashAccount || !apAccount) {
        throw new Error("Core system accounts Cash (1001) and Accounts Payable (2001) are missing in Chart of Accounts.");
      }

      // 2. Insert Supplier Payment
      const { data: payment, error: pError } = await supabase
        .from('supplier_payments')
        .insert({
          business_id: businessId,
          party_id: partyId,
          po_id: poId,
          amount: amt,
          payment_method: method,
          payment_date: paymentDate,
          reference: reference || null,
          notes: notes || null,
        })
        .select()
        .single();

      if (pError) throw pError;

      // 3. Insert balanced double-entry
      const tx_ref = `SUPPAY-${payment.id}`;
      const description = `Record Supplier Payment (${method})`;
      const ledgerRows = [
        {
          business_id: businessId,
          tx_ref,
          account_id: apAccount.id,
          party_id: partyId,
          amount: amt,
          entry_type: 'debit',
          description,
          posted_at: new Date(paymentDate).toISOString(),
          status: 'posted'
        },
        {
          business_id: businessId,
          tx_ref,
          account_id: cashAccount.id,
          party_id: null,
          amount: amt,
          entry_type: 'credit',
          description,
          posted_at: new Date(paymentDate).toISOString(),
          status: 'posted'
        }
      ];

      const { error: ledgerError } = await supabase
        .from('ledger_entries')
        .insert(ledgerRows);

      if (ledgerError) throw ledgerError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier_payments'] });
      queryClient.invalidateQueries({ queryKey: ['purchase_order'] });
      onClose();
      setAmount(""); setReference(""); setNotes("");
    },
    onError: (err: any) => alert(err.message),
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={onClose}>
          <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()} className="bg-[#1A1D21] border border-white/10 p-8 max-w-md w-full space-y-6 rounded-lg shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-500/10 flex items-center justify-center rounded-sm"><DollarSign size={20} className="text-emerald-500" /></div>
                <div><h2 className="text-lg font-bold text-white">Record Payment</h2><p className="text-[10px] text-gray-500 uppercase tracking-widest">Supplier Payment Entry</p></div>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
            </div>

            {/* Balance Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/5 p-3 rounded-sm text-center">
                <p className="text-[9px] uppercase font-black text-gray-600 tracking-widest">PO Total</p>
                <p className="text-sm font-mono font-bold text-white mt-1">{fmt(poTotal)}</p>
              </div>
              <div className="bg-white/5 border border-white/5 p-3 rounded-sm text-center">
                <p className="text-[9px] uppercase font-black text-gray-600 tracking-widest">Remaining</p>
                <p className="text-sm font-mono font-bold text-red-400 mt-1">{fmt(remaining)}</p>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Amount *</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-lg font-mono font-bold focus:outline-none focus:border-emerald-500/50 text-center" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Method</label>
                  <select value={method} onChange={e => setMethod(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 appearance-none text-white [&>option]:bg-[#1A1D21]">
                    <option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option><option value="cheque">Cheque</option><option value="online">Online</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Date</label>
                  <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Reference #</label>
                <input value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. CHQ-12345" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 resize-none" />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !amount} className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-500 text-black font-bold text-sm rounded-sm hover:brightness-110 disabled:opacity-50 shadow-lg shadow-emerald-500/10">
                {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}<span>{saveMutation.isPending ? 'Recording...' : 'Record Payment'}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
