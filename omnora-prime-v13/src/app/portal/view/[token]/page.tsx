"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck, Lock, FileText, Download,
  AlertTriangle, Clock, CheckCircle2,
  TrendingDown, TrendingUp, Banknote
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PortalData {
  business: { business_name: string; logo_url?: string; currency?: string };
  party: { id: string; name: string; current_balance: number; phone?: string; email?: string };
  summary: { totalInvoiced: number; totalPaid: number; outstanding: number; invoiceCount: number };
  invoices: Array<{
    id: string; invoice_no: string; issue_date: string; due_date: string;
    total: number; paid_amount: number; balance_due: number; status: string;
  }>;
}

export default function CustomerPortalPage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`/api/portal/verify?token=${encodeURIComponent(token)}`);
        if (!res.ok) { const err = await res.json(); setError(err.error || 'Invalid or expired link'); return; }
        setData(await res.json());
      } catch { setError('Failed to verify access.'); }
      finally { setLoading(false); }
    }
    if (token) verify();
  }, [token]);

  const currency = data?.business?.currency || 'PKR';
  const fmt = (val: number) => `${currency} ${Number(val || 0).toLocaleString()}`;

  if (loading) return (
    <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Verifying Secure Access...</span>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full bg-[#111214] border border-red-500/20 p-12 text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center"><AlertTriangle className="text-red-500" size={32} /></div>
        <h1 className="text-xl font-black text-white uppercase tracking-tight">Access Denied</h1>
        <p className="text-sm text-gray-400 leading-relaxed">{error || 'This portal link is invalid, expired, or has been revoked.'}</p>
        <p className="text-[10px] text-gray-600 uppercase tracking-widest">Please contact the business for a new link.</p>
      </motion.div>
    </div>
  );

  const { business, party, summary, invoices } = data;
  const getStatusStyle = (s: string) => s === 'paid' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : s === 'issued' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : s === 'overdue' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-white/5 text-gray-400 border-white/10";

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white font-sans antialiased selection:bg-[#C5A059] selection:text-black">
      <header className="h-20 border-b border-white/5 bg-[#0A0B0D]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {business.logo_url ? <img src={business.logo_url} alt={business.business_name} className="h-8 w-auto object-contain" /> : <div className="w-10 h-10 bg-[#C5A059] flex items-center justify-center text-black font-black text-lg">{business.business_name?.[0] || 'B'}</div>}
            <div><h1 className="text-sm font-black uppercase tracking-tight">{business.business_name}</h1><p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Customer Portal</p></div>
          </div>
          <div className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-500 font-bold"><Lock size={12} /><span>Read-Only Access</span></div>
        </div>
      </header>

      <main className="max-w-[960px] mx-auto px-6 py-12 space-y-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full"><ShieldCheck size={12} /><span className="text-[9px] font-black uppercase tracking-widest">Verified Access</span></div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Welcome, <span className="text-[#C5A059]">{party.name}</span></h2>
          <p className="text-gray-500 text-sm font-medium">Your account statement with {business.business_name}.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-[#C5A059]/10 via-[#111214] to-[#111214] border border-[#C5A059]/20 p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left space-y-3">
            <p className="text-[10px] uppercase font-black text-[#C5A059] tracking-[0.3em]">Outstanding Balance</p>
            <h3 className="text-5xl font-mono font-black text-white">{fmt(summary.outstanding)}</h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{summary.outstanding > 0 ? 'Amount due — please arrange payment' : 'All caught up — no balance due'}</p>
          </div>
          <div className="grid grid-cols-2 gap-6 text-center">
            <div className="space-y-1"><div className="w-12 h-12 mx-auto bg-blue-500/10 flex items-center justify-center rounded-full"><TrendingUp size={20} className="text-blue-400" /></div><p className="text-sm font-mono font-bold text-white">{fmt(summary.totalInvoiced)}</p><p className="text-[9px] uppercase font-bold text-gray-600 tracking-widest">Total Invoiced</p></div>
            <div className="space-y-1"><div className="w-12 h-12 mx-auto bg-emerald-500/10 flex items-center justify-center rounded-full"><TrendingDown size={20} className="text-emerald-400" /></div><p className="text-sm font-mono font-bold text-white">{fmt(summary.totalPaid)}</p><p className="text-[9px] uppercase font-bold text-gray-600 tracking-widest">Total Paid</p></div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
          <div className="flex items-center space-x-3"><FileText size={16} className="text-[#C5A059]" /><h3 className="text-[11px] uppercase font-black text-gray-400 tracking-widest">Recent Invoices ({invoices.length})</h3></div>
          <div className="bg-[#111214] border border-white/5 overflow-hidden">
            <table className="w-full border-collapse">
              <thead><tr className="bg-[#0A0B0D] text-[9px] uppercase font-black text-gray-600 tracking-[0.2em] border-b border-white/5">
                <th className="px-6 py-4 text-left">Invoice No.</th><th className="px-6 py-4 text-left">Date</th><th className="px-6 py-4 text-right">Amount</th><th className="px-6 py-4 text-right">Paid</th><th className="px-6 py-4 text-right">Balance</th><th className="px-6 py-4 text-center">Status</th><th className="px-6 py-4 text-center">PDF</th>
              </tr></thead>
              <tbody className="text-[11px]">
                {invoices.length > 0 ? invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-5"><span className="font-mono font-bold text-white">{inv.invoice_no}</span></td>
                    <td className="px-6 py-5 text-gray-400 font-mono">{inv.issue_date}</td>
                    <td className="px-6 py-5 text-right font-mono font-bold text-white">{fmt(inv.total)}</td>
                    <td className="px-6 py-5 text-right font-mono text-emerald-500">{fmt(inv.paid_amount)}</td>
                    <td className="px-6 py-5 text-right font-mono font-bold text-red-400">{fmt(inv.balance_due)}</td>
                    <td className="px-6 py-5"><div className="flex justify-center"><span className={cn("inline-flex items-center space-x-1.5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border rounded-sm", getStatusStyle(inv.status))}><span>{inv.status}</span></span></div></td>
                    <td className="px-6 py-5"><div className="flex justify-center"><button className="p-2 bg-white/5 hover:bg-[#C5A059]/20 text-gray-500 hover:text-[#C5A059] transition-all rounded-sm" title="Download PDF"><Download size={14} /></button></div></td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-600 italic text-xs uppercase tracking-widest">No invoices found for your account.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#111214] border border-white/5 p-6 space-y-2 text-center"><Banknote size={20} className="mx-auto text-gray-600" /><p className="text-lg font-mono font-black text-white">{fmt(party.current_balance)}</p><p className="text-[9px] uppercase font-black text-gray-600 tracking-widest">Current Account Balance</p></div>
          <div className="bg-[#111214] border border-white/5 p-6 space-y-2 text-center"><FileText size={20} className="mx-auto text-gray-600" /><p className="text-lg font-mono font-black text-white">{summary.invoiceCount}</p><p className="text-[9px] uppercase font-black text-gray-600 tracking-widest">Total Invoices</p></div>
          <div className="bg-[#111214] border border-white/5 p-6 space-y-2 text-center"><Clock size={20} className="mx-auto text-gray-600" /><p className="text-lg font-mono font-black text-white">{fmt(summary.outstanding)}</p><p className="text-[9px] uppercase font-black text-gray-600 tracking-widest">Total Outstanding</p></div>
        </motion.div>
      </main>

      <footer className="py-12 border-t border-white/5 bg-[#070809]">
        <div className="max-w-[960px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium">&copy; {new Date().getFullYear()} {business.business_name}. All Rights Reserved.</div>
          <div className="flex items-center space-x-2 text-[9px] uppercase tracking-widest text-gray-600"><ShieldCheck size={14} className="text-emerald-500/50" /><span>Secure Portal — Powered by {business.business_name}</span></div>
        </div>
      </footer>
    </div>
  );
}
