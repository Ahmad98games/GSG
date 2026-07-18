"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Barcode as BarcodeIcon, Download, Printer, ChevronLeft, 
  Settings, Eye, Layers, Search, RefreshCw, FileArchive
} from "lucide-react";

import { useSidebarState } from "@/hooks/useSidebarState";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import JSZip from "jszip";

type BarcodeFormat = 'CODE128' | 'EAN13' | 'CODE39' | 'QR';

export default function BarcodeGenerator() {
  const { isCollapsed } = useSidebarState();
  const { businessId } = usePersona();
  const supabase = createClient();
  

  const [input, setInput] = useState("NOXIS-HUB-V13");
  const [format, setFormat] = useState<BarcodeFormat>('CODE128');
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (format === 'QR') {
      QRCode.toDataURL(input || " ", { width: 400, margin: 1 }, (err, url) => {
        if (!err) setQrDataUrl(url);
      });
    } else if (barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, input || " ", {
          format: format as any,
          width: 2,
          height: 100,
          displayValue: true,
          fontOptions: "bold",
          font: "monospace",
          fontSize: 20,
          textMargin: 10,
          background: "transparent",
          lineColor: "#000000"
        });
      } catch (e) {
        console.error("Barcode generation failed", e);
      }
    }
  }, [input, format]);

  const handleDownload = () => {
    if (format === 'QR') {
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `barcode-${input}.png`;
      link.click();
    } else if (barcodeRef.current) {
      const svg = barcodeRef.current;
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        if (ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const pngUrl = canvas.toDataURL("image/png");
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = `barcode-${input}.png`;
          link.click();
        }
      };
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const { data: skus } = await supabase
        .from('skus')
        .select('name, sku_code')
        .eq('business_id', businessId);
      
      if (!skus) return;

      const zip = new JSZip();
      
      for (const sku of skus) {
        if (!sku.sku_code) continue;
        
        // Generate SVG string
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        JsBarcode(svg, sku.sku_code, {
          format: "CODE128",
          width: 2,
          height: 80,
          displayValue: true
        });
        const svgData = new XMLSerializer().serializeToString(svg);
        zip.file(`${sku.sku_code}-${sku.name.replace(/[^a-z0-9]/gi, '_')}.svg`, svgData);
      }

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `noxis-barcodes-all.zip`;
      link.click();
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200">
      
      
      <main className={cn( "transition-all duration-300 min-h-screen flex flex-col")}>
        <div className="p-8 max-w-[1200px] mx-auto w-full space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/generators" className="p-2 bg-white/5 rounded-sm hover:bg-white/10 transition-colors">
                <ChevronLeft size={20} />
              </Link>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Barcode Generator</h1>
                <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-bold mt-1">
                  Standardized industrial symbology tool
                </p>
              </div>
            </div>

            <button 
              onClick={handleExportAll}
              disabled={isExporting}
              className="flex items-center space-x-3 bg-white/5 border border-white/5 px-6 py-3 rounded-sm hover:bg-white/10 transition-all group disabled:opacity-50"
            >
              {isExporting ? <RefreshCw size={16} className="animate-spin text-electric-blue" /> : <FileArchive size={16} className="text-electric-blue" />}
              <span className="text-[10px] font-black uppercase tracking-widest">Generate for All SKUs</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Form Side */}
            <div className="glass-panel p-8 space-y-8">
              <h3 className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-electric-blue pl-3">Barcode Parameters</h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Data Input</label>
                  <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 px-4 py-3 text-lg font-mono text-white focus:outline-none focus:border-electric-blue/50"
                    placeholder="Enter text or number..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Symbology / Format</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['CODE128', 'EAN13', 'CODE39', 'QR'] as BarcodeFormat[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFormat(f)}
                        className={cn(
                          "px-4 py-3 text-[10px] font-black uppercase tracking-widest border transition-all rounded-sm",
                          format === f 
                            ? "bg-electric-blue border-electric-blue text-white" 
                            : "bg-white/5 border-white/5 text-gray-500 hover:text-white"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-8 grid grid-cols-2 gap-4">
                <button 
                  onClick={handleDownload}
                  className="bg-white/5 border border-white/5 text-white px-6 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center space-x-3"
                >
                  <Download size={16} className="text-electric-blue" />
                  <span>Download PNG</span>
                </button>
                <button 
                  onClick={() => window.print()}
                  className="bg-electric-blue text-white px-6 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center space-x-3"
                >
                  <Printer size={16} />
                  <span>Print Direct</span>
                </button>
              </div>
            </div>

            {/* Preview Side */}
            <div className="space-y-8">
              <h3 className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-electric-blue pl-3">Symbol Preview</h3>
              
              <div className="glass-panel p-12 flex flex-col items-center justify-center min-h-[400px] bg-[#121417]">
                {format === 'QR' ? (
                  qrDataUrl ? (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-8 bg-white rounded-sm shadow-2xl"
                    >
                      <img src={qrDataUrl} alt="QR" className="w-64 h-64" />
                    </motion.div>
                  ) : null
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-8 bg-white rounded-sm shadow-2xl flex flex-col items-center"
                  >
                    <svg ref={barcodeRef} className="max-w-full"></svg>
                  </motion.div>
                )}

                <div className="mt-12 text-center space-y-2">
                   <p className="text-[10px] font-black uppercase text-electric-blue tracking-widest">Valid Symbology Generated</p>
                   <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">Format: {format} | Input: {input}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @media print {
          @page {
            size: auto;
            margin: 20mm;
          }
          body > * {
            display: none !important;
          }
          body > main {
            display: flex !important;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }
          .glass-panel {
            border: none !important;
            background: white !important;
            padding: 0 !important;
          }
          svg, img {
            filter: invert(0) !important;
          }
        }
      `}</style>
    </div>
  );
}
