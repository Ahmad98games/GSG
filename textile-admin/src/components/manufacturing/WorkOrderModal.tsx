'use client';

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X } from 'lucide-react';
import { AnalyticsEngine } from '../../services/AnalyticsEngine';

interface WorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchData: {
    id: string;
    article_id: string;
    article_name: string;
    total_gaz: number;
    karigar_name: string;
  };
}

export const WorkOrderModal: React.FC<WorkOrderModalProps> = ({ isOpen, onClose, batchData }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const { suits: expectedSuits } = AnalyticsEngine.calculateIndustrialYield(batchData.total_gaz, false);

  const handlePrint = () => {
    const printContent = printRef.current;
    const windowPrint = window.open('', '', 'width=400,height=600');
    if (windowPrint && printContent) {
      windowPrint.document.write('<html><head><title>Thermal Work Order</title>');
      windowPrint.document.write('<style>@font-face { font-family: "JetBrains Mono"; src: local("JetBrains Mono"); } body { font-family: "JetBrains Mono", monospace; padding: 20px; color: black; }</style>');
      windowPrint.document.write('</head><body>');
      windowPrint.document.write(printContent.innerHTML);
      windowPrint.document.write('</body></html>');
      windowPrint.document.close();
      windowPrint.focus();
      windowPrint.print();
      windowPrint.close();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0F1113] border border-white/5 w-full max-w-md rounded-[2px] overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Printer className="w-4 h-4 text-electric-blue" />
            <h3 className="text-electric-blue text-[10px] font-black uppercase tracking-[.3em] font-mono">
              Thermal Slip Engine
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content / Preview */}
        <div className="p-8 space-y-8">
          <div 
            ref={printRef}
            className="bg-white p-6 text-black font-mono space-y-6 shadow-inner"
          >
            <div className="text-center border-b-2 border-black pb-4">
              <h1 className="text-xl font-black uppercase leading-tight">GOLD SHE</h1>
              <p className="text-[10px] font-bold">INDUSTRIAL WORK ORDER</p>
            </div>

            <div className="space-y-4 text-xs font-bold uppercase">
              <div className="flex justify-between border-b border-black/10 pb-2">
                <span>Article:</span>
                <span>{batchData.article_name}</span>
              </div>
              <div className="flex justify-between border-b border-black/10 pb-2">
                <span>Code:</span>
                <span>{batchData.article_id}</span>
              </div>
              <div className="flex justify-between border-b border-black/10 pb-2 text-sm">
                <span>Karigar:</span>
                <span className="bg-black text-white px-2">{batchData.karigar_name}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y-2 border-black">
              <div className="text-center">
                <p className="text-[9px] font-black opacity-50 uppercase">Total Gaz</p>
                <p className="text-lg font-black">{batchData.total_gaz.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-black opacity-50 uppercase">Exp. Suits</p>
                <p className="text-lg font-black underline decoration-2">{expectedSuits}</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <QRCodeSVG 
                value={`GS-ORD:${batchData.id}`} 
                size={120} 
                level="H" 
                includeMargin={false}
              />
              <p className="text-[8px] font-black tracking-widest bg-black text-white px-3 py-1">
                CMD_ID: {batchData.id.slice(0, 8)}
              </p>
            </div>

            <div className="text-[8px] text-center italic opacity-40 pt-4 border-t border-black/10">
              Generated: {new Date().toLocaleString()} // SECURITY: VERIFIED
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="w-full bg-electric-blue text-base-p text-xs font-black uppercase tracking-[0.5em] py-5 hover:bg-electric-blue/90 transition-all rounded-[2px] shadow-2xl flex items-center justify-center gap-4"
          >
            <Printer className="w-5 h-5" />
            Print Thermal Slip
          </button>
        </div>
      </div>
    </div>
  );
};
