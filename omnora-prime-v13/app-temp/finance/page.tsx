'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useTierStore } from '@/stores/tierStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Banknote, Sparkles, ShieldCheck, Clock, ArrowUpRight, 
  HelpCircle, CheckCircle2, AlertTriangle, Building, 
  Percent, Coins, Wallet, Landmark, Loader2 
} from 'lucide-react';

type FinanceScore = {
  score: number;       // 0-100
  grade: string;       // A, B, C, D, Unrated
  max_loan_usd: number;
  factors: {
    label: string;
    value: string;
    positive: boolean;
  }[];
};

async function calculateFinanceScore(
  businessId: string,
  supabase: ReturnType<typeof createClient>
): Promise<FinanceScore> {
  let score = 0;
  const factors = [];
  
  // Factor 1: How long on Noxis? (0-20 pts)
  const { data: profile } = await supabase
    .from('business_profiles')
    .select('created_at')
    .eq('id', businessId)
    .single();
  
  const monthsActive = profile
    ? Math.floor(
        (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
      )
    : 0;
  
  const activityScore = Math.min(20, monthsActive * 4);
  score += activityScore;
  factors.push({
    label: 'Time on Noxis Network',
    value: `${monthsActive} months`,
    positive: monthsActive >= 3,
  });
  
  // Factor 2: Invoice volume (0-30 pts)
  const threeMonthsAgo = new Date(
    Date.now() - 90 * 24 * 60 * 60 * 1000
  ).toISOString();
  
  const { count: invoiceCount } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .gte('created_at', threeMonthsAgo);
  
  const invoiceScore = Math.min(30, (invoiceCount || 0) * 3);
  score += invoiceScore;
  factors.push({
    label: 'Invoice volume (last 90 days)',
    value: `${invoiceCount || 0} invoices`,
    positive: (invoiceCount || 0) >= 5,
  });
  
  // Factor 3: Customer diversity (0-20 pts)
  const { data: customers } = await supabase
    .from('invoices')
    .select('party_id')
    .eq('business_id', businessId)
    .gte('created_at', threeMonthsAgo);
  
  const uniqueCustomers = new Set(
    customers?.map((c: any) => c.party_id) || []
  ).size;
  
  const customerScore = Math.min(20, uniqueCustomers * 4);
  score += customerScore;
  factors.push({
    label: 'Active buyer nodes',
    value: `${uniqueCustomers} customers`,
    positive: uniqueCustomers >= 3,
  });
  
  // Factor 4: Revenue consistency (0-30 pts)
  const { data: monthlyRevenue } = await supabase
    .rpc('get_monthly_revenue_trend', {
      p_business_id: businessId,
      p_months: 3,
    });
  
  const hasConsistentRevenue =
    (monthlyRevenue as any)?.every((m: any) => Number(m.revenue) > 0) || false;
  
  const consistencyScore = hasConsistentRevenue ? 30 : 10;
  score += consistencyScore;
  factors.push({
    label: 'Revenue consistency',
    value: hasConsistentRevenue ? '3 months active' : 'Needs more consistency',
    positive: hasConsistentRevenue,
  });
  
  // Calculate grade and max loan
  const grade = score >= 80 ? 'A'
    : score >= 60 ? 'B'
    : score >= 40 ? 'C'
    : score >= 20 ? 'D'
    : 'Unrated';
  
  // Max loan in USD (conservative)
  const maxLoanUsd = score >= 80 ? 5000
    : score >= 60 ? 2500
    : score >= 40 ? 1000
    : score >= 20 ? 500
    : 0;
  
  return { score, grade, max_loan_usd: maxLoanUsd, factors };
}

export default function FinancePage() {
  const { profile } = useBusinessProfile();
  const { tier } = useTierStore();
  const supabase = createClient();
  
  const [financeScore, setFinanceScore] = useState<FinanceScore | null>(null);
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applyStep, setApplyStep] = useState<'none' | 'form' | 'submitted'>('none');
  const [applyData, setApplyData] = useState({
    amount: '',
    purpose: '',
    repayment_months: 6,
  });
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    if (!profile?.id) return;
    loadFinanceData();
  }, [profile?.id]);
  
  const loadFinanceData = async () => {
    if (!profile?.id) return;
    
    try {
      const [score, app] = await Promise.all([
        calculateFinanceScore(profile.id, supabase),
        supabase
          .from('finance_applications')
          .select('*')
          .eq('business_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      
      setFinanceScore(score);
      setApplication(app.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  
  const handleApply = async () => {
    if (!profile?.id || !financeScore) return;
    setSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('finance_applications')
        .insert({
          business_id: profile.id,
          amount_requested: parseFloat(applyData.amount),
          currency: profile.currency || 'PKR',
          purpose: applyData.purpose,
          repayment_months: applyData.repayment_months,
          status: 'submitted',
          partner_name: 'Omnora Finance Partner',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (!error && data) {
        setApplication(data);
        setApplyStep('submitted');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };
  
  const gradeColor = (grade: string) => {
    const classes: Record<string, string> = {
      A: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
      B: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5',
      C: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
      D: 'text-red-400 border-red-500/30 bg-red-500/5',
      Unrated: 'text-gray-400 border-white/10 bg-[#0F1114]',
    };
    return classes[grade] || 'text-gray-400';
  };
  
  const gradeLabel = (grade: string) => {
    const labels: Record<string, string> = {
      A: 'Excellent Credit Rating',
      B: 'Strong Credit Profile',
      C: 'Moderate Credit Capacity',
      D: 'Marginal Standing',
      Unrated: 'Awaiting Dynamic Data Points',
    };
    return labels[grade] || 'Credit Assessment Active';
  };

  if (loading) return (
    <div className="min-h-screen bg-[#07090B] text-gray-400 flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 text-electric-blue animate-spin" />
      <span className="text-xs uppercase font-black tracking-[0.2em] text-gray-500">Retrieving Financial Records...</span>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-[#07090B] text-gray-200 p-6 md:p-8 font-sans select-none relative">
      <div className="absolute top-0 right-0 w-[600px] h-[300px] bg-electric-blue/5 rounded-full blur-[160px] pointer-events-none" />
      
      <main className="max-w-4xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-electric-blue/5 border border-electric-blue/20 px-3 py-1 rounded-full mb-3">
              <Landmark className="text-electric-blue" size={14} />
              <span className="text-[10px] font-black text-electric-blue uppercase tracking-widest">Noxis Capital Core</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white italic">
              Working Capital Hub
            </h1>
            <p className="text-gray-500 text-xs mt-1 uppercase font-bold tracking-wider">
              Secure institutional funding referrals based on verified factory telemetry.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-[#0C0F12] border border-white/5 rounded-sm text-center">
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-600 block">Tier Standing</span>
              <span className="text-xs font-black uppercase text-electric-blue">{tier}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Scoring and Factors (2 cols width on desktop) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Score Card */}
            {financeScore && (
              <div className="bg-[#0C0F12] border border-white/5 p-6 rounded-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1/3 h-[1px] bg-electric-blue" />
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
                  <div className="space-y-1">
                    <p className="text-xxs font-black uppercase tracking-widest text-gray-500">Live Credit Standing</p>
                    <div className="flex flex-col">
                      <div className="flex items-end gap-2 mb-1">
                        <span className="text-4xl font-mono font-black text-white">
                          {financeScore.score}
                        </span>
                        <span className="text-base text-gray-600 mb-1">
                          /100
                        </span>
                      </div>
                      <div className={`text-xl font-bold ${gradeColor(financeScore.grade)}`}>
                        {financeScore.grade}
                      </div>
                      <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">
                        {financeScore.grade === 'Unrated'
                          ? 'Awaiting data'
                          : 'Credit grade'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress Meter */}
                  <div className="w-full md:w-32 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      <span>Index Score</span>
                      <span className="text-white">{financeScore.score}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden p-[1px]">
                      <div 
                        className="h-full bg-electric-blue rounded-full transition-all duration-1000"
                        style={{ width: `${financeScore.score}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Score Limit Alert */}
                {financeScore.max_loan_usd > 0 ? (
                  <div className="mb-6 p-4 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-sm flex items-center gap-3">
                    <Coins className="text-emerald-400 shrink-0" size={18} />
                    <div>
                      <p className="text-xxs font-black uppercase tracking-widest text-emerald-500">PRE-APPROVED LIMIT</p>
                      <p className="text-xs text-white font-medium">
                        Eligible for up to <span className="font-mono text-emerald-400 font-bold">${financeScore.max_loan_usd.toLocaleString()} USD</span> in collateral-free working capital.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-red-500/[0.02] border border-red-500/10 rounded-sm flex items-center gap-3">
                    <AlertTriangle className="text-red-400 shrink-0" size={18} />
                    <div>
                      <p className="text-xxs font-black uppercase tracking-widest text-red-500">LIMIT UNAVAILABLE</p>
                      <p className="text-xs text-gray-400">
                        A minimum score of 20 is required to unlock financing. Continue posting operations logs to unlock.
                      </p>
                    </div>
                  </div>
                )}

                {/* Factors List */}
                <div className="space-y-3">
                  <h3 className="text-xxs font-black uppercase tracking-widest text-gray-500 mb-2">Assessment Factors</h3>
                  {financeScore.factors.map((f, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0 hover:bg-white/[0.01] px-2 rounded-sm transition-colors">
                      <div className="flex items-center gap-2">
                        {f.positive ? (
                          <CheckCircle2 size={12} className="text-emerald-400" />
                        ) : (
                          <HelpCircle size={12} className="text-amber-400" />
                        )}
                        <span className="text-xs text-gray-400 font-medium">{f.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-white font-bold">{f.value}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${f.positive ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {f.positive ? 'PASSED' : 'LOW'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Score tips */}
                {financeScore.score < 60 && (
                  <div className="mt-6 p-4 bg-[#161A1F]/30 border border-white/5 rounded-sm flex items-start gap-2.5">
                    <Sparkles className="text-electric-blue shrink-0 mt-0.5" size={12} />
                    <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                      💡 <strong className="text-white">Optimizer Tip:</strong> You can quickly boost your scoring index. Issue standard digital invoices to at least 3 distinct customers, register past payments, and maintain regular logistics flow.
                    </p>
                  </div>
                )}

              </div>
            )}

            {/* Applications Stream / Form */}
            <AnimatePresence mode="wait">
              {application?.status === 'submitted' || applyStep === 'submitted' ? (
                <motion.div 
                  key="submitted"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-6 bg-emerald-500/[0.02] border border-emerald-500/20 rounded-sm text-center space-y-4"
                >
                  <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto animate-pulse" />
                  <div>
                    <h3 className="text-sm font-black uppercase text-emerald-400 tracking-wider">Application Under Review</h3>
                    <p className="text-xs text-gray-400 mt-2 max-w-md mx-auto leading-relaxed">
                      Our institutional finance partners are validating your telemetry credentials. Review completion takes 2 business days. referral callbacks will arrive directly on your verified WhatsApp.
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="text-xxs font-mono text-gray-500 uppercase tracking-widest block">Application ID: {application?.id || 'Pending Generation'}</span>
                  </div>
                </motion.div>
              ) : applyStep === 'form' ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-6 bg-[#0C0F12] border border-white/5 rounded-sm space-y-6"
                >
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-electric-blue">Submit referral Application</h3>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">Collateral-Free Capital REFERRAL</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">
                        Required Funding Amount ({profile?.currency || 'PKR'})
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={applyData.amount}
                          onChange={e => setApplyData(p => ({ ...p, amount: e.target.value }))}
                          placeholder="500000"
                          className="w-full bg-[#161A1F] border border-white/5 text-white text-sm px-4 py-3 outline-none focus:border-electric-blue/40 font-mono transition-colors rounded-sm"
                        />
                        <span className="absolute right-4 top-3.5 text-xs text-gray-500 font-mono">{profile?.currency}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">
                        Funding Purpose
                      </label>
                      <select
                        value={applyData.purpose}
                        onChange={e => setApplyData(p => ({ ...p, purpose: e.target.value }))}
                        className="w-full bg-[#161A1F] border border-white/5 text-white text-xs px-4 py-3 outline-none focus:border-electric-blue/40 transition-colors rounded-sm"
                      >
                        <option value="">Select capital use-case...</option>
                        <option value="raw_materials">Acquire Raw Materials & Stock</option>
                        <option value="equipment">Purchase Industrial Equipment</option>
                        <option value="payroll">Bridge Monthly Labor Payroll</option>
                        <option value="expansion">Expand Factory Output Capacity</option>
                        <option value="other">General Capital Adjustment</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">
                        Requested Repayment Window
                      </label>
                      <div className="grid grid-cols-4 gap-3">
                        {[3, 6, 9, 12].map(m => (
                          <button 
                            key={m}
                            type="button"
                            onClick={() => setApplyData(p => ({ ...p, repayment_months: m }))}
                            className={`py-3 text-xs font-black border rounded-sm transition-all ${
                              applyData.repayment_months === m
                                ? 'border-electric-blue/30 text-electric-blue bg-electric-blue/5'
                                : 'border-white/5 text-gray-400 hover:border-white/10'
                            }`}
                          >
                            {m} Months
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setApplyStep('none')}
                        className="flex-1 py-3 text-xs font-black uppercase tracking-widest border border-white/10 text-gray-400 hover:border-white/20 transition-all rounded-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleApply}
                        disabled={submitting || !applyData.amount || !applyData.purpose}
                        className="flex-1 py-3 text-xs font-black uppercase tracking-widest bg-electric-blue text-black hover:bg-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-sm flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Referral Transmitting...</span>
                          </>
                        ) : (
                          <span>Transmit Application</span>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                financeScore && financeScore.score >= 20 && (
                  <motion.div
                    key="intro"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-[#0C0F12] border border-white/5 rounded-sm relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,229,255,0.01)_0%,transparent_60%)] pointer-events-none" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-white mb-2">Need Expansion Capital?</h3>
                    <p className="text-[11px] text-gray-400 leading-relaxed mb-6">
                      Based on your live Noxis ledger benchmarks, you are pre-approved to request up to <span className="text-emerald-400 font-bold font-mono">${financeScore.max_loan_usd.toLocaleString()} USD</span> from verified capital partners. No bank visits, zero collateral, quick refer-routing.
                    </p>
                    
                    <button
                      onClick={() => setApplyStep('form')}
                      className="w-full py-4 text-xs font-black uppercase tracking-widest bg-electric-blue text-black hover:bg-cyan-300 transition-all rounded-sm flex items-center justify-center gap-1.5"
                    >
                      <span>Request Working Capital Referral</span>
                      <ArrowUpRight size={14} />
                    </button>
                    
                    <p className="text-[9px] text-gray-600 text-center mt-3 font-semibold uppercase tracking-wider">
                      Processed securely by verified financial partners. Noxis acts as a facilitator, not a direct lender.
                    </p>
                  </motion.div>
                )
              )}
            </AnimatePresence>

          </div>

          {/* RIGHT: Financial Partners (1 col width) */}
          <div className="space-y-8">
            
            {/* Partners Card */}
            <div className="bg-[#0C0F12] border border-white/5 p-6 rounded-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1/2 h-[1px] bg-electric-blue" />
              
              <div className="flex items-center gap-2 mb-4">
                <Building size={16} className="text-electric-blue" />
                <h3 className="text-xxs font-black uppercase tracking-widest text-gray-400">Institutional Partners</h3>
              </div>

              <div className="space-y-4">
                {[
                  {
                    name: 'Akhuwat microfinance',
                    focus: 'Islamic Microfinance (PK)',
                    rate: 'Qarz-e-Hasna (0% Markup)',
                    desc: 'Collateral-free interest-free business growth loans tailored for small factories.'
                  },
                  {
                    name: 'NRSP Microfinance Bank',
                    focus: 'SME Logistics Loans',
                    rate: 'From 18% p.a. standard',
                    desc: 'Quick approvals for raw material bulk inventory orders.'
                  },
                  {
                    name: 'HBL Microfinance Bank',
                    focus: 'SME Commercial Credit',
                    rate: 'From 24% p.a. standard',
                    desc: 'Flexible terms and repayment schedules based on seasonal output levels.'
                  },
                ].map((partner, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-black/30 border border-white/5 rounded-sm hover:border-white/10 transition-colors space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black uppercase text-white tracking-tight group-hover:text-electric-blue transition-colors">
                        {partner.name}
                      </p>
                      <span className="text-[8px] font-black px-1.5 py-0.5 bg-electric-blue/5 text-electric-blue border border-electric-blue/10 rounded-sm">
                        ACTIVE
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                      {partner.focus}
                    </p>
                    <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                      {partner.desc}
                    </p>
                    <div className="text-[9px] font-mono text-emerald-400 font-bold pt-1">
                      Rate Index: {partner.rate}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-3 bg-[#161A1F]/30 border border-white/5 rounded-sm text-[9px] text-gray-500 leading-relaxed font-semibold uppercase tracking-wider">
                📢 Capital provider roster is being continuously expanded. Noxis routes requests to partners matching your specific profile.
              </div>
            </div>

            {/* Safety and Security Badges */}
            <div className="bg-[#0C0F12]/40 border border-white/5 p-4 rounded-sm space-y-3 opacity-60">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-electric-blue" />
                <h4 className="text-[9px] font-black uppercase tracking-widest text-white">Compliance & Safeguards</h4>
              </div>
              <p className="text-[9px] text-gray-500 leading-relaxed font-medium">
                Noxis utilizes industry-grade end-to-end encryption. Ledger indices are transmitted anonymously to partners, protecting proprietary trading balances.
              </p>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
