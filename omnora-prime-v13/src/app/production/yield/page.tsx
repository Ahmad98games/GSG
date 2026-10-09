"use client";

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Scale, Calculator, ArrowRight, 
  CheckCircle2, AlertTriangle, Download, Plus, 
  Layers, RefreshCw, BarChart2, Wheat, Factory, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIndustryConfig } from '@/hooks/useIndustryConfig';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

interface YieldBatch {
  id: string;
  batchNo: string;
  date: string;
  grainType: string;
  rawPaddyInputMaunds: number;
  rawPaddyInputKg: number;
  moisturePercent: number;
  headRiceCleanKg: number;
  brokenRiceTottaKg: number;
  riceBranPhakKg: number;
  huskBhoosaKg: number;
  yieldPercent: number;
  targetYieldPercent: number;
  status: 'optimal' | 'low_yield' | 'normal';
}

const DEFAULT_YIELD_BATCHES: YieldBatch[] = [
  {
    id: 'yb-101',
    batchNo: 'MB-2026-089',
    date: '2026-10-09',
    grainType: 'Super Basmati (Old Paddy)',
    rawPaddyInputMaunds: 500,
    rawPaddyInputKg: 20000,
    moisturePercent: 13.8,
    headRiceCleanKg: 13500,
    brokenRiceTottaKg: 1800,
    riceBranPhakKg: 1600,
    huskBhoosaKg: 3100,
    yieldPercent: 67.5,
    targetYieldPercent: 66.0,
    status: 'optimal',
  },
  {
    id: 'yb-102',
    batchNo: 'MB-2026-088',
    date: '2026-10-08',
    grainType: '1121 Kainat Steamed',
    rawPaddyInputMaunds: 750,
    rawPaddyInputKg: 30000,
    moisturePercent: 14.5,
    headRiceCleanKg: 19800,
    brokenRiceTottaKg: 3200,
    riceBranPhakKg: 2400,
    huskBhoosaKg: 4600,
    yieldPercent: 66.0,
    targetYieldPercent: 67.0,
    status: 'normal',
  },
  {
    id: 'yb-103',
    batchNo: 'MB-2026-087',
    date: '2026-10-07',
    grainType: 'IRRI-6 Coarse Paddy',
    rawPaddyInputMaunds: 1000,
    rawPaddyInputKg: 40000,
    moisturePercent: 15.2,
    headRiceCleanKg: 24400,
    brokenRiceTottaKg: 5200,
    riceBranPhakKg: 3200,
    huskBhoosaKg: 7200,
    yieldPercent: 61.0,
    targetYieldPercent: 68.0,
    status: 'low_yield',
  },
  {
    id: 'yb-104',
    batchNo: 'MB-2026-086',
    date: '2026-10-06',
    grainType: 'Super Kernel Basmati',
    rawPaddyInputMaunds: 600,
    rawPaddyInputKg: 24000,
    moisturePercent: 13.5,
    headRiceCleanKg: 16320,
    brokenRiceTottaKg: 1920,
    riceBranPhakKg: 1920,
    huskBhoosaKg: 3840,
    yieldPercent: 68.0,
    targetYieldPercent: 67.0,
    status: 'optimal',
  },
];

export default function YieldTrackingPage() {
  const { t, fmt, industry } = useIndustryConfig();
  const { profile } = useBusinessProfile();
  const { success: toastSuccess } = useToast();

  const [batches, setBatches] = useState<YieldBatch[]>(DEFAULT_YIELD_BATCHES);
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for new yield log
  const [newBatchNo, setNewBatchNo] = useState(`MB-2026-${String(batches.length + 90).padStart(3, '0')}`);
  const [newGrainType, setNewGrainType] = useState('Super Basmati');
  const [newPaddyMaunds, setNewPaddyMaunds] = useState('500');
  const [newMoisture, setNewMoisture] = useState('14.0');
  const [newCleanRiceKg, setNewCleanRiceKg] = useState('13400');
  const [newBrokenKg, setNewBrokenKg] = useState('1800');
  const [newBranKg, setNewBranKg] = useState('1600');
  const [newHuskKg, setNewHuskKg] = useState('3200');

  // Computed summary metrics
  const summary = useMemo(() => {
    const totalPaddyKg = batches.reduce((acc, b) => acc + b.rawPaddyInputKg, 0);
    const totalCleanRiceKg = batches.reduce((acc, b) => acc + b.headRiceCleanKg, 0);
    const totalBrokenKg = batches.reduce((acc, b) => acc + b.brokenRiceTottaKg, 0);
    const totalBranKg = batches.reduce((acc, b) => acc + b.riceBranPhakKg, 0);
    const avgYield = totalPaddyKg > 0 ? (totalCleanRiceKg / totalPaddyKg) * 100 : 0;

    return {
      totalPaddyMaunds: (totalPaddyKg / 40).toFixed(0),
      totalCleanBags: (totalCleanRiceKg / 50).toFixed(0), // 50kg standard bags
      avgYield: avgYield.toFixed(1),
      totalBrokenBags: (totalBrokenKg / 50).toFixed(0),
      totalBranBags: (totalBranKg / 40).toFixed(0),
    };
  }, [batches]);

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const paddyMaundsNum = Number(newPaddyMaunds) || 0;
    const paddyKgNum = paddyMaundsNum * 40;
    const cleanKg = Number(newCleanRiceKg) || 0;
    const brokenKg = Number(newBrokenKg) || 0;
    const branKg = Number(newBranKg) || 0;
    const huskKg = Number(newHuskKg) || 0;
    const yieldPct = paddyKgNum > 0 ? (cleanKg / paddyKgNum) * 100 : 0;

    const newBatch: YieldBatch = {
      id: `yb-${Date.now()}`,
      batchNo: newBatchNo,
      date: new Date().toISOString().split('T')[0],
      grainType: newGrainType,
      rawPaddyInputMaunds: paddyMaundsNum,
      rawPaddyInputKg: paddyKgNum,
      moisturePercent: Number(newMoisture) || 14.0,
      headRiceCleanKg: cleanKg,
      brokenRiceTottaKg: brokenKg,
      riceBranPhakKg: branKg,
      huskBhoosaKg: huskKg,
      yieldPercent: Number(yieldPct.toFixed(1)),
      targetYieldPercent: 66.5,
      status: yieldPct >= 66 ? 'optimal' : yieldPct >= 63 ? 'normal' : 'low_yield',
    };

    setBatches([newBatch, ...batches]);
    setIsModalOpen(false);
    toastSuccess('Yield Log Saved', `Batch ${newBatchNo} logged with ${yieldPct.toFixed(1)}% recovery yield.`);
  };

  const filteredBatches = useMemo(() => {
    if (filterType === 'all') return batches;
    return batches.filter(b => b.status === filterType);
  }, [batches, filterType]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Wheat size={16} />
            </span>
            <span className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold">
              {industry.displayName} Industrial Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Milling Yield &amp; Recovery Analysis
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time paddy-to-milled rice conversion tracking, broken percentage (Totta), and byproduct recovery.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-md flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Log Milling Batch</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0E131F] border border-white/[0.08] p-4 rounded-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Average Milling Yield</span>
            <span className="text-emerald-400 font-mono text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              Target: 66.0%
            </span>
          </div>
          <div className="text-3xl font-black text-white font-mono tracking-tight">
            {summary.avgYield}%
          </div>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <TrendingUp size={12} className="text-emerald-400" />
            <span>Clean Head Rice Output Ratio</span>
          </p>
        </div>

        <div className="bg-[#0E131F] border border-white/[0.08] p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Raw Paddy Milled</span>
            <span className="text-amber-400 font-mono text-xs font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
              IN
            </span>
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono tracking-tight">
            {summary.totalPaddyMaunds} <span className="text-sm text-slate-400 font-normal">Maunds</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Raw grain delivered to de-husking hoppers
          </p>
        </div>

        <div className="bg-[#0E131F] border border-white/[0.08] p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Clean Rice Packed</span>
            <span className="text-cyan-400 font-mono text-xs font-bold bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
              OUT
            </span>
          </div>
          <div className="text-3xl font-black text-cyan-400 font-mono tracking-tight">
            {summary.totalCleanBags} <span className="text-sm text-slate-400 font-normal">Bags (50kg)</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Silky polished &amp; graded head rice
          </p>
        </div>

        <div className="bg-[#0E131F] border border-white/[0.08] p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Byproduct Recovery</span>
            <span className="text-purple-400 font-mono text-xs font-bold bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
              Totta + Phak
            </span>
          </div>
          <div className="text-3xl font-black text-purple-400 font-mono tracking-tight">
            {summary.totalBrokenBags} <span className="text-sm text-slate-400 font-normal">Bags</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Recovered commercial by-products
          </p>
        </div>
      </div>

      {/* Yield Formula Callout */}
      <div className="bg-gradient-to-r from-blue-950/30 via-slate-900/60 to-blue-950/30 border border-blue-500/20 p-4 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 mt-0.5">
            <Calculator size={18} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Standard Milling Formula (Moisture Corrected)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Yield % = (Clean Head Rice kg ÷ Total Raw Paddy kg) × 100. Standard moisture threshold is 14.0%. Paddy above 15% moisture incurs weight evaporation deduction.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2.5 py-1 rounded border border-white/[0.08]">
            1 Maund = 40.0 KG
          </span>
          <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2.5 py-1 rounded border border-white/[0.08]">
            1 Rice Bag = 50.0 KG
          </span>
        </div>
      </div>

      {/* Filter Tabs & Batch Table */}
      <div className="bg-[#0E131F] border border-white/[0.08] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Batch Milling History</span>
            <span className="text-[10px] font-mono text-slate-400 bg-white/[0.06] px-2 py-0.5 rounded">
              {filteredBatches.length} records
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {(['all', 'optimal', 'normal', 'low_yield'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setFilterType(key)}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer",
                  filterType === key 
                    ? "bg-white/10 text-white border border-white/20" 
                    : "text-slate-400 hover:text-white"
                )}
              >
                {key === 'all' ? 'All Batches' : key === 'optimal' ? 'Optimal (≥67%)' : key === 'normal' ? 'Normal' : 'Low Yield (&lt;63%)'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-black/20">
                <th className="py-3 px-4">Batch ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Paddy Variety</th>
                <th className="py-3 px-4 text-right">Raw Input</th>
                <th className="py-3 px-4 text-center">Moisture</th>
                <th className="py-3 px-4 text-right">Head Rice</th>
                <th className="py-3 px-4 text-right">Broken (Totta)</th>
                <th className="py-3 px-4 text-right">Bran (Phak)</th>
                <th className="py-3 px-4 text-right">Yield %</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {filteredBatches.map((batch) => (
                <tr key={batch.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-white flex items-center gap-1.5">
                    <Factory size={13} className="text-amber-400" />
                    <span>{batch.batchNo}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{batch.date}</td>
                  <td className="py-3 px-4 text-slate-200 font-medium">{batch.grainType}</td>
                  <td className="py-3 px-4 text-right font-mono text-amber-300 font-bold">
                    {batch.rawPaddyInputMaunds} Mnds <span className="text-[10px] text-slate-500">({batch.rawPaddyInputKg.toLocaleString()} kg)</span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-300">
                    <span className={cn(batch.moisturePercent > 14.5 ? "text-amber-400 font-bold" : "text-slate-300")}>
                      {batch.moisturePercent}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-cyan-400 font-bold">
                    {(batch.headRiceCleanKg / 50).toFixed(0)} bags <span className="text-[10px] text-slate-500">({batch.headRiceCleanKg.toLocaleString()} kg)</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {batch.brokenRiceTottaKg.toLocaleString()} kg
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {batch.riceBranPhakKg.toLocaleString()} kg
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-sm">
                    <span className={cn(
                      batch.yieldPercent >= 66 ? "text-emerald-400" : batch.yieldPercent >= 63 ? "text-amber-400" : "text-rose-400"
                    )}>
                      {batch.yieldPercent}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block",
                      batch.status === 'optimal' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      batch.status === 'normal' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                      "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    )}>
                      {batch.status === 'optimal' ? 'Optimal' : batch.status === 'normal' ? 'Acceptable' : 'Low Recovery'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Batch Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0E131F] border border-amber-500/30 rounded-lg max-w-lg w-full p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded bg-amber-500/10 text-amber-400">
                    <Scale size={16} />
                  </span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Log Milling Batch Yield
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-mono"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={handleAddBatch} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Batch Identifier</label>
                    <input
                      type="text"
                      value={newBatchNo}
                      onChange={(e) => setNewBatchNo(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 px-3 py-1.5 text-xs text-white rounded font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Paddy Variety</label>
                    <select
                      value={newGrainType}
                      onChange={(e) => setNewGrainType(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 px-3 py-1.5 text-xs text-white rounded cursor-pointer"
                    >
                      <option value="Super Basmati">Super Basmati</option>
                      <option value="1121 Kainat Steamed">1121 Kainat Steamed</option>
                      <option value="Super Kernel Basmati">Super Kernel Basmati</option>
                      <option value="IRRI-6 Coarse Paddy">IRRI-6 Coarse Paddy</option>
                      <option value="Basmati 386">Basmati 386</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Raw Paddy Input (Maunds)</label>
                    <input
                      type="number"
                      value={newPaddyMaunds}
                      onChange={(e) => setNewPaddyMaunds(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 px-3 py-1.5 text-xs text-white rounded font-mono"
                      placeholder="e.g. 500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                      = {(Number(newPaddyMaunds || 0) * 40).toLocaleString()} KG
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Moisture % (Grain Lab)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newMoisture}
                      onChange={(e) => setNewMoisture(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 px-3 py-1.5 text-xs text-white rounded font-mono"
                      placeholder="e.g. 14.0"
                      required
                    />
                  </div>
                </div>

                <div className="border-t border-white/[0.08] pt-3">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block mb-2">
                    Milling Output Extraction (KG)
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Clean Head Rice (KG)</label>
                      <input
                        type="number"
                        value={newCleanRiceKg}
                        onChange={(e) => setNewCleanRiceKg(e.target.value)}
                        className="w-full bg-black/50 border border-cyan-500/30 px-3 py-1.5 text-xs text-cyan-300 rounded font-mono"
                        placeholder="e.g. 13500"
                        required
                      />
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                        = {(Number(newCleanRiceKg || 0) / 50).toFixed(0)} bags (50kg)
                      </span>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Broken Rice / Totta (KG)</label>
                      <input
                        type="number"
                        value={newBrokenKg}
                        onChange={(e) => setNewBrokenKg(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 px-3 py-1.5 text-xs text-white rounded font-mono"
                        placeholder="e.g. 1800"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Rice Bran / Phak (KG)</label>
                      <input
                        type="number"
                        value={newBranKg}
                        onChange={(e) => setNewBranKg(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 px-3 py-1.5 text-xs text-white rounded font-mono"
                        placeholder="e.g. 1600"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Husk / Bhoosa (KG)</label>
                      <input
                        type="number"
                        value={newHuskKg}
                        onChange={(e) => setNewHuskKg(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 px-3 py-1.5 text-xs text-white rounded font-mono"
                        placeholder="e.g. 3100"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded cursor-pointer"
                  >
                    Record Batch Yield
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
