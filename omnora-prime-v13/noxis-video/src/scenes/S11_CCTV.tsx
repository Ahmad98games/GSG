import React from 'react'
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from 'remotion'

export const S11_CCTV: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame()
  const f = Math.max(0, frame - from)

  const isLinked = f >= 45

  // Golden glow and badge animation
  const linkOpacity = interpolate(f, [45, 55], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  })

  return (
    <AbsoluteFill className="flex flex-col justify-between" style={{ background: '#060708' }}>
      {/* Top CCTV Telemetry Bar */}
      <div
        className="h-14 px-8 border-b flex items-center justify-between bg-[#0A0C0F]"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-white font-black text-sm tracking-wide">
            Industrial MediaMTX · 4 RTSP Feeds Active
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
            H.264 / Low-Latency
          </span>
        </div>

        <div className="font-mono text-xs text-gray-400 flex items-center gap-4">
          <span>Camera FPS: 30.0</span>
          <span>Buffer: 0ms</span>
          <span className="text-emerald-400 font-bold">● Synchronized With POS</span>
        </div>
      </div>

      {/* 2x2 Camera Grid */}
      <div className="flex-1 p-6 grid grid-cols-2 grid-rows-2 gap-4 overflow-hidden relative">
        {/* CAM 01: POS Counter (Gets Linked to Invoice) */}
        <div
          className="bg-[#0B0D11] border rounded-sm relative overflow-hidden flex flex-col justify-between p-4 transition-all"
          style={{
            borderColor: isLinked ? '#C5A059' : 'rgba(255,255,255,0.08)',
            boxShadow: isLinked ? '0 0 30px rgba(197,160,89,0.35)' : 'none',
          }}
        >
          {/* Virtual camera overlay elements */}
          <div className="flex justify-between items-start z-10 text-[10px] font-mono">
            <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-bold">
              ● REC CAM-01 [POS Counter]
            </span>
            <span className="text-gray-400">06-OCT-2026 16:15:22</span>
          </div>

          {/* Camera visuals simulation */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
            <div className="text-center font-mono text-gray-500 text-xs">
              <span className="text-4xl block mb-1">🛒</span>
              CASH DESK 01 · 1080p FEED
            </div>
          </div>

          {/* Linked Badge & Timestamp Tag */}
          <div className="flex justify-between items-end z-10">
            <span className="text-[9px] text-gray-500 font-mono">
              RTSP://192.168.1.120:554/ch1
            </span>

            {isLinked && (
              <div
                className="px-3 py-1 rounded bg-[#C5A059] text-black font-black font-mono text-xs flex items-center gap-1.5 shadow-xl"
                style={{ opacity: linkOpacity }}
              >
                <span>📎 RECORDING LINKED: INV-000089</span>
              </div>
            )}
          </div>
        </div>

        {/* CAM 02: Factory Floor */}
        <div className="bg-[#0B0D11] border border-white/8 rounded-sm relative overflow-hidden flex flex-col justify-between p-4">
          <div className="flex justify-between items-start z-10 text-[10px] font-mono">
            <span className="bg-white/5 text-gray-400 px-1.5 py-0.5 rounded">
              ● CAM-02 [Loom Hall Machines]
            </span>
            <span className="text-gray-500">16:15:22</span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
            <div className="text-center font-mono text-gray-500 text-xs">
              <span className="text-4xl block mb-1">🏭</span>
              WEAVING LOOM SECTION 04
            </div>
          </div>
          <span className="text-[9px] text-gray-600 font-mono">30 FPS · 4.2 Mbps</span>
        </div>

        {/* CAM 03: Gate / Loading Bay */}
        <div className="bg-[#0B0D11] border border-white/8 rounded-sm relative overflow-hidden flex flex-col justify-between p-4">
          <div className="flex justify-between items-start z-10 text-[10px] font-mono">
            <span className="bg-white/5 text-gray-400 px-1.5 py-0.5 rounded">
              ● CAM-03 [Main Dispatch Gate]
            </span>
            <span className="text-gray-500">16:15:22</span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
            <div className="text-center font-mono text-gray-500 text-xs">
              <span className="text-4xl block mb-1">🚚</span>
              VEHICLE SCALE & OUTGATE
            </div>
          </div>
          <span className="text-[9px] text-gray-600 font-mono">ANPR License Recognition Ready</span>
        </div>

        {/* CAM 04: Raw Material Warehouse */}
        <div className="bg-[#0B0D11] border border-white/8 rounded-sm relative overflow-hidden flex flex-col justify-between p-4">
          <div className="flex justify-between items-start z-10 text-[10px] font-mono">
            <span className="bg-white/5 text-gray-400 px-1.5 py-0.5 rounded">
              ● CAM-04 [Yarn Storage Shelves]
            </span>
            <span className="text-gray-500">16:15:22</span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
            <div className="text-center font-mono text-gray-500 text-xs">
              <span className="text-4xl block mb-1">📦</span>
              CENTRAL WAREHOUSE BAY B
            </div>
          </div>
          <span className="text-[9px] text-gray-600 font-mono">Motion Detection Active</span>
        </div>
      </div>

      {/* Bottom Slogan Bar */}
      <div
        className="h-14 bg-[#0A0C0F] border-t px-8 flex items-center justify-center text-center"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <p className="text-base font-bold text-white tracking-wide">
          Every transaction. <span className="text-[#C5A059]">Directly linked to video on record.</span>
        </p>
      </div>
    </AbsoluteFill>
  )
}
