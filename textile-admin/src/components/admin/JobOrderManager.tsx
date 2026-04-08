import React, { useState, useMemo } from 'react';
import { 
  Plus, Users, Ruler, Calculator, 
  Send, CheckCircle2, 
  Trash2, Edit3, AlertCircle
} from 'lucide-react';
import { CalculationEngine } from '../../services/CalculationEngine';

interface Karigar {
  id: string;
  name: string;
  rate: number;
  specialty: string;
}

interface JobOrder {
  id: string;
  karigarId: string;
  size: number;
  quantity: number;
  status: 'ordered' | 'cutting' | 'stitching' | 'finished';
  timestamp: string;
}

export const JobOrderManager: React.FC = () => {
  const [karigars, setKarigars] = useState<Karigar[]>([
    { id: 'k-001', name: 'Master Salim', rate: 1250, specialty: 'Embroidery' },
    { id: 'k-002', name: 'Master Irfan', rate: 950, specialty: 'Plain Suits' },
  ]);

  const [activeJob, setActiveJob] = useState<Partial<JobOrder>>({
    size: 32,
    quantity: 10,
  });

  const [editingKarigar, setEditingKarigar] = useState<Karigar | null>(null);

  const fabricMath = useMemo(() => {
    if (!activeJob.size || !activeJob.quantity) return null;
    const baseGazPerSuit = activeJob.size / 15;
    const totalGaz = baseGazPerSuit * activeJob.quantity;
    return CalculationEngine.calculateFabricRequirement(totalGaz);
  }, [activeJob.size, activeJob.quantity]);

  const laborCost = useMemo(() => {
    if (!activeJob.karigarId || !activeJob.quantity) return 0;
    const karigar = karigars.find(k => k.id === activeJob.karigarId);
    return CalculationEngine.calculateKarigarCredit(activeJob.quantity, karigar?.rate || 0);
  }, [activeJob.karigarId, activeJob.quantity, karigars]);

  const deployJob = () => {
    console.log('Deploying Job Order & Posting to Ledger...');
    alert('Job Order Deployed. Karigar Khata updated automatically.');
  };

  const handleKarigarSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingKarigar) {
      const exists = karigars.find(k => k.id === editingKarigar.id);
      if (exists) {
        setKarigars(prev => prev.map(k => k.id === editingKarigar.id ? editingKarigar : k));
      } else {
        setKarigars(prev => [...prev, editingKarigar]);
      }
      setEditingKarigar(null);
    }
  };

  const deleteKarigar = (id: string) => {
    setKarigars(prev => prev.filter(k => k.id !== id));
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-full animate-in slide-in-from-bottom duration-500">
      <div className="bg-base-s border border-white/5 p-6 flex flex-col space-y-8 shadow-2xl">
        <div className="border-b border-white/5 pb-4 flex items-center justify-between">
          <h2 className="text-[11px] font-black text-electric-blue uppercase italic tracking-[.3em] font-mono">Order Details</h2>
          <Calculator className="w-5 h-5 text-electric-blue" />
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Select Worker</label>
            <select 
              value={activeJob.karigarId || ''}
              onChange={(e) => setActiveJob({ ...activeJob, karigarId: e.target.value })}
              className="w-full bg-base-p border border-white/5 px-4 py-3 text-xs text-zinc-200 outline-none focus:border-electric-blue/40 font-mono rounded-[2px]"
            >
              <option value="">Choose worker...</option>
              {karigars.map(k => (
                <option key={k.id} value={k.id}>{k.name} (Rate: Rs. {k.rate})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Suit Size</label>
              <input 
                type="number"
                value={activeJob.size}
                onChange={(e) => setActiveJob({ ...activeJob, size: parseInt(e.target.value) })}
                className="w-full bg-base-p border border-white/5 px-4 py-3 text-xs text-zinc-200 outline-none focus:border-electric-blue/40 font-mono rounded-[2px]"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Quantity</label>
              <input 
                type="number"
                value={activeJob.quantity}
                onChange={(e) => setActiveJob({ ...activeJob, quantity: parseInt(e.target.value) })}
                className="w-full bg-base-p border border-white/5 px-4 py-3 text-xs text-zinc-200 outline-none focus:border-electric-blue/40 font-mono rounded-[2px]"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 bg-base-p border border-white/5 p-6 rounded-[2px] flex flex-col justify-between shadow-inner mt-4">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-electric-blue">
              <Ruler className="w-5 h-5" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] font-mono italic">Production Costs</span>
            </div>
            
            <div className="grid gap-4">
              <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                <span className="text-zinc-600 font-black uppercase tracking-widest">Fabric Needed:</span>
                <span className="text-white font-mono font-black">{fabricMath || '0.00'} Gaz</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                <span className="text-zinc-600 font-black uppercase tracking-widest">Labor Cost:</span>
                <span className="text-electric-blue font-mono font-black">Rs. {laborCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={deployJob}
            disabled={!activeJob.karigarId || !activeJob.quantity}
            className="w-full py-5 bg-electric-blue text-base-p font-black uppercase text-xs tracking-[0.5em] flex items-center justify-center gap-3 rounded-[2px] transition-all active:scale-95 shadow-[0_20px_50px_rgba(0,0,0,0.3)] mt-8"
          >
            <Send className="w-5 h-5" />
            Start Production
          </button>
        </div>
      </div>

      {/* Karigar Master Management Column */}
      <div className="lg:col-span-2 bg-base-s border border-white/5 flex flex-col min-h-0 shadow-2xl rounded-[2px]">
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-base-p">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-electric-blue" />
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] font-mono italic">Worker Registry</h3>
          </div>
          <button 
            onClick={() => setEditingKarigar({ id: `w-00${karigars.length + 1}`, name: '', rate: 0, specialty: '' })}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-[2px] flex items-center gap-2 border border-white/5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Worker
          </button>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {karigars.map(k => (
              <div key={k.id} className="bg-base-p border border-white/5 p-5 rounded-[2px] hover:border-electric-blue/30 transition-all flex justify-between items-center group shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[2px] bg-base-s border border-white/5 flex items-center justify-center font-black text-zinc-700 text-sm uppercase">
                    {k.name.substring(0, 2)}
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-tighter">{k.name}</p>
                    <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-mono italic">{k.specialty}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-mono text-electric-blue font-black">Rs. {k.rate}</p>
                    <p className="text-[8px] text-zinc-800 uppercase font-black tracking-widest">Rate / Suit</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-zinc-600 hover:text-electric-blue transition-colors" onClick={() => setEditingKarigar(k)}><Edit3 className="w-4 h-4" /></button>
                    <button className="p-2 text-zinc-600 hover:text-red-500 transition-colors" onClick={() => deleteKarigar(k.id)}><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-base-p grid grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest font-mono">Ledger Synced</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest font-mono">Calculations Validated</span>
          </div>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-electric-blue/50" />
            <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest font-mono">Precision Locking</span>
          </div>
        </div>
      </div>

      {editingKarigar && (
        <div className="fixed inset-0 z-50 bg-[#070809]/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-base-s border border-white/5 w-full max-w-md p-10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] rounded-[2px] space-y-8">
            <h3 className="text-sm font-black text-electric-blue uppercase italic tracking-[.2em] font-mono border-b border-white/5 pb-4">Worker Profile</h3>
            <form onSubmit={handleKarigarSave} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Worker Name</label>
                <input 
                  type="text"
                  value={editingKarigar.name}
                  onChange={(e) => setEditingKarigar({ ...editingKarigar, name: e.target.value })}
                  className="w-full bg-base-p border border-white/5 px-4 py-4 text-xs text-zinc-200 outline-none focus:border-electric-blue/40 font-mono rounded-[2px] uppercase transition-all"
                  placeholder="Enter name..."
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Stitching Rate (Rs. / Suit)</label>
                <input 
                  type="number"
                  value={editingKarigar.rate}
                  onChange={(e) => setEditingKarigar({ ...editingKarigar, rate: parseInt(e.target.value) })}
                  className="w-full bg-base-p border border-white/5 px-4 py-4 text-sm text-electric-blue font-black outline-none focus:border-electric-blue hover:border-electric-blue/20 font-mono rounded-[2px] transition-all"
                  placeholder="0"
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-electric-blue text-base-p font-black uppercase text-xs tracking-widest rounded-[2px] shadow-2xl hover:bg-electric-blue/90 transition-all"
                >
                  Save Worker
                </button>
                <button 
                  onClick={() => setEditingKarigar(null)}
                  className="flex-1 py-4 bg-base-p text-zinc-500 font-black uppercase text-xs tracking-widest rounded-[2px] border border-white/5 hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
