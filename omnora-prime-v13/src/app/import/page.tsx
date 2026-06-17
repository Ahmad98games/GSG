'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { PersonaEngine } from '@/lib/persona/PersonaEngine'
import * as XLSX from 'xlsx'
import { useToast } from '@/hooks/useToast'
import { humanizeError } from '@/lib/utils/errors'
import {
  Table, Upload, Download, Check,
  AlertTriangle, ChevronDown, Plus, X
} from 'lucide-react'

// ─── ENTITY DEFINITIONS ───
// Each entity has a list of fields.
// Required fields are marked.
// The user fills the editable table.

const ENTITIES = {
  skus: {
    label: 'Products & Stock',
    icon: '📦',
    desc: 'Add multiple products at once',
    fields: [
      { key: 'sku_code',    label: 'Code',      required: true,  hint: 'e.g. FAB-001', type: 'text', width: 120 },
      { key: 'name',        label: 'Name',       required: true,  hint: 'e.g. Khaddar Blue', type: 'text', width: 200 },
      { key: 'category',    label: 'Category',   required: false, hint: 'Fabric / Thread etc', type: 'text', width: 140 },
      { key: 'unit',        label: 'Unit',       required: false, hint: 'meter / pcs / kg', type: 'text', width: 100 },
      { key: 'qty_on_hand', label: 'Stock Qty',  required: false, hint: '0', type: 'number', width: 100 },
      { key: 'cost_price',  label: 'Cost (PKR)', required: false, hint: '0', type: 'number', width: 110 },
      { key: 'sale_price',  label: 'Sale (PKR)', required: false, hint: '0', type: 'number', width: 110 },
      { key: 'reorder_level', label: 'Reorder', required: false, hint: '10', type: 'number', width: 90 },
    ],
    tableName: 'skus',
    buildRow: (row: any, businessId: string, index: number) => ({
      business_id: businessId,
      sku_code: row.sku_code?.trim(),
      name: row.name?.trim(),
      category: row.category?.trim() || null,
      unit: row.unit?.trim() || 'pcs',
      qty_on_hand: parseFloat(row.qty_on_hand) || 0,
      cost_price: parseFloat(row.cost_price) || 0,
      sale_price: parseFloat(row.sale_price) || 0,
      reorder_level: parseFloat(row.reorder_level) || 0,
      is_active: true,
    }),
    validate: (row: any) => {
      if (!row.sku_code?.trim()) return 'Code is required'
      if (!row.name?.trim()) return 'Name is required'
      return null
    },
  },

  parties: {
    label: 'Customers & Suppliers',
    icon: '🤝',
    desc: 'Add customers and suppliers',
    fields: [
      { key: 'name',        label: 'Name',       required: true,  hint: 'e.g. Al-Hamid Textiles', type: 'text', width: 220 },
      { key: 'party_type',  label: 'Type',       required: true,  hint: 'customer / supplier', type: 'select', options: ['customer','supplier','both'], width: 120 },
      { key: 'phone',       label: 'Phone',      required: false, hint: '0300-1234567', type: 'text', width: 140 },
      { key: 'email',       label: 'Email',      required: false, hint: 'optional', type: 'text', width: 180 },
      { key: 'address',     label: 'Address',    required: false, hint: 'City, Pakistan', type: 'text', width: 200 },
      { key: 'current_balance', label: 'Balance', required: false, hint: '0', type: 'number', width: 110 },
      { key: 'credit_limit', label: 'Credit Limit', required: false, hint: '0', type: 'number', width: 110 },
    ],
    tableName: 'parties',
    buildRow: (row: any, businessId: string, index: number) => ({
      business_id: businessId,
      name: row.name?.trim(),
      party_type: row.party_type?.trim().toLowerCase() || 'customer',
      phone: row.phone?.trim() || null,
      email: row.email?.trim() || null,
      address: row.address?.trim() || null,
      current_balance: parseFloat(row.current_balance) || 0,
      credit_limit: parseFloat(row.credit_limit) || 0,
    }),
    validate: (row: any) => {
      if (!row.name?.trim()) return 'Name is required'
      const type = row.party_type?.toLowerCase()
      if (type && !['customer','supplier','both'].includes(type))
        return 'Type must be: customer, supplier, or both'
      return null
    },
  },

  karigars: {
    label: 'Workers & Karigars',
    icon: '👷',
    desc: 'Add production workers',
    fields: [
      { key: 'karigar_code', label: 'Code',     required: false, hint: 'KAR-001 (auto if blank)', type: 'text', width: 130 },
      { key: 'name',         label: 'Name',     required: true,  hint: 'e.g. Muhammad Akram', type: 'text', width: 200 },
      { key: 'phone',        label: 'Phone',    required: false, hint: '0300-1234567', type: 'text', width: 140 },
      { key: 'wage_type',    label: 'Pay Type', required: true,  hint: 'piece_rate / daily / monthly', type: 'select', options: ['piece_rate','daily','monthly'], width: 140 },
      { key: 'piece_rate',   label: 'Rate (PKR)', required: false, hint: 'e.g. 25', type: 'number', width: 110 },
      { key: 'daily_rate',   label: 'Daily Rate', required: false, hint: 'e.g. 900', type: 'number', width: 110 },
      { key: 'monthly_salary', label: 'Monthly', required: false, hint: 'e.g. 28000', type: 'number', width: 110 },
    ],
    tableName: 'karigars',
    buildRow: (row: any, businessId: string, index: number) => ({
      business_id: businessId,
      karigar_code: row.karigar_code?.trim()
        || `KAR-${String(Date.now() + index).slice(-4)}`,
      name: row.name?.trim(),
      phone: row.phone?.trim() || null,
      wage_type: row.wage_type?.trim().toLowerCase() || 'piece_rate',
      piece_rate: parseFloat(row.piece_rate) || 0,
      daily_rate: parseFloat(row.daily_rate) || 0,
      monthly_salary: parseFloat(row.monthly_salary) || 0,
      status: 'active',
      peshgi_balance: 0,
    }),
    validate: (row: any) => {
      if (!row.name?.trim()) return 'Name is required'
      const wt = row.wage_type?.toLowerCase()
      if (wt && !['piece_rate','daily','monthly'].includes(wt))
        return 'Pay Type must be: piece_rate, daily, or monthly'
      return null
    },
  },
} as const

type EntityKey = keyof typeof ENTITIES

// ─── BLANK ROW ───
function makeBlankRow(entity: EntityKey) {
  const fields = ENTITIES[entity].fields
  return fields.reduce((acc, f) => {
    acc[f.key] = ''
    return acc
  }, {} as Record<string, string>)
}

// ─── MAIN COMPONENT ───
export default function SmartImportPage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useBusinessProfile()
  const toast = useToast()

  const [entity, setEntity] = useState<EntityKey>('skus')
  const [rows, setRows] = useState<Record<string, string>[]>([
    makeBlankRow('skus'),
    makeBlankRow('skus')
  ])
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<{
    success: number
    failed: number
    errors: string[]
  } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const config = ENTITIES[entity]

  // Switch entity type
  const switchEntity = (e: EntityKey) => {
    setEntity(e)
    setRows([makeBlankRow(e), makeBlankRow(e)])
    setResults(null)
  }

  // Add blank row
  const addRow = () => {
    setRows(prev => [...prev, makeBlankRow(entity)])
  }

  // Remove row
  const removeRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index))
  }

  // Clear table
  const clearTable = () => {
    setRows([makeBlankRow(entity), makeBlankRow(entity)])
    setResults(null)
  }

  // Update cell
  const updateCell = (
    rowIndex: number,
    key: string,
    value: string
  ) => {
    setRows(prev => {
      const next = [...prev]
      next[rowIndex] = { ...next[rowIndex], [key]: value }
      return next
    })
  }

  // Handle Excel paste (Ctrl+V)
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    const pastedText = clipboardData.getData('text');
    if (!pastedText) return;

    if (pastedText.includes('\t') || pastedText.includes('\n')) {
      e.preventDefault();
      
      const lines = pastedText.split(/\r?\n/).filter(line => line.length > 0);
      if (lines.length === 0) return;

      const newParsedRows = lines.map(line => {
        const cols = line.split('\t');
        const rowObj: Record<string, string> = {};
        config.fields.forEach((field, index) => {
          rowObj[field.key] = cols[index] !== undefined ? cols[index].trim() : '';
        });
        return rowObj;
      });

      setRows(prev => {
        const isAllEmpty = prev.every(r => Object.values(r).every(v => v.trim() === ''));
        if (isAllEmpty) {
          return newParsedRows;
        } else {
          const cleanPrev = prev.filter(r => Object.values(r).some(v => v.trim() !== ''));
          return [...cleanPrev, ...newParsedRows];
        }
      });
      toast.success('Pasted rows successfully', `Added ${newParsedRows.length} rows from clipboard`);
    }
  }, [config.fields, toast]);

  // Download Excel template with sample data
  const downloadTemplate = () => {
    const fields = config.fields
    const headers = fields.map(f => f.label)
    const hints = fields.map(f => f.hint)

    // 3 sample rows
    const samples = entity === 'skus' ? [
      ['FAB-001', 'Khaddar Blue', 'Fabric', 'meter', '500', '85', '120', '100'],
      ['FAB-002', 'Plain White Lawn', 'Fabric', 'meter', '300', '70', '100', '50'],
      ['THR-001', 'Thread Black 100g', 'Thread', 'pcs', '200', '45', '65', '50'],
    ] : entity === 'parties' ? [
      ['Al-Hamid Textiles', 'customer', '0300-1234567', '', 'Lahore, Pakistan', '0', '100000'],
      ['Ahmed Fabric Mills', 'supplier', '0321-9876543', '', 'Faisalabad', '0', '0'],
    ] : [
      ['KAR-001', 'Muhammad Akram', '0300-1111111', 'piece_rate', '25', '', ''],
      ['KAR-002', 'Razia Bibi', '0300-2222222', 'daily', '', '900', ''],
      ['KAR-003', 'Shahid Ali', '0300-3333333', 'monthly', '', '', '28000'],
    ]

    const ws = XLSX.utils.aoa_to_sheet([
      headers,
      hints,
      ...samples,
    ])

    // Style the headers row safely for TS compilation
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!ws[cell]) ws[cell] = { t: 's', v: '' }
      const cellObj = ws[cell] as any
      if (cellObj) {
        cellObj.s = {
          font: { bold: true },
          fill: { fgColor: { rgb: '1A1D21' } },
        }
      }
    }

    // Set column widths
    ws['!cols'] = fields.map(f => ({
      wch: Math.round(f.width / 8)
    }))

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      wb, ws, config.label
    )
    XLSX.writeFile(
      wb,
      `noxis_import_${entity}_template.xlsx`
    )
    toast.success('Template downloaded', 'Fill it and paste back here.')
  }

  // Parse Excel or CSV file
  const parseFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(
          e.target?.result as ArrayBuffer
        )
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json(
          ws, { header: 1, defval: '' }
        ) as string[][]

        if (!raw || raw.length < 2) {
          toast.error('File has no data rows')
          return
        }

        // First row is headers — map to our field keys
        const fileHeaders = raw[0].map(h =>
          String(h).toLowerCase().trim()
        )
        const dataRows = raw.slice(1).filter(r =>
          r.some(c => c !== '')
        )

        // Auto-map headers to field keys
        const fields = config.fields
        const fieldMap: Record<number, string> = {}

        fileHeaders.forEach((header, colIdx) => {
          // Try exact match first
          const exactMatch = fields.find(f =>
            f.key.toLowerCase() === header ||
            f.label.toLowerCase() === header
          )
          if (exactMatch) {
            fieldMap[colIdx] = exactMatch.key
            return
          }
          // Try partial match
          const partialMatch = fields.find(f =>
            header.includes(f.key.toLowerCase()) ||
            header.includes(
              f.label.toLowerCase().slice(0, 4)
            )
          )
          if (partialMatch) {
            fieldMap[colIdx] = partialMatch.key
          }
        })

        // Build rows from mapped columns
        const parsed = dataRows.map(row => {
          const obj: Record<string, string> = {}
          fields.forEach(f => { obj[f.key] = '' })
          Object.entries(fieldMap).forEach(
            ([colIdx, fieldKey]) => {
              obj[fieldKey] = String(
                row[parseInt(colIdx)] || ''
              ).trim()
            }
          )
          return obj
        })

        if (parsed.length > 0) {
          setRows(parsed)
          toast.success('File loaded successfully', `${parsed.length} rows loaded from file`)
        } else {
          toast.error('No valid rows found in file')
        }
      } catch (err: any) {
        toast.error('Could not read file', humanizeError(err, 'parse import file'))
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }

  // Import rows to Supabase
  const runImport = async () => {
    if (!profile?.id) return

    // Filter out completely empty rows
    const filledRows = rows.filter(row =>
      Object.values(row).some(v =>
        v.toString().trim() !== ''
      )
    )

    if (filledRows.length === 0) {
      toast.error('No data found', 'Add at least one row before importing')
      return
    }

    setImporting(true)
    setResults(null)

    let success = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < filledRows.length; i++) {
      const row = filledRows[i]
      const validationError = config.validate(row)

      if (validationError) {
        failed++
        errors.push(`Row ${i + 1}: ${validationError}`)
        continue
      }

      try {
        const record = config.buildRow(
          row, profile.id, i
        )
        const { error } = await supabase
          .from(config.tableName)
          .upsert(record, {
            onConflict: entity === 'skus'
              ? 'business_id,sku_code'
              : entity === 'karigars'
              ? 'business_id,karigar_code'
              : 'business_id,name',
          })

        if (error) {
          failed++
          const msg = error.message.includes('duplicate')
            ? `Row ${i+1}: ${row.name || row.sku_code} already exists — updated`
            : `Row ${i+1}: ${humanizeError(error)}`
          errors.push(msg)
          if (error.message.includes('duplicate')) {
            success++ // Upsert = still a success
            failed--
          }
        } else {
          success++
        }
      } catch (err: any) {
        failed++
        errors.push(`Row ${i+1}: ${humanizeError(err)}`)
      }
    }

    setResults({ success, failed, errors })
    setImporting(false)

    if (success > 0) {
      toast.success('Import completed', `${success} items processed successfully`)
    }
  }

  return (
    <div className="p-6 max-w-full overflow-x-auto min-h-screen bg-noxis-bg text-noxis-text">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight text-white mb-1 uppercase">
          Smart Import
        </h1>
        <p className="text-xs text-gray-500">
          Fill the table below, or upload an Excel/CSV file. Or copy from Excel and paste (Ctrl+V) directly.
        </p>
      </div>

      {/* Entity selector */}
      <div className="flex gap-3 mb-6">
        {(Object.entries(ENTITIES) as [EntityKey, any][])
          .map(([key, ent]) => (
          <button
            key={key}
            onClick={() => switchEntity(key)}
            className={`flex items-center gap-2.5
              px-5 py-3 text-sm font-medium
              border rounded-sm transition-all cursor-pointer
              ${entity === key
                ? 'bg-[#60A5FA]/10 border-[#60A5FA]/35 text-[#60A5FA]'
                : 'bg-[#0F1114] border-white/8 text-gray-400 hover:border-white/18'}`}
          >
            <span className="text-lg">{ent.icon}</span>
            <div className="text-left">
              <p className="text-xs font-bold leading-none">{ent.label}</p>
              <p className="text-[9px] text-gray-500 mt-0.5 leading-none">{ent.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4
            py-2 text-xs font-semibold cursor-pointer
            border border-white/10 text-gray-400
            hover:border-white/20 hover:text-white
            transition-colors"
        >
          <Download size={13} />
          Download Template
        </button>

        <label className="flex items-center gap-2
          px-4 py-2 text-xs font-semibold
          border border-white/10 text-gray-400
          hover:border-white/20 hover:text-white
          transition-colors cursor-pointer">
          <Upload size={13} />
          Upload Excel / CSV
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) parseFile(file)
            }}
          />
        </label>

        <button
          onClick={clearTable}
          className="flex items-center gap-2 px-4
            py-2 text-xs font-semibold cursor-pointer
            border border-red-500/20 text-red-405/80
            hover:border-red-500/40 hover:text-red-400
            transition-colors"
        >
          <X size={13} />
          Clear Table
        </button>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={addRow}
            className="flex items-center gap-1.5
              px-4 py-2 text-xs font-semibold cursor-pointer
              text-[#60A5FA] border border-[#60A5FA]/25
              hover:bg-[#60A5FA]/10 transition-colors">
            <Plus size={13} />
            Add Row
          </button>

          <button
            onClick={runImport}
            disabled={importing}
            className="flex items-center gap-2
              px-5 py-2 text-xs font-bold cursor-pointer
              bg-[#60A5FA] text-black
              hover:bg-blue-400 disabled:opacity-50
              transition-colors">
            {importing
              ? 'Importing...'
              : `Import ${rows.filter(r =>
                  Object.values(r).some(v => v.trim())
                ).length} Rows`}
          </button>
        </div>
      </div>

      {/* Editable table */}
      <div
        onDragOver={e => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onPaste={handlePaste}
        className={`rounded-sm overflow-x-auto relative
          border transition-colors
          ${dragOver
            ? 'border-[#60A5FA]/50 bg-[#60A5FA]/3'
            : 'border-white/8'}`}
      >
        {dragOver && (
          <div className="absolute inset-0
            flex items-center justify-center
            z-10 pointer-events-none">
            <p className="text-sm font-bold
              text-[#60A5FA] bg-[#0A0C0F]/90
              px-6 py-3 rounded-sm">
              Drop file to import →
            </p>
          </div>
        )}

        <table className="w-full border-collapse min-w-max">
          <thead>
            <tr className="bg-[#0A0C0F]">
              {/* Row number */}
              <th className="w-10 px-3 py-2.5 text-left border-b border-white/8">
                <span className="text-[9px] text-gray-700 font-mono">#</span>
              </th>
              {config.fields.map(field => (
                <th
                  key={field.key}
                  style={{ minWidth: field.width }}
                  className="px-3 py-2.5 text-left border-b border-white/8"
                >
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-0.5">*</span>
                    )}
                  </span>
                </th>
              ))}
              {/* Delete column */}
              <th className="w-8 px-2 py-2.5 border-b border-white/8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-white/[0.04] hover:bg-white/[0.01] group"
              >
                {/* Row number */}
                <td className="px-3 py-1.5 text-[10px] font-mono text-gray-700 select-none">
                  {rowIndex + 1}
                </td>

                {config.fields.map(field => (
                  <td
                    key={field.key}
                    className="px-1 py-1"
                  >
                    {field.type === 'select' && 'options' in field ? (
                      <select
                        value={row[field.key] || ''}
                        onChange={e =>
                          updateCell(
                            rowIndex,
                            field.key,
                            e.target.value
                          )
                        }
                        className="w-full bg-[#161A1F]
                          border border-transparent
                          text-white text-xs px-2 py-1.5
                          outline-none rounded-sm
                          focus:border-[#60A5FA]/40
                          hover:border-white/15
                          transition-colors"
                      >
                        <option value="">
                          — select —
                        </option>
                        {(field as any).options.map(
                          (opt: string) => (
                          <option
                            key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={row[field.key] || ''}
                        onChange={e =>
                          updateCell(
                            rowIndex,
                            field.key,
                            e.target.value
                          )
                        }
                        placeholder={field.hint}
                        className="w-full bg-transparent
                          border border-transparent
                          text-white text-xs px-2 py-1.5
                          outline-none rounded-sm
                          focus:bg-[#161A1F]
                          focus:border-[#60A5FA]/40
                          hover:bg-[#161A1F]/50
                          hover:border-white/10
                          transition-all
                          placeholder:text-gray-700"
                      />
                    )}
                  </td>
                ))}

                {/* Delete row */}
                <td className="px-2 py-1">
                  <button
                    onClick={() => removeRow(rowIndex)}
                    className="w-6 h-6 flex items-center
                      justify-center text-gray-700 cursor-pointer
                      hover:text-red-400 transition-colors
                      opacity-0 group-hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add row button at bottom */}
        <button
          onClick={addRow}
          className="w-full py-2.5 text-xs font-medium text-gray-500 cursor-pointer
            hover:text-gray-400 hover:bg-white/[0.02]
            transition-colors border-t border-white/[0.04]
            flex items-center justify-center gap-1.5"
        >
          <Plus size={11} />
          Add row
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className={`mt-5 p-5 rounded-sm
          border ${results.failed === 0
            ? 'bg-emerald-500/5 border-emerald-500/20'
            : results.success === 0
            ? 'bg-red-500/5 border-red-500/20'
            : 'bg-amber-500/5 border-amber-500/20'}`}
        >
          <div className="flex items-center gap-6 mb-3">
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-emerald-400">
                {results.success}
              </p>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest">
                Imported
              </p>
            </div>
            {results.failed > 0 && (
              <div className="text-center">
                <p className="text-2xl font-mono font-bold text-red-400">
                  {results.failed}
                </p>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest">
                  Failed
                </p>
              </div>
            )}
            {results.success > 0 && (
              <div className="ml-auto flex gap-3">
                <button
                  onClick={() => {
                    router.push(
                      entity === 'skus'
                        ? '/inventory'
                        : entity === 'parties'
                        ? '/parties'
                        : '/karigars'
                    )
                  }}
                  className="flex items-center gap-2
                    px-4 py-2 text-xs font-bold cursor-pointer
                    bg-emerald-500/10
                    text-emerald-400
                    border border-emerald-500/25
                    hover:bg-emerald-500/20
                    transition-colors"
                >
                  <Check size={12} />
                  View Imported Data
                </button>
              </div>
            )}
          </div>

          {results.errors.length > 0 && (
            <div className="space-y-1.5 mt-3 pt-3 border-t border-white/[0.06]">
              {results.errors.slice(0, 10).map((err, i) => (
                <p key={i} className="text-[10px] text-red-400 flex items-start gap-2">
                  <AlertTriangle size={10} className="flex-shrink-0 mt-0.5" />
                  {err}
                </p>
              ))}
              {results.errors.length > 10 && (
                <p className="text-[9px] text-gray-500">
                  +{results.errors.length - 10} more errors
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
