import React, { useState, useMemo } from 'react';
import { CheckCircle2, RotateCcw, Calculator, ArrowRight, AlertTriangle } from 'lucide-react';
import type { ItemCategory, NewProductDto, Product } from '../../types/database';
import { LabelPreview } from './LabelPreview';

interface AddBatchFormProps {
  onAdd: (product: NewProductDto) => Promise<Product>;
  onSuccess?: () => void;
}

import { useSettings } from '../../hooks/useSettings';

export const AddBatchForm = ({ onAdd, onSuccess }: AddBatchFormProps) => {
  const { overhead: dyeingOverheadRate } = useSettings();
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<Product | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    item_name: '',
    item_category: 'Fabric' as ItemCategory,
    total_gaz: '',
    unit_cost: '',
    is_dyeing_required: false,
  });

  // Beyond AI Engineering: Reactive Calculation Engine
  const calculations = useMemo(() => {
    const gaz = parseFloat(formData.total_gaz) || 0;
    const cost = parseFloat(formData.unit_cost) || 0;
    
    const subtotal = gaz * cost;
    const dyeingOverhead = formData.is_dyeing_required ? subtotal * (dyeingOverheadRate / 100) : 0;
    const grandTotal = subtotal + dyeingOverhead;

    return {
      subtotal,
      dyeingOverhead,
      grandTotal,
      isValid: gaz > 0 && cost > 0 && formData.item_name.trim().length > 0
    };
  }, [formData, dyeingOverheadRate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calculations.isValid) return;

    setLoading(true);
    setFormError(null);

    try {
      // 🛡️ BEYOND AI: Data Cleaning & Payload Construction
      const qr_code = `TXT-${Date.now()}`;
      // 🛡️ BEYOND AI: Strict Type Binding
const payload: NewProductDto = {
  item_name: formData.item_name,
  item_category: formData.item_category,
  total_gaz: parseFloat(formData.total_gaz),
  unit_cost: parseFloat(formData.unit_cost),
  is_dyeing_required: formData.is_dyeing_required,
  qr_code,
  subtotal: calculations.subtotal,
  grand_total: calculations.grandTotal
};

      // We use the centralized onAdd hook to keep logic clean
      const result = await onAdd(payload);
      setSuccessData(result);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Database failure occurred";
      setFormError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      item_name: '',
      item_category: 'Fabric',
      total_gaz: '',
      unit_cost: '',
      is_dyeing_required: false,
    });
    setSuccessData(null);
    setFormError(null);
  };

  // SUCCESS STATE UI
  if (successData) {
    return (
      <div className="card max-w-2xl mx-auto p-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
        </div>
        <div className="text-center mb-10">
          <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-tighter">Industrial Batch Ready</h2>
          <p className="text-sm text-zinc-500 mt-2 font-medium">Production identifier and financial audit log generated.</p>
        </div>

        <div className="print-content">
          <LabelPreview product={successData} />
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-900 flex justify-center">
          <button 
            onClick={resetForm} 
            className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-gold-500 transition-colors uppercase tracking-[0.2em]"
          >
            <RotateCcw className="w-3 h-3" />
            Initialize New Production Run
          </button>
        </div>
      </div>
    );
  }

  // FORM UI
  return (
    <div className="card max-w-2xl mx-auto overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/20">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-gold-500" />
          <h2 className="text-sm font-bold uppercase tracking-tight text-zinc-100">Industrial Batch Generator</h2>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-bold text-zinc-700 bg-zinc-900 px-2 py-0.5 rounded">V1.0.4-STABLE</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {formError && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex items-start gap-3 animate-in fade-in zoom-in duration-300">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-400 leading-relaxed font-medium">{formError}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="label-xs mb-2 block text-zinc-500">BATCH NAME / IDENTIFIER</label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="e.g. Premium Cotton Lawn - Batch A"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
            />
          </div>

          <div>
            <label className="label-xs mb-2 block text-zinc-500">CATEGORY</label>
            <select
              className="input-field appearance-none cursor-pointer"
              value={formData.item_category}
              onChange={(e) => setFormData({ ...formData, item_category: e.target.value as ItemCategory })}
            >
              <option value="Fabric">Fabric</option>
              <option value="Embroidery">Embroidery</option>
              <option value="Dyeing">Dyeing</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-xs mb-2 block text-zinc-500">TOTAL GAZ</label>
              <input
                type="number"
                step="0.01"
                required
                className="input-field text-gold-500 font-mono font-bold"
                placeholder="0.00"
                value={formData.total_gaz}
                onChange={(e) => setFormData({ ...formData, total_gaz: e.target.value })}
              />
            </div>
            <div>
              <label className="label-xs mb-2 block text-zinc-500">UNIT COST ($)</label>
              <input
                type="number"
                step="0.01"
                required
                className="input-field font-mono"
                placeholder="0.00"
                value={formData.unit_cost}
                onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="bg-zinc-950 rounded-xl p-5 border border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${formData.is_dyeing_required ? 'bg-gold-600' : 'bg-zinc-800'}`}
                onClick={() => setFormData({ ...formData, is_dyeing_required: !formData.is_dyeing_required })}
              >
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${formData.is_dyeing_required ? 'left-4.5' : 'left-0.5'}`} />
              </div>
              <span className="label-xs text-zinc-400">APPLY PROCESSING OVERHEAD ({dyeingOverheadRate}%)</span>
            </div>
            <span className={`text-[10px] font-bold ${formData.is_dyeing_required ? 'text-gold-500' : 'text-zinc-700'}`}>
              {formData.is_dyeing_required ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>

          <div className="pt-4 border-t border-zinc-900/50 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-500 font-medium">SUBTOTAL</span>
              <span className="text-xs font-mono text-zinc-400">${calculations.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-500 font-medium">DYEING/PROCESSING ({dyeingOverheadRate}%)</span>
              <span className="text-xs font-mono text-gold-500/80">+ ${calculations.dyeingOverhead.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-zinc-900">
              <span className="text-[10px] text-zinc-100 font-bold tracking-widest">GRAND TOTAL ESTIMATE</span>
              <span className="text-sm font-bold text-gold-500 font-mono">${calculations.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-900 flex justify-end gap-3">
          <button
            type="submit"
            disabled={loading || !calculations.isValid}
            className="btn-primary disabled:opacity-50 flex items-center justify-center gap-2 group px-8"
          >
            {loading ? 'Processing...' : (
              <>
                Initialize Production Batch
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};