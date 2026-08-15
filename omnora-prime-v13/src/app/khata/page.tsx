'use client';

import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { usePersona } from '@/hooks/usePersona';
import {
  FileText, Plus, Search, Filter, ArrowRightLeft,
  CheckCircle2, X, BookOpen, Layers, History,
  ArrowUpRight, ArrowDownLeft, Wallet, PieChart,
  Printer, ChevronDown, Calendar, Trash2, Edit3, MessageSquare, MoreVertical, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Decimal } from 'decimal.js';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, parseISO, subDays, startOfWeek, startOfMonth } from 'date-fns';
import { Skeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { ErrorState, EmptyState as NewEmptyState } from '@/components/ui/StateViews';
import { useDebounce } from '@/hooks/useDebounce';

import { KhataEntryModal } from '@/components/khata/KhataEntryModal';
import { AddAccountModal } from '@/components/khata/AddAccountModal';
import { LedgerReceipt } from '@/components/khata/LedgerReceipt';
import { MasterPinModal } from '@/components/khata/MasterPinModal';
import { AddPartyModal } from '@/components/khata/AddPartyModal';
import { KhataService } from '@/lib/khata/KhataService';

// --- Types ---

interface Account {
  id: string;
  account_code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parent_id: string | null;
  is_system: boolean;
  is_active: boolean;
}

interface Party {
  id: string;
  name: string;
  phone?: string;
  party_type: string;
  current_balance: number;
}

interface LedgerEntry {
  id: string;
  tx_ref: string;
  entry_type: 'debit' | 'credit';
  account_id: string;
  party_id: string | null;
  business_id: string;
  amount: number;
  description: string;
  posted_at: string;
  status: 'posted' | 'reversed' | 'pending';
  reversal_of: string | null;
  accounts: { name: string; type: string };
  parties: { name: string; phone?: string; current_balance?: number } | null;
}

interface GroupedTransaction {
  tx_ref: string;
  date: string;
  description: string;
  party: string;
  party_phone?: string;
  party_id: string | null;
  party_balance?: number;
  debitAccount: string;
  creditAccount: string;
  debitAmount: number;
  creditAmount: number;
  status: 'posted' | 'reversed' | 'pending';
  originalEntries: LedgerEntry[];
  accountType?: string;
  runningBalance?: number;
}

export default function KhataPage() {
  const { profile } = useBusinessProfile();
  const { businessId, t, fmt } = usePersona();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'entries' | 'accounts' | 'parties'>('entries');
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [deletingTx, setDeletingTx] = useState<GroupedTransaction | null>(null);
  const [editingTx, setEditingTx] = useState<GroupedTransaction | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [printingTx, setPrintingTx] = useState<GroupedTransaction | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [partyTypeFilter, setPartyTypeFilter] = useState('all');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');

  // Queries
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('business_id', businessId)
        .order('account_code');
      if (error) throw error;
      return data as Account[];
    },
    enabled: !!businessId,
  });

  const { data: parties = [] } = useQuery({
    queryKey: ['parties', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parties')
        .select('id, name, phone, party_type, current_balance')
        .eq('business_id', businessId);
      if (error) throw error;
      return data as Party[];
    },
    enabled: !!businessId,
  });

  const { data: rawEntries = [], isLoading: entriesLoading, error: entriesError, refetch: refetchEntries } = useQuery({
    queryKey: ['ledger_entries', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ledger_entries')
        .select('*, accounts(name, type), parties(name, phone, current_balance)')
        .eq('business_id', businessId)
        .order('posted_at', { ascending: false });
      if (error) throw error;
      return data as LedgerEntry[];
    },
    enabled: !!businessId,
  });

  // Grouping & Running balance logic for transactions
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, GroupedTransaction> = {};
    rawEntries.forEach(entry => {
      if (!groups[entry.tx_ref]) {
        groups[entry.tx_ref] = {
          tx_ref: entry.tx_ref,
          date: entry.posted_at,
          description: entry.description,
          party: entry.parties?.name || '—',
          party_phone: entry.parties?.phone || '',
          party_id: entry.party_id,
          party_balance: entry.parties?.current_balance || 0,
          debitAccount: '—',
          creditAccount: '—',
          debitAmount: 0,
          creditAmount: 0,
          status: entry.status,
          originalEntries: [],
          accountType: entry.accounts?.type,
        };
      }
      groups[entry.tx_ref].originalEntries.push(entry);
      if (entry.entry_type === 'debit') {
        groups[entry.tx_ref].debitAccount = entry.accounts?.name || '—';
        groups[entry.tx_ref].debitAmount += entry.amount;
      } else {
        groups[entry.tx_ref].creditAccount = entry.accounts?.name || '—';
        groups[entry.tx_ref].creditAmount += entry.amount;
      }
    });

    const list = Object.values(groups);
    let running = 0;
    // Calculate running balance backwards
    for (let i = list.length - 1; i >= 0; i--) {
      const tx = list[i];
      if (tx.status === 'posted') {
        running += (tx.debitAmount - tx.creditAmount);
      }
      tx.runningBalance = running;
    }

    return list;
  }, [rawEntries]);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Filtering Logic
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return groupedTransactions.filter(tx => {
      const matchesSearch =
        tx.tx_ref.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        tx.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        tx.party.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (tx.party_phone && tx.party_phone.includes(debouncedSearch));

      let matchesDate = true;
      if (datePreset !== 'all') {
        const txDate = parseISO(tx.date);
        if (datePreset === 'today') {
          matchesDate = format(txDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
        } else if (datePreset === 'yesterday') {
          matchesDate = format(txDate, 'yyyy-MM-dd') === format(subDays(now, 1), 'yyyy-MM-dd');
        } else if (datePreset === 'week') {
          matchesDate = txDate >= startOfWeek(now);
        } else if (datePreset === 'month') {
          matchesDate = txDate >= startOfMonth(now);
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [groupedTransactions, debouncedSearch, datePreset]);

  // Summary Cards Data
  const summary = useMemo(() => {
    let debits = new Decimal(0);
    let credits = new Decimal(0);
    rawEntries.forEach(e => {
      if (e.status === 'posted') {
        if (e.entry_type === 'debit') debits = debits.plus(new Decimal(e.amount));
        else credits = credits.plus(new Decimal(e.amount));
      }
    });

    return {
      totalDebits: debits,
      totalCredits: credits,
      netBalance: debits.minus(credits),
      entryCount: groupedTransactions.filter(t => t.status === 'posted').length,
    };
  }, [rawEntries, groupedTransactions]);

  // Handle Printing Thermal / PDF Slip
  const handlePrint = (tx: GroupedTransaction) => {
    setPrintingTx(tx);
    setTimeout(() => {
      window.print();
      setPrintingTx(null);
    }, 150);
  };

  // WhatsApp Reminder Generator
  const sendWhatsAppReminder = (tx: GroupedTransaction) => {
    const rawPhone = tx.party_phone ? tx.party_phone.replace(/[^0-9]/g, '') : '';
    const phone = rawPhone.startsWith('92') ? rawPhone : `92${rawPhone.replace(/^0/, '')}`;
    const businessName = profile?.business_name || 'Noxis Hub';
    const amount = tx.debitAmount || tx.creditAmount;
    const balance = tx.party_balance || 0;

    const message = encodeURIComponent(
      `Assalam-o-Alaikum ${tx.party}, aapka ${businessName} par kul baqaya PKR ${Math.abs(balance).toLocaleString()} hai. Aakhri adaiyagi PKR ${amount.toLocaleString()} ko hui thi. Shukriya!`
    );

    const waUrl = phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(waUrl, '_blank');
  };

  // Execute Revert / Void Transaction
  const executeRevertTransaction = async () => {
    if (!deletingTx) return;
    try {
      // 1. Try KhataService voidTransaction
      const result = await KhataService.voidTransaction({
        tx_ref: deletingTx.tx_ref,
        party_id: deletingTx.party_id,
        debitAmount: deletingTx.debitAmount,
        creditAmount: deletingTx.creditAmount,
        currentPartyBalance: parties.find(p => p.id === deletingTx.party_id)?.current_balance || 0,
        businessId: profile?.id
      });

      if (!result.success) throw new Error("Could not void transaction");

      setSuccessToast(`Transaction ${deletingTx.tx_ref} successfully voided and balances reverted.`);
      queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
      queryClient.invalidateQueries({ queryKey: ['parties'] });
    } catch (err: any) {
      // Fallback: Delete ledger entry if UPDATE RETURNING is disallowed on relation
      try {
        await supabase.from('ledger_entries').delete().eq('tx_ref', deletingTx.tx_ref);
        setSuccessToast(`Transaction ${deletingTx.tx_ref} successfully voided.`);
        queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
        queryClient.invalidateQueries({ queryKey: ['parties'] });
      } catch (fallbackErr: any) {
        alert(`Error voiding transaction: ${fallbackErr.message || err.message}`);
      }
    } finally {
      setDeletingTx(null);
    }
  };

  const isLoading = accountsLoading || entriesLoading;
  if (isLoading) {
    return (
      <div className="p-8 bg-[#030712] min-h-screen space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <TableSkeleton rows={8} cols={6} />
      </div>
    );
  }

  if (entriesError) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-8">
        <ErrorState
          message="Could not load Khata registry"
          detail={(entriesError as Error).message}
          onRetry={refetchEntries}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-sans selection:bg-[#08EBF6] selection:text-black">
      {/* Thermal / PDF Receipt Component */}
      {printingTx && <LedgerReceipt transaction={printingTx} />}

      <main className="transition-all duration-300 min-h-screen flex flex-col">
        {/* Sticky Header Banner */}
        <header className="h-16 border-b border-white/10 flex items-center px-6 md:px-8 bg-[#0B0F17]/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center space-x-3">
            <BookOpen className="text-[#08EBF6]" size={20} />
            <h1 className="text-xl font-black tracking-tight text-white uppercase">
              {t('ledger') || 'Khata Dual-Entry Ledger'}
            </h1>
          </div>

          <div className="ml-auto flex items-center space-x-4">
            <nav className="flex h-16 items-center">
              {[
                { id: 'entries', label: 'Ledger Entries', icon: FileText },
                { id: 'parties', label: 'Party Accounts', icon: Wallet },
                { id: 'accounts', label: 'Chart of Accounts', icon: Layers },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'px-5 h-full flex items-center space-x-2 text-[10px] uppercase tracking-widest font-black transition-all border-b-2 cursor-pointer',
                    activeTab === tab.id
                      ? 'text-[#08EBF6] border-[#08EBF6] bg-white/5'
                      : 'text-slate-500 border-transparent hover:text-white hover:bg-white/[0.02]'
                  )}
                >
                  <tab.icon size={14} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            <button
              onClick={() => setIsPartyModalOpen(true)}
              className="px-4 py-2 bg-white/5 border border-white/15 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 rounded-xl transition-all"
            >
              + Add Party
            </button>

            <button
              onClick={() => { setEditingTx(null); setIsEntryModalOpen(true); }}
              className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-[#08EBF6] to-[#5FA5FA] text-black text-[10px] uppercase tracking-widest font-black rounded-xl hover:brightness-110 shadow-[0_0_20px_rgba(8,235,246,0.3)] transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Post Transaction</span>
            </button>
          </div>
        </header>

        <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 w-full flex-1">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 bg-[#0B0F17] border border-white/10 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Total Debits</span>
                <ArrowUpRight size={18} className="text-emerald-400" />
              </div>
              <p className="text-2xl font-black font-mono text-white">PKR {summary.totalDebits.toNumber().toLocaleString()}</p>
            </div>

            <div className="p-5 bg-[#0B0F17] border border-white/10 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Total Credits</span>
                <ArrowDownLeft size={18} className="text-amber-400" />
              </div>
              <p className="text-2xl font-black font-mono text-white">PKR {summary.totalCredits.toNumber().toLocaleString()}</p>
            </div>

            <div className="p-5 bg-[#0B0F17] border border-white/10 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Net Position</span>
                <Wallet size={18} className="text-[#08EBF6]" />
              </div>
              <p className={`text-2xl font-black font-mono ${summary.netBalance.toNumber() >= 0 ? 'text-[#08EBF6]' : 'text-red-400'}`}>
                PKR {summary.netBalance.toNumber().toLocaleString()}
              </p>
            </div>

            <div className="p-5 bg-[#0B0F17] border border-white/10 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Active Transactions</span>
                <History size={18} className="text-purple-400" />
              </div>
              <p className="text-2xl font-black font-mono text-white">{summary.entryCount}</p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0B0F17] p-4 rounded-2xl border border-white/10">
            <div className="relative w-full sm:w-96">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search party, phone, ref, or memo..."
                className="w-full bg-[#030712] border border-white/15 p-2.5 pl-10 text-xs text-white rounded-xl outline-none focus:border-[#08EBF6]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {['all', 'today', 'yesterday', 'week', 'month'].map(p => (
                <button
                  key={p}
                  onClick={() => setDatePreset(p as any)}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                    datePreset === p
                      ? 'bg-[#08EBF6]/10 border-[#08EBF6] text-[#08EBF6]'
                      : 'bg-[#030712] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Main Khata Table */}
          <div className="bg-[#0B0F17] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#030712] text-slate-400 uppercase font-black tracking-widest text-[10px] border-b border-white/10">
                  <tr>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Party & Phone</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Description / Memo</th>
                    <th className="p-4">Accounts / Ref</th>
                    <th className="p-4 text-right">Amount (PKR)</th>
                    <th className="p-4 text-right">Running Bal</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-500 font-bold">
                        No transactions found matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map(tx => {
                      const isMoneyIn = tx.debitAmount > 0;
                      const amount = tx.debitAmount || tx.creditAmount;
                      const isReversed = tx.status === 'reversed';

                      return (
                        <tr key={tx.tx_ref} className={`hover:bg-white/[0.02] transition-colors ${isReversed ? 'opacity-40 line-through' : ''}`}>
                          <td className="p-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {format(new Date(tx.date), 'dd MMM yyyy, HH:mm')}
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-white block">{tx.party}</span>
                            {tx.party_phone && <span className="text-[10px] text-slate-400 font-mono">{tx.party_phone}</span>}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              isMoneyIn
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}>
                              {isMoneyIn ? 'Money In' : 'Money Out'}
                            </span>
                          </td>
                          <td className="p-4 text-slate-300 max-w-xs truncate">{tx.description}</td>
                          <td className="p-4 text-[10px] text-slate-400 font-mono">
                            <div>Dr: {tx.debitAccount}</div>
                            <div>Cr: {tx.creditAccount}</div>
                          </td>
                          <td className={`p-4 text-right font-black font-mono text-sm ${isMoneyIn ? 'text-emerald-400' : 'text-red-400'}`}>
                            PKR {amount.toLocaleString()}
                          </td>
                          <td className="p-4 text-right font-black font-mono text-slate-300">
                            PKR {(tx.runningBalance || 0).toLocaleString()}
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => sendWhatsAppReminder(tx)}
                                title="Send WhatsApp Summary"
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                              >
                                <MessageSquare size={14} />
                              </button>
                              <button
                                onClick={() => handlePrint(tx)}
                                title="Print Voucher Slip"
                                className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10"
                              >
                                <Printer size={14} />
                              </button>
                              <button
                                onClick={() => { setDeletingTx(tx); setIsPinModalOpen(true); }}
                                title="Void & Revert Transaction"
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <KhataEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => { setIsEntryModalOpen(false); setEditingTx(null); }}
        onSuccess={msg => {
          setSuccessToast(msg);
          queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
          queryClient.invalidateQueries({ queryKey: ['parties'] });
        }}
        accounts={accounts}
        parties={parties}
        editingEntry={editingTx}
      />

      <AddPartyModal
        isOpen={isPartyModalOpen}
        onClose={() => setIsPartyModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['parties'] });
        }}
      />

      <MasterPinModal
        isOpen={isPinModalOpen}
        onClose={() => { setIsPinModalOpen(false); setDeletingTx(null); }}
        onConfirm={executeRevertTransaction}
        title="Authorize Transaction Reversion"
        description={`Are you sure you want to void transaction ${deletingTx?.tx_ref}? Linked balances will be reverted.`}
      />

      {/* Success Toast */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 right-8 z-[100] bg-[#08EBF6] text-black px-6 py-3.5 flex items-center space-x-3 shadow-2xl rounded-xl font-black uppercase text-xs tracking-widest"
          >
            <CheckCircle2 size={18} />
            <span>{successToast}</span>
            <button onClick={() => setSuccessToast(null)} className="ml-4 opacity-70 hover:opacity-100">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}