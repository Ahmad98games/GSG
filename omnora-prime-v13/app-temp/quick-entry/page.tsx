"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Zap, DollarSign, Users, CheckCircle2, 
  X, Loader2, Activity, Calendar, UserCheck, 
  UserX, ArrowRight, ArrowLeftRight, Clock, Plus
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import Decimal from "decimal.js";

type TabMode = "production" | "payment" | "attendance";

interface ActivityItem {
  id: string;
  type: "production" | "payment" | "attendance";
  title: string;
  desc: string;
  time: string;
  timestamp: Date;
}

export default function QuickEntryPage() {
  const [activeTab, setActiveTab] = useState<TabMode>("production");
  const { t, features, fmt, region } = useIndustryConfig();
  const { profile } = useBusinessProfile();
  const businessId = profile?.id;
  const supabase = createClient();
  const [localActivityList, setLocalActivityList] = useState<ActivityItem[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(true);

  // 1. Fetch Today's Logs for Activity Feed
  const fetchTodayActivity = async () => {
    if (!businessId) return;
    try {
      const todayISO = new Date();
      todayISO.setHours(0, 0, 0, 0);
      const todayStr = todayISO.toISOString();

      // Fetch logs
      const [prodRes, payRes, attRes] = await Promise.all([
        supabase
          .from("karigar_production_logs")
          .select("id, qty_produced, quality_grade, posted_at, karigars(name)")
          .eq("business_id", businessId)
          .gte("posted_at", todayStr)
          .order("posted_at", { ascending: false })
          .limit(10),
        supabase
          .from("payments")
          .select("id, amount, payment_method, posted_at, parties(name)")
          .eq("business_id", businessId)
          .gte("posted_at", todayStr)
          .order("posted_at", { ascending: false })
          .limit(10),
        supabase
          .from("attendance_logs")
          .select("id, status, log_date, posted_at, karigars(name)")
          .eq("business_id", businessId)
          .gte("posted_at", todayStr)
          .order("posted_at", { ascending: false })
          .limit(10),
      ]);

      const items: ActivityItem[] = [];

      (prodRes.data || []).forEach((p: any) => {
        items.push({
          id: `prod-${p.id}`,
          type: "production",
          title: "Production Logged",
          desc: `${p.qty_produced} units (Grade ${p.quality_grade}) for ${p.karigars?.name || "Unknown"}`,
          time: new Date(p.posted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          timestamp: new Date(p.posted_at)
        });
      });

      (payRes.data || []).forEach((p: any) => {
        items.push({
          id: `pay-${p.id}`,
          type: "payment",
          title: "Payment Recorded",
          desc: `PKR ${p.amount.toLocaleString()} via ${p.payment_method.toUpperCase()} for ${p.parties?.name || "Unknown"}`,
          time: new Date(p.posted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          timestamp: new Date(p.posted_at)
        });
      });

      (attRes.data || []).forEach((p: any) => {
        const formattedStatus = p.status.replace("_", " ").toUpperCase();
        items.push({
          id: `att-${p.id}`,
          type: "attendance",
          title: "Attendance Logged",
          desc: `${p.karigars?.name || "Unknown"} marked as ${formattedStatus}`,
          time: new Date(p.posted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          timestamp: new Date(p.posted_at)
        });
      });

      // Sort and slice
      items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setLocalActivityList(items.slice(0, 10));
    } catch (e) {
      console.error("Failed to load activity list:", e);
    } finally {
      setIsActivityLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchTodayActivity();
    }
  }, [businessId]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#070708]">
      {/* Header Banner */}
      <div className="h-16 border-b border-white/5 bg-[#09090A] px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-electric-blue/10 text-electric-blue rounded-lg">
            <Zap size={18} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-widest">Quick Entry Console</h1>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Factory Floor Real-Time Input</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-gray-500" />
          <span className="text-[10px] font-mono text-gray-400 font-black uppercase">
            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Form Workspace */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="max-w-2xl mx-auto space-y-8">
            
            {/* Tab Switches */}
            <div className="grid grid-cols-3 gap-2 bg-[#0C0C0E] p-1.5 rounded-xl border border-white/5">
              {[
                { id: "production", label: "Production Log", icon: Zap, color: "text-electric-blue", activeBg: "bg-electric-blue/10 border-electric-blue text-electric-blue" },
                { id: "payment", label: "Payment Slip", icon: DollarSign, color: "text-emerald-500", activeBg: "bg-emerald-500/10 border-emerald-500 text-emerald-500" },
                { id: "attendance", label: "Attendance", icon: Users, color: "text-purple-500", activeBg: "bg-purple-500/10 border-purple-500 text-purple-500" }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as TabMode)}
                  className={cn(
                    "flex items-center justify-center gap-2.5 py-3 rounded-lg text-xs font-black uppercase tracking-widest border transition-all cursor-pointer",
                    activeTab === t.id 
                      ? `${t.activeBg} font-black shadow-[0_0_20px_rgba(255,255,255,0.01)]`
                      : "bg-transparent border-transparent text-gray-500 hover:text-slate-300"
                  )}
                >
                  <t.icon size={14} className={activeTab === t.id ? "" : "text-gray-600"} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Forms Panel */}
            <div className="bg-[#09090A] border border-white/5 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,185,255,0.015),transparent_50%)] pointer-events-none" />
              
              <AnimatePresence mode="wait">
                {activeTab === "production" && (
                  <ProductionForm key="prod" onSaved={() => { fetchTodayActivity(); }} />
                )}
                {activeTab === "payment" && (
                  <PaymentForm key="pay" onSaved={() => { fetchTodayActivity(); }} />
                )}
                {activeTab === "attendance" && (
                  <AttendanceForm key="att" onSaved={() => { fetchTodayActivity(); }} />
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

        {/* Right Side: Activity Log Sidebar */}
        <div className="w-80 border-l border-white/5 bg-[#09090A]/50 flex flex-col overflow-hidden">
          <div className="h-12 border-b border-white/5 px-6 flex items-center gap-2">
            <Activity size={14} className="text-gray-500" />
            <h2 className="text-[10px] font-black text-white uppercase tracking-widest">Floor Feed (Today)</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {isActivityLoading ? (
              <div className="h-full flex items-center justify-center space-x-2 text-gray-500 text-xs uppercase font-bold">
                <Loader2 className="animate-spin" size={14} />
                <span>Streaming floor logs...</span>
              </div>
            ) : localActivityList.length > 0 ? (
              <AnimatePresence initial={false}>
                {localActivityList.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 bg-[#0A0A0C] border border-white/5 rounded-xl hover:border-white/10 transition-all flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          item.type === "production" ? "bg-electric-blue" :
                          item.type === "payment" ? "bg-emerald-500" : "bg-purple-500"
                        )} />
                        <span className="text-[9px] font-black uppercase text-white tracking-widest">{item.title}</span>
                      </div>
                      <span className="text-[8px] font-mono font-bold text-gray-500 uppercase flex items-center gap-1">
                        <Clock size={8} />
                        {item.time}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 opacity-30 text-center py-20">
                <CheckCircle2 size={32} strokeWidth={1.5} className="text-gray-500" />
                <p className="text-[9px] uppercase font-black tracking-widest">No activities logged yet today</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 1. PRODUCTION FORM
// ────────────────────────────────────────────────────────────────────────
function ProductionForm({ onSaved }: { onSaved: () => void }) {
  const [karigarSearch, setKarigarSearch] = useState("");
  const [qty, setQty] = useState("");
  const [grade, setGrade] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile } = useBusinessProfile();
  const businessId = profile?.id;
  const { t } = useIndustryConfig();
  const { success, error } = useToast();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: karigars = [] } = useQuery({
    queryKey: ["quick_karigars", karigarSearch],
    queryFn: async () => {
      if (karigarSearch.length < 2) return [];
      const { data } = await supabase
        .from("karigars")
        .select("id, name")
        .eq("business_id", businessId)
        .ilike("name", `%${karigarSearch}%`)
        .limit(5);
      return data || [];
    },
    enabled: !!businessId && karigarSearch.length >= 2,
  });

  // Today's Production Total
  const { data: todayTotal = 0, refetch: refetchTotal } = useQuery({
    queryKey: ["today_prod_total", businessId],
    queryFn: async () => {
      const todayISO = new Date();
      todayISO.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("karigar_production_logs")
        .select("qty_produced")
        .eq("business_id", businessId)
        .gte("posted_at", todayISO.toISOString());
      return (data || []).reduce((sum: number, p: any) => sum + (p.qty_produced || 0), 0);
    },
    enabled: !!businessId
  });

  const [selectedKarigar, setSelectedKarigar] = useState<{ id: string; name: string } | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedKarigar || !qty || !grade) return;

    setIsSubmitting(true);
    try {
      const { error: pError } = await supabase.from("karigar_production_logs").insert({
        business_id: businessId,
        karigar_id: selectedKarigar.id,
        qty_produced: Number(qty),
        quality_grade: grade,
        posted_at: new Date().toISOString()
      });

      if (pError) throw pError;

      success(`${qty} units logged for ${selectedKarigar.name} ✓`);
      setQty("");
      setKarigarSearch("");
      setSelectedKarigar(null);
      setGrade("");
      
      // Update states
      queryClient.invalidateQueries({ queryKey: ["dept_stats"] });
      refetchTotal();
      onSaved();
    } catch (err: any) {
      error(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Running total display */}
      <div className="p-5 bg-electric-blue/5 border border-electric-blue/10 rounded-2xl flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[9px] uppercase font-black text-gray-500 tracking-widest block">Floor Output Today</span>
          <h4 className="text-xs text-white font-bold">{`Total units logged by all ${t.workers.toLowerCase()}`}</h4>
        </div>
        <div className="text-3xl font-black text-electric-blue font-mono tracking-tight">
          {todayTotal.toLocaleString()} <span className="text-xs uppercase text-slate-500 font-bold tracking-widest">pcs</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{`${t.worker} Search`}</label>
          {!selectedKarigar ? (
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
              <input
                autoFocus
                value={karigarSearch}
                onChange={(e) => setKarigarSearch(e.target.value)}
                className="w-full bg-black/45 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs text-white outline-none focus:border-electric-blue/50 transition-colors"
                placeholder="Type name (min 2 chars)..."
              />
              {karigars.length > 0 && (
                <div className="absolute top-[105%] left-0 right-0 bg-[#0C0C0E] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                  {karigars.map((k: any) => (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => setSelectedKarigar(k)}
                      className="w-full px-4 py-3 text-left text-xs text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                    >
                      {k.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-electric-blue/10 border border-electric-blue/20 px-4 py-3 rounded-xl">
              <span className="text-xs text-electric-blue font-black uppercase tracking-wider">{selectedKarigar.name}</span>
              <button 
                type="button" 
                onClick={() => { setSelectedKarigar(null); setKarigarSearch(""); }} 
                className="text-electric-blue/50 hover:text-electric-blue cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Quantity Produced</label>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-full bg-black/45 border border-white/5 rounded-xl px-4 py-3.5 text-2xl font-black text-center text-white outline-none focus:border-electric-blue/50 transition-colors"
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Quality Grade</label>
          <div className="grid grid-cols-4 gap-2">
            {["A", "B", "C", "Rejected"].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrade(g)}
                className={cn(
                  "py-3 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all cursor-pointer",
                  grade === g
                    ? "bg-electric-blue text-black border-electric-blue shadow-[0_0_15px_rgba(45,185,255,0.2)]"
                    : "bg-white/5 text-gray-400 border-white/5 hover:border-white/10"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !selectedKarigar || !qty || !grade}
          className="w-full py-4 bg-electric-blue hover:brightness-110 text-black text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-[0_15px_30px_rgba(45,185,255,0.2)]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={14} />
              <span>Logging Production...</span>
            </>
          ) : (
            <>
              <span>Log Production Record</span>
              <CheckCircle2 size={14} />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 2. PAYMENT FORM
// ────────────────────────────────────────────────────────────────────────
function PaymentForm({ onSaved }: { onSaved: () => void }) {
  const [partySearch, setPartySearch] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [direction, setDirection] = useState<"received" | "paid">("received");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile } = useBusinessProfile();
  const businessId = profile?.id;
  const { success, error } = useToast();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: parties = [] } = useQuery({
    queryKey: ["quick_parties_payment", partySearch],
    queryFn: async () => {
      if (partySearch.length < 2) return [];
      const { data } = await supabase
        .from("parties")
        .select("id, name, party_type")
        .eq("business_id", businessId)
        .ilike("name", `%${partySearch}%`)
        .limit(5);
      return data || [];
    },
    enabled: !!businessId && partySearch.length >= 2,
  });

  const [selectedParty, setSelectedParty] = useState<{ id: string; name: string } | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedParty || !amount || !method) return;

    setIsSubmitting(true);
    try {
      // 1. Insert Payment entry
      const { data: payment, error: pError } = await supabase.from("payments").insert({
        business_id: businessId,
        party_id: selectedParty.id,
        amount: new Decimal(amount).toNumber(),
        payment_method: method.toLowerCase(),
        status: "completed",
        posted_at: new Date().toISOString()
      }).select().single();

      if (pError) throw pError;

      // 2. Insert double-entry in ledger: CustomerReceived -> Credit, SupplierPaid -> Debit
      const entryType = direction === "received" ? "credit" : "debit";
      
      const { error: lError } = await supabase.from("ledger_entries").insert({
        business_id: businessId,
        party_id: selectedParty.id,
        amount: new Decimal(amount).toNumber(),
        entry_type: entryType,
        tx_ref: `PAY-${payment.id}`,
        posted_at: new Date().toISOString()
      });

      if (lError) throw lError;

      success(`PKR ${amount} ${direction === "received" ? "received from" : "paid to"} ${selectedParty.name} ✓`);
      setAmount("");
      setPartySearch("");
      setSelectedParty(null);
      setMethod("");
      
      // Update states
      queryClient.invalidateQueries({ queryKey: ["ledger_entries"] });
      onSaved();
    } catch (err: any) {
      error(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Direction Selector */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "received", label: "Received (from Customer)", icon: ArrowRight, activeBg: "bg-emerald-500 text-black border-emerald-500" },
            { id: "paid", label: "Paid (to Supplier)", icon: ArrowRight, activeBg: "bg-red-500 text-white border-red-500" }
          ].map(d => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDirection(d.id as any)}
              className={cn(
                "py-3 text-[10px] font-black uppercase tracking-widest rounded-lg border flex items-center justify-center gap-2 cursor-pointer transition-all",
                direction === d.id 
                  ? d.activeBg
                  : "bg-white/5 text-gray-500 border-white/5 hover:border-white/10"
              )}
            >
              <d.icon size={12} className={direction === d.id ? "rotate-90" : ""} />
              <span>{d.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Party Search</label>
          {!selectedParty ? (
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
              <input
                autoFocus
                value={partySearch}
                onChange={(e) => setPartySearch(e.target.value)}
                className="w-full bg-black/45 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs text-white outline-none focus:border-emerald-500/50 transition-colors"
                placeholder="Type Customer/Supplier name..."
              />
              {parties.length > 0 && (
                <div className="absolute top-[105%] left-0 right-0 bg-[#0C0C0E] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                  {parties.map((p: any) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedParty(p)}
                      className="w-full px-4 py-3 text-left text-xs text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer flex justify-between items-center"
                    >
                      <span>{p.name}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 px-1.5 py-0.5 rounded bg-white/5">{p.party_type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-xl">
              <span className="text-xs text-emerald-400 font-black uppercase tracking-wider">{selectedParty.name}</span>
              <button 
                type="button" 
                onClick={() => { setSelectedParty(null); setPartySearch(""); }} 
                className="text-emerald-400/50 hover:text-emerald-400 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Transaction Amount (PKR)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-black/45 border border-white/5 rounded-xl px-4 py-3.5 text-2xl font-black text-center text-white outline-none focus:border-emerald-500/50 transition-colors"
            placeholder="0.00"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Payment Method</label>
          <div className="grid grid-cols-4 gap-2">
            {["Cash", "Bank", "JazzCash", "EasyPaisa"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m.toLowerCase())}
                className={cn(
                  "py-2.5 text-[9px] font-black uppercase border transition-all rounded-lg cursor-pointer",
                  method === m.toLowerCase()
                    ? "bg-white text-black border-white"
                    : "bg-white/5 text-gray-500 border-white/5 hover:border-white/10"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !selectedParty || !amount || !method}
          className="w-full py-4 bg-emerald-500 hover:brightness-110 text-black text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-[0_15px_30px_rgba(16,185,129,0.2)]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={14} />
              <span>Recording Payment...</span>
            </>
          ) : (
            <>
              <span>Record Payment Voucher</span>
              <CheckCircle2 size={14} />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 3. ATTENDANCE FORM
// ────────────────────────────────────────────────────────────────────────
function AttendanceForm({ onSaved }: { onSaved: () => void }) {
  const [karigarSearch, setKarigarSearch] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile } = useBusinessProfile();
  const businessId = profile?.id;
  const { success, error } = useToast();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [recentKarigars, setRecentKarigars] = useState<{ id: string; name: string }[]>([]);

  // Load all karigars for "Mark all present"
  const { data: allKarigars = [], refetch: refetchKarigars } = useQuery({
    queryKey: ["all_karigars_attendance", businessId],
    queryFn: async () => {
      const { data } = await supabase
        .from("karigars")
        .select("id, name")
        .eq("business_id", businessId)
        .order("name", { ascending: true });
      return data || [];
    },
    enabled: !!businessId
  });

  const { data: karigars = [] } = useQuery({
    queryKey: ["quick_karigars_attendance", karigarSearch],
    queryFn: async () => {
      if (karigarSearch.length < 2) return [];
      const { data } = await supabase
        .from("karigars")
        .select("id, name")
        .eq("business_id", businessId)
        .ilike("name", `%${karigarSearch}%`)
        .limit(5);
      return data || [];
    },
    enabled: !!businessId && karigarSearch.length >= 2,
  });

  const [selectedKarigar, setSelectedKarigar] = useState<{ id: string; name: string } | null>(null);

  // Fetch recent karigars from recent attendance logs
  useEffect(() => {
    const fetchRecent = async () => {
      if (!businessId) return;
      const { data } = await supabase
        .from("attendance_logs")
        .select("karigar_id, karigars(name)")
        .eq("business_id", businessId)
        .order("posted_at", { ascending: false })
        .limit(5);
      
      const mapped = (data || []).map((x: any) => ({
        id: x.karigar_id,
        name: x.karigars?.name || "Unknown"
      })).filter((val: any, idx: number, self: any[]) => self.findIndex((t: any) => t.id === val.id) === idx);

      setRecentKarigars(mapped);
    };
    fetchRecent();
  }, [businessId]);

  const handleStatusSubmit = async (status: string, karigar: { id: string; name: string }) => {
    setIsSubmitting(true);
    try {
      const { error: aError } = await supabase.from("attendance_logs").insert({
        business_id: businessId,
        karigar_id: karigar.id,
        log_date: date,
        status: status.toLowerCase().replace(" ", "_"),
        posted_at: new Date().toISOString()
      });

      if (aError) throw aError;

      success(`${karigar.name} marked ${status} ✓`);
      setSelectedKarigar(null);
      setKarigarSearch("");
      
      // Update
      queryClient.invalidateQueries({ queryKey: ["attendance_today"] });
      onSaved();
    } catch (err: any) {
      error(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAllPresent = async () => {
    if (allKarigars.length === 0) return;
    setIsSubmitting(true);
    try {
      const inserts = allKarigars.map((k: any) => ({
        business_id: businessId,
        karigar_id: k.id,
        log_date: date,
        status: "present",
        posted_at: new Date().toISOString()
      }));

      const { error: aError } = await supabase.from("attendance_logs").insert(inserts);
      if (aError) throw aError;

      success(`Successfully marked all ${allKarigars.length} Karigars Present! ✓`);
      queryClient.invalidateQueries({ queryKey: ["attendance_today"] });
      onSaved();
    } catch (err: any) {
      error(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex gap-4">
        {/* Date Selector */}
        <div className="flex-1 space-y-1.5">
          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Attendance Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-black/45 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-purple-500/50"
          />
        </div>

        {/* Mark All Present Quick Action */}
        <div className="flex-1 flex flex-col justify-end">
          <button
            type="button"
            onClick={handleMarkAllPresent}
            disabled={isSubmitting || allKarigars.length === 0}
            className="w-full py-3 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-400 text-xs font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            Mark All Present ({allKarigars.length})
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Karigar Search</label>
        {!selectedKarigar ? (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
            <input
              autoFocus
              value={karigarSearch}
              onChange={(e) => setKarigarSearch(e.target.value)}
              className="w-full bg-black/45 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs text-white outline-none focus:border-purple-500/50 transition-colors"
              placeholder="Search Karigar..."
            />
            {karigars.length > 0 && (
              <div className="absolute top-[105%] left-0 right-0 bg-[#0C0C0E] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                {karigars.map((k: any) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setSelectedKarigar(k)}
                    className="w-full px-4 py-3 text-left text-xs text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                  >
                    {k.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/20 px-4 py-3 rounded-xl">
            <span className="text-xs text-purple-400 font-black uppercase tracking-wider">{selectedKarigar.name}</span>
            <button 
              type="button" 
              onClick={() => { setSelectedKarigar(null); setKarigarSearch(""); }} 
              className="text-purple-400/50 hover:text-purple-400 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Touch Chips for Recent Karigars */}
      {recentKarigars.length > 0 && !selectedKarigar && (
        <div className="space-y-2">
          <span className="text-[9px] uppercase font-black text-gray-500 tracking-widest block">Recent Karigars</span>
          <div className="flex flex-wrap gap-2">
            {recentKarigars.map(k => (
              <button
                key={k.id}
                type="button"
                onClick={() => setSelectedKarigar(k)}
                className="px-3.5 py-2 bg-white/5 border border-white/5 hover:border-white/10 rounded-full text-[10px] text-gray-300 font-semibold cursor-pointer transition-all"
              >
                + {k.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedKarigar && (
        <div className="space-y-3 pt-2">
          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Select Status for {selectedKarigar.name}</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "present", label: "Present", color: "bg-emerald-500 hover:bg-emerald-600 text-black", icon: UserCheck },
              { id: "absent", label: "Absent", color: "bg-red-500 hover:bg-red-600 text-white", icon: UserX },
              { id: "half_day", label: "Half Day", color: "bg-amber-500 hover:bg-amber-600 text-black", icon: Clock }
            ].map(s => (
              <button
                key={s.id}
                type="button"
                disabled={isSubmitting}
                onClick={() => handleStatusSubmit(s.label, selectedKarigar)}
                className={cn(
                  "py-4 rounded-xl font-black uppercase tracking-[0.1em] text-[10px] transition-all flex flex-col items-center gap-2 cursor-pointer",
                  s.color
                )}
              >
                <s.icon size={16} />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
