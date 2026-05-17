"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Plus, Search, Filter, 
  ChevronRight, Calendar, User,
  Clock, CheckCircle2, AlertCircle,
  FileText, MessageCircle
} from "lucide-react";
import { sendWhatsAppAlert, ALERT_TEMPLATES } from "@/lib/whatsapp/alertEngine";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";
import { useSidebarState } from "@/hooks/useSidebarState";
import Link from "next/link";
import { cn } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";
import DataFreshness from "@/components/ui/DataFreshness";
import FinancialAmount from "@/components/ui/FinancialAmount";
import { useRowHighlight } from "@/hooks/useRowHighlight";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

export default function InvoiceListPage() {
  const router = useRouter();
  const { businessId } = usePersona();
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', businessId, searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          party:parties(name, phone)
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`invoice_no.ilike.%${searchTerm}%, party.name.ilike.%${searchTerm}%`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLastFetchedAt(new Date());
      return data;
    },
    enabled: !!businessId
  });

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 p-6">
      <main className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Invoicing Registry
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Financial Asset Tracking
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative group">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#C5A059] transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search Registry..." 
                  className="bg-white/5 border border-white/10 text-[10px] text-white px-10 py-2 focus:ring-1 focus:ring-[#C5A059] outline-none rounded-sm transition-all w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <button 
               onClick={() => router.push('/invoices/new')}
               className="flex items-center space-x-2 px-4 py-2 bg-electric-blue text-onyx text-sm font-semibold rounded-sm hover:brightness-110 shadow-lg"
             >
                <Plus size={14} />
                <span>Create Invoice</span>
             </button>
          </div>
        </div>

        <div className="px-8 pt-4 flex justify-end">
           <DataFreshness 
             lastFetchedAt={lastFetchedAt} 
             onRefresh={() => queryClient.invalidateQueries({ queryKey: ['invoices'] })} 
           />
        </div>

        <div className="p-8 space-y-6">
          {/* Filters Bar */}
          <div className="flex items-center space-x-4 bg-[#1A1D21] border border-white/5 p-4">
             <div className="flex items-center space-x-2 text-[10px] uppercase font-bold text-gray-500 mr-4">
                <Filter size={14} />
                <span>Quick Filters:</span>
             </div>
             {['all', 'issued', 'paid', 'overdue', 'cancelled'].map(status => (
               <button 
                 key={status}
                 onClick={() => setStatusFilter(status)}
                 className={cn(
                   "px-4 py-1.5 text-[9px] uppercase font-bold border transition-all rounded-sm",
                   statusFilter === status 
                    ? "bg-[#C5A059] text-black border-[#C5A059]" 
                    : "bg-white/5 text-gray-400 border-white/5 hover:border-white/20"
                 )}
               >
                 {status}
               </button>
             ))}
          </div>

          {isLoading ? (
            <div className="py-40 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-gray-600 animate-pulse">Scanning Financial Registers...</div>
          ) : !invoices || invoices.length === 0 ? (
            <EmptyState 
              icon={FileText}
              page="invoices"
              action={{
                label: "Construct New Invoice",
                onClick: () => router.push('/invoices/new')
              }}
            />
          ) : (
            <div className="bg-[#1A1D21] border border-white/5 overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#0F1113] table-header border-b border-white/5">
                    <th className="px-8 py-5 text-left">Ref No.</th>
                    <th className="px-8 py-5 text-left">Issue Date</th>
                    <th className="px-8 py-5 text-left">Customer / Entity</th>
                    <th className="px-8 py-5 text-right">Net Amount</th>
                    <th className="px-8 py-5 text-center">Status</th>
                    <th className="px-8 py-5 text-right w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {invoices.map((inv: any) => (
                    <InvoiceRow key={inv.id} inv={inv} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function InvoiceRow({ inv }: { inv: any }) {
  const controls = useRowHighlight(inv.status);
  const { fmt, fmtDate } = usePersona();
  const router = useRouter();

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid': return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case 'issued': return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case 'overdue': return "bg-red-500/10 text-red-500 border-red-500/20";
      case 'cancelled': return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default: return "bg-white/5 text-gray-400 border-white/10";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 size={10} />;
      case 'issued': return <Clock size={10} />;
      case 'overdue': return <AlertCircle size={10} />;
      default: return null;
    }
  };

  return (
    <motion.tr 
      animate={controls}
      custom={controls}
      key={inv.id} 
      className="border-b border-white/4 hover:bg-white/[0.02] transition-colors cursor-pointer"
    >
      <td className="px-4 py-2.5 text-sm text-gray-200">
        <div className="flex flex-col">
          <span className="text-xs font-data font-bold text-white group-hover:text-sandstone-gold transition-colors">{inv.invoice_no}</span>
          <span className="text-[9px] text-gray-600 font-data uppercase">ID: {inv.id.substring(0,8)}</span>
        </div>
      </td>
      <td className="px-4 py-2.5 text-sm text-gray-200">
          <div className="flex items-center space-x-2 text-[10px] text-gray-400 uppercase font-bold">
            <Calendar size={12} className="text-gray-600" />
            <span>{fmtDate(inv.issue_date)}</span>
          </div>
      </td>
      <td className="px-4 py-2.5 text-sm text-gray-200">
        <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/5 flex items-center justify-center text-gray-500 rounded-sm">
              <User size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white uppercase tracking-tight">{inv.party?.name}</span>
              <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Active Ledger: {inv.party_id.substring(0,8)}</span>
            </div>
        </div>
      </td>
      <td className="px-8 py-5 text-right">
          <div className="flex flex-col items-end">
            <FinancialAmount value={inv.total} className="text-sm font-bold" />
            <FinancialAmount 
              value={inv.balance_due} 
              className="text-[9px] opacity-50" 
              showSign={false}
            />
          </div>
      </td>
      <td className="px-8 py-5">
        <div className="flex justify-center">
          <span className={cn(
            "status-pill flex items-center space-x-2",
            getStatusStyle(inv.status)
          )}>
            {getStatusIcon(inv.status)}
            <span>{inv.status}</span>
          </span>
        </div>
      </td>
      <td className="px-8 py-5 text-right">
        <div className="flex items-center justify-end space-x-2">
          {inv.status !== 'paid' && (
            <button 
              onClick={() => {
                const msg = ALERT_TEMPLATES.invoice_reminder({
                  partyName: inv.party?.name || 'Customer',
                  amount: fmt(inv.balance_due),
                  dueDate: fmtDate(inv.due_date || inv.issue_date),
                  invoiceNo: inv.invoice_no
                });
                sendWhatsAppAlert(inv.party?.phone || '', msg);
              }}
              className="p-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-all rounded-sm"
              title="Send WhatsApp Reminder"
            >
              <MessageCircle size={16} />
            </button>
          )}
          <Link 
            href={`/invoices/${inv.id}`}
            className="p-2 bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all inline-block rounded-sm"
          >
            <ChevronRight size={16} />
          </Link>
        </div>
      </td>
    </motion.tr>
  );
}
