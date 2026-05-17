// src/components/ui/IndustrialEmptyState.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Database, Plus, ArrowRight, 
  BarChart2, FileText, Activity 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IndustrialEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: "report" | "data" | "audit";
  className?: string;
}

export default function IndustrialEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon = "data",
  className
}: IndustrialEmptyStateProps) {
  
  const icons = {
    report: <BarChart2 size={48} className="text-sandstone-gold" />,
    data: <Database size={48} className="text-electric-blue" />,
    audit: <FileText size={48} className="text-emerald" />
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center py-24 px-8 text-center space-y-8",
        "bg-surface/30 border border-white/5 rounded-sm relative overflow-hidden",
        className
      )}
    >
      {/* Background Decorative Element */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03]">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative">
        <div className="p-6 bg-white/5 rounded-full border border-white/10 relative z-10">
          {icons[icon]}
        </div>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-0 bg-electric-blue/20 blur-3xl rounded-full"
        />
      </div>

      <div className="space-y-3 max-w-md relative z-10">
        <h3 className="text-xl font-bold text-white uppercase tracking-[0.2em]">{title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed uppercase tracking-wider">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="group flex items-center space-x-3 px-8 py-3 bg-white text-onyx text-[10px] uppercase tracking-[0.3em] font-black hover:bg-electric-blue hover:text-white transition-all duration-500"
        >
          <Plus size={16} />
          <span>{actionLabel}</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      )}

      <div className="flex items-center space-x-6 pt-4 opacity-20 relative z-10">
        <Activity size={16} className="text-gray-500" />
        <div className="h-px w-12 bg-gray-700" />
        <span className="text-[8px] uppercase tracking-widest font-bold text-gray-600">NOXIS Intelligence Hub</span>
        <div className="h-px w-12 bg-gray-700" />
      </div>
    </motion.div>
  );
}

