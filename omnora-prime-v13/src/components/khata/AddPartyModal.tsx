'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { X, UserPlus, Phone, MapPin, DollarSign, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';

const partySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(5, 'Phone number is required'),
  party_type: z.enum(['customer', 'supplier', 'karigar']),
  address: z.string().optional(),
  opening_balance: z.coerce.number().default(0),
  balance_type: z.enum(['receivable', 'payable']).default('receivable'),
  credit_limit: z.coerce.number().default(100000),
});

type PartyFormValues = z.infer<typeof partySchema>;

interface AddPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newParty: any) => void;
}

export function AddPartyModal({ isOpen, onClose, onSuccess }: AddPartyModalProps) {
  const { profile } = useBusinessProfile();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PartyFormValues>({
    resolver: zodResolver(partySchema),
    defaultValues: {
      party_type: 'customer',
      opening_balance: 0,
      balance_type: 'receivable',
      credit_limit: 100000,
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (values: PartyFormValues) => {
    setIsSubmitting(true);
    try {
      const initialBalance = values.balance_type === 'payable' ? -Math.abs(values.opening_balance) : Math.abs(values.opening_balance);

      const newPartyData = {
        business_id: profile?.id,
        name: values.name.trim(),
        phone: values.phone.trim(),
        party_type: values.party_type,
        address: values.address || '',
        current_balance: initialBalance,
        credit_limit: values.credit_limit,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('parties')
        .insert(newPartyData)
        .select()
        .single();

      if (error) throw error;

      reset();
      onSuccess(data || newPartyData);
      onClose();
    } catch (err: any) {
      alert(`Failed to add party: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="max-w-lg w-full bg-[#0B0F17] border border-[#08EBF6]/30 rounded-2xl shadow-[0_0_40px_rgba(8,235,246,0.15)] overflow-hidden"
      >
        <div className="p-6 bg-[#030712] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#08EBF6]/10 text-[#08EBF6]">
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">+ Add New Party Account</h3>
              <p className="text-[10px] text-slate-400 font-medium">Create Customer, Supplier, or Karigar ledger profile</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Party Type *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['customer', 'Buyer / Customer'],
                ['supplier', 'Supplier / Vendor'],
                ['karigar', 'Karigar / Worker'],
              ].map(([val, label]) => (
                <label
                  key={val}
                  className="flex items-center justify-center p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all bg-[#030712]"
                >
                  <input
                    type="radio"
                    {...register('party_type')}
                    value={val}
                    className="accent-[#08EBF6] mr-1.5"
                  />
                  <span className="truncate">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Party Full Name *</label>
              <input
                {...register('name')}
                placeholder="e.g. Mian Fabrics / Usman Garments"
                className="w-full bg-[#030712] border border-white/15 p-2.5 text-xs text-white rounded-xl outline-none focus:border-[#08EBF6]"
              />
              {errors.name && <p className="text-[9px] text-red-400 font-bold">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">WhatsApp / Phone *</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  {...register('phone')}
                  placeholder="+92 300 1234567"
                  className="w-full bg-[#030712] border border-white/15 p-2.5 pl-9 text-xs text-white rounded-xl outline-none focus:border-[#08EBF6]"
                />
              </div>
              {errors.phone && <p className="text-[9px] text-red-400 font-bold">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Address / City</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                {...register('address')}
                placeholder="Shop #12, Azam Cloth Market, Lahore"
                className="w-full bg-[#030712] border border-white/15 p-2.5 pl-9 text-xs text-white rounded-xl outline-none focus:border-[#08EBF6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-black/40 border border-white/10 rounded-xl">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Opening Balance (PKR)</label>
              <input
                type="number"
                {...register('opening_balance')}
                placeholder="0"
                className="w-full bg-[#030712] border border-white/15 p-2 text-xs text-white rounded-lg outline-none focus:border-[#08EBF6]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Balance Nature</label>
              <select
                {...register('balance_type')}
                className="w-full bg-[#030712] border border-white/15 p-2 text-xs text-white rounded-lg outline-none focus:border-[#08EBF6]"
              >
                <option value="receivable">Receivable (Jama - He Owes Us)</option>
                <option value="payable">Payable (Naam - We Owe Him)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Credit Limit Warning Threshold (PKR)</label>
            <input
              type="number"
              {...register('credit_limit')}
              placeholder="100000"
              className="w-full bg-[#030712] border border-white/15 p-2.5 text-xs text-white rounded-xl outline-none focus:border-[#08EBF6]"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 bg-white/5 border border-white/10 text-xs font-bold text-slate-300 rounded-xl hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 py-3 bg-gradient-to-r from-[#08EBF6] to-[#5FA5FA] text-black font-black uppercase tracking-wider text-xs rounded-xl shadow-[0_0_20px_rgba(8,235,246,0.3)] hover:brightness-110 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Party...' : 'Save Party Account'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
