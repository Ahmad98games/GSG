"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ImageDown, FileType, Smartphone, 
  Files, Lock, ShieldCheck, Plus, Trash2, 
  Download, ArrowRight, CheckCircle2,
  Loader2, Search
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import { usePersona } from "@/hooks/usePersona";
import { cn } from "@/lib/utils";
import { compressImages } from "@/lib/filemorph/imageCompressor";
import { mergePdfs, protectPdf, watermarkPdf, imagesToPdf } from "@/lib/filemorph/pdfTools";
import { convertHeicFiles } from "@/lib/filemorph/heicConverter";
import { convertBatchFormats } from "@/lib/filemorph/formatConverter";

// --- Components ---

const PrivacyBadge = () => (
  <div className="flex items-center space-x-1.5 px-2 py-1 bg-emerald/10 border border-emerald/20 rounded-full">
    <Lock size={10} className="text-emerald" />
    <span className="text-[10px] font-bold text-emerald uppercase tracking-wider">
      Local-Only Processing
    </span>
  </div>
);

const CardHeader = ({ icon: Icon, title, sub }: { icon: React.ElementType, title: string, sub: string }) => (
  <div className="flex items-start justify-between mb-6">
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-white/5 rounded-sm text-gray-400">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-tight">{title}</h3>
        <p className="text-[10px] text-gray-500 uppercase font-medium">{sub}</p>
      </div>
    </div>
  </div>
);

// --- Utilities ---

export default function FileMorphPage() {

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 p-6">
      <main className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold tracking-tight text-white">File Morph</h1>
              <PrivacyBadge />
            </div>
            <p className="text-sm text-gray-500">
              Professional document utilities — processed locally, never uploaded.
            </p>
          </div>
        </div>

        {/* 3x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ImageCompressorCard />
          <PdfToolsCard />
          <HeicConverterCard />
          <ImageToPdfCard />
          <FormatConverterCard />
          <BulkOrganizerCard />
        </div>
      </main>
    </div>
  );
}

// --- Card 1: Image Compressor ---
function ImageCompressorCard() {
  const [files, setFiles] = useState<{
    file: File;
    name: string;
    originalSize: number;
    data: string;
  }[]>([]);
  const [processing, setProcessing] = useState(false);
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState<'original' | 'jpeg' | 'png' | 'webp'>('original');
  const [results, setResults] = useState<any[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setFiles(prev => [...prev, {
          file,
          name: file.name,
          originalSize: file.size,
          data: (reader.result as string).split(',')[1]
        }]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic', '.heif'] }
  });

  const handleCompress = async () => {
    setProcessing(true);
    try {
      const res = await compressImages(files.map(f => ({ name: f.name, data: f.data })), { quality, format });
      setResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    results.forEach(res => {
      zip.file(res.name, res.data, { base64: true });
    });
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "compressed_images.zip");
  };

  return (
    <div className="bg-[#1A1D21] border border-white/5 p-6 rounded-sm space-y-6 flex flex-col min-h-[450px]">
      <CardHeader icon={ImageDown} title="Image Compressor" sub="Reduce file size without losing quality" />
      
      {files.length === 0 ? (
        <div {...getRootProps()} className={cn(
          "flex-1 border-2 border-dashed border-white/5 rounded-sm flex flex-col items-center justify-center p-8 transition-colors cursor-pointer hover:bg-white/[0.02]",
          isDragActive && "border-electric-blue bg-electric-blue/5"
        )}>
          <input {...getInputProps()} />
          <Plus className="text-gray-600 mb-2" size={32} />
          <p className="text-xs text-gray-500 uppercase font-black tracking-widest text-center">
            Drop images here or click to select
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          {/* Settings */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-black/20 border border-white/5 rounded-sm">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-gray-500">Quality: {quality}%</label>
              <input type="range" min="60" max="95" value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} className="w-full" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-gray-500">Format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value as any)} className="w-full bg-[#0F1113] border border-white/5 p-1.5 text-[10px] text-white outline-none">
                <option value="original">Original Format</option>
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[150px] overflow-y-auto space-y-2 custom-scrollbar pr-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-sm text-[10px]">
                <span className="truncate max-w-[150px]">{f.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">{(f.originalSize / 1024).toFixed(0)}KB</span>
                  {results[i] && (
                    <>
                      <ArrowRight size={10} className="text-gray-600" />
                      <span className="text-emerald font-bold">{(results[i].compressedSize / 1024).toFixed(0)}KB (-{results[i].savedPercent}%)</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleCompress}
              disabled={processing}
              className="flex-1 py-3 bg-electric-blue text-onyx text-[10px] font-black uppercase tracking-widest rounded-sm hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              {processing ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              <span>{processing ? "Processing..." : "Compress All"}</span>
            </button>
            {results.length > 0 && (
              <button onClick={downloadAll} className="px-4 py-3 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-white/10 transition-all">
                <Download size={14} />
              </button>
            )}
            <button onClick={() => { setFiles([]); setResults([]); }} className="p-3 text-gray-500 hover:text-red-500"><Trash2 size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Card 2: PDF Tools ---
function PdfToolsCard() {
  const [activeTab, setActiveTab] = useState<'merge' | 'protect' | 'watermark'>('merge');
  const [files, setFiles] = useState<{
    file: File;
    name: string;
    data: ArrayBuffer;
  }[]>([]);
  const [processing, setProcessing] = useState(false);
  const [watermarkText, setWatermarkText] = useState("NOXIS HUB PROTECTED");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setFiles(prev => [...prev, { file, name: file.name, data: reader.result as ArrayBuffer }]);
      };
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop, 
    accept: { 'application/pdf': ['.pdf'] }
  });

  const handleAction = async () => {
    setProcessing(true);
    try {
      let result: Uint8Array;
      if (activeTab === 'merge') {
        result = await mergePdfs(files.map(f => f.data));
      } else if (activeTab === 'protect') {
        result = await protectPdf(files[0].data);
      } else {
        result = await watermarkPdf(files[0].data, watermarkText);
      }
      const blob = new Blob([result as any], { type: 'application/pdf' });
      saveAs(blob, `morphed_${activeTab}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-[#1A1D21] border border-white/5 p-6 rounded-sm space-y-6 flex flex-col min-h-[450px]">
      <CardHeader icon={FileType} title="PDF Tools" sub="Merge, watermark, and secure documents" />
      
      {/* Tabs */}
      <div className="flex space-x-1 p-1 bg-black/40 rounded-sm">
        {(['merge', 'protect', 'watermark'] as const).map(tab => (
          <button 
            key={tab} 
            onClick={() => { setActiveTab(tab); setFiles([]); }}
            className={cn(
              "flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-sm transition-all",
              activeTab === tab ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col space-y-4">
        {files.length === 0 ? (
          <div {...getRootProps()} className="flex-1 border-2 border-dashed border-white/5 rounded-sm flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-white/[0.02]">
            <input {...getInputProps()} />
            <Plus className="text-gray-600 mb-2" size={32} />
            <p className="text-xs text-gray-500 uppercase font-black tracking-widest text-center">
              Drop {activeTab === 'merge' ? 'PDFs' : 'PDF'} here
            </p>
          </div>
        ) : (
          <div className="flex-1 space-y-4">
             {activeTab === 'watermark' && (
               <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black text-gray-500">Watermark Text</label>
                 <input 
                   type="text" 
                   value={watermarkText} 
                   onChange={(e) => setWatermarkText(e.target.value)}
                   className="w-full bg-[#0F1113] border border-white/5 p-2 text-xs text-white outline-none focus:border-electric-blue"
                 />
               </div>
             )}

             <div className="max-h-[120px] overflow-y-auto space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-sm text-[10px]">
                    <span className="truncate">{f.name}</span>
                    <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}><Trash2 size={12} className="text-gray-600 hover:text-red-500" /></button>
                  </div>
                ))}
             </div>

             <button 
               onClick={handleAction}
               disabled={processing || (activeTab !== 'merge' && files.length > 1)}
               className="w-full py-3 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-white/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
             >
               {processing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
               <span>{processing ? "Processing..." : `Execute ${activeTab}`}</span>
             </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Card 3: HEIC Converter ---
function HeicConverterCard() {
  const [files, setFiles] = useState<{
    file: File;
    name: string;
    data: string;
  }[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setFiles(prev => [...prev, { file, name: file.name, data: (reader.result as string).split(',')[1] }]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop, 
    accept: { 'image/heic': ['.heic'], 'image/heif': ['.heif'] }
  });

  const handleConvert = async () => {
    setProcessing(true);
    try {
      const res = await convertHeicFiles(files.map(f => ({ name: f.name, data: f.data })));
      setResults(res);
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    results.forEach(res => zip.file(res.name, res.data, { base64: true }));
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "converted_heic.zip");
  };

  return (
    <div className="bg-[#1A1D21] border border-white/5 p-6 rounded-sm space-y-6 flex flex-col min-h-[450px]">
      <CardHeader icon={Smartphone} title="HEIC → JPG" sub="Convert iPhone photos for Windows compatibility" />
      
      {files.length === 0 ? (
        <div {...getRootProps()} className="flex-1 border-2 border-dashed border-white/5 rounded-sm flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-white/[0.02]">
          <input {...getInputProps()} />
          <Smartphone className="text-gray-600 mb-2" size={32} />
          <p className="text-xs text-gray-500 uppercase font-black tracking-widest text-center">
            Drop HEIC files here
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-4">
           <div className="flex-1 max-h-[150px] overflow-y-auto space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-sm text-[10px]">
                  <span>{f.name}</span>
                  {results[i] && <CheckCircle2 size={12} className="text-emerald" />}
                </div>
              ))}
           </div>

           <div className="flex gap-3">
             <button 
               onClick={handleConvert}
               disabled={processing}
               className="flex-1 py-3 bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-amber-500/30 transition-all flex items-center justify-center space-x-2"
             >
               {processing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} className="rotate-45" />}
               <span>{processing ? "Converting..." : "Convert All"}</span>
             </button>
             {results.length > 0 && (
               <button onClick={downloadAll} className="px-4 py-3 bg-emerald/20 text-emerald border border-emerald/30 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-emerald/30 transition-all">
                 <Download size={14} />
               </button>
             )}
           </div>
        </div>
      )}
    </div>
  );
}

// --- Card 4: Bulk Organizer ---
function BulkOrganizerCard() {
  const [files, setFiles] = useState<{
    file: File;
    name: string;
    ext: string;
    type: string;
    date: string;
    data: string;
  }[]>([]);
  const [pattern] = useState("[Type]_[Number]_[Date]");
  const [processing, setProcessing] = useState(false);

  const fName = (n: string) => n.replace(/\.[^/.]+$/, "");

  const detectType = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('invoice')) return 'Invoice';
    if (n.includes('bill')) return 'Bill';
    if (n.includes('challan')) return 'Challan';
    return 'Document';
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const data = reader.result as string;
        setFiles(prev => [...prev, {
          file,
          name: fName(file.name),
          ext: file.name.split('.').pop() || '',
          type: detectType(file.name),
          date: new Date().toISOString().split('T')[0],
          data: data.includes('base64,') ? data.split(',')[1] : data
        }]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const organizeAndDownload = async () => {
    setProcessing(true);
    const zip = new JSZip();
    const manifest: string[] = ["Old Name,New Name,Type,Date"];
    
    files.forEach((f, i) => {
      const num = (i + 1).toString().padStart(3, '0');
      const newName = `${f.type}_${num}_${f.date}.${f.ext}`;
      zip.file(newName, f.data, { base64: true });
      manifest.push(`${f.file.name},${newName},${f.type},${f.date}`);
    });
    
    zip.file("manifest.csv", manifest.join("\n"));
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "organized_documents.zip");
    setProcessing(false);
  };

  return (
    <div className="bg-[#1A1D21] border border-white/5 p-6 rounded-sm space-y-6 flex flex-col min-h-[450px]">
      <CardHeader icon={Files} title="Bulk Organizer" sub="Auto-rename and package document batches" />
      
      {files.length === 0 ? (
        <div {...getRootProps()} className="flex-1 border-2 border-dashed border-white/5 rounded-sm flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-white/[0.02]">
          <input {...getInputProps()} />
          <Files className="text-gray-600 mb-2" size={32} />
          <p className="text-xs text-gray-500 uppercase font-black tracking-widest text-center">
            Drop document folder or files
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-4">
           {/* Pattern Preview */}
           <div className="p-3 bg-black/40 border border-white/5 rounded-sm">
             <div className="flex items-center justify-between mb-1">
               <span className="text-[9px] uppercase font-bold text-gray-500">Naming Pattern</span>
               <span className="text-[9px] text-electric-blue font-mono">{pattern}</span>
             </div>
             <p className="text-[10px] text-gray-400">
               Example: <span className="text-white">Bill_001_2024-03-25.jpg</span>
             </p>
           </div>

           <div className="flex-1 max-h-[140px] overflow-y-auto space-y-1">
              {files.map((f, i) => (
                <div key={i} className="group flex items-center justify-between p-2 hover:bg-white/5 rounded-sm text-[9px] transition-colors">
                  <span className="truncate max-w-[120px] text-gray-500">{f.file.name}</span>
                  <ArrowRight size={10} className="text-gray-700" />
                  <div className="flex items-center space-x-2">
                    <select 
                      value={f.type} 
                      onChange={(e) => {
                        const newFiles = [...files];
                        newFiles[i].type = e.target.value;
                        setFiles(newFiles);
                      }}
                      className="bg-transparent border-none text-white outline-none cursor-pointer"
                    >
                      <option value="Invoice">Invoice</option>
                      <option value="Bill">Bill</option>
                      <option value="Challan">Challan</option>
                      <option value="Document">Doc</option>
                    </select>
                    <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}><Trash2 size={12} className="text-gray-700 hover:text-red-500" /></button>
                  </div>
                </div>
              ))}
           </div>

           <div className="flex gap-2">
             <button 
               onClick={organizeAndDownload}
               disabled={processing}
               className="flex-1 py-3 bg-white text-onyx text-[10px] font-black uppercase tracking-widest rounded-sm hover:brightness-90 transition-all flex items-center justify-center space-x-2"
             >
               {processing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
               <span>Download ZIP</span>
             </button>
             <button 
               onClick={() => alert("Search for Transaction (Invoice/PO) to attach...")}
               className="px-4 py-3 bg-electric-blue/20 text-electric-blue border border-electric-blue/30 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-electric-blue/30 transition-all flex items-center justify-center space-x-2"
             >
               <Search size={14} />
               <span>Attach to Ledger</span>
             </button>
           </div>
        </div>
      )}
    </div>
  );
}

// Icons for the cards
// --- Card 5: Image to PDF ---
function ImageToPdfCard() {
  const [files, setFiles] = useState<{ file: File; name: string; data: ArrayBuffer; type: string }[]>([]);
  const [processing, setProcessing] = useState(false);
  const [pageSize, setPageSize] = useState<'A4' | 'LETTER'>('A4');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setFiles(prev => [...prev, { file, name: file.name, data: reader.result as ArrayBuffer, type: file.type }]);
      };
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] }
  });

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const pdfBytes = await imagesToPdf(files.map(f => ({ data: f.data, type: f.type })), { pageSize });
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      saveAs(blob, "converted_images.pdf");
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-[#1A1D21] border border-white/5 p-6 rounded-sm space-y-6 flex flex-col min-h-[450px]">
      <CardHeader icon={FileType} title="Images → PDF" sub="Batch convert photos to a single document" />
      
      {files.length === 0 ? (
        <div {...getRootProps()} className="flex-1 border-2 border-dashed border-white/5 rounded-sm flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-white/[0.02]">
          <input {...getInputProps()} />
          <Plus className="text-gray-600 mb-2" size={32} />
          <p className="text-xs text-gray-500 uppercase font-black tracking-widest text-center">
            Drop images to package as PDF
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-4">
           <div className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-sm">
              <label className="text-[10px] uppercase font-black text-gray-500">Page Size</label>
              <select 
                value={pageSize} 
                onChange={(e) => setPageSize(e.target.value as any)}
                className="bg-transparent text-[10px] text-white font-black uppercase outline-none"
              >
                 <option value="A4">A4 Standard</option>
                 <option value="LETTER">US Letter</option>
              </select>
           </div>

           <div className="flex-1 max-h-[150px] overflow-y-auto space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-sm text-[10px]">
                  <span className="truncate max-w-[150px]">{f.name}</span>
                  <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}><Trash2 size={12} className="text-gray-600 hover:text-red-500" /></button>
                </div>
              ))}
           </div>

           <button 
             onClick={handleConvert}
             disabled={processing}
             className="w-full py-3 bg-white text-onyx text-[10px] font-black uppercase tracking-widest rounded-sm hover:brightness-90 transition-all flex items-center justify-center space-x-2"
           >
             {processing ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
             <span>{processing ? "Packaging PDF..." : "Generate PDF Document"}</span>
           </button>
        </div>
      )}
    </div>
  );
}

// --- Card 6: Format Converter ---
function FormatConverterCard() {
  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ name: string; data: string }[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.bmp', '.tiff'] }
  });

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const res = await convertBatchFormats(files, targetFormat);
      setResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    results.forEach(res => zip.file(res.name, res.data, { base64: true }));
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "converted_formats.zip");
  };

  return (
    <div className="bg-[#1A1D21] border border-white/5 p-6 rounded-sm space-y-6 flex flex-col min-h-[450px]">
      <CardHeader icon={RefreshCw} title="Format Converter" sub="Batch transform between JPG, PNG, WebP" />
      
      {files.length === 0 ? (
        <div {...getRootProps()} className="flex-1 border-2 border-dashed border-white/5 rounded-sm flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-white/[0.02]">
          <input {...getInputProps()} />
          <Plus className="text-gray-600 mb-2" size={32} />
          <p className="text-xs text-gray-500 uppercase font-black tracking-widest text-center">
            Drop images for format conversion
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-4">
           <div className="p-3 bg-black/20 border border-white/5 rounded-sm flex items-center justify-between">
              <label className="text-[10px] uppercase font-black text-gray-500">Target Format</label>
              <select 
                value={targetFormat} 
                onChange={(e) => setTargetFormat(e.target.value as any)}
                className="bg-transparent text-[10px] text-white font-black uppercase outline-none"
              >
                 <option value="image/jpeg">JPEG (Photo)</option>
                 <option value="image/png">PNG (Lossless)</option>
                 <option value="image/webp">WebP (Next-Gen)</option>
              </select>
           </div>

           <div className="flex-1 max-h-[150px] overflow-y-auto space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-sm text-[10px]">
                  <span className="truncate max-w-[150px]">{f.name}</span>
                  {results[i] && <CheckCircle2 size={12} className="text-emerald" />}
                  {!results[i] && <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}><Trash2 size={12} className="text-gray-600 hover:text-red-500" /></button>}
                </div>
              ))}
           </div>

           <div className="flex gap-2">
              <button 
                onClick={handleConvert}
                disabled={processing}
                className="flex-1 py-3 bg-electric-blue text-onyx text-[10px] font-black uppercase tracking-widest rounded-sm hover:brightness-110 transition-all flex items-center justify-center space-x-2"
              >
                {processing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} className="rotate-45" />}
                <span>{processing ? "Converting..." : "Batch Convert"}</span>
              </button>
              {results.length > 0 && (
                <button onClick={downloadAll} className="px-4 py-3 bg-emerald/20 text-emerald border border-emerald/30 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-emerald/30 transition-all">
                  <Download size={14} />
                </button>
              )}
           </div>
        </div>
      )}
    </div>
  );
}

function RefreshCw({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}
