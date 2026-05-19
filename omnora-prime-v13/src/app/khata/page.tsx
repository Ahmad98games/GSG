"use client";

import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import EmptyState from "@/components/ui/EmptyState";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { usePersona } from "@/hooks/usePersona";
import { useSidebarState } from "@/hooks/useSidebarState";
import { 
  FileText, Plus, Search, Filter, ArrowRightLeft,
  CheckCircle2, X, BookOpen, Layers, History,
  ArrowUpRight, ArrowDownLeft, Wallet, PieChart,
  Printer, ChevronDown, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  createColumnHelper, 
  flexRender, 
  getCoreRowModel, 
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel
} from "@tanstack/react-table";
import { Decimal } from "decimal.js";
import { cn } from "@/lib/utils";
import { format, isWithinInterval, parseISO } from "date-fns";

// Components
import { KhataEntryModal } from "@/components/khata/KhataEntryModal";
import { AddAccountModal } from "@/components/khata/AddAccountModal";
import { LedgerReceipt } from "@/components/khata/LedgerReceipt";

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
  party_type: string;
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
  accounts: { name: string, type: string };
  parties: { name: string } | null;
}

interface GroupedTransaction {
  tx_ref: string;
  date: string;
  description: string;
  party: string;
  party_id: string | null;
  debitAccount: string;
  creditAccount: string;
  debitAmount: number;
  creditAmount: number;
  status: 'posted' | 'reversed' | 'pending';
  originalEntries: LedgerEntry[];
  accountType?: string;
}

const columnHelper = createColumnHelper<GroupedTransaction>();

// --- Main Component ---

export default function KhataPage() {
  const { profile } = useBusinessProfile();
  const { businessId, t, fmt, fmtDate } = usePersona();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'entries' | 'accounts' | 'invoices'>('entries');
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [printingTx, setPrintingTx] = useState<GroupedTransaction | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [partyFilter, setPartyFilter] = useState("all");
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: ""
  });
  const [showFilters, setShowFilters] = useState(false);

  // Queries
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts', businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from('accounts').select('*').eq('business_id', businessId).order('account_code');
      if (error) throw error;
      return data as Account[];
    },
    enabled: !!businessId,
  });

  const { data: parties = [] } = useQuery({
    queryKey: ['parties', businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from('parties').select('id, name, party_type').eq('business_id', businessId);
      if (error) throw error;
      return data as Party[];
    },
    enabled: !!businessId,
  });

  const { data: rawEntries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['ledger_entries', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ledger_entries')
        .select('*, accounts(name, type), parties(name)')
        .eq('business_id', businessId)
        .order('posted_at', { ascending: false });
      if (error) throw error;
      return data as LedgerEntry[];
    },
    enabled: !!businessId,
  });

  // Grouping logic for transactions
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, GroupedTransaction> = {};
    rawEntries.forEach(entry => {
      if (!groups[entry.tx_ref]) {
        groups[entry.tx_ref] = {
          tx_ref: entry.tx_ref,
          date: entry.posted_at,
          description: entry.description,
          party: entry.parties?.name || "—",
          party_id: entry.party_id,
          debitAccount: "—",
          creditAccount: "—",
          debitAmount: 0,
          creditAmount: 0,
          status: entry.status,
          originalEntries: [],
          accountType: entry.accounts?.type
        };
      }
      groups[entry.tx_ref].originalEntries.push(entry);
      if (entry.entry_type === 'debit') {
        groups[entry.tx_ref].debitAccount = entry.accounts?.name;
        groups[entry.tx_ref].debitAmount += entry.amount;
      } else {
        groups[entry.tx_ref].creditAccount = entry.accounts?.name;
        groups[entry.tx_ref].creditAmount += entry.amount;
      }
    });
    return Object.values(groups);
  }, [rawEntries]);

  // Filtering Logic
  const filteredTransactions = useMemo(() => {
    return groupedTransactions.filter(tx => {
      const matchesSearch = tx.tx_ref.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           tx.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesParty = partyFilter === "all" || tx.party_id === partyFilter;
      const matchesAccountType = accountTypeFilter === "all" || tx.accountType === accountTypeFilter;
      
      let matchesDate = true;
      if (dateRange.start && dateRange.end) {
        const txDate = parseISO(tx.date);
        matchesDate = isWithinInterval(txDate, {
          start: parseISO(dateRange.start),
          end: parseISO(dateRange.end)
        });
      }

      return matchesSearch && matchesParty && matchesAccountType && matchesDate;
    });
  }, [groupedTransactions, searchTerm, partyFilter, accountTypeFilter, dateRange]);

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
      entryCount: groupedTransactions.length
    };
  }, [rawEntries, groupedTransactions]);

  const handlePrint = (tx: GroupedTransaction) => {
    setPrintingTx(tx);
    setTimeout(() => {
      window.print();
      setPrintingTx(null);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200">
      <main className="transition-all duration-300 min-h-screen flex flex-col">
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
           <div className="flex items-center space-x-3">
              <BookOpen className="text-electric-blue" size={20} />
              <h1 className="text-xl font-semibold tracking-tight text-white">{t('ledger') || "Khata Registry"}</h1>
           </div>

           <div className="ml-auto flex items-center space-x-6">
              <nav className="flex h-16 items-center">
                 {[
                   { id: 'entries', label: 'Entries', icon: FileText },
                   { id: 'accounts', label: 'Accounts', icon: Layers },
                   { id: 'invoices', label: 'Invoices', icon: PieChart },
                 ].map((tab) => (
                   <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'entries' | 'accounts' | 'invoices')}
                    className={cn(
                      "px-6 h-full flex items-center space-x-2 text-[10px] uppercase tracking-widest font-black transition-all border-b-2",
                      activeTab === tab.id 
                        ? "text-electric-blue border-electric-blue bg-white/5" 
                        : "text-gray-500 border-transparent hover:text-white hover:bg-white/[0.02]"
                    )}
                   >
                      <tab.icon size={14} />
                      <span>{tab.label}</span>
                   </button>
                 ))}
              </nav>

              <button 
                onClick={() => setIsEntryModalOpen(true)}
                className="ml-4 flex items-center space-x-2 px-4 py-2 bg-electric-blue text-onyx text-[10px] uppercase tracking-widest font-bold hover:brightness-110 transition-all shadow-lg"
              >
                 <Plus size={14} />
                 <span>Post Entry</span>
              </button>
           </div>
        </header>

        <div className="p-8 max-w-full mx-auto space-y-8 w-full flex-1">
           <AnimatePresence mode="wait">
              {activeTab === 'entries' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  key="entries"
                  className="space-y-8"
                >
                   {/* Summary Cards */}
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <SummaryCard label="Total Debits" value={summary.totalDebits} icon={ArrowUpRight} />
                      <SummaryCard label="Total Credits" value={summary.totalCredits} icon={ArrowDownLeft} />
                      <SummaryCard label="Net Balance" value={summary.netBalance} icon={Wallet} />
                      <SummaryCard label="Entry Count" value={summary.entryCount} icon={History} />
                   </div>

                   {/* Search & Filter Header */}
                   <div className="bg-[#1A1D21] border border-white/5 p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="relative w-96">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input 
                            type="text" 
                            placeholder="Search by Reference or Description..." 
                            className="w-full bg-[#0F1113] border border-white/5 pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-electric-blue/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                              "flex items-center space-x-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border transition-all",
                              showFilters ? "bg-white/10 border-white/20 text-white" : "bg-[#0F1113] border-white/5 text-gray-500 hover:text-white"
                            )}
                          >
                            <Filter size={14} />
                            <span>Advanced Filters</span>
                            <ChevronDown size={14} className={cn("transition-transform", showFilters && "rotate-180")} />
                          </button>
                          <button 
                            onClick={() => {
                              setSearchTerm("");
                              setPartyFilter("all");
                              setAccountTypeFilter("all");
                              setDateRange({ start: "", end: "" });
                            }}
                            className="text-[10px] font-bold text-gray-600 hover:text-white uppercase tracking-widest"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {showFilters && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-white/5 overflow-hidden"
                          >
                            <div className="space-y-2">
                              <label className="text-[9px] uppercase font-black text-gray-600 tracking-widest">Filter by Party</label>
                              <select 
                                value={partyFilter}
                                onChange={(e) => setPartyFilter(e.target.value)}
                                className="w-full bg-[#0F1113] border border-white/5 p-2.5 text-[10px] text-white outline-none"
                              >
                                <option value="all">All Parties</option>
                                {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] uppercase font-black text-gray-600 tracking-widest">Account Type</label>
                              <select 
                                value={accountTypeFilter}
                                onChange={(e) => setAccountTypeFilter(e.target.value)}
                                className="w-full bg-[#0F1113] border border-white/5 p-2.5 text-[10px] text-white outline-none"
                              >
                                <option value="all">All Types</option>
                                <option value="asset">Assets</option>
                                <option value="liability">Liabilities</option>
                                <option value="equity">Equity</option>
                                <option value="revenue">Revenue</option>
                                <option value="expense">Expenses</option>
                              </select>
                            </div>
                            <div className="space-y-2 col-span-2">
                              <label className="text-[9px] uppercase font-black text-gray-600 tracking-widest">Date Range</label>
                              <div className="flex items-center space-x-2">
                                <div className="relative flex-1">
                                  <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700" />
                                  <input 
                                    type="date" 
                                    className="w-full bg-[#0F1113] border border-white/5 pl-9 pr-3 py-2.5 text-[10px] text-white outline-none" 
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                  />
                                </div>
                                <span className="text-gray-700 text-[10px] uppercase font-black">To</span>
                                <div className="relative flex-1">
                                  <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700" />
                                  <input 
                                    type="date" 
                                    className="w-full bg-[#0F1113] border border-white/5 pl-9 pr-3 py-2.5 text-[10px] text-white outline-none" 
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>

                   {/* Entries Table */}
                   <EntriesTable 
                      data={filteredTransactions} 
                      loading={entriesLoading} 
                      onPrint={handlePrint}
                      onReverse={(tx) => handleReverse(tx, supabase, queryClient, setSuccessToast)} 
                   />
                </motion.div>
              )}

              {activeTab === 'accounts' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  key="accounts"
                >
                   <ChartOfAccounts accounts={accounts} entries={rawEntries} loading={accountsLoading} onAdd={() => setIsAccountModalOpen(true)} />
                </motion.div>
              )}

              {activeTab === 'invoices' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  key="invoices"
                >
                   <InvoicesTab />
                </motion.div>
              )}
           </AnimatePresence>
        </div>


      </main>

      {/* Modals */}
      <KhataEntryModal 
        isOpen={isEntryModalOpen} 
        onClose={() => setIsEntryModalOpen(false)} 
        onSuccess={(msg) => {
          setSuccessToast(msg);
          queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
          queryClient.invalidateQueries({ queryKey: ['parties'] });
        }}
        accounts={accounts}
        parties={parties}
      />

      <AnimatePresence>
        {isAccountModalOpen && (
          <AddAccountModal 
            onClose={() => setIsAccountModalOpen(false)} 
            onSuccess={() => {
              setIsAccountModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ['accounts'] });
              setSuccessToast("Ledger account successfully registered.");
            }}
          />
        )}
      </AnimatePresence>

      <LedgerReceipt transaction={printingTx} />

      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 right-24 z-[100] bg-emerald text-onyx px-6 py-3 flex items-center space-x-3 shadow-2xl rounded-sm font-bold uppercase text-xs tracking-widest"
          >
            <CheckCircle2 size={18} />
            <span>{successToast}</span>
            <button onClick={() => setSuccessToast(null)} className="ml-4 opacity-50 hover:opacity-100"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print\:block, .print\:block * { visibility: visible; }
          .print\:block { position: fixed; left: 0; top: 0; }
        }
      `}</style>
    </div>
  );
}

// --- Sub-Components ---

function SummaryCard({ label, value, icon: Icon }: { label: string, value: Decimal | number, icon: React.ElementType }) {
  const { fmt } = usePersona();
  return (
    <div className="bg-[#1A1D21] border border-white/5 p-6 flex items-center justify-between group hover:border-electric-blue/30 transition-all">
       <div className="space-y-1">
          <p className="text-xxs font-semibold tracking-wide-md uppercase text-gray-500">{label}</p>
          <p className="financial text-xl text-sandstone-gold font-bold">{fmt(value)}</p>
       </div>
       <div className="p-3 bg-[#0F1113] border border-white/5 text-gray-700 group-hover:text-electric-blue transition-colors">
          <Icon size={20} />
       </div>
    </div>
  );
}

function EntriesTable({ data, loading, onReverse, onPrint }: { data: GroupedTransaction[], loading: boolean, onReverse: (tx: GroupedTransaction) => void, onPrint: (tx: GroupedTransaction) => void }) {
  const { fmt, fmtDate } = usePersona();
  
  const columns = useMemo(() => [
    columnHelper.accessor("date", {
      header: "Date",
      cell: (info) => <span className="text-gray-500 text-xs">{fmtDate(info.getValue())}</span>,
    }),
    columnHelper.accessor("tx_ref", {
      header: "Entry #",
      cell: (info) => <span className="financial text-sandstone-gold text-xs">{info.getValue()}</span>,
    }),
    columnHelper.accessor("description", {
      header: "Description",
      cell: (info) => <span className="text-white text-xs max-w-[200px] truncate block">{info.getValue()}</span>,
    }),
    columnHelper.accessor("party", {
      header: "Party",
      cell: (info) => <span className="text-gray-400 text-xs">{info.getValue()}</span>,
    }),
    columnHelper.accessor("debitAccount", {
      header: "Account (Debit)",
      cell: (info) => <span className="text-gray-500 text-xs">{info.getValue()}</span>,
    }),
    columnHelper.accessor("creditAccount", {
      header: "Account (Credit)",
      cell: (info) => <span className="text-gray-500 text-xs">{info.getValue()}</span>,
    }),
    columnHelper.accessor("debitAmount", {
      header: () => <div className="text-right">Debit</div>,
      cell: (info) => <div className="text-right financial text-sandstone-gold text-xs">{fmt(info.getValue())}</div>,
    }),
    columnHelper.accessor("creditAmount", {
      header: () => <div className="text-right">Credit</div>,
      cell: (info) => <div className="text-right financial text-sandstone-gold text-xs">{fmt(info.getValue())}</div>,
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => {
        const s = info.getValue();
        return (
          <span className={cn(
            "status-pill",
            s === 'posted' ? "bg-emerald-500/10 text-emerald-500" : 
            s === 'pending' ? "bg-blue-500/10 text-blue-400" : 
            "bg-gray-500/10 text-gray-500 line-through"
          )}>
            {s}
          </span>
        );
      }
    }),
    columnHelper.display({
      id: "actions",
      cell: (info) => (
        <div className="flex justify-end space-x-3">
           <button 
            onClick={() => onPrint(info.row.original)}
            className="flex items-center space-x-1 text-[10px] uppercase font-bold text-gray-600 hover:text-white transition-colors"
           >
             <Printer size={12} />
             <span>Print</span>
           </button>
           {info.row.original.status === 'posted' && (
             <button onClick={() => onReverse(info.row.original)} className="text-[10px] uppercase font-bold text-red-500/60 hover:text-red-500 transition-colors">Reverse</button>
           )}
        </div>
      ),
    }),
  ], [fmt, fmtDate, onReverse, onPrint]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } }
  });

  return (
    <div className="bg-[#1A1D21] border border-white/5">
       {loading ? (
         <div className="p-20 space-y-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-white/[0.02] animate-pulse" />)}
         </div>
       ) : (
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-[#0F1113]/50 border-b border-white/10">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className="px-6 py-4 table-header">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
               </thead>
               <tbody className="divide-y divide-white/5">
                  {table.getRowModel().rows.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-20 text-center">
                        <div className="flex flex-col items-center justify-center opacity-30 italic">
                          <History size={40} strokeWidth={1} />
                          <p className="mt-4 text-[10px] uppercase font-black tracking-widest">No ledger transactions recorded</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {table.getRowModel().rows.map((row, i) => (
                    <tr key={row.id} className={cn("hover:bg-white/[0.02] transition-colors", i % 2 === 1 && "bg-white/[0.01]")}>
                       {row.getVisibleCells().map(cell => (
                         <td key={cell.id} className="px-6 py-4">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                         </td>
                       ))}
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
       )}
    </div>
  );
}

function ChartOfAccounts({ accounts, entries, loading, onAdd }: { accounts: Account[], entries: LedgerEntry[], loading: boolean, onAdd: () => void }) {
  const { fmt } = usePersona();

  const balances = useMemo(() => {
    const bals: Record<string, Decimal> = {};
    entries.forEach(e => {
      if (e.status !== 'posted') return;
      if (!bals[e.account_id]) bals[e.account_id] = new Decimal(0);
      if (e.entry_type === 'debit') bals[e.account_id] = bals[e.account_id].plus(new Decimal(e.amount));
      else bals[e.account_id] = bals[e.account_id].minus(new Decimal(e.amount));
    });
    return bals;
  }, [entries]);

  const grouped = useMemo(() => {
    const groups: Record<string, Account[]> = {
      asset: [], liability: [], equity: [], revenue: [], expense: []
    };
    accounts.forEach(a => groups[a.type].push(a));
    return groups;
  }, [accounts]);

  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between">
          <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">Chart of Accounts</h2>
              <p className="text-xxs font-semibold tracking-wide-md uppercase text-gray-500 mt-1">Global Financial Backbone</p>
          </div>
          <button onClick={onAdd} className="px-6 py-2.5 bg-electric-blue text-onyx text-[10px] uppercase font-black tracking-widest hover:brightness-110 shadow-lg transition-all">
             Initialize New Account
          </button>
       </div>

       {loading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1,2,3,4].map(i => <div key={i} className="h-64 bg-white/[0.02] animate-pulse" />)}
         </div>
       ) : (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {Object.entries(grouped).map(([type, list]) => (
              <div key={type} className="bg-[#1A1D21] border border-white/5 overflow-hidden">
                 <div className="px-6 py-4 bg-[#0F1113]/50 border-b border-white/5 flex items-center justify-between">
                     <h3 className="text-xxs font-semibold tracking-wide-md uppercase text-gray-500">{type} Context</h3>
                     <span className="text-[10px] font-mono text-gray-700">{list.length} Accounts</span>
                 </div>
                 <div className="divide-y divide-white/5">
                    {list.length === 0 && <div className="p-12 text-center text-gray-700 text-[9px] uppercase font-black tracking-[0.3em]">No Accounts Defined</div>}
                    {list.map(acc => {
                      const bal = balances[acc.id] || new Decimal(0);
                      return (
                        <div key={acc.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.01] group transition-colors">
                           <div className="flex items-center space-x-4">
                              <span className="font-mono text-[10px] text-gray-700 group-hover:text-electric-blue transition-colors">{acc.account_code}</span>
                              <span className="text-xs text-white font-bold uppercase tracking-tight">{acc.name}</span>
                           </div>
                           <div className="text-right">
                               <span className={cn(
                                 "financial text-xs font-black",
                                 bal.isNegative() ? "text-red-500" : "text-emerald-500"
                               )}>
                                  {fmt(bal.abs())}
                               </span>
                               <p className="text-[8px] uppercase font-black text-gray-700 tracking-tighter">{bal.isNegative() ? 'CR' : 'DR'}</p>
                           </div>
                        </div>
                      );
                    })}
                 </div>
              </div>
            ))}
         </div>
       )}
    </div>
  );
}

function InvoicesTab() {
  return (
    <EmptyState 
      icon={PieChart}
      title="Analytical Khata Integration"
      body="Cross-module synchronization between receivables and general ledger. Access transactional audits and historical invoices below."
      action={{
        label: "Open Billing Hub",
        href: "/invoices"
      }}
    />
  );
}

// --- Logic Helpers ---

async function handleReverse(
  tx: GroupedTransaction, 
  supabase: any, 
  queryClient: any, 
  setToast: (m: string) => void
) {
  if (!confirm(`Are you sure you want to reverse transaction ${tx.tx_ref}? This will create offsetting entries.`)) return;

  try {
    const rev_ref = `REV-${tx.tx_ref}`;
    const reversalEntries = tx.originalEntries.map(e => ({
      business_id: e.business_id,
      tx_ref: rev_ref,
      reversal_of: e.id,
      account_id: e.account_id,
      party_id: e.party_id,
      amount: e.amount,
      entry_type: e.entry_type === 'debit' ? 'credit' : 'debit',
      description: `Reversal of ${tx.tx_ref}: ${tx.description}`,
      posted_at: new Date().toISOString(),
      status: 'posted'
    }));

    const { error } = await supabase.from('ledger_entries').insert(reversalEntries);
    if (error) throw error;

    // Update original status
    await supabase.from('ledger_entries').update({ status: 'reversed' }).eq('tx_ref', tx.tx_ref);

    // Update party balance if applicable
    if (tx.party_id) {
       // We reversed it, so we need to undo the effect on party balance.
       // Original effect was (debit - credit).
       // So reversal effect is (credit - debit) which is -(original effect).
       let netChange = new Decimal(0);
       tx.originalEntries.forEach(e => {
         if (e.entry_type === 'debit') netChange = netChange.minus(new Decimal(e.amount));
         else netChange = netChange.plus(new Decimal(e.amount));
       });

       const { data: p } = await supabase.from('parties').select('current_balance').eq('id', tx.party_id).single();
       await supabase.from('parties').update({ current_balance: new Decimal(p.current_balance).plus(netChange).toNumber() }).eq('id', tx.party_id);
    }

    setToast(`Transaction ${tx.tx_ref} successfully reversed.`);
    queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
    queryClient.invalidateQueries({ queryKey: ['parties'] });
  } catch (err: any) {
    alert(`Reversal failed: ${err.message}`);
  }
}
