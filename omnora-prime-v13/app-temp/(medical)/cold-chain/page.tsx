// src/app/(medical)/cold-chain/page.tsx
"use client";

import React, { useState } from "react";
import { useColdChainLatest, useLogTemperature } from "@/hooks/useColdChainQueries";
import { usePersona } from "@/hooks/usePersona";
import { useSidebarState } from "@/hooks/useSidebarState";

import { cn } from "@/lib/utils";
import { 
  Thermometer, AlertCircle, Clock, 
  Plus, History, RefreshCcw 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ColdChainPage() {
  const { t, fmtDate } = usePersona();
  const { isCollapsed } = useSidebarState();
  const { data: logs, isLoading, refetch } = useColdChainLatest();
  const logMutation = useLogTemperature();

  const [isModalOpen, setIsModalOpen] =  useState (false);
  const [newLog, setNewLog] =  useState ({ location: "", temp: "" });

  

  return (
    <div className="min-h-screen bg-onyx text-slate-200">
      
      <main className={cn( "transition-all duration-300")}>
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-surface/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
            <span>NOXIS Medical</span>
            <span className="mx-3 opacity-30">/</span>
            <span className="text-electric-blue">Safety</span>
            <span className="mx-3 opacity-30">/</span>
            <span className="text-white">Cold Chain Monitor</span>
          </div>
          
          <div className="ml-auto flex items-center space-x-3">
             <button 
              onClick={() => refetch()}
              className="p-2 hover:bg-white/5 text-gray-400 transition-colors"
            >
              <RefreshCcw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-1.5 bg-electric-blue text-onyx text-[10px] uppercase tracking-widest font-bold hover:bg-blue-400 transition-colors"
            >
              <Plus size={12} />
              <span>Log Temperature</span>
            </button>
          </div>
        </header>

        <div className="p-8 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {logs?.map((log: any) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={log.location_label}
                  className={cn(
                    "bg-surface border p-6 relative overflow-hidden group transition-all duration-500",
                    log.breach ? "border-critical-red shadow-[0_0_20px_rgba(239,68,68,0.1)]" : "border-white/5"
                  )}
                >
                  {log.breach && (
                    <motion.div 
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-critical-red/5 pointer-events-none" 
                    />
                  )}
                  
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1">Location</h3>
                      <p className="text-white font-medium">{log.location_label}</p>
                    </div>
                    <div className={cn(
                      "p-2 bg-white/5 rounded-full",
                      log.breach ? "text-critical-red" : "text-emerald"
                    )}>
                      {log.breach ? <AlertCircle size={20} /> : <Thermometer size={20} />}
                    </div>
                  </div>

                  <div className="flex items-baseline space-x-2 mb-6">
                    <span className={cn(
                      "text-4xl font-mono font-bold tracking-tighter",
                      log.breach ? "text-critical-red" : "text-white"
                    )}>
                      {Number(log.temp_celsius).toFixed(1)}
                    </span>
                    <span className="text-gray-500 font-mono text-lg">°C</span>
                  </div>

                  <div className="flex items-center space-x-4 text-[9px] uppercase tracking-widest text-gray-500 border-t border-white/5 pt-4">
                    <div className="flex items-center space-x-1">
                      <Clock size={10} />
                      <span>{new Date(log.recorded_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <History size={10} />
                      <span>{fmtDate(log.recorded_at)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-onyx/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-white/10 w-full max-w-md p-8"
            >
              <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-widest">Log Manual Reading</h2>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Storage Location</label>
                  <input 
                    type="text" 
                    className="w-full bg-onyx border border-white/5 px-4 py-2 text-sm text-white focus:border-electric-blue outline-none"
                    placeholder="e.g. Chiller A, Freezer 2"
                    value={newLog.location}
                    onChange={(e) => setNewLog({ ...newLog, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Temperature (°C)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="w-full bg-onyx border border-white/5 px-4 py-2 text-sm text-white focus:border-electric-blue outline-none font-mono"
                    placeholder="4.5"
                    value={newLog.temp}
                    onChange={(e) => setNewLog({ ...newLog, temp: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-white/10 text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    logMutation.mutate({ location: newLog.location, temp: parseFloat(newLog.temp) });
                    setIsModalOpen(false);
                    setNewLog({ location: "", temp: "" });
                  }}
                  disabled={!newLog.location || !newLog.temp}
                  className="flex-1 py-3 bg-electric-blue text-onyx text-[10px] uppercase tracking-widest font-bold hover:bg-blue-400 transition-colors disabled:opacity-50"
                >
                  Submit Log
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}

