'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowRightLeft, ShieldAlert, Search, User, Check, Plus,
  CreditCard, Calendar, FileText, Paperclip, AlertCircle, ArrowDownLeft, ArrowUpRight
} from 'lucide-react';
import { Decimal } from 'decimal.js';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { usePersona } from '@/hooks/usePersona';
import { AddPartyModal } from './AddPartyModal';

const transactionSchema = z.object({
  date: z.string().min(1, 'Date & time required'),
  description: z.string().min(1, 'Description / memo is required').max(250),
  party_id: z.string().optional(),
  type: z.enum(['money_in', 'money_out', 'receivable', 'payable']),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  payment_mode: z.enum(['Cash', 'Bank Transfer / Raast', 'Cheque', 'Online']).default('Cash'),
  reference_no: z.string().optional(),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface KhataEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  accounts: any[];
  parties: any[];
  editingEntry?: any;
}

export function KhataEntryModal({
  isOpen,
  onClose,
  onSuccess,
  accounts,
  parties: initialParties = [],
  editingEntry = null,
}: KhataEntryModalProps) {
  const { profile } = useBusinessProfile();
  const { businessId, fmt } = usePersona();
  const supabase = createClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddPartyOpen, setIsAddPartyOpen] = useState(false);
  const [partiesList, setPartiesList] = useState<any[]>(initialParties);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [partySearch, setPartySearch] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  useEffect(() => {
    setPartiesList(initialParties);
  }, [initialParties]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
      type: 'money_in',
      amount: 0,
      payment_mode: 'Cash',
      description: '',
      reference_no: '',
      notes: '',
    },
  });

  const watchType = watch('type');
  const watchAmount = watch('amount');
  const watchPaymentMode = watch('payment_mode');

  // Filter parties by search
  const filteredParties = useMemo(() => {
    if (!partySearch.trim()) return partiesList;
    return partiesList.filter(p =>
      p.name?.toLowerCase().includes(partySearch.toLowerCase()) ||
      p.phone?.includes(partySearch)
    );
  }, [partiesList, partySearch]);

  // Selected party live balance badge details
  const partyBalanceDetails = useMemo(() => {
    if (!selectedParty) return null;
    const bal = Number(selectedParty.current_balance || 0);
    const creditLimit = Number(selectedParty.credit_limit || 100000);
    const isReceivable = bal >= 0;
    const absBal = Math.abs(bal);
    const isExceeded = absBal > creditLimit;

    return {
      balanceText: isReceivable
        ? `PKR ${absBal.toLocaleString()} (Jama / Receivable)`
        : `PKR ${absBal.toLocaleString()} (Naam / Payable)`,
      isReceivable,
      isExceeded,
      status: isExceeded ? 'Credit Exceeded!' : bal === 0 ? 'Clear' : 'Active',
    };
  }, [selectedParty]);

  if (!isOpen) return null;

  const onSubmit = async (values: TransactionFormValues) => {
    setIsSubmitting(true);
    try {
      const txRef = editingEntry?.tx_ref || `TX-${Date.now().toString(36).toUpperCase()}`;
      const amount = Number(values.amount);

      let debitAccCode = '1001'; // Cash in hand
      let creditAccCode = '4001'; // Sales revenue

      if (values.type === 'money_in') {
        debitAccCode = values.payment_mode === 'Cash' ? '1001' : '1002'; // Cash or Bank
        creditAccCode = '1100'; // Accounts Receivable
      } else if (values.type === 'money_out') {
        debitAccCode = '2001'; // Accounts Payable
        creditAccCode = values.payment_mode === 'Cash' ? '1001' : '1002';
      } else if (values.type === 'receivable') {
        debitAccCode = '1100'; // AR
        creditAccCode = '4001'; // Sales Revenue
      } else if (values.type === 'payable') {
        debitAccCode = '5800'; // Expense
        creditAccCode = '2001'; // AP
      }

      const debitAcc = accounts.find(a => a.account_code === debitAccCode) || accounts[0];
      const creditAcc = accounts.find(a => a.account_code === creditAccCode) || accounts[1];

      // Prepare double-entry ledger rows
      const debitEntry = {
        business_id: profile?.id || businessId,
        tx_ref: txRef,
        entry_type: 'debit',
        account_id: debitAcc?.id || accounts[0]?.id,
        party_id: selectedParty?.id || null,
        amount: amount,
        description: `${values.description} [${values.payment_mode}${values.reference_no ? ' Ref:' + values.reference_no : ''}]`,
        posted_at: new Date(values.date).toISOString(),
        status: 'posted',
      };

      const creditEntry = {
        business_id: profile?.id || businessId,
        tx_ref: txRef,
        entry_type: 'credit',
        account_id: creditAcc?.id || accounts[1]?.id,
        party_id: selectedParty?.id || null,
        amount: amount,
        description: `${values.description} [${values.payment_mode}${values.reference_no ? ' Ref:' + values.reference_no : ''}]`,
        posted_at: new Date(values.date).toISOString(),
        status: 'posted',
      };

      // Insert ledger entries
      const { error: ledgerErr } = await supabase
        .from('ledger_entries')
        .insert([debitEntry, creditEntry]);

      if (ledgerErr) throw ledgerErr;

      // Update party current_balance
      if (selectedParty) {
        let delta = 0;
        if (values.type === 'money_in') delta = -amount; // customer paid us -> receivable decreases
        else if (values.type === 'money_out') delta = amount; // we paid supplier -> payable decreases
        else if (values.type === 'receivable') delta = amount; // udhaar added -> receivable increases
        else if (values.type === 'payable') delta = -amount; // bill added -> payable increases

        const newBal = Number(selectedParty.current_balance || 0) + delta;
        await supabase
          .from('parties')
          .update({ current_balance: newBal })
          .eq('id', selectedParty.id);
      }

      reset();
      onSuccess(`Transaction ${txRef} posted successfully!`);
      onClose();
    } catch (err: any) {
      alert(`Error posting entry: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="max-w-2xl w-full bg-[#0B0F17] border border-[#08EBF6]/30 rounded-2xl shadow-[0_0_50px_rgba(8,235,246,0.15)] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 bg-[#030712] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-[#08EBF6]/10 text-[#08EBF6]">
                <ArrowRightLeft size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  {editingEntry ? 'Edit Khata Transaction' : 'Post Dual-Entry Khata Transaction'}
                </h3>
                <p className="text-xs text-slate-400 font-medium">100% Local-First Ledger & Udhaar Book</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            {/* 1. Transaction Type Segmented Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Transaction Type *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  ['money_in', 'Money In (Vasooli)', 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'],
                  ['money_out', 'Money Out (Adayagi)', 'bg-red-500/20 text-red-400 border-red-500/40'],
                  ['receivable', 'Receivable (Udhaar)', 'bg-amber-500/20 text-amber-400 border-amber-500/40'],
                  ['payable', 'Payable (Bill/Expense)', 'bg-purple-500/20 text-purple-400 border-purple-500/40'],
                ].map(([val, label, activeStyle]) => {
                  const active = watchType === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setValue('type', val as any)}
                      className={`p-3 rounded-xl border text-xs font-black uppercase tracking-tight transition-all cursor-pointer ${
                        active ? activeStyle : 'bg-[#030712] border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Linked Party Search & Live Balance Badge */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Linked Party Account</label>
                <button
                  type="button"
                  onClick={() => setIsAddPartyOpen(true)}
                  className="text-[10px] font-black text-[#08EBF6] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} /> + Add New Party
                </button>
              </div>

              <div className="relative">
                <div
                  onClick={() => setShowPartyDropdown(!showPartyDropdown)}
                  className="w-full bg-[#030712] border border-white/15 p-3 rounded-xl flex items-center justify-between text-xs cursor-pointer hover:border-[#08EBF6]/50"
                >
                  <span className={selectedParty ? 'text-white font-bold' : 'text-slate-500'}>
                    {selectedParty ? `${selectedParty.name} (${selectedParty.phone || 'No Phone'})` : 'Select Linked Party...'}
                  </span>
                  <User size={16} className="text-[#08EBF6]" />
                </div>

                {showPartyDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-[#0B0F17] border border-[#08EBF6]/40 rounded-xl p-2 shadow-2xl space-y-2 max-h-56 overflow-y-auto">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={partySearch}
                        onChange={e => setPartySearch(e.target.value)}
                        placeholder="Search party by name or phone..."
                        className="w-full bg-[#030712] border border-white/15 p-2 pl-9 text-xs text-white rounded-lg outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <div
                        onClick={() => { setSelectedParty(null); setValue('party_id', ''); setShowPartyDropdown(false); }}
                        className="p-2 hover:bg-white/5 rounded-lg text-xs font-bold text-slate-400 cursor-pointer"
                      >
                        None (General Cash Account)
                      </div>
                      {filteredParties.map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedParty(p);
                            setValue('party_id', p.id);
                            setShowPartyDropdown(false);
                          }}
                          className="p-2 hover:bg-[#08EBF6]/10 rounded-lg text-xs flex items-center justify-between cursor-pointer"
                        >
                          <span className="font-bold text-white">{p.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            PKR {Math.abs(p.current_balance || 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Party Live Balance Badge */}
              {partyBalanceDetails && (
                <div className="p-3 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Party Net Balance</span>
                    <span className={`font-black ${partyBalanceDetails.isReceivable ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {partyBalanceDetails.balanceText}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    partyBalanceDetails.isExceeded ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {partyBalanceDetails.status}
                  </span>
                </div>
              )}
            </div>

            {/* 3. Big Amount Input & Date Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Transaction Amount (PKR) *</label>
                <input
                  type="number"
                  step="any"
                  {...register('amount')}
                  placeholder="e.g. 50000"
                  className="w-full bg-[#030712] border border-[#08EBF6]/40 p-3 text-lg font-black font-mono text-[#08EBF6] rounded-xl outline-none focus:shadow-[0_0_15px_rgba(8,235,246,0.3)]"
                />
                {errors.amount && <p className="text-[9px] text-red-400 font-bold">{errors.amount.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Date & Time *</label>
                <input
                  type="datetime-local"
                  {...register('date')}
                  className="w-full bg-[#030712] border border-white/15 p-3 text-xs text-white rounded-xl outline-none focus:border-[#08EBF6]"
                />
              </div>
            </div>

            {/* 4. Payment Mode & Conditional Cheque / Ref No */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Payment Mode</label>
                <select
                  {...register('payment_mode')}
                  className="w-full bg-[#030712] border border-white/15 p-3 text-xs text-white rounded-xl outline-none focus:border-[#08EBF6]"
                >
                  <option value="Cash">Cash in Hand</option>
                  <option value="Bank Transfer / Raast">Bank Transfer / Raast</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online">Online Gateway</option>
                </select>
              </div>

              {watchPaymentMode !== 'Cash' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cheque / Reference No</label>
                  <input
                    type="text"
                    {...register('reference_no')}
                    placeholder="e.g. CHQ-98231 / RAAST-102938"
                    className="w-full bg-[#030712] border border-white/15 p-3 text-xs text-white rounded-xl outline-none focus:border-[#08EBF6]"
                  />
                </div>
              )}
            </div>

            {/* 5. Description Memo */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Transaction Details / Memo *</label>
              <textarea
                rows={2}
                {...register('description')}
                placeholder="e.g. Purana khata payment received, Bill #102 against 500 suits delivery"
                className="w-full bg-[#030712] border border-white/15 p-3 text-xs text-white rounded-xl outline-none focus:border-[#08EBF6]"
              />
              {errors.description && <p className="text-[9px] text-red-400 font-bold">{errors.description.message}</p>}
            </div>

            {/* Submit Action */}
            <div className="pt-3 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3.5 bg-white/5 border border-white/10 text-xs font-bold text-slate-300 rounded-xl hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 py-3.5 bg-gradient-to-r from-[#08EBF6] via-[#FFFFFF] to-[#5FA5FA] text-black font-black uppercase tracking-widest text-xs rounded-xl shadow-[0_0_25px_rgba(8,235,246,0.35)] hover:brightness-110 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Posting Ledger Entry...' : 'Post Khata Transaction'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      <AddPartyModal
        isOpen={isAddPartyOpen}
        onClose={() => setIsAddPartyOpen(false)}
        onSuccess={newParty => {
          setPartiesList(prev => [...prev, newParty]);
          setSelectedParty(newParty);
          setValue('party_id', newParty.id);
        }}
      />
    </>
  );
}
