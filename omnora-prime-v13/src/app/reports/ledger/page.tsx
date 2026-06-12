"use client";

import { Suspense, useMemo, useState, useEffect } from 'react';
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { 
  Search, Filter, 
  Download, ExternalLink, X,
  FileText, ShieldCheck, Calendar,
  ChevronDown, Database
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";

import { useSidebarState } from "@/hooks/useSidebarState";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import VirtualLedgerTable from "@/components/tables/VirtualLedgerTable";

function LedgerAuditContent() {
  const { businessId, fmt } = usePersona();
  const { isCollapsed } = useSidebarState();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // State for filters that aren't yet in URL
  const [localFilters, setLocalFilters] = useState({
    dateFrom: searchParams.get('from') || "",
    dateTo: searchParams.get('to') || "",
    accountId: searchParams.get('accountId') || "all",
    type: searchParams.get('type') || "all",
    status: searchParams.get('status') || "all",
    partyId: searchParams.get('partyId') || "all",
  });

  // Accounts for filter dropdown
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', businessId],
    queryFn: async () => {
      const { data } = await supabase.from('accounts').select('id, name, account_code').eq('business_id', businessId);
      return data || [];
    },
    enabled: !!businessId
  });

  // Parties for filter dropdown
  const { data: parties = [] } = useQuery({
    queryKey: ['parties', businessId],
    queryFn: async () => {
      const { data } = await supabase.from('parties').select('id, name').eq('business_id', businessId);
      return data || [];
    },
    enabled: !!businessId
  });

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(localFilters).forEach(([key, val]) => {
      const urlKey = key === 'dateFrom' ? 'from' : key === 'dateTo' ? 'to' : key;
      if (val && val !== 'all') params.set(urlKey, val);
      else params.delete(urlKey);
    });
    router.replace(`${pathname}?${params.toString()}`);
  };

  const exportCSV = async () => {
    // For large exports, we fetch all filtered data
    let query = supabase
      .from("ledger_entries")
      .select("*, accounts(name, account_code), parties(name)")
      .eq("business_id", businessId)
      .order("posted_at", { ascending: false });

    if (localFilters.dateFrom) query = query.gte("posted_at", localFilters.dateFrom);
    if (localFilters.dateTo) query = query.lte("posted_at", localFilters.dateTo);
    if (localFilters.accountId !== "all") query = query.eq("account_id", localFilters.accountId);
    if (localFilters.type !== "all") query = query.eq("entry_type", localFilters.type);
    if (localFilters.status !== "all") query = query.eq("status", localFilters.status);
    if (localFilters.partyId !== "all") query = query.eq("party_id", localFilters.partyId);

    const { data } = await query;
    if (!data) return;

    const rows = [
      ["Date", "Reference", "Account", "Code", "Type", "Description", "Party", "Amount", "Status"]
    ];

    data.forEach((entry: any) => {
      rows.push([
        entry.posted_at,
        entry.tx_ref,
        entry.accounts?.name || "",
        entry.accounts?.account_code || "",
        entry.entry_type,
        entry.description,
        entry.parties?.name || "",
        entry.amount.toString(),
        entry.status
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `noxis_ledger_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  

  return (
    <div className="min-h-screen bg-onyx text-slate-200 font-inter">
      
      
      <main className={` transition-all duration-300 min-h-screen flex flex-col`}>
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-surface/50 backdrop-blur-md sticky top-0 z-40">
           <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
            <Link href="/reports" className="hover:text-white transition-colors">Reports</Link>
            <span className="mx-3 opacity-30">/</span>
            <span className="text-white">General Ledger Audit</span>
          </div>

          <div className="ml-auto flex items-center space-x-4">
             <button 
               onClick={exportCSV}
               className="flex items-center space-x-2 px-4 py-1.5 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 transition-colors"
             >
                <Download size={14} />
                <span>Export Filtered Data</span>
             </button>
          </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full flex-1 flex flex-col space-y-6">
           {/* ADVANCED FILTERS */}
           <div className="bg-surface border border-white/5 p-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 items-end">
              <div className="space-y-2">
                 <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest flex items-center gap-2"><Calendar size={10} /> From Date</label>
                 <input 
                   type="date" 
                   value={localFilters.dateFrom}
                   onChange={e => setLocalFilters({...localFilters, dateFrom: e.target.value})}
                   className="w-full bg-onyx border border-white/10 text-[10px] text-white px-3 py-2 outline-none focus:border-electric-blue transition-all"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest flex items-center gap-2"><Calendar size={10} /> To Date</label>
                 <input 
                   type="date" 
                   value={localFilters.dateTo}
                   onChange={e => setLocalFilters({...localFilters, dateTo: e.target.value})}
                   className="w-full bg-onyx border border-white/10 text-[10px] text-white px-3 py-2 outline-none focus:border-electric-blue transition-all"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest flex items-center gap-2"><Database size={10} /> Account</label>
                 <select 
                   value={localFilters.accountId}
                   onChange={e => setLocalFilters({...localFilters, accountId: e.target.value})}
                   className="w-full bg-onyx border border-white/10 text-[10px] text-white px-3 py-2 outline-none focus:border-electric-blue transition-all"
                 >
                    <option value="all">All Accounts</option>
                    {accounts.map((acc: any) => <option key={acc.id} value={acc.id}>{acc.account_code} - {acc.name}</option>)}
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Entry Type</label>
                 <select 
                   value={localFilters.type}
                   onChange={e => setLocalFilters({...localFilters, type: e.target.value})}
                   className="w-full bg-onyx border border-white/10 text-[10px] text-white px-3 py-2 outline-none focus:border-electric-blue transition-all"
                 >
                    <option value="all">All Types</option>
                    <option value="debit">Debits Only</option>
                    <option value="credit">Credits Only</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Status</label>
                 <select 
                   value={localFilters.status}
                   onChange={e => setLocalFilters({...localFilters, status: e.target.value})}
                   className="w-full bg-onyx border border-white/10 text-[10px] text-white px-3 py-2 outline-none focus:border-electric-blue transition-all"
                 >
                    <option value="all">All Statuses</option>
                    <option value="posted">Posted</option>
                    <option value="draft">Draft</option>
                    <option value="reversed">Reversed</option>
                 </select>
              </div>
              <button 
                onClick={applyFilters}
                className="w-full bg-electric-blue text-onyx text-[10px] font-black uppercase tracking-widest py-2 hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                 <Filter size={12} /> Apply Filters
              </button>
           </div>

           {/* VIRTUALIZED TABLE */}
            <div className="flex-1 min-h-[600px] flex flex-col">
               {businessId ? (
                 <VirtualLedgerTable businessId={businessId} />
               ) : (
                 <div className="h-full flex items-center justify-center text-[10px] uppercase tracking-widest text-gray-700 animate-pulse">
                    Authenticating Node...
                 </div>
               )}
            </div>
        </div>
      </main>
    </div>
  );
}

export default function LedgerAuditPage() {
  return (
    <Suspense fallback={<div className="bg-onyx min-h-screen" />}>
      <LedgerAuditContent />
    </Suspense>
  );
}
