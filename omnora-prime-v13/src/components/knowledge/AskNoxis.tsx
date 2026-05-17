
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, HelpCircle, ArrowRight, 
  Command, Cpu, Zap, ExternalLink,
  MessageSquare, Send, User, Sparkles,
  RotateCcw
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { KnowledgeEntry } from '@/lib/knowledge/noxis-docs';
import { searchKnowledge, getContextualHelp } from '@/lib/knowledge/knowledgeSearch';
import { processChatQuery, ChatMessage } from '@/lib/knowledge/noxis-chat';
import { cn } from '@/lib/utils';

export default function AskNoxis() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string, results?: KnowledgeEntry[], isContext?: boolean }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  // Listen for Ctrl+/
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  // Handle Initial Contextual Help
  useEffect(() => {
    if (isOpen && chatHistory.length === 0) {
      const contextualHelp = getContextualHelp(pathname);
      if (contextualHelp.length > 0) {
        setChatHistory([{
          role: 'assistant',
          content: "On this page you can:",
          results: contextualHelp,
          isContext: true
        }]);
      } else {
        setChatHistory([{
          role: 'assistant',
          content: "Hello! I am Noxis AI. I can help you manage your factory. What would you like to do today?",
        }]);
      }
    }
  }, [isOpen, pathname]);

  const handleSearch = (text: string = query) => {
    if (!text.trim()) return;

    const userMsg = { role: 'user' as const, content: text };
    setChatHistory(prev => [...prev, userMsg]);
    setQuery("");
    setIsTyping(true);

    setTimeout(() => {
      const results = searchKnowledge(text);
      
      let assistantMsg;
      if (results.length > 0) {
        assistantMsg = {
          role: 'assistant' as const,
          content: `I found ${results.length} relevant topics for "${text}":`,
          results
        };
      } else {
        assistantMsg = {
          role: 'assistant' as const,
          content: `I couldn't find a direct answer for "${text}". I can help you with these core topics:`,
          results: [] // Empty results will trigger chips in UI
        };
      }

      setChatHistory(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 600);
  };

  const navigateTo = (route: string) => {
    router.push(route);
    setIsOpen(false);
  };

  const CATEGORY_CHIPS = [
    'Payroll', 'Inventory', 'Invoices', 'Karigars',
    'Reports', 'Cashflow', 'CCTV', 'Lens',
    'Purchase', 'Settings', 'WhatsApp', 'Generators'
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />

            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[420px] bg-[#0F1115] border-l border-noxis-border z-[101] shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-noxis-border flex items-center justify-between bg-noxis-bg/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-noxis-accent/10 border border-noxis-accent/20 rounded-lg flex items-center justify-center">
                    <Cpu className="text-noxis-accent animate-pulse" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-noxis-text uppercase tracking-tighter flex items-center gap-2">
                      Ask Noxis
                      <span className="px-1.5 py-0.5 bg-noxis-success/10 text-noxis-success text-[8px] font-black rounded-full border border-noxis-success/20">
                        ONLINE
                      </span>
                    </h2>
                    <p className="text-[10px] text-noxis-text-muted font-bold uppercase tracking-widest">Industrial Assistant</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-noxis-text-muted hover:text-noxis-text hover:bg-noxis-overlay rounded-sm transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-noxis-overlay relative">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={cn(
                    "flex flex-col gap-2 max-w-[90%]",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}>
                    <div className={cn(
                      "flex items-center gap-2 text-[8px] font-black uppercase tracking-widest",
                      msg.role === 'user' ? "text-noxis-text-muted" : "text-noxis-accent"
                    )}>
                      {msg.role === 'user' ? 'You' : 'Noxis AI'}
                    </div>
                    
                    <div className={cn(
                      "p-4 text-xs leading-relaxed rounded-2xl border",
                      msg.role === 'user' 
                        ? "bg-noxis-overlay text-noxis-text border-noxis-border rounded-tr-none" 
                        : "bg-noxis-accent/5 text-noxis-text border-noxis-accent/10 rounded-tl-none"
                    )}>
                      <p>{msg.content}</p>
                      
                      {msg.results && msg.results.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {msg.results.map(entry => (
                            <div key={entry.id} className="p-3 bg-noxis-bg border border-noxis-border rounded-lg space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[8px] font-black uppercase text-noxis-accent px-1.5 py-0.5 bg-noxis-accent/10 rounded">
                                  {entry.category}
                                </span>
                                {entry.shortcuts && (
                                  <span className="text-[9px] font-mono text-noxis-text-muted flex items-center gap-1">
                                    <Command size={10} />
                                    {entry.shortcuts[0]}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-noxis-text">{entry.title}</h4>
                              <p className="text-[10px] text-noxis-text-muted italic">{entry.content}</p>
                              {entry.route && (
                                <button 
                                  onClick={() => navigateTo(entry.route!)}
                                  className="w-full py-2 mt-2 bg-noxis-accent text-black text-[9px] font-black uppercase tracking-widest rounded hover:brightness-110 flex items-center justify-center gap-2"
                                >
                                  Go There →
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.role === 'assistant' && msg.results && msg.results.length === 0 && !msg.isContext && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {CATEGORY_CHIPS.map(chip => (
                            <button 
                              key={chip}
                              onClick={() => handleSearch(chip)}
                              className="py-2 px-3 bg-noxis-overlay border border-noxis-border rounded text-[9px] font-bold text-noxis-text-muted hover:text-noxis-accent hover:border-noxis-accent/50 transition-all text-left"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-center gap-2 text-[9px] text-noxis-accent animate-pulse">
                    <Cpu size={12} className="animate-spin" />
                    Searching knowledge...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Footer */}
              <div className="p-6 border-t border-noxis-border bg-noxis-bg">
                <div className="relative group">
                  <input 
                    ref={inputRef}
                    type="text"
                    placeholder="Ask anything about Noxis..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch();
                    }}
                    className="w-full bg-noxis-overlay border border-noxis-border p-4 pr-12 text-sm text-noxis-text placeholder:text-noxis-text-muted outline-none focus:border-noxis-accent transition-all rounded-xl"
                  />
                  <button 
                    onClick={() => handleSearch()}
                    disabled={!query.trim() || isTyping}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-noxis-text-muted hover:text-noxis-accent disabled:opacity-20 transition-all"
                  >
                    <Send size={18} />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between text-[9px] text-noxis-text-muted font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <Command size={10} />
                    <span>Ctrl + / to Toggle</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap size={10} />
                    <span>Instant Response</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function ResultCard({ entry, onClick }: { entry: KnowledgeEntry, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full text-left p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-lg transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-electric-blue opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="px-1.5 py-0.5 bg-electric-blue/10 text-electric-blue text-[8px] font-black uppercase rounded-sm">
            {entry.category}
          </span>
          {entry.shortcuts && (
             <Command size={12} className="text-gray-700 group-hover:text-gray-500" />
          )}
        </div>
        <h4 className="text-sm font-bold text-white group-hover:text-electric-blue transition-colors">
          {entry.title}
        </h4>
        <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed italic">
          {entry.content}
        </p>
        <div className="flex items-center gap-1 text-[9px] text-electric-blue font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
          Learn More
          <ArrowRight size={10} />
        </div>
      </div>
    </button>
  );
}
