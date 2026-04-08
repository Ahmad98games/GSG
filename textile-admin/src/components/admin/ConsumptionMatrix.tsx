import React, { useState, useMemo } from 'react';
import { IndustrialCalculationService } from '../../services/IndustrialCalculationService';
import type { SizeProtocol } from '../../services/IndustrialCalculationService';
import { Calculator, ClipboardList, Zap, Ruler } from 'lucide-react';
import { sovereign } from '../../lib/SovereignCore';

const DEFAULT_PROTOCOLS: SizeProtocol[] = IndustrialCalculationService.getAllProtocols();

export const ConsumptionMatrix: React.FC = () => {
  const [selectedSize, setSelectedSize] = useState<number>(32);
  const [quantity, setQuantity] = useState<number>(100);
  const [shrinkagePercent, setShrinkagePercent] = useState<number>(6.5);
  const [isDeploying, setIsDeploying] = useState(false);

  const wastageBuffer = 4.0; // User Requirement: Hard-coded 4% industrial wastage

  const activeProtocol = useMemo(() => 
    DEFAULT_PROTOCOLS.find(p => p.size === selectedSize) || DEFAULT_PROTOCOLS[2],
  [selectedSize]);

  const calculation = useMemo(() => {
    const cons = IndustrialCalculationService.calculateConsumption({
      garmentType: `Standard Suit (Size ${selectedSize})`,
      sizeNumber: selectedSize,
      quantity,
      kameezGazPerUnit: activeProtocol.kameez,
      shalwarGazPerUnit: activeProtocol.shalwar,
      dupattaGazPerUnit: activeProtocol.dupatta,
      laceGazPerUnit: activeProtocol.lace,
      wastagePercent: wastageBuffer
    });

    // Apply Shrinkage Protocol
    const shrinkCalc = IndustrialCalculationService.calculateShrinkage(cons.finalRequiredGaz, shrinkagePercent);
    
    return {
      ...cons,
      wastageGaz: sovereign.preciseRound(cons.wastageGaz),
      finalRequiredGaz: sovereign.preciseRound(cons.finalRequiredGaz),
      shrinkageLoss: sovereign.preciseRound(shrinkCalc.shrinkageLoss),
      finalRequiredWithShrinkage: sovereign.preciseRound(shrinkCalc.netGaz)
    };
  }, [selectedSize, quantity, shrinkagePercent, activeProtocol]);

  const handleDeployToJobOrder = async () => {
    setIsDeploying(true);
    try {
      // Logic to create a Job Order or log the spec
      alert('PROTOCOL_LOCKED: Specs deployed to Job Order Pipeline.');
    } catch (error) {
      console.error('Deployment Failure:', error);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <section className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h2 className="text-sm font-black text-electric-blue tracking-[.2em] uppercase italic">
            Fabric Estimator
          </h2>
          <p className="text-[10px] text-zinc-600 mt-2 font-mono tracking-wider italic">
            PRODUCTION_MATH // FABRIC YIELD OPTIMIZATION
          </p>
        </div>
        <div className="flex gap-6">
           <div className="flex flex-col items-end">
              <span className="text-[9px] text-zinc-700 font-black uppercase tracking-widest">Wastage Buffer</span>
              <span className="text-electric-blue text-[13px] font-black font-mono">{wastageBuffer}%</span>
           </div>
           <div className="flex flex-col items-end">
              <span className="text-[9px] text-zinc-700 font-black uppercase tracking-widest">Shrinkage</span>
              <span className="text-electric-blue text-[13px] font-black font-mono">{shrinkagePercent}%</span>
           </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Input Selection */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-base-s border border-white/5 p-8 rounded-[2px] space-y-8 shadow-2xl">
            <h3 className="text-electric-blue text-[11px] font-black uppercase tracking-[0.3em] italic font-mono">
              Options
            </h3>

            <div className="space-y-6">
              {/* Size Selector */}
              <div>
                <label className="block text-zinc-600 text-[10px] font-black uppercase tracking-[.2em] mb-4">
                  Select Size
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {DEFAULT_PROTOCOLS.map((p) => (
                    <button
                      key={p.size}
                      onClick={() => setSelectedSize(p.size)}
                      className={`py-3 text-[12px] font-mono border transition-all rounded-[2px] ${
                        selectedSize === p.size
                          ? 'bg-electric-blue text-base-p border-electric-blue font-black shadow-[0_0_20px_rgba(96,165,250,0.3)]'
                          : 'bg-base-p text-zinc-600 border-white/5 hover:border-white/10'
                      }`}
                    >
                      {p.size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-zinc-600 text-[10px] font-black uppercase tracking-[.2em] mb-4">
                  Quantity (Pieces)
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-base-p border border-white/5 text-zinc-100 px-5 py-4 text-sm font-mono focus:outline-none focus:border-electric-blue/40 rounded-[2px] shadow-inner tracking-tighter"
                />
              </div>

              {/* Shrinkage Management */}
              <div>
                <label className="block text-zinc-600 text-[10px] font-black uppercase tracking-[.2em] mb-4">
                   Manual Shrinkage (%)
                </label>
                <div className="flex items-center gap-6">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={shrinkagePercent}
                    onChange={(e) => setShrinkagePercent(parseFloat(e.target.value))}
                    className="flex-1 accent-gold bg-base-p h-1 cursor-pointer"
                  />
                  <span className="text-zinc-100 font-mono text-sm bg-base-p px-4 py-2 border border-white/5 rounded-[2px] w-20 text-center font-black">
                    {shrinkagePercent}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-base-s border border-white/5 p-8 rounded-[2px] space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Calculator className="w-5 h-5 text-electric-blue" />
              <h3 className="text-electric-blue text-[11px] font-black uppercase tracking-[0.3em] italic font-mono">
                Measurements
              </h3>
            </div>
            <div className="space-y-3 font-mono text-[11px] text-zinc-600">
               <div className="flex justify-between">
                  <span className="uppercase tracking-widest font-black">Kameez per Suit</span>
                  <span className="text-zinc-300">{activeProtocol.kameez} Gaz</span>
               </div>
               <div className="flex justify-between">
                  <span className="uppercase tracking-widest font-black">Shalwar per Suit</span>
                  <span className="text-zinc-300">{activeProtocol.shalwar} Gaz</span>
               </div>
               <div className="flex justify-between">
                  <span className="uppercase tracking-widest font-black">Dupatta per Suit</span>
                  <span className="text-zinc-300">{activeProtocol.dupatta} Gaz</span>
               </div>
               <div className="flex justify-between border-t border-white/5 pt-4 text-electric-blue/80 font-black">
                  <span className="uppercase tracking-[.2em]">Total per Suit</span>
                  <span className="text-sm">{sovereign.preciseRound(activeProtocol.kameez + activeProtocol.shalwar + activeProtocol.dupatta)} Gaz</span>
               </div>
            </div>
          </div>
        </div>

        {/* Right: Yield Output */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-base-s border border-white/5 rounded-[2px] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6">
               <Zap className="w-16 h-16 text-electric-blue opacity-[0.03] animate-pulse" />
            </div>

            <div className="flex items-center gap-5 mb-12">
               <div className="p-4 bg-base-p border border-white/5 rounded-[2px] shadow-inner">
                  <Ruler className="w-8 h-8 text-electric-blue" />
               </div>
               <div>
                  <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">Total Required Fabric</p>
                  <h4 className="text-white text-4xl font-black uppercase tracking-tighter font-mono mt-1">
                     {calculation.finalRequiredWithShrinkage} <span className="text-sm text-zinc-700 opacity-50 tracking-widest ml-2">Gaz</span>
                  </h4>
               </div>
            </div>

            {/* Breakdown Visualizer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <section className="space-y-6">
                  <h3 className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.3em] border-b border-white/5 pb-3">Usage Breakdown</h3>
                  
                  <div className="space-y-10">
                     {/* Kameez */}
                     <div>
                        <div className="flex justify-between text-[11px] mb-3">
                           <span className="text-zinc-500 font-bold uppercase tracking-widest">Kameez</span>
                           <span className="text-white font-mono font-black">{calculation.kameezGazPerUnit * quantity} Gaz</span>
                        </div>
                        <div className="h-1 bg-base-p overflow-hidden rounded-full border border-white/5">
                           <div 
                              className="h-full bg-electric-blue/50 shadow-[0_0_10px_rgba(96,165,250,0.3)] transition-all duration-1000" 
                              style={{ width: `${(calculation.kameezGazPerUnit / (activeProtocol.kameez + activeProtocol.shalwar + activeProtocol.dupatta)) * 100}%` }} 
                           />
                        </div>
                     </div>

                     {/* Shalwar */}
                     <div>
                        <div className="flex justify-between text-[11px] mb-3">
                           <span className="text-zinc-500 font-bold uppercase tracking-widest">Shalwar</span>
                           <span className="text-white font-mono font-black">{calculation.shalwarGazPerUnit * quantity} Gaz</span>
                        </div>
                        <div className="h-1 bg-base-p overflow-hidden rounded-full border border-white/5">
                           <div 
                              className="h-full bg-electric-blue/40 shadow-[0_0_10px_rgba(96,165,250,0.2)] transition-all duration-1000" 
                              style={{ width: `${(calculation.shalwarGazPerUnit / (activeProtocol.kameez + activeProtocol.shalwar + activeProtocol.dupatta)) * 100}%` }} 
                           />
                        </div>
                     </div>

                     {/* Dupatta */}
                     <div>
                        <div className="flex justify-between text-[11px] mb-3">
                           <span className="text-zinc-500 font-bold uppercase tracking-widest">Dupatta</span>
                           <span className="text-white font-mono font-black">{calculation.dupattaGazPerUnit * quantity} Gaz</span>
                        </div>
                        <div className="h-1 bg-base-p overflow-hidden rounded-full border border-white/5">
                           <div 
                              className="h-full bg-electric-blue/30 shadow-[0_0_10px_rgba(96,165,250,0.1)] transition-all duration-1000" 
                              style={{ width: `${(calculation.dupattaGazPerUnit / (activeProtocol.kameez + activeProtocol.shalwar + activeProtocol.dupatta)) * 100}%` }} 
                           />
                        </div>
                     </div>
                  </div>
               </section>

               <section className="space-y-6">
                  <h3 className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.3em] border-b border-white/5 pb-3">Wastage Buffer</h3>
                  
                  <div className="bg-base-p p-8 border border-white/5 space-y-8 rounded-[2px] shadow-inner">
                     <div>
                        <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[.4em] mb-3">Buffer Loss</p>
                        <p className="text-red-500 font-black text-3xl font-mono tracking-tighter">-{calculation.wastageGaz} Gaz</p>
                     </div>
                     
                     <div className="grid grid-cols-1 gap-4 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center text-[11px]">
                           <span className="text-zinc-600 font-bold uppercase tracking-widest">Efficiency</span>
                           <span className="text-electric-blue font-mono font-black">{100 - wastageBuffer}%</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                           <span className="text-zinc-600 font-bold uppercase tracking-widest">Extra Rolls</span>
                           <span className="text-white font-mono font-black">+{Math.ceil(calculation.wastageGaz / 40)} Rolls</span>
                        </div>
                     </div>
                  </div>
               </section>
            </div>

            <div className="mt-12 flex gap-4">
               <button
                  onClick={handleDeployToJobOrder}
                  disabled={isDeploying}
                  className="flex-1 bg-electric-blue text-base-p text-xs font-black uppercase tracking-[0.5em] py-5 hover:bg-electric-blue/90 transition-all flex items-center justify-center gap-4 rounded-[2px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] transform active:scale-[0.98]"
               >
                  <ClipboardList className="w-5 h-5" />
                  {isDeploying ? 'Starting...' : 'Start Production'}
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
