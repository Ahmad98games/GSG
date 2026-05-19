"use client";

import React, { useMemo, useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRightLeft, ShieldAlert, Search, User, Check } from "lucide-react";
import { Decimal } from "decimal.js";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { usePersona } from "@/hooks/usePersona";

// Simple payment record form validation
const transactionSchema = z.object({
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required").max(200),
  party_id: z.string().optional(),
  type: z.enum(['money_in', 'money_out', 'receivable', 'payable']),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface KhataEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  accounts: any[];
  parties: any[];
}

export function KhataEntryModal({ isOpen, onClose, onSuccess, accounts, parties: initialParties }: KhataEntryModalProps) {
  const { profile } = useBusinessProfile();
  const { businessId, fmt } = usePersona();
  const supabase = createClient();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullJournal, setShowFullJournal] = useState(false);

  // Party Search Autocomplete States
  const [partySearch, setPartySearch] = useState("");
  const [partyResults, setPartyResults] = useState<any[]>([]);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [isSearchingParties, setIsSearchingParties] = useState(false);

  // Core accounts lookups from accounts prop
  const cashAcc = useMemo(() => accounts.find(a => a.account_code === '1001'), [accounts]);
  const arAcc = useMemo(() => accounts.find(a => a.account_code === '1100'), [accounts]);
  const apAcc = useMemo(() => accounts.find(a => a.account_code === '2001'), [accounts]);
  const salesAcc = useMemo(() => accounts.find(a => a.account_code === '4001'), [accounts]);
  const expenseAcc = useMemo(() => accounts.find(a => a.account_code === '5800') || accounts.find(a => a.type === 'expense'), [accounts]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: 'money_in',
      amount: 0,
      description: "",
      notes: ""
    }
  });

  const watchType = watch("type");
  const watchAmount = watch("amount");
  const watchPartyId = watch("party_id");

  // Dynamically calculate preview journal entries for transparency / verification
  const previewLines = useMemo(() => {
    const amount = Number(watchAmount) || 0;
    if (amount <= 0) return [];

    const cashName = cashAcc?.name || 'Cash in Hand';
    const arName = arAcc?.name || 'Accounts Receivable';
    const apName = apAcc?.name || 'Accounts Payable';
    const salesName = salesAcc?.name || 'Sales Revenue';
    const expenseName = expenseAcc?.name || 'Miscellaneous Expense';

    if (watchType === 'money_in') {
      return [
        { account: cashName, debit: amount, credit: 0 },
        { account: selectedParty ? arName : salesName, debit: 0, credit: amount }
      ];
    } else if (watchType === 'money_out') {
      return [
        { account: selectedParty ? apName : expenseName, debit: amount, credit: 0 },
        { account: cashName, debit: 0, credit: amount }
      ];
    } else if (watchType === 'receivable') {
      return [
        { account: arName, debit: amount, credit: 0 },
        { account: salesName, debit: 0, credit: amount }
      ];
    } else if (watchType === 'payable') {
      return [
        { account: expenseName, debit: amount, credit: 0 },
        { account: apName, debit: 0, credit: amount }
      ];
    }
    return [];
  }, [watchType, watchAmount, selectedParty, cashAcc, arAcc, apAcc, salesAcc, expenseAcc]);

  const handlePartySearch = async (search: string) => {
    setPartySearch(search);
    if (search.length < 2) {
      setPartyResults([]);
      return;
    }

    setIsSearchingParties(true);
    try {
      const { data } = await supabase
        .from('parties')
        .select('id, name, party_type')
        .eq('business_id', businessId)
        .ilike('name', `%${search}%`)
        .limit(8);

      const results = [
        ...(data || []),
        { id: 'manual', name: `+ Add "${search}"` }
      ];
      setPartyResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingParties(false);
    }
  };

  const handleSelectParty = async (party: any) => {
    if (party.id === 'manual') {
      const name = partySearch;
      try {
        const { data: newParty, error } = await supabase
          .from('parties')
          .insert({
            business_id: businessId,
            name: name,
            party_type: 'customer',
            current_balance: 0,
          })
          .select()
          .single();

        if (error) throw error;

        setSelectedParty(newParty);
        setValue("party_id", newParty.id);
        setPartySearch("");
        setPartyResults([]);
      } catch (err: any) {
        alert(`Failed to add party: ${err.message}`);
      }
    } else {
      setSelectedParty(party);
      setValue("party_id", party.id);
      setPartySearch("");
      setPartyResults([]);
    }
  };

  const handleClearParty = () => {
    setSelectedParty(null);
    setValue("party_id", undefined);
    setPartySearch("");
  };

  const onSubmit = async (values: TransactionFormValues) => {
    setIsSubmitting(true);
    try {
      const cashAccountId = cashAcc?.id;
      const arAccountId = arAcc?.id;
      const apAccountId = apAcc?.id;
      const salesAccountId = salesAcc?.id;
      const expenseAccountId = expenseAcc?.id;

      if (!cashAccountId || !arAccountId || !apAccountId || !salesAccountId || !expenseAccountId) {
        throw new Error("Core system accounts are missing in your Chart of Accounts. Make sure you have CASH (1001), Accounts Receivable (1100), Accounts Payable (2001), Sales (4001), and Expense (5800) accounts created.");
      }

      let debitAccId = '';
      let creditAccId = '';

      if (values.type === 'money_in') {
        debitAccId = cashAccountId;
        creditAccId = values.party_id ? arAccountId : salesAccountId;
      } else if (values.type === 'money_out') {
        debitAccId = values.party_id ? apAccountId : expenseAccountId;
        creditAccId = cashAccountId;
      } else if (values.type === 'receivable') {
        if (!values.party_id) throw new Error("A Party selection is required to register a Receivable transaction.");
        debitAccId = arAccountId;
        creditAccId = salesAccountId;
      } else if (values.type === 'payable') {
        if (!values.party_id) throw new Error("A Party selection is required to register a Payable transaction.");
        debitAccId = expenseAccountId;
        creditAccId = apAccountId;
      }

      const tx_ref = `JV-${Date.now().toString().slice(-6)}`;
      const entries = [
        {
          business_id: businessId,
          tx_ref,
          account_id: debitAccId,
          party_id: values.party_id || null,
          amount: values.amount,
          entry_type: 'debit',
          description: values.description,
          posted_at: new Date(values.date).toISOString(),
          status: 'posted'
        },
        {
          business_id: businessId,
          tx_ref,
          account_id: creditAccId,
          party_id: values.party_id || null,
          amount: values.amount,
          entry_type: 'credit',
          description: values.description,
          posted_at: new Date(values.date).toISOString(),
          status: 'posted'
        }
      ];

      // 1. Post entries to ledger
      const { error: ledgerError } = await supabase.from('ledger_entries').insert(entries);
      if (ledgerError) throw ledgerError;

      // 2. Adjust party balance in the database
      if (values.party_id) {
        let netChange = new Decimal(0);
        if (values.type === 'money_in') {
          netChange = netChange.minus(new Decimal(values.amount));
        } else if (values.type === 'money_out') {
          netChange = netChange.plus(new Decimal(values.amount));
        } else if (values.type === 'receivable') {
          netChange = netChange.plus(new Decimal(values.amount));
        } else if (values.type === 'payable') {
          netChange = netChange.minus(new Decimal(values.amount));
        }

        const { data: partyData, error: partyFetchError } = await supabase
          .from('parties')
          .select('current_balance')
          .eq('id', values.party_id)
          .single();

        if (partyFetchError) throw partyFetchError;

        const newBalance = new Decimal(partyData.current_balance || 0).plus(netChange);

        const { error: partyUpdateError } = await supabase
          .from('parties')
          .update({ current_balance: newBalance.toNumber() })
          .eq('id', values.party_id);

        if (partyUpdateError) throw partyUpdateError;
      }

      onSuccess(`Successfully posted transaction ${tx_ref}`);
      onClose();
    } catch (err: any) {
      console.error("Post error:", err);
      alert(`Transaction posting failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ x: "100%" }} 
            animate={{ x: 0 }} 
            exit={{ x: "100%" }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-[600px] bg-[#1A1D21] border-l border-white/5 h-full flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-electric-blue/10 text-electric-blue">
                  <ArrowRightLeft size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tighter">Record Transaction</h2>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Type Selection (Grid buttons) */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest block">Transaction Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'money_in', label: 'Money In', desc: 'Received Payment' },
                    { key: 'money_out', label: 'Money Out', desc: 'Sent Payment' },
                    { key: 'receivable', label: 'Receivable', desc: 'Invoice / Owed to Us' },
                    { key: 'payable', label: 'Payable', desc: 'Bill / Owed to Supplier' }
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      type="button"
                      onClick={() => setValue("type", btn.key as any)}
                      className={cn(
                        "p-4 border rounded-sm transition-all text-left flex flex-col justify-between h-20",
                        watchType === btn.key 
                          ? "bg-electric-blue/10 border-electric-blue text-white shadow-lg" 
                          : "bg-[#0F1113]/50 border-white/5 text-gray-400 hover:border-white/10"
                      )}
                    >
                      <span className="text-xs font-black uppercase tracking-wider block">{btn.label}</span>
                      <span className="text-[9px] text-gray-500 block">{btn.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Large Input */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest block">Amount</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-sm font-mono text-gray-500">PKR</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    {...register("amount")} 
                    className="w-full bg-[#0F1113] border border-white/10 p-6 pl-16 text-3xl font-bold font-mono text-sandstone-gold focus:border-electric-blue outline-none text-right" 
                    placeholder="0.00" 
                  />
                </div>
                {errors.amount && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.amount.message}</p>}
              </div>

              {/* Date & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest block">Date</label>
                  <input 
                    type="date" 
                    {...register("date")} 
                    className="w-full bg-[#0F1113] border border-white/10 p-4 text-xs text-white focus:border-electric-blue outline-none" 
                  />
                  {errors.date && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.date.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest block">Transaction Details</label>
                  <input 
                    {...register("description")} 
                    placeholder="What is this for?" 
                    className="w-full bg-[#0F1113] border border-white/10 p-4 text-xs text-white focus:border-electric-blue outline-none" 
                  />
                  {errors.description && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.description.message}</p>}
                </div>
              </div>

              {/* Party Autocomplete Search */}
              <div className="space-y-2 relative">
                <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest block">Linked Party (Optional)</label>
                {selectedParty ? (
                  <div className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-sm">
                    <div className="flex items-center space-x-3">
                      <User size={16} className="text-electric-blue" />
                      <span className="text-xs font-bold text-white uppercase">{selectedParty.name}</span>
                    </div>
                    <button type="button" onClick={handleClearParty} className="text-gray-500 hover:text-white transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={partySearch}
                      onChange={(e) => handlePartySearch(e.target.value)}
                      placeholder="Type name to search parties..."
                      className="w-full bg-[#0F1113] border border-white/10 pl-12 pr-4 py-4 text-xs text-white outline-none focus:border-electric-blue"
                    />
                    {isSearchingParties && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">Searching...</span>
                    )}

                    {partyResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-[#1A1D21] border border-white/10 z-[200] mt-1 shadow-2xl rounded-sm divide-y divide-white/5">
                        {partyResults.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleSelectParty(option)}
                            className="w-full px-4 py-3 text-left text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-colors flex items-center justify-between"
                          >
                            <span>{option.name}</span>
                            {option.id !== 'manual' && <Check size={12} className="opacity-40" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest block">Internal Notes (Optional)</label>
                <textarea 
                  {...register("notes")} 
                  rows={2} 
                  placeholder="Memo, payment details, cheque number, etc." 
                  className="w-full bg-[#0F1113] border border-white/10 p-4 text-xs text-white focus:border-electric-blue outline-none resize-none" 
                />
              </div>

              {/* Accounting Notice */}
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 space-y-2">
                <div className="flex items-center space-x-2 text-amber-500">
                  <ShieldAlert size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Important Notice</span>
                </div>
                <p className="text-[9px] text-gray-500 leading-relaxed uppercase">
                  This entry will update the party balance and cannot be deleted. A reversal entry will be needed to correct mistakes.
                </p>
              </div>

              {/* Advanced Link to expand full journal preview */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowFullJournal(!showFullJournal)}
                  className="text-[10px] font-bold text-gray-600 hover:text-white uppercase tracking-widest transition-colors"
                >
                  {showFullJournal ? "Hide journal details" : "Show full journal entry"}
                </button>
              </div>

              {/* Advanced journal view details */}
              <AnimatePresence>
                {showFullJournal && previewLines.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border border-white/5 bg-[#0F1113]/50 p-4 rounded-sm space-y-3 overflow-hidden"
                  >
                    <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Ledger Preview</h4>
                    <div className="space-y-1">
                      {previewLines.map((line, idx) => (
                        <div key={idx} className="flex justify-between text-xs font-mono py-1 border-b border-white/[0.02]">
                          <span className="text-gray-400 max-w-[200px] truncate">{line.account}</span>
                          <span className="text-sandstone-gold">
                            {line.debit > 0 ? `DR: ${fmt(line.debit)}` : `CR: ${fmt(line.credit)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            {/* Footer buttons */}
            <div className="p-6 bg-[#0F1113] border-t border-white/5 flex items-center justify-between">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-6 py-4 border border-white/10 text-[10px] uppercase font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSubmit(onSubmit)} 
                disabled={isSubmitting || Number(watchAmount) <= 0} 
                className="px-8 py-4 bg-electric-blue text-onyx text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-30"
              >
                {isSubmitting ? "Processing..." : "Confirm Transaction"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
