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

export const S10_Offline: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const f = frame - from

  // Act 2: Power cut flicker & blackout
  const isBlackout = f >= 28 && f <= 50
  const flickerOpacity =
    f >= 24 && f < 28 ? (f % 2 === 0 ? 0.2 : 0.8) : 1

  // Act 3: Recovery banner appears at frame 55
  const showRecoveryBanner = f >= 55 && f < 120
  const bannerScale = spring({
    frame: f - 55,
    fps,
    config: { damping: 14, stiffness: 220, mass: 0.7 },
  })

  // Act 4: Recovered cart items strictly on button press at frame 94
  const showRecoveredCart = f >= 94
  const item1Slide = interpolate(f, [94, 108], [-50, 0], {
    extrapolateRight: 'clamp',
  })
  const item2Slide = interpolate(f, [102, 116], [-50, 0], {
    extrapolateRight: 'clamp',
  })

  // Headline overlay
  const textOpacity = interpolate(f, [155, 175], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // Windows 11 Cursor Waypoints
  const waypoints: CursorWaypoint[] = [
    { frame: 55, x: 800, y: 350, type: 'arrow' },
    { frame: 82, x: 1810, y: 135, type: 'pointer', label: 'RECOVER DRAFT' },
    { frame: 94, x: 1810, y: 135, type: 'pointer', click: true, label: 'Draft Restored ✓', tooltipPlacement: 'below-button' },
    { frame: 115, x: 1810, y: 135, type: 'pointer' },
    { frame: 140, x: 1680, y: 780, type: 'arrow', label: 'Cart Rehydrated' },
    { frame: 160, x: 1680, y: 780, type: 'arrow' },
  ]

  return (
    <AbsoluteFill className="bg-[#060708]">
      <div style={{ opacity: flickerOpacity }} className="w-full h-full flex flex-col">
        <NoxisWindowFrame pageTitle="POS TERMINAL · RESILIENT STORAGE" activeThemeAccent="#06B6D4">
          <NoxisSidebar activeId="pos" accentColor="#06B6D4" />

          <div className="flex-1 flex flex-col justify-between p-7 relative font-sans pb-20">
            {/* Top Draft Recovery Banner */}
            {showRecoveryBanner && (
              <div
                className="bg-[#2D1F05] border border-[#F59E0B] p-4 rounded-md flex items-center justify-between z-30 shadow-2xl"
                style={{ transform: `scale(${bannerScale})` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <h3 className="text-sm font-bold text-[#F59E0B] font-mono">
                      POWER OUTAGE RECOVERY DETECTED
                    </h3>
                    <p className="text-xs text-gray-300">
                      Unsaved POS draft session found from 47 minutes ago before sudden generator trip.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs font-bold">
                  <button className="px-3.5 py-1.5 rounded bg-white/10 text-gray-400">
                    DISCARD
                  </button>
                  <button
                    className="px-4 py-2 rounded-md font-mono text-xs font-black tracking-wider transition-all shadow-xl"
                    style={{
                      background: f >= 94 && f <= 104 ? '#10B981' : '#06B6D4',
                      color: '#000000',
                      transform: f >= 94 && f <= 104 ? 'scale(0.96)' : 'scale(1)',
                      boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)',
                    }}
                  >
                    RECOVER DRAFT
                  </button>
                </div>
              </div>
            )}

            {/* Cart Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 font-mono">
                <span className="text-xs text-gray-400 uppercase">
                  ACTIVE TERMINAL SESSION #8812 · CUSTOMER: HAJI RAFIQ COTTON
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">
                  ● SQLite WAL Journal Sealed
                </span>
              </div>

              {/* Items in Cart */}
              <div className="space-y-2">
                {(f < 28 || showRecoveredCart) && (
                  <div
                    className="p-3.5 rounded bg-[#0D111A] border border-white/[0.06] flex items-center justify-between font-mono"
                    style={{
                      transform: showRecoveredCart ? `translateX(${item1Slide}px)` : 'none',
                    }}
                  >
                    <div>
                      <p className="text-xs font-bold text-white">Cotton Yarn 40s Combed Compact</p>
                      <p className="text-[10px] text-gray-400">20 Bags × PKR 500</p>
                    </div>
                    <span className="text-sm font-bold text-white">PKR 10,000</span>
                  </div>
                )}

                {(f < 28 || showRecoveredCart) && (
                  <div
                    className="p-3.5 rounded bg-[#0D111A] border border-white/[0.06] flex items-center justify-between font-mono"
                    style={{
                      transform: showRecoveredCart ? `translateX(${item2Slide}px)` : 'none',
                    }}
                  >
                    <div>
                      <p className="text-xs font-bold text-white">Bleaching Agent Liquid Hydrogen Peroxide</p>
                      <p className="text-[10px] text-gray-400">1 Drum × PKR 5,000</p>
                    </div>
                    <span className="text-sm font-bold text-white">PKR 5,000</span>
                  </div>
                )}
              </div>
            </div>

            {/* Total Balance */}
            <div className="flex items-center justify-between border-t border-white/[0.08] pt-4 font-mono">
              <span className="text-xs text-gray-400">TOTAL CART BALANCE</span>
              <span className="text-2xl font-black text-emerald-400">
                {(f < 28 || showRecoveredCart) ? 'PKR 15,000' : 'PKR 0'}
              </span>
            </div>

            {/* Centered Text Overlay */}
            {f >= 155 && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] z-40 text-center space-y-3"
                style={{ opacity: textOpacity }}
              >
                <h2 className="text-5xl font-black text-white font-mono tracking-tight uppercase">
                  Your business never stops.
                </h2>
                <p className="text-lg text-gray-300 font-medium max-w-xl">
                  Even when the power cuts out. 100% offline-first architecture with instant WAL draft recovery.
                </p>
              </div>
            )}

          </div>
        </NoxisWindowFrame>
      </div>

      {/* Windows 11 Precision Cursor (Screen Level) */}
      {f >= 55 && f < 170 && <Windows11Cursor waypoints={waypoints} />}


      {/* Blackout overlay */}
      {isBlackout && (
        <AbsoluteFill className="bg-black flex flex-col items-center justify-center text-center z-50">
          <span className="text-5xl mb-4 animate-bounce">⚡</span>
          <p className="text-xl font-bold font-mono text-[#F59E0B] tracking-wider uppercase">
            POWER OUTAGE SIMULATION
          </p>
          <p className="text-xs font-mono text-gray-400 mt-1">
            AC Mains Lost · Switching to Battery / Safe Crash State
          </p>
        </AbsoluteFill>
      )}

      {/* Customer Pitch HUD */}
      <PitchHUD
        badge="10 · HARDWARE RESILIENCE"
        title="BUILT FOR PAKISTAN & REGIONAL GRIDS · ZERO TRANSACTION LOSS IN BLACKOUTS"
        explanation="Load-shedding and generator trips corrupt traditional cloud sessions. Noxis Hub automatically restores unposted invoices down to the exact line item with 1-click."
        roiPoints={['Zero Corrupted Invoices', '1-Click Draft Rehydration', '100% Load-Shedding Safe']}
        accentColor="#F59E0B"
      />
    </AbsoluteFill>
  )
}
