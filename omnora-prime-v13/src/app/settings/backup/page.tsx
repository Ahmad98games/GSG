"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Download,
  Upload,
  Shield,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Database,
  Clock,
  FileJson,
  HardDrive,
  RefreshCw,
  Eye,
  FileSpreadsheet,
} from "lucide-react";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/useToast";

// ─────────────────────────────────────────────
// Web Crypto AES-GCM Helpers
// ─────────────────────────────────────────────

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as any, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptData(data: string, password: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as any },
    key,
    encoder.encode(data) as any
  );
  // Format: [salt(16)] [iv(12)] [ciphertext]
  const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encrypted), salt.length + iv.length);
  return result.buffer;
}

async function decryptData(buffer: ArrayBuffer, password: string): Promise<string> {
  const data = new Uint8Array(buffer);
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const ciphertext = data.slice(28);
  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as any },
    key,
    ciphertext as any
  );
  return new TextDecoder().decode(decrypted);
}

// ─────────────────────────────────────────────
// Backup Page Component
// ─────────────────────────────────────────────

interface BackupMetadata {
  generated_at: string;
  business_id: string;
  total_records: number;
  earliest_date: string | null;
  tables_included: number;
  version: string;
}

interface RestorePreview {
  tables: Record<string, number>;
  total: number;
  metadata?: BackupMetadata;
}

export default function BackupPage() {
  const { profile } = useBusinessProfile();
  const toast = useToast();
  
  // Backup state
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupPassword, setBackupPassword] = useState("");
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [excelBackupLoading, setExcelBackupLoading] = useState(false);
  const [excelBackupSuccess, setExcelBackupSuccess] = useState(false);

  // Restore state
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restorePassword, setRestorePassword] = useState("");
  const [restorePreview, setRestorePreview] = useState<RestorePreview | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreResult, setRestoreResult] = useState<any>(null);
  const [isEncryptedFile, setIsEncryptedFile] = useState(false);
  const [restoreError, setRestoreError] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch the local database path from Electron IPC (graceful fallback for browser)
  const [dbPath, setDbPath] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.getAppDataPath) {
      (window as any).electronAPI
        .getAppDataPath()
        .then((p: string) => setDbPath(p ? `${p}\\NoxisHub.db` : '~/.noxishub/'))
        .catch(() => setDbPath('~/.noxishub/'));
    } else {
      setDbPath('%APPDATA%\\NoxisHub\\NoxisHub.db');
    }
  }, []);

  // ── Download Backup ──
  const handleDownloadBackup = async () => {
    if (!profile?.id) return;
    setBackupLoading(true);
    setBackupSuccess(false);

    try {
      const res = await fetch(`/api/internal/backup?business_id=${profile.id}`);
      if (!res.ok) throw new Error("Failed to generate backup");

      const data = await res.json();
      const jsonString = JSON.stringify(data, null, 2);

      let blob: Blob;
      let extension: string;

      if (backupPassword.trim()) {
        // Encrypt with AES-256-GCM
        const encrypted = await encryptData(jsonString, backupPassword);
        blob = new Blob([encrypted], { type: "application/octet-stream" });
        extension = "noxis.enc";
      } else {
        blob = new Blob([jsonString], { type: "application/json" });
        extension = "json";
      }

      const businessName = (profile.business_name || "noxis")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .toLowerCase();
      const date = new Date().toISOString().split("T")[0];
      const filename = `noxis_backup_${businessName}_${date}.${extension}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 5000);
    } catch (err: any) {
      alert("Backup failed: " + err.message);
    } finally {
      setBackupLoading(false);
    }
  };

  // ── Download Excel Backup ──
  const handleDownloadBackupExcel = async () => {
    if (!profile?.id) return;
    setExcelBackupLoading(true);
    setExcelBackupSuccess(false);

    try {
      const res = await fetch(`/api/internal/backup?business_id=${profile.id}`);
      if (!res.ok) throw new Error("Failed to generate backup data");

      const data = await res.json();
      const backupObj = data.backup || {};

      const wb = XLSX.utils.book_new();

      // Sheet 1: Inventory
      const skusList = backupObj.skus || [];
      const skusData = skusList.map((sku: any) => ({
        'SKU Code': sku.sku_code,
        'Product Name': sku.name,
        'Category': sku.category || '',
        'Unit': sku.unit,
        'Qty on Hand': sku.qty_on_hand,
        'Cost Price': sku.cost_price,
        'Sale Price': sku.sale_price,
        'Reorder Level': sku.reorder_level || 0,
        'Status': sku.is_active ? 'Active' : 'Inactive',
      }));
      const wsSkus = XLSX.utils.json_to_sheet(skusData);
      XLSX.utils.book_append_sheet(wb, wsSkus, 'Inventory');

      // Sheet 2: Parties
      const partiesList = backupObj.parties || [];
      const partiesData = partiesList.map((party: any) => ({
        'Party Name': party.name,
        'Classification': party.party_type,
        'Phone': party.phone || '',
        'Address': party.address || '',
        'Credit Limit': party.credit_limit || 0,
        'Credit Days': party.credit_days || 0,
        'Current Balance': party.current_balance || 0,
        'Status': party.is_blocked ? 'Blocked' : 'Active',
      }));
      const wsParties = XLSX.utils.json_to_sheet(partiesData);
      XLSX.utils.book_append_sheet(wb, wsParties, 'Parties');

      // Sheet 3: Karigars
      const karigarsList = backupObj.karigars || [];
      const karigarsData = karigarsList.map((k: any) => ({
        'Karigar Code': k.karigar_code,
        'Name': k.name,
        'Phone': k.phone || '',
        'Wage Type': k.wage_type,
        'Piece Rate': k.piece_rate || 0,
        'Daily Rate': k.daily_rate || 0,
        'Monthly Salary': k.monthly_salary || 0,
        'Current Advance': k.current_advance || 0,
        'Status': k.status,
        'Skill Type': k.skill_type || '',
        'Joining Date': k.joining_date || '',
      }));
      const wsKarigars = XLSX.utils.json_to_sheet(karigarsData);
      XLSX.utils.book_append_sheet(wb, wsKarigars, 'Karigars');

      // Sheet 4: Invoices
      const invoicesList = backupObj.invoices || [];
      const invoicesData = invoicesList.map((inv: any) => ({
        'Invoice No': inv.invoice_no,
        'Issue Date': inv.issue_date || inv.created_at?.split('T')[0],
        'Total Amount': inv.total || 0,
        'Balance Due': inv.balance_due || 0,
        'Status': inv.status,
        'Due Date': inv.due_date || '',
      }));
      const wsInvoices = XLSX.utils.json_to_sheet(invoicesData);
      XLSX.utils.book_append_sheet(wb, wsInvoices, 'Invoices');

      // Sheet 5: Ledger
      const ledgerList = backupObj.ledger_entries || [];
      const ledgerData = ledgerList.map((entry: any) => ({
        'Date': entry.posted_at || entry.created_at?.split('T')[0],
        'Tx Ref': entry.tx_ref || '',
        'Debit': entry.debit || 0,
        'Credit': entry.credit || 0,
        'Type': entry.entry_type || '',
        'Amount': entry.amount || 0,
        'Description': entry.description || '',
      }));
      const wsLedger = XLSX.utils.json_to_sheet(ledgerData);
      XLSX.utils.book_append_sheet(wb, wsLedger, 'Ledger');

      const businessName = (profile.business_name || "noxis")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .toLowerCase();
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `noxis_data_export_${businessName}_${dateStr}.xlsx`;

      XLSX.writeFile(wb, filename);

      setExcelBackupSuccess(true);
      toast.success('All data exported to Excel workbook successfully');
      setTimeout(() => setExcelBackupSuccess(false), 5000);
    } catch (err: any) {
      toast.error('Excel Export Failed', err.message);
    } finally {
      setExcelBackupLoading(false);
    }
  };

  // ── Handle File Upload ──
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFile(file);
    setRestoreResult(null);
    setRestoreError("");
    setRestorePreview(null);

    const isEncrypted = file.name.endsWith(".enc");
    setIsEncryptedFile(isEncrypted);

    if (!isEncrypted) {
      // Parse JSON directly
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        parseRestorePreview(data);
      } catch {
        setRestoreError("Invalid backup file format");
      }
    }
  };

  // ── Decrypt and Preview ──
  const handleDecryptPreview = async () => {
    if (!restoreFile || !restorePassword) return;
    setRestoreError("");

    try {
      const buffer = await restoreFile.arrayBuffer();
      const decrypted = await decryptData(buffer, restorePassword);
      const data = JSON.parse(decrypted);
      parseRestorePreview(data);
    } catch {
      setRestoreError("Decryption failed. Wrong password?");
    }
  };

  const parseRestorePreview = (data: any) => {
    const backup = data.backup || data;
    const tables: Record<string, number> = {};
    let total = 0;

    for (const [key, value] of Object.entries(backup)) {
      if (Array.isArray(value)) {
        tables[key] = value.length;
        total += value.length;
      }
    }

    setRestorePreview({
      tables,
      total,
      metadata: data.metadata,
    });
  };

  // ── Execute Restore ──
  const handleRestore = async () => {
    if (!profile?.id || !restoreFile) return;
    if (!confirm("Are you sure you want to restore this backup? Existing data will NOT be deleted.")) return;

    setRestoreLoading(true);
    setRestoreResult(null);

    try {
      let jsonString: string;

      if (isEncryptedFile) {
        const buffer = await restoreFile.arrayBuffer();
        jsonString = await decryptData(buffer, restorePassword);
      } else {
        jsonString = await restoreFile.text();
      }

      const parsed = JSON.parse(jsonString);
      const backup = parsed.backup || parsed;

      const res = await fetch("/api/internal/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backup, business_id: profile.id }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setRestoreResult(result);
    } catch (err: any) {
      setRestoreError("Restore failed: " + err.message);
    } finally {
      setRestoreLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso; }
  };

  return (
    <div className="min-h-screen bg-black text-slate-200 font-inter">
      <main className="flex-1 transition-all duration-300 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-8 pt-8 pb-4">
          <Link
            href="/settings"
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={18} className="text-slate-400" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Backup & Restore
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Protect your business data with encrypted backups
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-12 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-8 pt-4">

            {/* ═══════════ LOCAL DATA LOCATION ═══════════ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-[#0F1114] border border-emerald-500/20 rounded-2xl space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <HardDrive size={18} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Your data location</p>
                  <p className="text-[10px] text-gray-500">This is where your encrypted database lives on this PC</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Local First
                </div>
              </div>
              <p className="text-xs font-mono text-gray-300 bg-[#161A1F] px-4 py-3 rounded-lg border border-white/5 break-all">
                {dbPath || 'Loading...'}
              </p>
              <p className="text-[10px] text-gray-600 leading-relaxed">
                Omnora Labs cannot access this file. Back up this path to an external drive or USB for maximum safety.
              </p>
            </motion.div>

            {/* ═══════════ DOWNLOAD BACKUP ═══════════ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 bg-gradient-to-br from-[#0D1117] to-[#111820] border border-white/10 rounded-2xl space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-electric-blue/10 rounded-xl">
                  <Download size={24} className="text-electric-blue" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Download Full Backup</h2>
                  <p className="text-slate-500 text-sm mt-0.5">
                    Export all business data as a secure JSON file
                  </p>
                </div>
              </div>

              {/* Backup includes */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Database, label: "SKUs & Inventory", count: "All" },
                  { icon: FileJson, label: "Invoices & Ledger", count: "All" },
                  { icon: HardDrive, label: "Workers & Production", count: "All" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                    <item.icon size={16} className="text-slate-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-300">{item.label}</p>
                      <p className="text-[10px] text-slate-600">{item.count} records</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Password Protection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Lock size={14} className="text-[#C5A059]" />
                  <label className="text-[10px] uppercase font-black text-[#C5A059] tracking-widest">
                    Password Protection (Optional)
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter encryption password..."
                    value={backupPassword}
                    onChange={(e) => setBackupPassword(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C5A059]/50 font-mono pr-24 transition-colors"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {backupPassword ? (
                      <span className="text-[9px] font-bold text-[#C5A059] bg-[#C5A059]/10 px-2 py-1 rounded">
                        AES-256
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-600 bg-white/5 px-2 py-1 rounded">
                        UNENCRYPTED
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-slate-600 italic">
                  {backupPassword
                    ? "Backup will be encrypted with AES-256-GCM. Do not lose the password — it cannot be recovered."
                    : "Without a password, backup will be saved as plain JSON. Anyone with the file can read your data."
                  }
                </p>
              </div>

              {/* Download Button */}
              <button
                id="download-backup-btn"
                onClick={handleDownloadBackup}
                disabled={backupLoading || !profile?.id}
                className={cn(
                  "w-full py-4 rounded-xl text-sm font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3",
                  backupSuccess
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-electric-blue text-onyx hover:brightness-110 shadow-[0_0_30px_rgba(45,185,255,0.15)]",
                  "disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                {backupLoading ? (
                  <><Loader2 className="animate-spin" size={18} /> Generating Backup...</>
                ) : backupSuccess ? (
                  <><CheckCircle2 size={18} /> Backup Downloaded Successfully</>
                ) : (
                  <><Download size={18} /> Download Full Backup</>
                )}
              </button>

              {/* Excel Export Button */}
              <button
                id="export-excel-backup-btn"
                onClick={handleDownloadBackupExcel}
                disabled={excelBackupLoading || !profile?.id}
                className={cn(
                  "w-full py-4 rounded-xl text-sm font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10",
                  excelBackupSuccess && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
                  "disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                {excelBackupLoading ? (
                  <><Loader2 className="animate-spin" size={18} /> Generating Excel...</>
                ) : excelBackupSuccess ? (
                  <><CheckCircle2 size={18} /> Excel Exported Successfully</>
                ) : (
                  <><FileSpreadsheet size={18} /> Export All Data as Excel</>
                )}
              </button>
            </motion.div>


            {/* ═══════════ RESTORE FROM BACKUP ═══════════ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-8 bg-gradient-to-br from-[#0D1117] to-[#13110D] border border-white/10 rounded-2xl space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-xl">
                  <Upload size={24} className="text-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Restore from Backup</h2>
                  <p className="text-slate-500 text-sm mt-0.5">
                    Upload a previous backup file to restore data
                  </p>
                </div>
              </div>

              {/* File Upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  restoreFile
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-white/10 hover:border-white/20 hover:bg-white/5"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.enc"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {restoreFile ? (
                  <div className="space-y-2">
                    <FileJson size={32} className="mx-auto text-amber-500" />
                    <p className="text-sm font-bold text-white">{restoreFile.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {(restoreFile.size / 1024).toFixed(1)} KB • Click to change
                    </p>
                    {isEncryptedFile && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#C5A059] bg-[#C5A059]/10 px-2 py-1 rounded">
                        <Lock size={10} /> Encrypted
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload size={32} className="mx-auto text-slate-600" />
                    <p className="text-sm text-slate-400">
                      Click to upload <span className="font-mono text-[10px]">.json</span> or <span className="font-mono text-[10px]">.noxis.enc</span> backup file
                    </p>
                  </div>
                )}
              </div>

              {/* Encrypted file: ask for password */}
              {isEncryptedFile && restoreFile && !restorePreview && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Unlock size={14} className="text-[#C5A059]" />
                    <label className="text-[10px] uppercase font-black text-[#C5A059] tracking-widest">
                      Enter Decryption Password
                    </label>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="password"
                      placeholder="Backup password..."
                      value={restorePassword}
                      onChange={(e) => setRestorePassword(e.target.value)}
                      className="flex-1 bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C5A059]/50 font-mono transition-colors"
                    />
                    <button
                      onClick={handleDecryptPreview}
                      disabled={!restorePassword}
                      className="px-6 py-3 bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#C5A059]/20 transition-colors disabled:opacity-30"
                    >
                      <Unlock size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {restoreError && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-400">{restoreError}</p>
                </div>
              )}

              {/* Preview */}
              <AnimatePresence>
                {restorePreview && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    {/* Metadata */}
                    {restorePreview.metadata && (
                      <div className="flex items-center gap-6 p-4 bg-white/5 rounded-lg border border-white/5">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-slate-500" />
                          <span className="text-xs text-slate-400">
                            Generated: {formatDate(restorePreview.metadata.generated_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Database size={14} className="text-slate-500" />
                          <span className="text-xs text-slate-400">
                            {restorePreview.total.toLocaleString()} total records
                          </span>
                        </div>
                        {restorePreview.metadata.earliest_date && (
                          <div className="flex items-center gap-2">
                            <RefreshCw size={14} className="text-slate-500" />
                            <span className="text-xs text-slate-400">
                              Since: {restorePreview.metadata.earliest_date.split("T")[0]}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Table Breakdown */}
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(restorePreview.tables)
                        .filter(([, count]) => count > 0)
                        .map(([table, count]) => (
                        <div key={table} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <span className="text-xs font-mono text-slate-400">{table}</span>
                          <span className="text-xs font-bold text-white">{count}</span>
                        </div>
                      ))}
                    </div>

                    {/* Warning */}
                    <div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-amber-500 uppercase tracking-tight">
                          Restore Notice
                        </p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          This will add data to your account. Existing data will not be deleted.
                          Duplicate records (matching IDs) will be skipped.
                        </p>
                      </div>
                    </div>

                    {/* Restore Button */}
                    <button
                      id="restore-now-btn"
                      onClick={handleRestore}
                      disabled={restoreLoading}
                      className={cn(
                        "w-full py-4 rounded-xl text-sm font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3",
                        "bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20",
                        "disabled:opacity-40 disabled:cursor-not-allowed"
                      )}
                    >
                      {restoreLoading ? (
                        <><Loader2 className="animate-spin" size={18} /> Restoring...</>
                      ) : (
                        <><Upload size={18} /> Restore Now</>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Restore Result */}
              {restoreResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    <p className="text-sm font-bold text-emerald-400">
                      Restore completed successfully
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(restoreResult.results || {}).map(
                      ([table, info]: [string, any]) => (
                        <div key={table} className="flex items-center justify-between p-2 bg-white/5 rounded text-[10px]">
                          <span className="font-mono text-slate-400">{table}</span>
                          <span className="text-emerald-400 font-bold">
                            +{info.inserted}
                            {info.skipped > 0 && (
                              <span className="text-slate-600 ml-1">({info.skipped} skipped)</span>
                            )}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>


            {/* ═══════════ AUTOMATED BACKUPS INFO ═══════════ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-8 bg-gradient-to-br from-[#0D1117] to-[#0D1711] border border-white/10 rounded-2xl space-y-4"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <Shield size={24} className="text-emerald-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white tracking-tight">Automated Backups</h2>
                  <p className="text-slate-500 text-sm mt-0.5">
                    Weekly backups run every Sunday at 2:00 AM
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/5 space-y-1">
                  <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">Schedule</p>
                  <p className="text-sm font-bold text-white">Sundays 2:00 AM</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/5 space-y-1">
                  <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">Retention</p>
                  <p className="text-sm font-bold text-white">Last 4 weeks</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/5 space-y-1">
                  <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">Storage</p>
                  <p className="text-sm font-bold text-white">Supabase Cloud</p>
                </div>
              </div>

              <p className="text-[10px] text-slate-600 italic leading-relaxed">
                Automated backups are stored in a secure Supabase Storage bucket isolated by business ID.
                Only the last 4 backups are retained — older backups are automatically deleted.
              </p>
            </motion.div>

          </div>
        </div>
      </main>
    </div>
  );
}
