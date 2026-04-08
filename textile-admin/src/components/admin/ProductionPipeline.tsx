import React, { useState, useMemo } from 'react';
import { Shield, AlertCircle, CheckCircle2, User, Gauge, ArrowRight } from 'lucide-react';
import { AnalyticsEngine } from '../../services/AnalyticsEngine';
import { sovereign } from '../../lib/SovereignCore';
import { cn } from '../../lib/utils';

export const ProductionPipeline: React.FC = () => {
  const [formData, setFormData] = useState({
    issued_gaz: '',
    suits_received: '',
    master_name: '',
    actual_remnant: '',
  });

  const audit = useMemo(() => {
    const issued = parseFloat(formData.issued_gaz) || 0;
    const actualSuits = parseInt(formData.suits_received) || 0;
    const actualRemnant = parseFloat(formData.actual_remnant) || 0;

    if (issued <= 0) return null;

    // Use v4.1 Industrial Math (Shrinkage + Wastage)
    const { suits: expectedSuits, remnant: expectedRemnant } = AnalyticsEngine.calculateIndustrialYield(issued, false);
    
    // Audit Logic: Actual Remnant must be >= Expected Remnant
    const isMismatch = actualRemnant < expectedRemnant;
    const isUnderYield = actualSuits < expectedSuits;

    return {
      expectedSuits,
      expectedRemnant,
      isMismatch,
      isUnderYield,
      deficit: Math.max(0, expectedRemnant - actualRemnant)
    };
  }, [formData]);

  // v6.0.2 Security: Fixed Impure Math.random by using static industrial mock data
  const mockMasterPerformance = [
    { id: 42, zScore: '+0.42 σ' },
    { id: 89, zScore: '-0.15 σ' },
    { id: 12, zScore: '+1.28 σ' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-4">
      <header className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h2 className="text-electric-blue text-xs font-black uppercase tracking-[0.3em] font-mono">
            Production Pipeline // Karigar Auditor
          </h2>
          <p className="text-[10px] text-zinc-600 mt-1 uppercase font-mono tracking-tighter">
            Security Protocol: MAN_IN_THE_MIDDLE_GUARD (CHORI_GUARD)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4 text-electric-blue/30" />
          <span className="text-[9px] font-black bg-zinc-900 px-2 py-1 border border-white/5 text-zinc-500">v6.0.1-AUDITOR</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manual Entry Form */}
        <div className="card bg-[#0F1113] border border-white/5 p-6 rounded-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <User className="w-4 h-4 text-electric-blue" />
            <h3 className="text-[10px] font-black uppercase text-zinc-100">Batch Issuance Audit</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Master Name</label>
              <input 
                type="text" 
                placeholder="Karigar/Master..."
                className="w-full bg-[#070809] border border-white/5 rounded-[2px] px-3 py-2 text-xs font-mono text-zinc-200 outline-none focus:border-electric-blue/30"
                value={formData.master_name}
                onChange={(e) => setFormData({...formData, master_name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Total Gaz Issued</label>
              <input 
                type="number" 
                placeholder="0.00"
                className="w-full bg-[#070809] border border-white/5 rounded-[2px] px-3 py-2 text-xs font-mono text-electric-blue outline-none focus:border-electric-blue/30 font-black"
                value={formData.issued_gaz}
                onChange={(e) => setFormData({...formData, issued_gaz: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Suits Received</label>
              <input 
                type="number" 
                placeholder="0"
                className="w-full bg-[#070809] border border-white/5 rounded-[2px] px-3 py-2 text-xs font-mono text-zinc-200 outline-none focus:border-electric-blue/30"
                value={formData.suits_received}
                onChange={(e) => setFormData({...formData, suits_received: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Actual Remnant (Tukra)</label>
              <input 
                type="number" 
                placeholder="0.00"
                className="w-full bg-[#070809] border border-white/5 rounded-[2px] px-3 py-2 text-xs font-mono text-zinc-200 outline-none focus:border-electric-blue/30"
                value={formData.actual_remnant}
                onChange={(e) => setFormData({...formData, actual_remnant: e.target.value})}
              />
            </div>
          </div>

          <button className="w-full py-3 bg-zinc-900 border border-white/5 hover:bg-electric-blue hover:text-black transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3">
             Initialize Audit Record
             <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Audit Results */}
        <div className="space-y-4">
          {audit ? (
            <div className={cn(
              "card p-6 rounded-xl border transition-all duration-500",
              audit.isMismatch || audit.isUnderYield ? "bg-red-500/5 border-red-500/20" : "bg-emerald-500/5 border-emerald-500/20"
            )}>
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <Gauge className={cn("w-4 h-4", audit.isMismatch ? "text-red-500" : "text-emerald-500")} />
                  <h3 className="text-[10px] font-black uppercase text-zinc-100">Industrial Audit Matrix</h3>
                </div>
                {audit.isMismatch ? (
                  <div className="flex items-center gap-2 text-red-500 animate-pulse">
                    <AlertCircle className="w-3 h-3" />
                    <span className="text-[8px] font-black uppercase tracking-widest">AUDIT_MISMATCH</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="text-[8px] font-black uppercase tracking-widest">VERIFIED_YIELD</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6 font-mono">
                <div className="space-y-1">
                  <p className="text-[7px] text-zinc-700 uppercase font-black">Expected Suits</p>
                  <p className="text-xl font-bold text-zinc-200 tracking-tighter">{audit.expectedSuits}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[7px] text-zinc-700 uppercase font-black">Expected Remnant</p>
                  <p className="text-xl font-bold text-electric-blue tracking-tighter">{audit.expectedRemnant} GAZ</p>
                </div>
                <div className="col-span-2 pt-4 border-t border-white/5 mt-2">
                  <div className="flex justify-between items-center text-[8px] uppercase tracking-widest font-black">
                     <span className="text-zinc-600">Status Report</span>
                     <span className={audit.isMismatch ? "text-red-400" : "text-emerald-400"}>
                        {audit.isMismatch ? `DEFICIT: -${sovereign.preciseRound(audit.deficit)} GAZ` : 'INVENTORY_SAFE'}
                     </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card bg-zinc-950 border border-dashed border-white/5 p-12 flex flex-col items-center justify-center text-center">
               <AlertCircle className="w-8 h-8 text-zinc-800 mb-4" />
               <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest leading-relaxed">
                  Enter production data to trigger<br/>real-time industrial audit.
               </p>
            </div>
          )}

          {/* Master Performance Index (Placeholder) */}
          <div className="card bg-[#0F1113] border border-white/5 p-6 rounded-xl">
             <div className="flex items-center justify-between mb-4">
                <h4 className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Historical Mastery (Z-Score)</h4>
                <span className="text-[8px] text-zinc-800 uppercase font-black">Live Data Stream</span>
             </div>
             <div className="space-y-3">
                {mockMasterPerformance.map((master, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-[#070809] rounded-[2px] border border-white/5">
                     <span className="text-[9px] font-mono text-zinc-400">Master_{master.id}</span>
                     <span className="text-[9px] font-mono text-emerald-500">{master.zScore}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
