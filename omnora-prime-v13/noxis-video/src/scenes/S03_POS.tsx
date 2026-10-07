import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion'
import { NoxisWindowFrame } from '../components/NoxisWindowFrame'
import { NoxisSidebar } from '../components/NoxisSidebar'
import { Windows11Cursor, CursorWaypoint } from '../components/Windows11Cursor'
import { PitchHUD } from '../components/PitchHUD'

const CART_ITEMS = [
  { name: 'Cotton Fabric 40s (Premium Weave)', qty: 50, unit: 'Meter', price: 180, total: 9000, code: 'FAB-001' },
  { name: 'Polyester Lining Heavy Grade', qty: 20, unit: 'Meter', price: 95, total: 1900, code: 'LIN-042' },
  { name: 'Cotton Twill Export 60s', qty: 30, unit: 'Meter', price: 220, total: 6600, code: 'FAB-019' },
]

// Calibrated 1920x1080 screen coordinates
const POS_WAYPOINTS: CursorWaypoint[] = [
  { frame: 0, x: 500, y: 150, type: 'arrow' },
  { frame: 25, x: 650, y: 135, type: 'text', label: 'Search Item / Barcode' },
  { frame: 145, x: 1760, y: 975, type: 'pointer', click: true, label: 'Complete Sale [F12]' },
  {
    frame: 215,
    x: 1055,
    y: 605,
    type: 'pointer',
    click: true,
    label: 'Send WhatsApp Receipt ✓',
    tooltipPlacement: 'above-button',
  },
  { frame: 270, x: 1055, y: 605, type: 'pointer' },
]



export const S03_POS: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const f = frame - from

  // Search input typing simulation
  const searchText = f > 22 ? 'Cotton Fabric 40s [Barcode: 8901234]' : f > 8 ? 'Cotton Fab...' : ''

  // Items staggered appearance
  const visibleItems = Math.min(3, Math.floor(f / 28))

  // Payment panel slide in
  const paymentSlide = interpolate(f, [85, 110], [260, 0], {
    extrapolateRight: 'clamp',
  })

  // Receipt popup spring
  const showReceipt = f >= 155
  const receiptScale = spring({
    frame: f - 155,
    fps,
    config: { damping: 14, stiffness: 210, mass: 0.65 },
  })

  const grandTotal = CART_ITEMS.slice(0, visibleItems).reduce((s, i) => s + i.total, 0)
  const isSaleButtonActive = f >= 143 && f <= 152
  const isWhatsAppActive = f >= 213 && f <= 225

  return (
    <AbsoluteFill className="bg-[#060708]">
      <NoxisWindowFrame pageTitle="POS COUNTER" activeThemeAccent="#10B981">
        <NoxisSidebar activeId="pos" accentColor="#10B981" />

        <div className="flex-1 flex overflow-hidden relative font-sans pb-16">
          {/* Left Side: POS Counter & Items */}
          <div className="flex-1 flex flex-col justify-between p-6">
            <div className="space-y-3">
              {/* Barcode Search Header */}
              <div
                className="flex items-center gap-3 bg-[#0B0E14] border px-4 py-2.5 rounded-sm transition-all"
                style={{
                  borderColor: f > 12 && f < 45 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(255, 255, 255, 0.08)',
                  boxShadow: f > 12 && f < 45 ? '0 0 20px rgba(16, 185, 129, 0.2)' : 'none',
                }}
              >
                <span className="text-emerald-400 text-sm animate-pulse">⚡</span>
                <span className="text-xs text-gray-500 font-mono">SCAN / SEARCH:</span>
                <span className="text-sm font-mono font-bold text-white flex-1">
                  {searchText || <span className="text-gray-600 font-normal">Scan barcode or press F2 to search inventory...</span>}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">
                  F2 Barcode Scanner
                </span>
              </div>

              {/* Cart Items List */}
              <div className="space-y-2 mt-4">
                {CART_ITEMS.slice(0, visibleItems).map((item, i) => {
                  const delay = i * 28
                  const rowOpacity = interpolate(f - delay, [0, 8], [0, 1], {
                    extrapolateRight: 'clamp',
                  })
                  const rowY = interpolate(f - delay, [0, 10], [15, 0], {
                    extrapolateRight: 'clamp',
                  })

                  return (
                    <div
                      key={item.code}
                      className="bg-[#0F131A] border border-white/[0.06] rounded-sm p-3.5 flex items-center justify-between"
                      style={{
                        opacity: rowOpacity,
                        transform: `translateY(${rowY}px)`,
                      }}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{item.name}</span>
                          <span className="text-[9px] font-mono text-cyan-400 px-1.5 py-0.2 rounded bg-cyan-400/10">
                            {item.code}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono">
                          {item.qty} {item.unit} × PKR {item.price.toLocaleString()}
                        </p>
                      </div>
                      <span className="text-sm font-black text-white font-mono">
                        PKR {item.total.toLocaleString()}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Total Footer */}
            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                  Total Net Payable
                </span>
                <p className="text-[10px] text-emerald-400 font-mono">
                  ✓ FBR Tier-1 POS Integration Active
                </p>
              </div>
              <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                PKR {grandTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Right Side: Payment Panel */}
          <div
            className="w-72 bg-[#090C12] border-l border-white/[0.08] p-5 flex flex-col justify-between"
            style={{
              transform: `translateX(${paymentSlide}px)`,
            }}
          >
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                PAYMENT SETTLEMENT [F9]
              </span>

              <div className="bg-[#0D1118] border border-white/[0.06] p-3 rounded-sm text-center">
                <span className="text-[9px] font-mono text-gray-500 uppercase">DUE BALANCE</span>
                <p className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                  PKR 17,500
                </p>
              </div>

              {/* Payment methods */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold">
                {[
                  { label: 'Cash', color: '#10B981', active: true },
                  { label: 'Bank Transfer', color: '#60A5FA', active: false },
                  { label: 'JazzCash', color: '#EF4444', active: false },
                  { label: 'Khata Ledger', color: '#C5A059', active: false },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="p-2.5 rounded-sm border text-center transition-all cursor-pointer"
                    style={{
                      borderColor: m.active ? m.color : 'rgba(255,255,255,0.08)',
                      background: m.active ? `${m.color}15` : 'rgba(255,255,255,0.02)',
                      color: m.active ? m.color : '#94A3B8',
                    }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            <button
              className="py-3.5 px-6 rounded-sm bg-emerald-500 text-black font-black text-sm tracking-wider font-mono shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
              style={{
                position: 'absolute',
                left: 1760,
                top: 975,
                transform: `translate(-50%, -50%) ${isSaleButtonActive ? 'scale(0.96)' : 'scale(1)'}`,
                background: isSaleButtonActive ? '#059669' : '#10B981',
                zIndex: 25,
                minWidth: 260,
              }}
            >
              <span>✓</span>
              <span>COMPLETE SALE [F12]</span>
            </button>
          </div>

          {/* Receipt Modal Popup */}
          {showReceipt && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-30 pointer-events-none">
              <div
                className="bg-[#0F131A] border border-emerald-500/30 rounded-lg p-6 w-[420px] text-center space-y-4 shadow-2xl absolute"
                style={{
                  left: 960,
                  top: 480,
                  transform: `translate(-50%, -50%) scale(${receiptScale})`,
                }}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center text-xl font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-mono">
                    TRANSACTION POSTED
                  </h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                    INV-2026-000089 · FBR POS INVOICE #8942-PK
                  </p>
                </div>
                <div className="bg-[#090C12] border border-white/[0.06] p-3 rounded font-mono">
                  <span className="text-[9px] text-gray-500 uppercase">AMOUNT CLEARED</span>
                  <p className="text-2xl font-black text-emerald-400">
                    PKR 17,500
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4 text-xs font-mono font-bold pt-1">
                  <button
                    className="w-40 py-2.5 rounded bg-white/5 border border-white/10 text-gray-300"
                    style={{
                      transform: 'none',
                    }}
                  >
                    🖨️ Thermal (80mm)
                  </button>
                  <button
                    className="w-40 py-2.5 rounded font-bold transition-all shadow-md"
                    style={{
                      background: isWhatsAppActive ? '#10B981' : 'rgba(16, 185, 129, 0.2)',
                      color: isWhatsAppActive ? '#000000' : '#10B981',
                      border: '1px solid rgba(16, 185, 129, 0.5)',
                      transform: isWhatsAppActive ? 'scale(0.95)' : 'scale(1)',
                    }}
                  >
                    💬 WhatsApp Receipt
                  </button>
                </div>
              </div>
            </div>
          )}


        </div>
      </NoxisWindowFrame>

      {/* Windows 11 Native Precision Cursor (Screen Level) */}
      <Windows11Cursor waypoints={POS_WAYPOINTS} />

      {/* Customer Pitch HUD */}
      <PitchHUD
        badge="03 · COUNTER CHECKOUT"
        title="RAPID BARCODE BILLING · CASH, BANK & KHATA SPLIT IN SECONDS"
        explanation="Eliminate counter queues with keyboard-first shortcuts [F2 to F10], split payment tenders, and instant automated WhatsApp PDF receipt dispatch to customer phones."
        roiPoints={['Under 1.5s Per Bill', 'Multi-Tender Settlement', 'Direct WhatsApp Dispatch']}
        accentColor="#10B981"
      />
    </AbsoluteFill>
  )
}
