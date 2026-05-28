"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { usePersona } from "@/hooks/usePersona";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { useToast } from "@/hooks/useToast";
import { 
  Calendar, DollarSign, AlertCircle, CheckCircle2, 
  Plus, MessageSquare, Check, X, Search, Clock, 
  TrendingUp, AlertTriangle, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isBefore, isAfter, parseISO } from "date-fns";
import { useSearchParams } from "next/navigation";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Skeleton, KpiCardSkeleton } from "@/components/ui/Skeleton";

export default function PromisesPage() {
  const { businessId, fmt } = usePersona();
  const { profile } = useBusinessProfile();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const toast = useToast();
  const searchParams = useSearchParams();
  const prefillPartyId = searchParams.get("partyId");

  // Search & Filtering State
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "due_today" | "overdue" | "fulfilled" | "broken">("all");

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isMarkPaidModalOpen, setIsMarkPaidModalOpen] = useState(false);
  const [selectedPromiseForPayment, setSelectedPromiseForPayment] = useState<any>(null);

  // New Promise Form State
  const [parties, setParties] = useState<any[]>([]);
  const [partySearch, setPartySearch] = useState("");
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [promisedAmount, setPromisedAmount] = useState("");
  const [promiseDate, setPromiseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill query param logic
  useEffect(() => {
    if (prefillPartyId && parties.length > 0) {
      const party = parties.find((p) => p.id === prefillPartyId);
      if (party) {
        setSelectedPartyId(party.id);
        setPartySearch(party.name);
        setIsRecordModalOpen(true);
      }
    }
  }, [prefillPartyId, parties]);

  // Mark Paid Form State
  const [actualPaidAmount, setActualPaidAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [isFulfilling, setIsFulfilling] = useState(false);

  // Fetch Promises
  const { data: promises = [], isLoading, error: promisesError, refetch } = useQuery({
    queryKey: ["payment-promises", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_promises")
        .select(`
          *,
          party:parties(id, name, phone, party_type),
          invoice:invoices(id, invoice_no, total, balance_due)
        `)
        .eq("business_id", businessId)
        .order("promise_date", { ascending: true });

      if (error) {
        toast.error("Fetch failed", error.message);
        return [];
      }
      return data || [];
    },
    enabled: !!businessId,
  });

  // Load Parties for modal
  useEffect(() => {
    if (!businessId) return;
    const fetchParties = async () => {
      const { data } = await supabase
        .from("parties")
        .select("id, name, phone, party_type")
        .eq("business_id", businessId)
        .order("name");
      if (data) setParties(data);
    };
    fetchParties();
  }, [businessId, supabase]);

  // Load Unpaid Invoices when party is selected
  useEffect(() => {
    if (!selectedPartyId) {
      setUnpaidInvoices([]);
      setSelectedInvoiceId("");
      return;
    }
    const fetchInvoices = async () => {
      const { data } = await supabase
        .from("invoices")
        .select("id, invoice_no, total, balance_due")
        .eq("party_id", selectedPartyId)
        .not("status", "in", ["paid", "cancelled"])
        .order("issue_date", { ascending: false });
      if (data) setUnpaidInvoices(data);
    };
    fetchInvoices();
  }, [selectedPartyId, supabase]);

  // Auto-fill amount when invoice is selected
  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    const inv = unpaidInvoices.find(i => i.id === invId);
    if (inv) {
      setPromisedAmount(String(inv.balance_due));
    } else {
      setPromisedAmount("");
    }
  };

  // Create Promise
  const handleCreatePromise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartyId || !promisedAmount || !promiseDate) {
      toast.warning("Validation Error", "Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("payment_promises")
        .insert({
          business_id: businessId,
          party_id: selectedPartyId,
          promised_amount: Number(promisedAmount),
          promise_date: promiseDate,
          notes: notes || null,
          invoice_id: selectedInvoiceId || null,
          status: "pending",
          created_by: user?.id || null
        });

      if (error) throw error;

      toast.success("Success", "Verbal payment promise registered successfully.");
      refetch();
      setIsRecordModalOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error("Registration failed", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mark Paid (Fulfill Promise)
  const handleFulfillPromise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPromiseForPayment || !actualPaidAmount) {
      toast.warning("Validation Error", "Amount is required.");
      return;
    }

    setIsFulfilling(true);
    try {
      const { error } = await supabase
        .from("payment_promises")
        .update({
          status: "fulfilled",
          fulfilled_at: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
          fulfilled_amount: Number(actualPaidAmount),
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedPromiseForPayment.id);

      if (error) throw error;

      toast.success("Promise Fulfilled", "Record has been updated successfully.");
      refetch();
      setIsMarkPaidModalOpen(false);
      setSelectedPromiseForPayment(null);
      setActualPaidAmount("");
      setPaymentDate("");
    } catch (err: any) {
      toast.error("Action failed", err.message);
    } finally {
      setIsFulfilling(false);
    }
  };

  // Mark Broken Promise
  const handleMarkBroken = async (id: string) => {
    if (!confirm("Are you sure you want to mark this promise as broken/cancelled?")) return;
    try {
      const { error } = await supabase
        .from("payment_promises")
        .update({
          status: "broken",
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Promise Broken", "Commitment status marked as broken.");
      refetch();
    } catch (err: any) {
      toast.error("Action failed", err.message);
    }
  };

  // WhatsApp Reminder Trigger
  const handleSendReminder = async (promise: any) => {
    if (!promise.party?.phone) {
      toast.error("Phone missing", "This party has no registered phone number.");
      return;
    }

    const message = `Assalamu Alaikum ${promise.party.name}, this is a gentle reminder regarding the payment commitment of PKR ${promise.promised_amount} due on ${promise.promise_date}. Kindly let us know when it is processed. JazakAllah.`;
    const waUrl = `https://wa.me/${promise.party.phone.replace(/\+/g, "").replace(/\s/g, "")}?text=${encodeURIComponent(message)}`;
    
    // Log reminder in DB
    try {
      await supabase
        .from("payment_promises")
        .update({
          reminded_count: (promise.reminded_count || 0) + 1,
          last_reminded_at: new Date().toISOString()
        })
        .eq("id", promise.id);

      refetch();
      window.open(waUrl, "_blank");
      toast.success("WhatsApp Reminded Sent", "Reminder counter updated.");
    } catch (err: any) {
      toast.error("Log failed", err.message);
    }
  };

  const resetForm = () => {
    setSelectedPartyId("");
    setPartySearch("");
    setSelectedInvoiceId("");
    setPromisedAmount("");
    setPromiseDate("");
    setNotes("");
  };

  // Computed summary metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");

    let dueTodayAmt = 0;
    let dueTodayCount = 0;
    let overdueAmt = 0;
    let overdueCount = 0;
    let upcomingAmt = 0;
    let upcomingCount = 0;
    let fulfilledThisMonthAmt = 0;

    promises.forEach((p: any) => {
      const dateStr = p.promise_date;
      const amount = Number(p.promised_amount || 0);

      if (p.status === "pending" || p.status === "due_today" || p.status === "overdue") {
        if (dateStr === todayStr) {
          dueTodayAmt += amount;
          dueTodayCount++;
        } else if (isBefore(parseISO(dateStr), parseISO(todayStr))) {
          overdueAmt += amount;
          overdueCount++;
        } else {
          upcomingAmt += amount;
          upcomingCount++;
        }
      } else if (p.status === "fulfilled") {
        fulfilledThisMonthAmt += Number(p.fulfilled_amount || amount);
      }
    });

    return {
      dueTodayAmt,
      dueTodayCount,
      overdueAmt,
      overdueCount,
      upcomingAmt,
      upcomingCount,
      fulfilledThisMonthAmt
    };
  }, [promises]);

  // Filtered list
  const filteredPromises = useMemo(() => {
    return promises.filter((p: any) => {
      // Tab filter
      if (activeTab === "pending" && p.status !== "pending") return false;
      if (activeTab === "due_today" && p.status !== "due_today") return false;
      if (activeTab === "overdue" && p.status !== "overdue") return false;
      if (activeTab === "fulfilled" && p.status !== "fulfilled") return false;
      if (activeTab === "broken" && p.status !== "broken") return false;

      // Text search
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const partyName = p.party?.name?.toLowerCase() || "";
        const invoiceNo = p.invoice?.invoice_no?.toLowerCase() || "";
        const note = p.notes?.toLowerCase() || "";
        return partyName.includes(query) || invoiceNo.includes(query) || note.includes(query);
      }

      return true;
    });
  }, [promises, activeTab, searchTerm]);

  if (isLoading) return (
    <div className="p-6 bg-[#070809] min-h-screen">
      <div className="flex justify-between mb-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );

  if (promisesError) return (
    <div className="min-h-screen bg-[#070809] flex items-center justify-center p-8">
      <ErrorState
        message="Could not load payment promises registry"
        detail={(promisesError as Error).message}
        onRetry={refetch}
      />
    </div>
  );

  if (!promises || promises.length === 0) return (
    <div className="min-h-screen bg-[#070809] text-white p-6 flex flex-col justify-center">
      <div className="flex justify-between mb-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <span>Payment Promises</span>
            <span className="text-[10px] bg-electric-blue/10 border border-electric-blue/20 text-[#60A5FA] px-2 py-0.5 rounded-sm uppercase tracking-widest font-mono">
              Verbal Registry
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Registry to track cash commitments and verbal collection guarantees.
          </p>
        </div>
        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#C5A059] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#C5A059]/90 transition-all rounded-sm shrink-0 shadow-lg"
        >
          <Plus size={14} />
          <span>Record Promise</span>
        </button>
      </div>
      <EmptyState
        icon="🤲"
        title="No payment promises recorded"
        description="When a customer promises to pay on a date, record it here"
        action={{ label: 'Record promise', onClick: () => setIsRecordModalOpen(true) }}
      />
      <AnimatePresence>
        {isRecordModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0F1114] border border-white/10 p-6 w-full max-w-md relative overflow-hidden shadow-2xl text-left"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C5A059]" />

              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-xs font-black uppercase text-white tracking-widest font-mono flex items-center space-x-2">
                  <Plus size={14} className="text-[#C5A059]" />
                  <span>Record Payment Promise</span>
                </h3>
                <button
                  onClick={() => {
                    setIsRecordModalOpen(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreatePromise} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest block">
                    Customer Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={partySearch}
                      onChange={(e) => {
                        setPartySearch(e.target.value);
                        if (e.target.value === "") setSelectedPartyId("");
                      }}
                      placeholder="Search customer..."
                      className="w-full bg-[#070809] border border-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-[#C5A059] transition-all rounded-sm"
                    />
                    {partySearch && !selectedPartyId && (
                      <div className="absolute top-full left-0 right-0 bg-[#0F1114] border border-white/10 z-50 max-h-40 overflow-y-auto shadow-2xl">
                        {parties
                          .filter((p) => p.name.toLowerCase().includes(partySearch.toLowerCase()))
                          .map((p) => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedPartyId(p.id);
                                setPartySearch(p.name);
                              }}
                              className="px-4 py-2 text-xs hover:bg-white/5 cursor-pointer border-b border-white/5 text-left text-white"
                            >
                              {p.name}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest block">
                    Linked Invoice (Optional)
                  </label>
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => handleInvoiceChange(e.target.value)}
                    disabled={!selectedPartyId}
                    className="w-full bg-[#070809] border border-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-[#C5A059] transition-all rounded-sm disabled:opacity-40"
                  >
                    <option value="">-- No linked invoice --</option>
                    {unpaidInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_no} (Owed: PKR {inv.balance_due})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest block">
                    Promised Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={promisedAmount}
                    onChange={(e) => setPromisedAmount(e.target.value)}
                    placeholder="Enter amount customer committed to pay..."
                    className="w-full bg-[#070809] border border-white/5 px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-[#C5A059] transition-all rounded-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest block">
                    Promise Commitment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={promiseDate}
                    onChange={(e) => setPromiseDate(e.target.value)}
                    className="w-full bg-[#070809] border border-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-[#C5A059] transition-all rounded-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest block">
                    Notes / Verbal Agreement Details
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="E.g., Client committed to clear invoice balance via bank transfer by 3 PM..."
                    className="w-full h-20 bg-[#070809] border border-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-[#C5A059] transition-all rounded-sm resize-none"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecordModalOpen(false);
                      resetForm();
                    }}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-widest transition-colors rounded-sm text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-[#C5A059] text-black text-[9px] font-black uppercase tracking-widest hover:bg-[#C5A059]/90 disabled:opacity-50 transition-colors rounded-sm text-center"
                  >
                    {isSubmitting ? "Saving..." : "Record Commitment"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070809] text-white p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-white/5 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <span>Payment Promises</span>
            <span className="text-[10px] bg-electric-blue/10 border border-electric-blue/20 text-[#60A5FA] px-2 py-0.5 rounded-sm uppercase tracking-widest font-mono">
              Verbal Registry
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Registry to track cash commitments and verbal collection guarantees.
          </p>
        </div>
        
        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#C5A059] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#C5A059]/90 transition-all rounded-sm shrink-0 shadow-lg"
        >
          <Plus size={14} />
          <span>Record Promise</span>
        </button>
      </div>

      {/* Summary Box Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0F1114] border border-white/5 p-4 rounded-sm relative overflow-hidden group shadow-lg">
          <div className="absolute top-0 left-0 w-1/3 h-[1px] bg-gradient-to-r from-[#60A5FA] to-transparent opacity-60" />
          <p className="text-xxs font-semibold uppercase text-gray-500 tracking-wider">Due Today</p>
          <div className="mt-2 text-xl font-mono font-semibold text-white">
            {fmt(metrics.dueTodayAmt)}
          </div>
          <p className="text-[10px] text-gray-500 mt-1">{metrics.dueTodayCount} active promises</p>
        </div>

        <div className="bg-[#0F1114] border border-white/5 p-4 rounded-sm relative overflow-hidden group shadow-lg">
          <div className="absolute top-0 left-0 w-1/3 h-[1px] bg-gradient-to-r from-red-500 to-transparent opacity-60" />
          <p className="text-xxs font-semibold uppercase text-red-500 tracking-wider">Overdue Commitments</p>
          <div className="mt-2 text-xl font-mono font-semibold text-red-400">
            {fmt(metrics.overdueAmt)}
          </div>
          <p className="text-[10px] text-gray-500 mt-1">{metrics.overdueCount} commitments delayed</p>
        </div>

        <div className="bg-[#0F1114] border border-white/5 p-4 rounded-sm relative overflow-hidden group shadow-lg">
          <div className="absolute top-0 left-0 w-1/3 h-[1px] bg-gradient-to-r from-[#C5A059] to-transparent opacity-60" />
          <p className="text-xxs font-semibold uppercase text-[#C5A059] tracking-wider">Upcoming Promises</p>
          <div className="mt-2 text-xl font-mono font-semibold text-white">
            {fmt(metrics.upcomingAmt)}
          </div>
          <p className="text-[10px] text-gray-500 mt-1">{metrics.upcomingCount} pending date</p>
        </div>

        <div className="bg-[#0F1114] border border-white/5 p-4 rounded-sm relative overflow-hidden group shadow-lg">
          <div className="absolute top-0 left-0 w-1/3 h-[1px] bg-gradient-to-r from-emerald-500 to-transparent opacity-60" />
          <p className="text-xxs font-semibold uppercase text-emerald-500 tracking-wider">Fulfilled (This Month)</p>
          <div className="mt-2 text-xl font-mono font-semibold text-emerald-400">
            {fmt(metrics.fulfilledThisMonthAmt)}
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Successfully cleared payments</p>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div className="flex flex-wrap items-center bg-[#0F1114] border border-white/5 p-1 rounded-sm">
          {(["all", "pending", "due_today", "overdue", "fulfilled", "broken"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? "bg-white/5 text-[#60A5FA]"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search party or invoice reference..."
            className="w-full bg-[#0F1114] border border-white/5 px-10 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-[#C5A059] transition-all rounded-sm font-sans"
          />
        </div>
      </div>

      {/* Promises List Section */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-[#0F1114] border border-white/5 animate-pulse rounded-sm" />
          ))}
        </div>
      ) : filteredPromises.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-[#0F1114] border border-white/5 text-center">
          <AlertCircle size={44} className="text-gray-600 mb-4" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">No commitments registered</h3>
          <p className="text-xs text-gray-500 mt-2 max-w-xs leading-relaxed">
            Record verbal cash commitments from customers to ensure strict daily due warning notifications.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredPromises.map((promise: any) => {
            const isPromiseOverdue =
              (promise.status === "pending" || promise.status === "due_today" || promise.status === "overdue") &&
              isBefore(parseISO(promise.promise_date), parseISO(format(new Date(), "yyyy-MM-dd")));

            return (
              <motion.div
                key={promise.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#0F1114] border border-white/5 hover:border-white/10 transition-all p-5 flex flex-col justify-between relative overflow-hidden group shadow-lg"
              >
                {/* Visual Accent border indicating state */}
                <div
                  className={`absolute top-0 left-0 w-1 h-full ${
                    promise.status === "fulfilled"
                      ? "bg-emerald-500"
                      : promise.status === "broken"
                      ? "bg-gray-600"
                      : isPromiseOverdue
                      ? "bg-red-500"
                      : "bg-[#C5A059]"
                  }`}
                />

                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-tight truncate max-w-[180px]">
                        {promise.party?.name || "Unknown Party"}
                      </h4>
                      <span className="text-[8px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded-sm uppercase font-semibold">
                        {promise.party?.party_type || "customer"}
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[13px] font-mono font-black text-[#C5A059]">
                        {fmt(promise.promised_amount)}
                      </span>
                      {promise.invoice && (
                        <span className="text-[9px] text-[#60A5FA] font-mono hover:underline cursor-pointer mt-1">
                          Ref: {promise.invoice.invoice_no}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-500 font-bold uppercase tracking-wider">Promise Date</span>
                      <span className="font-mono text-white font-semibold">
                        {format(parseISO(promise.promise_date), "dd MMM yyyy")}
                      </span>
                    </div>

                    {promise.status === "fulfilled" ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-emerald-500 font-bold uppercase tracking-wider">Paid Date</span>
                          <span className="font-mono text-emerald-400 font-semibold">
                            {promise.fulfilled_at ? format(new Date(promise.fulfilled_at), "dd MMM yyyy") : "-"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-emerald-500 font-bold uppercase tracking-wider">Paid Amount</span>
                          <span className="font-mono text-emerald-400 font-semibold">
                            {fmt(promise.fulfilled_amount || promise.promised_amount)}
                          </span>
                        </div>
                      </div>
                    ) : promise.status === "broken" ? (
                      <div className="text-[10px] text-gray-500 italic">
                        Promise cancelled/broken
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-500 font-bold uppercase tracking-wider">Follow-Up Alert</span>
                        <span
                          className={`font-black uppercase tracking-widest ${
                            isPromiseOverdue ? "text-red-400 animate-pulse" : "text-[#C5A059]"
                          }`}
                        >
                          {isPromiseOverdue ? "OVERDUE" : isToday(parseISO(promise.promise_date)) ? "DUE TODAY" : "PENDING"}
                        </span>
                      </div>
                    )}

                    {promise.notes && (
                      <div className="p-2.5 bg-white/5 border border-white/5 mt-2 rounded-sm">
                        <p className="text-[10px] text-gray-400 leading-relaxed italic">
                          "{promise.notes}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card footer actions */}
                {promise.status !== "fulfilled" && promise.status !== "broken" && (
                  <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedPromiseForPayment(promise);
                        setActualPaidAmount(String(promise.promised_amount));
                        setIsMarkPaidModalOpen(true);
                      }}
                      className="flex-1 py-1.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider text-center transition-colors"
                    >
                      Mark Paid
                    </button>

                    {promise.party?.phone && (
                      <button
                        onClick={() => handleSendReminder(promise)}
                        className="py-1.5 px-3 bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 text-[#25D366] text-[9px] font-black uppercase tracking-wider transition-colors flex items-center space-x-1.5"
                      >
                        <MessageSquare size={10} />
                        <span>Remind ({promise.reminded_count || 0})</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleMarkBroken(promise.id)}
                      className="py-1.5 px-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-wider transition-colors"
                    >
                      Broken
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Record Promise Modal */}
      <AnimatePresence>
        {isRecordModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0F1114] border border-white/10 p-6 w-full max-w-md relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C5A059]" />

              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-xs font-black uppercase text-white tracking-widest font-mono flex items-center space-x-2">
                  <Plus size={14} className="text-[#C5A059]" />
                  <span>Record Payment Promise</span>
                </h3>
                <button
                  onClick={() => {
                    setIsRecordModalOpen(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreatePromise} className="space-y-4 mt-4">
                {/* Searchable Customer Select */}
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest block">
                    Customer Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={partySearch}
                      onChange={(e) => {
                        setPartySearch(e.target.value);
                        if (e.target.value === "") setSelectedPartyId("");
                      }}
                      placeholder="Search customer..."
                      className="w-full bg-[#070809] border border-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-[#C5A059] transition-all rounded-sm"
                    />
                    {partySearch && !selectedPartyId && (
                      <div className="absolute top-full left-0 right-0 bg-[#0F1114] border border-white/10 z-50 max-h-40 overflow-y-auto shadow-2xl">
                        {parties
                          .filter((p) => p.name.toLowerCase().includes(partySearch.toLowerCase()))
                          .map((p) => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedPartyId(p.id);
                                setPartySearch(p.name);
                              }}
                              className="px-4 py-2 text-xs hover:bg-white/5 cursor-pointer border-b border-white/5 text-left text-white"
                            >
                              {p.name}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Optional Invoice association */}
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest block">
                    Linked Invoice (Optional)
                  </label>
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => handleInvoiceChange(e.target.value)}
                    disabled={!selectedPartyId}
                    className="w-full bg-[#070809] border border-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-[#C5A059] transition-all rounded-sm disabled:opacity-40"
                  >
                    <option value="">-- No linked invoice --</option>
                    {unpaidInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_no} (Owed: PKR {inv.balance_due})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Promised Amount */}
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest block">
                    Promised Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={promisedAmount}
                    onChange={(e) => setPromisedAmount(e.target.value)}
                    placeholder="Enter amount customer committed to pay..."
                    className="w-full bg-[#070809] border border-white/5 px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-[#C5A059] transition-all rounded-sm"
                  />
                </div>

                {/* Promised Date */}
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest block">
                    Promise Commitment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={promiseDate}
                    onChange={(e) => setPromiseDate(e.target.value)}
                    className="w-full bg-[#070809] border border-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-[#C5A059] transition-all rounded-sm"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest block">
                    Notes / Verbal Agreement Details
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="E.g., Client committed to clear invoice balance via bank transfer by 3 PM..."
                    className="w-full h-20 bg-[#070809] border border-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-[#C5A059] transition-all rounded-sm resize-none"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecordModalOpen(false);
                      resetForm();
                    }}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-widest transition-colors rounded-sm text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-[#C5A059] text-black text-[9px] font-black uppercase tracking-widest hover:bg-[#C5A059]/90 disabled:opacity-50 transition-colors rounded-sm text-center"
                  >
                    {isSubmitting ? "Saving..." : "Record Commitment"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Mark Paid Modal */}
      <AnimatePresence>
        {isMarkPaidModalOpen && selectedPromiseForPayment && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0F1114] border border-white/10 p-6 w-full max-w-sm relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />

              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-xs font-black uppercase text-white tracking-widest font-mono flex items-center space-x-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Verify Payment Collection</span>
                </h3>
                <button
                  onClick={() => {
                    setIsMarkPaidModalOpen(false);
                    setSelectedPromiseForPayment(null);
                  }}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-4 p-3 bg-white/5 border border-white/5 space-y-1">
                <p className="text-[9px] uppercase text-gray-500 font-bold">Client</p>
                <p className="text-xs font-bold text-white uppercase">{selectedPromiseForPayment.party?.name}</p>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-[9px] uppercase text-gray-500 font-bold">Promised Amount</span>
                  <span className="text-xs font-mono font-bold text-[#C5A059]">{fmt(selectedPromiseForPayment.promised_amount)}</span>
                </div>
              </div>

              <form onSubmit={handleFulfillPromise} className="space-y-4 mt-4">
                {/* Actual Paid Amount */}
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest block">
                    Actual Collected Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={actualPaidAmount}
                    onChange={(e) => setActualPaidAmount(e.target.value)}
                    placeholder="Enter final received cash amount..."
                    className="w-full bg-[#070809] border border-white/5 px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-emerald-500 transition-all rounded-sm"
                  />
                </div>

                {/* Collection Date */}
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest block">
                    Actual Date of Collection *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-[#070809] border border-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500 transition-all rounded-sm"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMarkPaidModalOpen(false);
                      setSelectedPromiseForPayment(null);
                    }}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-widest transition-colors rounded-sm text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isFulfilling}
                    className="flex-1 py-3 bg-emerald-500 text-black text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-50 transition-colors rounded-sm text-center"
                  >
                    {isFulfilling ? "Updating..." : "Fulfill Promise"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
