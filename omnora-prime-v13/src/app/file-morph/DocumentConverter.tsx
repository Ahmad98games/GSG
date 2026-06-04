'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload, Download, ArrowRight,
  FileText, FileSpreadsheet, Image, ScanLine,
  Scissors, RotateCw, Lock, Zap, X, Loader2,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type ConversionTool = {
  id: string;
  label: string;
  description: string;
  inputAccept: string;
  inputLabel: string;
  outputLabel: string;
  multiFile?: boolean;
  color: string;
  icon: React.ReactNode;
  action: (
    files: File[],
    options: Record<string, string>,
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
      className={`border-2 border-dashed rounded-lg py-12 text-center cursor-pointer transition-all duration-200 group ${
        dragging
          ? `border-[${color}] bg-[${color}]/5`
          : 'border-white/10 hover:border-white/25 hover:bg-white/[0.02]'
      }`}
    >
      <div className={`w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
        <Upload size={22} className="text-gray-500" />
      </div>
      <p className="text-sm font-medium text-gray-300 mb-1">Drop {label} here</p>
      <p className="text-xs text-gray-600">or click to browse your files</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={e => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFiles(files);
          e.target.value = ''; // allow re-selecting same file
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
      <div className="flex justify-between text-[10px] font-medium text-gray-500">
        <span>{status}</span>
        <span>{progress}%</span>
      </div>
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#60A5FA] to-[#818CF8] rounded-full"
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
      className={`flex items-center gap-2.5 w-full py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
        clicked
          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
          : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
      }`}
    >
      {clicked ? <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" /> : <Download size={14} className="flex-shrink-0" />}
      <span className="truncate text-xs">{result.name}</span>
      <span className="ml-auto text-[10px] text-gray-600 flex-shrink-0">
        {(result.blob.size / 1024).toFixed(0)} KB
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────
// Main DocumentConverter component
// ─────────────────────────────────────────────

export function DocumentConverter() {
  const [activeToolId, setActiveToolId] = useState('pdf-to-word');
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [converting, setConverting] = useState(false);
  const [results, setResults] = useState<{ name: string; blob: Blob }[]>([]);
  const [error, setError] = useState('');
  const [options, setOptions] = useState<Record<string, string>>({});

  const TOOLS: ConversionTool[] = [
    {
      id: 'pdf-to-word',
      label: 'PDF → Word',
      description: 'Extract text from PDF into an editable Word document (.docx)',
      inputAccept: '.pdf',
      inputLabel: 'PDF file',
      outputLabel: '.docx document',
      color: '#60A5FA',
      icon: <FileText size={15} />,
      action: async (files, _opts, onProgress) => {
        const { pdfToDocx } = await import('@/lib/converters/pdfToWord');
        const blob = await pdfToDocx(files[0], p => onProgress(p));
        return [{ name: files[0].name.replace(/\.pdf$/i, '.docx'), blob }];
      },
    },
    {
      id: 'word-to-pdf',
      label: 'Word → PDF',
      description: 'Convert Word documents or text files to PDF',
      inputAccept: '.docx,.doc,.txt',
      inputLabel: 'Word or text file',
      outputLabel: 'PDF file',
      color: '#60A5FA',
      icon: <FileText size={15} />,
      action: async (files, _opts, onProgress) => {
        const { wordToPdf } = await import('@/lib/converters/pdfToWord');
        const blob = await wordToPdf(files[0], p => onProgress(p));
        return [{ name: files[0].name.replace(/\.(docx?|txt)$/i, '.pdf'), blob }];
      },
    },
    {
      id: 'pdf-to-excel',
      label: 'PDF → Excel',
      description: 'Extract tables and text from PDF into an Excel spreadsheet',
      inputAccept: '.pdf',
      inputLabel: 'PDF file',
      outputLabel: 'Excel spreadsheet (.xlsx)',
      color: '#34D399',
      icon: <FileSpreadsheet size={15} />,
      action: async (files, _opts, onProgress) => {
        const { pdfToExcel } = await import('@/lib/converters/pdfToExcel');
        const blob = await pdfToExcel(files[0], p => onProgress(p));
        return [{ name: files[0].name.replace(/\.pdf$/i, '.xlsx'), blob }];
      },
    },
    {
      id: 'excel-to-pdf',
      label: 'Excel → PDF',
      description: 'Convert Excel spreadsheets or CSV files to PDF',
      inputAccept: '.xlsx,.xls,.csv',
      inputLabel: 'Excel or CSV file',
      outputLabel: 'PDF file',
      color: '#34D399',
      icon: <FileSpreadsheet size={15} />,
      action: async (files, _opts, onProgress) => {
        const { excelToPdf } = await import('@/lib/converters/pdfToExcel');
        const blob = await excelToPdf(files[0], p => onProgress(p));
        return [{ name: files[0].name.replace(/\.(xlsx?|csv)$/i, '.pdf'), blob }];
      },
    },
    {
      id: 'pdf-to-images',
      label: 'PDF → Images',
      description: 'Render each PDF page as a high-resolution PNG or JPG image',
      inputAccept: '.pdf',
      inputLabel: 'PDF file',
      outputLabel: 'Images (one per page)',
      color: '#F472B6',
      icon: <Image size={15} />,
      action: async (files, opts, onProgress) => {
        const { pdfToImages } = await import('@/lib/converters/pdfToImage');
        return await pdfToImages(
          files[0],
          (opts.format as 'png' | 'jpg') || 'png',
          p => onProgress(p)
        );
      },
    },
    {
      id: 'images-to-pdf',
      label: 'Images → PDF',
      description: 'Combine multiple images into a single PDF document',
      inputAccept: '.jpg,.jpeg,.png,.webp',
      inputLabel: 'Images (select multiple)',
      outputLabel: 'Combined PDF',
      multiFile: true,
      color: '#F472B6',
      icon: <Image size={15} />,
      action: async (files, _opts, onProgress) => {
        const { imagesToPdf } = await import('@/lib/converters/pdfToImage');
        const blob = await imagesToPdf(files, p => onProgress(p));
        return [{ name: 'combined_images.pdf', blob }];
      },
    },
    {
      id: 'pdf-ocr',
      label: 'PDF OCR',
      description: 'Use OCR to extract text from scanned or image-based PDFs',
      inputAccept: '.pdf',
      inputLabel: 'Scanned PDF',
      outputLabel: 'Text file (.txt)',
      color: '#A78BFA',
      icon: <ScanLine size={15} />,
      action: async (files, opts, onProgress) => {
        const { ocrPdf } = await import('@/lib/converters/pdfOcr');
        const text = await ocrPdf(
          files[0],
          (opts.language as 'eng' | 'urd' | 'ara') || 'eng',
          (p, s) => onProgress(p, s)
        );
        const blob = new Blob([text], { type: 'text/plain' });
        return [{ name: files[0].name.replace(/\.pdf$/i, '_ocr.txt'), blob }];
      },
    },
    {
      id: 'pdf-split',
      label: 'Split PDF',
      description: 'Split a PDF into individual single-page files',
      inputAccept: '.pdf',
      inputLabel: 'PDF to split',
      outputLabel: 'Individual page PDFs',
      color: '#FB923C',
      icon: <Scissors size={15} />,
      action: async (files, _opts, onProgress) => {
        const { splitPdf } = await import('@/lib/converters/pdfTools');
        return await splitPdf(files[0], p => onProgress(p));
      },
    },
    {
      id: 'pdf-rotate',
      label: 'Rotate PDF',
      description: 'Rotate all pages in a PDF by 90°, 180°, or 270°',
      inputAccept: '.pdf',
      inputLabel: 'PDF to rotate',
      outputLabel: 'Rotated PDF',
      color: '#FB923C',
      icon: <RotateCw size={15} />,
      action: async (files, opts, onProgress) => {
        const { rotatePdf } = await import('@/lib/converters/pdfTools');
        const deg = parseInt(opts.rotation || '90') as 90 | 180 | 270;
        const blob = await rotatePdf(files[0], deg, p => onProgress(p));
        return [{ name: files[0].name.replace(/\.pdf$/i, `_rotated${deg}.pdf`), blob }];
      },
    },
    {
      id: 'pdf-compress',
      label: 'Compress PDF',
      description: 'Reduce PDF file size by removing redundant metadata',
      inputAccept: '.pdf',
      inputLabel: 'PDF to compress',
      outputLabel: 'Compressed PDF',
      color: '#FBBF24',
      icon: <Zap size={15} />,
      action: async (files, _opts, onProgress) => {
        const { compressPdf } = await import('@/lib/converters/pdfTools');
        const blob = await compressPdf(files[0], p => onProgress(p));
        return [{ name: files[0].name.replace(/\.pdf$/i, '_compressed.pdf'), blob }];
      },
    },
    {
      id: 'pdf-protect',
      label: 'Protect PDF',
      description: 'Wrap a PDF in a password-protected ZIP archive',
      inputAccept: '.pdf',
      inputLabel: 'PDF to protect',
      outputLabel: 'Password-protected ZIP',
      color: '#F87171',
      icon: <Lock size={15} />,
      action: async (files, opts, onProgress) => {
        if (!opts.password) throw new Error('Enter a password first');
        const { protectPdf } = await import('@/lib/converters/pdfTools');
        const blob = await protectPdf(files[0], opts.password, p => onProgress(p));
        return [{ name: files[0].name.replace(/\.pdf$/i, '_protected.zip'), blob }];
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
    setStatus('Starting...');

    try {
      const output = await activeTool.action(files, options, (p, s) => {
        setProgress(p);
        setStatus(
          s || (p < 30 ? 'Preparing...' : p < 70 ? 'Converting...' : p < 95 ? 'Finishing...' : 'Done!')
        );
      });
      setResults(output);
      setStatus('Conversion complete!');
    } catch (err: any) {
      setError(err.message || 'Conversion failed. Please try again.');
    } finally {
      setConverting(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setResults([]);
    setError('');
    setProgress(0);
    setStatus('');
  };

  return (
    <div className="space-y-6">
      {/* Tool Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            onClick={() => { setActiveToolId(tool.id); reset(); }}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium rounded-lg border transition-all text-left ${
              activeToolId === tool.id
                ? 'bg-white/8 border-white/20 text-white shadow-inner'
                : 'bg-[#0F1114] border-white/6 text-gray-500 hover:border-white/15 hover:text-gray-300'
            }`}
          >
            <span className={`flex-shrink-0 ${activeToolId === tool.id ? 'text-[#60A5FA]' : 'text-gray-600'}`}>
              {tool.icon}
            </span>
            <span className="truncate leading-tight">{tool.label}</span>
          </button>
        ))}
      </div>

      {/* Workspace */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeToolId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="bg-[#0A0C0F] border border-white/6 rounded-xl p-6 space-y-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white mb-0.5">{activeTool.label}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{activeTool.description}</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/8 border border-emerald-500/15 rounded-full flex-shrink-0 ml-4">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest whitespace-nowrap">
                100% local
              </span>
            </div>
          </div>

          {/* Tool-specific options */}
          {activeToolId === 'pdf-to-images' && (
            <div className="flex gap-4">
              {[['png', 'PNG (lossless)'], ['jpg', 'JPG (smaller)']].map(([val, label]) => (
                <label key={val} className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                  <input
                    type="radio"
                    name="img-format"
                    value={val}
                    checked={(options.format || 'png') === val}
                    onChange={() => setOptions(p => ({ ...p, format: val }))}
                    className="accent-[#60A5FA]"
                  />
                  {label}
                </label>
              ))}
            </div>
          )}

          {activeToolId === 'pdf-ocr' && (
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 block mb-2">
                Document language
              </label>
              <select
                value={options.language || 'eng'}
                onChange={e => setOptions(p => ({ ...p, language: e.target.value }))}
                className="bg-[#161A1F] border border-white/10 text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-[#60A5FA]/40 min-w-[180px]"
              >
                <option value="eng">English</option>
                <option value="urd">Urdu</option>
                <option value="ara">Arabic</option>
              </select>
            </div>
          )}

          {activeToolId === 'pdf-rotate' && (
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 block mb-2">
                Rotation angle
              </label>
              <select
                value={options.rotation || '90'}
                onChange={e => setOptions(p => ({ ...p, rotation: e.target.value }))}
                className="bg-[#161A1F] border border-white/10 text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-[#60A5FA]/40 min-w-[180px]"
              >
                <option value="90">90° clockwise</option>
                <option value="180">180°</option>
                <option value="270">270° clockwise</option>
              </select>
            </div>
          )}

          {activeToolId === 'pdf-protect' && (
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 block mb-2">
                ZIP password
              </label>
              <input
                type="password"
                value={options.password || ''}
                onChange={e => setOptions(p => ({ ...p, password: e.target.value }))}
                placeholder="Enter a strong password..."
                className="w-full max-w-xs bg-[#161A1F] border border-white/10 text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-[#60A5FA]/40 placeholder:text-gray-700"
              />
            </div>
          )}

          {/* Drop zone or file list */}
          {files.length === 0 ? (
            <DropZone
              accept={activeTool.inputAccept}
              multiple={!!activeTool.multiFile}
              onFiles={setFiles}
              label={activeTool.inputLabel}
              color="#60A5FA"
            />
          ) : (
            <div className="space-y-3">
              {/* File list */}
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-white/4 border border-white/6 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#60A5FA]/10 flex items-center justify-center flex-shrink-0 text-[#60A5FA]">
                        {activeTool.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">{f.name}</p>
                        <p className="text-[10px] text-gray-600">
                          {f.size < 1024 * 1024
                            ? `${(f.size / 1024).toFixed(1)} KB`
                            : `${(f.size / 1024 / 1024).toFixed(2)} MB`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                      className="text-gray-700 hover:text-red-400 transition-colors ml-3 flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              {results.length === 0 && !converting && (
                <div className="flex gap-2.5">
                  <button
                    onClick={reset}
                    className="px-4 py-2.5 text-xs border border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300 transition-all rounded-lg"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleConvert}
                    className="flex-1 py-2.5 text-sm font-semibold bg-[#60A5FA] text-black hover:bg-blue-300 transition-colors rounded-lg flex items-center justify-center gap-2"
                  >
                    <ArrowRight size={15} />
                    Convert to {activeTool.outputLabel}
                  </button>
                </div>
              )}

              {/* Progress */}
              {converting && <ProgressBar progress={progress} status={status} />}

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg text-xs text-red-400 leading-relaxed"
                >
                  {error}
                </motion.div>
              )}

              {/* Results */}
              {results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <p className="text-xs font-semibold text-emerald-400">
                      {results.length} file{results.length > 1 ? 's' : ''} ready to download
                    </p>
                  </div>
                  <div className="space-y-2">
                    {results.map((r, i) => (
                      <DownloadButton key={i} result={r} />
                    ))}
                  </div>
                  <button
                    onClick={reset}
                    className="text-xs text-gray-600 hover:text-gray-400 transition-colors pt-1"
                  >
                    ← Convert another file
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
