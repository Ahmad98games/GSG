"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionActions } from '@/hooks/useSessionActions';
import { formatDistanceToNow } from 'date-fns';
import { 
  X, History, RotateCcw, CheckCircle2, 
  Clock, AlertTriangle, Package, Users, 
  CreditCard, TrendingUp, FileText, Zap 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

export default function ActionTrail() {
  const [isOpen, setIsOpen] = useState(false);
  const { actions, undoAction } = useSessionActions();
  const { success, error: toastError } = useToast();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const handleUndo = async (id: string) => {
    try {
      await undoAction(id);
      success('ACTION UNDONE SUCCESSFULLY');
    } catch (err: any) {
      toastError(err.message || 'UNDO FAILED');
    }
  };

  const icons = {
    production: Package,
    attendance: Users,
    payment: CreditCard,
    stock: TrendingUp,
    advance: Zap,
    invoice: FileText,
    other: History
  };

  return (
    <>
      {/* Header Toggle Icon (Add to your Header component externally if needed, or here) */}
      <div 
        className="fixed top-4 right-20 z-[60] cursor-pointer text-gray-500 hover:text-white transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <History size={20} />
      </div>

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
              className="fixed right-0 top-0 h-screen w-80 bg-[#1A1D21] border-l border-white/5 shadow-2xl z-[101] flex flex-col"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Action Trail</h3>
                  <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Last 20 session events</p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {actions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
                    <History size={48} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">No actions yet</span>
                  </div>
                ) : (
                  actions.map((action) => {
                    const Icon = icons[action.type] || icons.other;
                    const diffMinutes = (new Date().getTime() - action.timestamp.getTime()) / 1000 / 60;
                    const isUndoable = action.undoable && diffMinutes <= 5;

                    return (
                      <div 
                        key={action.id}
                        className="group bg-white/5 border border-white/5 p-4 rounded-sm hover:border-white/10 transition-all"
                      >
                        <div className="flex items-start space-x-3">
                          <div className={cn(
                            "p-2 rounded-sm",
                            action.type === 'invoice' ? "bg-blue-500/10 text-blue-500" :
                            action.type === 'production' ? "bg-emerald-500/10 text-emerald-500" :
                            "bg-white/5 text-gray-500"
                          )}>
                            <Icon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-white font-bold leading-tight uppercase line-clamp-2">
                              {action.description}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">
                                {formatDistanceToNow(action.timestamp, { addSuffix: true })}
                              </span>
                              <div className="flex items-center space-x-2">
                                {action.synced ? (
                                  <div className="flex items-center space-x-1 text-emerald-500 text-[8px] font-black uppercase">
                                    <CheckCircle2 size={10} />
                                    <span>Synced</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1 text-amber-500 text-[8px] font-black uppercase">
                                    <Clock size={10} />
                                    <span>Pending</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {isUndoable ? (
                              <button 
                                onClick={() => handleUndo(action.id)}
                                className="mt-3 w-full py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-[8px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 text-gray-400 hover:text-white transition-all"
                              >
                                <RotateCcw size={10} />
                                <span>Undo Action</span>
                              </button>
                            ) : action.type === 'invoice' ? (
                              <div className="mt-3 p-2 bg-red-500/5 border border-red-500/10 rounded-sm">
                                <p className="text-[8px] text-red-400 font-bold leading-tight uppercase">
                                  Posted entries cannot be undone. Create a reversal entry instead.
                                </p>
                                <button className="mt-1 text-[8px] text-emerald-500 font-black uppercase underline decoration-emerald-500/30 hover:decoration-emerald-500">
                                  Create Reversal
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
        }
      `}</style>
    </>
  );
}
