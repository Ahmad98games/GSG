"use client";

import React from "react";
import { 
  X, Download, MessageSquare, 
  CheckCircle2, Printer, Users, 
  Banknote, History 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePersona } from "@/hooks/usePersona";
import { Decimal } from "decimal.js";

interface PaySlipModalProps {
  slip: any;
  periodLabel: string;
  onClose: () => void;
}

export default function PaySlipModal({ slip, periodLabel, onClose }: PaySlipModalProps) {
  const { t, fmt } = usePersona();

  const handleWhatsAppSend = () => {
    if (!slip.karigars?.whatsapp_number) return alert(t('payroll.no_whatsapp'));
    
    const message = `Assalam o Alaikum ${slip.karigars.name},\n\n` +
      `Aapki ${periodLabel} ki takhwah tayyar hai.\n\n` +
      `Total Kaam: ${slip.total_units} Units\n` +
      `Kul Kamai: ${fmt(new Decimal(slip.gross_earning || 0))}\n` +
      `Katautiyan: ${fmt(new Decimal(slip.total_deductions || 0))}\n` +
      `Net Takhwah: ${fmt(new Decimal(slip.net_payable || 0))}\n\n` +
      `Noxis`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${slip.karigars.whatsapp_number}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-onyx/90 backdrop-blur-md" />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 250, damping: 30 }}
        className="relative bg-surface border border-white/10 w-full max-w-2xl p-0 shadow-2xl overflow-hidden rounded-none"
      >
        <div className="bg-onyx p-8 border-b border-white/5 flex justify-between items-center">
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-electric-blue/10 text-electric-blue">
                 <History size={20} />
              </div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">{t('payroll.salary_statement')}</h2>
           </div>
           <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <X size={24} />
           </button>
        </div>

        <div className="p-8 space-y-10 max-h-[80vh] overflow-y-auto">
           {/* Worker Header */}
            <div className="flex justify-between items-start">
               <div className="space-y-1">
                  <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">{t('payroll.recipient_artisan')}</span>
                  <h3 className="text-2xl font-bold text-white uppercase">{slip.karigars?.name}</h3>
                  <p className="text-xs font-mono text-electric-blue uppercase">{slip.karigars?.karigar_code} • {slip.karigars?.skill_type}</p>
               </div>
               <div className="text-right space-y-1">
                  <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">{t('payroll.period_label')}</span>
                  <p className="text-lg font-bold text-white uppercase">{periodLabel}</p>
               </div>
            </div>

           {/* Earnings vs Deductions */}
            <div className="grid grid-cols-2 gap-12">
               <div className="space-y-4">
                  <h4 className="text-[10px] uppercase text-gray-400 font-bold tracking-[0.2em] border-b border-white/10 pb-2">{t('payroll.earnings')}</h4>
                  <div className="space-y-3">
                     <SlipLine label={t('payroll.piece_rate')} value={slip.piece_rate_earning} />
                     <SlipLine label={t('payroll.daily_wage')} value={slip.daily_wage_earning} />
                     <SlipLine label={t('payroll.monthly_base')} value={slip.monthly_base} />
                     <SlipLine label={t('payroll.overtime')} value={slip.overtime_earning} />
                     <div className="pt-2 border-t border-white/5">
                        <SlipLine label={t('payroll.total_gross')} value={slip.gross_earning} bold />
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] uppercase text-critical-red font-bold tracking-[0.2em] border-b border-critical-red/20 pb-2">{t('payroll.deductions')}</h4>
                  <div className="space-y-3">
                     <SlipLine label={t('payroll.advance_settled')} value={slip.advance_deduction} />
                     <SlipLine label={t('payroll.eobi')} value={slip.eobi_deduction} />
                     <SlipLine label={t('payroll.sessi')} value={slip.sessi_deduction} />
                     <SlipLine label={t('payroll.other_adj')} value={slip.other_deductions} />
                     <div className="pt-2 border-t border-white/5">
                        <SlipLine label={t('payroll.total_deductions')} value={slip.total_deductions} bold />
                     </div>
                  </div>
               </div>
            </div>

           {/* Net Payable */}
            <div className="bg-onyx border border-white/5 p-8 flex justify-between items-center relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                  <Banknote size={80} className="-rotate-12" />
               </div>
               <div>
                  <span className="text-[10px] uppercase text-gray-500 font-bold tracking-[0.3em]">{t('payroll.net_disbursable')}</span>
                  <div className="text-5xl font-bold text-sandstone-gold font-mono tracking-tighter mt-1">
                     {slip.net_payable != null ? fmt(new Decimal(slip.net_payable)) : '—'}
                  </div>
               </div>
               <div className="text-right">
                  <CheckCircle2 size={32} className="text-electric-blue/50" />
               </div>
            </div>

           {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-6 py-4 border-y border-white/5">
               <StatItem label={t('payroll.days_present')} value={slip.days_present} />
               <StatItem label={t('payroll.total_output')} value={`${slip.total_units} ${t('payroll.units')}`} />
               <StatItem label={t('payroll.efficiency')} value={slip.efficiency_pct ? `${slip.efficiency_pct}%` : "—"} />
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-onyx border-t border-white/5 grid grid-cols-2 gap-4">
           <button className="flex items-center justify-center space-x-2 py-3 bg-white/5 border border-white/10 text-[10px] uppercase font-bold tracking-widest hover:bg-white/10 transition-colors rounded-none">
              <Download size={14} />
              <span>{t('payroll.export_pdf')}</span>
           </button>
           <button 
            onClick={handleWhatsAppSend}
            className="flex items-center justify-center space-x-2 py-3 bg-electric-blue text-onyx text-[10px] uppercase font-bold tracking-widest hover:bg-blue-400 transition-colors rounded-none"
           >
              <MessageSquare size={14} />
              <span>{t('payroll.send_whatsapp')}</span>
           </button>
        </div>
      </motion.div>
    </div>
  );
}

function SlipLine({ label, value, bold = false }: { label: string; value: number | string; bold?: boolean }) {
  const { fmt } = usePersona();
  return (
    <div className="flex justify-between items-center">
       <span className={cn("text-[10px] uppercase tracking-wider", bold ? "text-white font-bold" : "text-gray-500")}>{label}</span>
       <span className={cn("font-mono text-xs", bold ? "text-white font-bold" : "text-gray-400")}>
          {value != null ? fmt(new Decimal(value)) : '—'}
       </span>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
       <span className="text-[9px] uppercase text-gray-600 font-bold block mb-1">{label}</span>
       <span className="text-sm font-bold text-white font-mono">{value}</span>
    </div>
  );
}

function cn(...inputs: (string | boolean | undefined | null)[]) {
  return inputs.filter(Boolean).join(" ");
}

