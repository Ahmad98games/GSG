'use client'

import React, { useState } from 'react'
import { Layers, Printer, Trash2, Sparkles, Check, Plus } from 'lucide-react'
import {
  GARMENT_SIZES,
  SIZE_PRESETS,
  SIZE_METADATA_MAP,
  type GarmentSize,
  type SizeVariant,
  createSizeVariant,
  generateVariantSku,
  generateVariantBarcode,
  computeParentTotals,
} from '@/lib/garments/sizingMatrix'

interface GarmentSizeMatrixEditorProps {
  parentProductId: string
  parentSkuCode: string
  parentName: string
  baseCostPrice: number
  baseSalePrice: number
  variants: SizeVariant[]
  onChange: (variants: SizeVariant[]) => void
  onPrintBarcode?: (variant: SizeVariant) => void
  currency?: string
}

export const GarmentSizeMatrixEditor: React.FC<GarmentSizeMatrixEditorProps> = ({
  parentProductId,
  parentSkuCode,
  parentName,
  baseCostPrice,
  baseSalePrice,
  variants,
  onChange,
  onPrintBarcode,
  currency = 'Rs.',
}) => {
  const [defaultColor, setDefaultColor] = useState('')
  const selectedSizeSet = new Set(variants.map(v => Number(v.size)))

  const applyPreset = (sizes: readonly GarmentSize[]) => {
    const existingMap = new Map<number, SizeVariant>()
    variants.forEach(v => existingMap.set(Number(v.size), v))

    const next: SizeVariant[] = [...variants]
    for (const sz of sizes) {
      if (!existingMap.has(sz)) {
        next.push(
          createSizeVariant(parentProductId, parentSkuCode, sz, {
            costPrice: baseCostPrice || 0,
            salePrice: baseSalePrice || 0,
            stockQty: 0,
            color: defaultColor,
          })
        )
      }
    }
    next.sort((a, b) => a.size - b.size)
    onChange(next)
  }

  const toggleSingleSize = (sz: GarmentSize) => {
    if (selectedSizeSet.has(sz)) {
      onChange(variants.filter(v => Number(v.size) !== sz))
    } else {
      const next = [
        ...variants,
        createSizeVariant(parentProductId, parentSkuCode, sz, {
          costPrice: baseCostPrice || 0,
          salePrice: baseSalePrice || 0,
          stockQty: 0,
          color: defaultColor,
        }),
      ].sort((a, b) => a.size - b.size)
      onChange(next)
    }
  }

  const updateVariant = (id: string, patch: Partial<SizeVariant>) => {
    onChange(
      variants.map(v => {
        if (v.id !== id) return v
        return { ...v, ...patch }
      })
    )
  }

  const applyBasePricesToAll = () => {
    onChange(
      variants.map(v => ({
        ...v,
        costPrice: baseCostPrice > 0 ? baseCostPrice : v.costPrice,
        salePrice: baseSalePrice > 0 ? baseSalePrice : v.salePrice,
        sku: v.sku || generateVariantSku(parentSkuCode, v.size, v.color),
        barcode: v.barcode || generateVariantBarcode(parentSkuCode, v.size),
      }))
    )
  }

  const regenerateCodes = () => {
    onChange(
      variants.map((v, idx) => ({
        ...v,
        sku: generateVariantSku(parentSkuCode, v.size, v.color),
        barcode: generateVariantBarcode(parentSkuCode, v.size, idx),
      }))
    )
  }

  const totals = computeParentTotals(variants)

  return (
    <div className="space-y-4 rounded-xl border border-cyan-500/20 bg-[#12161B] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-400">
            <Layers size={14} />
            Garment Sizing Matrix (Sizes 14–44)
          </h4>
          <p className="mt-0.5 text-[11px] text-slate-400">
            One-click presets auto-populate sizes with unique SKUs, thermal barcodes & tiered pricing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={defaultColor}
            onChange={(e) => setDefaultColor(e.target.value)}
            placeholder="Color (optional)"
            className="w-32 rounded-lg border border-white/10 bg-[#0B0E11] px-2.5 py-1.5 text-[11px] text-white placeholder-slate-500 outline-none focus:border-cyan-500/50"
          />
          {variants.length > 0 && (
            <>
              <button
                type="button"
                onClick={applyBasePricesToAll}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                title="Copy parent Cost & Sale price to all size rows"
              >
                Fill Base Prices
              </button>
              <button
                type="button"
                onClick={regenerateCodes}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                title="Refresh SKUs and barcodes from parent SKU Code"
              >
                <Sparkles size={11} className="inline mr-1" />
                Sync Codes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Preset Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {SIZE_PRESETS.map((preset) => {
          const allIncluded = preset.sizes.every(s => selectedSizeSet.has(s))
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.sizes)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer ${
                allIncluded
                  ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
                  : 'border-white/10 bg-[#0B0E11] text-slate-300 hover:border-cyan-500/30 hover:text-white'
              }`}
            >
              {allIncluded ? <Check size={12} /> : <Plus size={12} />}
              <span>{preset.label}</span>
              <span className="font-mono text-[10px] text-slate-400">({preset.rangeLabel})</span>
            </button>
          )
        })}

        {variants.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="ml-auto rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/15 transition-colors cursor-pointer"
          >
            Clear Sizes
          </button>
        )}
      </div>

      {/* Individual Size Toggle Strip (14..44) */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {GARMENT_SIZES.map((sz) => {
          const active = selectedSizeSet.has(sz)
          const meta = SIZE_METADATA_MAP[sz]
          return (
            <button
              key={sz}
              type="button"
              onClick={() => toggleSingleSize(sz)}
              title={meta.ageOrFitLabel}
              className={`min-w-[40px] rounded-md border px-2 py-1 font-mono text-[11px] font-bold transition-all cursor-pointer ${
                active
                  ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_10px_rgba(34,211,238,0.15)]'
                  : 'border-white/10 bg-[#0B0E11] text-slate-500 hover:border-white/25 hover:text-slate-300'
              }`}
            >
              {sz}
            </button>
          )
        })}
      </div>

      {/* Editable Matrix Table */}
      {variants.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-[#0B0E11]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-3 py-2.5">Size / Fit</th>
                <th className="px-3 py-2.5">Variant SKU</th>
                <th className="px-3 py-2.5">Barcode</th>
                <th className="px-3 py-2.5 w-24">Stock Qty</th>
                <th className="px-3 py-2.5 w-28">Cost ({currency})</th>
                <th className="px-3 py-2.5 w-28">Sale ({currency})</th>
                <th className="px-2 py-2.5 text-right w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {variants.map((v) => {
                const meta = SIZE_METADATA_MAP[v.size as GarmentSize]
                return (
                  <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-8 items-center justify-center rounded bg-cyan-500/15 font-mono text-xs font-black text-cyan-300 border border-cyan-500/30">
                          {v.size}
                        </span>
                        <div>
                          <div className="text-[11px] font-semibold text-slate-200">
                            {meta?.shortFit || v.ageOrFitLabel}
                          </div>
                          {v.color && (
                            <div className="text-[9px] uppercase tracking-wider text-slate-500">
                              {v.color}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => updateVariant(v.id, { sku: e.target.value })}
                        className="w-28 rounded border border-white/10 bg-[#14181F] px-2 py-1 font-mono text-[11px] text-slate-200 outline-none focus:border-cyan-500/50"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={v.barcode}
                        onChange={(e) => updateVariant(v.id, { barcode: e.target.value })}
                        className="w-32 rounded border border-white/10 bg-[#14181F] px-2 py-1 font-mono text-[11px] text-slate-300 outline-none focus:border-cyan-500/50"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={v.stockQty}
                        onChange={(e) =>
                          updateVariant(v.id, { stockQty: Math.max(0, Number(e.target.value) || 0) })
                        }
                        className="w-20 rounded border border-white/10 bg-[#14181F] px-2 py-1 font-mono text-xs font-bold text-white outline-none focus:border-cyan-500/50"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={v.costPrice}
                        onChange={(e) =>
                          updateVariant(v.id, { costPrice: Math.max(0, Number(e.target.value) || 0) })
                        }
                        className="w-24 rounded border border-white/10 bg-[#14181F] px-2 py-1 font-mono text-xs text-amber-300 outline-none focus:border-cyan-500/50"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={v.salePrice}
                        onChange={(e) =>
                          updateVariant(v.id, { salePrice: Math.max(0, Number(e.target.value) || 0) })
                        }
                        className="w-24 rounded border border-white/10 bg-[#14181F] px-2 py-1 font-mono text-xs font-bold text-emerald-400 outline-none focus:border-cyan-500/50"
                      />
                    </td>
                    <td className="px-2 py-2 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {onPrintBarcode && (
                          <button
                            type="button"
                            onClick={() => onPrintBarcode(v)}
                            title={`Print thermal label for ${parentName || 'Article'} Size ${v.size}`}
                            className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-cyan-300 transition-colors cursor-pointer"
                          >
                            <Printer size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onChange(variants.filter(item => item.id !== v.id))}
                          title="Remove size"
                          className="rounded p-1 text-slate-500 hover:bg-red-500/15 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Matrix Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 bg-white/[0.02] px-4 py-2.5 text-[11px]">
            <div className="flex items-center gap-4">
              <span className="text-slate-400">
                Active Sizes: <strong className="font-mono text-white">{variants.length}</strong>
              </span>
              <span className="text-slate-400">
                Total Stock: <strong className="font-mono text-cyan-300">{totals.totalStock} pcs</strong>
              </span>
            </div>
            <div className="text-slate-400">
              Sale Range:{' '}
              <strong className="font-mono text-emerald-400">
                {totals.minSalePrice === totals.maxSalePrice
                  ? `${currency} ${totals.maxSalePrice.toLocaleString()}`
                  : `${currency} ${totals.minSalePrice.toLocaleString()} – ${totals.maxSalePrice.toLocaleString()}`}
              </strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-[#0B0E11]/60 py-6 text-center text-xs text-slate-500">
          Click a quick preset above (e.g. <span className="text-cyan-400 font-semibold">Kids Set 22–32</span> or{' '}
          <span className="text-cyan-400 font-semibold">Full Range 14–44</span>) to populate size rows.
        </div>
      )}
    </div>
  )
}
