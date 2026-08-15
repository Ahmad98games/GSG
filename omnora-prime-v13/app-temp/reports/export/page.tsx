"use client";

import React, { useState } from "react";
import { 
  FileDown, Download, Table, FileSpreadsheet, 
  History, Calendar, Filter, Loader2, CheckCircle2, 
  AlertCircle, Database, Package, Users, 
  CreditCard, ShieldAlert, Lock, Terminal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { usePersona } from "@/hooks/usePersona";

import { useSidebarState } from "@/hooks/useSidebarState";
import { cn } from "@/lib/utils";

export default function ExportCenterPage() {
  const { businessId } = usePersona();
  const { isCollapsed } = useSidebarState();
  const supabase = createClient();
  
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);

  const triggerSuccess = (id: string) => {
    setSuccess(id);
    setTimeout(() => setSuccess(null), 3000);
  };

  const exportInventory = async () => {
    setLoading('inventory');
    const { data } = await supabase.from('skus').select('*').eq('business_id', businessId);
    if (data) {
      const rows = [["SKU", "Name", "Category", "Quantity", "Unit", "Cost", "Price"]];
      data.forEach((s: any) => rows.push([s.sku, s.name, s.category, s.qty_on_hand, s.unit, s.cost_price, s.sale_price]));
      downloadCSV(rows, 'inventory');
      triggerSuccess('inventory');
    }
    setLoading(null);
  };

  const exportLedger = async () => {
    setLoading('ledger');
    const { data } = await supabase.from('ledger_entries').select('*, accounts(name)').eq('business_id', businessId).order('posted_at', { ascending: false });
    if (data) {
      const rows = [["Date", "Reference", "Account", "Type", "Amount", "Description"]];
      data.forEach((l: any) => rows.push([l.posted_at, l.tx_ref, l.accounts?.name || "", l.entry_type, l.amount, l.description]));
      downloadCSV(rows, 'ledger');
      triggerSuccess('ledger');
    }
    setLoading(null);
  };

  const exportPayroll = async () => {
    setLoading('payroll');
    const { data } = await supabase.from('payroll_entries').select('*, karigars(name)').eq('business_id', businessId);
    if (data) {
      const rows = [["Date", "Karigar", "Work Type", "Units", "Amount", "Status"]];
      data.forEach((p: any) => rows.push([p.work_date, p.karigars?.name || "", p.work_type, p.units, p.total_wage, p.status]));
      downloadCSV(rows, 'payroll');
      triggerSuccess('payroll');
    }
    setLoading(null);
  };

  const exportInvoices = async () => {
    setLoading('invoices');
    const { data } = await supabase.from('invoices').select('*, parties(name)').eq('business_id', businessId);
    if (data) {
      const rows = [["Number", "Date", "Party", "Total", "Status"]];
      data.forEach((i: any) => rows.push([i.invoice_number, i.created_at, i.parties?.name || "", i.total_amount, i.status]));
      downloadCSV(rows, 'invoices');
      triggerSuccess('invoices');
    }
    setLoading(null);
  };

  const exportFullBackup = async () => {
    if (pin !== "1234") { // Mock PIN check, in real app would verify against server
      alert("Invalid Security PIN");
      return;
    }
    setLoading('backup');
    const tables = ['skus', 'parties', 'invoices', 'ledger_entries', 'accounts', 'karigars'];
    const backup: any = {};
    
    for (const table of tables) {
      const { data } = await supabase.from(table).select('*').eq('business_id', businessId);
      backup[table] = data || [];
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noxis_full_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    setShowPinModal(false);
    triggerSuccess('backup');
    setLoading(null);
  };

  const downloadCSV = (rows: any[][], type: string) => {
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `noxis_${type}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  

  return (
    <div className="min-h-screen bg-onyx text-slate-200 font-inter">
      
      
      <main className={` transition-all duration-300 min-h-screen flex flex-col`}>
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-surface/50 backdrop-blur-md sticky top-0 z-40">
           <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
            <span>Noxis Hub</span>
            <span className="mx-3 opacity-30">/</span>
            <span className="text-white">Data Export Center</span>
          </div>
        </header>

        <div className="p-12 max-w-[1200px] mx-auto w-full space-y-12">
           <div className="space-y-4">
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Data <span className="text-gray-600">Export Center</span></h2>
              <p className="text-gray-500 max-w-2xl text-sm leading-relaxed">
                 Centralized hub for generating financial statements, inventory registries, and statutory tax returns. All exports are generated client-side for maximum security and zero server retention.
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ExportCard 
                id="inventory" 
                title="Inventory Registry" 
                desc="Complete list of SKUs, stock levels, and valuation metrics." 
                icon={Package} 
                onClick={exportInventory} 
                loading={loading === 'inventory'}
                success={success === 'inventory'}
              />
              <ExportCard 
                id="ledger" 
                title="General Ledger" 
                desc="All financial journal entries with audit trails and refs." 
                icon={Database} 
                onClick={exportLedger} 
                loading={loading === 'ledger'}
                success={success === 'ledger'}
              />
              <ExportCard 
                id="payroll" 
                title="Karigar Payroll" 
                desc="Work logs, wage calculations, and advance deductions." 
                icon={Users} 
                onClick={exportPayroll} 
                loading={loading === 'payroll'}
                success={success === 'payroll'}
              />
              <ExportCard 
                id="invoices" 
                title="Sales Invoices" 
                desc="Customer billing history, tax breakouts, and payment status." 
                icon={CreditCard} 
                onClick={exportInvoices} 
                loading={loading === 'invoices'}
                success={success === 'invoices'}
              />
              <ExportCard 
                id="tax" 
                title="Tax Return (XML)" 
                desc="Statutory FBR IRIS compliant XML for quarterly filing." 
                icon={Terminal} 
                onClick={() => window.location.href = '/reports/tax-return'} 
                loading={false}
                success={false}
              />
              <ExportCard 
                id="backup" 
                title="Full System Backup" 
                desc="Complete database JSON dump for data portability." 
                icon={ShieldAlert} 
                onClick={() => setShowPinModal(true)} 
                loading={loading === 'backup'}
                success={success === 'backup'}
                critical
              />
           </div>
        </div>
      </main>

      {/* PIN MODAL */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-onyx/90 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 20 }}
               className="bg-surface border border-white/10 p-12 max-w-sm w-full space-y-8 text-center"
             >
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Lock className="text-red-500" size={32} />
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-bold text-white uppercase tracking-tight">Security Access Required</h3>
                   <p className="text-xs text-gray-500 leading-relaxed uppercase tracking-widest">Enter Master PIN to authorize full database decryption</p>
                </div>
                <input 
                  type="password" 
                  maxLength={4}
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="● ● ● ●"
                  className="w-full bg-onyx border border-white/10 p-4 text-2xl text-center font-mono text-white tracking-[1em] focus:border-red-500 outline-none transition-all"
                />
                <div className="flex flex-col space-y-3">
                   <button 
                     onClick={exportFullBackup}
                     className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] transition-all"
                   >
                      Authorize Decryption & Download
                   </button>
                   <button 
                     onClick={() => setShowPinModal(false)}
                     className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-500 font-black uppercase tracking-widest text-[10px] transition-all"
                   >
                      Abort
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExportCard({ title, desc, icon: Icon, onClick, loading, success, critical }: any) {
  return (
    <button 
      onClick={onClick}
      disabled={loading}
      className={cn(
        "p-8 bg-surface border border-white/5 flex flex-col items-start text-left space-y-6 hover:border-white/20 transition-all group relative overflow-hidden",
        critical && "hover:border-red-500/30"
      )}
    >
       <div className={cn(
         "p-4 bg-white/5 group-hover:scale-110 transition-transform",
         critical ? "text-red-500" : "text-electric-blue"
       )}>
          <Icon size={24} />
       </div>
       <div className="space-y-2">
          <h3 className="text-sm font-black uppercase text-white tracking-widest">{title}</h3>
          <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-bold tracking-widest">{desc}</p>
       </div>
       
       <div className="w-full pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">CSV / JSON Format</span>
          {loading ? (
            <Loader2 size={14} className="animate-spin text-white" />
          ) : success ? (
            <CheckCircle2 size={14} className="text-emerald" />
          ) : (
            <Download size={14} className="text-gray-700 group-hover:text-white transition-colors" />
          )}
       </div>
    </button>
  );
}
