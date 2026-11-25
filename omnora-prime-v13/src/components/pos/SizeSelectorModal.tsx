'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { X, Layers, CheckCircle2, AlertTriangle } from 'lucide-react'
import {
  GARMENT_SIZES,
  SIZE_METADATA_MAP,
  type SizeVariant,
} from '@/lib/garments/sizingMatrix'

interface SizeSelectorModalProps {
  isOpen: boolean
  product: {
    id: string
    name: string
    sku_code?: string
    unit?: string
    tax_rate?: number
    size_variants?: SizeVariant[]
  } | null
  variants: SizeVariant[]
  currency?: string
  onClose: () => void
  onSelectVariant: (variant: SizeVariant) => void
}

export const SizeSelectorModal: React.FC<SizeSelectorModalProps> = ({
  isOpen,
  product,
  variants,
  currency = 'Rs.',
  onClose,
  onSelectVariant,
}) => {
  // Build lookup of available variants by size
  const variantBySize = useMemo(() => {
    const map = new Map<number, SizeVariant>()
    for (const v of variants) {
      map.set(Number(v.size), v)
    }
    return map
  }, [variants])

  // Selectable (in-stock) sizes for keyboard navigation
  const inStockSizes = useMemo(() => {
    return variants
      .filter(v => Number(v.stockQty || 0) > 0)
      .map(v => Number(v.size))
      .sort((a, b) => a - b)
  }, [variants])

  const [focusedIndex, setFocusedIndex] = useState(0)

  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0)
    }
  }, [isOpen, product?.id])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (inStockSizes.length === 0) return

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex(prev => (prev + 1) % inStockSizes.length)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex(prev => (prev - 1 + inStockSizes.length) % inStockSizes.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const targetSize = inStockSizes[focusedIndex]
        const v = variantBySize.get(targetSize)
        if (v && v.stockQty > 0) {
          onSelectVariant(v)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, inStockSizes, focusedIndex, variantBySize, onSelectVariant, onClose])

  if (!isOpen || !product) return null

  const activeFocusedSize = inStockSizes[focusedIndex]

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#0F1318] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#141920] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">{product.name}</h3>
              <p className="text-[11px] font-mono text-slate-400">
                {product.sku_code ? `SKU: ${product.sku_code} • ` : ''}Select Size (Arrow Keys + Enter)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Size Pills Grid (14 to 44) */}
        <div className="p-5">
          {inStockSizes.length === 0 && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-300">
              <AlertTriangle size={15} />
              All sizes for this article are currently out of stock.
            </div>
          )}

          <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
            {GARMENT_SIZES.map((sz) => {
              const variant = variantBySize.get(sz)
              if (!variant) {
                return (
                  <div
                    key={sz}
                    className="flex flex-col items-center justify-center rounded-xl border border-white/[0.04] bg-[#0B0E11]/40 px-3 py-2.5 opacity-25 select-none"
                  >
                    <span className="font-mono text-base font-black text-slate-500">{sz}</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-600">N/A</span>
                  </div>
                )
              }

              const stock = Number(variant.stockQty || 0)
              const isOutOfStock = stock <= 0
              const isFocused = !isOutOfStock && activeFocusedSize === sz
              const meta = SIZE_METADATA_MAP[sz]

              return (
                <button
                  key={sz}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => !isOutOfStock && onSelectVariant(variant)}
                  className={`group relative flex flex-col items-start rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                    isOutOfStock
                      ? 'cursor-not-allowed border-white/5 bg-[#0B0E11] opacity-40'
                      : isFocused
                      ? 'cursor-pointer border-cyan-400 bg-cyan-500/15 shadow-[0_0_16px_rgba(34,211,238,0.2)] ring-1 ring-cyan-400/50'
                      : 'cursor-pointer border-white/10 bg-[#141920] hover:border-cyan-500/50 hover:bg-cyan-500/10'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-mono text-lg font-black text-white">{sz}</span>
                    {isOutOfStock ? (
                      <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase text-red-400">
                        OUT
                      </span>
                    ) : (
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                          stock <= 3
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/15 text-emerald-300'
                        }`}
                      >
                        {stock} left
                      </span>
                    )}
                  </div>

                  <span className="mt-0.5 text-[10px] text-slate-400">
                    {meta?.shortFit || variant.ageOrFitLabel}
                  </span>

                  <div className="mt-1.5 flex w-full items-center justify-between border-t border-white/[0.06] pt-1.5">
                    <span className="font-mono text-xs font-black text-emerald-400">
                      {currency} {Number(variant.salePrice || 0).toLocaleString()}
                    </span>
                    {isFocused && <CheckCircle2 size={12} className="text-cyan-400" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 bg-[#141920] px-5 py-2.5 text-[10px] text-slate-400">
          <span>
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-slate-200">← ↑ ↓ →</kbd> Navigate
            {' • '}
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-slate-200">Enter</kbd> Add to Bill
          </span>
          <span>
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-slate-200">Esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  )
}
