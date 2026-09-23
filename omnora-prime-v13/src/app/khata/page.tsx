'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { usePersona } from '@/hooks/usePersona';
import {
  FileText, Plus, Search, BookOpen, Layers,
  ArrowUpRight, ArrowDownLeft, Wallet,
  Printer, CheckCircle2, X, Trash2, Edit3, MessageSquare,
  MapPin, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Decimal } from 'decimal.js';
import { cn } from '@/lib/utils';
import { format, parseISO, subDays, startOfWeek, startOfMonth } from 'date-fns';
import { Skeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/StateViews';
import { useDebounce } from '@/hooks/useDebounce';

import { KhataEntryModal } from '@/components/khata/KhataEntryModal';
import { AddAccountModal } from '@/components/khata/AddAccountModal';
import { LedgerReceipt } from '@/components/khata/LedgerReceipt';
import { MasterPinModal } from '@/components/khata/MasterPinModal';
import { AddPartyModal } from '@/components/parties/AddPartyModal';
import { EditPartyModal } from '@/components/parties/EditPartyModal';
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
  secondary_phone?: string;
  secondaryPhone?: string;
  city?: string;
  party_type: string;
  current_balance: number;
  credit_limit?: number;
  preferred_transport?: string;
  cnic_or_ntn?: string;
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
  const { businessId, t } = usePersona();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'entries' | 'accounts' | 'parties'>('entries');
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  const [selectedPartyForTx, setSelectedPartyForTx] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<GroupedTransaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<GroupedTransaction | null>(null);
  const [printingTx, setPrintingTx] = useState<GroupedTransaction | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');
  const [partyTypeFilter, setPartyTypeFilter] = useState<'all' | 'customer' | 'supplier'>('all');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 1. ACCOUNTS QUERY
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ['accounts', businessId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('accounts')
          .select('*')
          .eq('business_id', businessId)
          .order('account_code');
        if (!error && data) {
          if (typeof window !== 'undefined') {
            try { localStorage.setItem(`noxis_cached_accounts_${businessId}`, JSON.stringify(data)); } catch {}
          }
          return data as Account[];
        }
      } catch {}

      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(`noxis_cached_accounts_${businessId}`);
          if (raw) return JSON.parse(raw) as Account[];
        } catch {}
      }
      return [];
    },
    initialData: () => {
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(`noxis_cached_accounts_${businessId}`);
          if (raw) return JSON.parse(raw) as Account[];
        } catch {}
      }
      return [];
    },
    enabled: !!businessId,
    staleTime: 60_000,
  });

  // 2. PARTIES QUERY
  const { data: parties = [] } = useQuery<Party[]>({
    queryKey: ['parties', businessId],
    queryFn: async () => {
      let cached: Party[] = [];
      if (typeof window !== 'undefined') {
        const keys = [
          businessId ? `noxis_cached_parties_${businessId}` : null,
          `noxis_cached_parties_00000000-0000-0000-0000-000000000000`,
          `noxis_cached_parties`
        ].filter(Boolean) as string[];
        for (const k of keys) {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) {
                cached = parsed;
                break;
              }
            }
          } catch {}
        }
      }

      try {
        let q = supabase
          .from('parties')
          .select('id, name, phone, secondary_phone, city, party_type, current_balance, credit_limit, preferred_transport, cnic_or_ntn')
          .order('name');
        if (businessId) {
          q = q.eq('business_id', businessId);
        }
        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          if (typeof window !== 'undefined' && businessId) {
            try { localStorage.setItem(`noxis_cached_parties_${businessId}`, JSON.stringify(data)); } catch {}
          }
          return data as Party[];
        }
      } catch (err) {
        console.warn('[KhataPage] Remote parties fetch notice:', err);
      }
      return cached;
    },
    initialData: () => {
      if (typeof window !== 'undefined') {
        const keys = [
          businessId ? `noxis_cached_parties_${businessId}` : null,
          `noxis_cached_parties_00000000-0000-0000-0000-000000000000`,
          `noxis_cached_parties`
        ].filter(Boolean) as string[];
        for (const k of keys) {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
          } catch {}
        }
      }
      return [];
    },
    enabled: !!businessId,
    staleTime: 60_000,
  });

  // 3. LEDGER ENTRIES QUERY
  const { data: rawEntries = [], isLoading: entriesLoading, error: entriesError, refetch: refetchEntries } = useQuery<LedgerEntry[]>({
    queryKey: ['ledger_entries', businessId],
    queryFn: async () => {
      let localEntries: any[] = [];
      if (typeof window !== 'undefined') {
        try {
          const cacheKey = `noxis_khata_cache_${businessId}`;
          const rawCache = localStorage.getItem(cacheKey);
          if (rawCache) {
            const parsed = JSON.parse(rawCache);
            if (Array.isArray(parsed.ledger_entries)) localEntries = parsed.ledger_entries;
          }

          const legacyKey = `noxis_cached_ledger_${businessId}`;
          const legacyRaw = localStorage.getItem(legacyKey);
          if (legacyRaw) {
            const legacyParsed = JSON.parse(legacyRaw);
            if (Array.isArray(legacyParsed)) {
              localEntries = [...localEntries, ...legacyParsed];
            }
          }
        } catch {}
      }

      let remoteEntries: any[] = [];
      try {
        const { data, error } = await supabase
          .from('ledger_entries')
          .select('*, accounts(name, type), parties(name, phone, current_balance)')
          .eq('business_id', businessId)
          .order('posted_at', { ascending: false });

        if (!error && data) {
          remoteEntries = data;
        } else {
          const { data: plainEntries } = await supabase
            .from('ledger_entries')
            .select('*')
            .eq('business_id', businessId)
            .order('posted_at', { ascending: false });
          if (plainEntries) remoteEntries = plainEntries;
        }
      } catch (err) {
        console.warn('Supabase ledger fetch notice:', err);
      }

      const accMap = new Map<string, any>(accounts.map(a => [a.id, a]));
      const partyMap = new Map<string, any>(parties.map(p => [p.id, p]));

      const map = new Map<string, any>();
      [...localEntries, ...remoteEntries].forEach((entry: any) => {
        const key = entry.id || `${entry.tx_ref}_${entry.entry_type}_${entry.account_id}`;
        if (!map.has(key)) {
          const acc = accMap.get(entry.account_id);
          const party = partyMap.get(entry.party_id);
          map.set(key, {
            ...entry,
            accounts: entry.accounts || (acc ? { name: acc.name, type: acc.type } : { name: entry.entry_type === 'debit' ? 'Cash Account' : 'Sales Account', type: 'asset' }),
            parties: entry.parties || (party ? { name: party.name, phone: party.phone || party.secondary_phone, current_balance: party.current_balance } : null),
          });
        }
      });

      const merged = Array.from(map.values());
      merged.sort((a, b) => new Date(b.posted_at || b.created_at || 0).getTime() - new Date(a.posted_at || a.created_at || 0).getTime());
      return merged as LedgerEntry[];
    },
    initialData: () => {
      if (typeof window !== 'undefined') {
        try {
          const cacheKey = `noxis_khata_cache_${businessId}`;
          const rawCache = localStorage.getItem(cacheKey);
          if (rawCache) {
            const parsed = JSON.parse(rawCache);
            if (Array.isArray(parsed.ledger_entries) && parsed.ledger_entries.length > 0) {
              return parsed.ledger_entries;
            }
          }
        } catch {}
      }
      return [];
    },
    enabled: !!businessId,
    staleTime: 30_000,
  });

  // Real-time listener for party events
  useEffect(() => {
    const handlePartyEvent = (e: any) => {
      const partyData = e.detail;
      if (partyData) {
        queryClient.setQueryData(['parties', businessId], (old: any) => {
          const arr = Array.isArray(old) ? old : [];
          return [partyData, ...arr.filter((p: Party) => p.id !== partyData.id)];
        });
      }
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['parties_registry'] });
    };

    window.addEventListener('noxis:party-added', handlePartyEvent);
    window.addEventListener('noxis:party-updated', handlePartyEvent);
    return () => {
      window.removeEventListener('noxis:party-added', handlePartyEvent);
      window.removeEventListener('noxis:party-updated', handlePartyEvent);
    };
  }, [businessId, queryClient]);

  // Group ledger entries by tx_ref
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: GroupedTransaction } = {};

    rawEntries.forEach((entry: LedgerEntry) => {
      if (!groups[entry.tx_ref]) {
        groups[entry.tx_ref] = {
          tx_ref: entry.tx_ref,
          date: entry.posted_at,
          description: entry.description,
          party: entry.parties?.name || 'Walk-in Party',
          party_phone: entry.parties?.phone,
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
    for (let i = list.length - 1; i >= 0; i--) {
      const tx = list[i];
      if (tx.status === 'posted') {
        running += (tx.debitAmount - tx.creditAmount);
      }
      tx.runningBalance = running;
    }

    return list;
  }, [rawEntries]);

  const debouncedSearch = useDebounce(searchTerm, 250);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return groupedTransactions.filter(tx => {
      const q = debouncedSearch.toLowerCase();
      const matchesSearch =
        tx.tx_ref.toLowerCase().includes(q) ||
        tx.description.toLowerCase().includes(q) ||
        tx.party.toLowerCase().includes(q) ||
        (tx.party_phone && tx.party_phone.includes(q));

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

  // Auto-reset page on search / filter / tab switch
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, datePreset, partyTypeFilter, activeTab]);

  const totalEntries = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Filtered Parties for Party Accounts Tab
  const filteredPartiesList = useMemo(() => {
    return parties.filter((p: Party) => {
      const q = debouncedSearch.toLowerCase();
      const matchesSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        p.secondary_phone?.includes(q) ||
        p.city?.toLowerCase().includes(q);

      const matchesType =
        partyTypeFilter === 'all' ||
        p.party_type === partyTypeFilter ||
        p.party_type === 'both';

      return matchesSearch && matchesType;
    });
  }, [parties, debouncedSearch, partyTypeFilter]);

  // Summary Cards Data
  const summary = useMemo(() => {
    let debits = new Decimal(0);
    let credits = new Decimal(0);
    rawEntries.forEach((e: LedgerEntry) => {
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
      const result = await KhataService.voidTransaction({
        tx_ref: deletingTx.tx_ref,
        party_id: deletingTx.party_id,
        debitAmount: deletingTx.debitAmount,
        creditAmount: deletingTx.creditAmount,
        currentPartyBalance: parties.find((p: Party) => p.id === deletingTx.party_id)?.current_balance || 0,
      });

      if (result.success) {
        setSuccessToast(`Transaction ${deletingTx.tx_ref} voided and reversed`);
        queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
        queryClient.invalidateQueries({ queryKey: ['parties'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      }
    } catch (err: any) {
      alert(`Could not void transaction: ${err.message}`);
    } finally {
      setDeletingTx(null);
      setIsPinModalOpen(false);
    }
  };

  // Loading skeleton
  const hasNoData = accounts.length === 0 && parties.length === 0 && rawEntries.length === 0;
  if (accountsLoading && entriesLoading && hasNoData) {
    return (
      <div className="p-6 bg-[#0B0E14] min-h-screen space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40 rounded-[4px]" />
          <Skeleton className="h-8 w-28 rounded-[4px]" />
        </div>
        <TableSkeleton rows={8} cols={6} />
      </div>
    );
  }

  if (entriesError && hasNoData) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-6">
        <ErrorState
          message="Could not load Khata registry"
          detail={(entriesError as Error).message}
          onRetry={refetchEntries}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-300 font-sans selection:bg-white/10 selection:text-white">
      {/* Thermal / PDF Receipt Component */}
      {printingTx && <LedgerReceipt transaction={printingTx} />}

      <main className="min-h-screen flex flex-col">
        {/* Header Banner */}
        <header className="h-14 border-b border-white/[0.08] flex items-center px-6 bg-[#0E121B] sticky top-0 z-40">
          <div className="flex items-center gap-2.5">
            <BookOpen className="text-slate-400" size={16} strokeWidth={1.5} />
            <h1 className="text-sm font-semibold tracking-tight text-white">
              {t('ledger') || 'Khata Dual-Entry Ledger'}
            </h1>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <nav className="flex h-14 items-center mr-2">
              {[
                { id: 'entries', label: 'Ledger Entries', icon: FileText },
                { id: 'parties', label: `Party Accounts (${parties.length})`, icon: Wallet },
                { id: 'accounts', label: 'Chart of Accounts', icon: Layers },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'px-3.5 h-full flex items-center gap-2 text-xs font-medium transition-colors duration-100 border-b-2 cursor-pointer',
                    activeTab === tab.id
                      ? 'text-white border-white bg-white/[0.03]'
                      : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/[0.02]'
                  )}
                >
                  <tab.icon size={14} strokeWidth={1.5} className={activeTab === tab.id ? 'text-slate-200' : 'text-slate-500'} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            <button
              onClick={() => setIsPartyModalOpen(true)}
              className="h-8 px-2.5 flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.08] text-slate-300 text-xs font-medium hover:bg-white/[0.06] hover:text-white rounded-[4px] transition-colors duration-100 cursor-pointer"
            >
              <UserPlus size={14} strokeWidth={1.5} className="text-slate-400" />
              <span>Add Party</span>
            </button>

            <button
              onClick={() => { setSelectedPartyForTx(null); setEditingTx(null); setIsEntryModalOpen(true); }}
              className="h-8 px-3 flex items-center gap-1.5 bg-white text-slate-950 text-xs font-medium rounded-[4px] hover:bg-slate-100 transition-colors duration-100 cursor-pointer"
            >
              <Plus size={14} strokeWidth={1.5} />
              <span>Post Transaction</span>
            </button>
          </div>
        </header>

        <div className="p-6 max-w-[1600px] mx-auto space-y-6 w-full flex-1">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 bg-[#131823] border border-white/[0.08] rounded-[6px] space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[11px] font-medium text-slate-400">Total Debits</span>
                <ArrowUpRight size={15} strokeWidth={1.5} className="text-emerald-400" />
              </div>
              <p className="text-lg font-medium font-mono tabular-nums text-slate-100">
                PKR {summary.totalDebits.toNumber().toLocaleString()}
              </p>
            </div>

            <div className="p-4 bg-[#131823] border border-white/[0.08] rounded-[6px] space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[11px] font-medium text-slate-400">Total Credits</span>
                <ArrowDownLeft size={15} strokeWidth={1.5} className="text-amber-400" />
              </div>
              <p className="text-lg font-medium font-mono tabular-nums text-slate-100">
                PKR {summary.totalCredits.toNumber().toLocaleString()}
              </p>
            </div>

            <div className="p-4 bg-[#131823] border border-white/[0.08] rounded-[6px] space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[11px] font-medium text-slate-400">Net Position</span>
                <Wallet size={15} strokeWidth={1.5} className="text-slate-400" />
              </div>
              <p className={`text-lg font-medium font-mono tabular-nums ${summary.netBalance.toNumber() >= 0 ? 'text-slate-100' : 'text-rose-400'}`}>
                PKR {summary.netBalance.toNumber().toLocaleString()}
              </p>
            </div>

            <div className="p-4 bg-[#131823] border border-white/[0.08] rounded-[6px] space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[11px] font-medium text-slate-400">Linked Parties</span>
                <span className="text-[10px] font-mono text-slate-500">REGISTRY</span>
              </div>
              <p className="text-lg font-medium font-mono tabular-nums text-slate-100">{parties.length}</p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#131823] p-2.5 rounded-[6px] border border-white/[0.08]">
            <div className="relative w-full sm:w-80">
              <Search size={14} strokeWidth={1.5} className="absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={activeTab === 'parties' ? "Search by party name, city, phone..." : "Search party, phone, ref, or memo..."}
                className="w-full h-8 bg-[#0B0E14] border border-white/[0.08] pl-8 pr-2.5 text-xs text-slate-200 rounded-[4px] outline-none focus:border-white/20 placeholder:text-slate-500 transition-colors duration-100"
              />
            </div>

            {activeTab === 'entries' && (
              <div className="flex items-center gap-1 w-full sm:w-auto">
                {['all', 'today', 'yesterday', 'week', 'month'].map(p => (
                  <button
                    key={p}
                    onClick={() => setDatePreset(p as any)}
                    className={cn(
                      'h-7 px-2.5 text-xs rounded-[4px] border transition-colors duration-100 capitalize cursor-pointer',
                      datePreset === p
                        ? 'bg-white/[0.08] border-white/20 text-white font-medium'
                        : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'parties' && (
              <div className="flex items-center gap-1 w-full sm:w-auto">
                {[
                  { val: 'all', label: 'All' },
                  { val: 'customer', label: 'Customers' },
                  { val: 'supplier', label: 'Suppliers' }
                ].map(f => (
                  <button
                    key={f.val}
                    onClick={() => setPartyTypeFilter(f.val as any)}
                    className={cn(
                      'h-7 px-2.5 text-xs rounded-[4px] border transition-colors duration-100 cursor-pointer',
                      partyTypeFilter === f.val
                        ? 'bg-white/[0.08] border-white/20 text-white font-medium'
                        : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TAB CONTENT: 1. LEDGER ENTRIES */}
          {activeTab === 'entries' && (
            <div className="bg-[#0E131F]/50 border border-white/[0.08] rounded-[8px] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#0E121B] text-slate-400 font-medium text-[11px] border-b border-white/[0.08]">
                    <tr>
                      <th className="px-3.5 py-2 font-medium">Date &amp; Time</th>
                      <th className="px-3.5 py-2 font-medium">Party &amp; Phone</th>
                      <th className="px-3.5 py-2 font-medium">Type</th>
                      <th className="px-3.5 py-2 font-medium">Description</th>
                      <th className="px-3.5 py-2 font-medium">Accounts / Ref</th>
                      <th className="px-3.5 py-2 text-right font-medium">Amount (PKR)</th>
                      <th className="px-3.5 py-2 text-right font-medium">Running Bal</th>
                      <th className="px-3.5 py-2 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] font-normal">
                    {filteredTransactions.length === 0 ? (
                      <>
                        <tr className="h-10 border-b border-white/[0.04]">
                          <td colSpan={8} className="py-8 text-center text-slate-500 font-normal">
                            No transactions found matching search criteria.
                          </td>
                        </tr>
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <tr key={`ghost-empty-${idx}`} className="h-10 border-b border-white/[0.04] select-none pointer-events-none">
                            <td colSpan={8} className="px-3.5 py-2 text-transparent font-mono text-[11px]">—</td>
                          </tr>
                        ))}
                      </>
                    ) : (
                      <>
                        {paginatedTransactions.map(tx => {
                          const isMoneyIn = tx.debitAmount > 0;
                          const amount = tx.debitAmount || tx.creditAmount;
                          const isReversed = tx.status === 'reversed';

                          return (
                            <tr key={tx.tx_ref} className={cn('h-10 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors duration-100', isReversed && 'opacity-40 line-through')}>
                              <td className="px-3.5 py-2 text-slate-400 font-mono tabular-nums text-[11px] whitespace-nowrap">
                                {format(new Date(tx.date), 'dd MMM yyyy, HH:mm')}
                              </td>
                              <td className="px-3.5 py-2">
                                <span className="font-medium text-slate-200 block truncate max-w-[180px]">{tx.party}</span>
                                {tx.party_phone && <span className="text-[10px] text-slate-500 font-mono tabular-nums">{tx.party_phone}</span>}
                              </td>
                              <td className="px-3.5 py-2 whitespace-nowrap">
                                <span className={cn(
                                  'px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono border',
                                  isMoneyIn
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                )}>
                                  {isMoneyIn ? 'Money In' : 'Money Out'}
                                </span>
                              </td>
                              <td className="px-3.5 py-2 text-slate-300 max-w-xs truncate">{tx.description}</td>
                              <td className="px-3.5 py-2 text-[11px] text-slate-400 font-mono tabular-nums">
                                <div>Dr: {tx.debitAccount}</div>
                                <div>Cr: {tx.creditAccount}</div>
                              </td>
                              <td className={cn('px-3.5 py-2 text-right font-mono tabular-nums text-xs font-medium', isMoneyIn ? 'text-emerald-400' : 'text-slate-200')}>
                                PKR {amount.toLocaleString()}
                              </td>
                              <td className="px-3.5 py-2 text-right font-mono tabular-nums text-xs text-slate-400">
                                PKR {(tx.runningBalance || 0).toLocaleString()}
                              </td>
                              <td className="px-3.5 py-2 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => sendWhatsAppReminder(tx)}
                                    title="Send WhatsApp Summary"
                                    className="p-1 rounded-[4px] text-slate-400 hover:text-emerald-400 hover:bg-white/[0.04] transition-colors duration-100 cursor-pointer"
                                  >
                                    <MessageSquare size={14} strokeWidth={1.5} />
                                  </button>
                                  <button
                                    onClick={() => handlePrint(tx)}
                                    title="Print Voucher Slip"
                                    className="p-1 rounded-[4px] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors duration-100 cursor-pointer"
                                  >
                                    <Printer size={14} strokeWidth={1.5} />
                                  </button>
                                  <button
                                    onClick={() => { setDeletingTx(tx); setIsPinModalOpen(true); }}
                                    title="Void &amp; Revert Transaction"
                                    className="p-1 rounded-[4px] text-slate-400 hover:text-rose-400 hover:bg-white/[0.04] transition-colors duration-100 cursor-pointer"
                                  >
                                    <Trash2 size={14} strokeWidth={1.5} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {/* Empty canvas mitigation: subtle muted placeholder grid lines if records < 6 */}
                        {paginatedTransactions.length < 6 && (
                          Array.from({ length: 6 - paginatedTransactions.length }).map((_, idx) => (
                            <tr key={`ghost-row-${idx}`} className="h-10 border-b border-white/[0.04] select-none pointer-events-none">
                              <td className="px-3.5 py-2 text-transparent font-mono text-[11px]">—</td>
                              <td className="px-3.5 py-2 text-transparent">—</td>
                              <td className="px-3.5 py-2 text-transparent">—</td>
                              <td className="px-3.5 py-2 text-transparent">—</td>
                              <td className="px-3.5 py-2 text-transparent">—</td>
                              <td className="px-3.5 py-2 text-transparent">—</td>
                              <td className="px-3.5 py-2 text-transparent">—</td>
                              <td className="px-3.5 py-2 text-transparent">—</td>
                            </tr>
                          ))
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Compact bottom pagination / status bar */}
              <div className="px-3.5 py-2.5 bg-[#0E121B] border-t border-white/[0.08] flex items-center justify-between">
                <span className="text-xs font-mono text-slate-500">
                  Showing {totalEntries > 0 ? (currentPage - 1) * pageSize + 1 : 0} of {totalEntries} entries
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="h-7 px-2.5 text-xs font-mono border border-white/[0.08] rounded-[4px] bg-white/[0.02] hover:bg-white/[0.06] text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="h-7 px-2.5 text-xs font-mono border border-white/[0.08] rounded-[4px] bg-white/[0.02] hover:bg-white/[0.06] text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 2. PARTY ACCOUNTS */}
          {activeTab === 'parties' && (
            <div className="bg-[#0E131F]/50 border border-white/[0.08] rounded-[8px] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#0E121B] text-slate-400 font-medium text-[11px] border-b border-white/[0.08]">
                    <tr>
                      <th className="px-3.5 py-2 font-medium">Party Name</th>
                      <th className="px-3.5 py-2 font-medium">Role</th>
                      <th className="px-3.5 py-2 font-medium">City / Hub</th>
                      <th className="px-3.5 py-2 font-medium">Contacts</th>
                      <th className="px-3.5 py-2 text-right font-medium">Balance (PKR)</th>
                      <th className="px-3.5 py-2 text-right font-medium">Credit Limit</th>
                      <th className="px-3.5 py-2 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] font-normal">
                    {filteredPartiesList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500 font-normal">
                          No parties found. Click "+ Add Party" above to create one.
                        </td>
                      </tr>
                    ) : (
                      filteredPartiesList.map((p: Party) => {
                        const bal = Number(p.current_balance || 0);
                        const isReceivable = bal >= 0;
                        const creditLimit = Number(p.credit_limit || 0);
                        const isExceeded = creditLimit > 0 && Math.abs(bal) > creditLimit;

                        return (
                          <tr key={p.id} className="h-10 hover:bg-white/[0.02] transition-colors duration-100">
                            <td className="px-3.5 py-2">
                              <span className="font-medium text-slate-200 block truncate max-w-[200px]">{p.name}</span>
                              {p.preferred_transport && (
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <span>Transport:</span> {p.preferred_transport}
                                </span>
                              )}
                            </td>
                            <td className="px-3.5 py-2 whitespace-nowrap">
                              <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono border bg-white/[0.04] text-slate-300 border-white/[0.08] capitalize">
                                {p.party_type}
                              </span>
                            </td>
                            <td className="px-3.5 py-2 text-slate-300">
                              <span className="flex items-center gap-1 text-xs">
                                <MapPin size={12} strokeWidth={1.5} className="text-slate-500" />
                                {p.city || '—'}
                              </span>
                            </td>
                            <td className="px-3.5 py-2 text-xs font-mono tabular-nums text-slate-400">
                              <div>{p.phone || '—'}</div>
                              {p.secondary_phone && (
                                <div className="text-[10px] text-slate-500">Munshi: {p.secondary_phone}</div>
                              )}
                            </td>
                            <td className="px-3.5 py-2 text-right">
                              <span className={cn('font-mono tabular-nums text-xs font-medium block', isReceivable ? 'text-emerald-400' : 'text-amber-400')}>
                                PKR {Math.abs(bal).toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {isReceivable ? 'Receivable' : 'Payable'}
                              </span>
                            </td>
                            <td className="px-3.5 py-2 text-right font-mono tabular-nums text-xs">
                              {creditLimit > 0 ? (
                                <span className={isExceeded ? 'text-rose-400 font-medium' : 'text-slate-400'}>
                                  PKR {creditLimit.toLocaleString()}
                                  {isExceeded && <span className="block text-[9px] text-rose-400 font-mono">BREACHED</span>}
                                </span>
                              ) : (
                                <span className="text-slate-600">No Limit</span>
                              )}
                            </td>
                            <td className="px-3.5 py-2 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedPartyForTx(p.id);
                                    setEditingTx(null);
                                    setIsEntryModalOpen(true);
                                  }}
                                  className="h-7 px-2 rounded-[4px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs font-medium transition-colors duration-100 cursor-pointer"
                                >
                                  Post Entry
                                </button>
                                <button
                                  onClick={() => setEditingParty(p)}
                                  title="Edit Wholesale Details"
                                  className="p-1 rounded-[4px] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors duration-100 cursor-pointer"
                                >
                                  <Edit3 size={13} strokeWidth={1.5} />
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
          )}

          {/* TAB CONTENT: 3. CHART OF ACCOUNTS */}
          {activeTab === 'accounts' && (
            <div className="bg-[#0E131F]/50 border border-white/[0.08] rounded-[8px] overflow-hidden">
              <div className="p-3 border-b border-white/[0.08] flex justify-between items-center bg-[#0E121B]">
                <h3 className="text-xs font-medium text-slate-200">General Ledger Accounts</h3>
                <button
                  onClick={() => setIsAccountModalOpen(true)}
                  className="h-7 px-2.5 bg-white/[0.04] border border-white/[0.08] text-slate-300 text-xs font-medium rounded-[4px] hover:bg-white/[0.08] hover:text-white transition-colors duration-100 cursor-pointer"
                >
                  + Add Account
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#0E121B] text-slate-400 font-medium text-[11px] border-b border-white/[0.08]">
                    <tr>
                      <th className="px-3.5 py-2 font-medium">Code</th>
                      <th className="px-3.5 py-2 font-medium">Account Name</th>
                      <th className="px-3.5 py-2 font-medium">Account Type</th>
                      <th className="px-3.5 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] font-normal">
                    {accounts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500 font-normal">
                          No custom accounts configured. Default cash/bank accounts active.
                        </td>
                      </tr>
                    ) : (
                      accounts.map((acc: Account) => (
                        <tr key={acc.id} className="h-10 hover:bg-white/[0.02] transition-colors duration-100">
                          <td className="px-3.5 py-2 font-mono tabular-nums text-slate-400">{acc.account_code}</td>
                          <td className="px-3.5 py-2 font-medium text-slate-200">{acc.name}</td>
                          <td className="px-3.5 py-2 text-slate-400 capitalize text-xs">{acc.type}</td>
                          <td className="px-3.5 py-2">
                            <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <KhataEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => { setIsEntryModalOpen(false); setEditingTx(null); setSelectedPartyForTx(null); }}
        onSuccess={msg => {
          setSuccessToast(msg);
          queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
          queryClient.invalidateQueries({ queryKey: ['parties'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
        }}
        accounts={accounts}
        parties={parties}
        editingEntry={editingTx}
        preselectedPartyId={selectedPartyForTx}
      />

      <AddPartyModal
        isOpen={isPartyModalOpen}
        onClose={() => setIsPartyModalOpen(false)}
        onSuccess={newParty => {
          setSuccessToast(`Party ${newParty?.name || ''} created successfully`);
          queryClient.setQueryData(['parties', businessId], (old: any) => {
            const arr = Array.isArray(old) ? old : [];
            return [newParty, ...arr.filter((p: Party) => p.id !== newParty.id)];
          });
          queryClient.invalidateQueries({ queryKey: ['parties'] });
          queryClient.invalidateQueries({ queryKey: ['parties_registry'] });
          setIsPartyModalOpen(false);
        }}
      />

      <EditPartyModal
        isOpen={!!editingParty}
        party={editingParty}
        onClose={() => setEditingParty(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['parties'] });
          queryClient.invalidateQueries({ queryKey: ['parties_registry'] });
          queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
        }}
      />

      {isAccountModalOpen && (
        <AddAccountModal
          onClose={() => setIsAccountModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            setIsAccountModalOpen(false);
          }}
        />
      )}

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
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-6 right-6 z-[100] bg-[#131823] border border-white/[0.12] text-slate-200 px-4 py-2.5 flex items-center gap-2.5 rounded-[6px] shadow-lg text-xs"
          >
            <CheckCircle2 size={15} strokeWidth={1.5} className="text-emerald-400" />
            <span>{successToast}</span>
            <button onClick={() => setSuccessToast(null)} className="ml-3 text-slate-500 hover:text-slate-300 cursor-pointer">
              <X size={14} strokeWidth={1.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}