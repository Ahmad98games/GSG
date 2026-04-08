import React, { useState } from 'react';
import { 
  History, Ruler, Terminal, 
  Lock, RefreshCw, AlertTriangle 
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface AuditEntry {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
}

export const SystemConfigurator: React.FC = () => {
  const [success, setSuccess] = useState(false);
  const [formulas, setFormulas] = useState({
    shrinkage: 3.50,
    wastage: 5.00,
    laborGst: 0.18,
    marketMarkup: 0.45
  });

  const [panaValues, setPanaValues] = useState([
    { width: 60, efficiency: 1.00, label: 'Standard Export' },
    { width: 36, efficiency: 0.85, label: 'Local Narrow' },
    { width: 54, efficiency: 0.95, label: 'Medium Industrial' }
  ]);

  const auditLogs: AuditEntry[] = [
    { id: 'log-001', user: 'SuperAdmin', action: 'Update', target: 'Shrinkage % (3.2 -> 3.5)', timestamp: '2026-04-01 | 14:20' },
    { id: 'log-002', user: 'System', action: 'Sync', target: 'CalculationEngine v2.0', timestamp: '2026-04-01 | 10:00' },
    { id: 'log-003', user: 'SuperAdmin', action: 'Security', target: 'Reconciliation Mode Enabled', timestamp: '2026-03-31 | 18:45' },
  ];

  const handleSync = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
    console.log('Synchronizing Industrial Variables:', formulas, panaValues);
  };

  return (
    <div className="h-full grid lg:grid-cols-2 gap-6 animate-in slide-in-from-right duration-500">
      {/* Formula Vault & Pana Matrix */}
      <div className="flex flex-col space-y-6 min-h-0">
        <div className="bg-base-s border border-white/5 p-8 flex flex-col space-y-8 flex-1 shadow-2xl rounded-[2px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <h2 className="text-[11px] font-black text-electric-blue uppercase italic tracking-[.3em] flex items-center gap-3 font-mono">
              <Lock className="w-5 h-5 text-electric-blue" />
              General Parameters
            </h2>
            <button 
              onClick={handleSync}
              className={cn(
                "px-6 py-2.5 rounded-[2px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-lg",
                success ? "bg-green-600 text-white" : "bg-electric-blue text-base-p"
              )}
            >
              <RefreshCw className={cn("w-4 h-4", success && "animate-spin")} />
              {success ? 'Settings Saved' : 'Save Settings'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {Object.entries(formulas).map(([key, val]) => (
              <div key={key} className="bg-base-p border border-white/5 p-4 rounded-[2px] space-y-2 group shadow-inner">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest group-hover:text-electric-blue transition-colors">{key.replace(/([A-Z])/g, ' $1')}</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    step="0.01" 
                    value={val}
                    onChange={(e) => setFormulas({ ...formulas, [key]: parseFloat(e.target.value) })}
                    className="flex-1 bg-transparent text-sm font-mono text-white outline-none font-black"
                  />
                  <span className="text-xs font-black text-zinc-700 font-mono">%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6 pt-6 border-t border-white/5">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[.2em] flex items-center gap-3 font-mono">
              <Ruler className="w-4 h-4" />
              Material Widths & Yield
            </h3>
            <div className="space-y-2">
              {panaValues.map((p, i) => (
                <div key={i} className="flex items-center justify-between bg-base-p border border-white/5 px-5 py-4 rounded-[2px] shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-white uppercase tracking-wider">{p.width}" {p.label}</span>
                    <span className="text-[9px] text-zinc-700 uppercase font-black tracking-widest mt-1">Yield Adjustment</span>
                  </div>
                  <input 
                    type="number"
                    step="0.01"
                    value={p.efficiency}
                    onChange={(e) => {
                      const newPana = [...panaValues];
                      newPana[i].efficiency = parseFloat(e.target.value);
                      setPanaValues(newPana);
                    }}
                    className="w-20 bg-base-s border border-white/10 rounded-[2px] px-3 py-2 text-sm font-mono text-electric-blue outline-none focus:border-electric-blue font-black shadow-inner"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-electric-blue/[0.03] border border-electric-blue/10 p-6 rounded-[2px] flex gap-4 mt-auto">
            <AlertTriangle className="w-6 h-6 text-electric-blue shrink-0 opacity-50" />
            <p className="text-[10px] text-zinc-500 leading-relaxed italic font-mono">
              Caution: Modifying these standards will update all active estimates and production orders across the ecosystem. Use with precision.
            </p>
          </div>
        </div>
      </div>

      {/* Audit Log Console */}
      <div className="bg-base-p border border-white/5 flex flex-col min-h-0 overflow-hidden shadow-2xl rounded-[2px]">
        <div className="bg-base-s border-b border-white/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-zinc-700" />
            <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em] italic font-mono">Action History</h3>
          </div>
          <div className="text-[9px] font-mono font-black text-emerald-500 uppercase tracking-widest animate-pulse">
            // Secure Connection Active
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-base-s z-10 shadow-md">
              <tr className="border-b border-white/5">
                {['User', 'Action', 'Detail', 'Date/Time'].map(h => (
                  <th key={h} className="px-5 py-4 text-[10px] font-black text-electric-blue/30 uppercase tracking-[.2em] font-mono">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.01] group border-l-2 border-l-transparent hover:border-l-gold transition-all">
                  <td className="px-5 py-3">
                    <span className="text-[11px] font-black text-blue-400 group-hover:text-blue-300 transition-colors uppercase font-mono">{log.user}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{log.action}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] text-zinc-500 font-mono tracking-tighter truncate max-w-[200px] inline-block font-black uppercase italic">{log.target}</span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="text-[10px] font-mono text-zinc-700 italic font-black">{log.timestamp}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-5 bg-base-s border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 bg-electric-blue rounded-full shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest font-mono">Cloud Ledger Online</span>
            </div>
            <div className="flex items-center gap-2.5">
              <History className="w-4 h-4 text-zinc-800" />
              <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest font-mono italic">1,452 Audit Events</span>
            </div>
          </div>
          <button className="text-[10px] font-black text-electric-blue uppercase tracking-widest border-b border-electric-blue/20 hover:border-electric-blue transition-all font-mono">
            Export History
          </button>
        </div>
      </div>
    </div>
  );
};
