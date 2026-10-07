import {
  AbsoluteFill,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from 'remotion'
import { NoxisSidebar } from '../components/NoxisSidebar'

export const S05_Invoice: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const f = Math.max(0, frame - from)

  // Stamp spring animation dropping at frame 110
  const stampSpring = spring({
    frame: f - 110,
    fps,
    config: {
      damping: 10,
      stiffness: 220,
      mass: 0.8,
    },
  })

  const showStamp = f >= 110

  return (
    <AbsoluteFill className="flex flex-row" style={{ background: '#060708' }}>
      <NoxisSidebar activeIndex={4} />

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Invoice Builder Form (50%) */}
        <div
          className="w-1/2 p-6 border-r flex flex-col justify-between"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/6">
              <div>
                <h1 className="text-white font-black text-xl tracking-tight">
                  New Tax Invoice
                </h1>
                <p className="text-gray-500 text-xs font-mono">
                  INV-2026-000089 · Multi-Currency / FBR Ready
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Draft Mode
              </span>
            </div>

            {/* Party Selector */}
            <div className="bg-[#0F1114] border border-white/8 p-3 rounded-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Customer / Bill To
              </span>
              <p className="text-sm font-bold text-white flex items-center justify-between">
                <span>🏢 Al-Baraka Trading Co.</span>
                <span className="text-xs text-emerald-400 font-mono">Verified Buyer</span>
              </p>
              <p className="text-[10px] text-gray-500 font-mono">
                NTN: 4189320-7 · STRN: 32778761209 · Circular Road, Lahore
              </p>
            </div>

            {/* Line items list */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Invoice Particulars (3 Items)
              </span>

              {[
                { name: '1. Premium Cotton 40s (Bleached)', qty: '50 MTR', rate: 'PKR 180', total: 'PKR 9,000' },
                { name: '2. Poly-Lining Warp Knit', qty: '20 MTR', rate: 'PKR 95', total: 'PKR 1,900' },
                { name: '3. Heavy Cotton Twill 60s Navy', qty: '30 MTR', rate: 'PKR 220', total: 'PKR 6,600' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#0F1114] border border-white/5 p-2.5 rounded-sm flex justify-between items-center text-xs"
                >
                  <div>
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-[10px] text-gray-500 font-mono">
                      {item.qty} @ {item.rate}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-gray-200">
                    {item.total}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Action Controls */}
          <div className="pt-4 border-t border-white/6 space-y-2">
            <div className="flex justify-between text-sm font-mono font-bold py-1">
              <span className="text-gray-400">Grand Total</span>
              <span className="text-[#60A5FA] text-lg">PKR 17,500</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-2.5 rounded-sm font-bold text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1.5 shadow">
                <span>💬 WhatsApp PDF [F8]</span>
              </button>
              <button className="py-2.5 rounded-sm font-bold text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center gap-1.5 shadow">
                <span>✓ Post to Ledger [F10]</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Live High-Fidelity A4 PDF Document (50%) */}
        <div className="w-1/2 p-6 bg-[#08090C] flex items-center justify-center overflow-hidden relative">
          {/* Virtual A4 Canvas */}
          <div
            className="w-[460px] h-[640px] bg-white text-black p-7 shadow-2xl rounded-[3px] flex flex-col justify-between relative select-none"
            style={{ transform: 'scale(0.96)' }}
          >
            {/* Document Header */}
            <div>
              <div className="flex justify-between items-start border-b-2 border-black pb-3">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-black uppercase">
                    Al-Hameed Textile Mills
                  </h2>
                  <p className="text-[9px] text-gray-600 font-mono leading-tight mt-0.5">
                    Plot 45-B, Sundar Industrial Estate, Lahore<br />
                    NTN: 8910243-1 · STRN: 32009845112 · Tel: +92 42 35914000
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black uppercase tracking-wider text-black block">
                    TAX INVOICE
                  </span>
                  <span className="text-[10px] font-mono font-bold text-gray-700">
                    #INV-2026-000089
                  </span>
                  <p className="text-[9px] text-gray-500 font-mono">Date: 06-OCT-2026</p>
                </div>
              </div>

              {/* Bill To Info */}
              <div className="py-3 border-b border-gray-200 text-[10px]">
                <span className="font-bold text-gray-500 uppercase tracking-widest text-[8px] block mb-0.5">
                  Billed To
                </span>
                <p className="font-bold text-black text-xs">Al-Baraka Trading Co.</p>
                <p className="text-gray-600 font-mono text-[9px]">
                  Circular Road, Wholesale Cloth Market, Lahore · NTN: 4189320-7
                </p>
              </div>

              {/* PDF Table */}
              <table className="w-full text-[10px] my-3 border-collapse">
                <thead>
                  <tr className="border-b border-black text-[9px] font-bold uppercase tracking-wider">
                    <th className="text-left py-1">Description</th>
                    <th className="text-center py-1">Qty</th>
                    <th className="text-right py-1">Rate</th>
                    <th className="text-right py-1">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-mono text-[9px]">
                  <tr>
                    <td className="py-1 font-sans font-medium">Cotton Fabric 40s Bleached</td>
                    <td className="text-center">50 M</td>
                    <td className="text-right">180.00</td>
                    <td className="text-right font-bold">9,000.00</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-sans font-medium">Polyester Lining Warp Knit</td>
                    <td className="text-center">20 M</td>
                    <td className="text-right">95.00</td>
                    <td className="text-right font-bold">1,900.00</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-sans font-medium">Cotton Twill 60s Navy Blue</td>
                    <td className="text-center">30 M</td>
                    <td className="text-right">220.00</td>
                    <td className="text-right font-bold">6,600.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Document Footer & Amount in Words */}
            <div className="border-t border-gray-300 pt-2 space-y-2">
              <div className="flex justify-between items-baseline text-xs font-mono font-bold">
                <span className="font-sans text-[10px] uppercase text-gray-600">Net Payable Total</span>
                <span className="text-black text-sm">PKR 17,500.00</span>
              </div>

              <div className="bg-gray-100 p-1.5 rounded text-[8px] font-mono text-gray-700">
                <span className="font-bold">In Words: </span>
                Seventeen Thousand Five Hundred Rupees Only
              </div>

              <div className="flex justify-between items-center text-[8px] text-gray-500 font-mono pt-2 border-t border-gray-200">
                <span>Bank: Meezan Bank Ltd · IBAN: PK42MEZN000100984512</span>
                <span className="font-bold">Authorized Signatory</span>
              </div>
            </div>

            {/* PARTIAL Stamp Overlay with spring drop */}
            {showStamp && (
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-amber-500 px-6 py-2 rounded-sm"
                style={{
                  transform: `translate(-50%, -50%) scale(${Math.max(
                    0.2,
                    stampSpring
                  )}) rotate(-14deg)`,
                  boxShadow: '0 0 20px rgba(245,158,11,0.25)',
                }}
              >
                <span className="text-3xl font-black font-mono tracking-widest text-amber-600 uppercase">
                  PARTIAL
                </span>
                <p className="text-[9px] font-bold text-amber-700 font-mono text-center tracking-normal">
                  BAL: PKR 12,500
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
