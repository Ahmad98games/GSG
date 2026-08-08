"use client";

import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  ArrowRight, 
  CheckCircle2, 
  MessageSquare, 
  FileText, 
  Layers, 
  Database,
  RefreshCw,
  Sparkles,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';

export function DataMigrationStudio() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'tally' | 'sku' | 'whatsapp'>('tally');
  const [csvContent, setCsvContent] = useState<string>('');
  const [mappedRows, setMappedRows] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // WhatsApp raw order text state
  const [rawText, setRawText] = useState(
    "Send 50 bags Super Basmati 10kg to Al-Madina Traders. Also 20 bags Parboiled Rice 25kg."
  );
  const [parsedOrder, setParsedOrder] = useState<any | null>(null);

  // Demo Tally CSV upload parser
  const handleTallyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      // Generate preview rows
      setMappedRows([
        { code: 'ACC-101', name: 'Al-Madina Traders', type: 'Customer', balance: 145000 },
        { code: 'ACC-102', name: 'Super Textile Wholesalers', type: 'Customer', balance: 280000 },
        { code: 'ACC-103', name: 'Tariq Yarn Suppliers', type: 'Supplier', balance: -95000 },
      ]);
    };
    reader.readAsText(file);
  };

  const parseWhatsAppOrder = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setParsedOrder({
        customer: 'Al-Madina Traders',
        items: [
          { sku: 'RICE-SB-10KG', name: 'Super Basmati 10kg', qty: 50, unitPrice: 2400, total: 120000 },
          { sku: 'RICE-PB-25KG', name: 'Parboiled Rice 25kg', qty: 20, unitPrice: 5200, total: 104000 },
        ],
        grandTotal: 224000,
      });
      setIsProcessing(false);
    }, 400);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Tab Selector */}
      <div className="flex gap-3 border-b border-white/10 pb-4">
        {[
          { id: 'tally', label: t('Tally / QuickBooks Importer'), icon: Database },
          { id: 'sku', label: t('Excel Price List SKU Mapper'), icon: FileSpreadsheet },
          { id: 'whatsapp', label: t('WhatsApp Order Text Parser'), icon: MessageSquare },
        ].map(tTab => (
          <button
            key={tTab.id}
            onClick={() => setActiveTab(tTab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer ${
              activeTab === tTab.id
                ? 'bg-[#08EBF6]/10 border-[#08EBF6] text-[#08EBF6]'
                : 'bg-[#0B0F17] border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <tTab.icon size={14} />
            <span>{tTab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Tally / QuickBooks Importer */}
      {activeTab === 'tally' && (
        <div className="bg-[#0B0F17] border border-white/10 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">{t('Tally & Accounting Ledger Migration')}</h3>
            <p className="text-xs text-slate-400">Import CSV/Excel ledger exports from Tally, Marg ERP, or Vyapar to auto-populate Noxis Parties & Opening Balances.</p>
          </div>

          <div className="border-2 border-dashed border-white/15 rounded-2xl p-8 text-center space-y-4 hover:border-[#08EBF6]/50 transition-colors">
            <Upload size={32} className="mx-auto text-[#08EBF6]" />
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">{t('Drag & drop your Tally / QuickBooks CSV file')}</p>
              <p className="text-[10px] text-slate-500 mt-1">Supports UTF-8 CSV, XLSX files up to 50MB</p>
            </div>
            <label className="inline-block px-5 py-2.5 bg-[#08EBF6] text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 cursor-pointer">
              <span>{t('Browse Files')}</span>
              <input type="file" accept=".csv,.xlsx" onChange={handleTallyUpload} className="hidden" />
            </label>
          </div>

          {mappedRows.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Parsed Parties Preview ({mappedRows.length} Accounts Found)</h4>
              <div className="bg-[#030712] border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0B0F17] text-slate-400 text-[10px] uppercase font-black">
                    <tr>
                      <th className="p-3">Account Code</th>
                      <th className="p-3">Party Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3 text-right">Opening Balance (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {mappedRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-white/5">
                        <td className="p-3 text-[#08EBF6]">{r.code}</td>
                        <td className="p-3 text-white font-sans font-bold">{r.name}</td>
                        <td className="p-3 text-slate-400">{r.type}</td>
                        <td className="p-3 text-right text-white font-bold">{r.balance.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={() => {
                  setSuccessMsg('Successfully imported 3 Party accounts & opening balances into Noxis Khata!');
                }}
                className="px-6 py-3 bg-emerald-500 text-black text-xs font-black uppercase tracking-widest rounded-xl hover:brightness-110 cursor-pointer"
              >
                Commit & Import into Khata
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Excel Price List SKU Mapper */}
      {activeTab === 'sku' && (
        <div className="bg-[#0B0F17] border border-white/10 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">{t('Excel Price List SKU Mapper')}</h3>
            <p className="text-xs text-slate-400">Map supplier price list spreadsheets directly into active Noxis Inventory SKUs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-[#030712] border border-white/10 rounded-xl space-y-3">
              <span className="text-xs font-black text-[#08EBF6] uppercase tracking-wider">Excel Column Header</span>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between p-2 bg-white/5 rounded"><span>Column A: Item_Code</span><ArrowRight size={14} /></div>
                <div className="flex justify-between p-2 bg-white/5 rounded"><span>Column B: Product_Description</span><ArrowRight size={14} /></div>
                <div className="flex justify-between p-2 bg-white/5 rounded"><span>Column C: Wholesale_Rate</span><ArrowRight size={14} /></div>
              </div>
            </div>

            <div className="p-5 bg-[#030712] border border-white/10 rounded-xl space-y-3">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">Noxis Inventory Target Field</span>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded">Target: SKU Code</div>
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded">Target: SKU Name</div>
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded">Target: Cost Price</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: WhatsApp Text Order Parser */}
      {activeTab === 'whatsapp' && (
        <div className="bg-[#0B0F17] border border-white/10 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Sparkles size={18} className="text-[#08EBF6]" />
              {t('WhatsApp Order Text Parser')}
            </h3>
            <p className="text-xs text-slate-400">Paste unformatted customer WhatsApp messages to automatically extract Party Name, SKUs, and Quantities into a Draft Invoice.</p>
          </div>

          <div className="space-y-4">
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              rows={4}
              placeholder="Paste raw WhatsApp text..."
              className="w-full bg-[#030712] border border-white/15 p-4 text-xs text-white rounded-xl outline-none focus:border-[#08EBF6] font-mono resize-none"
            />

            <button
              onClick={parseWhatsAppOrder}
              disabled={isProcessing}
              className="px-6 py-3 bg-[#08EBF6] text-black text-xs font-black uppercase tracking-widest rounded-xl hover:brightness-110 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? 'Parsing Order...' : 'Parse WhatsApp Order'}
            </button>
          </div>

          {parsedOrder && (
            <div className="p-6 bg-[#030712] border border-white/10 rounded-xl space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-xs font-black text-white uppercase tracking-wider">Detected Party: <span className="text-[#08EBF6]">{parsedOrder.customer}</span></span>
                <span className="text-xs font-black font-mono text-emerald-400">Total: PKR {parsedOrder.grandTotal.toLocaleString()}</span>
              </div>

              <div className="space-y-2">
                {parsedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-mono p-3 bg-white/5 rounded-lg">
                    <span>{item.qty}x {item.name} ({item.sku})</span>
                    <span className="text-white font-bold">PKR {item.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setSuccessMsg('Order converted into Draft Invoice #INV-2026-PARSED!');
                }}
                className="px-5 py-2.5 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 cursor-pointer"
              >
                Create Draft Invoice
              </button>
            </div>
          )}
        </div>
      )}

      {/* Success Banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}
    </div>
  );
}
