import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { Download, Printer } from 'lucide-react';
import type { Product } from '../../types/database';
import { sovereign } from '../../lib/SovereignCore';

interface LabelPreviewProps {
  product: Product;
}

export const LabelPreview = ({ product }: LabelPreviewProps) => {
  const labelRef = useRef<HTMLDivElement>(null);

  /**
   * Beyond AI Engineering: High-Fidelity Export Logic
   * We use pixelRatio: 3 to ensure the output is 300DPI equivalent,
   * which is critical for industrial thermal scanner readability.
   */
  const handleDownload = async () => {
    if (!labelRef.current) return;

    try {
      // Ensure fonts are loaded before capture
      await document.fonts.ready;

      const dataUrl = await toPng(labelRef.current, {
        pixelRatio: 3,
        quality: 1,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `label-${product.qr_code}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Preview Container */}
      <div className="flex justify-center bg-zinc-950 p-8 rounded-xl border border-zinc-900 shadow-inner">
        {/* The Actual Label - This is what gets exported and printed */}
        <div 
          ref={labelRef}
          className="w-[400px] bg-white p-6 shadow-2xl print:shadow-none"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {/* Header: Brand Governance */}
          <div className="border-b-2 border-zinc-900 pb-3 mb-4 flex justify-between items-end">
            <div>
              <h1 className="text-[#D4AF37] text-xl font-serif font-black tracking-tighter leading-none">
                GOLD SHE
              </h1>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1">
                Premium Textile Manufacturing
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-zinc-900">CERTIFIED BATCH</p>
              <p className="text-[8px] text-zinc-500">{new Date(product.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Body: High-Density QR Engine */}
          <div className="flex gap-6 items-center">
            <div className="bg-white p-1 border border-zinc-100">
              <QRCodeSVG 
                value={product.qr_code} 
                size={120} 
                level="H" 
                includeMargin={false}
              />
            </div>
            
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-[7px] font-bold text-zinc-400 uppercase tracking-widest">Product Descriptor</p>
                <p className="text-xs font-bold text-zinc-900 uppercase leading-tight">{product.item_name}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-[7px] font-bold text-zinc-400 uppercase tracking-widest">
                    {product.item_category === 'Fabric' ? 'Quantity' : 'Batch Valuation'}
                  </p>
                  <p className="text-sm font-black text-zinc-900">
                    {product.item_category === 'Fabric' 
                      ? `${product.total_gaz.toFixed(2)} GAZ` 
                      : sovereign.formatPKR(product.grand_total)}
                  </p>
                </div>
                <div>
                  <p className="text-[7px] font-bold text-zinc-400 uppercase tracking-widest">Category</p>
                  <p className="text-[10px] font-bold text-zinc-900 uppercase">{product.item_category}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer: Industrial Metadata */}
          <div className="mt-6 pt-3 border-t border-dashed border-zinc-300 flex justify-between items-center">
            <div>
              <p className="text-[7px] font-bold text-zinc-400 uppercase">Production ID</p>
              <p className="text-[10px] font-mono font-bold text-zinc-950">{product.qr_code}</p>
            </div>
            <div className="bg-zinc-900 px-3 py-1 rounded-sm">
              <p className="text-[8px] font-bold text-white tracking-widest uppercase">V1-SECURE</p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Controls */}
      <div className="flex gap-3">
        <button 
          onClick={handleDownload}
          className="flex-1 bg-electric-blue hover:bg-electric-blue-600 text-zinc-950 font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Download className="w-4 h-4" />
          Download Production Label (PNG)
        </button>
        <button 
          onClick={() => window.print()}
          className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-lg border border-zinc-800 flex items-center gap-2 transition-all"
        >
          <Printer className="w-4 h-4" />
          Thermal Print
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}} />
    </div>
  );
};
