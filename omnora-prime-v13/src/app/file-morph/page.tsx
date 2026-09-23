"use client";

import React, { useState } from "react";
import { Lock, ShieldCheck, FileText, Cpu, Database } from "lucide-react";
import { DocumentConverter } from "./DocumentConverter";
import { DataMigrationStudio } from "./DataMigrationStudio";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

const PrivacyBadge = () => (
  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/[0.03] border border-white/[0.08] rounded-[4px]">
    <Lock size={12} strokeWidth={1.5} className="text-slate-400" />
    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
      Local Execution
    </span>
  </div>
);

export default function FileMorphPage() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<'migration' | 'suite' | 'info'>('migration');

  const SECTIONS = [
    { id: 'migration' as const, label: t('Data Migration & Importer'), icon: <Database size={14} strokeWidth={1.5} /> },
    { id: 'suite' as const, label: t('Document & Image Suite'), icon: <FileText size={14} strokeWidth={1.5} /> },
    { id: 'info' as const, label: t('Engine Architecture & Privacy'), icon: <Cpu size={14} strokeWidth={1.5} /> },
  ];

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-300 p-6 md:p-8 font-sans selection:bg-white/10 selection:text-white">
      <main className="max-w-[1600px] mx-auto space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-semibold tracking-tight text-white">{t('File Morph & Data Studio')}</h1>
              <PrivacyBadge />
            </div>
            <p className="text-xs text-slate-400 font-normal">
              Enterprise data migration (Tally, QuickBooks, Excel) and document suite processed 100% locally in-browser without external cloud dependency.
            </p>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-2 border-b border-white/[0.08] pb-0">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors duration-100 -mb-px cursor-pointer',
                activeSection === s.id
                  ? 'border-white text-white bg-white/[0.03]'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              )}
            >
              <span className={activeSection === s.id ? 'text-slate-200' : 'text-slate-500'}>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Section View switcher */}
        <div>
          {activeSection === 'migration' && <DataMigrationStudio />}
          {activeSection === 'suite' && <DocumentConverter />}
          {activeSection === 'info' && (
            <div className="bg-[#131823] border border-white/[0.08] rounded-[6px] p-6 space-y-4">
              <div className="space-y-1.5">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <ShieldCheck size={16} strokeWidth={1.5} className="text-slate-400" />
                  {t('Zero-Cloud Security & Privacy Guarantee')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-3xl font-normal">
                  Noxis Hub processes all Tally ledger imports, Excel price list mappings, and PDF files directly inside your workstation's local memory sandbox. No data ever leaves your device or touches an external server.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
