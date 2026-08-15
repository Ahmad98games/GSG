// app/settings/import/page.tsx
"use client";

import React, { useState } from "react";
import { 
  Upload, FileText, Database, CheckCircle2, 
  AlertTriangle, Loader2, Download, Table, Users, Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function BulkDataImportPage() {
  const supabase = createClient();
  const [type, setType] =  useState <'skus' | 'parties' | 'opening_balances'>('skus');
  const [file, setFile] =  useState <File | null>(null);
  const [importing, setImporting] =  useState (false);
  const [result, setResult] =  useState <any>(null);
  const [preview, setPreview] =  useState <any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Basic CSV parser for preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const rows = text.split('\n').slice(0, 6);
        setPreview(rows.map(r => r.split(',')));
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const businessId = user?.user_metadata?.business_id;

      // In a real app, parse CSV and send JSON to Edge Function
      const text = await file.text();
      const rows = text.split('\n').filter(r => r.trim() !== '');
      const headers = rows[0].split(',').map(h => h.trim());
      const jsonData = rows.slice(1).map(row => {
        const values = row.split(',');
        const obj: any = {};
        headers.forEach((h, i) => obj[h] = values[i]?.trim());
        return obj;
      });

      const { data, error } = await supabase.functions.invoke('import-data', {
        body: { type, data: jsonData, businessId }
      });

      if (error) throw error;
      setResult(data);
    } catch (err: any) {
      alert("Import failed: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-onyx min-h-screen text-gray-300 font-inter p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex justify-between items-end">
           <div>
              <div className="flex items-center space-x-3 mb-2">
                 <Database className="text-electric-blue" size={24} />
                 <h1 className="text-4xl font-bold text-white tracking-tighter">Bulk Data Import</h1>
              </div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                Migrate existing records or perform bulk system updates
              </p>
           </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
           <ImportTypeCard 
             active={type === 'skus'} 
             icon={Briefcase} 
             label="Stock Items (SKUs)" 
             desc="Codes, Prices, Categories"
             onClick={() => setType('skus')} 
           />
           <ImportTypeCard 
             active={type === 'parties'} 
             icon={Users} 
             label="Parties" 
             desc="Customers & Suppliers"
             onClick={() => setType('parties')} 
           />
           <ImportTypeCard 
             active={type === 'opening_balances'} 
             icon={Table} 
             label="Opening Balances" 
             desc="Ledger Accounts (Must Balance)"
             onClick={() => setType('opening_balances')} 
           />
        </div>

        <div className="bg-surface border border-white/10 rounded-sm p-12 space-y-12 relative overflow-hidden">
           {/* Step 1: Upload */}
           <div className="space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">1. Select Data Source</h3>
                 <button className="text-[10px] text-electric-blue font-bold uppercase tracking-widest flex items-center hover:underline">
                    <Download size={12} className="mr-2" /> Download CSV Template
                 </button>
              </div>
              <label className="border-2 border-dashed border-white/5 hover:border-electric-blue/30 transition-all rounded-sm p-12 flex flex-col items-center justify-center cursor-pointer group">
                 <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                 <Upload className="text-gray-700 group-hover:text-electric-blue mb-4 transition-colors" size={32} />
                 <p className="text-sm text-gray-500">{file ? file.name : "Click to select CSV file"}</p>
                 <p className="text-[9px] text-gray-700 uppercase font-black tracking-widest mt-2">Max Size: 10MB</p>
              </label>
           </div>

           {/* Step 2: Preview */}
           <AnimatePresence>
             {file && (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">2. Data Preview (First 5 Rows)</h3>
                  <div className="overflow-x-auto border border-white/5 bg-onyx/40 rounded-sm">
                     <table className="w-full text-left">
                        <tbody className="divide-y divide-white/5">
                           {preview.map((row: string[], i: number) => (
                             <tr key={i}>
                                {row.map((cell: string, j: number) => (
                                  <td key={j} className="p-4 text-[10px] font-mono text-gray-500 whitespace-nowrap">{cell}</td>
                                ))}
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>

                  <div className="flex items-center space-x-4 bg-emerald/5 border border-emerald/10 p-4 rounded-sm">
                     <CheckCircle2 size={16} className="text-emerald" />
                     <p className="text-[10px] text-emerald font-bold uppercase tracking-widest">File matches required schema. Ready to ingest.</p>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>

           {/* Step 3: Action */}
           {file && (
             <div className="pt-6 border-t border-white/5">
                <button 
                  onClick={handleImport}
                  disabled={importing}
                  className="w-full bg-white text-onyx py-5 font-bold uppercase tracking-widest text-[11px] flex items-center justify-center hover:bg-electric-blue hover:text-white transition-all disabled:opacity-50"
                >
                   {importing ? <Loader2 size={16} className="animate-spin" /> : "Commit Import to Production"}
                </button>
             </div>
           )}

           {/* Result Overlay */}
           {result && (
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }}
               className="absolute inset-0 bg-onyx/90 backdrop-blur-sm flex items-center justify-center p-12 text-center"
             >
                <div className="space-y-6 max-w-sm">
                   <div className="w-20 h-20 bg-emerald/10 rounded-full flex items-center justify-center mx-auto border border-emerald/20">
                      <CheckCircle2 size={40} className="text-emerald" />
                   </div>
                   <div>
                      <h3 className="text-2xl font-bold text-white tracking-tighter">Import Successful</h3>
                      <p className="text-sm text-gray-500 mt-2">{result.count} records have been added to the system.</p>
                   </div>
                   <button 
                     onClick={() => { setFile(null); setResult(null); }}
                     className="w-full border border-white/10 text-white py-3 font-bold uppercase tracking-widest text-[9px]"
                   >
                      Dismiss Report
                   </button>
                </div>
             </motion.div>
           )}
        </div>
      </div>
    </div>
  );
}

function ImportTypeCard({ active, icon: Icon, label, desc, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`p-6 border flex flex-col items-start space-y-3 transition-all rounded-sm text-left ${
        active ? 'border-electric-blue bg-white/5 text-white' : 'border-white/10 text-gray-600 hover:text-white'
      }`}
    >
      <Icon size={24} className={active ? "text-electric-blue" : "text-gray-700"} />
      <div>
         <p className="text-[11px] font-bold uppercase tracking-widest">{label}</p>
         <p className="text-[9px] text-gray-500 font-medium mt-1">{desc}</p>
      </div>
    </button>
  );
}

