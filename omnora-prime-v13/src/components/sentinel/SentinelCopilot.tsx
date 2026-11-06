"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Eye, 
  Wand2, 
  Minimize2, 
  Maximize2,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export interface AutoPilotGuide {
  title: string;
  route: string;
  steps: string[];
  currentStep?: number;
  actionId?: string;
  autoFilled?: boolean;
}

export default function SentinelCopilot() {
  const pathname = usePathname();
  const router = useRouter();
  const [guide, setGuide] = useState<AutoPilotGuide | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [fillStatus, setFillStatus] = useState<string | null>(null);

  // Load from sessionStorage on mount or pathname change
  const syncFromStorage = useCallback(() => {
    try {
      const raw = sessionStorage.getItem('noxis_active_autopilot');
      if (raw) {
        const parsed: AutoPilotGuide = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.steps) && parsed.steps.length > 0) {
          setGuide(parsed);
          setCurrentStepIndex(parsed.currentStep || 0);
          setIsCompleted(false);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    syncFromStorage();
  }, [syncFromStorage, pathname]);

  // Listen to live event triggers
  useEffect(() => {
    const handleStart = (e: CustomEvent<AutoPilotGuide>) => {
      if (e.detail) {
        const newGuide = {
          ...e.detail,
          currentStep: 0,
        };
        sessionStorage.setItem('noxis_active_autopilot', JSON.stringify(newGuide));
        setGuide(newGuide);
        setCurrentStepIndex(0);
        setIsCompleted(false);
        setIsMinimized(false);
      }
    };

    const handleStop = () => {
      sessionStorage.removeItem('noxis_active_autopilot');
      setGuide(null);
      setIsCompleted(false);
    };

    window.addEventListener('sentinel:start-autopilot' as any, handleStart);
    window.addEventListener('sentinel:stop-autopilot' as any, handleStop);

    return () => {
      window.removeEventListener('sentinel:start-autopilot' as any, handleStart);
      window.removeEventListener('sentinel:stop-autopilot' as any, handleStop);
    };
  }, []);

  const handleClose = () => {
    sessionStorage.removeItem('noxis_active_autopilot');
    setGuide(null);
    setIsCompleted(false);
  };

  const handleNext = () => {
    if (!guide) return;
    if (currentStepIndex < guide.steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const updated = { ...guide, currentStep: nextIdx };
      setGuide(updated);
      sessionStorage.setItem('noxis_active_autopilot', JSON.stringify(updated));
      handleHighlight();
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrev = () => {
    if (!guide || currentStepIndex === 0) return;
    const prevIdx = currentStepIndex - 1;
    setCurrentStepIndex(prevIdx);
    setIsCompleted(false);
    const updated = { ...guide, currentStep: prevIdx };
    setGuide(updated);
    sessionStorage.setItem('noxis_active_autopilot', JSON.stringify(updated));
    handleHighlight();
  };

  // Highlights relevant interactive elements on the active page
  const handleHighlight = () => {
    try {
      const selectors = [
        '[data-tour]',
        'input[type="text"]:not([disabled])',
        'input[type="search"]:not([disabled])',
        'select:not([disabled])',
        'button.bg-blue-600',
        'button[type="submit"]',
        'button:not([disabled])'
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (el && el.offsetParent !== null) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-blue-500', 'ring-offset-2', 'ring-offset-slate-900', 'transition-all');
          setTimeout(() => {
            el.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-2', 'ring-offset-slate-900');
          }, 3000);
          break;
        }
      }
    } catch {
      // ignore DOM highlight errors
    }
  };

  // Practical Auto-Fill Demonstration: fills realistic example values
  const handleAutoFill = () => {
    let filledCount = 0;
    try {
      const inputs = Array.from(document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
      ));

      inputs.forEach((input) => {
        const placeholder = 'placeholder' in input ? (input as HTMLInputElement).placeholder : '';
        const name = (input.name || input.id || placeholder || '').toLowerCase();
        let demoVal = '';

        if (name.includes('party') || name.includes('customer') || name.includes('buyer') || name.includes('client')) {
          demoVal = 'Al-Rehman Textile Mills (Demo)';
        } else if (name.includes('supplier') || name.includes('vendor')) {
          demoVal = 'Chenab Yarn Traders (Demo)';
        } else if (name.includes('item') || name.includes('description') || name.includes('sku') || name.includes('title')) {
          demoVal = 'Premium Combed Cotton 68/68';
        } else if (name.includes('qty') || name.includes('quantity') || name.includes('count')) {
          demoVal = '100';
        } else if (name.includes('rate') || name.includes('price')) {
          demoVal = '380';
        } else if (name.includes('amount') || name.includes('total')) {
          demoVal = '38000';
        } else if (name.includes('worker') || name.includes('karigar') || name.includes('name')) {
          demoVal = 'Muhammad Aslam (Master Karigar)';
        } else if (name.includes('phone') || name.includes('mobile')) {
          demoVal = '03001234567';
        } else if (name.includes('cheque') || name.includes('check')) {
          demoVal = 'CHQ-892014';
        } else if (name.includes('bank')) {
          demoVal = 'Meezan Bank Ltd';
        } else if (name.includes('peshgi') || name.includes('advance')) {
          demoVal = '5000';
        } else if (name.includes('note') || name.includes('remarks') || name.includes('memo')) {
          demoVal = 'Filled automatically by Sentinel AI Auto-Pilot for demonstration';
        }

        if (demoVal && !input.value) {
          input.value = demoVal;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          filledCount++;
        }
      });

      if (filledCount > 0) {
        setFillStatus(`Demo data filled in ${filledCount} field(s)!`);
        setTimeout(() => setFillStatus(null), 3000);
      } else {
        setFillStatus("Relevant fields ready for your input.");
        setTimeout(() => setFillStatus(null), 3000);
      }
    } catch {
      setFillStatus("Ready to guide you manually.");
      setTimeout(() => setFillStatus(null), 2500);
    }
  };

  if (!guide) return null;

  return (
    <AnimatePresence>
      <motion.aside
        aria-label="Sentinel Auto-Pilot"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-6 right-6 z-[105] w-full max-w-[440px] bg-slate-900/95 backdrop-blur-md border border-blue-500/30 rounded-xl shadow-2xl shadow-black/60 overflow-hidden font-sans text-slate-100"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-900/60 via-slate-900 to-slate-900 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-blue-400">Sentinel Auto-Pilot</span>
                <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 font-mono">
                  {currentStepIndex + 1}/{guide.steps.length}
                </span>
              </div>
              <h4 className="text-xs font-semibold text-white line-clamp-1">
                {guide.title}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-md transition-colors"
              title="Close Walkthrough"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expandable Body */}
        {!isMinimized && (
          <div className="p-4 space-y-3.5">
            {isCompleted ? (
              <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h5 className="text-sm font-semibold text-emerald-300">Practical Walkthrough Complete!</h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Aapne is feature ke tamam amali steps dekh liye hain. Ab aap bina kisi hichkichahat ke khud isko use kar sakte hain.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                  >
                    Done & Return
                  </button>
                  <button
                    onClick={() => {
                      setCurrentStepIndex(0);
                      setIsCompleted(false);
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    Restart Demo
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Step Content */}
                <div className="p-3.5 rounded-lg bg-slate-800/60 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-blue-300 font-medium">
                    <span>Qadam {currentStepIndex + 1}:</span>
                    <span className="text-slate-400 text-[10px]">
                      Step {currentStepIndex + 1} of {guide.steps.length}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-100 font-medium">
                    {guide.steps[currentStepIndex]}
                  </p>
                </div>

                {fillStatus && (
                  <div className="px-3 py-1.5 rounded bg-blue-500/20 border border-blue-500/30 text-blue-200 text-[11px] flex items-center gap-1.5 animate-fadeIn">
                    <Wand2 className="w-3.5 h-3.5 text-blue-300" />
                    <span>{fillStatus}</span>
                  </div>
                )}

                {/* Practical Controls */}
                <div className="flex items-center justify-between pt-1 gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleAutoFill}
                      className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Auto-fill sample demonstration data into form inputs"
                    >
                      <Wand2 className="w-3 h-3 text-blue-400" />
                      <span>Auto-Fill Demo</span>
                    </button>
                    <button
                      onClick={handleHighlight}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Locate and highlight active element on screen"
                    >
                      <Eye className="w-3 h-3 text-slate-400" />
                      <span>Locate</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handlePrev}
                      disabled={currentStepIndex === 0}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>
                    <button
                      onClick={handleNext}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-[11px] font-semibold transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <span>{currentStepIndex === guide.steps.length - 1 ? 'Finish' : 'Next'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </motion.aside>
    </AnimatePresence>
  );
}
