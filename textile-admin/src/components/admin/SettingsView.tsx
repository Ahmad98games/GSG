import React, { useState } from 'react';
import { Settings, Save, AlertCircle, Ruler } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MatrixEntry {
  size: number;
  kameez: number;
  shalwar: number;
  dupatta: number;
}

export const SettingsView: React.FC = () => {
  const [success, setSuccess] = useState(false);
  const [matrix, setMatrix] = useState<MatrixEntry[]>(
    Array.from({ length: 27 }, (_, i) => {
      const size = 24 + i;
      const multiplier = size / 32;
      return {
        size,
        kameez: Number((2.25 * multiplier).toFixed(2)),
        shalwar: Number((2.00 * multiplier).toFixed(2)),
        dupatta: Number((2.25 * multiplier).toFixed(2)),
      };
    })
  );

  const handleUpdate = (size: number, field: keyof MatrixEntry, value: string) => {
    const numValue = parseFloat(value) || 0;
    setMatrix(prev => prev.map(item => 
      item.size === size ? { ...item, [field]: numValue } : item
    ));
    setSuccess(false);
  };

  const saveSettings = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    console.log('Consumption Matrix Synchronized:', matrix);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-3 italic">
            <Settings className="w-6 h-6 text-gold" />
            GLOBAL SETTINGS
          </h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">
            System Configuration & Production Thresholds
          </p>
        </div>
        <button 
          onClick={saveSettings}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-all",
            success ? "bg-green-600 text-white" : "bg-gold text-zinc-950 hover:scale-105 active:scale-95"
          )}
        >
          <Save className="w-4 h-4" />
          {success ? 'Synchronized' : 'Sync Matrix'}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-gold" />
                <h3 className="text-[10px] font-black uppercase text-zinc-100 tracking-widest">Consumption Matrix (Gaz per Size)</h3>
              </div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono">Standard Anarkali Protocol v1.2</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950/50">
                    <th className="px-6 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-tighter border-b border-zinc-800">Size</th>
                    <th className="px-6 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-tighter border-b border-zinc-800">Kameez</th>
                    <th className="px-6 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-tighter border-b border-zinc-800">Shalwar</th>
                    <th className="px-6 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-tighter border-b border-zinc-800">Dupatta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {matrix.map((item) => (
                    <tr key={item.size} className="hover:bg-gold/5 transition-colors group">
                      <td className="px-6 py-3 text-sm font-mono font-bold text-gold">{item.size}</td>
                      <td className="px-6 py-3">
                        <input 
                          type="number" 
                          step="0.01"
                          value={item.kameez}
                          onChange={(e) => handleUpdate(item.size, 'kameez', e.target.value)}
                          className="w-20 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-zinc-300 focus:border-gold outline-none"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input 
                          type="number" 
                          step="0.01"
                          value={item.shalwar}
                          onChange={(e) => handleUpdate(item.size, 'shalwar', e.target.value)}
                          className="w-20 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-zinc-300 focus:border-gold outline-none"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input 
                          type="number" 
                          step="0.01"
                          value={item.dupatta}
                          onChange={(e) => handleUpdate(item.size, 'dupatta', e.target.value)}
                          className="w-20 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-zinc-300 focus:border-gold outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gold" />
              <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Proactive Auditing</h4>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed italic">
              Adjusting the matrix will immediately affect all **future** Job Orders. Active Chalans will remain on their issued thresholds to prevent accounting variances.
            </p>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 space-y-4">
            <h4 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Other System Toggles</h4>
            <div className="space-y-3">
              {[
                'Strict Wastage Enforcement',
                'Auto-Resolve Ledger Deviations',
                'Dual-Auth for Karigar Overrides',
                'Cloud Sync Priority'
              ].map(toggle => (
                <div key={toggle} className="flex items-center justify-between group cursor-pointer">
                  <span className="text-[11px] text-zinc-500 group-hover:text-zinc-300 transition-colors uppercase font-bold tracking-tighter">{toggle}</span>
                  <div className="w-8 h-4 bg-zinc-800 rounded-full flex items-center px-0.5 border border-zinc-700">
                    <div className="w-3 h-3 bg-zinc-600 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
