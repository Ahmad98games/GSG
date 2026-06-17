"use client";

import React from 'react';
import { format } from 'date-fns';
import { usePersona } from '@/hooks/usePersona';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import Image from 'next/image';

interface LedgerReceiptProps {
  transaction: any; // GroupedTransaction
}

export function LedgerReceipt({ transaction }: LedgerReceiptProps) {
  const { profile } = useBusinessProfile();
  const { fmt } = usePersona();

  if (!transaction) return null;

  return (
    <div className="hidden print:block fixed inset-0 bg-white text-black p-8 font-sans z-[1000]">
      <div className="max-w-[800px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-6">
          <div className="flex items-center space-x-4">
            {profile?.logo_url ? (
              <div className="relative w-16 h-16">
                <Image src={profile.logo_url} alt="Logo" fill className="object-contain" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-black flex items-center justify-center rounded-sm">
                <span className="text-white font-black text-xl italic">NX</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">{profile?.business_name || "Noxis Industrial Hub"}</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">Payment Voucher / Receipt</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-gray-200">VOUCHER</h2>
            <div className="space-y-1 mt-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Ref: {transaction.tx_ref}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Date: {format(new Date(transaction.date), "dd MMM yyyy")}</p>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="grid grid-cols-2 gap-12 py-4">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Transaction Info:</h3>
            <div className="space-y-2">
              <p className="text-sm font-black uppercase">{transaction.description}</p>
              <p className="text-xs text-gray-600 uppercase">Party: {transaction.party}</p>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Account Details:</h3>
            <div className="space-y-1">
              <p className="text-[10px] text-gray-600 uppercase">Debit: {transaction.debitAccount}</p>
              <p className="text-[10px] text-gray-600 uppercase">Credit: {transaction.creditAccount}</p>
            </div>
          </div>
        </div>

        {/* Amount Section */}
        <div className="bg-gray-50 p-8 border border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Amount Paid / Received</p>
            <p className="text-3xl font-black font-mono tracking-tighter">
              {fmt(transaction.debitAmount || transaction.creditAmount)}
            </p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</p>
            <p className="text-sm font-black uppercase text-emerald-600">{transaction.status}</p>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-24 pt-24">
          <div className="text-center space-y-4">
            <div className="h-[1px] w-full bg-black" />
            <p className="text-[10px] font-black uppercase tracking-widest">Authorized Signature</p>
          </div>
          <div className="text-center space-y-4">
            <div className="h-[1px] w-full bg-black" />
            <p className="text-[10px] font-black uppercase tracking-widest">Receiver Signature</p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-12 border-t border-gray-100 flex justify-between items-end opacity-50">
          <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Generated via Noxis Hub Intelligence</p>
          <p className="text-[8px] text-gray-400 font-mono italic">Document verified by double-entry ledger engine.</p>
        </div>
      </div>
    </div>
  );
}
