import React, { useState, useMemo } from 'react';
import { 
  ArrowDown, Search, RefreshCw, 
  FileText, Download, CheckCircle2, 
  Keyboard, Zap, Calculator, Plus, 
  ArrowRightLeft, Camera, X
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface LedgerEntry {
  id: string;
  date: string;
  party: string;
  articleId: string; // Linked Article
  articleName?: string;
  articleImage?: string | null;
  setProtocol?: number;
  unitType: 'GAZ' | 'SET';
  quantity: number;
  type: 'debit' | 'credit';
  amount: number;
  status: 'reconciled' | 'pending' | 'disputed';
  reference: string;
}

export const KhataModule: React.FC = () => {
  const [data] = useState<LedgerEntry[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [reconciliationMode, setReconciliationMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  
  // New Transaction Form State
  const [form, setForm] = useState({
    party: '',
    articleId: '',
    articleName: '',
    articleImage: null as string | null,
    setProtocol: 6,
    unitType: 'SET' as 'GAZ' | 'SET',
    quantity: 0,
    type: 'debit' as 'debit' | 'credit',
    amount: 0,
    reference: ''
  });

  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.party.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const totals = useMemo(() => {
    return filteredData.reduce((acc, curr) => {
      if (curr.type === 'debit') acc.debit += curr.amount;
      else acc.credit += curr.amount;
      return acc;
    }, { debit: 0, credit: 0 });
  }, [filteredData]);

  // Keyboard Navigation Logic
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const { row, col } = focusedCell;
    const maxRows = filteredData.length - 1;
    const maxCols = 5; // ID, Date, Party, Type, Amount, Status

    if (e.key === 'ArrowDown') setFocusedCell({ row: Math.min(row + 1, maxRows), col });
    if (e.key === 'ArrowUp') setFocusedCell({ row: Math.max(row - 1, 0), col });
    if (e.key === 'ArrowRight') setFocusedCell({ row, col: Math.min(col + 1, maxCols) });
    if (e.key === 'ArrowLeft') setFocusedCell({ row, col: Math.max(col - 1, 0) });
    if (e.key === 'Enter') setSelectedId(filteredData[row].id);
  };

  const handleNewTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const deductionFactor = form.unitType === 'SET' ? form.setProtocol : 1;
    const piecesEffect = form.quantity * deductionFactor;

    const newEntry: LedgerEntry = {
      id: `TX-${Math.floor(Math.random() * 100000)}`,
      date: new Date().toISOString().split('T')[0],
      party: form.party,
      articleId: form.articleId,
      articleName: form.articleName,
      articleImage: form.articleImage,
      setProtocol: form.setProtocol,
      unitType: form.unitType,
      quantity: form.quantity,
      type: form.type,
      amount: form.amount,
      status: 'pending',
      reference: form.reference
    };
    
    console.log(`Committing Transaction Protocol:`, newEntry);
    console.log(`Deducting ${piecesEffect} units from Article ${form.articleId} registry...`);
    alert(`WHOLESALE PROTOCOL: Transaction committed. Effect: ${form.quantity} ${form.unitType} => ${piecesEffect} PIECES ${form.type === 'debit' ? 'REMOVED' : 'ADDED'}.`);
    
    setShowTransactionForm(false);
    setForm({
      party: '', articleId: '', articleName: '', articleImage: null, setProtocol: 6,
      unitType: 'SET', quantity: 0, type: 'debit', amount: 0, reference: ''
    });
  };

  const exportVoucher = (id: string) => {
    console.log(`Generating PDF Voucher for ${id}...`);
    alert(`Voucher ${id} exported to PDF.`);
  };

  return (
    <div className="h-full flex flex-col space-y-2 animate-in fade-in duration-500" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Stock Ledger Header Bar */}
      <div className="bg-base-s border border-white/5 px-4 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-black text-white tracking-[0.2em] flex items-center gap-2 uppercase">
            <Zap className="w-4 h-4 text-electric-blue" />
            Stock Ledger
          </h2>
          <div className="h-5 w-[1px] bg-white/5" />
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input 
                type="text"
                placeholder="Search ledger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-base-p border border-white/5 pl-9 pr-4 py-1.5 text-xs text-zinc-300 focus:border-electric-blue/50 outline-none w-56 font-mono tracking-tighter"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowTransactionForm(true)}
            className="flex items-center gap-2 px-6 py-2 bg-electric-blue text-base-p rounded-[2px] text-xs font-black uppercase shadow-[0_0_30px_rgba(96,165,250,0.1)] hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Record
          </button>
          <button 
            onClick={() => setReconciliationMode(!reconciliationMode)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border rounded-[2px] text-xs font-bold uppercase transition-all",
              reconciliationMode ? "bg-electric-blue/10 border-electric-blue/40 text-electric-blue shadow-[0_0_20px_rgba(96,165,250,0.05)]" : "bg-base-p border-white/5 text-zinc-600 hover:border-white/10"
            )}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", reconciliationMode && "animate-spin")} />
            {reconciliationMode ? "Auditing..." : "Audit Records"}
          </button>
          <div className="flex items-center gap-2 bg-base-p px-3 py-2 border border-white/5 rounded-[2px]">
            <Keyboard className="w-3.5 h-3.5 text-zinc-700" />
            <span className="text-[10px] text-zinc-700 font-black uppercase tracking-widest italic">Live Keys</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-2 min-h-0 overflow-hidden">
        {/* Main Data Grid (Bloomberg Style) */}
        <div className="flex-1 bg-base-p border border-white/5 overflow-hidden flex flex-col relative shadow-2xl">
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full border-collapse text-left select-none table-fixed">
              <thead className="sticky top-0 z-10 bg-base-s border-b border-white/5">
                <tr className="divide-x divide-white/5">
                {['Record_ID', 'Date', 'Product_Link', 'Flow', 'Quantity', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-black text-zinc-600 uppercase tracking-widest bg-base-s">
                    <div className="flex items-center justify-between">
                      {h}
                      <ArrowDown className="w-3 h-3 opacity-20" />
                    </div>
                  </th>
                ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#18181b]">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-10">
                        <Calculator className="w-16 h-16 text-electric-blue" />
                        <p className="text-xs font-mono uppercase italic tracking-[0.4em] text-electric-blue">
                          Database Clear: No Records
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, rowIndex) => (
                    <tr 
                      key={row.id}
                      onClick={() => setSelectedId(row.id)}
                      className={cn(
                        "divide-x divide-white/[0.02] hover:bg-electric-blue/[0.03] cursor-pointer group transition-all h-9 border-b border-white/[0.02]",
                        selectedId === row.id ? "bg-electric-blue/[0.06] shadow-[inset_3px_0_0_0_#60A5FA]" : "bg-transparent",
                        reconciliationMode && row.status === 'pending' && "bg-red-500/[0.03] animate-pulse"
                      )}
                    >
                      {[
                        row.id,
                        row.date,
                        row.articleId,
                        row.type.toUpperCase(),
                        `${row.quantity} ${row.unitType}`,
                        row.status.toUpperCase()
                      ].map((cell, colIndex) => (
                        <td 
                          key={colIndex}
                          className={cn(
                            "px-4 text-[11px] font-mono tracking-tighter uppercase transition-colors",
                            focusedCell.row === rowIndex && focusedCell.col === colIndex && "bg-electric-blue/10 text-white z-20",
                            colIndex === 3 ? (cell === 'DEBIT' ? 'text-red-500' : 'text-green-500') : 'text-zinc-500',
                            colIndex === 4 && "font-bold text-zinc-200",
                            colIndex === 5 && (cell === 'RECONCILED' ? 'text-blue-500' : 'text-orange-500'),
                            (selectedId === row.id || (focusedCell.row === rowIndex && focusedCell.col === colIndex)) && "text-zinc-200"
                          )}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Dynamic Aggregation Footer */}
          <div className="bg-base-s border-t border-white/5 px-6 py-3 flex items-center justify-between text-xs font-bold shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-12">
              <div className="flex items-center gap-3">
                <span className="text-zinc-600 uppercase tracking-widest text-[10px]">Net Sales:</span>
                <span className="text-red-500 font-mono text-sm tracking-tighter">Rs. {totals.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center gap-3 border-l border-white/5 pl-12">
                <span className="text-zinc-600 uppercase tracking-widest text-[10px]">Net Stock:</span>
                <span className="text-green-500 font-mono text-sm tracking-tighter">Rs. {totals.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-electric-blue/5 border border-electric-blue/20 text-electric-blue rounded-[2px] uppercase italic text-[10px] tracking-widest font-black">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sync Active
            </div>
          </div>
        </div>

        {/* Record Details Panel */}
        <div className={cn(
          "w-80 bg-base-s border border-white/5 transition-all duration-500 flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.4)]",
          selectedId ? "mr-0 opacity-100" : "-mr-96 opacity-0"
        )}>
          {selectedId && (
            <div className="flex flex-col h-full">
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Record Details</h3>
                <button onClick={() => setSelectedId(null)} className="text-zinc-600 hover:text-white transition-colors">
                  <RefreshCw className="w-4 h-4 rotate-45" />
                </button>
              </div>
              
              <div className="flex-1 p-8 space-y-8">
                <div className="space-y-1">
                      <div className="p-8 bg-base-p border border-white/5 rounded-[2px] text-center flex flex-col items-center gap-6 relative overflow-hidden group">
                        {data.find(d => d.id === selectedId)?.articleImage && (
                          <img 
                            src={data.find(d => d.id === selectedId)?.articleImage || ''} 
                            className="absolute inset-0 w-full h-full object-cover opacity-5 grayscale group-hover:opacity-10 transition-opacity" 
                            alt="article"
                          />
                        )}
                        <div className="p-4 bg-electric-blue/10 rounded-full relative z-10">
                          <FileText className="w-8 h-8 text-electric-blue" />
                        </div>
                        <div className="relative z-10">
                          <span className="text-2xl font-mono font-black text-white block tracking-tighter">Rs. {(data.find(d => d.id === selectedId)?.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-2 block">Value</span>
                        </div>
                      </div>
                </div>

                <div className="grid gap-5">
                  {[
                    { label: 'Reference ID', val: selectedId },
                    { label: 'Saved On', val: data.find(d => d.id === selectedId)?.date },
                    { label: 'Product Code', val: data.find(d => d.id === selectedId)?.articleId },
                    { label: 'Units', val: data.find(d => d.id === selectedId)?.unitType },
                    { label: 'Quantity', val: data.find(d => d.id === selectedId)?.quantity },
                    { label: 'Details', val: data.find(d => d.id === selectedId)?.reference },
                  ].map(item => (
                    <div key={item.label} className="border-b border-white/5 pb-3 flex justify-between items-center text-[11px]">
                      <span className="font-bold text-zinc-600 uppercase tracking-widest">{item.label}</span>
                      <span className="font-mono text-zinc-200 uppercase tracking-tighter">{item.val}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-electric-blue/[0.03] border border-electric-blue/10 p-5 rounded-[2px] text-[10px] text-zinc-500 italic leading-relaxed">
                  This record is secured and verified. No further edits are permitted to maintain data integrity.
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 gap-2 border-t border-white/5">
                <button 
                  onClick={() => exportVoucher(selectedId)}
                  className="w-full py-4 bg-electric-blue hover:bg-electric-blue/90 text-base-p font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Save PDF Receipt
                </button>
                <p className="text-[9px] text-center text-zinc-700 uppercase mt-4 tracking-[0.2em] font-black">Authorized Record</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add New Entry Overlay */}
      {showTransactionForm && (
        <div className="absolute inset-0 bg-base-p/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="w-[540px] bg-base-s border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)] flex flex-col animate-in zoom-in-95 duration-300 rounded-[2px]">
            <div className="px-8 py-5 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-black text-white italic tracking-[0.3em] flex items-center gap-4 uppercase">
                <Plus className="w-5 h-5 text-electric-blue" />
                Add New Record
              </h3>
              <button onClick={() => setShowTransactionForm(false)} className="text-zinc-600 hover:text-white transition-all transform hover:rotate-90">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleNewTransaction} className="p-10 space-y-8">
              <div className="flex items-center gap-6 p-5 bg-base-p border border-white/5 rounded-[2px] animate-in slide-in-from-bottom-2 duration-500">
                {form.articleImage ? (
                  <img src={form.articleImage} className="w-20 h-20 object-cover rounded-[2px] border border-electric-blue/40 shadow-[0_0_20px_rgba(96,165,250,0.1)]" />
                ) : (
                  <div className="w-20 h-20 bg-base-s border border-dashed border-white/10 rounded-[2px] flex items-center justify-center">
                    <Camera className="w-8 h-8 text-zinc-800" />
                  </div>
                )}
                <div>
                  <p className="text-xs font-extrabold text-white uppercase tracking-widest">{form.articleName || 'Awaiting Product Link...'}</p>
                  <p className="text-[10px] font-black text-electric-blue uppercase tracking-[0.3em] mt-2">
                    {form.articleId ? `${form.articleId} • ${form.setProtocol} Pieces Protocol` : 'Pending Selection'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Party / Client Name</label>
                  <input 
                    type="text" required placeholder="Consignee Name"
                    value={form.party}
                    onChange={(e) => setForm({...form, party: e.target.value})}
                    className="w-full bg-base-p border border-white/5 p-4 text-xs text-white focus:border-electric-blue/40 outline-none font-bold uppercase rounded-[2px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-electric-blue uppercase tracking-[0.2em] italic">Product Code (Art ID)</label>
                  <div className="relative">
                    <input 
                      type="text" required placeholder="GS-ART-XXXX"
                      value={form.articleId}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setForm({...form, articleId: val});
                        if (val.length >= 10) {
                          setForm(prev => ({
                            ...prev,
                            articleId: val,
                            articleName: 'Khaadi Premium Lawn 2026',
                            articleImage: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=200', 
                            setProtocol: 6
                          }));
                        }
                      }}
                      className="w-full bg-base-p border border-electric-blue/20 p-4 text-xs text-white focus:border-electric-blue/60 outline-none font-black uppercase tracking-[0.3em] pr-12 rounded-[2px] shadow-[inset_0_0_20px_rgba(96,165,250,0.02)]"
                    />
                    <Zap className={cn("w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 transition-colors", form.articleName ? "text-electric-blue animate-pulse" : "text-zinc-800")} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Unit Type</label>
                  <select 
                    value={form.unitType}
                    onChange={(e) => setForm({...form, unitType: e.target.value as 'GAZ'|'SET'})}
                    className="w-full bg-base-p border border-white/5 p-4 text-xs text-white focus:border-electric-blue/40 outline-none font-black uppercase rounded-[2px]"
                  >
                    <option value="SET">Set-wise</option>
                    <option value="GAZ">Gaz (Yards)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Quantity</label>
                  <input 
                    type="number" required min="0" step="0.01"
                    value={form.quantity}
                    onChange={(e) => setForm({...form, quantity: parseFloat(e.target.value)})}
                    className="w-full bg-base-p border border-white/5 p-4 text-xs text-white focus:border-electric-blue/40 outline-none font-bold rounded-[2px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Action</label>
                  <select 
                    value={form.type}
                    onChange={(e) => setForm({...form, type: e.target.value as 'debit'|'credit'})}
                    className="w-full bg-base-p border border-white/5 p-4 text-xs text-electric-blue focus:border-electric-blue/40 outline-none font-black uppercase italic rounded-[2px]"
                  >
                    <option value="debit">Sale (Debit)</option>
                    <option value="credit">Purchase (Credit)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em]">Transaction Total (PKR)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-electric-blue font-mono text-xl font-black">Rs.</span>
                  <input 
                    type="number" required min="0" placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({...form, amount: parseFloat(e.target.value)})}
                    className="w-full bg-base-p border border-white/5 pl-16 pr-6 py-5 text-2xl text-electric-blue focus:border-electric-blue/40 outline-none font-mono font-black rounded-[2px] shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-electric-blue hover:bg-electric-blue/90 text-base-p font-black uppercase text-xs tracking-[0.5em] flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all transform active:scale-[0.98]"
              >
                <ArrowRightLeft className="w-5 h-5" />
                Save Business Record
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
