import React from 'react'
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from 'remotion'

export const S08_Offline: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame()
  const f = Math.max(0, frame - from)

  // ── ACT 2: Power cut flicker (frames 30-60)
  // Flicker opacity around frame 30-38, black screen frame 38-46
  let screenOpacity = 1
  if (f >= 30 && f < 38) {
    screenOpacity = (f % 2 === 0) ? 0.2 : 0.8
  } else if (f >= 38 && f < 46) {
    screenOpacity = 0 // TOTAL BLACKOUT
  } else if (f >= 46 && f < 60) {
    screenOpacity = interpolate(f, [46, 60], [0.1, 1], {
      extrapolateRight: 'clamp',
    })
  }

  // Text "Power Cut — 47 minutes later" (frames 42-60)
  const powerCutTextOpacity = interpolate(f, [40, 48, 58, 62], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  })

  // ── ACT 3 & 4: Banner & Recovery (frames 60-240)
  const isRecovered = f >= 120

  const bannerOpacity = interpolate(f, [65, 75], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  })

  // Cart restoration animations
  const cartSlide1 = interpolate(f, [125, 140], [-60, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  })
  const cartSlide2 = interpolate(f, [135, 150], [-60, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  })

  // Big slogan overlay (frames 150-240)
  const sloganOpacity = interpolate(f, [150, 175], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  })

  return (
    <AbsoluteFill style={{ background: '#060708' }}>
      {/* Main Software View with Power Cut Opacity */}
      <div
        className="w-full h-full flex flex-col justify-between"
        style={{ opacity: screenOpacity }}
      >
        {/* Top Hub Bar */}
        <div
          className="h-14 px-8 border-b flex items-center justify-between bg-[#0A0C0F]"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-black text-xs text-blue-400">
              N
            </div>
            <span className="text-white font-bold text-sm tracking-wide">
              Noxis POS Terminal · Station #01
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-emerald-400">● SQLite WAL Active</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-400">Local Journal: Auto-Sync</span>
          </div>
        </div>

        {/* ACT 3: Draft Recovery Banner */}
        {f >= 65 && !isRecovered && (
          <div
            className="bg-amber-500/15 border-y border-amber-500/30 px-8 py-3 flex items-center justify-between"
            style={{ opacity: bannerOpacity }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-bold text-amber-400">
                  Unsaved draft found from 47 minutes ago
                </p>
                <p className="text-xs text-gray-400 font-mono">
                  Preserved in local hardware buffer prior to abrupt power loss
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="px-4 py-1.5 rounded-sm font-bold text-xs bg-cyan-500 text-black shadow-lg">
                ✓ Recover Draft Now
              </button>
              <button className="px-3 py-1.5 rounded-sm font-bold text-xs bg-white/5 text-gray-400 border border-white/10">
                Discard
              </button>
            </div>
          </div>
        )}

        {/* POS Body */}
        <div className="flex-1 p-8 grid grid-cols-3 gap-8">
          <div className="col-span-2 bg-[#0F1114] border border-white/7 rounded-sm p-6 flex flex-col justify-between">
            <div>
              <div className="pb-4 border-b border-white/6 mb-4 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">
                  Customer: Haji Rafiq Cotton Traders
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  Session Draft #8812
                </span>
              </div>

              {/* Items in Cart */}
              {(f < 35 || isRecovered) && (
                <div className="space-y-3 font-mono">
                  <div
                    className="p-3 bg-white/[0.02] border border-white/5 rounded flex justify-between items-center"
                    style={{
                      transform: isRecovered ? `translateX(${cartSlide1}px)` : 'none',
                    }}
                  >
                    <div>
                      <p className="text-sm font-bold text-white font-sans">
                        Cotton Yarn 40s Combed Compact
                      </p>
                      <p className="text-xs text-gray-500">20 Bags @ PKR 500</p>
                    </div>
                    <span className="text-sm font-bold text-white">PKR 10,000</span>
                  </div>

                  <div
                    className="p-3 bg-white/[0.02] border border-white/5 rounded flex justify-between items-center"
                    style={{
                      transform: isRecovered ? `translateX(${cartSlide2}px)` : 'none',
                    }}
                  >
                    <div>
                      <p className="text-sm font-bold text-white font-sans">
                        Bleaching Agent Liquid Hydrogen Peroxide
                      </p>
                      <p className="text-xs text-gray-500">1 Drum @ PKR 5,000</p>
                    </div>
                    <span className="text-sm font-bold text-white">PKR 5,000</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/6 flex justify-between items-center font-mono">
              <span className="text-sm text-gray-400">Total Cart Balance</span>
              <span className="text-2xl font-black text-[#10B981]">
                {(f < 35 || isRecovered) ? 'PKR 15,000' : 'PKR 0'}
              </span>
            </div>
          </div>

          {/* Right Summary */}
          <div className="bg-[#0F1114] border border-white/7 rounded-sm p-6 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-4">
                Hardware Protection Hub
              </p>
              <div className="space-y-4 font-mono text-xs">
                <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <p className="font-bold">✓ Zero Data Loss SLA</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Atomic transaction writes flush to SSD disk prior to ACK
                  </p>
                </div>
                <div className="p-3 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <p className="font-bold">✓ SQLite WAL Replication</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Safe against unexpected generator trips and UPS outages
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-gray-500 font-mono">
              Noxis Hardware Bridge v13.0.7
            </div>
          </div>
        </div>
      </div>

      {/* ACT 2: Blackout Text Overlay */}
      {powerCutTextOpacity > 0 && (
        <AbsoluteFill className="items-center justify-center flex flex-col pointer-events-none z-50">
          <div
            className="text-center p-8 bg-black/80 rounded-xl border border-amber-500/30"
            style={{ opacity: powerCutTextOpacity }}
          >
            <span className="text-5xl mb-2 block">⚡</span>
            <p className="text-3xl font-black text-amber-400 tracking-tight">
              Power Cut — 47 Minutes Later
            </p>
            <p className="text-xs text-gray-400 font-mono mt-1">
              Industrial Grid Shutdown in Faisalabad
            </p>
          </div>
        </AbsoluteFill>
      )}

      {/* ACT 4: Large Slogan Overlay */}
      {sloganOpacity > 0 && (
        <AbsoluteFill
          className="items-center justify-center flex flex-col pointer-events-none z-40"
          style={{
            background: `rgba(6,7,8,${sloganOpacity * 0.75})`,
            opacity: sloganOpacity,
          }}
        >
          <div className="text-center space-y-4 max-w-2xl px-6">
            <h2 className="text-6xl font-black text-white tracking-tight drop-shadow-2xl">
              Your business never stops.
            </h2>
            <p className="text-xl text-gray-300 font-medium">
              Even when the power does. 100% offline-first industrial software.
            </p>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  )
}
