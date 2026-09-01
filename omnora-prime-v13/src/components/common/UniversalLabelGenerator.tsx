'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import QRCode from 'react-qr-code'
import {
  Printer,
  X,
  Copy,
  Check,
  Tag,
  Maximize2,
  Sliders,
  Layers,
  Sparkles,
  QrCode as QrIcon,
  Barcode as BarcodeIcon,
} from 'lucide-react'
import { renderBarcodeToSVG, encodeJobPayload } from '@/lib/barcode/barcodeEngine'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { formatCurrency } from '@/lib/i18n/currencies'

export type StickerDimension = '50x30' | '38x25' | '100x50'
export type BarcodeType = 'QR' | 'CODE128'

export interface LabelData {
  title?: string
  name: string
  skuCode: string
  barcode?: string
  price?: number
  wholesalePrice?: number
  unit?: string
  jobId?: string
  karigarId?: string
  stage?: string
  category?: string
  batchNumber?: string
  payloadType?: 'SKU' | 'JOB'
}

export interface UniversalLabelGeneratorProps {
  isOpen: boolean
  onClose: () => void
  data: LabelData
  defaultDimension?: StickerDimension
  defaultQuantity?: number
}

const DIMENSIONS: Record<
  StickerDimension,
  { label: string; widthMm: number; heightMm: number; desc: string }
> = {
  '50x30': {
    label: '50mm × 30mm',
    widthMm: 50,
    heightMm: 30,
    desc: 'Standard Wholesale & Garment Tag',
  },
  '38x25': {
    label: '38mm × 25mm',
    widthMm: 38,
    heightMm: 25,
    desc: 'Jewelry / Small Parts Label',
  },
  '100x50': {
    label: '100mm × 50mm',
    widthMm: 100,
    heightMm: 50,
    desc: 'Karigar Master Batch / Than Card',
  },
}

export const UniversalLabelGenerator: React.FC<UniversalLabelGeneratorProps> = ({
  isOpen,
  onClose,
  data,
  defaultDimension = '50x30',
  defaultQuantity = 1,
}) => {
  const { profile } = useBusinessProfile()
  const [dimension, setDimension] = useState<StickerDimension>(defaultDimension)
  const [barcodeType, setBarcodeType] = useState<BarcodeType>(
    data.payloadType === 'JOB' ? 'QR' : 'CODE128'
  )
  const [quantity, setQuantity] = useState<number>(defaultQuantity)
  const [copied, setCopied] = useState<boolean>(false)
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null)

  const businessName = profile?.business_name || 'Noxis Hub'
  const currency = profile?.base_currency || 'PKR'

  // Dynamic payload calculation
  const payloadValue = useMemo(() => {
    if (data.payloadType === 'JOB' && data.jobId && data.karigarId && data.stage) {
      return encodeJobPayload(data.jobId, data.karigarId, data.stage, data.skuCode)
    }
    return data.barcode || data.skuCode || 'NOXIS-ITEM'
  }, [data])

  // Render 1D Barcode SVG when type is CODE128
  useEffect(() => {
    if (barcodeType === 'CODE128' && barcodeSvgRef.current) {
      const codeToRender = data.barcode || data.skuCode || '000000000000'
      renderBarcodeToSVG(barcodeSvgRef.current, codeToRender, {
        height: dimension === '38x25' ? 28 : dimension === '100x50' ? 55 : 38,
        width: dimension === '38x25' ? 1.2 : dimension === '100x50' ? 2.2 : 1.6,
        displayValue: true,
        fontSize: dimension === '38x25' ? 8 : 10,
        margin: 1,
      })
    }
  }, [barcodeType, data.barcode, data.skuCode, dimension, isOpen])

  const dimInfo = DIMENSIONS[dimension]

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleCopyPayload = useCallback(() => {
    navigator.clipboard.writeText(payloadValue)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [payloadValue])

  if (!isOpen) return null

  const itemsToRender = Array.from({ length: Math.max(1, quantity) })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">

      {/* DYNAMIC CSS PRINT INJECTION FOR EXACT THERMAL STICKER SIZE */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #thermal-print-container, #thermal-print-container * {
            visibility: visible !important;
          }
          #thermal-print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
          }
          @page {
            size: ${dimInfo.widthMm}mm ${dimInfo.heightMm}mm;
            margin: 0mm;
          }
          .thermal-sticker-page {
            width: ${dimInfo.widthMm}mm !important;
            height: ${dimInfo.heightMm}mm !important;
            page-break-after: always !important;
            box-sizing: border-box !important;
            padding: 1.5mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: Arial, sans-serif !important;
            overflow: hidden !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-4xl bg-[#0A0C0F] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0F1115]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Tag size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Universal Thermal Label Generator
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {dimInfo.label}
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Industry-agnostic high-contrast sticker generation & thermal direct printing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">

          {/* LEFT CONFIGURATION PANEL */}
          <div className="lg:col-span-5 p-6 space-y-6 border-r border-white/10 bg-[#0A0C0F]">

            {/* Sticker Dimension Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                <Maximize2 size={13} className="text-blue-400" />
                Sticker Size & Form Factor
              </label>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(DIMENSIONS) as StickerDimension[]).map((dim) => {
                  const info = DIMENSIONS[dim]
                  const isSelected = dimension === dim
                  return (
                    <button
                      key={dim}
                      onClick={() => setDimension(dim)}
                      className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-blue-500/60 bg-blue-500/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                          : 'border-white/5 bg-white/5 text-gray-400 hover:border-white/15 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{info.label}</div>
                        <div className="text-[10px] text-gray-400">{info.desc}</div>
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Visual Code Type (QR vs Barcode) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                <Sliders size={13} className="text-blue-400" />
                Barcode Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setBarcodeType('QR')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                    barcodeType === 'QR'
                      ? 'border-blue-500 bg-blue-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <QrIcon size={14} />
                  2D QR Code
                </button>
                <button
                  onClick={() => setBarcodeType('CODE128')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                    barcodeType === 'CODE128'
                      ? 'border-blue-500 bg-blue-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <BarcodeIcon size={14} />
                  1D Code-128
                </button>
              </div>
            </div>

            {/* Print Quantity Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                <Layers size={13} className="text-blue-400" />
                Batch Quantity (Labels to Print)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#12161F] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                />
                <div className="flex gap-1">
                  {[1, 10, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setQuantity(preset)}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
                    >
                      {preset}×
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Payload Inspector */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Encoded Payload
                </span>
                <button
                  onClick={handleCopyPayload}
                  className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-xs font-mono text-gray-300 break-all bg-black/40 p-2 rounded border border-white/5 max-h-20 overflow-y-auto">
                {payloadValue}
              </p>
            </div>

          </div>

          {/* RIGHT LIVE PREVIEW PANEL */}
          <div className="lg:col-span-7 p-6 bg-[#060709] flex flex-col justify-between items-center min-h-[380px]">

            <div className="w-full text-center mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center justify-center gap-1">
                <Sparkles size={12} className="text-blue-400" />
                Live Thermal Sticker Preview ({dimInfo.label})
              </span>
            </div>

            {/* PREVIEW CONTAINER STYLING */}
            <div className="flex-1 flex items-center justify-center w-full my-2">
              <div
                className="bg-white text-black shadow-2xl rounded p-2 flex flex-col justify-between select-none transition-all duration-300 border border-gray-300"
                style={{
                  width: `${dimInfo.widthMm * 3.5}px`,
                  height: `${dimInfo.heightMm * 3.5}px`,
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                {/* HEADER: BUSINESS NAME */}
                <div className="border-b border-black/15 pb-0.5 text-center">
                  <div className="font-extrabold text-[11px] uppercase tracking-wider truncate text-black">
                    {businessName}
                  </div>
                  {data.title && (
                    <div className="text-[8px] font-semibold text-gray-700 uppercase truncate">
                      {data.title}
                    </div>
                  )}
                </div>

                {/* MIDDLE: VISUAL CODE (QR / BARCODE) */}
                <div className="flex-1 flex items-center justify-center py-1 overflow-hidden">
                  {barcodeType === 'QR' ? (
                    <div className="p-1 bg-white">
                      <QRCode
                        value={payloadValue}
                        size={dimension === '38x25' ? 52 : dimension === '100x50' ? 100 : 70}
                        style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                        viewBox={`0 0 256 256`}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full">
                      <svg ref={barcodeSvgRef} className="max-w-full" />
                    </div>
                  )}
                </div>

                {/* FOOTER: ITEM NAME, SKU, PRICE & STAGE */}
                <div className="border-t border-black/15 pt-0.5 flex items-end justify-between text-black">
                  <div className="min-w-0 pr-1 leading-tight">
                    <div className="font-black text-[10px] truncate max-w-[120px]">
                      {data.name}
                    </div>
                    <div className="font-mono text-[9px] font-bold text-gray-800">
                      SKU: {data.skuCode}
                    </div>
                  </div>

                  <div className="text-right leading-tight flex-shrink-0">
                    {data.stage ? (
                      <span className="inline-block bg-black text-white px-1.5 py-0.5 font-bold text-[9px] rounded uppercase">
                        {data.stage}
                      </span>
                    ) : (
                      <div className="font-extrabold text-[11px] font-mono text-black">
                        {data.price !== undefined
                          ? formatCurrency(data.price, currency)
                          : data.wholesalePrice !== undefined
                          ? formatCurrency(data.wholesalePrice, currency)
                          : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-gray-500">
              High-contrast vector thermal rendering ready for instant USB/Ethernet thermal printing
            </div>

          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#0F1115]">
          <div className="text-xs text-gray-400 font-mono">
            Total stickers to print: <strong className="text-white">{quantity}</strong> label(s)
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-lg shadow-lg shadow-blue-500/20 transition-all"
            >
              <Printer size={15} />
              Print Thermal Sticker ({quantity}×)
            </button>
          </div>
        </div>

      </div>

      {/* HIDDEN THERMAL PRINT CONTAINER FOR MEDIA PRINT */}
      <div id="thermal-print-container" className="hidden">
        {itemsToRender.map((_, idx) => (
          <div key={idx} className="thermal-sticker-page">
            {/* STICKER HEADER */}
            <div style={{ borderBottom: '1px solid #000', paddingBottom: '2px', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}>
                {businessName}
              </div>
              {data.title && (
                <div style={{ fontSize: '8px', textTransform: 'uppercase' }}>
                  {data.title}
                </div>
              )}
            </div>

            {/* STICKER BODY */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px 0' }}>
              {barcodeType === 'QR' ? (
                <QRCode
                  value={payloadValue}
                  size={dimension === '38x25' ? 55 : dimension === '100x50' ? 120 : 75}
                  style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                  viewBox={`0 0 256 256`}
                />
              ) : (
                <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '10px', fontWeight: 'bold' }}>
                  *{data.barcode || data.skuCode}*
                </div>
              )}
            </div>

            {/* STICKER FOOTER */}
            <div style={{ borderTop: '1px solid #000', paddingTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '9px' }}>{data.name}</div>
                <div style={{ fontSize: '8px', fontFamily: 'monospace' }}>SKU: {data.skuCode}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {data.stage ? (
                  <span style={{ background: '#000', color: '#fff', padding: '1px 3px', fontSize: '8px', fontWeight: 'bold' }}>
                    {data.stage}
                  </span>
                ) : (
                  <div style={{ fontWeight: 'bold', fontSize: '10px' }}>
                    {data.price !== undefined
                      ? formatCurrency(data.price, currency)
                      : data.wholesalePrice !== undefined
                      ? formatCurrency(data.wholesalePrice, currency)
                      : ''}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
