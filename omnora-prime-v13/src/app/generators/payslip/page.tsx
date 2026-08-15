"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Banknote, Download, Printer, ChevronLeft, 
  Search, User, Calendar, DollarSign, 
  ArrowRight, Calculator, Send, CheckCircle2
} from "lucide-react";

import { useSidebarState } from "@/hooks/useSidebarState";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Decimal } from "decimal.js";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

type SlipType = 'payslip' | 'peshgi';

export default function PayslipGenerator() {
  const { isCollapsed } = useSidebarState();
  const { profile } = useBusinessProfile();
  const { fmt, businessId, t } = usePersona();
  const supabase = createClient();
  

  const [activeTab, setActiveTab] = useState<SlipType>('payslip');
  const [selectedKarigar, setSelectedKarigar] = useState<any>(null);
  const [karigarSearch, setKarigarSearch] = useState("");
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  
  // Slip Data
  const [slipData, setSlipData] = useState({
    basic: 0,
    overtime: 0,
    bonus: 0,
    deductions: 0,
    advanceRecovery: 0,
    tax: 0,
    daysWorked: 0,
    unitsProduced: 0
  });

  const { data: karigars = [] } = useQuery({
    queryKey: ['karigars-search', karigarSearch],
    queryFn: async () => {
      if (!karigarSearch || karigarSearch.length < 2) return [];
      const { data } = await supabase
        .from('karigars')
        .select('*')
        .eq('business_id', businessId)
        .ilike('name', `%${karigarSearch}%`)
        .limit(5);
      return data || [];
    },
    enabled: !!businessId && karigarSearch.length >= 2
  });

  // Fetch Karigar Stats for Period
  const { data: stats } = useQuery({
    queryKey: ['karigar-stats', selectedKarigar?.id, month],
    queryFn: async () => {
      if (!selectedKarigar) return null;
      const start = startOfMonth(new Date(month)).toISOString();
      const end = endOfMonth(new Date(month)).toISOString();

      const [logs, advances] = await Promise.all([
        supabase.from('karigar_production_logs').select('qty_produced').eq('karigar_id', selectedKarigar.id).gte('posted_at', start).lte('posted_at', end),
        supabase.from('karigar_advances').select('amount').eq('karigar_id', selectedKarigar.id).gte('posted_at', start).lte('posted_at', end)
      ]);

      const units = (logs.data || []).reduce((acc: number, l: any) => acc + (l.qty_produced || 0), 0);
      const adv = (advances.data || []).reduce((acc: number, a: any) => acc + (a.amount || 0), 0);

      return { units, advances: adv };
    },
    enabled: !!selectedKarigar && activeTab === 'payslip'
  });

  const [txId] = useState(() => Math.random().toString(36).substring(7).toUpperCase());

  useEffect(() => {
    if (selectedKarigar && stats) {
      const basicPay = selectedKarigar.wage_type === 'piece_rate' 
        ? stats.units * (selectedKarigar.piece_rate || 0)
        : (selectedKarigar.daily_rate || 0) * 26;
      
      // Use microtask to avoid sync cascading render warning
      Promise.resolve().then(() => {
        setSlipData(prev => ({
          ...prev,
          basic: basicPay,
          advanceRecovery: stats.advances,
          unitsProduced: stats.units
        }));
      });
    }
  }, [selectedKarigar, stats]);

  const totals = useMemo(() => {
    const gross = new Decimal(slipData.basic).plus(slipData.overtime).plus(slipData.bonus);
    const totalDeductions = new Decimal(slipData.deductions).plus(slipData.advanceRecovery).plus(slipData.tax);
    const net = gross.minus(totalDeductions);
    return {
      gross: gross.toNumber(),
      deductions: totalDeductions.toNumber(),
      net: net.toNumber()
    };
  }, [slipData]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200">
      
      
      <main className={cn( "transition-all duration-300 min-h-screen flex flex-col print:p-0")}>
        <div className="p-8 max-w-[1400px] mx-auto w-full space-y-8 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/generators" className="p-2 bg-white/5 rounded-sm hover:bg-white/10 transition-colors">
                <ChevronLeft size={20} />
              </Link>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Salary & Peshgi</h1>
                <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-bold mt-1">
                  Industrial pay slips and advance receipts
                </p>
              </div>
            </div>

            <div className="flex items-center bg-white/5 p-1 rounded-sm">
              <button 
                onClick={() => setActiveTab("payslip")}
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm",
                  activeTab === "payslip" ? "bg-electric-blue text-white" : "text-gray-500 hover:text-white"
                )}
              >
                Pay Slip
              </button>
              <button 
                onClick={() => setActiveTab("peshgi")}
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm",
                  activeTab === "peshgi" ? "bg-electric-blue text-white" : "text-gray-500 hover:text-white"
                )}
              >
                Peshgi Receipt
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
            {/* Form Side */}
            <div className="glass-panel p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Karigar Selection */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-electric-blue pl-3">Employee Details</h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Search {t('nav_workers')}</label>
                      <div className="relative">
                        <input 
                          type="text"
                          value={karigarSearch}
                          onChange={(e) => {
                            setKarigarSearch(e.target.value);
                          }}
                          className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50"
                          placeholder="Name or Code..."
                        />
                        {karigarSearch.length >= 2 && karigars.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-[#1A1D21] border border-white/10 z-50 mt-1 shadow-2xl">
                            {karigars.map((k: any) => (
                              <button 
                                key={k.id}
                                onClick={() => {
                                  setSelectedKarigar(k);
                                  setKarigarSearch(k.name);
                                }}
                                className="w-full px-4 py-2 text-left text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-colors flex items-center justify-between"
                              >
                                <span>{k.name}</span>
                                <span className="text-[9px] font-mono opacity-50">{k.karigar_code}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedKarigar && (
                      <div className="p-4 bg-white/5 border border-white/5 rounded-sm space-y-2">
                        <p className="text-sm font-bold text-white uppercase">{selectedKarigar.name}</p>
                        <div className="flex flex-wrap gap-2">
                           <span className="text-[9px] px-2 py-0.5 bg-electric-blue/10 text-electric-blue font-black uppercase tracking-widest rounded-full">{selectedKarigar.wage_type?.replace('_', ' ')}</span>
                           <span className="text-[9px] px-2 py-0.5 bg-white/5 text-gray-500 font-black uppercase tracking-widest rounded-full">{selectedKarigar.karigar_code}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Period Selection */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-electric-blue pl-3">Period</h3>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Month / Year</label>
                    <input 
                      type="month"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50"
                    />
                  </div>
                </div>
              </div>

              {/* Salary Breakdown */}
              {activeTab === 'payslip' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Earnings */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Earnings</h4>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest block">Basic Salary / Production Wage</label>
                          <input 
                            type="number"
                            value={slipData.basic}
                            onChange={(e) => setSlipData({...slipData, basic: Number(e.target.value)})}
                            className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest block">Overtime</label>
                          <input 
                            type="number"
                            value={slipData.overtime}
                            onChange={(e) => setSlipData({...slipData, overtime: Number(e.target.value)})}
                            className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest block">Bonus</label>
                          <input 
                            type="number"
                            value={slipData.bonus}
                            onChange={(e) => setSlipData({...slipData, bonus: Number(e.target.value)})}
                            className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Deductions</h4>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest block">Advance Recovery (Peshgi)</label>
                          <input 
                            type="number"
                            value={slipData.advanceRecovery}
                            onChange={(e) => setSlipData({...slipData, advanceRecovery: Number(e.target.value)})}
                            className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest block">Other Deductions</label>
                          <input 
                            type="number"
                            value={slipData.deductions}
                            onChange={(e) => setSlipData({...slipData, deductions: Number(e.target.value)})}
                            className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest block">Income Tax</label>
                          <input 
                            type="number"
                            value={slipData.tax}
                            onChange={(e) => setSlipData({...slipData, tax: Number(e.target.value)})}
                            className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-white/5 rounded-sm flex items-center justify-between border border-white/5">
                     <div>
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Net Payable Amount</p>
                        <p className="text-3xl font-black text-electric-blue font-mono mt-1">{fmt(totals.net)}</p>
                     </div>
                     <button 
                        onClick={handlePrint}
                        disabled={!selectedKarigar}
                        className="bg-electric-blue text-white px-8 py-4 rounded-sm text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all flex items-center space-x-3"
                      >
                        <Printer size={16} />
                        <span>Generate & Print</span>
                      </button>
                  </div>
                </div>
              )}

              {/* Peshgi Receipt Form */}
              {activeTab === 'peshgi' && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Advance Amount ({profile?.currency || 'PKR'})</label>
                    <input 
                      type="number"
                      value={slipData.advanceRecovery}
                      onChange={(e) => setSlipData({...slipData, advanceRecovery: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/5 px-4 py-4 text-3xl font-black text-white focus:outline-none focus:border-electric-blue/50 text-center"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Reason / Description</label>
                    <textarea 
                      className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none h-24 resize-none"
                      placeholder="Emergency / Home repair / Medical..."
                    />
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={handlePrint}
                      disabled={!selectedKarigar}
                      className="bg-electric-blue text-white px-8 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all"
                    >
                      Print Receipt
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Side */}
            <div className="sticky top-24 w-full max-w-[500px] mx-auto bg-white text-black p-8 shadow-2xl flex flex-col space-y-8 min-h-[600px] print:fixed print:inset-0 print:m-0 print:shadow-none print:max-w-none relative">
              <div className="flex-1 space-y-8 pb-20">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-black pb-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black uppercase tracking-tighter">{profile?.business_name || "Noxis Industrial"}</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{activeTab === 'payslip' ? 'Salary Pay Slip' : 'Peshgi Advance Receipt'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">{month}</p>
                  </div>
                </div>

                {/* Employee Info */}
                <div className="bg-gray-50 p-4 border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Employee Name</p>
                    <p className="text-sm font-black uppercase">{selectedKarigar?.name || "Employee Name"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Staff Code</p>
                    <p className="text-sm font-mono font-bold">{selectedKarigar?.karigar_code || "K-XXX"}</p>
                  </div>
                </div>

                {activeTab === 'payslip' ? (
                  <div className="space-y-6">
                    {/* Tables */}
                    <div className="grid grid-cols-2 gap-0 border border-gray-200">
                      <div className="border-r border-gray-200">
                        <div className="p-2 bg-gray-100 border-b border-gray-200">
                          <p className="text-[9px] font-black uppercase tracking-widest">Earnings</p>
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex justify-between text-[10px]">
                            <span className="uppercase">Basic Wage</span>
                            <span className="font-mono">{fmt(slipData.basic)}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="uppercase">Overtime</span>
                            <span className="font-mono">{fmt(slipData.overtime)}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="uppercase">Bonus</span>
                            <span className="font-mono">{fmt(slipData.bonus)}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="p-2 bg-gray-100 border-b border-gray-200">
                          <p className="text-[9px] font-black uppercase tracking-widest">Deductions</p>
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex justify-between text-[10px]">
                            <span className="uppercase text-red-500">Peshgi Recovery</span>
                            <span className="font-mono text-red-500">{fmt(slipData.advanceRecovery)}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="uppercase">Tax</span>
                            <span className="font-mono">{fmt(slipData.tax)}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="uppercase">Other</span>
                            <span className="font-mono">{fmt(slipData.deductions)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-2 border-black p-4 flex justify-between items-center bg-gray-50">
                       <p className="text-xs font-black uppercase tracking-widest">Net Payable</p>
                       <p className="text-2xl font-black font-mono">{fmt(totals.net)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-12 pt-12">
                      <div className="text-center space-y-2">
                        <div className="h-[1px] bg-black w-full" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Authorized Sign</p>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="h-[1px] bg-black w-full" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Worker Signature</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-12">
                    <div className="p-8 border-4 border-double border-gray-200 text-center space-y-4">
                      <p className="text-sm italic">
                        Received <span className="font-black font-mono">{fmt(slipData.advanceRecovery)}</span> as advance payment for the period of {month}. This amount will be deducted from future earnings.
                      </p>
                    </div>

                    <div className="flex justify-between items-end pt-12">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-500">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
                        <p className="text-[8px] font-mono text-gray-400 uppercase tracking-widest">TxID: {txId}</p>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="h-[1px] bg-black w-32" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Signature</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-center opacity-10 pointer-events-none">
                  <p className="text-[60px] font-black tracking-tighter uppercase italic leading-none">NOXIS</p>
                </div>
              </div>
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                borderTop: '1px solid #e5e7eb',
                padding: '8px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#ffffff'
              }}>
                <span style={{
                  fontSize: 9,
                  color: '#9CA3AF',
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '0.05em',
                }}>
                  🔒 Securely logged by Noxis Hub
                </span>
                <span style={{
                  fontSize: 9,
                  color: '#9CA3AF',
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '0.05em',
                }}>
                  Powered by Omnora Labs · noxishub.app
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @media print {
          @page {
            size: A5;
            margin: 0;
          }
          body {
            background: white !important;
          }
          .custom-scrollbar::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
