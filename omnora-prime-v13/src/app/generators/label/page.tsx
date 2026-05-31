"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Tag, Download, Printer, ChevronLeft, 
  Search, Package, Settings, Eye,
  Maximize2, Box, Barcode as BarcodeIcon
} from "lucide-react";

import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import Link from "next/link";
import JsBarcode from "jsbarcode";

type LabelSize = '50x30' | '70x40' | '100x50';

export default function StockLabelGenerator() {
  const { profile } = useBusinessProfile();
  const { fmt, businessId } = usePersona();
  const supabase = createClient();
  

  const [size, setSize] = useState<LabelSize>('50x30');
  const [selectedSku, setSelectedSku] = useState<any>(null);
  const [skuSearch, setSkuSearch] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showPrice, setShowPrice] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string>("");
  const barcodeRef = useRef<SVGSVGElement>(null);

  const { data: skus = [] } = useQuery({
    queryKey: ['skus-search-labels', skuSearch],
    queryFn: async () => {
      if (!skuSearch || skuSearch.length < 2) return [];
      const { data } = await supabase
        .from('skus')
        .select('*')
        .eq('business_id', businessId)
        .ilike('name', `%${skuSearch}%`)
        .limit(5);
      return data || [];
    },
    enabled: !!businessId && skuSearch.length >= 2
  });

  useEffect(() => {
    if (selectedSku && showBarcode && barcodeRef.current) {
      JsBarcode(barcodeRef.current, selectedSku.sku_code || "000000", {
        format: "CODE128",
        width: 2,
        height: 40,
        displayValue: false,
        margin: 0
      });
      
      // Generate data URL for print layout
      const svg = barcodeRef.current;
      const xml = new XMLSerializer().serializeToString(svg);
      const svg64 = btoa(xml);
      const b64Start = 'data:image/svg+xml;base64,';
      setBarcodeDataUrl(b64Start + svg64);
    }
  }, [selectedSku, showBarcode, size]);

  const labelDimensions = {
    '50x30': { w: '300px', h: '180px', mmW: 50, mmH: 30 },
    '70x40': { w: '420px', h: '240px', mmW: 70, mmH: 40 },
    '100x50': { w: '600px', h: '300px', mmW: 100, mmH: 50 }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200">
      
      
      <main className="transition-all duration-300 min-h-screen flex flex-col print:p-0">
        <div className="p-8 max-w-[1200px] mx-auto w-full space-y-8 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/generators" className="p-2 bg-white/5 rounded-sm hover:bg-white/10 transition-colors">
                <ChevronLeft size={20} />
              </Link>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Stock Label</h1>
                <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-bold mt-1">
                  Industrial grade product and shelf labels
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Form Side */}
            <div className="glass-panel p-8 space-y-8">
              <h3 className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-electric-blue pl-3">Label Configuration</h3>
              
              <div className="space-y-6">
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Select Product / SKU</label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={skuSearch}
                      onChange={(e) => setSkuSearch(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50"
                      placeholder="Search name or code..."
                    />
                    {skuSearch.length >= 2 && skus.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-[#1A1D21] border border-white/10 z-50 mt-1 shadow-2xl">
                        {skus.map((s: any) => (
                          <button 
                            key={s.id}
                            onClick={() => {
                              setSelectedSku(s);
                              setSkuSearch(s.name);
                            }}
                            className="w-full px-4 py-2 text-left text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                          >
                            {s.name} ({s.sku_code})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Label Size</label>
                    <select 
                      value={size}
                      onChange={(e) => setSize(e.target.value as LabelSize)}
                      className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                    >
                      <option value="50x30">50 x 30 mm</option>
                      <option value="70x40">70 x 40 mm</option>
                      <option value="100x50">100 x 50 mm</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Quantity</label>
                    <input 
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={showPrice}
                      onChange={(e) => setShowPrice(e.target.checked)}
                      className="w-4 h-4 rounded-sm bg-white/5 border-white/10 text-electric-blue focus:ring-0"
                    />
                    <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-white transition-colors">Show Price</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={showBarcode}
                      onChange={(e) => setShowBarcode(e.target.checked)}
                      className="w-4 h-4 rounded-sm bg-white/5 border-white/10 text-electric-blue focus:ring-0"
                    />
                    <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-white transition-colors">Show Barcode</span>
                  </label>
                </div>
              </div>

              <div className="pt-8 flex justify-end">
                <button 
                  onClick={handlePrint}
                  disabled={!selectedSku}
                  className="bg-electric-blue text-white px-12 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all flex items-center space-x-3"
                >
                  <Printer size={16} />
                  <span>Print Labels</span>
                </button>
              </div>
            </div>

            {/* Preview Side */}
            <div className="space-y-8">
              <h3 className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-electric-blue pl-3">Live Preview</h3>
              
              <div className="glass-panel p-12 flex flex-col items-center justify-center min-h-[400px] bg-white/5">
                {selectedSku ? (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ 
                      width: labelDimensions[size].w, 
                      height: labelDimensions[size].h 
                    }}
                    className="bg-white text-black p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden"
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">{profile?.business_name}</p>
                        <p className="text-[8px] font-mono text-gray-400 uppercase">{selectedSku.sku_code}</p>
                      </div>
                      <h2 className={cn(
                        "font-black uppercase tracking-tighter leading-tight",
                        size === '100x50' ? "text-2xl" : "text-lg"
                      )}>
                        {selectedSku.name}
                      </h2>
                    </div>

                    <div className="flex justify-between items-end">
                      {showBarcode && (
                         <div className="flex flex-col">
                            <svg ref={barcodeRef}></svg>
                            <span className="text-[8px] font-mono mt-1">{selectedSku.sku_code}</span>
                         </div>
                      )}
                      
                      {showPrice && (
                        <div className="text-right">
                          <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Price</p>
                          <p className="text-xl font-black font-mono leading-none">{fmt(selectedSku.sale_price || 0)}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center space-y-4 opacity-20">
                    <Tag size={80} strokeWidth={1} />
                    <p className="text-xs font-black uppercase tracking-[0.2em]">Select SKU to Preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Print Layout */}
        <div className="hidden print:grid print:grid-cols-4 print:gap-4 print:p-8 bg-white text-black">
          {Array.from({ length: quantity }).map((_, i) => (
            <div 
              key={i}
              style={{ 
                width: `${labelDimensions[size].mmW}mm`, 
                height: `${labelDimensions[size].mmH}mm` 
              }}
              className="border border-gray-100 p-2 flex flex-col justify-between overflow-hidden"
            >
               <div className="space-y-0.5">
                  <p className="text-[6px] font-black uppercase text-gray-400">{profile?.business_name}</p>
                  <h2 className="text-[10px] font-black uppercase leading-tight">{selectedSku?.name}</h2>
               </div>
               <div className="flex justify-between items-end">
                   {showBarcode && barcodeDataUrl && (
                     <div className="flex flex-col scale-75 origin-left">
                        <img 
                           src={barcodeDataUrl} 
                           className="h-6"
                        />
                        <span className="text-[6px] font-mono">{selectedSku?.sku_code}</span>
                     </div>
                  )}
                  {showPrice && (
                    <p className="text-xs font-black font-mono">{fmt(selectedSku?.sale_price || 0)}</p>
                  )}
               </div>
            </div>
          ))}
        </div>
      </main>

      <style jsx global>{`
        @media print {
          @page {
            size: auto;
            margin: 0;
          }
          body > * {
            display: none !important;
          }
          body > main {
            display: block !important;
          }
          body > main > div:not(.print\\:grid) {
            display: none !important;
          }
          .print\\:grid {
            display: grid !important;
          }
        }
      `}</style>
    </div>
  );
}
