"use client";

import React, { useMemo, useState } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, ArrowRightLeft, ShieldAlert } from "lucide-react";
import { Decimal } from "decimal.js";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { usePersona } from "@/hooks/usePersona";
import { WhatsAppSender, WhatsAppTemplates } from "@/lib/whatsapp/WhatsAppSender";
import { MessageCircle } from "lucide-react";

// --- Validation Schemas ---

const journalLineSchema = z.object({
  account_id: z.string().min(1, "Account is required"),
  description: z.string().max(100).optional(),
  debit: z.coerce.number().min(0),
  credit: z.coerce.number().min(0),
}).refine(data => (data.debit > 0 && data.credit === 0) || (data.debit === 0 && data.credit > 0), {
  message: "Each line must have exactly one debit or credit amount",
  path: ["debit"]
});

const journalEntrySchema = z.object({
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required").max(200),
  party_id: z.string().optional(),
  tx_ref: z.string().optional(),
  lines: z.array(journalLineSchema).min(2, "At least 2 lines are required")
}).refine(data => {
  const totalDebit = data.lines.reduce((acc, line) => acc.plus(new Decimal(line.debit)), new Decimal(0));
  const totalCredit = data.lines.reduce((acc, line) => acc.plus(new Decimal(line.credit)), new Decimal(0));
  return totalDebit.equals(totalCredit);
}, {
  message: "Total Debits must equal Total Credits",
  path: ["lines"]
});

type JournalFormValues = z.infer<typeof journalEntrySchema>;

interface KhataEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  accounts: any[];
  parties: any[];
}

export function KhataEntryModal({ isOpen, onClose, onSuccess, accounts, parties }: KhataEntryModalProps) {
  const { profile } = useBusinessProfile();
  const { businessId, fmt } = usePersona();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<JournalFormValues>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      lines: [
        { account_id: '', debit: 0, credit: 0 },
        { account_id: '', debit: 0, credit: 0 },
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const watchedLines = watch("lines");
  const watchedPartyId = watch("party_id");

  const totals = useMemo(() => {
    let debits = new Decimal(0);
    let credits = new Decimal(0);
    watchedLines.forEach(l => {
      debits = debits.plus(new Decimal(l.debit || 0));
      credits = credits.plus(new Decimal(l.credit || 0));
    });
    return { debits, credits, diff: debits.minus(credits) };
  }, [watchedLines]);

  const onSubmit = async (values: JournalFormValues, status: 'posted' | 'pending' = 'posted') => {
    setIsSubmitting(true);
    try {
      const tx_ref = values.tx_ref || `JV-${Date.now().toString().slice(-6)}`;
      const entries = values.lines.map(line => ({
        business_id: businessId,
        tx_ref,
        account_id: line.account_id,
        party_id: values.party_id || null,
        amount: line.debit > 0 ? line.debit : line.credit,
        entry_type: line.debit > 0 ? 'debit' : 'credit',
        description: line.description || values.description,
        posted_at: new Date(values.date).toISOString(),
        status
      }));

      // 1. Insert Ledger Entries
      const { error: ledgerError } = await supabase.from('ledger_entries').insert(entries);
      if (ledgerError) throw ledgerError;

      // 2. Update Party Balance if applicable and posted
      if (values.party_id && status === 'posted') {
        // Calculate net change for party
        let netChange = new Decimal(0);
        values.lines.forEach(line => {
          if (line.debit > 0) netChange = netChange.plus(new Decimal(line.debit));
          else netChange = netChange.minus(new Decimal(line.credit));
        });

        // Current balance in parties table: Positive = Receivable, Negative = Payable
        // A Debit to a party increases receivable (or decreases payable) -> Net Change +
        // A Credit to a party decreases receivable (or increases payable) -> Net Change -
        
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

      onSuccess(`Successfully ${status === 'posted' ? 'posted' : 'saved'} journal entry ${tx_ref}`);
      onClose();
    } catch (err: any) {
      console.error("Submission error:", err);
      alert(`Error posting entry: ${err.message}`);
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
            className="w-full max-w-4xl bg-[#1A1D21] border-l border-white/5 h-full flex flex-col shadow-2xl"
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-electric-blue/10 text-electric-blue">
                  <ArrowRightLeft size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">New Ledger Entry</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Double-Entry Financial System v9.0</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Entry Date</label>
                  <input type="date" {...register("date")} className="w-full bg-[#0F1113] border border-white/10 p-4 text-sm text-white focus:border-electric-blue outline-none" />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Transaction Description</label>
                  <input {...register("description")} placeholder="General description for this transaction..." className="w-full bg-[#0F1113] border border-white/10 p-4 text-sm text-white focus:border-electric-blue outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Linked Party (Optional)</label>
                  <select {...register("party_id")} className="w-full bg-[#0F1113] border border-white/10 p-4 text-sm text-white outline-none">
                    <option value="">No Party</option>
                    {parties.map(p => <option key={p.id} value={p.id}>{p.name} ({p.party_type})</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] uppercase font-black text-gray-600 tracking-widest">
                  <div className="col-span-4">Account</div>
                  <div className="col-span-4">Line Description</div>
                  <div className="col-span-2 text-right">Debit</div>
                  <div className="col-span-2 text-right">Credit</div>
                </div>
                <div className="space-y-1">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-4 items-center bg-[#0F1113]/50 p-1 group hover:bg-[#0F1113] transition-colors">
                      <div className="col-span-4">
                        <select {...register(`lines.${index}.account_id`)} className="w-full bg-transparent p-3 text-xs text-white outline-none">
                          <option value="">Select Account</option>
                          {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.account_code} - {acc.name}</option>)}
                        </select>
                      </div>
                      <div className="col-span-4">
                        <input {...register(`lines.${index}.description`)} className="w-full bg-transparent p-3 text-xs text-white outline-none" placeholder="Memo..." />
                      </div>
                      <div className="col-span-2">
                        <input type="number" step="0.01" {...register(`lines.${index}.debit`)} className="w-full bg-transparent p-3 text-xs text-right font-mono text-sandstone-gold outline-none" placeholder="0.00" />
                      </div>
                      <div className="col-span-2 relative">
                        <input type="number" step="0.01" {...register(`lines.${index}.credit`)} className="w-full bg-transparent p-3 text-xs text-right font-mono text-sandstone-gold outline-none" placeholder="0.00" />
                        {index > 1 && (
                          <button type="button" onClick={() => remove(index)} className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-500 transition-all">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => append({ account_id: '', debit: 0, credit: 0 })} className="flex items-center space-x-2 text-[10px] uppercase font-bold text-gray-500 hover:text-white transition-colors py-2">
                  <Plus size={14} />
                  <span>Add Entry Line</span>
                </button>
              </div>

              <div className="p-6 bg-amber-500/5 border border-amber-500/10 space-y-3">
                <div className="flex items-center space-x-2 text-amber-500">
                  <ShieldAlert size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Accounting Guard</span>
                </div>
                <p className="text-[9px] text-gray-500 leading-relaxed uppercase">
                  Posting this transaction will modify the general ledger and update the real-time balance of the linked party. This action is irreversible without a reversal entry.
                </p>
              </div>
            </form>

            <div className="p-8 bg-[#0F1113] border-t border-white/5 flex flex-col space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-12">
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold text-gray-600 tracking-widest">Total Debits</p>
                    <p className="text-lg font-mono text-sandstone-gold font-bold">{fmt(totals.debits)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold text-gray-600 tracking-widest">Total Credits</p>
                    <p className="text-lg font-mono text-sandstone-gold font-bold">{fmt(totals.credits)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold text-gray-600 tracking-widest">Balance State</p>
                    <p className={cn("text-xs font-black uppercase tracking-widest", totals.diff.isZero() ? "text-emerald-500" : "text-red-500")}>
                      {totals.diff.isZero() ? "Balanced" : `Unbalanced (${totals.diff.abs().toFixed(2)})`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <button type="button" onClick={handleSubmit((d) => onSubmit(d, 'pending'))} disabled={isSubmitting} className="px-6 py-4 border border-white/10 text-[10px] uppercase font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-all">Save as Draft</button>
                  {watchedPartyId && (
                    <button 
                      type="button"
                      onClick={() => {
                        const party = parties.find(p => p.id === watchedPartyId);
                        if (!party?.phone) return alert("Party has no phone number");
                        const message = WhatsAppTemplates.peshgi(
                          profile?.business_name || 'Business',
                          party.name,
                          fmt(totals.debits.toNumber()),
                          fmt(new Decimal(party.current_balance || 0).plus(totals.diff).toNumber())
                        );
                        WhatsAppSender.send({ phone: party.phone, message }, profile?.tier || 'starter');
                      }}
                      className="px-4 py-4 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 text-[10px] uppercase font-black tracking-widest hover:bg-[#25D366] hover:text-white transition-all"
                    >
                       <MessageCircle size={16} />
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={handleSubmit((d) => onSubmit(d, 'posted'))} 
                    disabled={isSubmitting || !totals.diff.isZero()} 
                    className="px-8 py-4 bg-electric-blue text-onyx text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-30"
                  >
                    {isSubmitting ? "Processing..." : "Post Journal Entry"}
                  </button>
                </div>
              </div>
              {errors.lines && <p className="text-xs text-red-500 font-bold uppercase text-center">{errors.lines.message || (errors.lines as any).root?.message}</p>}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
