'use client';

import React, { useState, useEffect } from 'react';
import { FileText, MessageCircle, RefreshCw, Send, CheckCircle2, DollarSign, Wallet, ShieldAlert, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { MunshiZReportData } from '@/lib/reports/munshiZReportEngine';

export function MunshiZReportCard({ businessId, ownerPhoneDefault }: { businessId?: string; ownerPhoneDefault?: string }) {
  const toast = useToast();
  const [report, setReport] = useState<MunshiZReportData | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [ownerPhone, setOwnerPhone] = useState(ownerPhoneDefault || '');

  useEffect(() => {
    const savedPhone = localStorage.getItem('noxis_owner_whatsapp');
    if (savedPhone) setOwnerPhone(savedPhone);
  }, []);

  const fetchReport = async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/munshi-z?business_id=${businessId || 'local'}&date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data.report || null);
        setMessage(data.message || '');
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchReport(selectedDate);
  }, [selectedDate, businessId]);

  const handleSendToWhatsApp = async () => {
    if (!ownerPhone.trim()) {
      toast.error('Baraye meherbani Maalik (Owner) ka WhatsApp number darj karein');
      return;
    }

    localStorage.setItem('noxis_owner_whatsapp', ownerPhone.trim());
    setDispatching(true);

    try {
      const res = await fetch('/api/reports/munshi-z', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: businessId || 'local',
          ownerPhone: ownerPhone.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Daily Munshi Z-Report WhatsApp par bhej di gayi!');
        if (data.waLink) {
          window.open(data.waLink, '_blank');
        }
      } else {
        toast.error('Report send nahi ho saki');
      }
    } catch {
      toast.error('Network error sending report');
    } finally {
      setDispatching(false);
    }
  };

  const fmt = (num: number) => `PKR ${Math.round(num || 0).toLocaleString('en-PK')}`;

  return (
    <div className="bg-[#0B0E14] border border-white/10 rounded-sm p-6 space-y-5 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-sm border border-emerald-500/20 uppercase tracking-widest">
              Daily Auto-Audit Engine
            </span>
            <span className="text-[10px] text-gray-500 font-mono">SQLite WAL Verified</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <Sparkles className="text-emerald-400" size={16} />
            Daily Munshi Z-Report on Owner&apos;s WhatsApp
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Dukan band hotay waqt Maalik ko roznamcha, naqad wasooli aur kul udhar ka automated WhatsApp audit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[#161A1F] border border-white/10 text-xs text-gray-200 px-3 py-1.5 rounded-sm outline-none"
          />
          <button
            onClick={() => fetchReport(selectedDate)}
            className="p-2 border border-white/10 text-gray-400 hover:text-white rounded-sm transition-all"
            title="Refresh Z-Report"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-white/[0.02] border border-white/5 rounded-sm" />
          ))}
        </div>
      ) : report ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-[#12151B] border border-white/6 rounded-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Net Sales (Aaj Ki)</p>
            <p className="text-base font-black text-white font-mono mt-0.5">{fmt(report.totalNetSales)}</p>
            <p className="text-[9px] text-gray-600">{report.invoicesCount} Invoices posted</p>
          </div>
          <div className="p-3 bg-[#12151B] border border-emerald-500/20 rounded-sm">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Cash In Hand (Galla)</p>
            <p className="text-base font-black text-emerald-400 font-mono mt-0.5">{fmt(report.cashCollected)}</p>
            <p className="text-[9px] text-emerald-500/60">Actual drawer cash</p>
          </div>
          <div className="p-3 bg-[#12151B] border border-blue-500/20 rounded-sm">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Bank / Raast Wasooli</p>
            <p className="text-base font-black text-blue-400 font-mono mt-0.5">{fmt(report.bankCollected)}</p>
            <p className="text-[9px] text-blue-500/60">Direct bank transfers</p>
          </div>
          <div className="p-3 bg-[#12151B] border border-amber-500/20 rounded-sm">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Kul Market Udhar</p>
            <p className="text-base font-black text-amber-400 font-mono mt-0.5">{fmt(report.totalReceivableMarket)}</p>
            <p className="text-[9px] text-amber-500/60">All active debtors</p>
          </div>
        </div>
      ) : null}

      {/* WhatsApp Dispatch Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#12151B] border border-white/8 p-4 rounded-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <MessageCircle size={22} className="text-emerald-400 shrink-0" />
          <div className="flex-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
              Owner&apos;s WhatsApp Number
            </label>
            <input
              type="text"
              placeholder="e.g. 03001234567"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              className="bg-[#0A0C10] border border-white/10 px-3 py-1.5 text-xs text-white rounded-sm outline-none font-mono focus:border-emerald-500/50 w-full sm:w-64"
            />
          </div>
        </div>

        <button
          onClick={handleSendToWhatsApp}
          disabled={dispatching || loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-sm hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-50"
        >
          <Send size={13} />
          {dispatching ? 'Preparing Report...' : 'Send Z-Report to Owner WhatsApp'}
        </button>
      </div>
    </div>
  );
}
