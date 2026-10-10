"use client";

import React, { useState, useRef, useMemo } from "react";
import { 
  Upload, Database, CheckCircle2, AlertTriangle, 
  Loader2, Download, Table, Users, Briefcase, 
  Sparkles, ArrowRight, RefreshCw, FileSpreadsheet,
  Check, X, ChevronDown, CheckCircle, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { usePersona } from "@/hooks/usePersona";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

type ImportEntity = 'skus' | 'parties' | 'karigars' | 'opening_balances';

interface EntitySchema {
  id: ImportEntity;
  label: string;
  icon: any;
  desc: string;
  badge: string;
  keywords: string[];
  fields: {
    key: string;
    label: string;
    required?: boolean;
    aliases: string[];
  }[];
}

const SCHEMAS: Record<ImportEntity, EntitySchema> = {
  parties: {
    id: 'parties',
    label: 'Parties & Leads',
    icon: Users,
    desc: 'Customers, Suppliers & Business Contacts',
    badge: 'CRM & Khata',
    keywords: ['party', 'customer', 'supplier', 'lead', 'client', 'company', 'firm', 'phone', 'mobile', 'address', 'city', 'balance', 'credit'],
    fields: [
      { key: 'name', label: 'Company / Party Name', required: true, aliases: ['name', 'company', 'party', 'client', 'title', 'company name', 'party name', 'customer name', 'supplier name', 'firm', 'business'] },
      { key: 'party_type', label: 'Party Type', required: false, aliases: ['type', 'party_type', 'party type', 'category', 'business type', 'industry', 'role'] },
      { key: 'phone', label: 'Phone Number', required: false, aliases: ['phone', 'mobile', 'contact', 'cell', 'whatsapp', 'phone number', 'mobile number', 'tel'] },
      { key: 'address', label: 'Address / Location', required: false, aliases: ['address', 'city', 'location', 'area', 'area / address', 'street', 'province'] },
      { key: 'email', label: 'Email', required: false, aliases: ['email', 'mail', 'email address'] },
      { key: 'current_balance', label: 'Opening Balance', required: false, aliases: ['balance', 'current_balance', 'opening balance', 'current balance', 'receivable', 'payable'] },
      { key: 'credit_limit', label: 'Credit Limit', required: false, aliases: ['credit', 'credit_limit', 'limit', 'credit limit'] },
    ]
  },
  skus: {
    id: 'skus',
    label: 'Stock Items (SKUs)',
    icon: Briefcase,
    desc: 'Products, Inventory Items & Raw Materials',
    badge: 'Inventory',
    keywords: ['sku', 'item', 'product', 'code', 'stock', 'cost', 'sale', 'price', 'qty', 'quantity', 'unit', 'reorder', 'barcode', 'maund'],
    fields: [
      { key: 'sku_code', label: 'Item Code / SKU', required: true, aliases: ['code', 'sku', 'sku_code', 'item code', 'product code', 'barcode', 'sku #', 'id'] },
      { key: 'name', label: 'Item Name', required: true, aliases: ['name', 'item', 'item name', 'product', 'product name', 'title', 'description'] },
      { key: 'category', label: 'Category', required: false, aliases: ['category', 'group', 'type', 'class'] },
      { key: 'unit', label: 'Unit of Measure', required: false, aliases: ['unit', 'uom', 'measure', 'packaging'] },
      { key: 'qty_on_hand', label: 'Stock Quantity', required: false, aliases: ['qty', 'stock', 'qty_on_hand', 'quantity', 'stock qty', 'current stock'] },
      { key: 'cost_price', label: 'Cost Price (PKR)', required: false, aliases: ['cost', 'cost_price', 'purchase price', 'buying rate', 'cost (pkr)'] },
      { key: 'sale_price', label: 'Sale Price (PKR)', required: false, aliases: ['sale', 'sale_price', 'price', 'retail price', 'sale rate', 'sale (pkr)', 'mrp'] },
      { key: 'reorder_level', label: 'Reorder Level', required: false, aliases: ['reorder', 'reorder_level', 'min stock', 'alert level'] },
    ]
  },
  karigars: {
    id: 'karigars',
    label: 'Employees & Karigars',
    icon: FileText,
    desc: 'Salaried Staff, Piece-Rate & Daily Workers',
    badge: 'HR & Payroll',
    keywords: ['salary', 'employee', 'worker', 'karigar', 'wage', 'pay', 'monthly salary', 'designation', 'staff', 'attendance', 'labor'],
    fields: [
      { key: 'name', label: 'Employee / Worker Name', required: true, aliases: ['name', 'employee', 'worker', 'karigar', 'staff', 'employee name', 'worker name', 'full name'] },
      { key: 'karigar_code', label: 'Employee ID / Code', required: false, aliases: ['code', 'id', 'emp code', 'karigar code', 'badge'] },
      { key: 'phone', label: 'Phone Number', required: false, aliases: ['phone', 'mobile', 'contact', 'whatsapp'] },
      { key: 'wage_type', label: 'Wage Type', required: false, aliases: ['wage type', 'pay type', 'type', 'frequency'] },
      { key: 'monthly_salary', label: 'Monthly Salary (PKR)', required: false, aliases: ['salary', 'monthly salary', 'basic pay', 'wage', 'salary (pkr)', 'pay'] },
      { key: 'daily_rate', label: 'Daily Rate (PKR)', required: false, aliases: ['daily', 'daily rate', 'per day'] },
      { key: 'piece_rate', label: 'Piece Rate (PKR)', required: false, aliases: ['piece', 'piece rate', 'per piece'] },
    ]
  },
  opening_balances: {
    id: 'opening_balances',
    label: 'Opening Balances',
    icon: Table,
    desc: 'Ledger Accounts & Balance Sheet Baseline',
    badge: 'Accounting',
    keywords: ['account', 'ledger', 'debit', 'credit', 'dr', 'cr', 'opening balance', 'voucher'],
    fields: [
      { key: 'account_name', label: 'Account Name', required: true, aliases: ['account', 'account name', 'title', 'head', 'ledger name'] },
      { key: 'debit', label: 'Debit (DR)', required: false, aliases: ['debit', 'dr', 'debit amount'] },
      { key: 'credit', label: 'Credit (CR)', required: false, aliases: ['credit', 'cr', 'credit amount'] },
      { key: 'notes', label: 'Remarks / Notes', required: false, aliases: ['notes', 'remarks', 'description', 'memo'] },
      { key: 'date', label: 'Effective Date', required: false, aliases: ['date', 'effective date', 'as of'] },
    ]
  }
};

export default function BulkDataImportPage() {
  const { businessId } = usePersona();
  const { success, error: toastError } = useToast();

  const [activeEntity, setActiveEntity] = useState<ImportEntity>('parties');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({}); // schemaKey -> fileHeader
  const [detectedReason, setDetectedReason] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; failed: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect entity type from headers and sample values
  const detectEntity = (headers: string[], firstRows: any[]): ImportEntity => {
    const headerStr = headers.map(h => h.toLowerCase().trim()).join(' ');
    const sampleStr = firstRows.slice(0, 3).map(r => Object.values(r).join(' ')).join(' ').toLowerCase();
    const combined = `${headerStr} ${sampleStr}`;

    let bestScore = -1;
    let bestEntity: ImportEntity = 'parties';
    let matchedWords: string[] = [];

    (Object.keys(SCHEMAS) as ImportEntity[]).forEach(entityKey => {
      const schema = SCHEMAS[entityKey];
      let score = 0;
      const found: string[] = [];

      schema.keywords.forEach(kw => {
        if (headerStr.includes(kw)) {
          score += 3;
          found.push(kw);
        } else if (combined.includes(kw)) {
          score += 1;
        }
      });

      schema.fields.forEach(f => {
        f.aliases.forEach(alias => {
          if (headers.some(h => h.toLowerCase().trim() === alias.toLowerCase())) {
            score += 4;
            if (!found.includes(alias)) found.push(alias);
          }
        });
      });

      if (score > bestScore) {
        bestScore = score;
        bestEntity = entityKey;
        matchedWords = found;
      }
    });

    if (matchedWords.length > 0) {
      setDetectedReason(`Matched headers & fields: [${matchedWords.slice(0, 4).join(', ')}]`);
    } else {
      setDetectedReason(null);
    }

    return bestEntity;
  };

  // Auto-map file headers to schema fields
  const buildInitialMapping = (entityKey: ImportEntity, headers: string[]) => {
    const schema = SCHEMAS[entityKey];
    const mapping: Record<string, string> = {};

    schema.fields.forEach(f => {
      // 1. Exact alias match
      const exactHeader = headers.find(h => {
        const clean = h.toLowerCase().trim();
        return f.aliases.some(alias => alias.toLowerCase() === clean);
      });

      if (exactHeader) {
        mapping[f.key] = exactHeader;
        return;
      }

      // 2. Partial substring match
      const partialHeader = headers.find(h => {
        const clean = h.toLowerCase().trim();
        return f.aliases.some(alias => clean.includes(alias.toLowerCase()) || alias.toLowerCase().includes(clean));
      });

      if (partialHeader) {
        mapping[f.key] = partialHeader;
      }
    });

    return mapping;
  };

  // Universal File Loader (XLSX, XLS, CSV, TSV)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const data = new Uint8Array(buffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Parse rows as raw array of objects
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          toastError("Empty File", "Uploaded document has no detectable data rows.");
          return;
        }

        const headers = Object.keys(rawJson[0]);
        setFileHeaders(headers);
        setParsedRows(rawJson);

        // Smart entity recognition
        const detected = detectEntity(headers, rawJson);
        setActiveEntity(detected);

        // Map columns
        const mapping = buildInitialMapping(detected, headers);
        setFieldMappings(mapping);

        success("File Analyzed Successfully", `Detected ${rawJson.length} rows. Mapped to ${SCHEMAS[detected].label}.`);
      } catch (err: any) {
        toastError("Parse Error", `Failed to read document: ${err.message}`);
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  // Switch entity type manually
  const handleEntitySwitch = (newEntity: ImportEntity) => {
    setActiveEntity(newEntity);
    if (fileHeaders.length > 0) {
      setFieldMappings(buildInitialMapping(newEntity, fileHeaders));
    }
  };

  // Produce normalized rows ready for API ingestion
  const mappedData = useMemo(() => {
    return parsedRows.map((row) => {
      const normalized: Record<string, any> = {};
      Object.entries(fieldMappings).forEach(([schemaKey, fileHeader]) => {
        if (fileHeader && row[fileHeader] !== undefined) {
          normalized[schemaKey] = row[fileHeader];
        }
      });
      return normalized;
    });
  }, [parsedRows, fieldMappings]);

  // Execute Import via /api/import
  const handleCommitImport = async () => {
    if (!file || mappedData.length === 0) return;

    setIsProcessing(true);
    setImportResult(null);

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: activeEntity,
          rows: mappedData,
          businessId
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to commit import");
      }

      setImportResult({
        imported: data.imported || mappedData.length,
        failed: data.failed || 0
      });

      success(
        "Import Completed Successfully!", 
        `Ingested ${data.imported || mappedData.length} records into ${SCHEMAS[activeEntity].label}.`
      );
    } catch (err: any) {
      toastError("Import Failed", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download Sample Template (.xlsx)
  const handleDownloadTemplate = () => {
    const schema = SCHEMAS[activeEntity];
    const headers = schema.fields.map(f => f.label);
    
    let sampleRow: any = {};
    if (activeEntity === 'parties') {
      sampleRow = {
        'Company / Party Name': 'Al-Hamid Textile Mills',
        'Party Type': 'Customer',
        'Phone Number': '+92 300 1234567',
        'Address / Location': 'P-55 Maqbool Road, Faisalabad',
        'Email': 'accounts@alhamid.com',
        'Opening Balance': '250000',
        'Credit Limit': '1000000'
      };
    } else if (activeEntity === 'skus') {
      sampleRow = {
        'Item Code / SKU': 'FAB-KHD-001',
        'Item Name': 'Khaddar Super Jet White',
        'Category': 'Fabric',
        'Unit of Measure': 'meter',
        'Stock Quantity': '1500',
        'Cost Price (PKR)': '450',
        'Sale Price (PKR)': '620',
        'Reorder Level': '200'
      };
    } else if (activeEntity === 'karigars') {
      sampleRow = {
        'Employee / Worker Name': 'Muhammad Akram',
        'Employee ID / Code': 'EMP-014',
        'Phone Number': '+92 321 9876543',
        'Wage Type': 'monthly',
        'Monthly Salary (PKR)': '38000',
        'Daily Rate (PKR)': '0',
        'Piece Rate (PKR)': '0'
      };
    } else {
      sampleRow = {
        'Account Name': 'Habib Bank Ltd - Current Account',
        'Debit (DR)': '1250000',
        'Credit (CR)': '0',
        'Remarks / Notes': 'Fiscal Year Opening Balance',
        'Effective Date': new Date().toISOString().split('T')[0]
      };
    }

    const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, schema.label);
    XLSX.writeFile(wb, `noxis_${activeEntity}_template.xlsx`);
    success("Template Downloaded", `Created ${schema.label} sample spreadsheet.`);
  };

  const currentSchema = SCHEMAS[activeEntity];

  return (
    <div className="bg-[#07090D] min-h-screen text-slate-200 font-inter p-8 md:p-12">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Database size={22} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black text-white tracking-tight">Bulk Data Import</h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                    Auto-Detection v13.0.8
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Ingest existing Excel spreadsheets (.xlsx, .xls) and CSVs directly with automated schema mapping.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-cyan-400 text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            <Download size={14} />
            <span>Download {currentSchema.label} Template (.xlsx)</span>
          </button>
        </div>

        {/* Entity Selector Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(SCHEMAS) as ImportEntity[]).map((key) => {
            const item = SCHEMAS[key];
            const IconComponent = item.icon;
            const isSelected = activeEntity === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleEntitySwitch(key)}
                className={cn(
                  "p-5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer",
                  isSelected
                    ? "bg-[#101726] border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                    : "bg-[#0E121B] border-white/5 hover:border-white/20 hover:bg-[#121622]"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                    isSelected ? "bg-cyan-500 text-black" : "bg-white/5 text-slate-400 group-hover:text-white"
                  )}>
                    <IconComponent size={18} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded",
                    isSelected ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-white/5 text-slate-500"
                  )}>
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{item.label}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-1">{item.desc}</p>
              </button>
            );
          })}
        </div>

        {/* AI Auto-Detection Banner */}
        {detectedReason && (
          <div className="flex items-center gap-3 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-transparent border border-cyan-500/30 p-4 rounded-xl">
            <Sparkles size={18} className="text-cyan-400 shrink-0 animate-pulse" />
            <div className="flex-1 text-xs">
              <span className="font-bold text-white">Smart Engine Auto-Detected: </span>
              <span className="text-cyan-300 font-semibold">{currentSchema.label}</span>
              <span className="text-slate-400 ml-2 font-mono text-[11px]">{detectedReason}</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold shrink-0">
              Confidence: High
            </span>
          </div>
        )}

        {/* Step 1: Upload Container */}
        <div className="bg-[#0E121B] border border-white/10 rounded-2xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-black">1</span>
              Select Spreadsheet Source (.xlsx, .xls, .csv)
            </h3>
            {file && (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <CheckCircle size={14} /> Ready for Ingestion
              </span>
            )}
          </div>

          <label
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/[0.02] transition-all rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv, .tsv"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-cyan-500/10 border border-white/10 group-hover:border-cyan-500/30 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 mb-4 transition-all">
              <Upload size={24} />
            </div>
            <p className="text-sm font-bold text-white mb-1">
              {fileName ? fileName : "Click to select or drop Excel (.xlsx) / CSV file"}
            </p>
            <p className="text-xs text-slate-400">
              {parsedRows.length > 0 ? `${parsedRows.length} data rows successfully parsed` : "Supports multi-column sheets, headers in first row"}
            </p>
          </label>
        </div>

        {/* Step 2: Column Mapping & Data Preview */}
        <AnimatePresence>
          {parsedRows.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0E121B] border border-white/10 rounded-2xl p-8 space-y-8"
            >
              {/* Column Mapping Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-black">2</span>
                    Schema Column Auto-Mapping
                  </h3>
                  <span className="text-xs text-slate-400">
                    Verify or adjust corresponding column headers
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-[#141A26] p-5 rounded-xl border border-white/5">
                  {currentSchema.fields.map(field => {
                    const mappedHeader = fieldMappings[field.key] || "";
                    const isMapped = Boolean(mappedHeader);

                    return (
                      <div key={field.key} className="space-y-1.5 bg-[#0E121B] p-3 rounded-lg border border-white/5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            {field.label}
                            {field.required && <span className="text-rose-400 font-bold">*</span>}
                          </span>
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            isMapped ? "bg-emerald-400" : field.required ? "bg-rose-400" : "bg-slate-600"
                          )} />
                        </div>

                        <select
                          value={mappedHeader}
                          onChange={(e) => {
                            setFieldMappings(prev => ({
                              ...prev,
                              [field.key]: e.target.value
                            }));
                          }}
                          className="w-full bg-[#182030] border border-white/10 rounded px-2.5 py-1.5 text-xs text-cyan-300 font-mono outline-none focus:border-cyan-500"
                        >
                          <option value="">(Do not import)</option>
                          {fileHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-black">3</span>
                    Parsed Document Preview (First 5 Rows)
                  </h3>
                  <span className="text-xs font-mono text-cyan-400">
                    Showing 5 of {parsedRows.length} total rows
                  </span>
                </div>

                <div className="overflow-x-auto border border-white/5 rounded-xl bg-[#141A26]">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#182030] text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/5">
                        {currentSchema.fields.map(f => (
                          <th key={f.key} className="p-3.5 whitespace-nowrap">
                            {f.label}
                            {fieldMappings[f.key] && (
                              <span className="block text-[9px] font-mono text-cyan-400 font-normal">
                                ← {fieldMappings[f.key]}
                              </span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {mappedData.slice(0, 5).map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                          {currentSchema.fields.map(f => (
                            <td key={f.key} className="p-3.5 text-xs font-mono text-slate-300 whitespace-nowrap">
                              {row[f.key] !== undefined && row[f.key] !== "" ? String(row[f.key]) : <span className="text-slate-600">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                    Document verified and parsed without binary corruption. Ready to ingest into production database.
                  </p>
                </div>
              </div>

              {/* Commit Button */}
              <div>
                <button
                  onClick={handleCommitImport}
                  disabled={isProcessing}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-cyan-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-white" />
                      <span>Ingesting {mappedData.length} Records into Production...</span>
                    </>
                  ) : (
                    <>
                      <Database size={18} />
                      <span>Commit Import to Production ({mappedData.length} Records)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Result Badge */}
              {importResult && (
                <div className="bg-emerald-500/15 border border-emerald-500/30 p-5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-emerald-400" size={24} />
                    <div>
                      <h4 className="text-sm font-bold text-white">Import Committed Successfully!</h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {importResult.imported} records inserted into {currentSchema.label}.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 px-3 py-1 rounded bg-emerald-500/20 border border-emerald-500/30">
                    100% Ingested
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
