"use client";

import React, { useState, useRef } from "react";
import { 
  Upload, Download, FileText, CheckCircle2, 
  ArrowRight, Loader2, Table as TableIcon,
  Database, Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { createClient } from "@/lib/supabase/client";
import { usePersona } from "@/hooks/usePersona";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

const KARIGAR_FIELDS = [
  { key: 'karigar_code', label: 'Karigar Code', required: true },
  { key: 'name', label: 'Name', required: true },
  { key: 'phone', label: 'Phone Number', required: false },
  { key: 'wage_type', label: 'Wage Type (piece/daily/monthly)', required: true },
  { key: 'piece_rate', label: 'Piece Rate', required: false },
  { key: 'daily_rate', label: 'Daily Rate', required: false },
  { key: 'monthly_salary', label: 'Monthly Salary', required: false },
  { key: 'status', label: 'Status', required: false },
];

export default function KarigarsImportPage() {
  const { businessId } = usePersona();
  const toast = useToast();
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    updated: number;
    failed: number;
    errors: { row: number; msg: string }[];
  } | null>(null);

  const downloadTemplate = () => {
    const headers = KARIGAR_FIELDS.map(f => f.key).join(',');
    const sample1 = "K-001,Ahmed Ali,03001234567,piece,45,0,0,active";
    const sample2 = "K-002,Bilal Khan,03217654321,daily,0,1200,0,active";
    const csvContent = `${headers}\n${sample1}\n${sample2}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'noxis_karigars_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          processParsedData(results.data);
        },
        error: (err) => {
          toast.error("Parsing failed", err.message);
          setIsParsing(false);
        }
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        processParsedData(data);
      };
      reader.readAsBinaryString(file);
    } else {
      toast.error("Invalid file type", "Please upload CSV or Excel file.");
      setIsParsing(false);
    }
  };

  const processParsedData = (data: any[]) => {
    setParsedData(data);
    const headers = Object.keys(data[0] || {});
    const newMapping: Record<string, string> = {};
    headers.forEach(header => {
      const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const field = KARIGAR_FIELDS.find(f => f.key === normalized || f.key === header);
      if (field) newMapping[header] = field.key;
    });
    setMapping(newMapping);
    setStep(2);
    setIsParsing(false);
  };

  const handleImport = async () => {
    if (!businessId) return;
    setIsImporting(true);
    setImportProgress(0);
    
    let success = 0;
    let updated = 0;
    let failed = 0;
    const errors: { row: number; msg: string }[] = [];

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      const mappedRow: any = { business_id: businessId };
      
      Object.entries(mapping).forEach(([csvHeader, noxisField]) => {
        if (noxisField) mappedRow[noxisField] = row[csvHeader];
      });

      const missingRequired = KARIGAR_FIELDS.filter(f => f.required && !mappedRow[f.key]);
      if (missingRequired.length > 0) {
        failed++;
        errors.push({ row: i + 1, msg: `Missing required: ${missingRequired.map(f => f.label).join(', ')}` });
        continue;
      }

      const { data: existing } = await supabase
        .from('karigars')
        .select('id')
        .eq('business_id', businessId)
        .eq('karigar_code', mappedRow.karigar_code)
        .single();

      const { error } = await supabase
        .from('karigars')
        .upsert(mappedRow, { onConflict: 'business_id,karigar_code' });

      if (error) {
        failed++;
        errors.push({ row: i + 1, msg: error.message });
      } else {
        if (existing) updated++;
        else success++;
      }
      setImportProgress(Math.round(((i + 1) / parsedData.length) * 100));
    }

    setImportResults({ success, updated, failed, errors });
    setIsImporting(false);
    toast.success("Karigar import complete");
  };

  const getRowStatus = (row: any) => {
    const mapped: any = {};
    Object.entries(mapping).forEach(([h, f]) => { if(f) mapped[f] = row[h]; });
    const missingRequired = KARIGAR_FIELDS.filter(f => f.required && !mapped[f.key]);
    if (missingRequired.length > 0) return 'red';
    return 'green';
  };

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-gray-500 mb-1">
              <Link href="/karigars" className="hover:text-white transition-colors uppercase text-[10px] font-black tracking-widest">Karigars</Link>
              <ArrowRight size={10} />
              <span className="uppercase text-[10px] font-black tracking-widest text-blue-500">Bulk Import</span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-white italic">
              Import Workforce Registry
            </h1>
          </div>
          
          <button 
            onClick={downloadTemplate}
            className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white transition-all"
          >
            <Download size={14} />
            <span>Download Karigar Template</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-6">
            {step === 1 ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-xl p-12 flex flex-col items-center justify-center space-y-4 cursor-pointer transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-blue-500 transition-colors">
                  {isParsing ? <Loader2 size={32} className="animate-spin" /> : <Upload size={32} />}
                </div>
                <div className="text-center">
                  <p className="text-sm font-black uppercase text-white">Drop karigar list here</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">CSV or Excel format</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                />
              </div>
            ) : (
              <div className="glass-panel border-white/5 p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-white">Karigar Mapping</h3>
                  <button onClick={() => setStep(1)} className="text-[10px] font-black text-gray-500 hover:text-white uppercase">[Reset]</button>
                </div>

                <div className="space-y-4">
                  {Object.keys(parsedData[0] || {}).map(header => (
                    <div key={header} className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-500">"{header}"</label>
                      <select 
                        value={mapping[header] || ''}
                        onChange={(e) => setMapping(prev => ({ ...prev, [header]: e.target.value }))}
                        className="w-full bg-black border border-white/10 p-2 text-[11px] text-white outline-none focus:border-blue-500"
                      >
                        <option value="">Ignore</option>
                        {KARIGAR_FIELDS.map(f => (
                          <option key={f.key} value={f.key}>{f.label} {f.required ? '*' : ''}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handleImport}
                  disabled={isImporting}
                  className="w-full py-4 bg-blue-500 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center space-x-2"
                >
                  <Users size={16} />
                  <span>Import {parsedData.length} Karigars</span>
                </button>
              </div>
            )}

            {importResults && (
              <div className="glass-panel border-white/5 p-6 space-y-6">
                <h3 className="text-xs font-black uppercase text-white">Import Report</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded"><p className="text-[8px] uppercase">New</p><p className="text-lg font-black">{importResults.success}</p></div>
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded"><p className="text-[8px] uppercase">Updates</p><p className="text-lg font-black">{importResults.updated}</p></div>
                  <div className="p-2 bg-red-500/10 text-red-500 rounded"><p className="text-[8px] uppercase">Fails</p><p className="text-lg font-black">{importResults.failed}</p></div>
                </div>
                <button onClick={() => router.push('/karigars')} className="w-full py-2 bg-white/5 text-[10px] font-black uppercase">Continue</button>
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            <div className="glass-panel border-white/5 flex flex-col h-[700px] overflow-hidden">
               <div className="p-6 border-b border-white/5 text-xs font-black uppercase text-white">Preview</div>
               <div className="flex-1 overflow-auto custom-scrollbar">
                  {parsedData.length > 0 && (
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-black border-b border-white/10 text-[9px] uppercase font-black text-gray-500">
                             <th className="p-4">Row</th>
                             {Object.keys(parsedData[0]).map(h => <th key={h} className="p-4">{h}</th>)}
                          </tr>
                       </thead>
                       <tbody>
                          {parsedData.slice(0, 50).map((row, i) => (
                            <tr key={i} className="border-b border-white/5 text-[10px] text-gray-400 group">
                               <td className="p-4"><div className={cn("w-4 h-4 rounded text-center leading-4", getRowStatus(row) === 'green' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500')}>{i+1}</div></td>
                               {Object.values(row).map((v: any, j) => <td key={j} className="p-4">{String(v)}</td>)}
                            </tr>
                          ))}
                       </tbody>
                    </table>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
