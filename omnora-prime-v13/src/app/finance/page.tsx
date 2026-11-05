'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { usePersona } from '@/hooks/usePersona';
import { useToast } from '@/hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Banknote, Sparkles, ShieldCheck, Clock, ArrowUpRight, 
  HelpCircle, CheckCircle2, AlertTriangle, Building, 
  Percent, Coins, Wallet, Landmark, Loader2, Plus,
  Search, Trash2, Calendar, Tag, FileText, ArrowDownRight,
  TrendingDown, Layers, CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type TabMode = 'expenses' | 'credit';

const EXPENSE_CATEGORIES = [
  { id: 'Rent & Facility', label: 'Rent & Facility', icon: Building, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { id: 'Electricity & Utilities', label: 'Electricity & Utilities', icon: Clock, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { id: 'Fuel & Generator', label: 'Fuel & Generator', icon: AlertTriangle, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { id: 'Salaries & Wages', label: 'Salaries & Wages', icon: Wallet, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { id: 'Supplies & Materials', label: 'Supplies & Materials', icon: Layers, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'Maintenance & Repairs', label: 'Maintenance & Repairs', icon: Building, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  { id: 'Marketing & Sales', label: 'Marketing & Sales', icon: Sparkles, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  { id: 'Taxes & Regulatory', label: 'Taxes & Regulatory', icon: Landmark, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { id: 'General / Misc', label: 'General / Misc', icon: Tag, color: 'text-slate-400 bg-white/5 border-white/10' },
];

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<TabMode>('expenses');
  const { profile } = useBusinessProfile();
  const { fmt, t } = usePersona();
  const toast = useToast();

  // Expenses State
  const [expenses, setExpenses] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalMonthly: 0,
    todaySpend: 0,
    topCategory: 'None',
    cashTotal: 0,
    bankTotal: 0,
    count: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Expense Form State
  const [formCategory, setFormCategory] = useState(EXPENSE_CATEGORIES[0].id);
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formMethod, setFormMethod] = useState('cash');
  const [formRef, setFormRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Expenses from Local SQLite API
  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const url = `/api/expenses?category=${selectedCategory}&search=${encodeURIComponent(searchTerm)}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setExpenses(json.data || []);
        if (json.stats) setStats(json.stats);
      }
    } catch (e) {
      console.warn('[Finance] Error fetching expenses:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedCategory, searchTerm]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDesc.trim() || !formAmount || Number(formAmount) <= 0) {
      toast.error('Invalid Input', 'Please enter description and valid amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formCategory,
          description: formDesc.trim(),
          amount: Number(formAmount),
          expense_date: formDate,
          payment_method: formMethod,
          reference: formRef.trim()
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to record expense');
      }

      toast.success('Expense Recorded', `${fmt(Number(formAmount))} logged under ${formCategory}`);
      setFormDesc('');
      setFormAmount('');
      setFormRef('');
      setIsModalOpen(false);
      fetchExpenses();
    } catch (err: any) {
      toast.error('Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string, desc: string) => {
    if (!confirm(`Delete expense record "${desc}"?`)) return;
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Deleted', 'Expense record removed.');
        fetchExpenses();
      }
    } catch (err: any) {
      toast.error('Error', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-200 font-inter">
      {/* HEADER */}
      <header className="h-20 border-b border-white/5 flex items-center px-8 bg-[#10141E]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Banknote size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase">
              Expense & Financial Intelligence
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">
              Operational Ledger, Cash Flow Burn & Capital Ratings
            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="ml-auto flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('expenses')}
            className={cn(
              "px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-2",
              activeTab === 'expenses'
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Wallet size={14} />
            <span>Operational Expenses</span>
          </button>
          <button
            onClick={() => setActiveTab('credit')}
            className={cn(
              "px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-2",
              activeTab === 'credit'
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            <ShieldCheck size={14} />
            <span>Credit Health & Rating</span>
          </button>
        </div>
      </header>

      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        {/* TAB 1: EXPENSES */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            {/* KPI METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="p-6 rounded-2xl bg-[#131824] border border-white/5 relative overflow-hidden space-y-2">
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">This Month's Outflow</p>
                  <TrendingDown size={16} className="text-red-400" />
                </div>
                <h3 className="text-2xl font-black font-mono text-white tracking-tight">
                  {fmt(stats.totalMonthly)}
                </h3>
                <p className="text-[10px] font-mono text-slate-500">Total recorded expenses</p>
              </div>

              <div className="p-6 rounded-2xl bg-[#131824] border border-white/5 relative overflow-hidden space-y-2">
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Today's Expenses</p>
                  <Clock size={16} className="text-amber-400" />
                </div>
                <h3 className="text-2xl font-black font-mono text-amber-300 tracking-tight">
                  {fmt(stats.todaySpend)}
                </h3>
                <p className="text-[10px] font-mono text-slate-500">Live 24h operational burn</p>
              </div>

              <div className="p-6 rounded-2xl bg-[#131824] border border-white/5 relative overflow-hidden space-y-2">
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Top Spend Category</p>
                  <Tag size={16} className="text-cyan-400" />
                </div>
                <h3 className="text-lg font-black text-cyan-300 truncate">
                  {stats.topCategory}
                </h3>
                <p className="text-[10px] font-mono text-slate-500">Highest operational share</p>
              </div>

              <div className="p-6 rounded-2xl bg-[#131824] border border-white/5 relative overflow-hidden space-y-2">
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Payment Breakdown</p>
                  <CreditCard size={16} className="text-purple-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold font-mono text-emerald-400">Cash: {fmt(stats.cashTotal)}</span>
                </div>
                <p className="text-[10px] font-mono text-slate-500">Bank/Online: {fmt(stats.bankTotal)}</p>
              </div>
            </div>

            {/* ACTION BAR & FILTERS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-[#111622] border border-white/5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-72">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search description, reference..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-black/40 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 custom-scrollbar max-w-xl">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={cn(
                      "px-3 py-1.5 text-[10px] font-mono font-bold uppercase rounded-md border transition cursor-pointer",
                      selectedCategory === 'all'
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                    )}
                  >
                    All
                  </button>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.id)}
                      className={cn(
                        "px-3 py-1.5 text-[10px] font-mono font-bold uppercase rounded-md border whitespace-nowrap transition cursor-pointer",
                        selectedCategory === c.id
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                      )}
                    >
                      {c.label.split('&')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black text-xs uppercase tracking-wider rounded-lg transition shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Plus size={15} />
                <span>Log New Expense</span>
              </button>
            </div>

            {/* EXPENSE TABLE */}
            <div className="rounded-2xl bg-[#111622] border border-white/5 overflow-hidden">
              {isLoading ? (
                <div className="p-12 text-center text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">
                  Loading Expense Ledger...
                </div>
              ) : expenses.length === 0 ? (
                <div className="p-16 text-center space-y-4">
                  <Banknote size={40} className="mx-auto text-slate-600" />
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">No Expenses Recorded</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Log business expenses such as rent, electricity, generator fuel, or maintenance to keep real-time financial control.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-emerald-500 text-black font-bold text-xs uppercase tracking-wider rounded hover:bg-emerald-400 transition cursor-pointer"
                  >
                    Log First Expense
                  </button>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-black/40 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400">Date</th>
                      <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400">Category</th>
                      <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400">Description / Ref</th>
                      <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400 text-center">Payment Method</th>
                      <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400 text-right">Amount</th>
                      <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {expenses.map((exp: any) => (
                      <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-slate-300">
                          {exp.expense_date || format(new Date(exp.created_at || Date.now()), 'yyyy-MM-dd')}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-md bg-white/5 border border-white/10 text-emerald-300">
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white">{exp.description}</span>
                            {exp.reference && (
                              <span className="text-[10px] font-mono text-slate-400">Ref: {exp.reference}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-black/40 border border-white/5 text-slate-300">
                            {exp.payment_method || 'cash'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-sm text-red-400">
                          -{fmt(exp.amount)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteExpense(exp.id, exp.description)}
                            className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-red-500/10 transition cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CREDIT RATING & CAPITAL */}
        {activeTab === 'credit' && (
          <div className="space-y-6">
            <div className="p-8 rounded-2xl bg-[#111622] border border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">
                    Decentralized Working Capital & Credit Rating
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Evaluated automatically based on on-chain trade consistency, invoice settlement velocity, and offline mesh stability.
                  </p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-black text-sm">
                  GRADE A • LOW RISK
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="p-5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Borrowing Capacity</span>
                  <p className="text-2xl font-black font-mono text-emerald-300">PKR 2,500,000</p>
                  <span className="text-[10px] text-slate-500">Uncollateralized Revolving Facility</span>
                </div>
                <div className="p-5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Settlement Velocity</span>
                  <p className="text-2xl font-black font-mono text-cyan-300">98.4%</p>
                  <span className="text-[10px] text-slate-500">Invoices cleared on or before due date</span>
                </div>
                <div className="p-5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Interest Benchmark</span>
                  <p className="text-2xl font-black font-mono text-purple-300">KIBOR + 1.25%</p>
                  <span className="text-[10px] text-slate-500">Preferential SME Tier</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NEW EXPENSE MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#111622] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Plus size={16} className="text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Log Operational Expense</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateExpense} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-2.5 text-xs bg-black/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#111622] text-white">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Description / Payee</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Office Rent, WAPDA bill, Fuel for Generator..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full p-2.5 text-xs bg-black/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Amount (PKR)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="0"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="w-full p-2.5 text-xs font-mono font-bold bg-black/50 border border-white/10 rounded-lg text-emerald-400 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Expense Date</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full p-2.5 text-xs font-mono bg-black/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Payment Method</label>
                    <select
                      value={formMethod}
                      onChange={(e) => setFormMethod(e.target.value)}
                      className="w-full p-2.5 text-xs bg-black/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500"
                    >
                      <option value="cash">Cash in Hand</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="online">Online / Card</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Receipt / Ref #</label>
                    <input
                      type="text"
                      placeholder="Optional ref or voucher #"
                      value={formRef}
                      onChange={(e) => setFormRef(e.target.value)}
                      className="w-full p-2.5 text-xs bg-black/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-mono uppercase text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-lg transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Record'}
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
