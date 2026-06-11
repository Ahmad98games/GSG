"use client";

import React, { useState, useRef } from "react";
import { 
  Upload, Download, FileText, CheckCircle2, 
  AlertCircle, ArrowRight, X, Loader2, Table as TableIcon,
  Database
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

const INVENTORY_FIELDS = [
  { key: 'sku_code', label: 'SKU Code', required: true },
  { key: 'name', label: 'Name', required: true },
  { key: 'unit', label: 'Unit', required: true },
  { key: 'category', label: 'Category', required: false },
  { key: 'qty_on_hand', label: 'Stock Level', required: false },
  { key: 'cost_price', label: 'Cost Price', required: false },
  { key: 'sale_price', label: 'Sale Price', required: false },
  { key: 'reorder_level', label: 'Reorder Level', required: false },
];

export default function InventoryImportPage() {
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
    const skuHeaders = [
      'sku_code', 'name', 'category',
      'unit', 'qty_on_hand', 'cost_price',
      'sale_price', 'reorder_level'
    ];

    const skuSample1 = [
      'FAB-001', 'Khaddar Blue', 'Fabric',
      'meter', 500, 85, 120, 100
    ];

    const skuSample2 = [
      'FAB-002', 'Plain White Lawn', 'Fabric',
      'meter', 300, 70, 100, 50
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      skuHeaders,
      skuSample1,
      skuSample2,
    ]);

    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'noxis_inventory_template.xlsx');
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
    
    // Auto-map headers
    const headers = Object.keys(data[0] || {});
    const newMapping: Record<string, string> = {};
    
    headers.forEach(header => {
      const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const field = INVENTORY_FIELDS.find(f => f.key === normalized || f.key === header);
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
      const mappedRow: any = { business_id: businessId, is_active: true };
      
      // Apply mapping
      Object.entries(mapping).forEach(([csvHeader, noxisField]) => {
        if (noxisField) {
          mappedRow[noxisField] = row[csvHeader];
        }
      });

      // Validation
      const missingRequired = INVENTORY_FIELDS.filter(f => f.required && !mappedRow[f.key]);
      if (missingRequired.length > 0) {
        failed++;
        errors.push({ row: i + 1, msg: `Missing required: ${missingRequired.map(f => f.label).join(', ')}` });
        continue;
      }

      // Upsert
      const { data: existing } = await supabase
        .from('skus')
        .select('id')
        .eq('business_id', businessId)
        .eq('sku_code', mappedRow.sku_code)
        .single();

      const { error } = await supabase
        .from('skus')
        .upsert(mappedRow, { onConflict: 'business_id,sku_code' });

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
    
    const missingRequired = INVENTORY_FIELDS.filter(f => f.required && !mapped[f.key]);
    if (missingRequired.length > 0) return 'red';
    
    const missingOptional = INVENTORY_FIELDS.filter(f => !f.required && (mapped[f.key] === undefined || mapped[f.key] === null));
    if (missingOptional.length > 0) return 'amber';
    
    return 'green';
  };

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-gray-500 mb-1">
              <Link href="/inventory" className="hover:text-white transition-colors uppercase text-[10px] font-black tracking-widest">Inventory</Link>
              <ArrowRight size={10} />
              <span className="uppercase text-[10px] font-black tracking-widest text-blue-500">Bulk Import</span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-white italic">
              Import Stock Registry
            </h1>
          </div>
          
          <button 
            onClick={downloadTemplate}
            className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white transition-all"
          >
            <Download size={14} />
            <span>Download Template (.xlsx)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: UPLOAD & MAPPING */}
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
                  <p className="text-sm font-black uppercase text-white">Drop data file here</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Accepts .CSV, .XLSX, .XLS</p>
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
                  <h3 className="text-xs font-black uppercase text-white">Column Mapping</h3>
                  <button onClick={() => setStep(1)} className="text-[10px] font-black text-gray-500 hover:text-white uppercase">[Reset]</button>
                </div>

                <div className="space-y-4">
                  {Object.keys(parsedData[0] || {}).map(header => (
                    <div key={header} className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-500 flex justify-between">
                        <span>"{header}"</span>
                        {mapping[header] && <span className="text-blue-500 italic">Mapped</span>}
                      </label>
                      <select 
                        value={mapping[header] || ''}
                        onChange={(e) => setMapping(prev => ({ ...prev, [header]: e.target.value }))}
                        className="w-full bg-black border border-white/10 p-2 text-[11px] text-white outline-none focus:border-blue-500"
                      >
                        <option value="">Ignore Column</option>
                        {INVENTORY_FIELDS.map(f => (
                          <option key={f.key} value={f.key}>{f.label} {f.required ? '*' : ''}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handleImport}
                  disabled={isImporting || !Object.values(mapping).some(v => v)}
                  className="w-full py-4 bg-blue-500 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50 disabled:hover:bg-blue-500 flex items-center justify-center space-x-2 shadow-xl"
                >
                  {isImporting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Importing {importProgress}%</span>
                    </>
                  ) : (
                    <>
                      <Database size={16} />
                      <span>Import {parsedData.length} Products</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* RESULTS REPORT */}
            {importResults && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel border-white/5 p-6 space-y-6 bg-white/[0.02]"
              >
                <h3 className="text-xs font-black uppercase text-white flex items-center space-x-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Import Report</span>
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded text-center">
                    <p className="text-[10px] font-black text-emerald-500 uppercase">Success</p>
                    <p className="text-xl font-black text-white">{importResults.success}</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-center">
                    <p className="text-[10px] font-black text-blue-500 uppercase">Updated</p>
                    <p className="text-xl font-black text-white">{importResults.updated}</p>
                  </div>
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-center">
                    <p className="text-[10px] font-black text-red-500 uppercase">Failed</p>
                    <p className="text-xl font-black text-white">{importResults.failed}</p>
                  </div>
                </div>

                {importResults.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-gray-500 uppercase">Error Log</p>
                    <div className="max-h-[200px] overflow-y-auto space-y-1 custom-scrollbar">
                      {importResults.errors.map((err, idx) => (
                        <div key={idx} className="text-[9px] font-bold text-red-400 bg-red-500/5 p-2 border border-red-500/10 uppercase">
                          Row {err.row}: {err.msg}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => router.push('/inventory')}
                  className="w-full py-2 bg-white/5 border border-white/10 text-[10px] font-black uppercase text-gray-400 hover:text-white transition-all"
                >
                  Done & Return to Inventory
                </button>
              </motion.div>
            )}
          </div>

          {/* RIGHT: PREVIEW TABLE */}
          <div className="lg:col-span-8">
            <div className="glass-panel border-white/5 flex flex-col h-[700px]">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <TableIcon size={18} className="text-gray-500" />
                  <h2 className="text-xs font-black uppercase text-white tracking-widest">Data Preview</h2>
                </div>
                <span className="text-[10px] font-bold text-gray-600 uppercase">
                  {parsedData.length} Rows Detected
                </span>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar">
                {parsedData.length > 0 ? (
                  <table className="w-full text-left">
                    <thead className="sticky top-0 z-10 bg-[#1A1D21]">
                      <tr className="border-b border-white/10">
                        <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-600">Row</th>
                        {Object.keys(parsedData[0]).map(h => (
                          <th key={h} className="px-6 py-4 text-[10px] uppercase font-black text-gray-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 50).map((row, i) => {
                        const status = getRowStatus(row);
                        return (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                            <td className="px-6 py-4">
                              <div className={cn(
                                "w-6 h-6 rounded flex items-center justify-center text-[10px] font-black",
                                status === 'green' ? "bg-emerald-500/10 text-emerald-500" :
                                status === 'amber' ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                              )}>
                                {i + 1}
                              </div>
                            </td>
                            {Object.entries(row).map(([key, val]: any, j) => (
                              <td key={j} className="px-6 py-4 text-[11px] font-medium text-gray-400 group-hover:text-white uppercase truncate max-w-[150px]">
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                      {parsedData.length > 50 && (
                        <tr>
                          <td colSpan={100} className="px-6 py-8 text-center text-gray-600 text-[10px] font-black uppercase italic">
                            + {parsedData.length - 50} more rows...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20">
                    <FileText size={64} />
                    <p className="text-[10px] font-black uppercase tracking-widest">No data to preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.1);
        }
      `}</style>
    </div>
  );
}
