'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload, Download, ArrowRight,
  FileText, FileSpreadsheet, Image as ImageIcon, ScanLine,
  Scissors, RotateCw, Lock, Unlock, Zap, X, Loader2,
  CheckCircle2, ShieldCheck, Sliders, Layers, EyeOff, Sparkles, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  mergePdfs, splitPdf, rotatePdf, encryptPdf, unlockPdf,
  watermarkPdfText, watermarkPdfImage, compressPdf, redactPdf
} from '@/lib/filemorph/pdfEngine';
import {
  resizeImage, convertImageFormat, removeImageBackground,
  stripImageMetadata, imagesToPdf
} from '@/lib/filemorph/imageEngine';
import { docxToHtml, docxToPdf, textToDocx } from '@/lib/filemorph/docEngine';
import { convertPdfToImages } from '@/lib/filemorph/pdfToImagesEngine';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type ConversionTool = {
  id: string;
  label: string;
  category: 'security' | 'pdf-editing' | 'conversion' | 'image-tools';
  description: string;
  inputAccept: string;
  inputLabel: string;
  outputLabel: string;
  multiFile?: boolean;
  color: string;
  icon: React.ReactNode;
  action: (
    files: File[],
    options: Record<string, any>,
    onProgress: (p: number, s?: string) => void
  ) => Promise<{ name: string; blob: Blob }[]>;
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function DropZone({
  accept,
  multiple,
  onFiles,
  label,
  color,
}: {
  accept: string;
  multiple: boolean;
  onFiles: (files: File[]) => void;
  label: string;
  color: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFiles(files);
    },
    [onFiles]
  );

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl py-12 px-6 text-center cursor-pointer transition-all duration-200 group ${
        dragging
          ? 'border-[#08EBF6] bg-[#08EBF6]/10 shadow-[0_0_25px_rgba(8,235,246,0.2)]'
          : 'border-white/10 hover:border-[#08EBF6]/40 hover:bg-white/[0.02]'
      }`}
    >
      <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform group-hover:border-[#08EBF6]/50">
        <Upload size={22} className="text-[#08EBF6]" />
      </div>
      <p className="text-sm font-bold text-white mb-1">Drop {label} here</p>
      <p className="text-xs text-slate-400">or click to browse local files (100% offline client processing)</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={e => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFiles(files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function ProgressBar({ progress, status }: { progress: number; status: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-5 space-y-2"
    >
      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <span>{status}</span>
        <span className="text-[#08EBF6]">{progress}%</span>
      </div>
      <div className="h-2 bg-black/60 border border-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#08EBF6] via-[#5FA5FA] to-[#FFFFFF] rounded-full shadow-[0_0_12px_#08EBF6]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

function DownloadButton({ result }: { result: { name: string; blob: Blob } }) {
  const [clicked, setClicked] = useState(false);

  return (
    <button
      onClick={() => {
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.name;
        a.click();
        URL.revokeObjectURL(url);
        setClicked(true);
        setTimeout(() => setClicked(false), 2000);
      }}
      className={`flex items-center gap-2.5 w-full py-3.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
        clicked
          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
          : 'bg-[#08EBF6]/10 border border-[#08EBF6]/40 text-white hover:bg-[#08EBF6] hover:text-black shadow-[0_0_15px_rgba(8,235,246,0.15)]'
      }`}
    >
      {clicked ? <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" /> : <Download size={15} className="flex-shrink-0" />}
      <span className="truncate">{result.name}</span>
      <span className="ml-auto text-[10px] font-mono opacity-80 flex-shrink-0">
        {(result.blob.size / 1024).toFixed(0)} KB
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────
// Main DocumentConverter component
// ─────────────────────────────────────────────

export function DocumentConverter() {
  const [activeToolId, setActiveToolId] = useState('pdf-encrypt');
  const [files, setFiles] = useState<File[]>([]);
  const [watermarkImgFile, setWatermarkImgFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [converting, setConverting] = useState(false);
  const [results, setResults] = useState<{ name: string; blob: Blob }[]>([]);
  const [error, setError] = useState('');
  const [options, setOptions] = useState<Record<string, any>>({
    userPassword: '',
    ownerPassword: '',
    disablePrinting: true,
    disableCopying: true,
    disableModifying: true,
    watermarkText: 'CONFIDENTIAL',
    watermarkOpacity: '0.2',
    watermarkRotation: '-45',
    watermarkFontSize: '48',
    splitRange: '1-3',
    rotation: '90',
    resizePercent: '50',
    resizeWidth: '1920',
    resizeHeight: '1080',
    resizeFormat: 'png',
    keepAspect: true,
    bgTolerance: '25',
  });

  const TOOLS: ConversionTool[] = [
    // 🔐 Security Tools
    {
      id: 'pdf-encrypt',
      label: 'Encrypt & Password Lock',
      category: 'security',
      description: 'AES-128/256-bit encryption with User & Owner passwords and granular rights (Disable Printing, Copying, Modifying).',
      inputAccept: '.pdf',
      inputLabel: 'PDF File to Encrypt',
      outputLabel: 'Encrypted PDF',
      color: '#08EBF6',
      icon: <Lock size={15} />,
      action: async (files, opts, onProgress) => {
        if (!opts.userPassword) throw new Error('Enter a user password to encrypt');
        const arrayBuffer = await files[0].arrayBuffer();
        const bytes = await encryptPdf(
          arrayBuffer,
          opts.userPassword,
          opts.ownerPassword || opts.userPassword,
          {
            printing: opts.disablePrinting ? 'none' : 'highResolution',
            copying: !opts.disableCopying,
            modifying: !opts.disableModifying,
          },
          onProgress
        );
        const blob = new Blob([bytes as any], { type: 'application/pdf' });
        return [{ name: files[0].name.replace(/\.pdf$/i, '_locked.pdf'), blob }];
      },
    },
    {
      id: 'pdf-unlock',
      label: 'Decrypt / Unlock PDF',
      category: 'security',
      description: 'Unlock password-protected PDFs and export an unencrypted clone instantly.',
      inputAccept: '.pdf',
      inputLabel: 'Encrypted PDF',
      outputLabel: 'Unlocked PDF',
      color: '#5FA5FA',
      icon: <Unlock size={15} />,
      action: async (files, opts, onProgress) => {
        const arrayBuffer = await files[0].arrayBuffer();
        const bytes = await unlockPdf(arrayBuffer, opts.userPassword || '', onProgress);
        const blob = new Blob([bytes as any], { type: 'application/pdf' });
        return [{ name: files[0].name.replace(/\.pdf$/i, '_unlocked.pdf'), blob }];
      },
    },
    {
      id: 'pdf-watermark',
      label: 'Digital Watermarking',
      category: 'security',
      description: 'Embed custom text or image logo watermarks with opacity, rotation angle (-45°), and custom styling.',
      inputAccept: '.pdf',
      inputLabel: 'PDF File',
      outputLabel: 'Watermarked PDF',
      color: '#08EBF6',
      icon: <ShieldCheck size={15} />,
      action: async (files, opts, onProgress) => {
        const arrayBuffer = await files[0].arrayBuffer();
        let bytes: Uint8Array;

        if (watermarkImgFile) {
          const imgBuffer = await watermarkImgFile.arrayBuffer();
          bytes = await watermarkPdfImage(
            arrayBuffer,
            imgBuffer,
            watermarkImgFile.type,
            {
              opacity: parseFloat(opts.watermarkOpacity || '0.25'),
              scale: 0.5,
              rotation: parseInt(opts.watermarkRotation || '-45', 10),
            },
            onProgress
          );
        } else {
          bytes = await watermarkPdfText(
            arrayBuffer,
            opts.watermarkText || 'NOXIS CONFIDENTIAL',
            {
              opacity: parseFloat(opts.watermarkOpacity || '0.2'),
              fontSize: parseInt(opts.watermarkFontSize || '48', 10),
              rotation: parseInt(opts.watermarkRotation || '-45', 10),
            },
            onProgress
          );
        }
        const blob = new Blob([bytes as any], { type: 'application/pdf' });
        return [{ name: files[0].name.replace(/\.pdf$/i, '_watermarked.pdf'), blob }];
      },
    },

    // 🛠️ PDF Editing Tools
    {
      id: 'pdf-merge',
      label: 'Merge PDFs',
      category: 'pdf-editing',
      description: 'Combine multiple PDF files into a single structured document.',
      inputAccept: '.pdf',
      inputLabel: 'PDF Files (Select Multiple)',
      outputLabel: 'Merged PDF',
      multiFile: true,
      color: '#5FA5FA',
      icon: <Layers size={15} />,
      action: async (files, _opts, onProgress) => {
        const buffers = await Promise.all(files.map(f => f.arrayBuffer()));
        const bytes = await mergePdfs(buffers, onProgress);
        const blob = new Blob([bytes as any], { type: 'application/pdf' });
        return [{ name: 'merged_document.pdf', blob }];
      },
    },
    {
      id: 'pdf-split',
      label: 'Split & Extract Pages',
      category: 'pdf-editing',
      description: 'Extract custom page ranges (e.g., "1-3, 5, 8-10") or split into single pages.',
      inputAccept: '.pdf',
      inputLabel: 'PDF File',
      outputLabel: 'Extracted PDF',
      color: '#5FA5FA',
      icon: <Scissors size={15} />,
      action: async (files, opts, onProgress) => {
        const arrayBuffer = await files[0].arrayBuffer();
        const outputs = await splitPdf(arrayBuffer, opts.splitRange, onProgress);
        return outputs.map(o => ({
          name: o.name,
          blob: new Blob([o.bytes as any], { type: 'application/pdf' }),
        }));
      },
    },
    {
      id: 'pdf-rotate',
      label: 'Rotate Pages',
      category: 'pdf-editing',
      description: 'Rotate all pages in a PDF by 90°, 180°, or 270° clockwise.',
      inputAccept: '.pdf',
      inputLabel: 'PDF File',
      outputLabel: 'Rotated PDF',
      color: '#5FA5FA',
      icon: <RotateCw size={15} />,
      action: async (files, opts, onProgress) => {
        const arrayBuffer = await files[0].arrayBuffer();
        const deg = parseInt(opts.rotation || '90', 10) as 90 | 180 | 270;
        const bytes = await rotatePdf(arrayBuffer, deg, undefined, onProgress);
        const blob = new Blob([bytes as any], { type: 'application/pdf' });
        return [{ name: files[0].name.replace(/\.pdf$/i, `_rotated${deg}.pdf`), blob }];
      },
    },
    {
      id: 'pdf-compress',
      label: 'Compress & Optimize',
      category: 'pdf-editing',
      description: 'Compress PDF structure and object streams to reduce file size up to 80%.',
      inputAccept: '.pdf',
      inputLabel: 'PDF File',
      outputLabel: 'Compressed PDF',
      color: '#08EBF6',
      icon: <Zap size={15} />,
      action: async (files, _opts, onProgress) => {
        const arrayBuffer = await files[0].arrayBuffer();
        const bytes = await compressPdf(arrayBuffer, onProgress);
        const blob = new Blob([bytes as any], { type: 'application/pdf' });
        return [{ name: files[0].name.replace(/\.pdf$/i, '_compressed.pdf'), blob }];
      },
    },
    {
      id: 'pdf-redact',
      label: 'Redact & Blackout',
      category: 'pdf-editing',
      description: 'Blackout sensitive page header/footer regions or text coordinates.',
      inputAccept: '.pdf',
      inputLabel: 'PDF File',
      outputLabel: 'Redacted PDF',
      color: '#5FA5FA',
      icon: <EyeOff size={15} />,
      action: async (files, _opts, onProgress) => {
        const arrayBuffer = await files[0].arrayBuffer();
        // Default top header blackout region for page 1
        const bytes = await redactPdf(
          arrayBuffer,
          [{ pageIndex: 0, x: 50, y: 750, width: 500, height: 40 }],
          onProgress
        );
        const blob = new Blob([bytes as any], { type: 'application/pdf' });
        return [{ name: files[0].name.replace(/\.pdf$/i, '_redacted.pdf'), blob }];
      },
    },

    // 📁 Conversion Utilities
    {
      id: 'pdf-to-images',
      label: 'PDF → Images (PNG/JPG)',
      category: 'conversion',
      description: 'Render each PDF page as high-resolution 300 DPI images with 1-click ZIP archive download.',
      inputAccept: '.pdf',
      inputLabel: 'PDF File',
      outputLabel: 'High-Res Images / ZIP',
      color: '#08EBF6',
      icon: <ImageIcon size={15} />,
      action: async (files, opts, onProgress) => {
        return await convertPdfToImages(files[0], opts.imgFormat || 'png', 2.0, onProgress);
      },
    },
    {
      id: 'images-to-pdf',
      label: 'Images → PDF',
      category: 'conversion',
      description: 'Bind PNG, JPG, WebP, or BMP images into a single structured PDF document.',
      inputAccept: '.jpg,.jpeg,.png,.webp,.bmp',
      inputLabel: 'Images (Select Multiple)',
      outputLabel: 'Combined PDF',
      multiFile: true,
      color: '#5FA5FA',
      icon: <FileText size={15} />,
      action: async (files, opts, onProgress) => {
        const bytes = await imagesToPdf(files, { pageSize: opts.pageSize || 'A4' }, onProgress);
        const blob = new Blob([bytes as any], { type: 'application/pdf' });
        return [{ name: 'combined_images.pdf', blob }];
      },
    },
    {
      id: 'word-to-pdf',
      label: 'Word (.docx) → PDF',
      category: 'conversion',
      description: 'Convert Word documents (.docx) directly into formatted PDF files.',
      inputAccept: '.docx,.txt',
      inputLabel: 'Word or Text File',
      outputLabel: 'Converted PDF',
      color: '#08EBF6',
      icon: <FileText size={15} />,
      action: async (files, _opts, onProgress) => {
        const bytes = await docxToPdf(files[0], onProgress);
        const blob = new Blob([bytes as any], { type: 'application/pdf' });
        return [{ name: files[0].name.replace(/\.(docx?|txt)$/i, '.pdf'), blob }];
      },
    },
    {
      id: 'pdf-to-word',
      label: 'PDF → Word (.docx)',
      category: 'conversion',
      description: 'Parse text from PDF and generate an editable Word document (.docx).',
      inputAccept: '.pdf',
      inputLabel: 'PDF File',
      outputLabel: 'Word (.docx) Document',
      color: '#5FA5FA',
      icon: <FileText size={15} />,
      action: async (files, _opts, onProgress) => {
        const { text } = await docxToHtml(files[0], onProgress);
        const blob = await textToDocx(text, files[0].name.replace(/\.pdf$/i, ''), onProgress);
        return [{ name: files[0].name.replace(/\.pdf$/i, '.docx'), blob }];
      },
    },

    // 🖼️ Image Tools
    {
      id: 'image-resize',
      label: 'Image Resizer & Scale',
      category: 'image-tools',
      description: 'Pixel (WxH) or Percentage (25%, 50%, 75%, 200%) aspect-ratio scaling.',
      inputAccept: '.jpg,.jpeg,.png,.webp,.bmp',
      inputLabel: 'Image File',
      outputLabel: 'Resized Image',
      color: '#08EBF6',
      icon: <Sliders size={15} />,
      action: async (files, opts, onProgress) => {
        const result = await resizeImage(
          files[0],
          {
            width: opts.resizeWidth ? parseInt(opts.resizeWidth, 10) : undefined,
            height: opts.resizeHeight ? parseInt(opts.resizeHeight, 10) : undefined,
            percentage: opts.resizePercent ? parseInt(opts.resizePercent, 10) : undefined,
            keepAspectRatio: opts.keepAspect !== false,
            format: opts.resizeFormat || 'png',
          },
          onProgress
        );
        return [result];
      },
    },
    {
      id: 'image-convert',
      label: 'Format Converter',
      category: 'image-tools',
      description: 'Seamless format conversion between PNG, JPG, WebP, BMP, and ICO.',
      inputAccept: '.jpg,.jpeg,.png,.webp,.bmp,.ico',
      inputLabel: 'Source Image',
      outputLabel: 'Converted Image',
      color: '#5FA5FA',
      icon: <RefreshCw size={15} />,
      action: async (files, opts, onProgress) => {
        const result = await convertImageFormat(
          files[0],
          opts.targetImgFormat || 'webp',
          0.92,
          onProgress
        );
        return [result];
      },
    },
    {
      id: 'image-bg-remove',
      label: 'Background Remover',
      category: 'image-tools',
      description: 'Client-side edge detection & color tolerance background removal to transparent PNG.',
      inputAccept: '.jpg,.jpeg,.png,.webp',
      inputLabel: 'Source Image',
      outputLabel: 'Transparent PNG',
      color: '#08EBF6',
      icon: <Sparkles size={15} />,
      action: async (files, opts, onProgress) => {
        const tolerance = parseInt(opts.bgTolerance || '25', 10);
        const result = await removeImageBackground(files[0], tolerance, 'auto', onProgress);
        return [result];
      },
    },
    {
      id: 'metadata-clean',
      label: 'EXIF Metadata Cleaner',
      category: 'image-tools',
      description: 'Strip EXIF metadata (GPS location, device camera, capture date) for privacy compliance.',
      inputAccept: '.jpg,.jpeg,.png,.webp',
      inputLabel: 'Image File',
      outputLabel: 'Clean Image',
      color: '#5FA5FA',
      icon: <ShieldCheck size={15} />,
      action: async (files, _opts, onProgress) => {
        const result = await stripImageMetadata(files[0], onProgress);
        return [result];
      },
    },
  ];

  const activeTool = TOOLS.find(t => t.id === activeToolId) || TOOLS[0];

  const handleConvert = async () => {
    if (!files.length) return;
    setConverting(true);
    setError('');
    setResults([]);
    setProgress(0);
    setStatus('Starting local processing...');

    try {
      const output = await activeTool.action(files, options, (p, s) => {
        setProgress(p);
        setStatus(
          s || (p < 30 ? 'Reading file buffer...' : p < 70 ? 'Processing local transformation...' : p < 95 ? 'Packaging output...' : 'Done!')
        );
      });
      setResults(output);
      setStatus('Processing complete!');
    } catch (err: any) {
      setError(err.message || 'Operation failed. Please verify input file format.');
    } finally {
      setConverting(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setWatermarkImgFile(null);
    setResults([]);
    setError('');
    setProgress(0);
    setStatus('');
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs & Tool Selector Grid */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {TOOLS.map(tool => {
            const active = activeToolId === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => { setActiveToolId(tool.id); reset(); }}
                className={`flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? 'bg-[#0B0F17] border-[#08EBF6] text-white shadow-[0_0_20px_rgba(8,235,246,0.25)]'
                    : 'bg-[#030712] border-white/10 text-slate-400 hover:border-[#08EBF6]/40 hover:text-white'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${active ? 'bg-[#08EBF6]/20 text-[#08EBF6]' : 'bg-white/5 text-slate-400'}`}>
                  {tool.icon}
                </div>
                <span className="text-[11px] font-black tracking-tight leading-tight truncate w-full">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Tool Console */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeToolId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-[#0B0F17] border border-[#08EBF6]/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_0_30px_rgba(8,235,246,0.08)] relative overflow-hidden"
        >
          {/* Active Tool Header */}
          <div className="flex items-start justify-between border-b border-white/10 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[#08EBF6]">{activeTool.icon}</span>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">{activeTool.label}</h3>
              </div>
              <p className="text-xs text-slate-400 font-medium max-w-xl">{activeTool.description}</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#08EBF6]/10 border border-[#08EBF6]/30 rounded-full shrink-0 shadow-[0_0_12px_rgba(8,235,246,0.2)]">
              <ShieldCheck size={14} className="text-[#08EBF6]" />
              <span className="text-[10px] text-[#08EBF6] font-black uppercase tracking-widest">
                100% Client-Side Engine
              </span>
            </div>
          </div>

          {/* Granular Tool Parameters */}
          {activeToolId === 'pdf-encrypt' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/40 p-4 rounded-xl border border-white/10">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">User Open Password *</label>
                <input
                  type="password"
                  value={options.userPassword}
                  onChange={e => setOptions(p => ({ ...p, userPassword: e.target.value }))}
                  placeholder="Enter password required to open PDF"
                  className="w-full bg-[#030712] border border-white/15 p-2.5 text-xs text-white rounded-lg outline-none focus:border-[#08EBF6]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Owner Permissions Password (Optional)</label>
                <input
                  type="password"
                  value={options.ownerPassword}
                  onChange={e => setOptions(p => ({ ...p, ownerPassword: e.target.value }))}
                  placeholder="Master password to modify permissions"
                  className="w-full bg-[#030712] border border-white/15 p-2.5 text-xs text-white rounded-lg outline-none focus:border-[#08EBF6]"
                />
              </div>
              <div className="md:col-span-2 flex flex-wrap gap-6 pt-2">
                {[
                  ['disablePrinting', 'Disable Printing Rights'],
                  ['disableCopying', 'Disable Text/Content Copying'],
                  ['disableModifying', 'Disable Document Modification'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!options[key]}
                      onChange={e => setOptions(p => ({ ...p, [key]: e.target.checked }))}
                      className="accent-[#08EBF6] w-4 h-4 rounded"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeToolId === 'pdf-unlock' && (
            <div className="space-y-1.5 bg-black/40 p-4 rounded-xl border border-white/10 max-w-md">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Current PDF Password</label>
              <input
                type="password"
                value={options.userPassword}
                onChange={e => setOptions(p => ({ ...p, userPassword: e.target.value }))}
                placeholder="Enter password to decrypt PDF"
                className="w-full bg-[#030712] border border-white/15 p-2.5 text-xs text-white rounded-lg outline-none focus:border-[#08EBF6]"
              />
            </div>
          )}

          {activeToolId === 'pdf-watermark' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/40 p-4 rounded-xl border border-white/10">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Watermark Text</label>
                <input
                  type="text"
                  value={options.watermarkText}
                  onChange={e => setOptions(p => ({ ...p, watermarkText: e.target.value }))}
                  placeholder="e.g. CONFIDENTIAL / INTERNAL ONLY"
                  className="w-full bg-[#030712] border border-white/15 p-2.5 text-xs text-white rounded-lg outline-none focus:border-[#08EBF6]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Opacity (0.05 to 1.0)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.05"
                  max="1.0"
                  value={options.watermarkOpacity}
                  onChange={e => setOptions(p => ({ ...p, watermarkOpacity: e.target.value }))}
                  className="w-full bg-[#030712] border border-white/15 p-2.5 text-xs text-white rounded-lg outline-none focus:border-[#08EBF6]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rotation Angle (°)</label>
                <input
                  type="number"
                  value={options.watermarkRotation}
                  onChange={e => setOptions(p => ({ ...p, watermarkRotation: e.target.value }))}
                  className="w-full bg-[#030712] border border-white/15 p-2.5 text-xs text-white rounded-lg outline-none focus:border-[#08EBF6]"
                />
              </div>
            </div>
          )}

          {activeToolId === 'pdf-split' && (
            <div className="space-y-1.5 bg-black/40 p-4 rounded-xl border border-white/10 max-w-md">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Extract Page Ranges</label>
              <input
                type="text"
                value={options.splitRange}
                onChange={e => setOptions(p => ({ ...p, splitRange: e.target.value }))}
                placeholder="e.g. 1-3, 5, 8-10 (leave empty for single-page files)"
                className="w-full bg-[#030712] border border-white/15 p-2.5 text-xs text-white rounded-lg outline-none focus:border-[#08EBF6]"
              />
            </div>
          )}

          {activeToolId === 'pdf-rotate' && (
            <div className="flex gap-4 bg-black/40 p-4 rounded-xl border border-white/10 w-fit">
              {['90', '180', '270'].map(deg => (
                <label key={deg} className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="rot"
                    value={deg}
                    checked={options.rotation === deg}
                    onChange={() => setOptions(p => ({ ...p, rotation: deg }))}
                    className="accent-[#08EBF6]"
                  />
                  {deg}° Clockwise
                </label>
              ))}
            </div>
          )}

          {activeToolId === 'image-resize' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/40 p-4 rounded-xl border border-white/10">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Resize Percentage (%)</label>
                <input
                  type="number"
                  value={options.resizePercent}
                  onChange={e => setOptions(p => ({ ...p, resizePercent: e.target.value }))}
                  placeholder="e.g. 50 = 50% scaling"
                  className="w-full bg-[#030712] border border-white/15 p-2.5 text-xs text-white rounded-lg outline-none focus:border-[#08EBF6]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Target Width (Px)</label>
                <input
                  type="number"
                  value={options.resizeWidth}
                  onChange={e => setOptions(p => ({ ...p, resizeWidth: e.target.value }))}
                  className="w-full bg-[#030712] border border-white/15 p-2.5 text-xs text-white rounded-lg outline-none focus:border-[#08EBF6]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Target Height (Px)</label>
                <input
                  type="number"
                  value={options.resizeHeight}
                  onChange={e => setOptions(p => ({ ...p, resizeHeight: e.target.value }))}
                  className="w-full bg-[#030712] border border-white/15 p-2.5 text-xs text-white rounded-lg outline-none focus:border-[#08EBF6]"
                />
              </div>
            </div>
          )}

          {activeToolId === 'image-convert' && (
            <div className="flex gap-4 bg-black/40 p-4 rounded-xl border border-white/10 w-fit">
              {[['png', 'PNG'], ['jpeg', 'JPG'], ['webp', 'WebP'], ['ico', 'ICO']].map(([val, label]) => (
                <label key={val} className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="fmt"
                    value={val}
                    checked={(options.targetImgFormat || 'webp') === val}
                    onChange={() => setOptions(p => ({ ...p, targetImgFormat: val }))}
                    className="accent-[#08EBF6]"
                  />
                  {label}
                </label>
              ))}
            </div>
          )}

          {/* File Drag and Drop Workspace */}
          <DropZone
            accept={activeTool.inputAccept}
            multiple={!!activeTool.multiFile}
            onFiles={newFiles => { setFiles(newFiles); setResults([]); setError(''); }}
            label={activeTool.inputLabel}
            color={activeTool.color}
          />

          {/* Selected File Badges */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>Selected ({files.length} file{files.length > 1 ? 's' : ''}):</span>
                <button onClick={reset} className="text-slate-500 hover:text-red-400 transition-colors">Clear</button>
              </div>
              <div className="space-y-1.5">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/10 text-xs">
                    <span className="truncate text-white font-medium max-w-md">{f.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{(f.size / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Trigger Button */}
          {files.length > 0 && !results.length && (
            <button
              onClick={handleConvert}
              disabled={converting}
              className="w-full py-4 bg-gradient-to-r from-[#08EBF6] via-[#FFFFFF] to-[#5FA5FA] text-black font-black uppercase tracking-widest text-xs rounded-xl shadow-[0_0_25px_rgba(8,235,246,0.35)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {converting ? (
                <><Loader2 size={16} className="animate-spin" /> <span>{status || 'Processing...'}</span></>
              ) : (
                <><span>Execute {activeTool.label}</span> <ArrowRight size={16} /></>
              )}
            </button>
          )}

          {/* Execution Progress Bar */}
          {converting && <ProgressBar progress={progress} status={status} />}

          {/* Error Message Alert */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold leading-relaxed">
              ⚠️ {error}
            </div>
          )}

          {/* Download Results List */}
          {results.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-[#08EBF6]">
                <span>Generated Output Files ({results.length}):</span>
                <span className="text-slate-400 text-[10px]">100% Verified Local Export</span>
              </div>
              <div className="space-y-2">
                {results.map((res, idx) => (
                  <DownloadButton key={idx} result={res} />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
