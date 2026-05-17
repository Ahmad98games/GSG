"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Construction } from "lucide-react";

interface ComingSoonPageProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
}

export default function ComingSoonPage({ title, description, icon: Icon = Construction }: ComingSoonPageProps) {
  return (
    <div className="min-h-screen bg-onyx flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="mx-auto w-20 h-20 bg-white/5 border border-white/10 flex items-center justify-center mb-8">
          <Icon size={32} className="text-sandstone-gold" />
        </div>
        
        <h1 className="text-2xl font-bold text-white tracking-tight mb-3">{title}</h1>
        
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold leading-relaxed mb-10">
          {description || "This module is currently under development and will be available in the next system update."}
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-6 text-[9px] uppercase tracking-[0.2em] text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-sandstone-gold rounded-full animate-pulse" />
              <span>In Development</span>
            </div>
            <span className="opacity-30">|</span>
            <span>Noxis v13.1</span>
          </div>

          <Link 
            href="/dashboard"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-white hover:border-white/20 transition-all"
          >
            <ArrowLeft size={12} />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
