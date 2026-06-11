"use client";

import React, { useState, useRef } from "react";
import { 
  Upload, Download, FileText, CheckCircle2, 
  ArrowRight, Loader2, Table as TableIcon,
  Database, Building2
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

const PARTY_FIELDS = [
  { key: 'name', label: 'Company Name', required: true },
  { key: 'party_type', label: 'Type (vendor/customer/both)', required: true },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'address', label: 'Address', required: false },
  { key: 'current_balance', label: 'Opening Balance', required: false },
];

export default function PartiesImportPage() {
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
    const partyHeaders = [
      'name', 'party_type', 'phone', 'email', 'address', 'current_balance'
    ];
    const partySample1 = [
      'Global Fabrics', 'vendor', '03009988776', 'sales@global.com', 'Industrial Area Karachi', 50000
    ];
    const partySample2 = [
      'Style Mart', 'customer', '03215544332', 'contact@style.com', 'Main Bazar Lahore', -12500
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      partyHeaders,
      partySample1,
      partySample2,
    ]);

    XLSX.utils.book_append_sheet(wb, ws, 'Parties');
    XLSX.writeFile(wb, 'noxis_parties_template.xlsx');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true, skipEmptyLines: true, dynamicTyping: true,
        complete: (results) => processParsedData(results.data),
        error: (err) => { toast.error("Parsing failed", err.message); setIsParsing(false); }
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wsname]);
        processParsedData(data);
      };
      reader.readAsBinaryString(file);
    } else {
      toast.error("Invalid file type", "CSV or Excel only.");
      setIsParsing(false);
    }
  };

  const processParsedData = (data: any[]) => {
    setParsedData(data);
    const headers = Object.keys(data[0] || {});
    const newMapping: Record<string, string> = {};
    headers.forEach(header => {
      const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const field = PARTY_FIELDS.find(f => f.key === normalized || f.key === header);
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
        if (noxisField) {
          mappedRow[noxisField] = row[csvHeader];
        }
      });

      const missingRequired = PARTY_FIELDS.filter(f => f.required && !mappedRow[f.key]);
      if (missingRequired.length > 0) {
        failed++;
        errors.push({ row: i + 1, msg: `Missing required: ${missingRequired.map(f => f.label).join(', ')}` });
        continue;
      }

      // Parties upsert usually on name for bulk import if no external ID exists
      const { data: existing } = await supabase
        .from('parties')
        .select('id')
        .eq('business_id', businessId)
        .eq('name', mappedRow.name)
        .single();

      const { error } = await supabase
        .from('parties')
        .upsert(mappedRow, { onConflict: 'business_id,name' });

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
    toast.success("Import processing complete");
  };

  const getRowStatus = (row: any) => {
    const mapped: any = {};
    Object.entries(mapping).forEach(([h, f]) => { if(f) mapped[f] = row[h]; });
    
    const missingRequired = PARTY_FIELDS.filter(f => f.required && !mapped[f.key]);
    if (missingRequired.length > 0) return 'red';
    return 'green';
  };

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-gray-500 mb-1">
              <Link href="/parties" className="hover:text-white transition-colors uppercase text-[10px] font-black tracking-widest">Parties</Link>
              <ArrowRight size={10} />
              <span className="uppercase text-[10px] font-black tracking-widest text-blue-500">Bulk Import</span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-white italic">Import Business Network</h1>
          </div>
          <button onClick={downloadTemplate} className="px-4 py-2 bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
            <Download size={14} className="inline mr-2" /> Template (.xlsx)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            {step === 1 ? (
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-xl p-12 flex flex-col items-center justify-center space-y-4 cursor-pointer">
                <Upload size={32} className="text-gray-500" />
                <p className="text-sm font-black uppercase text-white text-center">Upload CSV/Excel</p>
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
              </div>
            ) : (
              <div className="glass-panel border-white/5 p-6 space-y-6">
                <h3 className="text-xs font-black uppercase text-white">Party Mapping</h3>
                {Object.keys(parsedData[0] || {}).map(header => (
                  <div key={header} className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-500">"{header}"</label>
                    <select value={mapping[header] || ''} onChange={(e) => setMapping(prev => ({ ...prev, [header]: e.target.value }))} className="w-full bg-black border border-white/10 p-2 text-[11px] text-white outline-none focus:border-blue-500">
                      <option value="">Ignore</option>
                      {PARTY_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label} {f.required ? '*' : ''}</option>)}
                    </select>
                  </div>
                ))}
                <button onClick={handleImport} disabled={isImporting} className="w-full py-4 bg-blue-500 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center space-x-2">
                   {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Building2 size={16} />}
                   <span>Import {parsedData.length} Parties</span>
                </button>
              </div>
            )}
            
            {importResults && (
              <div className="glass-panel border-white/5 p-6 space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-black">
                   <div className="p-2 bg-emerald-500/10 text-emerald-500">OK: {importResults.success}</div>
                   <div className="p-2 bg-blue-500/10 text-blue-500">UPD: {importResults.updated}</div>
                   <div className="p-2 bg-red-500/10 text-red-500">FAIL: {importResults.failed}</div>
                </div>
                <button onClick={() => router.push('/parties')} className="w-full py-2 bg-white/5 text-[10px] font-black uppercase">Finish</button>
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            <div className="glass-panel border-white/5 h-[700px] overflow-auto custom-scrollbar">
               {parsedData.length > 0 && (
                 <table className="w-full text-left text-[10px] uppercase font-bold text-gray-400">
                   <thead><tr className="bg-black text-gray-600 font-black"><th className="p-4">Row</th>{Object.keys(parsedData[0]).map(h => <th key={h} className="p-4">{h}</th>)}</tr></thead>
                   <tbody>{parsedData.slice(0, 50).map((row, i) => <tr key={i} className="border-b border-white/5"><td className="p-4">{i+1}</td>{Object.values(row).map((v: any, j) => <td key={j} className="p-4">{String(v)}</td>)}</tr>)}</tbody>
                 </table>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
