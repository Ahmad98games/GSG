"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Terminal, Sparkles, Command } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSentinelVoice } from '@/hooks/useSentinelVoice';
import { parseCommand } from '@/lib/sentinel/commandEngine';
import { processChatQuery } from '@/lib/knowledge/noxis-chat';
import { cn } from '@/lib/utils';

export default function SentinelAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [commandText, setCommandText] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const launchAutoPilot = (route: string, title: string, steps: string[] = [], actionId?: string) => {
    const payload = {
      title,
      route,
      steps: steps.length > 0 ? steps : [
        `1. Open ${title}`,
        '2. Review inputs and operational entries',
        '3. Confirm changes to update local SQLite records'
      ],
      actionId,
    };
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('noxis_active_autopilot', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('sentinel:start-autopilot', { detail: payload }));
    }
    setIsOpen(false);
    setResponse(null);
    setCommandText("");
    setResult(null);
    router.push(route);
  };

  const handleCommand = async (text: string) => {
    if (!text.trim()) return;

    // Fast Shortcut Triggers: Tour & Zoom
    const lower = text.toLowerCase().trim();
    if (lower.includes('tour') || lower === 'replay tour') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('noxis-tour-completed');
        window.dispatchEvent(new CustomEvent('start-noxis-tour'));
      }
      setResponse("Launching interactive Guided Product Tour...");
      setTimeout(() => setIsOpen(false), 800);
      return;
    }

    if (lower.includes('zoom') || lower === 'ctrl 0') {
      if (typeof window !== 'undefined') {
        document.body.style.zoom = '100%';
        window.dispatchEvent(new CustomEvent('reset-zoom'));
      }
      setResponse("Zoom level default 100% par reset kar diya gaya hai.");
      setTimeout(() => setIsOpen(false), 900);
      return;
    }
    
    // 1. Try Command Engine first (Navigation/Actions)
    const cmd = parseCommand(text);
    if (cmd) {
      setResult(cmd);
      setResponse(`Executing: ${cmd.intent.replace(/_/g, ' ')}...`);
      setIsError(false);
      
      if (typeof cmd.action === 'function') {
        setTimeout(() => {
          (cmd.action as any)(router as any, cmd.entities || {});
          setIsOpen(false);
          setResponse(null);
          setCommandText("");
          setResult(null);
        }, 800);
      } else if (cmd.route) {
        setTimeout(() => {
          router.push(cmd.route!);
          setIsOpen(false);
          setResponse(null);
          setCommandText("");
          setResult(null);
        }, 800);
      } else {
        setResponse(`Matched command: ${cmd.label || cmd.intent.replace(/_/g, ' ')}`);
      }
      return;
    } 

    // 2. Try Knowledge Base & Sentinel Brain (Answering Questions & Practical Auto-Pilot)
    setResponse("Analyzing internal data...");
    setResult(null);
    setIsError(false);
    
    try {
      const chatRes = await processChatQuery(text, []);
      setResponse(chatRes.content);
      
      if (chatRes.practicalAction) {
        const actionData = {
          route: chatRes.practicalAction.route,
          label: chatRes.practicalAction.label,
          title: chatRes.practicalAction.title || chatRes.practicalAction.label,
          steps: chatRes.practicalAction.steps || [],
          actionId: chatRes.practicalAction.actionId,
        };
        setResult(actionData);

        // If user explicitly asked "karke dikhao" or "perform", auto-launch Auto-Pilot!
        const isDirectPerform = /\b(perform|karke dikhao|krke dikhao|chala ke dikhao|demo|show me|sikhao)\b/i.test(text);
        if (isDirectPerform && chatRes.practicalAction.route) {
          setTimeout(() => {
            launchAutoPilot(
              actionData.route,
              actionData.title,
              actionData.steps,
              actionData.actionId
            );
          }, 900);
        }
      } else {
        setResult(null);
      }

      if (Array.isArray(chatRes.suggestions) && chatRes.suggestions.length > 0) {
        setSuggestedChips(chatRes.suggestions);
      } else {
        setSuggestedChips([]);
      }
      setIsError(false);
    } catch (err) {
      setResponse("I couldn't process that request right now.");
      setIsError(true);
    }
  };

  const [suggestedChips, setSuggestedChips] = useState<string[]>([]);

  const { isListening, transcript, startListening, stopListening } = useSentinelVoice(handleCommand);

  // Keyboard shortcut Ctrl+Shift+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
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

  // Listen for external triggers (e.g. from header mic icon)
  useEffect(() => {
    const handleTrigger = () => setIsOpen(true);
    window.addEventListener('sentinel:open', handleTrigger);
    return () => window.removeEventListener('sentinel:open', handleTrigger);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
            />

            {/* Assistant Panel - Viewport Bounded (Fits on 1 Screen, Never Overflows Desktop) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-[620px] max-h-[85vh] h-auto flex flex-col bg-[#0B0F17]/95 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden pointer-events-auto backdrop-blur-xl"
            >
              {/* Header - Pinned at Top */}
              <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02] shrink-0">
                <div className="flex items-center space-x-2.5">
                  <div className="w-5 h-5 bg-electric-blue rounded flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.4)]">
                    <Sparkles size={12} className="text-black" />
                  </div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-white">Sentinel Assistant</span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Center Body Area */}
              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar">
                {/* Visual Feedback / Waveform */}
                <div className="h-8 flex items-center justify-center space-x-1.5 shrink-0">
                  {isListening ? (
                    [...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [8, 24, 8] }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 0.6, 
                          ease: "easeInOut", 
                          delay: i * 0.15 
                        }}
                        className="w-1.5 bg-electric-blue rounded-full"
                      />
                    ))
                  ) : (
                    <div className="flex items-center space-x-1 opacity-25">
                      {[...Array(5)].map((_, i) => <div key={i} className="w-1.5 h-2 bg-gray-500 rounded-full" />)}
                    </div>
                  )}
                </div>

                {/* Status / Recognition Text (Shown when no response yet) */}
                <AnimatePresence mode="wait">
                  {!response && (
                    <div className="flex flex-col items-center justify-center text-center py-2">
                      {isListening ? (
                        <motion.p 
                          key="transcript"
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          className="text-xl font-black text-white font-mono tracking-tight italic"
                        >
                          "{transcript || "Listening..."}"
                        </motion.p>
                      ) : (
                        <motion.div 
                          key="placeholder"
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          className="space-y-3"
                        >
                          <p className="text-base font-bold text-gray-300">Ask about any module, shortcut, or feature...</p>
                          <div className="flex flex-wrap justify-center gap-1.5 max-w-lg">
                            {[
                              "Business Intelligence",
                              "Reset zoom (Ctrl+0)",
                              "Data Import Wizard",
                              "Karigar piece-rates",
                              "Mandi rates",
                              "Cash flow forecast",
                              "Offline SQLite engine",
                              "Desktop shortcuts"
                            ].map(cmd => (
                              <button 
                                key={cmd} 
                                className="text-[10px] uppercase font-bold text-gray-400 px-2.5 py-1 bg-white/5 rounded border border-white/10 hover:border-electric-blue/40 hover:text-white transition-colors cursor-pointer" 
                                onClick={() => handleCommand(cmd)}
                              >
                                "{cmd}"
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </AnimatePresence>

                {/* Response Section */}
                <AnimatePresence mode="wait">
                  {response && (
                    <motion.div
                      key="response"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={cn(
                        "p-4 rounded-lg border text-xs leading-relaxed",
                        isError ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-white/[0.04] border-white/10 text-white"
                      )}
                    >
                      <div className="space-y-3">
                        <div className="whitespace-pre-wrap leading-relaxed text-slate-200 font-sans text-xs sm:text-[13px]">
                          {response}
                        </div>

                        {result?.route && (
                          <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => {
                                launchAutoPilot(
                                  result.route,
                                  result.title || result.label,
                                  result.steps || [],
                                  result.actionId
                                );
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition-all cursor-pointer"
                            >
                              <Sparkles size={13} className="text-blue-200" />
                              <span>⚡ Perform For Me (Live Auto-Pilot)</span>
                            </button>

                            <button
                              onClick={() => {
                                router.push(result.route);
                                setIsOpen(false);
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-all cursor-pointer"
                            >
                              <span>🚀 Open {result.label || 'Module'}</span>
                              <span className="text-[10px] opacity-70">→</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {suggestedChips.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-1.5">
                          {suggestedChips.map((chip, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setCommandText(chip);
                                handleCommand(chip);
                              }}
                              className="px-2.5 py-1 bg-white/10 border border-white/10 rounded-full text-[10px] font-bold uppercase hover:bg-blue-500 hover:border-blue-500 transition-all text-slate-200 cursor-pointer"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Pinned Bottom Footer (Input Field & Control Bar) */}
              <div className="p-4 border-t border-white/10 bg-[#0B0F17] shrink-0 space-y-3">
                {/* Input Field */}
                <div className="w-full relative group">
                  <Terminal size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-electric-blue transition-colors" />
                  <input 
                    ref={inputRef}
                    type="text" 
                    value={commandText}
                    onChange={(e) => setCommandText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCommand(commandText)}
                    placeholder="Type command or question (e.g. 'invoice kaise banu?')..."
                    className="w-full bg-[#121620] border border-white/10 rounded-lg pl-10 pr-16 py-2.5 text-xs text-white focus:border-electric-blue/50 outline-none transition-all placeholder:text-gray-500 font-mono"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                    <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[9px] text-gray-400 font-mono">ENTER</kbd>
                  </div>
                </div>

                {/* Control Bar */}
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono">
                    <Command size={10} />
                    <span>Control Panel v1.0</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button 
                      onMouseDown={startListening}
                      onMouseUp={stopListening}
                      className={cn(
                        "flex items-center space-x-2 px-5 py-2 rounded-lg shadow-lg transition-all active:scale-95 cursor-pointer font-bold",
                        isListening ? "bg-red-500 text-white animate-pulse" : "bg-electric-blue text-black hover:brightness-110"
                      )}
                    >
                      <Mic size={14} />
                      <span className="text-[10px] uppercase tracking-widest">Hold to Speak</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PERSISTENT VISIBLE FLOATING ASSISTANT TRIGGER ── */}
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="fixed bottom-5 right-5 z-[80] flex items-center select-none"
        >
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-electric-blue/30 bg-[#0B0F17]/95 hover:bg-[#101622] hover:border-electric-blue/70 text-white shadow-[0_8px_25px_rgba(0,0,0,0.6),0_0_20px_rgba(0,112,243,0.2)] backdrop-blur-md transition-all duration-200 cursor-pointer"
            title="Open Sentinel AI Assistant (Ctrl+Shift+S)"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-electric-blue opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-electric-blue"></span>
            </span>
            <div className="w-5 h-5 rounded-full bg-electric-blue/20 flex items-center justify-center text-electric-blue group-hover:scale-110 transition-transform">
              <Sparkles size={12} className="animate-pulse" />
            </div>
            <span className="text-[11px] font-bold tracking-wider uppercase font-mono text-slate-200 group-hover:text-white">
              Sentinel AI
            </span>
            <kbd className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-400 border border-white/10">
              Ctrl+Shift+S
            </kbd>
          </button>
        </motion.div>
      )}

      <style jsx global>{`
        @keyframes waveform {
          0% { height: 12px; }
          50% { height: 40px; }
          100% { height: 12px; }
        }
      `}</style>
    </>
  );
}
