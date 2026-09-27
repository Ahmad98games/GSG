"use client";

import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { usePersona } from '@/hooks/usePersona';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { Printer, X, CheckCircle2, Building2 } from 'lucide-react';

interface LedgerReceiptProps {
  transaction: any; // GroupedTransaction
  isOpen?: boolean;
  onClose?: () => void;
}

export function LedgerReceipt({ transaction, isOpen = true, onClose }: LedgerReceiptProps) {
  const { profile } = useBusinessProfile();
  const { fmt } = usePersona();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!transaction || !isOpen) return null;

  const resolvedLogo =
    profile?.logo_url ||
    profile?.avatar_url ||
    (typeof window !== 'undefined' ? localStorage.getItem('noxis_logo') : null);

  const rawAmount = Number(transaction.debitAmount || transaction.creditAmount || 0);
  const formattedAmount = fmt ? fmt(rawAmount) : `PKR ${rawAmount.toLocaleString()}`;

  // Check if money is received or paid out
  const isDebitCashOrBank =
    transaction.debitAccount?.toLowerCase().includes('cash') ||
    transaction.debitAccount?.toLowerCase().includes('bank');
  const isCreditCashOrBank =
    transaction.creditAccount?.toLowerCase().includes('cash') ||
    transaction.creditAccount?.toLowerCase().includes('bank');

  const isMoneyIn = isDebitCashOrBank && !isCreditCashOrBank;
  const voucherTitle = isMoneyIn ? 'RECEIPT VOUCHER' : 'PAYMENT VOUCHER';

  let formattedDate = '—';
  let formattedTime = '—';
  try {
    const d = new Date(transaction.date);
    formattedDate = format(d, 'dd MMM yyyy');
    formattedTime = format(d, 'hh:mm a');
  } catch {}

  const handlePrintClick = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-start sm:justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      {/* Global Print Isolation Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: auto;
                margin: 10mm;
              }
              body * {
                visibility: hidden !important;
              }
              #noxis-ledger-printable,
              #noxis-ledger-printable * {
                visibility: visible !important;
              }
              #noxis-ledger-printable {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                padding: 16px !important;
                margin: 0 !important;
                border: none !important;
                box-shadow: none !important;
                background: white !important;
                color: black !important;
                z-index: 9999999 !important;
              }
            }
          `,
        }}
      />

      {/* Modal Card with Preview Chrome */}
      <div className="w-full max-w-[780px] flex flex-col items-stretch space-y-3 print:space-y-0 my-auto">
        {/* Top Action Bar (Screen Only) */}
        <div className="print:hidden flex items-center justify-between bg-[#161B26] border border-white/10 rounded-lg px-4 py-3 shadow-xl">
          <div className="flex items-center space-x-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-white tracking-wide">
              Print Preview — Ref #{transaction.tx_ref}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrintClick}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-md shadow-md hover:shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Printer size={15} strokeWidth={2} />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
              title="Close Preview (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* The Printable Paper Voucher Slip */}
        <div
          id="noxis-ledger-printable"
          className="bg-white text-slate-900 rounded-md shadow-2xl p-6 sm:p-10 border border-slate-200 font-sans print:border-none print:shadow-none print:p-6 print:m-0"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
            <div className="flex items-center space-x-4">
              {resolvedLogo ? (
                <div className="relative w-14 h-14 rounded overflow-hidden border border-slate-100 flex items-center justify-center bg-slate-50">
                  <img
                    src={resolvedLogo}
                    alt={profile?.business_name || 'Logo'}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 bg-slate-900 flex items-center justify-center rounded">
                  <Building2 className="text-white" size={24} />
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950">
                  {profile?.business_name || 'Noxis Enterprise'}
                </h1>
                {profile?.address && (
                  <p className="text-[11px] text-slate-600 font-medium">{profile.address}</p>
                )}
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                  Dual-Entry Financial Voucher
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-sm">
                {voucherTitle}
              </span>
              <div className="space-y-0.5 mt-2.5">
                <p className="text-[11px] font-mono font-bold text-slate-800">
                  <span className="text-slate-500 font-normal">REF: </span>
                  {transaction.tx_ref}
                </p>
                <p className="text-[11px] text-slate-700 font-medium">
                  <span className="text-slate-500">Date: </span>
                  {formattedDate} {formattedTime !== '—' && `• ${formattedTime}`}
                </p>
              </div>
            </div>
          </div>

          {/* Party & Accounts Grid */}
          <div className="grid grid-cols-2 gap-6 sm:gap-8 py-5 border-b border-slate-200">
            {/* Party Information */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Party / Counterparty
              </span>
              <div className="text-sm font-bold text-slate-900 uppercase">
                {transaction.party || 'Walk-in Party'}
              </div>
              {transaction.party_phone && (
                <div className="text-xs text-slate-600 font-mono">
                  Phone: {transaction.party_phone}
                </div>
              )}
              {transaction.party_balance !== undefined && (
                <div className="text-xs text-slate-600">
                  Party Balance:{' '}
                  <span className="font-mono font-semibold text-slate-900">
                    PKR {Number(transaction.party_balance).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Accounting Breakdown */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Accounting Allocation
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-500 block uppercase">
                    Debit (DR)
                  </span>
                  <span className="font-semibold text-slate-900 block truncate">
                    {transaction.debitAccount || '—'}
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-500 block uppercase">
                    Credit (CR)
                  </span>
                  <span className="font-semibold text-slate-900 block truncate">
                    {transaction.creditAccount || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Narration / Description */}
          <div className="py-4 border-b border-slate-200">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Particulars / Narration
            </span>
            <p className="text-xs sm:text-sm text-slate-800 font-medium bg-slate-50/70 p-3 rounded border border-slate-100 italic">
              &quot;{transaction.description || 'No memo specified'}&quot;
            </p>
          </div>

          {/* Amount Box */}
          <div className="my-5 bg-slate-900 text-white p-5 rounded-lg flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Total Transaction Amount
              </p>
              <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                {formattedAmount}
              </p>
              {transaction.runningBalance !== undefined && (
                <p className="text-[11px] text-slate-400 font-mono">
                  Ledger Net Position: PKR {Number(transaction.runningBalance).toLocaleString()}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 size={13} />
                <span>{transaction.status || 'Posted'}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-8 pt-12 sm:pt-16 pb-4">
            <div className="text-center space-y-2">
              <div className="h-px w-full bg-slate-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Prepared By
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="h-px w-full bg-slate-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Receiver&apos;s Signature
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="h-px w-full bg-slate-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Authorized Signatory
              </p>
            </div>
          </div>

          {/* Security & Verification Footer */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-500 font-mono">
            <span>Verified System Voucher • Noxis Prime Ledger</span>
            <span>Ref: {transaction.tx_ref}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
