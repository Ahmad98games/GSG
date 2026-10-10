"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, Plus, Search, Filter,
  TrendingUp, Clock, RefreshCw,
  X, Check, ArrowRightLeft, DollarSign,
  Calculator, Trash2, AlertCircle, ShieldCheck
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

interface ExchangeRateItem {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  effective_date: string;
  source: string;
}

const COMMON_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' }
];

export default function ExchangeRatesPage() {
  const { businessId, currency: baseCurrency = 'PKR' } = usePersona();
  const { success, error: toastError } = useToast();

  const [rates, setRates] = useState<ExchangeRateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Live Converter widget state
  const [calcAmount, setCalcAmount] = useState<string>("100");
  const [calcFrom, setCalcFrom] = useState<string>("USD");
  const [calcTo, setCalcTo] = useState<string>("PKR");

  const loadRates = async (syncLive = false) => {
    if (syncLive) setIsSyncing(true);
    else setIsLoading(true);

    try {
      const url = `/api/exchange-rates?business_id=${businessId || ''}${syncLive ? '&sync_live=true' : ''}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.rates && data.rates.length > 0) {
        setRates(data.rates);
        if (typeof window !== 'undefined') {
          localStorage.setItem('noxis_exchange_rates', JSON.stringify(data.rates));
        }
        if (syncLive) {
          success("Live Rates Synced", "Exchange rates updated with live international market feed.");
        }
      }
    } catch (err: any) {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('noxis_exchange_rates');
        if (cached) {
          try {
            setRates(JSON.parse(cached));
          } catch {}
        }
      }
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, [businessId]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/exchange-rates?id=${id}&business_id=${businessId || ''}`, { method: 'DELETE' });
      setRates(prev => prev.filter(r => r.id !== id));
      success("Rate Removed", "Exchange rate pair deleted successfully.");
    } catch (err: any) {
      toastError("Delete Failed", err.message);
    }
  };

  const handleInvert = async (rate: ExchangeRateItem) => {
    const invertedRate = Number((1 / rate.rate).toFixed(6));
    const newFrom = rate.to_currency;
    const newTo = rate.from_currency;

    try {
      const res = await fetch('/api/exchange-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          from_currency: newFrom,
          to_currency: newTo,
          rate: invertedRate,
          effective_date: new Date().toISOString().split('T')[0],
          source: 'Inverted'
        })
      });
      const data = await res.json();
      if (data.success && data.rate) {
        setRates(prev => [data.rate, ...prev]);
        success("Inverted Rate Added", `1 ${newFrom} = ${invertedRate} ${newTo}`);
      }
    } catch (err: any) {
      toastError("Failed to Invert", err.message);
    }
  };

  const filteredRates = rates.filter(r => 
    r.from_currency.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.to_currency.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Conversion calculator logic
  const calculateConversion = () => {
    const amt = parseFloat(calcAmount) || 0;
    if (calcFrom === calcTo) return amt;

    const direct = rates.find(r => r.from_currency === calcFrom && r.to_currency === calcTo);
    if (direct) return (amt * direct.rate).toFixed(2);

    const inverse = rates.find(r => r.from_currency === calcTo && r.to_currency === calcFrom);
    if (inverse && inverse.rate > 0) return (amt / inverse.rate).toFixed(2);

    // Cross conversion via PKR or USD
    const fromToPkr = rates.find(r => r.from_currency === calcFrom && r.to_currency === 'PKR')?.rate || 1;
    const toToPkr = rates.find(r => r.from_currency === calcTo && r.to_currency === 'PKR')?.rate || 1;
    if (toToPkr > 0) {
      return ((amt * fromToPkr) / toToPkr).toFixed(2);
    }

    return (amt * 1).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-[#07090D] text-slate-200 font-inter">
      {/* Header */}
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#0D1017]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Globe size={20} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Exchange Rates & Multi-Currency Ledger
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                Commercial Mesh
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Automated invoice conversion, international customer billing, and multi-currency valuation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadRates(true)}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all disabled:opacity-50"
            title="Fetch live official market exchange rates"
          >
            <RefreshCw size={14} className={cn(isSyncing && "animate-spin text-cyan-400")} />
            <span>{isSyncing ? "Syncing Feed..." : "Sync Live Market Rates"}</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Exchange Rate</span>
          </button>
        </div>
      </header>

      <main className="p-8 max-w-[1400px] mx-auto space-y-8">
        {/* Top Info & Live Converter Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Converter Widget */}
          <div className="lg:col-span-1 bg-[#0E121B] border border-white/10 rounded-xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            <div>
              <div className="flex items-center gap-2.5 mb-4 text-cyan-400">
                <Calculator size={18} />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Live Rate Calculator</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 mb-1.5 block">Amount</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={calcAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      setCalcAmount(val);
                    }}
                    placeholder="Enter amount"
                    className="w-full bg-[#141A26] border border-white/10 rounded-lg px-4 py-2.5 text-lg font-mono font-bold text-white outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 mb-1.5 block">From</label>
                    <select
                      value={calcFrom}
                      onChange={(e) => setCalcFrom(e.target.value)}
                      className="w-full bg-[#141A26] border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-cyan-500"
                    >
                      {COMMON_CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 mb-1.5 block">To</label>
                    <select
                      value={calcTo}
                      onChange={(e) => setCalcTo(e.target.value)}
                      className="w-full bg-[#141A26] border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-cyan-500"
                    >
                      {COMMON_CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-baseline justify-between">
              <span className="text-xs text-slate-400 font-medium">Converted Value:</span>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {calculateConversion()}
                </span>
                <span className="text-xs font-bold text-slate-400 ml-1.5">{calcTo}</span>
              </div>
            </div>
          </div>

          {/* Currency Mesh Overview Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#0E121B] border border-white/10 rounded-xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Base Currency</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black font-mono text-white">{baseCurrency}</p>
                <p className="text-[11px] text-slate-500 mt-1">Default ledger reporting standard</p>
              </div>
            </div>

            <div className="bg-[#0E121B] border border-white/10 rounded-xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Documented Pairs</span>
                <ShieldCheck size={16} className="text-cyan-400" />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black font-mono text-cyan-400">{rates.length}</p>
                <p className="text-[11px] text-slate-500 mt-1">Active FX conversion vectors</p>
              </div>
            </div>

            <div className="bg-[#0E121B] border border-white/10 rounded-xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Precision Standard</span>
                <Clock size={16} className="text-amber-400" />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black font-mono text-amber-400">6 Decimals</p>
                <p className="text-[11px] text-slate-500 mt-1">ISO 4217 micro-currency accuracy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Currency Table Section */}
        <section className="bg-[#0E121B] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Active Currency Matrix</h2>
              <p className="text-xs text-slate-400 mt-0.5">Rates utilized automatically in Invoice Creator, POS, and Customer Khata.</p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Filter currency (e.g. USD, AED)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141A26] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#141A26] text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-white/5">
                  <th className="px-6 py-4">From Currency</th>
                  <th className="px-6 py-4">To Currency</th>
                  <th className="px-6 py-4 text-center">Exchange Rate</th>
                  <th className="px-6 py-4">Effective Date</th>
                  <th className="px-6 py-4">Feed Source</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center text-xs font-mono text-slate-400 animate-pulse">
                      Loading currency rates...
                    </td>
                  </tr>
                ) : filteredRates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center text-xs text-slate-500">
                      No currency pairs found matching &ldquo;{searchQuery}&rdquo;.
                    </td>
                  </tr>
                ) : (
                  filteredRates.map((rate) => (
                    <tr key={rate.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-6 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-bold flex items-center justify-center">
                            {rate.from_currency}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {COMMON_CURRENCIES.find(c => c.code === rate.from_currency)?.name || rate.from_currency}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-6 rounded bg-white/5 border border-white/10 text-slate-300 text-xs font-mono font-bold flex items-center justify-center">
                            {rate.to_currency}
                          </span>
                          <span className="text-xs font-bold text-slate-300">
                            {COMMON_CURRENCIES.find(c => c.code === rate.to_currency)?.name || rate.to_currency}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/20">
                          {Number(rate.rate).toFixed(6)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs font-mono text-slate-400">
                        {rate.effective_date}
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-400 rounded">
                          {rate.source || 'Manual entry'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleInvert(rate)}
                            title={`Invert to 1 ${rate.to_currency} = ${(1/rate.rate).toFixed(6)} ${rate.from_currency}`}
                            className="p-1.5 rounded hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400 transition-colors"
                          >
                            <ArrowRightLeft size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(rate.id)}
                            title="Delete rate pair"
                            className="p-1.5 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Add Rate Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0E121B] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-white">Add Exchange Rate Pair</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Define conversion multiplier for invoicing and balances.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <AddRateFormModal
                businessId={businessId}
                baseCurrency={baseCurrency}
                onSuccess={(newRate) => {
                  setRates(prev => [newRate, ...prev]);
                  setIsModalOpen(false);
                  success("Rate Saved", `1 ${newRate.from_currency} = ${newRate.rate} ${newRate.to_currency}`);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddRateFormModal({ 
  businessId, 
  baseCurrency, 
  onSuccess 
}: { 
  businessId?: string; 
  baseCurrency: string; 
  onSuccess: (rate: ExchangeRateItem) => void 
}) {
  const { error: toastError } = useToast();
  const [fromCurr, setFromCurr] = useState("USD");
  const [toCurr, setToCurr] = useState(baseCurrency || "PKR");
  const [rateInput, setRateInput] = useState("278.50");
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick preset shortcuts
  const applyPreset = (from: string, to: string, rate: string) => {
    setFromCurr(from);
    setToCurr(to);
    setRateInput(rate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedRate = parseFloat(rateInput);
    if (isNaN(parsedRate) || parsedRate <= 0) {
      toastError("Invalid Rate", "Please enter a valid positive number for exchange rate.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/exchange-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          from_currency: fromCurr,
          to_currency: toCurr,
          rate: parsedRate,
          effective_date: dateInput,
          source: 'Manual entry'
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to persist exchange rate");
      }

      onSuccess(data.rate);
    } catch (err: any) {
      toastError("Failed to Save", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Quick Presets */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
          Quick Presets
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset('USD', 'PKR', '278.45')}
            className="text-[11px] font-mono px-2.5 py-1 rounded bg-white/5 border border-white/10 hover:border-cyan-500/50 text-slate-300 transition-colors"
          >
            USD → PKR (278.45)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('AED', 'PKR', '75.82')}
            className="text-[11px] font-mono px-2.5 py-1 rounded bg-white/5 border border-white/10 hover:border-cyan-500/50 text-slate-300 transition-colors"
          >
            AED → PKR (75.82)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('EUR', 'PKR', '302.20')}
            className="text-[11px] font-mono px-2.5 py-1 rounded bg-white/5 border border-white/10 hover:border-cyan-500/50 text-slate-300 transition-colors"
          >
            EUR → PKR (302.20)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 block">From Currency</label>
          <select
            value={fromCurr}
            onChange={(e) => setFromCurr(e.target.value)}
            className="w-full bg-[#141A26] border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-cyan-500"
          >
            {COMMON_CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.code} ({c.name})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 block">To Currency</label>
          <select
            value={toCurr}
            onChange={(e) => setToCurr(e.target.value)}
            className="w-full bg-[#141A26] border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-cyan-500"
          >
            {COMMON_CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.code} ({c.name})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Number Input — robust decimal text field that never blocks numbers */}
      <div>
        <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
          Exchange Rate (1 {fromCurr} = ? {toCurr})
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            value={rateInput}
            onChange={(e) => {
              // Strip non-numbers, allowing single decimal dot
              const val = e.target.value.replace(/[^0-9.]/g, '');
              const parts = val.split('.');
              if (parts.length > 2) return;
              setRateInput(val);
            }}
            placeholder="e.g. 278.50"
            className="w-full bg-[#141A26] border border-white/10 rounded-lg px-4 py-2.5 text-base font-mono font-bold text-emerald-400 outline-none focus:border-cyan-500 transition-colors"
            required
          />
          <span className="absolute right-3 top-2.5 text-xs font-mono font-bold text-slate-500">
            {toCurr}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1 font-mono">
          Preview: 1 {fromCurr} = {rateInput || '0'} {toCurr}
        </p>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Effective Date</label>
        <input
          type="date"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
          className="w-full bg-[#141A26] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !rateInput}
        className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 cursor-pointer"
      >
        {isSubmitting ? "Persisting Rate..." : "Authorize Rate Posting"}
      </button>
    </form>
  );
}
