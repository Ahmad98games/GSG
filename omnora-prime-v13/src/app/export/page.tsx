"use client";

import React, { useState } from "react";

import { useSidebarState } from "@/hooks/useSidebarState";
import { 
  Send, 
  FileJson, 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  Database, 
  Download, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePersona } from "@/hooks/usePersona";
import { cn } from "@/lib/utils";

const EXPORT_MODULES = [
  { id: 'inventory', name: 'Inventory Registry', icon: Database, description: 'SKU catalogs, stock levels, and bin locations.' },
  { id: 'sales', name: 'Sales Transactions', icon: FileText, description: 'POS receipts, invoices, and tax distributions.' },
  { id: 'ledger', name: 'Financial Ledger', icon: FileSpreadsheet, description: 'Double-entry books, reversals, and audit trails.' },
  { id: 'workforce', name: 'Workforce (Karigars)', icon: FileText, description: 'Production logs, attendance, and advances.' },
];

const FORMATS = [
  { id: 'csv', name: 'CSV', icon: FileText, extension: '.csv' },
  { id: 'json', name: 'JSON', icon: FileJson, extension: '.json' },
  { id: 'xlsx', name: 'Excel', icon: FileSpreadsheet, extension: '.xlsx' },
];

export default function ExportPage() {
  const { isCollapsed } = useSidebarState();
  const { t } = usePersona();

  const [selectedModules, setSelectedModules] = useState<string[]>(['inventory']);
  const [format, setFormat] = useState('csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const toggleModule = (id: string) => {
    setSelectedModules(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    // Mock export delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsExporting(false);
    setExportComplete(true);
    setTimeout(() => setExportComplete(false), 5000);
  };

  

  return (
    <div className="min-h-screen bg-[#121417] text-slate-200 font-inter selection:bg-electric-blue selection:text-onyx">
      
      
      <main className={cn( "transition-all duration-300 pb-20")}>
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center px-12 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
           <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-electric-blue/10 flex items-center justify-center text-electric-blue border border-electric-blue/20">
                 <Send size={20} />
              </div>
              <div>
                 <h1 className="text-xl font-black text-white uppercase tracking-wider">{t('export.title') || "Data Export Center"}</h1>
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Industrial Extraction System v13.0</p>
              </div>
           </div>
        </header>

        <div className="p-12 max-w-6xl mx-auto space-y-12">
          
          {/* Step 1: Select Modules */}
          <section className="space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">1. Select Data Modules</h2>
                <span className="text-[10px] font-bold text-gray-600 uppercase italic">Multiple selection enabled</span>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EXPORT_MODULES.map((mod) => {
                  const isSelected = selectedModules.includes(mod.id);
                  return (
                    <button 
                      key={mod.id}
                      onClick={() => toggleModule(mod.id)}
                      className={cn(
                        "p-6 border transition-all text-left flex items-start space-x-4 group relative overflow-hidden",
                        isSelected 
                          ? "bg-electric-blue/5 border-electric-blue/40" 
                          : "bg-[#1A1D21] border-white/5 hover:border-white/20"
                      )}
                    >
                       <div className={cn(
                         "p-3 transition-colors",
                         isSelected ? "bg-electric-blue text-onyx" : "bg-white/5 text-gray-500 group-hover:text-white"
                       )}>
                          <mod.icon size={20} />
                       </div>
                       <div className="flex-1">
                          <h3 className={cn(
                            "text-xs font-black uppercase tracking-widest",
                            isSelected ? "text-white" : "text-gray-400"
                          )}>{mod.name}</h3>
                          <p className="text-[10px] text-gray-600 mt-1 leading-relaxed">{mod.description}</p>
                       </div>
                       {isSelected && (
                         <div className="absolute top-2 right-2">
                            <CheckCircle2 size={12} className="text-electric-blue" />
                         </div>
                       )}
                    </button>
                  );
                })}
             </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
             {/* Step 2: Date Range */}
             <section className="space-y-6">
                <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">2. Temporal Range</h2>
                <div className="bg-[#1A1D21] border border-white/5 p-8 space-y-6">
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center">
                            <Calendar size={12} className="mr-2" /> Start Date
                         </label>
                         <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-[#121417] border border-white/10 p-4 text-xs text-white focus:border-electric-blue outline-none transition-all uppercase"
                         />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center">
                            <Calendar size={12} className="mr-2" /> End Date
                         </label>
                         <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-[#121417] border border-white/10 p-4 text-xs text-white focus:border-electric-blue outline-none transition-all uppercase"
                         />
                      </div>
                   </div>
                   <p className="text-[9px] text-gray-600 italic leading-relaxed">
                      If left blank, the system will export the entire historical ledger for selected modules.
                   </p>
                </div>
             </section>

             {/* Step 3: Format */}
             <section className="space-y-6">
                <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">3. Output Format</h2>
                <div className="flex gap-4">
                   {FORMATS.map((f) => (
                     <button 
                       key={f.id}
                       onClick={() => setFormat(f.id)}
                       className={cn(
                         "flex-1 p-6 border transition-all flex flex-col items-center space-y-3",
                         format === f.id 
                           ? "bg-sandstone-gold/10 border-sandstone-gold/40 text-sandstone-gold" 
                           : "bg-[#1A1D21] border-white/5 text-gray-500 hover:text-white"
                       )}
                     >
                        <f.icon size={24} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{f.name}</span>
                     </button>
                   ))}
                </div>
             </section>
          </div>

          {/* Final Action */}
          <div className="pt-12 border-t border-white/5 flex flex-col items-center">
             <AnimatePresence mode="wait">
               {exportComplete ? (
                 <motion.div 
                   key="complete"
                   initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                   className="flex items-center space-x-3 text-emerald-500"
                 >
                    <CheckCircle2 size={24} />
                    <span className="text-sm font-black uppercase tracking-[0.2em]">Export Pipeline Initialized Successfully</span>
                 </motion.div>
               ) : (
                 <motion.button
                   key="idle"
                   onClick={handleExport}
                   disabled={selectedModules.length === 0 || isExporting}
                   className="flex items-center space-x-4 px-12 py-6 bg-electric-blue text-onyx text-[11px] font-black uppercase tracking-[0.5em] hover:brightness-110 transition-all disabled:opacity-50"
                 >
                    {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                    <span>Dispatch Export Request</span>
                 </motion.button>
               )}
             </AnimatePresence>
             
             <p className="text-[10px] text-gray-600 mt-6 font-medium uppercase tracking-widest">
               Processing may take several minutes depending on database depth.
             </p>
          </div>
        </div>
      </main>
    </div>
  );
}
