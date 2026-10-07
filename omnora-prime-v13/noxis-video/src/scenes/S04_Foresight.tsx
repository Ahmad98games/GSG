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

// Calibrated 1920x1080 screen coordinates
const FORESIGHT_WAYPOINTS: CursorWaypoint[] = [
  { frame: 0, x: 220, y: 250, type: 'arrow' },
  { frame: 45, x: 295, y: 395, type: 'pointer', click: true, label: 'Auto-Generate PO to Supplier' },
  { frame: 125, x: 635, y: 395, type: 'pointer', click: true, label: '30-Day Liquidity Curve' },
  { frame: 220, x: 635, y: 395, type: 'pointer' },
]



export const S04_Foresight: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const f = frame - from

  // Card stagger spring
  const card1Spring = spring({
    frame: f - 10,
    fps,
    config: { damping: 14, stiffness: 200, mass: 0.7 },
  })
  const card2Spring = spring({
    frame: f - 25,
    fps,
    config: { damping: 14, stiffness: 200, mass: 0.7 },
  })
  const card3Spring = spring({
    frame: f - 40,
    fps,
    config: { damping: 14, stiffness: 200, mass: 0.7 },
  })

  // Neural analysis progress indicator
  const scanProgress = interpolate(f, [5, 45], [0, 100], {
    extrapolateRight: 'clamp',
  })

  const isPoButtonClicked = f >= 43 && f <= 55
  const isLiquidityClicked = f >= 123 && f <= 135

  return (
    <AbsoluteFill className="bg-[#060708]">
      <NoxisWindowFrame pageTitle="FORESIGHT AI & INTELLIGENCE" activeThemeAccent="#06B6D4">
        <NoxisSidebar activeId="foresight" accentColor="#06B6D4" />

        <div className="flex-1 flex flex-col overflow-y-auto p-7 space-y-5 font-sans pb-20 relative">
          {/* Intelligence Header Bar */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-xl">🧠</span>
                <h2 className="text-lg font-bold text-white font-mono tracking-wide">
                  NOXIS FORESIGHT NEURAL ENGINE
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 uppercase">
                  Continuous Learning
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Machine intelligence trained on local factory orders, karigar productivity, and supplier volatility.
              </p>
            </div>

            {/* Neural confidence badge */}
            <div className="flex items-center gap-3 bg-[#0C1017] border border-cyan-500/20 px-3.5 py-2 rounded-sm font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <div className="flex flex-col text-right">
                <span className="text-[9px] text-gray-400 uppercase">MODEL CONFIDENCE</span>
                <span className="text-xs font-bold text-cyan-400">96.8% (VERIFIED)</span>
              </div>
            </div>
          </div>

          {/* Neural Scan Bar */}
          <div className="bg-[#0A0E15] border border-white/[0.06] p-3 rounded-sm flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3 flex-1 mr-6">
              <span className="text-cyan-400 text-xs animate-spin">⚡</span>
              <span className="text-gray-300 text-[11px]">
                Autonomous Factory Scan: Analyzing 1,420 historical cycles...
              </span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] text-cyan-300 font-bold">100% OFFLINE INFERENCE</span>
          </div>

          {/* Predictive Intelligence Cards */}
          <div className="grid grid-cols-3 gap-4">
            {/* 1. Critical Inventory Prediction */}
            <div
              className="bg-[#0C0F17] border rounded-sm p-4.5 flex flex-col justify-between space-y-3"
              style={{
                borderColor: 'rgba(239, 68, 68, 0.3)',
                transform: `scale(${card1Spring})`,
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.06)',
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                    🚨 CRITICAL STOCKOUT PREDICTION
                  </span>
                  <span className="text-xs text-red-400 font-mono">98% Risk</span>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">
                  Cotton Yarn 40s will run out in 3.4 days
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Stitching consumption is outpacing replenishment. Without reordering 1,200 kg by Wednesday, Loom Hall 2 will face idle downtime.
                </p>
              </div>

              <button
                className="w-full py-2 border rounded-sm text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all"
                style={{
                  background: isPoButtonClicked ? '#EF4444' : 'rgba(239, 68, 68, 0.15)',
                  color: isPoButtonClicked ? '#000000' : '#FCA5A5',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  transform: isPoButtonClicked ? 'scale(0.97)' : 'scale(1)',
                }}
              >
                <span>⚡ Auto-Generate PO to Supplier</span>
              </button>
            </div>

            {/* 2. Cash Flow & Liquidity Intelligence */}
            <div
              className="bg-[#0C0F17] border rounded-sm p-4.5 flex flex-col justify-between space-y-3"
              style={{
                borderColor: 'rgba(197, 160, 89, 0.3)',
                transform: `scale(${card2Spring})`,
                boxShadow: '0 0 20px rgba(197, 160, 89, 0.06)',
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded border border-[#C5A059]/20">
                    💡 CASHFLOW FORECAST
                  </span>
                  <span className="text-xs text-[#C5A059] font-mono">Friday Buffer</span>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">
                  PKR 485,000 Karigar Payroll Disbursal
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Projected liquidity remains solvent. Overdue recovery from Al-Baraka Trading (PKR 650,000) scheduled to settle in 48 hours.
                </p>
              </div>

              <button
                className="w-full py-2 border rounded-sm text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all"
                style={{
                  background: isLiquidityClicked ? '#C5A059' : 'rgba(197, 160, 89, 0.15)',
                  color: isLiquidityClicked ? '#000000' : '#C5A059',
                  borderColor: 'rgba(197, 160, 89, 0.3)',
                  transform: isLiquidityClicked ? 'scale(0.97)' : 'scale(1)',
                }}
              >
                <span>📊 30-Day Liquidity Curve</span>
              </button>
            </div>

            {/* 3. Karigar Production Optimization */}
            <div
              className="bg-[#0C0F17] border rounded-sm p-4.5 flex flex-col justify-between space-y-3"
              style={{
                borderColor: 'rgba(6, 182, 212, 0.3)',
                transform: `scale(${card3Spring})`,
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.06)',
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    ✨ OPTIMIZATION SUGGESTION
                  </span>
                  <span className="text-xs text-cyan-400 font-mono">+18% Efficiency</span>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">
                  Assign Export Order #402 to Loom Hall 4
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Muhammad Akram and Ghulam Mustafa have 0.2% defect rates on Twill 60s weave. Assigning them ensures zero export rejections.
                </p>
              </div>

              <button className="w-full py-2 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-bold rounded-sm flex items-center justify-center gap-1.5">
                <span>✓ Apply Capacity Allocation</span>
              </button>
            </div>
          </div>

        </div>
      </NoxisWindowFrame>

      {/* Windows 11 Native Cursor (Screen Level) */}
      <Windows11Cursor waypoints={FORESIGHT_WAYPOINTS} />

      {/* Customer Pitch HUD */}
      <PitchHUD
        badge="04 · MACHINE INTELLIGENCE"
        title="FORESIGHT A.I. · PREVENT FACTORY DOWNTIME & LIQUIDITY CRUNCH"
        explanation="Autonomous machine learning runs 100% locally on your computer, analyzing stitching speed to alert purchasing managers days before raw materials run dry."
        roiPoints={['Zero Machine Idle Time', 'Automated Supplier POs', 'Accurate Cash Planning']}
        accentColor="#06B6D4"
      />
    </AbsoluteFill>
  )
}
