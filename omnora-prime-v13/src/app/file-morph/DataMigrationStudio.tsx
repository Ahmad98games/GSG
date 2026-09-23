"use client";

import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  ArrowRight, 
  CheckCircle2, 
  MessageSquare, 
  Database,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

export function DataMigrationStudio() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'tally' | 'sku' | 'whatsapp'>('tally');
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
    reader.onload = () => {
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
    }, 250);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Tab Selector */}
      <div className="flex gap-2">
        {[
          { id: 'tally', label: t('Tally / QuickBooks Importer'), icon: Database },
          { id: 'sku', label: t('Excel Price List SKU Mapper'), icon: FileSpreadsheet },
          { id: 'whatsapp', label: t('WhatsApp Order Parser'), icon: MessageSquare },
        ].map(tTab => (
          <button
            key={tTab.id}
            onClick={() => setActiveTab(tTab.id as any)}
            className={cn(
              'h-8 px-3 flex items-center gap-2 text-xs font-medium rounded-[4px] border transition-colors duration-100 cursor-pointer',
              activeTab === tTab.id
                ? 'bg-white/[0.08] border-white/20 text-white'
                : 'bg-[#131823] border-white/[0.08] text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
            )}
          >
            <tTab.icon size={14} strokeWidth={1.5} className={activeTab === tTab.id ? 'text-slate-200' : 'text-slate-500'} />
            <span>{tTab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Tally / QuickBooks Importer */}
      {activeTab === 'tally' && (
        <div className="bg-[#131823] border border-white/[0.08] rounded-[6px] p-5 space-y-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-medium text-white">{t('Tally & Accounting Ledger Migration')}</h3>
            <p className="text-xs text-slate-400 font-normal">Import CSV or Excel ledger exports from Tally, Marg ERP, or Vyapar to auto-populate Noxis parties and opening balances.</p>
          </div>

          <div className="border border-dashed border-white/[0.12] rounded-[6px] p-6 text-center space-y-3 bg-[#0B0E14]/40 hover:border-white/20 transition-colors duration-100">
            <Upload size={20} strokeWidth={1.5} className="mx-auto text-slate-400" />
            <div>
              <p className="text-xs font-medium text-slate-200">{t('Drag and drop your accounting CSV/XLSX export')}</p>
              <p className="text-[11px] text-slate-500 font-normal mt-0.5">Supports UTF-8 CSV and XLSX spreadsheets</p>
            </div>
            <label className="inline-flex items-center h-8 px-3 bg-white text-slate-950 text-xs font-medium rounded-[4px] hover:bg-slate-100 transition-colors duration-100 cursor-pointer">
              <span>{t('Browse Files')}</span>
              <input type="file" accept=".csv,.xlsx" onChange={handleTallyUpload} className="hidden" />
            </label>
          </div>

          {mappedRows.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-slate-300">Parsed Parties Preview ({mappedRows.length} Accounts Found)</h4>
              <div className="bg-[#0B0E14] border border-white/[0.08] rounded-[4px] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse font-mono tabular-nums">
                  <thead className="bg-[#0E121B] text-slate-400 text-[11px] font-medium border-b border-white/[0.08]">
                    <tr>
                      <th className="px-3.5 py-2">Account Code</th>
                      <th className="px-3.5 py-2 font-sans font-medium">Party Name</th>
                      <th className="px-3.5 py-2">Type</th>
                      <th className="px-3.5 py-2 text-right">Opening Balance (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {mappedRows.map((r, idx) => (
                      <tr key={idx} className="h-9 hover:bg-white/[0.02] transition-colors duration-100">
                        <td className="px-3.5 py-2 text-slate-400">{r.code}</td>
                        <td className="px-3.5 py-2 text-slate-200 font-sans font-medium">{r.name}</td>
                        <td className="px-3.5 py-2 text-slate-400">{r.type}</td>
                        <td className="px-3.5 py-2 text-right text-slate-200">{r.balance.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={() => {
                  setSuccessMsg('Successfully imported party accounts and opening balances into Noxis Khata.');
                }}
                className="h-8 px-3 bg-white text-slate-950 text-xs font-medium rounded-[4px] hover:bg-slate-100 transition-colors duration-100 cursor-pointer"
              >
                Commit &amp; Import into Khata
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Excel Price List SKU Mapper */}
      {activeTab === 'sku' && (
        <div className="bg-[#131823] border border-white/[0.08] rounded-[6px] p-5 space-y-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-medium text-white">{t('Excel Price List SKU Mapper')}</h3>
            <p className="text-xs text-slate-400 font-normal">Map supplier price list spreadsheets directly into active Noxis inventory items.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#0B0E14] border border-white/[0.08] rounded-[4px] space-y-2.5">
              <span className="text-xs font-medium text-slate-300">Spreadsheet Source Column</span>
              <div className="space-y-1.5 text-xs font-mono tabular-nums">
                <div className="flex justify-between items-center px-2.5 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-[4px] text-slate-300">
                  <span>Column A: Item_Code</span>
                  <ArrowRight size={13} strokeWidth={1.5} className="text-slate-500" />
                </div>
                <div className="flex justify-between items-center px-2.5 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-[4px] text-slate-300">
                  <span>Column B: Product_Description</span>
                  <ArrowRight size={13} strokeWidth={1.5} className="text-slate-500" />
                </div>
                <div className="flex justify-between items-center px-2.5 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-[4px] text-slate-300">
                  <span>Column C: Wholesale_Rate</span>
                  <ArrowRight size={13} strokeWidth={1.5} className="text-slate-500" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#0B0E14] border border-white/[0.08] rounded-[4px] space-y-2.5">
              <span className="text-xs font-medium text-slate-300">Target Schema Field</span>
              <div className="space-y-1.5 text-xs font-mono tabular-nums">
                <div className="px-2.5 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-[4px] text-slate-300">Target: SKU Code</div>
                <div className="px-2.5 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-[4px] text-slate-300">Target: Item Name</div>
                <div className="px-2.5 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-[4px] text-slate-300">Target: Unit Cost</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: WhatsApp Text Order Parser */}
      {activeTab === 'whatsapp' && (
        <div className="bg-[#131823] border border-white/[0.08] rounded-[6px] p-5 space-y-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <Sparkles size={15} strokeWidth={1.5} className="text-slate-400" />
              {t('WhatsApp Order Parser')}
            </h3>
            <p className="text-xs text-slate-400 font-normal">Extract party name, SKUs, and quantities from unstructured messages into a draft invoice.</p>
          </div>

          <div className="space-y-3">
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              rows={3}
              placeholder="Paste message text..."
              className="w-full bg-[#0B0E14] border border-white/[0.08] p-3 text-xs text-slate-200 rounded-[4px] outline-none focus:border-white/20 font-mono resize-none"
            />

            <button
              onClick={parseWhatsAppOrder}
              disabled={isProcessing}
              className="h-8 px-3 bg-white text-slate-950 text-xs font-medium rounded-[4px] hover:bg-slate-100 transition-colors duration-100 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? 'Parsing...' : 'Parse Order Text'}
            </button>
          </div>

          {parsedOrder && (
            <div className="p-4 bg-[#0B0E14] border border-white/[0.08] rounded-[4px] space-y-3">
              <div className="flex justify-between items-center border-b border-white/[0.08] pb-2 text-xs">
                <span className="text-slate-300 font-medium">Customer: <span className="text-white">{parsedOrder.customer}</span></span>
                <span className="font-mono tabular-nums text-slate-200">Total: PKR {parsedOrder.grandTotal.toLocaleString()}</span>
              </div>

              <div className="space-y-1">
                {parsedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-mono tabular-nums px-2.5 py-1.5 bg-white/[0.02] rounded-[4px]">
                    <span className="text-slate-300">{item.qty}x {item.name} ({item.sku})</span>
                    <span className="text-slate-200 font-medium">PKR {item.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setSuccessMsg('Order converted into Draft Invoice #INV-2026-PARSED');
                }}
                className="h-8 px-3 bg-white/[0.06] border border-white/[0.12] text-slate-200 hover:bg-white/[0.1] text-xs font-medium rounded-[4px] transition-colors duration-100 cursor-pointer"
              >
                Create Draft Invoice
              </button>
            </div>
          )}
        </div>
      )}

      {/* Success Banner */}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-[4px] text-xs font-normal flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} strokeWidth={1.5} />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
        </div>
      )}
    </div>
  );
}
