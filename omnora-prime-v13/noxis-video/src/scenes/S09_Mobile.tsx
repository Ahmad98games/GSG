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

export const S09_Mobile: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const f = frame - from

  const tapFrame = 42

  // Packet animation from phone to PC
  const packetProgress = interpolate(f, [tapFrame, tapFrame + 16], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  })

  const packetX = interpolate(packetProgress, [0, 1], [1788, 650])
  const packetY = interpolate(packetProgress, [0, 0.5, 1], [485, 260, 260])

  // Count increments precisely on frame tapFrame + 2 (87 -> 88)
  const counterValue = f >= tapFrame + 2 ? 88 : 87

  // Toast notification on PC
  const showToast = f >= tapFrame + 4
  const toastSpring = spring({
    frame: f - (tapFrame + 4),
    fps,
    config: { damping: 14, stiffness: 220, mass: 0.6 },
  })

  // Windows 11 Cursor Waypoints
  const waypoints: CursorWaypoint[] = [
    { frame: 0, x: 1720, y: 380, type: 'pointer' },
    { frame: 25, x: 1788, y: 485, type: 'pointer', label: 'Floor Supervisor Tap' },
    { frame: tapFrame, x: 1788, y: 485, type: 'pointer', click: true, label: 'Marked Aslam Khan ✓' },
    { frame: 60, x: 1788, y: 485, type: 'pointer' },
    { frame: 95, x: 750, y: 620, type: 'arrow', label: 'Mesh Toast Acknowledged' },
    { frame: 120, x: 750, y: 620, type: 'arrow' },
  ]

  return (
    <AbsoluteFill className="bg-[#060708]">
      <NoxisWindowFrame pageTitle="LOCAL DEVICE PAIRING & SYNC" activeThemeAccent="#06B6D4">
        {/* PC Hub UI (70% width) */}
        <div className="flex-1 flex overflow-hidden border-r border-white/[0.08] relative">
          <NoxisSidebar activeId="pairing" accentColor="#06B6D4" />

          <div className="flex-1 p-6 space-y-5 flex flex-col justify-between font-sans pb-20">
            <div>
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📱</span>
                  <h2 className="text-base font-bold text-white font-mono">
                    Noxis Station Node · Floor Hub #01
                  </h2>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>WiFi Direct Active · Zero Cloud Required</span>
                </div>
              </div>

              {/* Attendance count card */}
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="bg-[#0C1017] border border-cyan-500/30 p-5 rounded-lg space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
                    LIVE FLOOR ATTENDANCE
                  </span>
                  <p className="text-4xl font-black text-cyan-400 font-mono transition-all">
                    {counterValue} / 102 Present
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono">
                    Real-time SQLite replication across mobile terminals
                  </p>
                </div>

                <div className="bg-[#0C1017] border border-white/[0.06] p-5 rounded-lg space-y-2 font-mono">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    PAIRED MOBILE COMPANIONS
                  </span>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-gray-300">
                      <span>Supervisor Samsung A54</span>
                      <span className="text-emerald-400 font-bold">Synced (0.4s)</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Floor Tab Xiaomi Pad 6</span>
                      <span className="text-emerald-400 font-bold">Synced (1.1s)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sync toast notification */}
            {showToast && (
              <div
                className="bg-[#0F1420] border border-cyan-400/50 rounded p-3 flex items-center justify-between font-mono text-xs shadow-xl"
                style={{ transform: `scale(${toastSpring})` }}
              >
                <div className="flex items-center gap-2 text-white">
                  <span className="text-cyan-400">📲</span>
                  <span>Karigar #104 Aslam Khan marked Present via Mobile App</span>
                </div>
                <span className="text-[10px] text-cyan-400 font-bold">
                  LOCAL MESH SYNCED ✓
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Smartphone Companion Mockup (30% width) */}
        <div className="w-[420px] bg-[#050608] flex items-center justify-center p-6 select-none shrink-0 pb-20">
          <div className="w-[280px] h-[480px] bg-[#0A0D14] border-2 border-white/20 rounded-[32px] p-3.5 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            {/* Phone notch */}
            <div className="w-24 h-4 bg-black rounded-b-xl mx-auto -mt-3.5 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-white/10" />
            </div>

            {/* Phone header */}
            <div className="pt-2 px-1 border-b border-white/[0.08] pb-2 flex items-center justify-between font-mono">
              <span className="text-[10px] font-bold text-white">NOXIS MOBILE</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Hub Connected
              </span>
            </div>

            {/* Phone Karigar rows */}
            <div className="space-y-1.5 py-2 font-mono flex-1 overflow-hidden">
              {[
                { name: 'Muhammad Akram', code: 'K-101', done: true },
                { name: 'Rasheed Ahmed', code: 'K-102', done: true },
                { name: 'Ghulam Mustafa', code: 'K-103', done: true },
                { name: 'Aslam Khan', code: 'K-104', done: f >= 42 },
                { name: 'Allah Ditta', code: 'K-105', done: false },
              ].map((row) => (
                <div
                  key={row.code}
                  className="bg-[#111622] p-2 rounded flex items-center justify-between text-[10px]"
                >
                  <span className="text-gray-300 font-bold truncate max-w-[120px]">
                    {row.name}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded font-black text-[9px] transition-all"
                    style={{
                      background: row.done ? '#10B981' : 'rgba(255,255,255,0.06)',
                      color: row.done ? '#000000' : '#9CA3AF',
                    }}
                  >
                    {row.done ? 'PRESENT ✓' : 'TAP'}
                  </span>
                </div>
              ))}
            </div>

            {/* Phone status bar */}
            <div className="p-2 rounded bg-black/40 border border-white/[0.06] text-center font-mono">
              <span className="text-[8px] text-gray-400">
                AES-256 Encrypted LAN Sync · 0ms Cloud Latency
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Tap Ripple Overlay */}
        {f >= tapFrame && f <= tapFrame + 24 && (
          <div
            className="absolute z-50 pointer-events-none rounded-full border-2 border-emerald-400"
            style={{
              left: 1788,
              top: 485,
              transform: 'translate(-50%, -50%)',
              width: `${(f - tapFrame) * 3 + 20}px`,
              height: `${(f - tapFrame) * 3 + 20}px`,
              opacity: Math.max(0, 1 - (f - tapFrame) / 24),
              boxShadow: '0 0 16px #10B981, inset 0 0 8px #10B981',
            }}
          />
        )}

        {/* Animated Flying Packet Dot */}
        {f >= tapFrame && f <= tapFrame + 16 && (
          <div
            className="absolute w-3.5 h-3.5 rounded-full bg-cyan-400 z-50 pointer-events-none"
            style={{
              left: packetX,
              top: packetY,
              boxShadow: '0 0 15px #06B6D4, 0 0 30px #06B6D4',
            }}
          />
        )}
      </NoxisWindowFrame>

      {/* Windows 11 Precision Cursor (Screen Level) */}
      <Windows11Cursor waypoints={waypoints} />


      {/* Customer Pitch HUD */}
      <PitchHUD
        badge="09 · LOCAL MESH SYNC"
        title="PEER-TO-PEER MOBILE COMPANION · ZERO INTERNET DEPENDENCY"
        explanation="Factory floor managers log weights, piece-rate shifts, and stock dispatches from budget Android phones over local WiFi mesh with zero cloud bills."
        roiPoints={['Zero Mobile Cloud Subscriptions', 'Encrypted LAN Mesh', 'Instant Master Hub Update']}
        accentColor="#06B6D4"
      />
    </AbsoluteFill>
  )
}
