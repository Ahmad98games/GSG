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
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCommand = async (text: string) => {
    if (!text.trim()) return;
    
    // 1. Try Command Engine first (Navigation/Actions)
    const cmd = parseCommand(text);
    if (cmd) {
      setResponse(`Executing: ${cmd.intent.replace(/_/g, ' ')}...`);
      setIsError(false);
      
      setTimeout(() => {
        cmd.action(router as any, cmd.entities);
        setIsOpen(false);
        setResponse(null);
        setCommandText("");
      }, 800);
      return;
    } 

    // 2. Try Knowledge Base (Answering Questions)
    setResponse("Analyzing internal data...");
    setIsError(false);
    
    try {
      const chatRes = await processChatQuery(text, []);
      if (chatRes.content === "I don't know about that.") {
        setResponse("I can help you with:");
        setSuggestedChips([
          "Show inventory",
          "Create new invoice",
          "Log production",
          "Check cash flow",
          "Mark attendance",
          "Generate payslip"
        ]);
      } else {
        setResponse(chatRes.content);
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
          <div className="fixed inset-0 z-[100] flex items-end justify-center pb-20 pointer-events-none">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto"
            />

            {/* Assistant Panel */}
            <motion.div 
              initial={{ y: 100, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-[600px] glass-panel border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-electric-blue rounded-sm flex items-center justify-center">
                    <Sparkles size={12} className="text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Sentinel Assistant</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              {/* Main Content */}
              <div className="p-8 space-y-8 flex flex-col items-center">
                {/* Visual Feedback / Waveform */}
                <div className="h-16 flex items-center justify-center space-x-1.5">
                  {isListening ? (
                    [...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [12, 40, 12] }}
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
                    <div className="flex items-center space-x-1 opacity-20">
                      {[...Array(5)].map((_, i) => <div key={i} className="w-1.5 h-3 bg-gray-500 rounded-full" />)}
                    </div>
                  )}
                </div>

                {/* Response Section */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  <AnimatePresence mode="wait">
                    {response && (
                      <motion.div
                        key="response"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                          "p-4 rounded border text-xs leading-relaxed",
                          isError ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-white/5 border-white/10 text-white"
                        )}
                      >
                        {response}

                        {suggestedChips.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {suggestedChips.map((chip, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setCommandText(chip);
                                  handleCommand(chip);
                                }}
                                className="px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-[10px] font-bold uppercase hover:bg-blue-500 hover:border-blue-500 transition-all"
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

                {/* Status / Recognition Text */}
                <div className="min-h-[60px] flex flex-col items-center justify-center text-center px-4">
                  <AnimatePresence mode="wait">
                    {!response ? (
                      isListening ? (
                        <motion.p 
                          key="transcript"
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          className="text-2xl font-black text-white font-mono tracking-tighter italic"
                        >
                          "{transcript || "Listening..."}"
                        </motion.p>
                      ) : (
                        <motion.div 
                          key="placeholder"
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          className="space-y-2"
                        >
                          <p className="text-xl font-bold text-gray-400">Say a command or type below...</p>
                          <div className="flex flex-wrap justify-center gap-2">
                            {["Profit report", "Open inventory", "Check low stock", "New invoice"].map(cmd => (
                              <span key={cmd} className="text-[9px] uppercase font-bold text-gray-600 px-2 py-1 bg-white/5 rounded border border-white/5 hover:border-white/10 transition-colors cursor-pointer" onClick={() => handleCommand(cmd)}>
                                "{cmd}"
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )
                    ) : null}
                  </AnimatePresence>
                </div>

                {/* Input Field */}
                <div className="w-full relative group">
                  <Terminal size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-electric-blue transition-colors" />
                  <input 
                    ref={inputRef}
                    type="text" 
                    value={commandText}
                    onChange={(e) => setCommandText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCommand(commandText)}
                    placeholder="Type command (e.g. 'show cash flow')..."
                    className="w-full bg-[#0F1113] border border-white/10 pl-11 pr-16 py-4 text-sm text-white focus:border-electric-blue/50 outline-none transition-all placeholder:text-gray-700 font-mono"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                    <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[9px] text-gray-600 font-mono">ENTER</kbd>
                  </div>
                </div>

                {/* Control Bar */}
                <div className="w-full flex items-center justify-between pt-4">
                  <div className="flex items-center space-x-2 text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                    <Command size={10} />
                    <span>Control Panel v1.0</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button 
                      onMouseDown={startListening}
                      onMouseUp={stopListening}
                      className={cn(
                        "flex items-center space-x-2 px-6 py-2.5 rounded shadow-lg transition-all active:scale-95",
                        isListening ? "bg-red-500 text-white animate-pulse" : "bg-electric-blue text-onyx hover:brightness-110"
                      )}
                    >
                      <Mic size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Hold to Speak</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
