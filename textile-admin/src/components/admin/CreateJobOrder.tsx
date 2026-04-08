import React, { useMemo, useState } from 'react';
import { z } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IndustrialCalculationService } from '../../services/IndustrialCalculationService';
import { cn } from '../../lib/utils';
import { Factory, Calculator, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

const jobOrderSchema = z.object({
  size: z.number().min(24).max(50),
  karigarId: z.string().min(1, 'Karigar is required'),
  expectedDeadline: z.string().min(1, 'Deadline is required'),
});

type JobOrderForm = z.infer<typeof jobOrderSchema>;

export const CreateJobOrder: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<JobOrderForm>({
    resolver: zodResolver(jobOrderSchema),
    defaultValues: {
      size: 32,
    },
  });

  const currentSize = useWatch({
    control,
    name: 'size',
  });

  // Industrial Math Engine: Size-based Breakdown
  const breakdown = useMemo(() => {
    if (!currentSize) return null;
    return IndustrialCalculationService.getGarmentSizeBreakdown(currentSize);
  }, [currentSize]);

  // Wastage logic (Industrial Standard)
  const totalWithWastage = useMemo(() => {
    if (!breakdown) return 0;
    return IndustrialCalculationService.calculateNetMaterialRequirement(breakdown.total, 5); // 5% Standard Waste
  }, [breakdown]);

  const onSubmit = async (data: JobOrderForm) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Industrial Job Order Initialized:', { ...data, breakdown, totalWithWastage });
    setLoading(false);
    setSuccess(true);
  };

  const sizes = Array.from({ length: 27 }, (_, i) => 24 + i);

  return (
    <div className="bg-[#09090b] border border-[#27272a] rounded-xl overflow-hidden shadow-2xl max-w-4xl mx-auto">
      <div className="bg-[#18181b] px-6 py-4 border-b border-[#27272a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
            <Factory className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-100">Initialize Job Order</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-electric-blue/50 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter italic">Anarkali Wholesale Protocol</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-8 grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Mandatory Size Selection</label>
            <select 
              {...register('size', { valueAsNumber: true })}
              className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:border-[#D4AF37] transition-all font-mono"
            >
              <option value="">Select Size (24-50)...</option>
              {sizes.map(s => (
                <option key={s} value={s}>Industrial Size {s}</option>
              ))}
            </select>
            {errors.size && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.size.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Production Deadline</label>
            <input 
              type="date"
              {...register('expectedDeadline')}
              className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:border-[#D4AF37] transition-all"
            />
            {errors.expectedDeadline && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.expectedDeadline.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Assigned Karigar (Master)</label>
            <select 
              {...register('karigarId')}
              className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:border-[#D4AF37] transition-all"
            >
              <option value="">Choose Karigar...</option>
              <option value="k-001">Master Salim (Embroidery Specialist)</option>
              <option value="k-002">Master Irfan (Finishing Expert)</option>
            </select>
            {errors.karigarId && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.karigarId.message}</p>}
          </div>

          <button 
            type="submit"
            disabled={loading || success}
            className={cn(
              "w-full py-4 rounded-lg font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 mt-4",
              success ? "bg-green-600 text-white" : "bg-[#D4AF37] hover:bg-[#C5A028] text-[#09090b]"
            )}
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : success ? <CheckCircle2 className="w-5 h-5" /> : null}
            {success ? "Job Deployed" : loading ? "Processing..." : "Deploy Production"}
          </button>
        </div>

        {/* Industrial Math Engine Dashboard */}
        <div className="bg-[#18181b] rounded-xl border border-[#27272a] p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-[#27272a] pb-4">
            <Calculator className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-tighter">Consumption Matrix Breakdown</h3>
          </div>

          {breakdown ? (
            <div className="space-y-6">
              <div className="grid gap-3">
                {[
                  { label: 'Kameez', val: breakdown.kameez },
                  { label: 'Shalwar', val: breakdown.shalwar },
                  { label: 'Dupatta', val: breakdown.dupatta }
                ].map(item => (
                  <div key={item.label} className="bg-[#09090b] p-3 border border-[#27272a] rounded-lg flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">{item.label}</span>
                    <span className="text-sm font-mono font-bold text-zinc-200">{item.val} gaz</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#27272a]">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase italic">Total Fabric Required (Incl. 5% Waste)</span>
                  <span className="text-2xl font-mono font-bold text-[#D4AF37]">{totalWithWastage} gaz</span>
                </div>
                <div className="w-full bg-[#09090b] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#D4AF37] h-full" style={{ width: '100%', opacity: 0.8 }} />
                </div>
              </div>

              <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-4 rounded-lg flex gap-3">
                <AlertTriangle className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                  Industrial calculation for Size <span className="text-zinc-100 font-bold">{currentSize}</span> is based on the verified Gold She Consumption Matrix.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-zinc-700 text-xs text-center px-8 italic uppercase tracking-widest">
              Awaiting size selection...
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
