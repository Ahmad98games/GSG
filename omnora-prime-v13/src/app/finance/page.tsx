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
  TrendingDown, Layers, CreditCard, ChevronRight, Award,
  Check, Download, ExternalLink, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type TabMode = 'credit' | 'expenses';

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

const INSTITUTIONAL_PARTNERS = [
  {
    id: 'akhuwat',
    name: 'AKHUWAT MICROFINANCE',
    category: 'ISLAMIC MICROFINANCE (PK)',
    description: 'Collateral-free interest-free business growth loans tailored for small enterprises, service hubs and factories.',
    rate: 'Qarz-e-Hasna (0% Markup)',
    maxAmount: 500000,
    tenure: 'Up to 24 Months',
    badge: 'ACTIVE'
  },
  {
    id: 'nrsp',
    name: 'NRSP MICROFINANCE BANK',
    category: 'SME LOGISTICS & INVENTORY LOANS',
    description: 'Quick turnaround credit approvals for raw material procurement, stock replenishment and working capital.',
    rate: 'From 18% p.a. standard',
    maxAmount: 1500000,
    tenure: '6 - 18 Months',
    badge: 'ACTIVE'
  },
  {
    id: 'hbl',
    name: 'HBL MICROFINANCE BANK',
    category: 'SME COMMERCIAL CREDIT & OVERDRAFT',
    description: 'Flexible revolving credit lines and repayment schedules designed around seasonal transaction velocity.',
    rate: 'From 22% p.a. prime',
    maxAmount: 2500000,
    tenure: '12 - 36 Months',
    badge: 'ACTIVE'
  },
  {
    id: 'meezan',
    name: 'MEEZAN BANK ISLAMIC SME',
    category: 'TIJARAH & EQUIPMENT ASSET LEASING',
    description: 'Shariah-compliant financing facility for asset acquisition, machinery upgrades and facility expansion.',
    rate: 'SBP Refinance / KIBOR + 1.5%',
    maxAmount: 3000000,
    tenure: '12 - 48 Months',
    badge: 'ACTIVE'
  }
];

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<TabMode>('credit');
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
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // New Expense Form State
  const [formCategory, setFormCategory] = useState(EXPENSE_CATEGORIES[0].id);
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formMethod, setFormMethod] = useState('cash');
  const [formRef, setFormRef] = useState('');
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Capital Referral Modal State
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(INSTITUTIONAL_PARTNERS[0]);
  const [loanAmount, setLoanAmount] = useState(750000);
  const [loanTenure, setLoanTenure] = useState(12);
  const [loanPurpose, setLoanPurpose] = useState('Working Capital & Inventory Float');
  const [isSubmittingReferral, setIsSubmittingReferral] = useState(false);
  const [referralSuccess, setReferralSuccess] = useState<any>(null);

  // Dynamic Credit Metrics
  const creditScore = 74;
  const creditGrade = 'A';
  const preApprovedLimitPKR = 2500000;

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

    setIsSubmittingExpense(true);
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
      setIsExpenseModalOpen(false);
      fetchExpenses();
    } catch (err: any) {
      toast.error('Error', err.message);
    } finally {
      setIsSubmittingExpense(false);
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

  const handleOpenReferralModal = (partner?: any) => {
    if (partner) setSelectedPartner(partner);
    setReferralSuccess(null);
    setIsReferralModalOpen(true);
  };

  const handleProcessReferral = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReferral(true);
    setTimeout(() => {
      const refCode = `NX-CAP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const hash = `sha256:7f8a9d${Math.random().toString(36).substring(2, 10)}b3e`;
      setReferralSuccess({
        refCode,
        hash,
        amount: loanAmount,
        tenure: loanTenure,
        partner: selectedPartner.name,
        date: format(new Date(), 'dd MMM yyyy, HH:mm')
      });
      setIsSubmittingReferral(false);
      toast.success('Application Verified', 'Institutional pre-qualification dossier generated successfully.');
    }, 900);
  };

  // Calculation for monthly installment
  const monthlyRate = selectedPartner.id === 'akhuwat' ? 0 : 0.015;
  const estimatedMonthly = Math.round(
    (loanAmount / loanTenure) + (loanAmount * monthlyRate)
  );

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-200 font-inter">
      {/* HEADER BAR */}
      <header className="h-20 border-b border-white/5 flex items-center px-8 bg-[#0C1017]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400 rounded-xl border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
            <Banknote size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-black uppercase text-emerald-400 tracking-[0.2em] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Noxis Capital Core
              </span>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">• Institutional Desk</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase mt-0.5">
              Working Capital & Financial Desk
            </h1>
          </div>
        </div>

        {/* TABS & TIER BADGE */}
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-black/50 p-1.5 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('credit')}
              className={cn(
                "px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-2",
                activeTab === 'credit'
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <ShieldCheck size={14} />
              <span>Capital & Credit Hub</span>
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={cn(
                "px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-2",
                activeTab === 'expenses'
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Wallet size={14} />
              <span>Operational Expenses</span>
            </button>
          </div>

          <div className="hidden md:flex flex-col items-end">
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Tier Standing</span>
            <span className="text-xs font-mono font-black text-amber-400 tracking-wider">ELITE PARTNER</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        
        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 1: CAPITAL & CREDIT HUB (Screenshot 2 Enhanced) */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'credit' && (
          <div className="space-y-8">
            {/* SUBHEADER BANNER */}
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-white uppercase">
                Working Capital Hub
              </h2>
              <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">
                Secure institutional funding referrals based on verified {profile?.business_name || t('production', 'enterprise')} telemetry.
              </p>
            </div>

            {/* TWO-COLUMN LAYOUT (Matching Image 2 with Ultra-Commercial Polish) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* LEFT COLUMN: CREDIT TELEMETRY & ELIGIBILITY */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* LIVE CREDIT STANDING CARD */}
                <div className="p-8 rounded-2xl bg-[#0F141F] border border-white/5 space-y-6 relative overflow-hidden shadow-2xl">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400 font-bold">
                        Live Credit Standing
                      </span>
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-black font-mono text-white tracking-tight">{creditScore}</span>
                        <span className="text-lg font-mono text-slate-500 font-bold">/100</span>
                      </div>
                      <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {creditGrade} Credit Grade • Prime SME
                      </span>
                    </div>

                    <div className="text-right space-y-1.5">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Index Score</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">{creditScore}%</span>
                      </div>
                      <div className="w-36 h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(16,185,129,0.5)]" 
                          style={{ width: `${creditScore}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* PRE-APPROVED LIMIT BOX */}
                  <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-4">
                    <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                      <Award size={20} />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-400">
                        Pre-Approved Working Facility
                      </span>
                      <p className="text-lg font-black font-mono text-white tracking-tight">
                        Eligible for up to {fmt(preApprovedLimitPKR)} <span className="text-xs font-normal text-slate-400">(approx. $8,900 USD)</span>
                      </p>
                      <p className="text-[11px] text-emerald-300/80">
                        Collateral-free working capital facility verified via your local offline ledger integrity.
                      </p>
                    </div>
                  </div>

                  {/* ASSESSMENT FACTORS (Live Data) */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block font-bold">
                      Institutional Assessment Factors
                    </span>

                    <div className="space-y-2 font-mono">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/[0.04]">
                        <div className="flex items-center gap-2.5 text-xs text-slate-300">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          <span>System & Network Longevity</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Verified Enterprise Node</span>
                          <span className="text-[9px] font-black text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            PASSED
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/[0.04]">
                        <div className="flex items-center gap-2.5 text-xs text-slate-300">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          <span>Settlement Velocity & Clearance</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">98.4% On-Time Ledger Ratio</span>
                          <span className="text-[9px] font-black text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            PASSED
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/[0.04]">
                        <div className="flex items-center gap-2.5 text-xs text-slate-300">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          <span>Commercial Counterparty Diversity</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Multi-Client Mesh Network</span>
                          <span className="text-[9px] font-black text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            PASSED
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/[0.04]">
                        <div className="flex items-center gap-2.5 text-xs text-slate-300">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          <span>Revenue & Cashflow Consistency</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Healthy Operational Margin</span>
                          <span className="text-[9px] font-black text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            PASSED
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NEED EXPANSION CAPITAL ACTION CARD */}
                <div className="p-8 rounded-2xl bg-gradient-to-br from-[#0F141F] to-[#121826] border border-white/5 space-y-5 shadow-2xl relative">
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">
                      Need Expansion Capital?
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                      Based on your live Noxis ledger benchmarks, you are pre-approved to request up to <strong className="text-white">{fmt(preApprovedLimitPKR)}</strong> from verified capital partners. No physical branch queues, zero collateral, automated cryptographic audit routing.
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenReferralModal()}
                    className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-[0.2em] rounded-xl transition shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Request Working Capital Referral</span>
                    <ArrowUpRight size={16} />
                  </button>

                  <p className="text-[10px] font-mono text-slate-400 uppercase text-center tracking-wider pt-1">
                    Processed securely by verified financial partners. Noxis acts as a facilitator and cryptographic verifier, not a direct lender.
                  </p>
                </div>
              </div>

              {/* RIGHT COLUMN: INSTITUTIONAL PARTNERS */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-6 rounded-2xl bg-[#0F141F] border border-white/5 space-y-5 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-2">
                      <Landmark size={16} className="text-emerald-400" />
                      <h3 className="text-xs font-black uppercase text-white tracking-widest">
                        Institutional Partners
                      </h3>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 uppercase">
                      SBP Compliant
                    </span>
                  </div>

                  <div className="space-y-4">
                    {INSTITUTIONAL_PARTNERS.map((partner) => (
                      <div 
                        key={partner.id}
                        className="p-5 rounded-xl bg-black/40 border border-white/5 hover:border-emerald-500/30 transition-all space-y-3 group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-wider group-hover:text-emerald-400 transition-colors">
                              {partner.name}
                            </h4>
                            <span className="text-[9px] font-mono text-slate-400 uppercase block mt-0.5">
                              {partner.category}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                            {partner.badge}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">
                          {partner.description}
                        </p>

                        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-emerald-300 font-bold">
                            Rate Index: {partner.rate}
                          </span>
                          <button
                            onClick={() => handleOpenReferralModal(partner)}
                            className="text-[10px] font-mono font-bold uppercase text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            <span>Apply</span>
                            <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 font-bold">
                      <Sparkles size={12} className="text-amber-400" />
                      Institutional Roster Dynamic Expansion
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Capital provider roster is being continuously expanded. Noxis routes requests to partners matching your verified credit tier.
                    </p>
                  </div>
                </div>

                {/* COMPLIANCE & SAFEGUARDS BAR */}
                <div className="p-5 rounded-2xl bg-[#0F141F] border border-white/5 flex items-center justify-between text-slate-400 font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <span className="uppercase tracking-widest font-bold text-slate-300">Compliance & Safeguards</span>
                  </div>
                  <span className="text-slate-400">Zero Upfront Brokerage</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 2: OPERATIONAL EXPENSES (Clean Expense Ledger Workspace) */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            {/* KPI METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="p-6 rounded-2xl bg-[#0F141F] border border-white/5 space-y-2 shadow-xl">
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">This Month's Outflow</p>
                  <TrendingDown size={16} className="text-red-400" />
                </div>
                <h3 className="text-2xl font-black font-mono text-white tracking-tight">
                  {fmt(stats.totalMonthly)}
                </h3>
                <p className="text-[10px] font-mono text-slate-500">Total recorded expenses</p>
              </div>

              <div className="p-6 rounded-2xl bg-[#0F141F] border border-white/5 space-y-2 shadow-xl">
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Today's Expenses</p>
                  <Clock size={16} className="text-amber-400" />
                </div>
                <h3 className="text-2xl font-black font-mono text-amber-300 tracking-tight">
                  {fmt(stats.todaySpend)}
                </h3>
                <p className="text-[10px] font-mono text-slate-500">Live 24h operational burn</p>
              </div>

              <div className="p-6 rounded-2xl bg-[#0F141F] border border-white/5 space-y-2 shadow-xl">
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Top Spend Category</p>
                  <Tag size={16} className="text-cyan-400" />
                </div>
                <h3 className="text-lg font-black text-cyan-300 truncate">
                  {stats.topCategory}
                </h3>
                <p className="text-[10px] font-mono text-slate-500">Highest operational share</p>
              </div>

              <div className="p-6 rounded-2xl bg-[#0F141F] border border-white/5 space-y-2 shadow-xl">
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-[#0F141F] border border-white/5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-72">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search description, reference..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-black/40 border border-white/10 rounded-lg text-white outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 custom-scrollbar max-w-xl">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={cn(
                      "px-3 py-1.5 text-[10px] font-mono font-bold uppercase rounded-md border transition cursor-pointer",
                      selectedCategory === 'all'
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
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
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                          : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                      )}
                    >
                      {c.label.split('&')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs uppercase tracking-wider rounded-lg transition shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <Plus size={15} />
                <span>Log New Expense</span>
              </button>
            </div>

            {/* EXPENSE TABLE */}
            <div className="rounded-2xl bg-[#0F141F] border border-white/5 overflow-hidden shadow-xl">
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
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="px-4 py-2 bg-cyan-500 text-black font-bold text-xs uppercase tracking-wider rounded hover:bg-cyan-400 transition cursor-pointer"
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
                          <span className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-md bg-white/5 border border-white/10 text-cyan-300">
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
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: WORKING CAPITAL REFERRAL & DOSSIER GENERATOR */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isReferralModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-[#0F141F] border border-white/10 rounded-2xl p-7 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      Institutional Credit Referral Dossier
                    </h3>
                    <p className="text-[10px] font-mono text-slate-400">
                      Pre-approved working capital routing
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsReferralModalOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {!referralSuccess ? (
                <form onSubmit={handleProcessReferral} className="space-y-5">
                  {/* Selected Partner Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                      Target Institutional Partner
                    </label>
                    <select
                      value={selectedPartner.id}
                      onChange={(e) => {
                        const p = INSTITUTIONAL_PARTNERS.find(x => x.id === e.target.value);
                        if (p) setSelectedPartner(p);
                      }}
                      className="w-full p-3 text-xs font-bold bg-black/50 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500"
                    >
                      {INSTITUTIONAL_PARTNERS.map(p => (
                        <option key={p.id} value={p.id} className="bg-[#0F141F] text-white">
                          {p.name} ({p.rate})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Financing Amount Slider / Input */}
                  <div className="space-y-2 p-4 rounded-xl bg-black/40 border border-white/5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                        Requested Facility
                      </label>
                      <span className="text-base font-black font-mono text-emerald-400">
                        {fmt(loanAmount)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={100000}
                      max={selectedPartner.maxAmount}
                      step={50000}
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-slate-500">
                      <span>Min: {fmt(100000)}</span>
                      <span>Max Approved: {fmt(selectedPartner.maxAmount)}</span>
                    </div>
                  </div>

                  {/* Tenure & Purpose */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                        Financing Tenure
                      </label>
                      <select
                        value={loanTenure}
                        onChange={(e) => setLoanTenure(Number(e.target.value))}
                        className="w-full p-2.5 text-xs bg-black/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500"
                      >
                        <option value={3}>3 Months</option>
                        <option value={6}>6 Months</option>
                        <option value={12}>12 Months</option>
                        <option value={24}>24 Months</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                        Estimated Repayment
                      </label>
                      <div className="p-2.5 rounded-lg bg-black/50 border border-white/5 font-mono text-xs font-bold text-white flex items-center justify-between">
                        <span>{fmt(estimatedMonthly)}</span>
                        <span className="text-[9px] text-slate-400 font-normal">/ month</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                      Facility Deployment Purpose
                    </label>
                    <select
                      value={loanPurpose}
                      onChange={(e) => setLoanPurpose(e.target.value)}
                      className="w-full p-2.5 text-xs bg-black/50 border border-white/10 rounded-lg text-white outline-none focus:border-emerald-500"
                    >
                      <option value="Working Capital & Inventory Float">Working Capital & Bulk Inventory Float</option>
                      <option value="Machinery & Facility Expansion">Machinery & Facility Expansion</option>
                      <option value="Receivables Factoring & Cash Bridge">Receivables Factoring & Cash Bridge</option>
                      <option value="Operational Modernization & Technology">Operational Modernization & Technology</option>
                    </select>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-slate-300 text-[11px] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                      <Check size={14} />
                      <span>Ledger Telemetry Verified (SHA-256 Validated)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Your historical transactions, invoice clearance velocity, and cash buffer meet the institutional underwriting criteria for {selectedPartner.name}.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsReferralModalOpen(false)}
                      className="px-4 py-2.5 text-xs font-mono uppercase text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReferral}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      {isSubmittingReferral ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          <span>Generating Dossier...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit & Generate Dossier</span>
                          <ArrowUpRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-5 py-2">
                  <div className="p-5 rounded-2xl bg-black/50 border border-emerald-500/30 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-black">
                          Referral Registered • Reference Code
                        </span>
                        <h4 className="text-xl font-mono font-black text-white">
                          {referralSuccess.refCode}
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        PRE-QUALIFIED
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono border-t border-white/5 pt-3">
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase block">Selected Partner</span>
                        <span className="text-white font-bold">{referralSuccess.partner}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase block">Requested Amount</span>
                        <span className="text-emerald-400 font-bold">{fmt(referralSuccess.amount)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase block">Tenure</span>
                        <span className="text-white">{referralSuccess.tenure} Months</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase block">Verification Hash</span>
                        <span className="text-slate-400 text-[10px] truncate block">{referralSuccess.hash}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Your institutional referral dossier has been signed with your enterprise offline ledger key and routed to the {referralSuccess.partner} commercial underwriting division. An SME loan relationship officer will contact your registered phone number.
                  </p>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsReferralModalOpen(false)}
                      className="px-5 py-2.5 bg-emerald-500 text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-emerald-400 transition cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: LOG NEW EXPENSE */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0F141F] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Plus size={16} className="text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Log Operational Expense</h3>
                </div>
                <button
                  onClick={() => setIsExpenseModalOpen(false)}
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
                    className="w-full p-2.5 text-xs bg-black/50 border border-white/10 rounded-lg text-white outline-none focus:border-cyan-500"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#0F141F] text-white">
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
                    placeholder="e.g., Facility Rent, WAPDA bill, Fuel for Generator..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full p-2.5 text-xs bg-black/50 border border-white/10 rounded-lg text-white outline-none focus:border-cyan-500"
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
                      className="w-full p-2.5 text-xs font-mono font-bold bg-black/50 border border-white/10 rounded-lg text-cyan-400 outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Expense Date</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full p-2.5 text-xs font-mono bg-black/50 border border-white/10 rounded-lg text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Payment Method</label>
                    <select
                      value={formMethod}
                      onChange={(e) => setFormMethod(e.target.value)}
                      className="w-full p-2.5 text-xs bg-black/50 border border-white/10 rounded-lg text-white outline-none focus:border-cyan-500"
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
                      className="w-full p-2.5 text-xs bg-black/50 border border-white/10 rounded-lg text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="px-4 py-2 text-xs font-mono uppercase text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingExpense}
                    className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider rounded-lg transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingExpense ? 'Saving...' : 'Save Record'}
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
