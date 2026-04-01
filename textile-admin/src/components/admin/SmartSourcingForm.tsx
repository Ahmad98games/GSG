import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Scan, Sparkles, Droplets, Image as ImageIcon, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const sourcingSchema = z.object({
  materialName: z.string().min(3, 'Name must be at least 3 characters'),
  category: z.enum(['Fabric', 'Thread', 'Accessory', 'Fancy']),
  desiColor: z.string().min(1, 'Color is required'),
  targetQuantity: z.number().min(1),
  supplierId: z.string().optional(),
});

type SourcingForm = z.infer<typeof sourcingSchema>;

const DESI_COLORS = [
  { name: 'Kacha Sona (Glow Gold)', hex: '#D4AF37' },
  { name: 'Jamuni (Royal Purple)', hex: '#4B0082' },
  { name: 'Ferozi (Turquoise)', hex: '#40E0D0' },
  { name: 'Gulaabi (Hot Pink)', hex: '#FF69B4' },
  { name: 'Pista (Light Green)', hex: '#93C572' },
  { name: 'Maati (Earth Brown)', hex: '#8B4513' },
];

export const SmartSourcingForm: React.FC = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<null | { match: string; confidence: number }>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SourcingForm>({
    resolver: zodResolver(sourcingSchema),
  });

  const simulateAIVision = () => {
    setAnalyzing(true);
    setAnalysisResult(null);
    setTimeout(() => {
      setAnalyzing(false);
      setAnalysisResult({ match: 'Kacha Sona (Glow Gold)', confidence: 98.4 });
      setValue('desiColor', 'Kacha Sona (Glow Gold)');
      setValue('category', 'Fabric');
    }, 2500);
  };

  const onSubmit = (data: SourcingForm) => {
    console.log('Sourcing Request Logged:', data);
  };

  return (
    <div className="bg-[#09090b] border border-[#27272a] rounded-xl overflow-hidden shadow-2xl max-w-4xl mx-auto">
      <div className="bg-[#18181b] px-6 py-4 border-b border-[#27272a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
            <Scan className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-100">Smart Sourcing Engine</h2>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-[#D4AF37]" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter italic">AI Vision Enabled</span>
        </div>
      </div>

      <div className="p-8 grid md:grid-cols-12 gap-12">
        {/* Left: AI Upload Section */}
        <div className="md:col-span-5 space-y-6">
          <div className="group relative aspect-square bg-[#18181b] border-2 border-dashed border-[#27272a] hover:border-[#D4AF37]/50 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden">
            {analyzing ? (
              <div className="space-y-4 text-center">
                <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mx-auto" />
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Analyzing Texture Matrix...</p>
              </div>
            ) : analysisResult ? (
              <div className="text-center p-6 space-y-4">
                <div className="w-24 h-24 rounded-full mx-auto shadow-2xl border-4 border-[#D4AF37]" style={{ backgroundColor: '#D4AF37' }} />
                <div>
                  <p className="text-[10px] font-bold text-[#D4AF37] uppercase">Match Detected</p>
                  <h4 className="text-lg font-bold text-zinc-100">{analysisResult.match}</h4>
                  <p className="text-[9px] text-zinc-500 font-mono mt-1">CONFIDENCE: {analysisResult.confidence}%</p>
                </div>
                <button 
                  onClick={() => setAnalysisResult(null)}
                  className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-widest"
                >
                  Reset Analysis
                </button>
              </div>
            ) : (
              <>
                <div className="p-4 bg-[#27272a] rounded-full group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-8 h-8 text-zinc-500" />
                </div>
                <p className="mt-4 text-[11px] font-bold text-zinc-400 uppercase tracking-widest text-center px-8">
                  Drop Fabric Sample Image or <span className="text-[#D4AF37]">Click to Upload</span>
                </p>
                <div className="absolute inset-0 bg-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            )}
          </div>
          
          <button 
            onClick={simulateAIVision}
            disabled={analyzing || !!analysisResult}
            className="w-full py-4 bg-zinc-100 text-black rounded-xl font-black uppercase text-xs tracking-[0.2em] hover:bg-white transition-all disabled:opacity-50"
          >
            {analyzing ? 'Scanning...' : 'Kickstart AI Analysis'}
          </button>
        </div>

        {/* Right: Manual Data Entry */}
        <form onSubmit={handleSubmit(onSubmit)} className="md:col-span-7 space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Material Name</label>
            <input 
              {...register('materialName')}
              placeholder="e.g. Premium Pashmina Mesh"
              className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:border-[#D4AF37] transition-all"
            />
            {errors.materialName && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.materialName.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Category</label>
              <select 
                {...register('category')}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:border-[#D4AF37] transition-all"
              >
                <option value="Fabric">Fabric</option>
                <option value="Thread">Thread</option>
                <option value="Accessory">Accessory</option>
                <option value="Fancy">Fancy Items</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Target Qty (m)</label>
              <input 
                type="number"
                {...register('targetQuantity', { valueAsNumber: true })}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:border-[#D4AF37] transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Droplets className="w-3 h-3" /> Industrial Desi Colors
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DESI_COLORS.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setValue('desiColor', color.name)}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-lg border transition-all gap-2",
                    "hover:bg-[#18181b] hover:border-[#D4AF37]/30",
                    "border-[#27272a] bg-[#09090b]"
                  )}
                >
                  <div className="w-6 h-6 rounded-full shadow-lg" style={{ backgroundColor: color.hex }} />
                  <span className="text-[8px] font-bold uppercase text-zinc-500 text-center tracking-tighter leading-tight">
                    {color.name.split(' (')[0]}
                  </span>
                </button>
              ))}
            </div>
            {errors.desiColor && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.desiColor.message}</p>}
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              className="w-full py-4 bg-[#D4AF37] text-black rounded-xl font-black uppercase text-xs tracking-[0.2em] hover:bg-[#C5A028] transition-all shadow-xl shadow-[#D4AF37]/10 flex items-center justify-center gap-3"
            >
              <CheckCircle className="w-4 h-4" /> Finalize Sourcing Matrix
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
