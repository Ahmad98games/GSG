import React from 'react'
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from 'remotion'
import { NoxisSidebar } from '../components/NoxisSidebar'

const INITIAL_ITEMS = [
  { sku: 'YRN-401', name: 'Cotton Raw Yarn 40s (Ring Spun)', stock: '14 Bags', alert: 'LOW STOCK', reorder: '50 Bags' },
  { sku: 'DYE-092', name: 'Reactive Turquoise Blue GL Dye', stock: '8 KG', alert: 'EXPIRING SOON', reorder: '25 KG' },
  { sku: 'LBL-104', name: 'Woven Neck Labels (Export Gold)', stock: '420 PCS', alert: 'LOW STOCK', reorder: '2,000 PCS' },
  { sku: 'ZIP-501', name: 'YKK Brass Zipper #5 Heavy Duty', stock: '65 PCS', alert: 'LOW STOCK', reorder: '500 PCS' },
  { sku: 'FAB-802', name: 'Grey Greige Fabric 68x68 Weft', stock: '4,200 MTR', alert: null, reorder: '1,000 MTR' },
  { sku: 'PKG-303', name: 'Corrugated Export Cartons 7-Ply', stock: '850 PCS', alert: null, reorder: '200 PCS' },
  { sku: 'BTN-204', name: 'Resin Horn Buttons 18L Smoke', stock: '12,400 PCS', alert: null, reorder: '2,500 PCS' },
]

export const S06_Inventory: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame()
  const f = Math.max(0, frame - from)

  // Scanner pulse around frame 60
  const scannerPulse = f >= 50 && f < 75 ? Math.sin((f - 50) * 0.4) * 0.2 + 1 : 1

  // Flash green overlay between frame 75 and 85
  const flashOpacity = interpolate(f, [75, 78, 85], [0, 0.35, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  })

  // New item slides in at frame 80
  const newItemSlide = interpolate(f, [80, 95], [-40, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  })
  const newItemOpacity = interpolate(f, [80, 92], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  })

  const hasScannedItem = f >= 80

  return (
    <AbsoluteFill className="flex flex-row" style={{ background: '#060708' }}>
      <NoxisSidebar activeIndex={2} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top bar */}
        <div
          className="px-8 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div>
            <h1 className="text-white font-black text-2xl tracking-tight flex items-center gap-3">
              Stock & Inventory Ledger
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                1,247 Items Active
              </span>
            </h1>
            <p className="text-gray-400 text-xs font-mono mt-0.5">
              Central Warehouse · Bin Locations A1 through F8
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#0F1114] border border-white/8 text-xs text-gray-300 font-mono transition-transform"
              style={{ transform: `scale(${scannerPulse})` }}
            >
              <span className="text-emerald-400 text-sm">⚡</span>
              <span>Wireless Barcode Scanner [Ready]</span>
            </div>
            <button className="px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-sm text-xs font-bold font-mono">
              + Add Material
            </button>
          </div>
        </div>

        {/* Scan Flash Overlay */}
        {flashOpacity > 0 && (
          <div
            className="absolute inset-0 pointer-events-none z-50 bg-emerald-500"
            style={{ opacity: flashOpacity }}
          />
        )}

        {/* Inventory Table Container */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col justify-between">
          <div className="bg-[#0F1114] border border-white/7 rounded-sm overflow-hidden flex-1 flex flex-col shadow-xl">
            {/* Table Header */}
            <div className="grid grid-cols-12 px-5 py-2.5 bg-white/[0.02] border-b border-white/6 text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">
              <span className="col-span-2">SKU Code</span>
              <span className="col-span-5">Material Description</span>
              <span className="col-span-2 text-right">Current Stock</span>
              <span className="col-span-2 text-center">Threshold Alert</span>
              <span className="col-span-1 text-right">Min Reorder</span>
            </div>

            {/* List */}
            <div className="flex-1 divide-y divide-white/5 overflow-hidden font-mono text-xs">
              {/* Newly scanned item sliding in */}
              {hasScannedItem && (
                <div
                  className="grid grid-cols-12 px-5 py-3 items-center bg-emerald-500/10 border-l-2 border-emerald-400"
                  style={{
                    transform: `translateY(${newItemSlide}px)`,
                    opacity: newItemOpacity,
                  }}
                >
                  <span className="col-span-2 text-emerald-400 font-bold">
                    ★ TEX-992
                  </span>
                  <span className="col-span-5 text-white font-bold font-sans">
                    Spun Poly Sewing Thread 5000m (White)
                  </span>
                  <span className="col-span-2 text-right text-emerald-400 font-bold">
                    +120 Cones
                  </span>
                  <div className="col-span-2 flex justify-center">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      SCAN RECEIVED
                    </span>
                  </div>
                  <span className="col-span-1 text-right text-gray-400">
                    25 Cones
                  </span>
                </div>
              )}

              {INITIAL_ITEMS.map((item) => (
                <div
                  key={item.sku}
                  className="grid grid-cols-12 px-5 py-3 items-center hover:bg-white/[0.02]"
                >
                  <span className="col-span-2 text-gray-400">{item.sku}</span>
                  <span className="col-span-5 text-white font-medium font-sans">
                    {item.name}
                  </span>
                  <span className="col-span-2 text-right font-bold text-gray-200">
                    {item.stock}
                  </span>
                  <div className="col-span-2 flex justify-center">
                    {item.alert === 'LOW STOCK' ? (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
                        ⚠️ LOW STOCK
                      </span>
                    ) : item.alert === 'EXPIRING SOON' ? (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30">
                        ⏳ EXPIRES 14D
                      </span>
                    ) : (
                      <span className="text-[9px] text-gray-500">Normal</span>
                    )}
                  </div>
                  <span className="col-span-1 text-right text-gray-400">
                    {item.reorder}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
