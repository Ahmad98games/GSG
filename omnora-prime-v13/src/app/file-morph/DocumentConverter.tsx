'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload, Download, ArrowRight,
  FileText, Image as ImageIcon,
  Scissors, RotateCw, Lock, Unlock, Zap, Loader2,
  CheckCircle2, ShieldCheck, Sliders, Layers, EyeOff, Sparkles, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
}: {
  accept: string;
  multiple: boolean;
  onFiles: (files: File[]) => void;
  label: string;
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
      className={cn(
        'border border-dashed rounded-[6px] py-8 px-4 text-center cursor-pointer transition-colors duration-100',
        dragging
          ? 'border-white/30 bg-white/[0.04]'
          : 'border-white/[0.12] bg-[#0B0E14]/40 hover:border-white/20 hover:bg-white/[0.02]'
      )}
    >
      <div className="w-10 h-10 rounded-[6px] bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-2.5">
        <Upload size={16} strokeWidth={1.5} className="text-slate-400" />
      </div>
      <p className="text-xs font-medium text-slate-200 mb-0.5">Drop {label} here</p>
      <p className="text-[11px] text-slate-500 font-normal">or click to browse local files (processed 100% in-browser)</p>
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
    <div className="mt-4 space-y-1.5">
      <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums">
        <span>{status}</span>
        <span className="text-slate-200">{progress}%</span>
      </div>
      <div className="h-1.5 bg-[#0B0E14] border border-white/[0.08] rounded-full overflow-hidden">
        <div
          className="h-full bg-white transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
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
      className={cn(
        'flex items-center gap-2 w-full h-9 px-3 rounded-[4px] text-xs font-medium transition-colors duration-100 cursor-pointer border',
        clicked
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          : 'bg-[#0B0E14] border-white/[0.08] text-slate-200 hover:bg-white/[0.04] hover:border-white/20'
      )}
    >
      {clicked ? (
        <CheckCircle2 size={14} strokeWidth={1.5} className="text-emerald-400 flex-shrink-0" />
      ) : (
        <Download size={14} strokeWidth={1.5} className="text-slate-400 flex-shrink-0" />
      )}
      <span className="truncate">{result.name}</span>
      <span className="ml-auto text-[10px] font-mono tabular-nums text-slate-500 flex-shrink-0">
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
    splitRange: '',
    rotation: '90',
    pageSize: 'A4',
    resizePercent: '50',
    resizeWidth: '',
    resizeHeight: '',
    keepAspect: true,
    resizeFormat: 'png',
    targetImgFormat: 'webp',
    bgTolerance: '25',
    imgFormat: 'png',
  });

  const TOOLS: ConversionTool[] = [
    // 🔒 PDF Security
    {
      id: 'pdf-encrypt',
      label: 'Encrypt & Password Lock',
      category: 'security',
      description: 'AES-128/256-bit encryption with User & Owner passwords and granular document rights.',
      inputAccept: '.pdf',
      inputLabel: 'PDF File to Encrypt',
      outputLabel: 'Encrypted PDF',
      icon: <Lock size={14} strokeWidth={1.5} />,
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
      description: 'Unlock password-protected PDFs and export an unencrypted copy instantly.',
      inputAccept: '.pdf',
      inputLabel: 'Encrypted PDF',
      outputLabel: 'Unlocked PDF',
      icon: <Unlock size={14} strokeWidth={1.5} />,
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
      description: 'Embed custom text or image logo watermarks with opacity and angle controls.',
      inputAccept: '.pdf',
      inputLabel: 'PDF File',
      outputLabel: 'Watermarked PDF',
      icon: <ShieldCheck size={14} strokeWidth={1.5} />,
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
            opts.watermarkText || 'CONFIDENTIAL',
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
      icon: <Layers size={14} strokeWidth={1.5} />,
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
      icon: <Scissors size={14} strokeWidth={1.5} />,
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
      icon: <RotateCw size={14} strokeWidth={1.5} />,
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
      description: 'Compress PDF structure and object streams to reduce file size.',
      inputAccept: '.pdf',
      inputLabel: 'PDF File',
      outputLabel: 'Compressed PDF',
      icon: <Zap size={14} strokeWidth={1.5} />,
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
      description: 'Blackout sensitive header/footer regions or text coordinates.',
      inputAccept: '.pdf',
      inputLabel: 'PDF File',
      outputLabel: 'Redacted PDF',
      icon: <EyeOff size={14} strokeWidth={1.5} />,
      action: async (files, _opts, onProgress) => {
        const arrayBuffer = await files[0].arrayBuffer();
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
      description: 'Render each PDF page as high-resolution image with 1-click ZIP archive download.',
      inputAccept: '.pdf',
      inputLabel: 'PDF File',
      outputLabel: 'High-Res Images / ZIP',
      icon: <ImageIcon size={14} strokeWidth={1.5} />,
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
      icon: <FileText size={14} strokeWidth={1.5} />,
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
      icon: <FileText size={14} strokeWidth={1.5} />,
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
      icon: <FileText size={14} strokeWidth={1.5} />,
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
      description: 'Pixel (WxH) or percentage aspect-ratio scaling.',
      inputAccept: '.jpg,.jpeg,.png,.webp,.bmp',
      inputLabel: 'Image File',
      outputLabel: 'Resized Image',
      icon: <Sliders size={14} strokeWidth={1.5} />,
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
      description: 'Format conversion between PNG, JPG, WebP, BMP, and ICO.',
      inputAccept: '.jpg,.jpeg,.png,.webp,.bmp,.ico',
      inputLabel: 'Source Image',
      outputLabel: 'Converted Image',
      icon: <RefreshCw size={14} strokeWidth={1.5} />,
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
      description: 'Edge detection & color tolerance background removal to transparent PNG.',
      inputAccept: '.jpg,.jpeg,.png,.webp',
      inputLabel: 'Source Image',
      outputLabel: 'Transparent PNG',
      icon: <Sparkles size={14} strokeWidth={1.5} />,
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
      description: 'Strip EXIF metadata (GPS location, device camera, capture date) for privacy.',
      inputAccept: '.jpg,.jpeg,.png,.webp',
      inputLabel: 'Image File',
      outputLabel: 'Clean Image',
      icon: <ShieldCheck size={14} strokeWidth={1.5} />,
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
      setStatus('Processing complete');
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
    <div className="space-y-4">
      {/* Category Tabs & Tool Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
        {TOOLS.map(tool => {
          const active = activeToolId === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => { setActiveToolId(tool.id); reset(); }}
              className={cn(
                'h-[64px] p-2.5 rounded-[6px] border text-left transition-colors duration-100 flex flex-col justify-between cursor-pointer',
                active
                  ? 'bg-white/[0.08] border-white/20 text-white'
                  : 'bg-[#131823] border-white/[0.08] text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              )}
            >
              <div className={active ? 'text-slate-200' : 'text-slate-500'}>
                {tool.icon}
              </div>
              <span className="text-[11px] font-medium leading-tight truncate w-full">{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Tool Console */}
      <div className="bg-[#131823] border border-white/[0.08] rounded-[6px] p-5 space-y-4 relative">
        {/* Active Tool Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-slate-300">{activeTool.icon}</span>
              <h3 className="text-sm font-medium text-white">{activeTool.label}</h3>
            </div>
            <p className="text-xs text-slate-400 font-normal max-w-xl">{activeTool.description}</p>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/[0.03] border border-white/[0.08] rounded-[4px] shrink-0">
            <ShieldCheck size={12} strokeWidth={1.5} className="text-slate-400" />
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Local Engine
            </span>
          </div>
        </div>

        {/* Granular Tool Parameters */}
        {activeToolId === 'pdf-encrypt' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#0B0E14] p-3.5 rounded-[4px] border border-white/[0.08]">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">User Open Password *</label>
              <input
                type="password"
                value={options.userPassword}
                onChange={e => setOptions(p => ({ ...p, userPassword: e.target.value }))}
                placeholder="Enter password required to open PDF"
                className="w-full h-8 bg-[#131823] border border-white/[0.08] px-2.5 text-xs text-slate-200 rounded-[4px] outline-none focus:border-white/20 font-normal"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Owner Permissions Password (Optional)</label>
              <input
                type="password"
                value={options.ownerPassword}
                onChange={e => setOptions(p => ({ ...p, ownerPassword: e.target.value }))}
                placeholder="Master password to modify permissions"
                className="w-full h-8 bg-[#131823] border border-white/[0.08] px-2.5 text-xs text-slate-200 rounded-[4px] outline-none focus:border-white/20 font-normal"
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-4 pt-1">
              {[
                ['disablePrinting', 'Disable Printing Rights'],
                ['disableCopying', 'Disable Text/Content Copying'],
                ['disableModifying', 'Disable Document Modification'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-1.5 text-xs font-normal text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!options[key]}
                    onChange={e => setOptions(p => ({ ...p, [key]: e.target.checked }))}
                    className="accent-blue-500 w-3.5 h-3.5 rounded-[3px]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        )}

        {activeToolId === 'pdf-unlock' && (
          <div className="space-y-1 bg-[#0B0E14] p-3.5 rounded-[4px] border border-white/[0.08] max-w-md">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Current PDF Password</label>
            <input
              type="password"
              value={options.userPassword}
              onChange={e => setOptions(p => ({ ...p, userPassword: e.target.value }))}
              placeholder="Enter password to decrypt PDF"
              className="w-full h-8 bg-[#131823] border border-white/[0.08] px-2.5 text-xs text-slate-200 rounded-[4px] outline-none focus:border-white/20 font-normal"
            />
          </div>
        )}

        {activeToolId === 'pdf-watermark' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#0B0E14] p-3.5 rounded-[4px] border border-white/[0.08]">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Watermark Text</label>
              <input
                type="text"
                value={options.watermarkText}
                onChange={e => setOptions(p => ({ ...p, watermarkText: e.target.value }))}
                placeholder="e.g. CONFIDENTIAL"
                className="w-full h-8 bg-[#131823] border border-white/[0.08] px-2.5 text-xs text-slate-200 rounded-[4px] outline-none focus:border-white/20 font-normal"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Opacity (0.05 to 1.0)</label>
              <input
                type="number"
                step="0.05"
                min="0.05"
                max="1.0"
                value={options.watermarkOpacity}
                onChange={e => setOptions(p => ({ ...p, watermarkOpacity: e.target.value }))}
                className="w-full h-8 bg-[#131823] border border-white/[0.08] px-2.5 text-xs text-slate-200 rounded-[4px] outline-none focus:border-white/20 font-mono tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Rotation Angle (°)</label>
              <input
                type="number"
                value={options.watermarkRotation}
                onChange={e => setOptions(p => ({ ...p, watermarkRotation: e.target.value }))}
                className="w-full h-8 bg-[#131823] border border-white/[0.08] px-2.5 text-xs text-slate-200 rounded-[4px] outline-none focus:border-white/20 font-mono tabular-nums"
              />
            </div>
          </div>
        )}

        {activeToolId === 'pdf-split' && (
          <div className="space-y-1 bg-[#0B0E14] p-3.5 rounded-[4px] border border-white/[0.08] max-w-md">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Extract Page Ranges</label>
            <input
              type="text"
              value={options.splitRange}
              onChange={e => setOptions(p => ({ ...p, splitRange: e.target.value }))}
              placeholder="e.g. 1-3, 5, 8-10 (leave empty for single-page files)"
              className="w-full h-8 bg-[#131823] border border-white/[0.08] px-2.5 text-xs text-slate-200 rounded-[4px] outline-none focus:border-white/20 font-mono tabular-nums"
            />
          </div>
        )}

        {activeToolId === 'pdf-rotate' && (
          <div className="flex gap-3 bg-[#0B0E14] p-3.5 rounded-[4px] border border-white/[0.08] w-fit">
            {['90', '180', '270'].map(deg => (
              <label key={deg} className="flex items-center gap-1.5 text-xs font-normal text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="rot"
                  value={deg}
                  checked={options.rotation === deg}
                  onChange={() => setOptions(p => ({ ...p, rotation: deg }))}
                  className="accent-blue-500"
                />
                {deg}° Clockwise
              </label>
            ))}
          </div>
        )}

        {activeToolId === 'image-resize' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#0B0E14] p-3.5 rounded-[4px] border border-white/[0.08]">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Resize Percentage (%)</label>
              <input
                type="number"
                value={options.resizePercent}
                onChange={e => setOptions(p => ({ ...p, resizePercent: e.target.value }))}
                placeholder="50 = 50% scaling"
                className="w-full h-8 bg-[#131823] border border-white/[0.08] px-2.5 text-xs text-slate-200 rounded-[4px] outline-none focus:border-white/20 font-mono tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Target Width (px)</label>
              <input
                type="number"
                value={options.resizeWidth}
                onChange={e => setOptions(p => ({ ...p, resizeWidth: e.target.value }))}
                className="w-full h-8 bg-[#131823] border border-white/[0.08] px-2.5 text-xs text-slate-200 rounded-[4px] outline-none focus:border-white/20 font-mono tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Target Height (px)</label>
              <input
                type="number"
                value={options.resizeHeight}
                onChange={e => setOptions(p => ({ ...p, resizeHeight: e.target.value }))}
                className="w-full h-8 bg-[#131823] border border-white/[0.08] px-2.5 text-xs text-slate-200 rounded-[4px] outline-none focus:border-white/20 font-mono tabular-nums"
              />
            </div>
          </div>
        )}

        {activeToolId === 'image-convert' && (
          <div className="flex gap-3 bg-[#0B0E14] p-3.5 rounded-[4px] border border-white/[0.08] w-fit">
            {[['png', 'PNG'], ['jpeg', 'JPG'], ['webp', 'WebP'], ['ico', 'ICO']].map(([val, label]) => (
              <label key={val} className="flex items-center gap-1.5 text-xs font-normal text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="fmt"
                  value={val}
                  checked={(options.targetImgFormat || 'webp') === val}
                  onChange={() => setOptions(p => ({ ...p, targetImgFormat: val }))}
                  className="accent-blue-500"
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
        />

        {/* Selected File List */}
        {files.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-normal">
              <span>Selected ({files.length} file{files.length > 1 ? 's' : ''}):</span>
              <button onClick={reset} className="text-slate-500 hover:text-rose-400 transition-colors duration-100 cursor-pointer">Clear</button>
            </div>
            <div className="space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-[#0B0E14] h-8 px-2.5 rounded-[4px] border border-white/[0.08] text-xs">
                  <span className="truncate text-slate-200 font-normal max-w-md">{f.name}</span>
                  <span className="text-[10px] font-mono tabular-nums text-slate-500">{(f.size / 1024).toFixed(0)} KB</span>
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
            className="w-full h-9 bg-white text-slate-950 font-medium text-xs rounded-[4px] hover:bg-slate-100 transition-colors duration-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {converting ? (
              <><Loader2 size={14} strokeWidth={1.5} className="animate-spin" /> <span>{status || 'Processing...'}</span></>
            ) : (
              <><span>Execute {activeTool.label}</span> <ArrowRight size={14} strokeWidth={1.5} /></>
            )}
          </button>
        )}

        {/* Execution Progress Bar */}
        {converting && <ProgressBar progress={progress} status={status} />}

        {/* Error Message Alert */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-[4px] text-rose-400 text-xs font-normal">
            {error}
          </div>
        )}

        {/* Download Results List */}
        {results.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span>Generated Output Files ({results.length}):</span>
              <span className="text-slate-500 text-[10px] font-mono">100% Local Export</span>
            </div>
            <div className="space-y-1.5">
              {results.map((res, idx) => (
                <DownloadButton key={idx} result={res} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
