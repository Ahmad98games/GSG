"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ShieldCheck, FileText, Cpu, Sparkles } from "lucide-react";
import { DocumentConverter } from "./DocumentConverter";

const PrivacyBadge = () => (
  <div className="flex items-center space-x-1.5 px-3 py-1 bg-[#08EBF6]/10 border border-[#08EBF6]/30 rounded-full shadow-[0_0_12px_rgba(8,235,246,0.2)]">
    <Lock size={12} className="text-[#08EBF6]" />
    <span className="text-[10px] font-black text-[#08EBF6] uppercase tracking-widest">
      100% Local-Only Execution
    </span>
  </div>
);

export default function FileMorphPage() {
  const [activeSection, setActiveSection] = useState<'suite' | 'info'>('suite');

  const SECTIONS = [
    { id: 'suite' as const, label: 'Document & Image Suite', icon: <FileText size={15} /> },
    { id: 'info' as const, label: 'Engine Architecture & Privacy', icon: <Cpu size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 p-6 md:p-10 font-sans selection:bg-[#08EBF6] selection:text-black">
      <main className="max-w-[1600px] mx-auto space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-black tracking-tight text-white uppercase">File Morph Studio</h1>
              <PrivacyBadge />
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Enterprise Document Processing & Image Manipulation Suite — 100% Local Browser Engine without Cloud APIs or Internet Dependency.
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
          {activeSection === 'suite' ? (
            <motion.div
              key="suite"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <DocumentConverter />
            </motion.div>
          ) : (
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
                  Zero-Cloud Security & Privacy Guarantee
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                  Noxis Hub processes all PDF files, Word documents, and high-resolution images directly inside your workstation's local JS/WebAssembly memory sandbox. No file buffers or metadata are ever transmitted across external cloud servers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="p-5 bg-black/40 border border-white/10 rounded-xl space-y-2">
                  <span className="text-xs font-black text-[#08EBF6] uppercase tracking-wider">🔒 PDF Security Engine</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    AES-128 / 256-bit encryption with User & Owner passwords, granular permission flags (printing, copying, modifying), and instant password decryption.
                  </p>
                </div>
                <div className="p-5 bg-black/40 border border-white/10 rounded-xl space-y-2">
                  <span className="text-xs font-black text-[#5FA5FA] uppercase tracking-wider">🛠️ PDF Manipulation Engine</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Merge, split page ranges ("1-3, 5, 8-10"), rotate pages (90°, 180°, 270°), compress object streams up to 80%, and blackout sensitive text coordinates.
                  </p>
                </div>
                <div className="p-5 bg-black/40 border border-white/10 rounded-xl space-y-2">
                  <span className="text-xs font-black text-[#FFFFFF] uppercase tracking-wider">🖼️ Local Image & EXIF Engine</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Pixel & percentage aspect-ratio scaling, format conversion (PNG, JPG, WebP, BMP, ICO), edge-detection background removal, and EXIF metadata stripping.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
