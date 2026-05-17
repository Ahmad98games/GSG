'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { 
  ScanLine, Upload, X, CheckCircle2, AlertTriangle, 
  FileText, ChevronRight, Plus, Loader2,
  Database, Smartphone, History, Layers,
  CheckCircle, Play
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useTierStore } from '@/stores/tierStore'
import { useToast } from '@/hooks/useToast'
import { OcrEngine } from '@/lib/lens/ocrEngine'
import * as documentIntelligence from '@/lib/lens/documentIntelligence'
import { ExtractedDocument } from '@/lib/lens/documentIntelligence'
import { generateSearchablePdf, uploadLensPdf } from '@/lib/lens/pdfGenerator'


export default function LensPage() {
  const { profile } = useBusinessProfile()
  const [documentImage, setDocumentImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStage, setAnalysisStage] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ExtractedDocument | null>(null)
  const [isMobileConnected, setIsMobileConnected] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState<{ reason: string } | null>(null)
  
  // Batch State
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [batchStats, setBatchStats] = useState({ total: 0, current: 0, matched: 0, duplicates: 0 })
  const [showBatchSummary, setShowBatchSummary] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const { getLensScansRemaining, tier } = useTierStore()
  const toast = useToast()

  // Poll for mobile scans
  useEffect(() => {
    if (!profile?.id) return

    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from('lens_scans_incoming')
        .select('*')
        .eq('business_id', profile.id)
        .eq('processed', false)
        .order('received_at', { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        setIsMobileConnected(true)
        const scan = data[0]
        // Mark as processed in background
        await supabase.from('lens_scans_incoming').update({ processed: true }).eq('id', scan.id)
      } else {
        // If no active session found in pulse or similar, we might want to toggle this
        // But for now, we just let it be false if no scans come in
      }
    }, 5000)

    return () => clearInterval(pollInterval)
  }, [profile?.id, supabase])

  async function validateDocumentImage(dataUrl: string): Promise<{ isValid: boolean; reason?: string }> {
    setAnalysisStage('Noxis Intelligence: Validating...')
    
    // Extract image dimensions from base64
    return new Promise((resolve) => {
      const img = new Image()
      img.src = dataUrl
      img.onload = () => {
        const { width, height } = img
        if (width < 200 || height < 200) {
          resolve({
            isValid: false,
            reason: 'Image too small. Please take a closer photo of the document.'
          })
        } else {
          resolve({ isValid: true })
        }
      }
      img.onerror = () => resolve({ isValid: false, reason: 'Failed to read image data.' })
    })
  }

  const saveToHistory = async (dataUrl: string, extractedData: ExtractedDocument) => {
    if (!profile?.id) return
    
    try {
      // Convert dataUrl to blob for storage
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      const filename = `scan_${Date.now()}.jpg`
      
      // Upload image to Supabase Storage
      const { data: uploadData } = await supabase
        .storage.from('lens-scans')
        .upload(`${profile.id}/${filename}`, blob, { contentType: 'image/jpeg' })
      
      const imageUrl = supabase.storage
        .from('lens-scans')
        .getPublicUrl(`${profile.id}/${filename}`).data.publicUrl
      
      // Save record
      await supabase.from('lens_scans_incoming').insert({
        business_id: profile.id,
        image_url: imageUrl,
        extracted_data: extractedData,
        document_type: extractedData.type,
        confidence: extractedData.confidence,
        processed: true,
        received_at: new Date().toISOString()
      })
      
      // Refetch history logic would go here if needed
    } catch (err) {
      console.error('Failed to save to history:', err)
    }
  }

  const analyzeDocument = async (imgUrl?: string) => {
    const img = imgUrl || documentImage
    if (!img || !profile?.id) return
    
    // Tier Limit Check
    const remaining = await getLensScansRemaining()
    if (remaining !== null && remaining <= 0) {
      toast.error(
        'Daily limit reached',
        `You have used all 5 daily scans on the ${tier} plan. Upgrade for unlimited.`
      )
      return
    }

    if (remaining === 1) {
      toast.info(
        'Last free scan',
        'This is your last free scan for today. Upgrade to Pro for unlimited.'
      )
    }

    setIsAnalyzing(true)
    setValidationError(null)
    setResult(null)
    setAnalysisStage('Initializing...')
    setProgress(0)

    try {
      // Problem 1: Validation
      const validation = await validateDocumentImage(img)
      if (!validation.isValid) {
        setValidationError({ reason: validation.reason! })
        setIsAnalyzing(false)
        setAnalysisStage(null)
        return
      }

      setAnalysisStage('Reading text...')
      const text = await OcrEngine.extractText(img, (p) => {
        setProgress(Math.round(p * 100))
      })
      
      if (text.length > 20) setAnalysisStage('Document read ✓')
      else if (text.length >= 5) setAnalysisStage('Partial read — try better lighting')
      else setAnalysisStage('Could not read text — ensure focus')

      setAnalysisStage('Analyzing content...')
      const extracted = await documentIntelligence.analyzeDocument(text, profile.id)
      
      setResult(extracted)
      
      // Problem 2: Save to History
      await saveToHistory(img, extracted)
      
      setAnalysisStage(null)
      return extracted
    } catch (err) {
      console.error('OCR error:', err)
      setAnalysisStage('Error processing')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFileSelect = (file: File) => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result !== 'string') return;

      // Ensure data: prefix is present (robustness for various browser behaviors)
      const dataUrl = result.startsWith('data:') 
        ? result 
        : `data:${file.type || 'image/jpeg'};base64,${result}`;

      setDocumentImage(dataUrl);
      
      // Auto-start analysis with the guaranteed string URL
      analyzeDocument(dataUrl);
    };
    reader.onerror = () => setAnalysisStage('Error reading file');
    reader.readAsDataURL(file);
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  // react-dropzone is replaced by manual handlers per fix requirements

  const handleSaveScan = async () => {
    if (!result || !documentImage || !profile?.id) return
    setAnalysisStage('Generating PDF...')
    setIsAnalyzing(true)

    try {
      const pdfBlob = await generateSearchablePdf(
        documentImage, 
        result.rawText || '', 
        `${result.type}_${result.invoiceNumber || Date.now()}.pdf`
      )
      
      const scanId = crypto.randomUUID()
      const { url } = await uploadLensPdf(pdfBlob, profile.id, scanId)

      // Update the record in incoming_scans or create a final record
      await supabase.from('lens_scans_incoming').insert({
        business_id: profile.id,
        source_node_id: 'WEB_HUB',
        received_at: new Date().toISOString(),
        processed: true,
        extracted_data: { ...result, pdf_url: url }
      })

      setAnalysisStage('Saved successfully!')
      setTimeout(() => {
        setResult(null)
        setDocumentImage(null)
      }, 1500)
    } catch (err) {
      console.error(err)
      setAnalysisStage('Failed to save PDF')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const startBatchProcess = async () => {
    if (!profile?.id) return
    setIsBatchProcessing(true)
    setShowBatchSummary(false)
    
    try {
      const { data: unprocessed } = await supabase
        .from('lens_scans_incoming')
        .select('*')
        .eq('business_id', profile.id)
        .eq('processed', false)

      if (!unprocessed?.length) {
        setAnalysisStage('No new scans found')
        setIsBatchProcessing(false)
        return
      }

      setBatchStats({ total: unprocessed.length, current: 0, matched: 0, duplicates: 0 })

      for (let i = 0; i < unprocessed.length; i++) {
        const scan = unprocessed[i]
        setBatchStats(prev => ({ ...prev, current: i + 1 }))
        
        // In real app, we'd need to fetch the image bytes or URL
        // If it's a URL in extracted_data, we can use it.
        // For this demo, we simulate the processing if no image_data is present
        if (scan.image_data) {
          const res = await analyzeDocument(scan.image_data)
          if (!res) continue
          await supabase.from('lens_scans_incoming')
            .update({ processed: true, extracted_data: res })
            .eq('id', scan.id)
          
          if (res.matchedPartyId) setBatchStats(prev => ({ ...prev, matched: prev.matched + 1 }))
          if (res.isDuplicate) setBatchStats(prev => ({ ...prev, duplicates: prev.duplicates + 1 }))
        }
      }

      setShowBatchSummary(true)
    } catch (err) {
      console.error(err)
    } finally {
      setIsBatchProcessing(false)
    }
  }

  const handleUpdateField = (field: keyof ExtractedDocument, value: any) => {
    if (!result) return
    setResult({ ...result, [field]: value })
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Top Navigation / Controls */}
      <div className="flex items-center justify-between">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-3">
            <ScanLine className="w-8 h-8 text-electric-blue" />
            NOXIS LENS
          </h1>
          <p className="text-gray-500 text-sm">Industrial Document Intelligence & OCR Hub</p>
        </header>

        <div className="flex items-center gap-3">
          <Link href="/lens/history">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">
              <History className="w-4 h-4" />
              Scan History
            </button>
          </Link>
          <button 
            onClick={startBatchProcess}
            disabled={isBatchProcessing}
            className="flex items-center gap-2 px-4 py-2.5 bg-electric-blue text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-400 transition-all disabled:opacity-50"
          >
            {isBatchProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
            Process All Incoming
          </button>
        </div>
      </div>

      {showBatchSummary && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-center justify-between overflow-hidden"
        >
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-black">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Batch Complete</h3>
              <p className="text-sm text-emerald-500/80">Analyzed {batchStats.total} documents successfully</p>
            </div>
            <div className="h-10 w-[1px] bg-white/10 mx-2" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              <span className="text-xxs font-semibold tracking-wide-md uppercase text-gray-500">Matched Parties</span>
              <span className="text-xxs font-semibold tracking-wide-md uppercase text-gray-500">Duplicates</span>
              <span className="text-sm font-bold text-white">{batchStats.matched}</span>
              <span className="text-sm font-bold text-critical-red">{batchStats.duplicates}</span>
            </div>
          </div>
          <button onClick={() => setShowBatchSummary(false)} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT: Upload / Scan */}
        <div className="space-y-6">
          <div 
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "relative aspect-[4/3] rounded-2xl border-2 border-dashed transition-all cursor-pointer group overflow-hidden flex flex-col items-center justify-center",
              documentImage ? "border-electric-blue/50 bg-black/40" : 
              isDragging ? "border-electric-blue bg-electric-blue/10 scale-[1.02]" : "border-white/10 hover:border-electric-blue/30 bg-white/[0.02]"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
              }}
            />
            {documentImage ? (
              <div className="relative w-full h-full">
                <img 
                  src={documentImage} 
                  alt="Scanned document" 
                  className="w-full h-full object-contain" 
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    console.error('Image load error:', e)
                    // Show error state instead of broken icon
                    setAnalysisStage('Image Load Error')
                  }}
                />
                
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-12 h-12 text-electric-blue animate-spin" />
                    <div className="text-center">
                      <p className="text-white font-black uppercase tracking-widest">{analysisStage}</p>
                      <p className="text-electric-blue font-mono text-lg">{progress}%</p>
                    </div>
                  </div>
                )}

                {validationError && (
                  <div className="absolute inset-0 bg-red-950/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                    <div className="space-y-2">
                      <p className="text-white font-black uppercase tracking-tight text-lg">Intelligence Validation Failed</p>
                      <div className="h-0.5 w-12 bg-red-500 mx-auto my-2" />
                      <p className="text-red-200/80 text-xs leading-relaxed px-4">{validationError.reason}</p>
                      <p className="text-white/40 text-[9px] uppercase font-black tracking-[0.2em] pt-4">Noxis Lens Engine v4.0</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDocumentImage(null); setValidationError(null); }}
                      className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest"
                    >
                      Clear & Try Again
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-electric-blue/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Upload className={cn("w-10 h-10 text-electric-blue", isDragging && "animate-bounce")} />
                </div>
                <div className="space-y-1">
                  <p className="text-white font-bold">
                    {isDragging ? "Drop it here!" : "Drop a document image here"}
                  </p>
                  <p className="text-gray-500 text-xs">Scan from mobile app or upload a file above</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl transition-colors duration-500">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-2 h-2 rounded-full transition-all duration-1000",
                isMobileConnected ? "bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" : "bg-gray-700"
              )} />
              <span className="text-xs font-bold tracking-tight text-gray-400">
                {isMobileConnected ? (
                  <span className="text-emerald-500 uppercase tracking-widest">📱 Mobile ready — scan from Noxis app</span>
                ) : (
                  "Scan from mobile app or upload a file above"
                )}
              </span>
            </div>
          </div>

          {documentImage && !result && (
            <button
              onClick={() => analyzeDocument()}
              disabled={isAnalyzing}
              className="w-full py-4 bg-electric-blue text-white font-black rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {analysisStage}
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  ANALYZE DOCUMENT
                </>
              )}
            </button>
          )}

          {isAnalyzing && (
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                <span className="text-xxs font-semibold tracking-wide-md uppercase text-gray-500">Current Status</span>
                <span>{analysisStage}</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-electric-blue"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Extraction Results */}
        <div className="bg-[#121417] border border-white/5 rounded-2xl min-h-[600px] flex flex-col overflow-hidden shadow-2xl">
          {!result && !isAnalyzing ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                <FileText className="w-10 h-10 text-gray-600" />
              </div>
              <div className="space-y-2">
                <p className="text-gray-400 font-bold uppercase tracking-tighter">Ready for Intelligence</p>
                <p className="text-gray-600 text-sm max-w-xs">Upload a document to extract financial metadata and line items automatically.</p>
              </div>
            </div>
          ) : isAnalyzing ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-electric-blue animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ScanLine className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-white font-black uppercase tracking-widest animate-pulse">{analysisStage}</p>
                <p className="text-gray-500 text-xs">Processing industrial document intelligence...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <header className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-4">
                  {result && (
                    <>
                      <div className="status-pill bg-electric-blue/10 text-electric-blue">
                        {result.type.replace('_', ' ')}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full", result.confidence > 0.7 ? "bg-emerald-500" : result.confidence > 0.5 ? "bg-amber-500" : "bg-critical-red")}
                            style={{ width: `${result.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500">
                          {Math.round(result.confidence * 100)}% Match
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <button onClick={() => {setResult(null); setDocumentImage(null)}} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {result && result.isDuplicate && (
                  <div className="p-4 bg-critical-red/10 border border-critical-red/20 rounded-xl flex items-start gap-4">
                    <AlertTriangle className="w-5 h-5 text-critical-red shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white uppercase tracking-tighter">DUPLICATE ALERT</p>
                      <p className="text-xs text-critical-red/80">Invoice #{result.invoiceNumber} already exists. Record likely redundant.</p>
                    </div>
                  </div>
                )}

                {result && (
                  <>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xxs font-semibold tracking-wide-md uppercase text-gray-500">Party / Entity</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={result.partyName || ''} 
                            onChange={(e) => handleUpdateField('partyName', e.target.value)}
                            className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-electric-blue/50 outline-none transition-all"
                          />
                          {result.matchedPartyId && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xxs font-semibold tracking-wide-md uppercase text-gray-500">Doc Reference #</label>
                        <input 
                          type="text" 
                          value={result.invoiceNumber || ''} 
                          onChange={(e) => handleUpdateField('invoiceNumber', e.target.value)}
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-electric-blue/50 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xxs font-semibold tracking-wide-md uppercase text-gray-500">Date</label>
                        <input 
                          type="text" 
                          value={result.date || ''} 
                          onChange={(e) => handleUpdateField('date', e.target.value)}
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-electric-blue/50 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xxs font-semibold tracking-wide-md uppercase text-gray-500">Total Amount</label>
                        <input 
                          type="text" 
                          value={result.totalAmount || ''} 
                          onChange={(e) => handleUpdateField('totalAmount', e.target.value)}
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-white financial focus:border-electric-blue/50 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xxs font-semibold tracking-wide-md uppercase text-white flex items-center gap-2">
                          <Layers className="w-3 h-3 text-electric-blue" />
                          Detected Line Items
                        </h3>
                        <button className="p-1.5 hover:bg-white/5 rounded text-electric-blue transition-colors">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="border border-white/5 rounded-xl overflow-hidden bg-black/20">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-white/[0.01] border-b border-white/5 table-header">
                            <tr>
                              <th className="px-4 py-3">Description</th>
                              <th className="px-4 py-3">Qty</th>
                              <th className="px-4 py-3 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {result.lineItems?.map((item, i) => (
                              <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                                <td className="px-4 py-3 text-white font-medium">{item.description}</td>
                                <td className="px-4 py-3 text-gray-400">{item.qty || '1'}</td>
                                <td className="px-4 py-3 text-white financial text-right">{item.amount}</td>
                              </tr>
                            ))}
                            {!result.lineItems?.length && (
                              <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-gray-600 italic">No line items detected</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {result && (
                <footer className="p-6 border-t border-white/5 bg-white/[0.01] grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center gap-2 py-4 bg-[#60A5FA] text-white font-medium px-6 py-3 text-sm tracking-wide hover:bg-blue-400 transition-colors rounded-xl uppercase text-[10px] tracking-widest">
                    {result.type === 'invoice' ? 'Create Invoice' : 
                    result.type === 'purchase_bill' ? 'Create Bill' : 'Post Entry'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleSaveScan}
                    disabled={isAnalyzing}
                    className="flex items-center justify-center gap-2 py-4 bg-white/5 text-white font-black rounded-xl hover:bg-white/10 transition-all uppercase text-[10px] tracking-widest border border-white/10"
                  >
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                    Save & Generate PDF
                  </button>
                </footer>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
