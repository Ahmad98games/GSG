"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ShieldCheck, FileText, Cpu, Database } from "lucide-react";
import { DocumentConverter } from "./DocumentConverter";
import { DataMigrationStudio } from "./DataMigrationStudio";
import { useTranslation } from "@/hooks/useTranslation";

const PrivacyBadge = () => (
  <div className="flex items-center space-x-1.5 px-3 py-1 bg-[#08EBF6]/10 border border-[#08EBF6]/30 rounded-full shadow-[0_0_12px_rgba(8,235,246,0.2)]">
    <Lock size={12} className="text-[#08EBF6]" />
    <span className="text-[10px] font-black text-[#08EBF6] uppercase tracking-widest">
      100% Local-Only Execution
    </span>
  </div>
);

export default function FileMorphPage() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<'migration' | 'suite' | 'info'>('migration');

  const SECTIONS = [
    { id: 'migration' as const, label: t('Data Migration & Importer'), icon: <Database size={15} /> },
    { id: 'suite' as const, label: t('Document & Image Suite'), icon: <FileText size={15} /> },
    { id: 'info' as const, label: t('Engine Architecture & Privacy'), icon: <Cpu size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 p-6 md:p-10 font-sans selection:bg-[#08EBF6] selection:text-black">
      <main className="max-w-[1600px] mx-auto space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-black tracking-tight text-white uppercase">{t('File Morph & Data Studio')}</h1>
              <PrivacyBadge />
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Enterprise Data Migration (Tally, QuickBooks, Excel) & Document Suite — 100% Local Browser Engine without Cloud Dependency.
            </p>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-3 border-b border-white/10 pb-0">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all -mb-px cursor-pointer ${
                activeSection === s.id
                  ? 'border-[#08EBF6] text-[#08EBF6] shadow-[0_4px_20px_rgba(8,235,246,0.3)]'
                  : 'border-transparent text-slate-500 hover:text-slate-200'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Section View switcher */}
        <AnimatePresence mode="wait">
          {activeSection === 'migration' && (
            <motion.div
              key="migration"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <DataMigrationStudio />
            </motion.div>
          )}

          {activeSection === 'suite' && (
            <motion.div
              key="suite"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <DocumentConverter />
            </motion.div>
          )}

          {activeSection === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0B0F17] border border-white/10 rounded-2xl p-8 space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <ShieldCheck size={20} className="text-[#08EBF6]" />
                  {t('Zero-Cloud Security & Privacy Guarantee')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                  Noxis Hub processes all Tally ledger imports, Excel price list mappings, and PDF files directly inside your workstation's local memory sandbox.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
