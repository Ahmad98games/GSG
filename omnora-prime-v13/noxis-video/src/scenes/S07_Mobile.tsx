import React from 'react'
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from 'remotion'

export const S07_Mobile: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame()
  const f = Math.max(0, frame - from)

  // Supervisor marks 4th karigar at frame 60
  const isFourthMarked = f >= 60

  // Packet animation from frame 70 to 80 (Phone right X: 1550 -> PC left X: 520)
  const packetProgress = interpolate(f, [70, 80], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  })
  const showPacket = f >= 70 && f <= 81
  const packetX = interpolate(packetProgress, [0, 1], [1500, 500])
  const packetY = interpolate(
    packetProgress,
    [0, 0.5, 1],
    [520, 360, 260]
  )

  // PC counter updates at frame 80
  const pcCount = f >= 80 ? '88/102' : '87/102'

  // Toast appears at frame 85
  const toastOpacity = interpolate(f, [85, 95], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  })

  return (
    <AbsoluteFill className="flex flex-row" style={{ background: '#060708' }}>
      {/* LEFT: PC Hub Dashboard (70%) */}
      <div
        className="w-[70%] h-full p-8 border-r flex flex-col justify-between"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div>
          <div className="flex items-center justify-between pb-5 border-b border-white/6 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-white">
                  Noxis Master Station
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Local Mesh Hub
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                Workstation IP: 192.168.1.45:3000 · Peer ID: #HUB-01
              </p>
            </div>

            <div className="flex items-center gap-2 bg-[#0F1114] px-3 py-1.5 rounded-sm border border-white/8 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-bold">4 Mobile Handsets Linked</span>
            </div>
          </div>

          {/* Realtime KPI card on PC */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#0F1114] border border-white/7 rounded-sm p-5 border-l-4 border-l-[#10B981] shadow-lg">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Floor Workers Present Today
              </p>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-4xl font-black font-mono text-[#10B981]">
                  {pcCount}
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  {f >= 80 ? '+1 synced via Wi-Fi' : 'Sync Active'}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Zero Cloud Reliance · 100% Local Subnet
              </p>
            </div>

            <div className="bg-[#0F1114] border border-white/7 rounded-sm p-5 border-l-4 border-l-[#60A5FA] shadow-lg">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Live Subnet Ping
              </p>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-4xl font-black font-mono text-[#60A5FA]">
                  &lt;1 ms
                </span>
                <span className="text-xs font-mono text-cyan-400">
                  Zero Packet Drop
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Direct TCP Sockets · Instant Event Dispatch
              </p>
            </div>
          </div>
        </div>

        {/* Sync Toast at bottom left */}
        <div
          className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-sm flex items-center justify-between shadow-2xl transition-opacity"
          style={{ opacity: toastOpacity }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📱</span>
            <div>
              <p className="text-xs font-bold text-white">
                Worker Attendance Auto-Synced
              </p>
              <p className="text-[10px] text-emerald-400 font-mono">
                Device: Samsung A14 (Supervisor Aslam) · Event #4892 Verified
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-gray-400">Just now</span>
        </div>
      </div>

      {/* Trajectory Data Packet Dot */}
      {showPacket && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            left: packetX,
            top: packetY,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-5 h-5 rounded-full bg-cyan-400 shadow-[0_0_24px_#38bdf8] flex items-center justify-center animate-ping" />
        </div>
      )}

      {/* RIGHT: Mobile Phone Companion Mockup (30%) */}
      <div className="w-[30%] h-full flex items-center justify-center p-6 bg-[#090A0D]">
        {/* Phone Frame */}
        <div className="w-[310px] h-[610px] bg-[#0E1116] border-[6px] border-zinc-800 rounded-[36px] overflow-hidden shadow-2xl flex flex-col justify-between relative">
          {/* Top Notch / Speaker */}
          <div className="h-6 w-full flex justify-center items-center bg-black/40 pt-1">
            <div className="w-20 h-3 bg-black rounded-full" />
          </div>

          {/* Phone Header Status Bar */}
          <div className="px-4 py-2 border-b border-white/6 flex items-center justify-between text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-bold">Online — WiFi</span>
            </div>
            <span className="text-gray-500">Sync: 2s ago</span>
          </div>

          {/* App Title in Phone */}
          <div className="px-4 py-2 bg-white/[0.02]">
            <p className="text-xs font-black text-white tracking-tight">
              Floor Attendance · Handset
            </p>
            <p className="text-[9px] text-gray-500 font-mono">
              Loom Hall 04 · Shift Morning
            </p>
          </div>

          {/* Worker list in phone */}
          <div className="flex-1 px-3 py-2 space-y-1.5 overflow-hidden font-mono text-[11px]">
            {[
              { name: 'Muhammad Akram', status: 'P', marked: true },
              { name: 'Rasheed Ahmed', status: 'P', marked: true },
              { name: 'Ghulam Mustafa', status: 'P', marked: true },
              { name: 'Allah Ditta', status: isFourthMarked ? 'P' : '-', marked: isFourthMarked },
              { name: 'Fazal Rehman', status: '-', marked: false },
              { name: 'Noor Hassan', status: '-', marked: false },
              { name: 'Shaukat Ali', status: '-', marked: false },
            ].map((worker, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded bg-black/40 border border-white/5"
              >
                <span className="text-gray-200 font-sans text-xs truncate max-w-[150px]">
                  {worker.name}
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-black"
                  style={{
                    background: worker.marked ? '#10B98125' : 'rgba(255,255,255,0.05)',
                    color: worker.marked ? '#10B981' : '#6B7280',
                    border: worker.marked ? '1px solid #10B98140' : '1px solid transparent',
                  }}
                >
                  {worker.marked ? 'PRESENT' : 'MARK'}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom Navigation on Phone */}
          <div className="h-10 bg-black/60 border-t border-white/6 flex items-center justify-around text-xs text-gray-400">
            <span className="text-emerald-400 font-bold">● Scan</span>
            <span>Khata</span>
            <span>Stock</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
