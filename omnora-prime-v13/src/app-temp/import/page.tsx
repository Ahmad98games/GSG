'use client'

import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { autoMapColumns, transformRow, FIELD_ALIASES } from '@/lib/import/columnMapper'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  FileText, 
  ArrowRight, 
  Check, 
  X, 
  Sparkles, 
  Database, 
  FileSpreadsheet, 
  ChevronRight, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Package,
  Users,
  HardHat
} from 'lucide-react'

type ImportStep = 'upload' | 'map' | 'preview' | 'complete'

const ENTITY_CONFIG = {
  skus: {
    label: 'Products & Fabric SKUs',
    description: 'Import fabric items, raw materials, accessories, and finished goods.',
    required: ['name'],
    table: 'skus',
    icon: Package,
    color: '#60A5FA',
    bgLight: 'rgba(96, 165, 250, 0.05)'
  },
  parties: {
    label: 'Customers & Suppliers',
    description: 'Import suppliers, business contacts, clients, and dealers.',
    required: ['name'],
    table: 'parties',
    icon: Users,
    color: '#C5A059',
    bgLight: 'rgba(197, 160, 89, 0.05)'
  },
  karigars: {
    label: 'Workers & Karigars',
    description: 'Import production artisans, operators, and wage-basis staff.',
    required: ['name'],
    table: 'karigars',
    icon: HardHat,
    color: '#10B981',
    bgLight: 'rgba(16, 185, 129, 0.05)'
  },
}

export default function ImportPage() {
  const { profile } = useBusinessProfile()
  const [step, setStep] = useState<ImportStep>('upload')
  const [entityType, setEntityType] = useState<string>('skus')
  const [rawData, setRawData] = useState<Record<string, unknown>[]>([])
  const [userColumns, setUserColumns] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string | null>>({})
  const [preview, setPreview] = useState<Record<string, unknown>[]>([])
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<{ success: number, failed: number, errors: string[] } | null>(null)
  const [fileName, setFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  // Parse uploaded file
  const handleFileUpload = useCallback(
    async (file: File) => {
      setFileName(file.name)
      
      try {
        let data: Record<string, unknown>[] = []
        
        if (file.name.endsWith('.csv')) {
          // CSV parsing
          await new Promise<void>((resolve) => {
            Papa.parse(file, {
              header: true,
              skipEmptyLines: true,
              dynamicTyping: false,
              complete: (results) => {
                data = results.data as Record<string, unknown>[]
                resolve()
              }
            })
          })
        } else {
          // Excel parsing
          const buffer = await file.arrayBuffer()
          const wb = XLSX.read(buffer, { type: 'array' })
          const ws = wb.Sheets[wb.SheetNames[0]]
          data = XLSX.utils.sheet_to_json(ws, {
            defval: '',
            raw: false,
          }) as Record<string, unknown>[]
        }
        
        if (!data.length) {
          alert('File is empty or could not be read')
          return
        }
        
        const columns = Object.keys(data[0])
        setRawData(data)
        setUserColumns(columns)
        
        // Auto-map columns
        const autoMap = autoMapColumns(
          columns,
          entityType as keyof typeof FIELD_ALIASES
        )
        setMapping(autoMap)
        setStep('map')
        
      } catch (err) {
        console.error('Parse error:', err)
        alert('Could not read this file. Try saving as CSV first.')
      }
    },
    [entityType]
  )

  // Drag over handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileUpload(file)
    },
    [handleFileUpload]
  )

  // Generate preview from mapping
  const generatePreview = () => {
    const previewed = rawData.slice(0, 10).map(row =>
      transformRow(row, mapping, entityType)
    )
    setPreview(previewed)
    setStep('preview')
  }

  // Run the actual import
  const runImport = async () => {
    if (!profile?.id) {
      alert('Business profile not loaded. Please wait a moment.')
      return
    }
    setImporting(true)
    
    const supabase = createClient()
    let success = 0
    let failed = 0
    const errors: string[] = []
    
    const config = ENTITY_CONFIG[entityType as keyof typeof ENTITY_CONFIG]
    
    // Process in batches of 50
    const BATCH = 50
    for (let i = 0; i < rawData.length; i += BATCH) {
      const batch = rawData.slice(i, i + BATCH)
      
      const transformed = batch
        .map(row => transformRow(row, mapping, entityType))
        .filter(row => {
          // Check required fields
          const isValid = config.required.every(f => row[f])
          if (!isValid) failed++
          return isValid
        })
        .map(row => ({
          ...row,
          business_id: profile.id,
          is_active: true,
        }))
      
      if (!transformed.length) continue
      
      const { error } = await supabase
        .from(config.table)
        .upsert(transformed, {
          onConflict: entityType === 'skus' ? 'sku_code' : 'id',
          ignoreDuplicates: false,
        })
      
      if (error) {
        failed += transformed.length
        errors.push(`Batch ${Math.ceil(i/BATCH)+1}: ${error.message}`)
      } else {
        success += transformed.length
      }
    }
    
    setResults({ success, failed, errors })
    setStep('complete')
    setImporting(false)
  }

  const selectedEntityConfig = ENTITY_CONFIG[entityType as keyof typeof ENTITY_CONFIG]
  const EntityIcon = selectedEntityConfig.icon

  return (
    <div className="min-h-screen bg-noxis-bg text-noxis-text p-6 md:p-8 font-ui">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="relative overflow-hidden rounded-sm glass-panel p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles size={160} className="text-electric-blue" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide-md text-electric-blue mb-1">
              <Sparkles size={14} className="animate-pulse" />
              <span>Noxis Core Migrator</span>
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic text-noxis-text">
              Smart Data Import
            </h1>
            <p className="text-xs text-noxis-text-muted mt-1 max-w-xl">
              Zero template constraints. Drag, drop, match user columns instantly using machine-assisted fuzzy alignments, and commit in real-time.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-noxis-overlay p-3 rounded-sm border border-noxis-border self-start md:self-auto">
            <Database size={20} className="text-sandstone-gold" />
            <div>
              <p className="text-[10px] font-black text-noxis-text-muted uppercase tracking-wider">Destination</p>
              <p className="text-xs font-bold text-noxis-text">{profile?.business_name || 'Loading Godown...'}</p>
            </div>
          </div>
        </div>
        
        {/* Step Indicator */}
        <div className="glass-panel p-4 rounded-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
            {[
              { id: 'upload', label: 'Select & Upload' },
              { id: 'map', label: 'Map Columns' },
              { id: 'preview', label: 'Data Verification' },
              { id: 'complete', label: 'Completion Report' },
            ].map((s, i) => {
              const steps = ['upload', 'map', 'preview', 'complete']
              const current = steps.indexOf(step)
              const thisStep = steps.indexOf(s.id)
              const isDone = thisStep < current
              const isActive = thisStep === current
              
              return (
                <div key={s.id} className="flex-1 flex items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-sm flex items-center justify-center text-xs font-bold font-data transition-all duration-300
                      ${isActive 
                        ? 'bg-electric-blue text-noxis-bg shadow-[0_0_15px_rgba(96,165,250,0.4)]' 
                        : isDone 
                        ? 'bg-noxis-success/20 text-noxis-success border border-noxis-success/30' 
                        : 'bg-noxis-overlay text-noxis-text-muted border border-noxis-border'}`}>
                      {isDone ? <Check size={14} /> : i + 1}
                    </div>
                    <div>
                      <p className={`text-xs font-bold tracking-tight transition-colors duration-300
                        ${isActive ? 'text-noxis-text' : isDone ? 'text-noxis-success' : 'text-noxis-text-muted'}`}>
                        {s.label}
                      </p>
                      <p className="text-[9px] text-noxis-text-muted leading-none mt-0.5">
                        {isActive ? 'Current Phase' : isDone ? 'Completed' : 'Upcoming'}
                      </p>
                    </div>
                  </div>
                  {i < 3 && (
                    <div className="hidden md:block flex-1 h-px bg-noxis-border mx-4" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* STEP 1: Upload */}
        {step === 'upload' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Entity selector */}
            <div className="glass-panel p-6 rounded-sm space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wide-md text-noxis-text-muted">
                  1. Choose Target Entity Type
                </h3>
                <p className="text-[11px] text-noxis-text-muted">
                  Match the format of your sheet with the corresponding database target.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(ENTITY_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.icon
                  const isSelected = entityType === key
                  return (
                    <button
                      key={key}
                      onClick={() => setEntityType(key)}
                      className={`p-5 text-left border rounded-sm transition-all duration-300 relative overflow-hidden group
                        ${isSelected 
                          ? 'border-electric-blue bg-noxis-overlay' 
                          : 'border-noxis-border hover:border-noxis-text-muted bg-noxis-surface/40'}`}
                      style={{
                        boxShadow: isSelected ? `inset 0 0 20px rgba(96,165,250,0.02)` : undefined
                      }}
                    >
                      {isSelected && (
                        <div className="absolute top-0 right-0 w-2 h-2 bg-electric-blue rounded-bl-sm" />
                      )}
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-sm bg-noxis-overlay border border-noxis-border text-noxis-text group-hover:text-electric-blue transition-colors">
                          <Icon size={18} style={{ color: isSelected ? cfg.color : undefined }} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide-sm text-noxis-text">
                            {cfg.label}
                          </p>
                          <p className="text-[10px] text-noxis-text-muted leading-tight mt-1">
                            {cfg.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('file-input')?.click()}
              className={`glass-panel border-2 border-dashed rounded-sm p-16 text-center cursor-pointer transition-all duration-300 relative group
                ${isDragging 
                  ? 'border-electric-blue bg-electric-blue/5' 
                  : 'border-noxis-border hover:border-noxis-text-muted hover:bg-noxis-overlay'}`}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-radial-gradient from-electric-blue/10 to-transparent pointer-events-none" />
              
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 bg-noxis-overlay border border-noxis-border`}>
                  <Upload size={28} className="text-electric-blue" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-wide-sm text-noxis-text mb-1">
                  Drag and drop spreadsheet here
                </h3>
                <p className="text-xs text-noxis-text-muted mb-6">
                  Supports Excel (.xlsx, .xls) and CSV files
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-noxis-surface border border-noxis-border rounded-sm text-xs font-bold text-noxis-text group-hover:border-noxis-text-muted transition-colors">
                  <FileSpreadsheet size={14} className="text-sandstone-gold" />
                  Select File from Machine
                </div>
              </div>
            </div>
            
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) handleFileUpload(f)
              }}
            />
            
            {/* Template download */}
            <div className="glass-panel p-5 rounded-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-sm bg-noxis-overlay border border-noxis-border">
                  <FileText size={18} className="text-sandstone-gold" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-noxis-text">Need standard formatting guidance?</h4>
                  <p className="text-[11px] text-noxis-text-muted">
                    Download our clean Excel layout configured specifically for {selectedEntityConfig.label}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const cfg = ENTITY_CONFIG[entityType as keyof typeof ENTITY_CONFIG]
                  const fields = Object.keys(FIELD_ALIASES[entityType as keyof typeof FIELD_ALIASES] || {})
                  const ws = XLSX.utils.aoa_to_sheet([fields])
                  XLSX.utils.sheet_add_aoa(ws, [fields.map(() => '')], { origin: 1 })
                  const wb = XLSX.utils.book_new()
                  XLSX.utils.book_append_sheet(wb, ws, cfg.label)
                  XLSX.writeFile(wb, `noxis_${entityType}_template.xlsx`)
                }}
                className="w-full md:w-auto px-4 py-2 text-xs font-bold bg-noxis-overlay border border-noxis-border hover:border-noxis-text-muted text-noxis-text transition-colors rounded-sm"
              >
                Download Template Layout
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Column Mapping */}
        {step === 'map' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass-panel p-5 rounded-sm flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wide-md text-noxis-text-muted">
                  2. Map Import Columns
                </h3>
                <p className="text-[11px] text-noxis-text-muted">
                  We found <span className="font-data text-electric-blue font-bold">{userColumns.length} headers</span> across <span className="font-data text-electric-blue font-bold">{rawData.length} rows</span>. Align them below.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-noxis-overlay border border-noxis-border px-3 py-1.5 rounded-sm">
                <FileSpreadsheet size={14} className="text-sandstone-gold" />
                <span className="text-xs font-data text-noxis-text max-w-[150px] truncate">{fileName}</span>
              </div>
            </div>

            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {userColumns.map(col => {
                const mapped = mapping[col]
                const autoMapped = mapped !== null
                const ourFields = Object.keys(FIELD_ALIASES[entityType as keyof typeof FIELD_ALIASES] || {})
                
                return (
                  <div key={col} className="glass-panel p-4 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-noxis-text-muted transition-colors">
                    
                    {/* User header info */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-data font-bold text-noxis-text bg-noxis-overlay border border-noxis-border px-2 py-0.5 rounded-sm">
                          {col}
                        </span>
                      </div>
                      <p className="text-[10px] text-noxis-text-muted uppercase tracking-wider">
                        File header column
                      </p>
                    </div>
                    
                    {/* Visual bridge */}
                    <div className="hidden md:flex items-center text-noxis-text-muted px-4">
                      <ArrowRight size={16} />
                    </div>
                    
                    {/* Dropdown alignment selection */}
                    <div className="flex-1 flex items-center gap-3">
                      <select
                        value={mapped || ''}
                        onChange={e => setMapping(prev => ({
                          ...prev,
                          [col]: e.target.value || null
                        }))}
                        className="bg-noxis-surface border border-noxis-border text-noxis-text text-xs font-bold px-3 py-2 rounded-sm w-full outline-none focus:border-electric-blue transition-colors cursor-pointer"
                      >
                        <option value="" className="text-noxis-text-muted">— Skip / Do Not Import —</option>
                        {ourFields.map(f => (
                          <option key={f} value={f}>
                            {f.toUpperCase().replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>

                      {autoMapped ? (
                        <div className="inline-flex items-center gap-1 text-[10px] text-noxis-success font-black tracking-widest uppercase bg-noxis-success/10 border border-noxis-success/20 px-2 py-1 rounded-sm">
                          <CheckCircle size={10} />
                          Auto
                        </div>
                      ) : (
                        <div className="w-16" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setStep('upload')}
                className="px-6 py-2.5 text-xs font-bold bg-noxis-overlay border border-noxis-border hover:border-noxis-text-muted text-noxis-text transition-colors rounded-sm"
              >
                Back to Upload
              </button>
              <button
                onClick={generatePreview}
                className="flex-1 px-6 py-2.5 text-xs font-bold bg-electric-blue hover:bg-electric-blue/90 text-noxis-bg transition-colors rounded-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(96,165,250,0.2)]"
              >
                Generate Preview
                <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Preview */}
        {step === 'preview' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass-panel p-5 rounded-sm">
              <h3 className="text-xs font-black uppercase tracking-wide-md text-noxis-text-muted">
                3. High-Fidelity Data Preview
              </h3>
              <p className="text-[11px] text-noxis-text-muted">
                Verify target mapping results on the first 10 rows before writing records to the database.
              </p>
            </div>
            
            {/* Table */}
            <div className="overflow-x-auto rounded-sm border border-noxis-border glass-panel">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-noxis-overlay">
                    {Object.keys(preview[0] || {}).map(col => (
                      <th key={col} className="table-header px-4 py-3 border-b border-noxis-border">
                        {col.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b border-noxis-border/40 hover:bg-noxis-overlay">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-4 py-3 text-noxis-text font-data font-bold border-r border-noxis-border/20 last:border-r-0">
                          {String(val || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Counters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-panel p-4 rounded-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-noxis-text-muted uppercase tracking-wider font-bold">Total Records Identified</p>
                  <p className="text-xl font-data font-black text-noxis-text mt-1">{rawData.length.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-noxis-overlay border border-noxis-border rounded-sm">
                  <FileSpreadsheet size={18} className="text-electric-blue" />
                </div>
              </div>

              <div className="glass-panel p-4 rounded-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-noxis-text-muted uppercase tracking-wider font-bold">Mapped Fields</p>
                  <p className="text-xl font-data font-black text-noxis-success mt-1">
                    {Object.values(mapping).filter(Boolean).length}
                  </p>
                </div>
                <div className="p-3 bg-noxis-success/10 border border-noxis-success/20 rounded-sm">
                  <Check size={18} className="text-noxis-success" />
                </div>
              </div>

              <div className="glass-panel p-4 rounded-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-noxis-text-muted uppercase tracking-wider font-bold">Skipped Fields</p>
                  <p className="text-xl font-data font-black text-noxis-text-muted mt-1">
                    {Object.values(mapping).filter(v => !v).length}
                  </p>
                </div>
                <div className="p-3 bg-noxis-overlay border border-noxis-border rounded-sm">
                  <X size={18} className="text-noxis-text-muted" />
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setStep('map')}
                className="px-6 py-2.5 text-xs font-bold bg-noxis-overlay border border-noxis-border hover:border-noxis-text-muted text-noxis-text transition-colors rounded-sm"
              >
                Back to Mapping
              </button>
              <button
                onClick={runImport}
                disabled={importing}
                className="flex-1 px-6 py-2.5 text-xs font-bold bg-electric-blue hover:bg-electric-blue/90 text-noxis-bg transition-colors rounded-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(96,165,250,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Committing Records...
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    Commit {rawData.length.toLocaleString()} Records
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: Complete */}
        {step === 'complete' && results && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-8 rounded-sm space-y-8 text-center relative overflow-hidden"
          >
            {results.failed === 0 && (
              <div className="absolute inset-0 bg-radial-gradient from-noxis-success/5 to-transparent pointer-events-none" />
            )}
            
            <div className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border
                ${results.failed === 0 
                  ? 'bg-noxis-success/10 border-noxis-success/30 text-noxis-success' 
                  : 'bg-noxis-danger/10 border-noxis-danger/30 text-noxis-danger'}`}>
                {results.failed === 0 ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
              </div>
              
              <h2 className="text-xl font-black uppercase tracking-tight text-noxis-text">
                Import Process Complete
              </h2>
              <p className="text-xs text-noxis-text-muted mt-1 max-w-sm">
                The database batch updates were executed and transaction logs have been written.
              </p>
            </div>

            <div className="flex justify-center gap-12 py-6 bg-noxis-overlay border-y border-noxis-border">
              <div>
                <p className="text-[10px] text-noxis-text-muted uppercase tracking-wider font-bold">Successfully Loaded</p>
                <p className="text-4xl font-data font-black text-noxis-success mt-2">
                  {results.success.toLocaleString()}
                </p>
              </div>
              {results.failed > 0 && (
                <div>
                  <p className="text-[10px] text-noxis-text-muted uppercase tracking-wider font-bold">Failed / Skipped</p>
                  <p className="text-4xl font-data font-black text-noxis-danger mt-2">
                    {results.failed.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {results.errors.length > 0 && (
              <div className="text-left p-5 bg-noxis-danger/5 border border-noxis-danger/20 rounded-sm max-w-xl mx-auto space-y-2">
                <p className="text-xs font-black uppercase tracking-wide-sm text-noxis-danger flex items-center gap-2">
                  <AlertTriangle size={12} />
                  Operational Errors Encountered
                </p>
                <div className="max-h-[150px] overflow-y-auto space-y-1 font-data text-[10px] text-noxis-text-muted">
                  {results.errors.slice(0, 10).map((e, i) => (
                    <p key={i} className="border-b border-noxis-border/20 pb-1 last:border-b-0">
                      • {e}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setStep('upload')
                  setRawData([])
                  setMapping({})
                  setPreview([])
                  setResults(null)
                  setFileName('')
                }}
                className="px-6 py-2.5 text-xs font-bold bg-noxis-overlay border border-noxis-border hover:border-noxis-text-muted text-noxis-text transition-colors rounded-sm"
              >
                Import More Data
              </button>
              
              <a
                href={entityType === 'skus' ? '/inventory' : `/${entityType}`}
                className="px-6 py-2.5 text-xs font-bold bg-electric-blue hover:bg-electric-blue/90 text-noxis-bg transition-colors rounded-sm inline-flex items-center gap-2 shadow-[0_0_20px_rgba(96,165,250,0.2)]"
              >
                <span>View Imported Records</span>
                <ArrowRight size={14} />
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
