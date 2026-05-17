// src/components/production/HandoverCard.tsx
"use client";

import React from "react";
import { format } from "date-fns";
import { 
  Clock, User, CheckCircle2, AlertTriangle, 
  ArrowRight, Activity 
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Handover {
  id: string;
  shift_date: string;
  shift_type: 'morning' | 'evening' | 'night';
  supervisor_name: string;
  total_units_produced: number;
  machines_down: string | null;
  materials_shortage: string | null;
  next_shift_instructions: string | null;
  status: 'submitted' | 'acknowledged';
  acknowledged_by_name?: string;
  acknowledged_at?: string;
}

interface HandoverCardProps {
  handover: Handover;
  onAcknowledge?: (id: string) => void;
  isAcknowledging?: boolean;
}

export default function HandoverCard({ handover, onAcknowledge, isAcknowledging }: HandoverCardProps) {
  const hasIssues = handover.machines_down || handover.materials_shortage;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1A1D21] border border-white/5 p-6 space-y-6 group hover:border-white/10 transition-all shadow-xl relative overflow-hidden"
    >
      {/* Shift Badge & Date */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
             <ShiftBadge type={handover.shift_type} />
             <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
               {format(new Date(handover.shift_date), 'dd MMM yyyy')}
             </span>
          </div>
          <div className="flex items-center space-x-2 pt-1 text-gray-400">
             <User size={12} className="text-[#C5A059]" />
             <span className="text-[10px] font-black uppercase tracking-widest">{handover.supervisor_name}</span>
          </div>
        </div>

        {handover.status === 'acknowledged' ? (
          <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
             <CheckCircle2 size={10} className="text-emerald-500" />
             <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest">
               Acknowledged
             </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
             <Clock size={10} className="text-amber-500" />
             <span className="text-[8px] font-black uppercase text-amber-500 tracking-widest">
               Pending Review
             </span>
          </div>
        )}
      </div>

      {/* Main Stats */}
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
         <div className="space-y-1">
            <span className="text-[8px] uppercase font-black text-gray-600 tracking-widest">Units Produced</span>
            <div className="text-3xl font-black font-mono text-[#C5A059] tracking-tighter">
              {handover.total_units_produced.toLocaleString()}
            </div>
         </div>
         <div className="flex flex-col items-end opacity-40">
            <Activity size={32} />
         </div>
      </div>

      {/* Issues Section */}
      {hasIssues && (
        <div className="bg-amber-500/5 border border-amber-500/10 p-4 space-y-3">
           <div className="flex items-center space-x-2 text-amber-500">
              <AlertTriangle size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Incident Report</span>
           </div>
           <div className="space-y-2">
              {handover.machines_down && (
                <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                  <span className="text-amber-500/70 mr-1 uppercase font-black tracking-tighter">Down:</span>
                  {handover.machines_down}
                </p>
              )}
              {handover.materials_shortage && (
                <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                  <span className="text-amber-500/70 mr-1 uppercase font-black tracking-tighter">Shortage:</span>
                  {handover.materials_shortage}
                </p>
              )}
           </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-[#0070F3]/5 border border-[#0070F3]/20 p-4 space-y-3">
         <div className="flex items-center space-x-2 text-[#0070F3]">
            <ArrowRight size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Next Shift Instructions</span>
         </div>
         <p className="text-[10px] text-slate-200 leading-relaxed font-medium italic">
           {handover.next_shift_instructions || 'No specific instructions provided for the next shift.'}
         </p>
      </div>

      {/* Acknowledge Action */}
      {handover.status === 'submitted' && onAcknowledge && (
        <button 
          onClick={() => onAcknowledge(handover.id)}
          disabled={isAcknowledging}
          className="w-full py-3 bg-white/5 border border-white/5 text-[9px] uppercase font-black text-gray-500 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all flex items-center justify-center space-x-2"
        >
          {isAcknowledging ? (
            <div className="w-3 h-3 border-2 border-white/20 border-t-white animate-spin rounded-full" />
          ) : (
            <>
              <CheckCircle2 size={12} />
              <span>Acknowledge Handover</span>
            </>
          )}
        </button>
      )}

      {handover.status === 'acknowledged' && handover.acknowledged_at && (
        <div className="pt-2 flex items-center justify-center space-x-2 text-[8px] font-black uppercase text-gray-600 tracking-widest">
           <span>Verified {format(new Date(handover.acknowledged_at), 'HH:mm')}</span>
        </div>
      )}
    </motion.div>
  );
}

function ShiftBadge({ type }: { type: 'morning' | 'evening' | 'night' }) {
  const configs = {
    morning: { label: 'Morning', color: 'bg-emerald-500', icon: '06:00-14:00' },
    evening: { label: 'Evening', color: 'bg-blue-500', icon: '14:00-22:00' },
    night: { label: 'Night', color: 'bg-indigo-500', icon: '22:00-06:00' }
  };

  const config = configs[type];

  return (
    <div className="flex items-center space-x-2">
       <div className={cn("w-1.5 h-1.5 rounded-full", config.color)} />
       <span className="text-[9px] font-black uppercase text-white tracking-widest">{config.label}</span>
    </div>
  );
}
