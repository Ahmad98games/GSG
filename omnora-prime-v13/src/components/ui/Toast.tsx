"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react';
import { useToastStore, Toast as ToastType } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col space-y-3 pointer-events-none w-full max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem 
            key={toast.id} 
            toast={toast} 
            onClose={() => removeToast(toast.id)} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface ToastItemProps {
  toast: ToastType;
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={18} />,
    error: <AlertCircle className="text-red-500" size={18} />,
    warning: <AlertTriangle className="text-amber-500" size={18} />,
    info: <Info className="text-blue-500" size={18} />,
  };

  const borderColors = {
    success: "border-l-emerald-500",
    error: "border-l-red-500",
    warning: "border-l-amber-500",
    info: "border-l-blue-500",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className={cn(
        "pointer-events-auto bg-[#1A1D21] border border-white/10 border-l-4 p-4 shadow-2xl flex items-start space-x-3",
        borderColors[toast.type]
      )}
    >
      <div className="mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-white leading-tight">{toast.title}</h4>
        {toast.message && (
          <p className="mt-1 text-xs text-gray-400 line-clamp-2">{toast.message}</p>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-2 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button 
        onClick={onClose}
        className="p-1 text-gray-500 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
};
