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

export const S11_AutoUpdate: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const f = frame - from

  // Download progress
  const downloadProgress = interpolate(f, [20, 80], [0, 100], {
    extrapolateRight: 'clamp',
  })

  // Verified card spring
  const verifiedSpring = spring({
    frame: f - 80,
    fps,
    config: { damping: 14, stiffness: 220, mass: 0.7 },
  })

  // Restart blink
  const isRestarting = f >= 135

  // Windows 11 Cursor Waypoints
  const waypoints: CursorWaypoint[] = [
    { frame: 60, x: 800, y: 350, type: 'arrow' },
    { frame: 100, x: 1760, y: 965, type: 'pointer', label: 'APPLY & RESTART [CTRL+R]' },
    { frame: 122, x: 1760, y: 965, type: 'pointer', click: true, label: 'Patch Applied ✓', tooltipPlacement: 'above-button' },
    { frame: 134, x: 1760, y: 965, type: 'pointer' },
  ]

  return (
    <AbsoluteFill className="bg-[#060708]">
      <NoxisWindowFrame pageTitle="SYSTEM SETTINGS · OVER-THE-AIR UPDATES" activeThemeAccent="#06B6D4">
        <NoxisSidebar activeId="settings" accentColor="#06B6D4" />

        <div className="flex-1 flex flex-col overflow-y-auto p-7 space-y-5 font-sans relative pb-20">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-xl">⚡</span>
                <h2 className="text-lg font-bold text-white font-mono tracking-wide">
                  NOXIS RESILIENT AUTO-UPDATE ENGINE (OTA)
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm bg-cyan-400/10 text-cyan-400 border border-cyan-400/30">
                  ZERO DOWNTIME
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Silent differential delta downloading with cryptographic SHA-256 verification and power-cut resume.
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-bold">OTA Server Synced</span>
            </div>
          </div>

          {/* Update Channel & Current Version */}
          <div className="grid grid-cols-3 gap-4 font-mono">
            <div className="bg-[#0B0E14] border border-white/[0.06] p-4 rounded-sm">
              <span className="text-[10px] text-gray-500 uppercase">INSTALLED VERSION</span>
              <p className="text-lg font-bold text-white mt-1">v13.0.0 (Core Engine)</p>
              <span className="text-[9px] text-emerald-400">Active Stable Branch</span>
            </div>

            <div className="bg-[#0B0E14] border border-cyan-500/20 p-4 rounded-sm">
              <span className="text-[10px] text-gray-500 uppercase">LATEST DELTA RELEASE</span>
              <p className="text-lg font-bold text-cyan-400 mt-1">v13.0.7 (Patch Release)</p>
              <span className="text-[9px] text-gray-400">Universal Theme System</span>
            </div>

            <div className="bg-[#0B0E14] border border-white/[0.06] p-4 rounded-sm">
              <span className="text-[10px] text-gray-500 uppercase">DATABASE INTEGRITY</span>
              <p className="text-lg font-bold text-emerald-400 mt-1">SQLite WAL Verified</p>
              <span className="text-[9px] text-gray-500">Auto-migration ready</span>
            </div>
          </div>

          {/* Download & Verification Pipeline */}
          <div className="bg-[#0B0E15] border border-white/[0.08] rounded-lg p-5 space-y-4 font-mono flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 animate-spin">🔄</span>
                  <span className="text-white font-bold">
                    {downloadProgress < 100
                      ? 'Downloading Differential Delta Patch...'
                      : 'Cryptographic Checksum & Schema Verified'}
                  </span>
                </div>
                <span className="text-cyan-400 font-bold">{Math.round(downloadProgress)}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-gray-500">
                <span>Transferred: {Math.round((downloadProgress / 100) * 18.2)} MB / 18.2 MB</span>
                <span>Transfer Rate: 8.4 MB/s · Resumable</span>
              </div>
            </div>

            {/* Checksum & Integrity Badge */}
            <div
              className="p-3.5 rounded bg-[#070A0F] border border-emerald-500/30 flex items-center justify-between"
              style={{ transform: `scale(${verifiedSpring})` }}
            >
              <div className="space-y-0.5 text-[11px]">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span>✓</span>
                  <span>SHA-256 Signatures Validated</span>
                </div>
                <p className="text-[9px] text-gray-400 font-mono">
                  All 23 visual themes, POS schemas, and Karigar models ready for zero-downtime hot reload.
                </p>
              </div>

                <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Delta Checksum Verified
                </span>
              </div>
            </div>

          {/* Restart Flash Overlay */}
          {isRestarting && (
            <div className="absolute inset-0 bg-[#060708] flex items-center justify-center z-50">
              <div className="text-center space-y-2 font-mono">
                <span className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin inline-block" />
                <p className="text-sm font-bold text-white">Seamless Hot Reload Complete (0.12s)</p>
                <p className="text-[10px] text-cyan-400">Zero data loss · Running v13.0.7</p>
              </div>
            </div>
          )}

        </div>
      </NoxisWindowFrame>

      {/* Action button strictly centered at exact screen x: 1760, y: 965 */}
      <div
        className="absolute z-30"
        style={{
          left: 1760,
          top: 965,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <button
          className="px-6 py-2.5 rounded font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xl transition-all font-mono whitespace-nowrap"
          style={{
            background: f >= 122 && f <= 134 ? '#059669' : '#10B981',
            color: '#000000',
            transform: f >= 122 && f <= 134 ? 'scale(0.96)' : 'scale(1)',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
          }}
        >
          <span>⚡</span>
          <span>APPLY & RESTART [CTRL+R]</span>
        </button>
      </div>

      {/* Windows 11 Precision Cursor (Screen Level) */}
      {f >= 60 && f < 135 && <Windows11Cursor waypoints={waypoints} />}


      {/* Customer Pitch HUD */}
      <PitchHUD
        badge="11 · CONTINUOUS EVOLUTION"
        title="ZERO-DOWNTIME DELTA UPDATES · RESUMES SEAMLESSLY IF POWER TRIPS"
        explanation="Download minor patches and new features quietly in the background. If the internet cuts mid-download, it resumes automatically without starting over."
        roiPoints={['Zero Operation Disruption', 'Cryptographic SHA-256 Integrity', 'Automatic Schema Migration']}
        accentColor="#06B6D4"
      />
    </AbsoluteFill>
  )
}
