import React from 'react';
import { Scissors, ClipboardList, MapPin, Printer } from 'lucide-react';

interface ChalanItem {
  id: string;
  name: string;
  qty: number;
  uom: string;
}

interface ChalanProps {
  id?: string;
  karigarName?: string;
  jobOrderId?: string;
  items?: ChalanItem[];
}

export const KarigarChalanPrint: React.FC<ChalanProps> = ({
  id = 'CH-2024-8842',
  karigarName = 'Master Salim (Embroidery)',
  jobOrderId = 'JO-991',
  items = [
    { id: 'mat-01', name: 'Premium Red Silk Fabric', qty: 285, uom: 'm' },
    { id: 'mat-02', name: 'Zari Thread - Gold L3', qty: 12, uom: 'cones' },
    { id: 'mat-03', name: 'Sequins - Crystal 4mm', qty: 5, uom: 'kg' },
  ]
}) => {
  return (
    <div className="bg-zinc-900 min-h-screen p-12 flex justify-center">
      {/* Print Controls (Hidden on Print) */}
      <div className="fixed top-8 right-8 print:hidden">
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-2xl hover:bg-[#C5A028] transition-all"
        >
          <Printer className="w-4 h-4" /> Finalize & Print A4
        </button>
      </div>

      {/* A4 Sheet Container */}
      {/* 210mm x 297mm @ 96dpi => 794px x 1123px */}
      <div className="w-[210mm] h-[297mm] bg-white text-black p-[20mm] shadow-2xl print:shadow-none print:m-0 flex flex-col font-['Inter']">
        
        {/* Header - Industrial Identity */}
        <header className="flex justify-between items-start border-b-4 border-black pb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Gold She</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Textile Enterprises Ltd.</p>
          </div>
          <div className="text-right">
            <div className="bg-black text-white px-4 py-1 inline-block font-mono text-sm font-bold">
              WORK ORDER CHALAN
            </div>
            <p className="text-xs font-bold mt-2 font-mono">{id}</p>
          </div>
        </header>

        {/* Info Grid */}
        <section className="grid grid-cols-2 gap-12 py-10">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-zinc-400 border-b border-zinc-200 pb-1 flex items-center gap-2">
              <Scissors className="w-3 h-3" /> Assigned Workshop
            </h3>
            <div className="space-y-1">
              <p className="text-lg font-black">{karigarName}</p>
              <p className="text-[10px] uppercase font-bold text-zinc-500">Master Industrial ID: KS-994-A</p>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-zinc-400 border-b border-zinc-200 pb-1 flex items-center gap-2">
              <ClipboardList className="w-3 h-3" /> Job Reference
            </h3>
            <div className="space-y-1">
              <p className="text-lg font-black">{jobOrderId}</p>
              <p className="text-[10px] uppercase font-bold text-zinc-500">Batch Code: ZARI-PR-001</p>
            </div>
          </div>
        </section>

        {/* Main Items Table */}
        <section className="flex-grow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-100 border-y-2 border-black">
                <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest">SR.</th>
                <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest">Item Description</th>
                <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-right">Quantity</th>
                <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-right">UOM</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className="border-b border-zinc-200">
                  <td className="py-4 px-2 font-mono text-xs">{idx + 1}</td>
                  <td className="py-4 px-2">
                    <p className="text-sm font-bold uppercase">{item.name}</p>
                    <p className="text-[9px] text-zinc-500 font-mono italic">Ref: {item.id}</p>
                  </td>
                  <td className="py-4 px-2 text-right font-mono font-bold text-lg">{item.qty}</td>
                  <td className="py-4 px-2 text-right text-[10px] font-bold uppercase">{item.uom}</td>
                </tr>
              ))}
              {/* Fillers for space */}
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-zinc-100 h-12">
                  <td colSpan={4}></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Footer - Signatures & Verification */}
        <footer className="mt-12 space-y-12">
          <div className="grid grid-cols-2 gap-24">
            <div className="space-y-8">
              <div className="border-t border-black pt-2">
                <p className="text-[9px] font-black uppercase text-center">Authorized Signature</p>
                <p className="text-[8px] text-zinc-400 text-center uppercase tracking-tighter mt-1">(Gold She Enterprise Ops)</p>
              </div>
            </div>
            <div className="space-y-8">
              <div className="border-t border-black pt-2">
                <p className="text-[9px] font-black uppercase text-center">Received By (Karigar)</p>
                <p className="text-[8px] text-zinc-400 text-center uppercase tracking-tighter mt-1">(Identity Verification Required)</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 p-6 border-l-4 border-black space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              <p className="text-[9px] font-black uppercase">Workshop Compliance Notice</p>
            </div>
            <p className="text-[8px] text-zinc-600 leading-relaxed uppercase tracking-tight font-bold">
              Items listed above are property of Gold She Textile. Any discrepancy in count or quality 
              must be reported within 2 hours of issuance. Damage/Loss during processing will be 
              deducted as per wastage policy JO-442. This document contains no financial data for 
              workshop privacy.
            </p>
          </div>

          <div className="flex justify-between items-end pt-4 opacity-30">
            <p className="text-[8px] font-mono tracking-widest uppercase">System-Generated: {new Date().toISOString()}</p>
            <p className="text-[8px] font-mono uppercase">Page 1 of 1</p>
          </div>
        </footer>
      </div>
    </div>
  );
};
