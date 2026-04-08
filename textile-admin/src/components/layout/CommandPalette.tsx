'use client';

import React, { useState, useEffect } from 'react';
import { Command, Calculator, X, ArrowRight, Activity } from 'lucide-react';
import { sovereign } from '../../lib/SovereignCore';
import { cn } from '../../lib/utils';

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isPreShrunk, setIsPreShrunk] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleCalculate = async () => {
    const query = inputValue.toLowerCase().trim();
    setIsCalculating(true);
    
    try {
      // Command: "Gaz to Suit" (e.g. "100 g")
      const gazMatch = query.match(/(\d+\.?\d*)\s*g/);
      if (gazMatch) {
        const { suits, remnant } = await sovereign.solveYieldOptimization(parseFloat(gazMatch[1]), isPreShrunk);
        setResult(`${suits} SUITS (+${remnant} GAZ REMNANT)`);
        return;
      }

      // Command: "Suit to Gaz" (e.g. "100 s")
      const suitMatch = query.match(/(\d+)\s*s/);
      if (suitMatch) {
        // Suit to Gaz using base 2.75 for simplicity in calculation, 
        // though sovereign core handles more complex yield.
        const gaz = parseFloat(suitMatch[1]) * 2.75;
        setResult(`${gaz.toFixed(2)} GAZ REQUIRED`);
        return;
      }

      setResult("INVALID_CMD // TRY: '100 g' or '100 s'");
    } finally {
      setIsCalculating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-lg bg-[#0F1113] border border-white/10 rounded-xl shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 flex items-center gap-4 border-b border-white/5">
          <Command className="w-4 h-4 text-electric-blue" />
          <input 
            autoFocus
            placeholder="Enter Command (e.g. '100 g' for Gaz to Suit...)"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setResult(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
            className="flex-1 bg-transparent border-none text-zinc-100 text-sm font-mono focus:outline-none placeholder:text-zinc-700"
          />
          <div className="flex items-center gap-2">
             <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-zinc-600 font-mono">ENTER</kbd>
             <button onClick={() => setIsOpen(false)}>
               <X className="w-4 h-4 text-zinc-700 hover:text-white transition-all" />
             </button>
          </div>
        </div>

        {/* Safety Toggle Area */}
        <div className="px-4 py-2 bg-[#070809] border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <span className={cn(
               "text-[8px] font-black uppercase tracking-widest transition-all",
               !isPreShrunk ? "text-electric-blue" : "text-zinc-700"
             )}>Raw_Math (Shrinkage ON)</span>
             <button 
               onClick={() => {
                 setIsPreShrunk(!isPreShrunk);
                 setResult(null);
               }}
               className="w-8 h-4 bg-zinc-900 border border-white/10 rounded-full relative p-0.5 transition-all"
             >
               <div className={cn(
                 "w-2.5 h-2.5 rounded-full transition-all flex items-center justify-center",
                 isPreShrunk ? "translate-x-4 bg-electric-blue" : "translate-x-0 bg-zinc-700"
               )} />
             </button>
             <span className={cn(
               "text-[8px] font-black uppercase tracking-widest transition-all",
               isPreShrunk ? "text-electric-blue" : "text-zinc-700"
             )}>Processed (Shrinkage OFF)</span>
          </div>
          <div className="flex items-center gap-2 text-[7px] font-mono text-zinc-800 uppercase italic tracking-widest">
            {isCalculating && <Activity className="w-2.5 h-2.5 animate-spin text-electric-blue" />}
            v5.0 Sovereign Orchestrator Active
          </div>
        </div>

        {result ? (
          <div className="p-8 bg-electric-blue/[0.02] flex flex-col items-center justify-center space-y-4 animate-in slide-in-from-top-2 duration-300">
             <div className="flex items-center gap-3 text-zinc-500 text-[10px] uppercase font-black tracking-widest font-mono">
                <Calculator className="w-3 h-3" />
                Sovereign Computation Result
             </div>
             <div className="flex items-center gap-4">
                <span className="text-zinc-600 font-mono text-lg">{inputValue.toUpperCase()}</span>
                <ArrowRight className="w-4 h-4 text-electric-blue" />
                <span className="text-electric-blue font-mono text-xl md:text-2xl font-black tracking-tighter drop-shadow-[0_0_15px_rgba(96,165,250,0.3)] text-center">
                  {result}
                </span>
             </div>
          </div>
        ) : (
          <div className="p-4 bg-base-p/50">
            <div className="grid grid-cols-2 gap-2 text-[8px] font-black uppercase tracking-widest text-zinc-700">
               <div className="p-2 border border-white/5 rounded-[2px]">[VALUE] g &rarr; Gaz to Suit</div>
               <div className="p-2 border border-white/5 rounded-[2px]">[VALUE] s &rarr; Suit to Gaz</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
