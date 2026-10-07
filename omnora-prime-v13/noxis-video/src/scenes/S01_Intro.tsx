import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion'
import { NoxisLogo } from '../components/NoxisLogo'
import { PitchHUD } from '../components/PitchHUD'

export const S01_Intro: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const f = frame - from

  const logoScale = spring({
    frame: f,
    fps,
    config: {
      damping: 12,
      stiffness: 170,
      mass: 0.8,
    },
  })

  const titleOpacity = interpolate(f, [15, 30], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const subtitleOpacity = interpolate(f, [30, 45], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const taglineOpacity = interpolate(f, [45, 60], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const gradientProgress = interpolate(f, [0, 60], [0, 1], {
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill className="bg-[#050709] text-white flex flex-col justify-center items-center overflow-hidden font-sans">
      {/* Background Mesh */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 50% 45%, rgba(6, 182, 212, ${gradientProgress * 0.18}) 0%, transparent 60%),
            radial-gradient(circle at 20% 80%, rgba(197, 160, 89, ${gradientProgress * 0.1}) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(16, 185, 129, ${gradientProgress * 0.1}) 0%, transparent 50%)
          `,
        }}
      />

      {/* Grid Lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          opacity: gradientProgress * 0.8,
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 -mt-10">
        {/* Official Noxis Logo Icon */}
        <div
          style={{
            transform: `scale(${logoScale})`,
          }}
          className="relative"
        >
          <div className="w-32 h-32 rounded-2xl bg-white/[0.04] border border-white/10 p-5 shadow-2xl flex items-center justify-center relative backdrop-blur-md">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/25 to-gold/25 blur-xl opacity-75" />
            <NoxisLogo size={92} showWordmark={false} glow={true} />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2" style={{ opacity: titleOpacity }}>
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-6xl font-black font-mono tracking-[0.25em] text-white uppercase">
              NOXIS
            </h1>
            <span className="text-6xl font-black font-mono tracking-[0.18em] text-cyan-400 uppercase">
              HUB
            </span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-mono font-bold tracking-[0.3em] uppercase text-gray-300">
              INDUSTRIAL OS FOR FACTORIES & RETAIL
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              v13.0.0 CORE
            </span>
          </div>
        </div>

        {/* Subtitle */}
        <div style={{ opacity: subtitleOpacity }} className="text-center max-w-2xl">
          <p className="text-base text-gray-300 font-medium leading-relaxed">
            The offline-first enterprise software designed specifically for manufacturing plants, textile mills, wholesale distributors, and multi-counter retail in Pakistan & UAE.
          </p>
        </div>

        {/* Core Pillars */}
        <div style={{ opacity: taglineOpacity }} className="flex items-center gap-3 mt-1">
          {[
            { label: '100% OFFLINE FIRST', color: '#10B981', icon: '⚡' },
            { label: 'FORESIGHT A.I.', color: '#06B6D4', icon: '🧠' },
            { label: 'POWER CUT SAFE', color: '#F59E0B', icon: '🛡️' },
            { label: 'FBR E-INVOICING', color: '#C5A059', icon: '📄' },
            { label: 'LOCAL MOBILE SYNC', color: '#60A5FA', icon: '📱' },
          ].map((tag) => (
            <div
              key={tag.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono font-bold tracking-wider"
              style={{
                color: tag.color,
                background: `${tag.color}14`,
                border: `1px solid ${tag.color}35`,
              }}
            >
              <span>{tag.icon}</span>
              <span>{tag.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Explainer HUD */}
      <PitchHUD
        badge="01 · EXECUTIVE ARCHITECTURE"
        title="ZERO CLOUD LOCK-IN · RUNS COMPLETELY ON LOCAL HARDWARE"
        explanation="Unlike fragile web apps that crash during internet drops or load-shedding, Noxis Hub runs directly on your local workstation with embedded SQLite WAL replication."
        roiPoints={['Zero Monthly Subscriptions', '100% Data Sovereignty', 'Instant Millisecond Latency']}
        accentColor="#06B6D4"
      />
    </AbsoluteFill>
  )
}
