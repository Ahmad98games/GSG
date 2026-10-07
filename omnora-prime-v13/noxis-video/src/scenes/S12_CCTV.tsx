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

const CAMERAS = [
  { id: 'CAM-01', name: 'Main POS Counter #01', fps: '25 fps', status: 'LIVE' },
  { id: 'CAM-02', name: 'Loom Hall Floor & Stitching', fps: '30 fps', status: 'LIVE' },
  { id: 'CAM-03', name: 'Factory Gate & Weighbridge', fps: '25 fps', status: 'LIVE' },
  { id: 'CAM-04', name: 'Finished Fabric Warehouse', fps: '30 fps', status: 'LIVE' },
]

export const S12_CCTV: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const f = frame - from

  // Linking line animation at frame 35
  const linkProgress = interpolate(f, [35, 55], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  })

  // Gold badge spring
  const badgeSpring = spring({
    frame: f - 50,
    fps,
    config: { damping: 14, stiffness: 220, mass: 0.7 },
  })

  // Windows 11 Cursor Waypoints
  const waypoints: CursorWaypoint[] = [
    { frame: from + 15, x: 500, y: 240, type: 'arrow' },
    { frame: from + 45, x: 1736, y: 760, type: 'pointer', label: 'Play Synchronized Clip' },
    { frame: from + 68, x: 1736, y: 760, type: 'pointer', click: true, label: 'Playing DVR Match ✓' },
    { frame: from + 90, x: 1736, y: 760, type: 'pointer' },
    { frame: from + 120, x: 550, y: 320, type: 'arrow', label: 'Surveillance Verified' },
  ]

  return (
    <AbsoluteFill className="bg-[#060708]">
      <NoxisWindowFrame pageTitle="CCTV FEEDS & TRANSACTION AUDIT" activeThemeAccent="#C5A059">
        <NoxisSidebar activeId="cctv" accentColor="#C5A059" />

        <div className="flex-1 flex overflow-hidden p-6 gap-6 font-sans pb-20 relative">
          {/* 2x2 Camera Grid */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            {CAMERAS.map((cam, idx) => {
              const isLinked = idx === 0 && f >= 50

              return (
                <div
                  key={cam.id}
                  className="bg-[#0A0D14] rounded-lg p-3 border flex flex-col justify-between relative overflow-hidden transition-all"
                  style={{
                    borderColor: isLinked ? '#C5A059' : 'rgba(255, 255, 255, 0.08)',
                    boxShadow: isLinked ? '0 0 30px rgba(197, 160, 89, 0.3)' : 'none',
                  }}
                >
                  {/* Camera Header */}
                  <div className="flex items-center justify-between text-xs font-mono z-10">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-white font-bold">{cam.id}: {cam.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">{cam.fps}</span>
                  </div>

                  {/* Simulated Camera Feed Backdrop */}
                  <div className="flex-1 flex items-center justify-center my-2 rounded bg-black/40 border border-white/[0.04] relative">
                    <div className="text-center font-mono space-y-1">
                      <span className="text-2xl text-gray-600">📹</span>
                      <p className="text-[10px] text-gray-500">RTSP Stream 1080p · Local NVR Linked</p>
                    </div>

                    {/* Linked badge on Cam 01 */}
                    {isLinked && (
                      <div
                        className="absolute bottom-3 right-3 px-3 py-1 rounded bg-[#C5A059] text-black font-mono font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5"
                        style={{ transform: `scale(${badgeSpring})` }}
                      >
                        <span>🔒</span>
                        <span>DVR FOOTAGE LINKED</span>
                      </div>
                    )}
                  </div>

                  {/* Camera Footer */}
                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 z-10">
                    <span>H.265 Hardware Acceleration</span>
                    <span className="text-emerald-400">0 dropped frames</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right: Active Invoice Transaction Card */}
          <div className="w-80 bg-[#0C0F17] border border-white/[0.08] rounded-lg p-5 flex flex-col justify-between font-mono">
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                ACTIVE AUDIT RECORD
              </span>

              <div className="p-3.5 rounded bg-[#101522] border border-cyan-500/30 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white font-bold">INV-000089</span>
                  <span className="text-emerald-400 font-bold">PKR 17,500</span>
                </div>
                <p className="text-[10px] text-gray-400">Counter Terminal #01 · Cash Payment</p>
                <div className="text-[9px] text-cyan-300 bg-cyan-500/10 p-1.5 rounded">
                  Cash Drawer Opened: 17:19:42 PKT
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-300">
                <div className="flex justify-between">
                  <span>Linked Camera:</span>
                  <span className="text-[#C5A059] font-bold">CAM-01 (POS Counter)</span>
                </div>
                <div className="flex justify-between">
                  <span>Footage Timecode:</span>
                  <span className="text-white font-bold">17:19:35 - 17:20:05</span>
                </div>
                <div className="flex justify-between">
                  <span>Tamper Proof:</span>
                  <span className="text-emerald-400 font-bold">SHA-256 Validated</span>
                </div>
              </div>
            </div>

            <button
              className="w-full py-2.5 rounded border font-bold text-xs uppercase tracking-wider transition-all"
              style={{
                background: f >= 68 && f <= 80 ? '#C5A059' : 'rgba(197, 160, 89, 0.15)',
                color: f >= 68 && f <= 80 ? '#000000' : '#C5A059',
                borderColor: 'rgba(197, 160, 89, 0.4)',
                transform: f >= 68 && f <= 80 ? 'scale(0.97)' : 'scale(1)',
              }}
            >
              <span>{f >= 72 ? '✓ Playing Synchronized Clip' : '▶ Play Synchronized Video Clip'}</span>
            </button>
          </div>

          {/* Animated Linking Laser Line */}
          {f >= 35 && (
            <svg className="absolute inset-0 pointer-events-none z-30 w-full h-full">
              <line
                x1="1400"
                y1="220"
                x2={1400 - (1400 - 680) * linkProgress}
                y2={220 + (160 - 220) * linkProgress}
                stroke="#C5A059"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />
            </svg>
          )}

        </div>
      </NoxisWindowFrame>

      {/* Windows 11 Precision Cursor (Screen Level) */}
      <Windows11Cursor waypoints={waypoints} />


      {/* Customer Pitch HUD */}
      <PitchHUD
        badge="12 · THEFT & AUDIT PROOF"
        title="CCTV TRANSACTION DVR LINKING · VIDEO PROOF FOR EVERY CASH TENDER"
        explanation="Every time a cashier completes a sale, processes a discount, or opens the cash drawer, Noxis automatically tags the exact surveillance footage clip for 1-click audit review."
        roiPoints={['Zero Cashier Shrinkage', '1-Click Dispute Playback', 'Local ONVIF / RTSP Support']}
        accentColor="#C5A059"
      />
    </AbsoluteFill>
  )
}
