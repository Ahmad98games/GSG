import React from 'react'
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion'
import { NoxisLogo } from '../components/NoxisLogo'

const PLANS = [
  {
    name: 'LITE',
    price: 'PKR 25,000',
    cycle: '/year',
    features: [
      '1 Station POS Terminal',
      'Offline Khata Ledger',
      'Thermal 80mm Printing',
      'Inventory Stock Tracking',
      'Standard WhatsApp Receipts',
    ],
    border: 'rgba(255, 255, 255, 0.1)',
    glow: 'transparent',
    badge: null,
  },
  {
    name: 'PRO',
    price: 'PKR 60,000',
    cycle: '/year',
    features: [
      '3 Connected Floor Terminals',
      'Foresight AI Engine (Standard)',
      'FBR Tier-1 POS & Tax Invoicing',
      'Karigar Piece-Rate Production',
      'WiFi Direct Mobile Sync',
      'Universal Theme Switcher',
      'Power Cut Instant Recovery',
    ],
    border: '#06B6D4',
    glow: 'rgba(6, 182, 212, 0.25)',
    badge: 'MOST POPULAR',
  },
  {
    name: 'ELITE',
    price: 'PKR 120,000',
    cycle: '/year',
    features: [
      'Unlimited Station Nodes',
      'Full Neural Intelligence Engine',
      'File Morph & Migration Studio',
      'Multi-Branch Khata Consolidation',
      'CCTV Transaction Linking',
      'Automated FBR Compliance Seal',
      'Priority 24/7 Engineer Support',
    ],
    border: '#C5A059',
    glow: 'rgba(197, 160, 89, 0.25)',
    badge: 'ENTERPRISE',
  },
]

export const S12_Pricing: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const f = frame - from

  // Plans appear with spring stagger
  const plan0Spring = spring({
    frame: f - 5,
    fps,
    config: { damping: 14, stiffness: 200, mass: 0.7 },
  })
  const plan1Spring = spring({
    frame: f - 15,
    fps,
    config: { damping: 14, stiffness: 200, mass: 0.7 },
  })
  const plan2Spring = spring({
    frame: f - 25,
    fps,
    config: { damping: 14, stiffness: 200, mass: 0.7 },
  })

  // Outro transition at frame 115
  const showOutro = f >= 115
  const outroOpacity = interpolate(f, [115, 135], [0, 1], {
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill className="bg-[#050709] text-white flex flex-col justify-center items-center overflow-hidden font-sans">
      {/* Dynamic Background Mesh */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.12) 0%, transparent 60%),
            radial-gradient(circle at 20% 80%, rgba(197, 160, 89, 0.08) 0%, transparent 50%)
          `,
        }}
      />

      {/* ── Plans View (f < 115) ── */}
      {!showOutro && (
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-6xl px-8">
          <div className="text-center space-y-1">
            <h2 className="text-3xl font-black font-mono tracking-wider text-white uppercase">
              TRANSPARENT INDUSTRIAL LICENSING
            </h2>
            <p className="text-xs text-gray-400 font-mono">
              Zero cloud subscription traps. Hardware-bound offline activation keys.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 w-full items-stretch">
            {PLANS.map((plan, idx) => {
              const currentSpring = [plan0Spring, plan1Spring, plan2Spring][idx]
              const isPro = plan.name === 'PRO'

              return (
                <div
                  key={plan.name}
                  className="bg-[#0B0E15] border rounded-lg p-6 flex flex-col justify-between relative"
                  style={{
                    borderColor: plan.border,
                    transform: `scale(${currentSpring})`,
                    boxShadow: `0 0 35px ${plan.glow}`,
                  }}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span
                        className="px-3 py-0.5 rounded-full text-[9px] font-black font-mono tracking-widest text-black"
                        style={{
                          background: isPro ? '#06B6D4' : '#C5A059',
                        }}
                      >
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold font-mono tracking-wider text-white">
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-2xl font-black font-mono text-white">
                          {plan.price}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">{plan.cycle}</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-white/[0.06] text-xs font-mono">
                      {plan.features.map((feat) => (
                        <div key={feat} className="flex items-center gap-2 text-gray-300">
                          <span className="text-cyan-400 font-bold">✓</span>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-white/[0.06]">
                    <span className="text-[10px] font-mono text-gray-400 text-center block">
                      No credit card required · 14-day Elite Trial
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Final Outro Brand Reveal (f >= 115) ── */}
      {showOutro && (
        <div
          className="relative z-20 flex flex-col items-center justify-center gap-6 text-center"
          style={{ opacity: outroOpacity }}
        >
          {/* Logo */}
          <div className="w-28 h-28 rounded-2xl bg-white/[0.04] border border-white/10 p-5 shadow-2xl flex items-center justify-center relative backdrop-blur-md">
            <NoxisLogo size={80} showWordmark={false} glow={true} />
          </div>

          {/* Title */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-3">
              <h1 className="text-5xl font-black font-mono tracking-[0.25em] text-white uppercase">
                NOXIS
              </h1>
              <span className="text-5xl font-black font-mono tracking-[0.18em] text-cyan-400 uppercase">
                HUB
              </span>
            </div>
            <p className="text-sm font-mono tracking-[0.3em] uppercase text-gray-400">
              INDUSTRIAL OS FOR FACTORIES & RETAIL
            </p>
          </div>

          {/* Call to action & links */}
          <div className="flex flex-col items-center gap-3 font-mono">
            <div className="px-5 py-2.5 rounded-md bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 text-base font-bold tracking-wider">
              ✦ https://noxishub.app
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>WhatsApp: +92 300 0000000</span>
              <span>·</span>
              <span>Direct Deployment in Pakistan & UAE</span>
            </div>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">
              ENGINEERED BY OMNORA LABS · LAHORE
            </span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  )
}
