import React from 'react'
import {
  AbsoluteFill,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from 'remotion'
import { NoxisLogo } from '../components/NoxisLogo'

export const NoxisShort: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // 6 Condensed Acts (90 frames each = 3 seconds each = 540 frames / 18 seconds)
  // Act 1: 0 - 90 frames: Brand Hook & Power Cut Recovery
  // Act 2: 90 - 180 frames: The Real Dashboard (Cyber Cyan & Metrics)
  // Act 3: 180 - 270 frames: Foresight AI & Neural Intelligence
  // Act 4: 270 - 360 frames: Universal Multi-Theme Engine
  // Act 5: 360 - 450 frames: Local Mobile Direct Sync
  // Act 6: 450 - 540 frames: CTA & Outro

  const actIndex = Math.min(5, Math.floor(frame / 90))
  const actFrame = frame % 90

  const actScale = spring({
    frame: actFrame,
    fps,
    config: { damping: 14, stiffness: 220, mass: 0.65 },
  })

  return (
    <AbsoluteFill className="bg-[#050709] text-white flex flex-col justify-between p-12 overflow-hidden font-sans select-none">
      {/* Top Header Strip with Official Noxis Logo */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6 z-20">
        <NoxisLogo size={42} showWordmark={true} wordmarkSize={20} glow={true} />
        <span className="text-sm font-mono font-bold px-3 py-1 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-400/30">
          100% OFFLINE ERP
        </span>
      </div>

      {/* ── Main Dynamic Center Stage ── */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 text-center">
        {/* ACT 1: Power Cut Hook */}
        {actIndex === 0 && (
          <div style={{ transform: `scale(${actScale})` }} className="space-y-6 max-w-xl">
            <span className="text-6xl animate-bounce inline-block">⚡</span>
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#F59E0B] tracking-widest uppercase">
                ZERO DATA LOSS ARCHITECTURE
              </span>
              <h2 className="text-5xl font-black font-mono leading-tight uppercase">
                Power cut in your factory?
              </h2>
            </div>
            <div className="bg-[#1C150A] border-2 border-[#F59E0B] p-6 rounded-xl text-left font-mono space-y-2">
              <span className="text-xs text-[#F59E0B] font-bold">● DRAFT AUTO-RECOVERED (47m ago)</span>
              <p className="text-xl font-bold text-white">Cart Restored: PKR 15,000</p>
              <p className="text-xs text-gray-400">Your business never stops running.</p>
            </div>
          </div>
        )}

        {/* ACT 2: Authentic Dashboard */}
        {actIndex === 1 && (
          <div style={{ transform: `scale(${actScale})` }} className="space-y-6 w-full max-w-xl">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-cyan-400 tracking-widest uppercase">
                NOXIS CORE v13.0.0
              </span>
              <h2 className="text-4xl font-black font-mono uppercase">
                Industrial Dashboard
              </h2>
            </div>
            <div className="bg-[#0B0E14] border border-cyan-500/30 p-6 rounded-xl text-left space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-gray-400">REVENUE THIS MONTH</span>
                <span className="text-cyan-400 font-mono text-xs font-bold">LIVE SYNC</span>
              </div>
              <p className="text-5xl font-black text-cyan-400 font-mono">PKR 14,600</p>
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 font-mono">
                Overdue Receivables: PKR 12,513.82 (7 Customers)
              </div>
            </div>
          </div>
        )}

        {/* ACT 3: Foresight AI */}
        {actIndex === 2 && (
          <div style={{ transform: `scale(${actScale})` }} className="space-y-6 w-full max-w-xl">
            <span className="text-6xl inline-block">🧠</span>
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-cyan-400 tracking-widest uppercase">
                AUTONOMOUS MACHINE INTELLIGENCE
              </span>
              <h2 className="text-4xl font-black font-mono uppercase">
                Foresight AI Engine
              </h2>
            </div>
            <div className="bg-[#0D121C] border border-cyan-500/30 p-6 rounded-xl text-left space-y-3 font-mono">
              <span className="text-xs text-red-400 font-bold">🚨 PREDICTIVE ALERT</span>
              <p className="text-lg font-bold text-white">
                Cotton 40s yarn will deplete in 3.4 days
              </p>
              <p className="text-xs text-gray-400">
                Auto-generates purchase orders to keep looms spinning without human delay.
              </p>
            </div>
          </div>
        )}

        {/* ACT 4: Multi-Theme Engine */}
        {actIndex === 3 && (
          <div style={{ transform: `scale(${actScale})` }} className="space-y-6 w-full max-w-xl">
            <span className="text-6xl inline-block">🎨</span>
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#C5A059] tracking-widest uppercase">
                UNIVERSAL ADAPTIVE SHELL
              </span>
              <h2 className="text-4xl font-black font-mono uppercase">
                23 Industrial Themes
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-4 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4] text-[#06B6D4] font-bold">
                Cyber Cyan
              </div>
              <div className="p-4 rounded-lg bg-[#C5A059]/10 border border-[#C5A059] text-[#C5A059] font-bold">
                Textile Gold
              </div>
              <div className="p-4 rounded-lg bg-[#10B981]/10 border border-[#10B981] text-[#10B981] font-bold">
                Emerald Forge
              </div>
              <div className="p-4 rounded-lg bg-[#60A5FA]/10 border border-[#60A5FA] text-[#60A5FA] font-bold">
                Industrial Slate
              </div>
            </div>
          </div>
        )}

        {/* ACT 5: Local Mobile Direct Sync */}
        {actIndex === 4 && (
          <div style={{ transform: `scale(${actScale})` }} className="space-y-6 w-full max-w-xl">
            <span className="text-6xl inline-block">📱</span>
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400 tracking-widest uppercase">
                ZERO CLOUD LATENCY
              </span>
              <h2 className="text-4xl font-black font-mono uppercase">
                Phone & PC Mesh Sync
              </h2>
            </div>
            <div className="bg-[#0C1217] border border-emerald-500/30 p-6 rounded-xl font-mono space-y-2 text-left">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Karigar Biometric Sync</span>
                <span className="text-emerald-400 font-bold">WiFi Direct Active</span>
              </div>
              <p className="text-2xl font-black text-white">88/102 Karigars Present</p>
              <p className="text-xs text-gray-500">Instant offline peer-to-peer replication</p>
            </div>
          </div>
        )}

        {/* ACT 6: Final CTA */}
        {actIndex === 5 && (
          <div style={{ transform: `scale(${actScale})` }} className="space-y-6">
            <NoxisLogo size={88} showWordmark={false} glow={true} />
            <div className="space-y-2">
              <h1 className="text-5xl font-black font-mono tracking-widest uppercase">
                NOXIS HUB
              </h1>
              <p className="text-xs font-mono text-gray-400 tracking-[0.2em] uppercase">
                INDUSTRIAL OS FOR PAKISTAN & UAE
              </p>
            </div>
            <div className="bg-cyan-500/10 border-2 border-cyan-400 p-5 rounded-xl font-mono font-bold text-cyan-300 text-xl tracking-wider">
              ✦ noxishub.app
            </div>
            <p className="text-xs text-gray-500 font-mono">
              Free 14-Day Full Elite Trial · Engineered by Omnora Labs
            </p>
          </div>
        )}
      </div>

      {/* Progress Line */}
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden z-20">
        <div
          className="h-full bg-cyan-400 transition-all"
          style={{ width: `${(frame / 540) * 100}%` }}
        />
      </div>
    </AbsoluteFill>
  )
}
