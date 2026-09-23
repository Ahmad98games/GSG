'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  X, ArrowRightLeft, Search, User, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
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
  preselectedPartyId?: string | null;
}

export function KhataEntryModal({
  isOpen,
  onClose,
  onSuccess,
  accounts,
  parties: initialParties = [],
  editingEntry = null,
  preselectedPartyId = null,
}: KhataEntryModalProps) {
  const { businessId } = usePersona();
  const supabase = createClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddPartyOpen, setIsAddPartyOpen] = useState(false);
  const [partiesList, setPartiesList] = useState<any[]>(initialParties);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [partySearch, setPartySearch] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);

  useEffect(() => {
    setPartiesList(initialParties);
  }, [initialParties]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 16),
      description: '',
      type: 'money_in',
      amount: '' as any,
      payment_mode: 'Cash',
      reference_no: '',
    },
  });

  const watchType = watch('type');
  const watchPaymentMode = watch('payment_mode');

  useEffect(() => {
    if (editingEntry) {
      setValue('date', editingEntry.date ? new Date(editingEntry.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
      setValue('description', editingEntry.description || '');
      setValue('amount', editingEntry.debitAmount || editingEntry.creditAmount || 0);
      setValue('type', editingEntry.debitAmount > 0 ? 'money_in' : 'money_out');
      if (editingEntry.party_id) {
        const found = partiesList.find(p => p.id === editingEntry.party_id);
        setSelectedParty(found || null);
        setValue('party_id', editingEntry.party_id);
      }
    } else if (preselectedPartyId) {
      const found = partiesList.find(p => p.id === preselectedPartyId);
      if (found) {
        setSelectedParty(found);
        setValue('party_id', found.id);
      }
    }
  }, [editingEntry, preselectedPartyId, partiesList, setValue]);

  const filteredParties = useMemo(() => {
    if (!partySearch) return partiesList;
    const q = partySearch.toLowerCase();
    return partiesList.filter(p =>
      p.name?.toLowerCase().includes(q) || p.phone?.includes(q)
    );
  }, [partiesList, partySearch]);

  const partyBalanceDetails = useMemo(() => {
    if (!selectedParty) return null;
    const bal = Number(selectedParty.current_balance || 0);
    const limit = Number(selectedParty.credit_limit || 0);
    const isReceivable = bal >= 0;
    const isExceeded = limit > 0 && Math.abs(bal) > limit;

    return {
      bal,
      isReceivable,
      isExceeded,
      balanceText: `PKR ${Math.abs(bal).toLocaleString()} ${isReceivable ? '(Lena Hai)' : '(Dena Hai)'}`,
      status: isExceeded ? 'Credit Limit Breached' : 'Good Standing',
    };
  }, [selectedParty]);

  if (!isOpen) return null;

  const onSubmit = async (values: TransactionFormValues) => {
    setIsSubmitting(true);
    try {
      const bizId = businessId || 'default-biz';
      const txRef = editingEntry?.tx_ref || `TX-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
      const amount = Number(values.amount);

      let defaultDebitAccId = accounts.find(a => a.type === 'asset' || a.account_code === '1001')?.id;
      let defaultCreditAccId = accounts.find(a => a.type === 'revenue' || a.account_code === '4001')?.id;

      if (values.type === 'money_out') {
        defaultDebitAccId = accounts.find(a => a.type === 'expense' || a.account_code === '5001')?.id || defaultDebitAccId;
        defaultCreditAccId = accounts.find(a => a.type === 'asset' || a.account_code === '1001')?.id || defaultCreditAccId;
      }

      if (!defaultDebitAccId && accounts.length > 0) defaultDebitAccId = accounts[0].id;
      if (!defaultCreditAccId && accounts.length > 1) defaultCreditAccId = accounts[1].id;
      if (!defaultDebitAccId) defaultDebitAccId = 'acc-default-cash';
      if (!defaultCreditAccId) defaultCreditAccId = 'acc-default-sales';

      const debitAcc = accounts.find(a => a.id === defaultDebitAccId);
      const creditAcc = accounts.find(a => a.id === defaultCreditAccId);

      const debitEntry = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `entry-d-${Date.now()}`,
        business_id: bizId,
        tx_ref: txRef,
        entry_type: 'debit',
        account_id: defaultDebitAccId,
        party_id: selectedParty?.id || null,
        amount: amount,
        description: values.description,
        posted_at: new Date(values.date).toISOString(),
        created_at: new Date(values.date).toISOString(),
        status: 'posted',
        accounts: debitAcc ? { name: debitAcc.name, type: debitAcc.type } : { name: values.payment_mode === 'Cash' ? 'Cash in Hand' : 'Bank Account', type: 'asset' },
        parties: selectedParty ? { name: selectedParty.name, phone: selectedParty.phone, current_balance: selectedParty.current_balance } : null,
      };

      const creditEntry = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `entry-c-${Date.now()}`,
        business_id: bizId,
        tx_ref: txRef,
        entry_type: 'credit',
        account_id: defaultCreditAccId,
        party_id: selectedParty?.id || null,
        amount: amount,
        description: `${values.description} [${values.payment_mode}${values.reference_no ? ' Ref:' + values.reference_no : ''}]`,
        posted_at: new Date(values.date).toISOString(),
        created_at: new Date(values.date).toISOString(),
        status: 'posted',
        accounts: creditAcc ? { name: creditAcc.name, type: creditAcc.type } : { name: 'Sales / Ledger Account', type: 'revenue' },
        parties: selectedParty ? { name: selectedParty.name, phone: selectedParty.phone, current_balance: selectedParty.current_balance } : null,
      };

      if (typeof window !== 'undefined') {
        try {
          const cacheKey = `noxis_khata_cache_${bizId}`;
          const rawCache = localStorage.getItem(cacheKey);
          const cache = rawCache ? JSON.parse(rawCache) : { ledger_entries: [] };
          if (!Array.isArray(cache.ledger_entries)) cache.ledger_entries = [];
          cache.ledger_entries.unshift(debitEntry, creditEntry);
          localStorage.setItem(cacheKey, JSON.stringify(cache));

          const legacyKey = `noxis_cached_ledger_${bizId}`;
          const existingLegacy = JSON.parse(localStorage.getItem(legacyKey) || '[]');
          localStorage.setItem(legacyKey, JSON.stringify([debitEntry, creditEntry, ...existingLegacy]));
        } catch (cacheErr) {
          console.warn('Local cache save notice:', cacheErr);
        }
      }

      try {
        const { error: ledgerErr } = await supabase
          .from('ledger_entries')
          .insert([
            {
              id: debitEntry.id,
              business_id: debitEntry.business_id,
              tx_ref: debitEntry.tx_ref,
              entry_type: debitEntry.entry_type,
              account_id: debitEntry.account_id,
              party_id: debitEntry.party_id,
              amount: debitEntry.amount,
              description: debitEntry.description,
              posted_at: debitEntry.posted_at,
              status: debitEntry.status,
            },
            {
              id: creditEntry.id,
              business_id: creditEntry.business_id,
              tx_ref: creditEntry.tx_ref,
              entry_type: creditEntry.entry_type,
              account_id: creditEntry.account_id,
              party_id: creditEntry.party_id,
              amount: creditEntry.amount,
              description: creditEntry.description,
              posted_at: creditEntry.posted_at,
              status: creditEntry.status,
            }
          ]);

        if (ledgerErr) console.warn('Supabase insert notice (saved locally):', ledgerErr.message);
      } catch (err: any) {
        console.warn('Network / Supabase insert skipped (saved locally):', err);
      }

      if (selectedParty) {
        let delta = 0;
        if (values.type === 'money_in') delta = -amount;
        else if (values.type === 'money_out') delta = amount;
        else if (values.type === 'receivable') delta = amount;
        else if (values.type === 'payable') delta = -amount;

        const newBal = Number(selectedParty.current_balance || 0) + delta;
        try {
          await supabase
            .from('parties')
            .update({ current_balance: newBal })
            .eq('id', selectedParty.id);
        } catch {}
      }

      reset();
      onSuccess(`Transaction ${txRef} posted successfully`);
      onClose();
    } catch (err: any) {
      alert(`Error posting entry: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70">
        <div className="max-w-xl w-full bg-[#131823] border border-white/[0.08] rounded-[8px] shadow-2xl overflow-hidden font-sans">
          {/* Header */}
          <div className="h-12 px-5 bg-[#0E121B] border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowRightLeft size={15} strokeWidth={1.5} className="text-slate-400" />
              <h3 className="text-xs font-medium text-white">
                {editingEntry ? 'Edit Khata Transaction' : 'Post Dual-Entry Khata Transaction'}
              </h3>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer">
              <X size={15} strokeWidth={1.5} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
            {/* 1. Transaction Type Segmented Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Transaction Type *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  ['money_in', 'Money In'],
                  ['money_out', 'Money Out'],
                  ['receivable', 'Receivable'],
                  ['payable', 'Payable'],
                ].map(([val, label]) => {
                  const active = watchType === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setValue('type', val as any)}
                      className={cn(
                        'h-8 px-2 rounded-[4px] border text-xs font-medium transition-colors duration-100 cursor-pointer',
                        active
                          ? 'bg-white/[0.08] border-white/20 text-white'
                          : 'bg-[#0B0E14] border-white/[0.08] text-slate-400 hover:text-slate-200'
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Linked Party Search & Live Balance Badge */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Linked Party Account</label>
                <button
                  type="button"
                  onClick={() => setIsAddPartyOpen(true)}
                  className="text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} strokeWidth={1.5} /> Add New Party
                </button>
              </div>

              <div className="relative">
                <div
                  onClick={() => setShowPartyDropdown(!showPartyDropdown)}
                  className="w-full h-8 bg-[#0B0E14] border border-white/[0.08] px-2.5 rounded-[4px] flex items-center justify-between text-xs cursor-pointer hover:border-white/20 transition-colors duration-100"
                >
                  <span className={selectedParty ? 'text-slate-200 font-normal' : 'text-slate-500'}>
                    {selectedParty ? `${selectedParty.name} (${selectedParty.phone || 'No Phone'})` : 'Select Linked Party...'}
                  </span>
                  <User size={14} strokeWidth={1.5} className="text-slate-500" />
                </div>

                {showPartyDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-[#0E121B] border border-white/[0.12] rounded-[4px] p-2 shadow-xl space-y-1.5 max-h-52 overflow-y-auto">
                    <div className="relative">
                      <Search size={13} strokeWidth={1.5} className="absolute left-2.5 top-2 text-slate-500" />
                      <input
                        type="text"
                        value={partySearch}
                        onChange={e => setPartySearch(e.target.value)}
                        placeholder="Search party by name or phone..."
                        className="w-full h-7 bg-[#0B0E14] border border-white/[0.08] pl-7 pr-2 text-xs text-slate-200 rounded-[4px] outline-none"
                      />
                    </div>

                    <div className="space-y-0.5">
                      <div
                        onClick={() => { setSelectedParty(null); setValue('party_id', ''); setShowPartyDropdown(false); }}
                        className="px-2 py-1.5 hover:bg-white/[0.04] rounded-[4px] text-xs text-slate-400 cursor-pointer"
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
                          className="px-2 py-1.5 hover:bg-white/[0.04] rounded-[4px] text-xs flex items-center justify-between cursor-pointer"
                        >
                          <span className="text-slate-200">{p.name}</span>
                          <span className="text-[10px] font-mono tabular-nums text-slate-500">
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
                <div className="p-2.5 bg-[#0B0E14] border border-white/[0.08] rounded-[4px] flex items-center justify-between text-xs font-mono tabular-nums">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-sans">Party Balance</span>
                    <span className={partyBalanceDetails.isReceivable ? 'text-emerald-400' : 'text-amber-400'}>
                      {partyBalanceDetails.balanceText}
                    </span>
                  </div>
                  <span className={cn(
                    'px-1.5 py-0.5 rounded-[4px] text-[10px] border font-sans',
                    partyBalanceDetails.isExceeded ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  )}>
                    {partyBalanceDetails.status}
                  </span>
                </div>
              )}
            </div>

            {/* 3. Amount Input & Date Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Amount (PKR) *</label>
                <input
                  type="number"
                  step="any"
                  {...register('amount')}
                  placeholder="e.g. 50000"
                  className="w-full h-8 bg-[#0B0E14] border border-white/[0.08] px-2.5 text-xs font-mono tabular-nums text-slate-100 rounded-[4px] outline-none focus:border-white/20"
                />
                {errors.amount && <p className="text-[10px] text-rose-400">{errors.amount.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Date & Time *</label>
                <input
                  type="datetime-local"
                  {...register('date')}
                  className="w-full h-8 bg-[#0B0E14] border border-white/[0.08] px-2.5 text-xs text-slate-200 rounded-[4px] outline-none focus:border-white/20 font-mono"
                />
              </div>
            </div>

            {/* 4. Payment Mode & Conditional Cheque / Ref No */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Payment Mode</label>
                <select
                  {...register('payment_mode')}
                  className="w-full h-8 bg-[#0B0E14] border border-white/[0.08] px-2.5 text-xs text-slate-200 rounded-[4px] outline-none focus:border-white/20"
                >
                  <option value="Cash">Cash in Hand</option>
                  <option value="Bank Transfer / Raast">Bank Transfer / Raast</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online">Online Gateway</option>
                </select>
              </div>

              {watchPaymentMode !== 'Cash' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Reference No</label>
                  <input
                    type="text"
                    {...register('reference_no')}
                    placeholder="e.g. CHQ-98231 / RAAST-102"
                    className="w-full h-8 bg-[#0B0E14] border border-white/[0.08] px-2.5 text-xs text-slate-200 rounded-[4px] outline-none focus:border-white/20"
                  />
                </div>
              )}
            </div>

            {/* 5. Description Memo */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Description / Memo *</label>
              <textarea
                rows={2}
                {...register('description')}
                placeholder="e.g. Purana khata payment received"
                className="w-full bg-[#0B0E14] border border-white/[0.08] p-2.5 text-xs text-slate-200 rounded-[4px] outline-none focus:border-white/20 resize-none font-normal"
              />
              {errors.description && <p className="text-[10px] text-rose-400">{errors.description.message}</p>}
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-3 bg-white/[0.03] border border-white/[0.08] text-xs font-medium text-slate-300 rounded-[4px] hover:bg-white/[0.06] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-8 px-4 bg-white text-slate-950 font-medium text-xs rounded-[4px] hover:bg-slate-100 transition-colors duration-100 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Posting...' : 'Post Entry'}
              </button>
            </div>
          </form>
        </div>
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
