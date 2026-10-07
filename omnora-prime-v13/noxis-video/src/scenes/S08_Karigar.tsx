import {
  AbsoluteFill,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from 'remotion'
import { NoxisWindowFrame } from '../components/NoxisWindowFrame'
import { NoxisSidebar } from '../components/NoxisSidebar'
import { Windows11Cursor, CursorWaypoint } from '../components/Windows11Cursor'
import { PitchHUD } from '../components/PitchHUD'

const KARIGARS = [

  { name: 'Muhammad Akram', code: 'K-101', type: 'Piece-Rate', status: 'P' },
  { name: 'Rasheed Ahmed', code: 'K-102', type: 'Piece-Rate', status: 'P' },
  { name: 'Ghulam Mustafa', code: 'K-103', type: 'Piece-Rate', status: 'P' },
  { name: 'Aslam Khan', code: 'K-104', type: 'Piece-Rate', status: 'P' },
  { name: 'Allah Ditta', code: 'K-105', type: 'Piece-Rate', status: 'P' },
  { name: 'Fazal Rehman', code: 'K-106', type: 'Piece-Rate', status: 'P' },
  { name: 'Noor Hassan', code: 'K-107', type: 'Piece-Rate', status: 'P' },
  { name: 'Shaukat Ali', code: 'K-108', type: 'Piece-Rate', status: 'P' },
  { name: 'Tariq Mehmood', code: 'K-109', type: 'Piece-Rate', status: 'P' },
  { name: 'Iqbal Hussain', code: 'K-110', type: 'Piece-Rate', status: 'P' },
  { name: 'Muhammad Nawaz', code: 'K-111', type: 'Piece-Rate', status: 'P' },
  { name: 'Abdul Razzaq', code: 'K-112', type: 'Piece-Rate', status: 'P' },
  { name: 'Waqas Anwar', code: 'K-113', type: 'Piece-Rate', status: 'P' },
  { name: 'Shahbaz Ahmad', code: 'K-114', type: 'Piece-Rate', status: 'P' },
  { name: 'Hamid Raza', code: 'K-115', type: 'Piece-Rate', status: 'P' },
  { name: 'Bilal Shahid', code: 'K-116', type: 'Piece-Rate', status: 'P' },
  { name: 'Usman Ghani', code: 'K-117', type: 'Piece-Rate', status: 'P' },
  { name: 'Imran Malik', code: 'K-118', type: 'Piece-Rate', status: 'P' },
  { name: 'Zafar Iqbal', code: 'K-119', type: 'Piece-Rate', status: 'P' },
  { name: 'Khalid Mahmood', code: 'K-120', type: 'Piece-Rate', status: 'P' },
  { name: 'Riaz Hussain', code: 'K-121', type: 'Piece-Rate', status: 'A' },
  { name: 'Arshad Butt', code: 'K-122', type: 'Piece-Rate', status: 'A' },
  { name: 'Naeem Akhtar', code: 'K-123', type: 'Piece-Rate', status: 'A' },
  { name: 'Ejaz Ahmed', code: 'K-124', type: 'Piece-Rate', status: 'H' },
]

export const S08_Karigar: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const f = frame - from

  // Windows 11 natural cursor path (1920x1080 screen coordinates)
  const waypoints: CursorWaypoint[] = [
    { frame: 0, x: 380, y: 130, type: 'arrow' },
    { frame: 25, x: 513, y: 165, type: 'pointer', label: 'Mark: Muhammad Akram (Present)' },
    { frame: 38, x: 513, y: 165, type: 'pointer', click: true, label: 'Marked Present ✓' },
    { frame: 65, x: 513, y: 165, type: 'pointer' },
    { frame: 115, x: 1740, y: 965, type: 'pointer', label: 'Approve Floor Settlement' },
    { frame: 138, x: 1740, y: 965, type: 'pointer', click: true, label: 'Settlement Approved ✓', tooltipPlacement: 'above-button' },
    { frame: 180, x: 1740, y: 965, type: 'pointer' },
  ]


  return (
    <AbsoluteFill className="bg-[#060708]">
      <NoxisWindowFrame pageTitle="KARIGARS & WORKERS" activeThemeAccent="#10B981">
        <NoxisSidebar activeId="karigars" accentColor="#10B981" />

        <div className="flex-1 flex overflow-hidden p-6 gap-6 font-sans pb-20 relative">
          {/* Left: Attendance Grid (4x6 layout) */}
          <div className="flex-1 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white font-mono">
                    Karigars & Workers
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    102 Registered
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                  Floor Shift A · Loom Hall 04 · Stitching Unit
                </p>
              </div>

              {/* Status tally */}
              <div className="flex items-center gap-4 text-xs font-mono font-bold">
                <span className="text-emerald-400">● 87 Present</span>
                <span className="text-red-400">● 12 Absent</span>
                <span className="text-amber-400">● 3 Half Day</span>
              </div>
            </div>

            {/* 4x6 Cards Grid */}
            <div className="grid grid-cols-4 gap-2.5 my-3">
              {KARIGARS.map((k, i) => {
                const markDelay = i * 2.5
                const isMarked = f >= markDelay
                const popScale = spring({
                  frame: f - markDelay,
                  fps,
                  config: { damping: 15, stiffness: 220, mass: 0.6 },
                })

                let badgeColor = '#10B981'
                if (k.status === 'A') badgeColor = '#EF4444'
                if (k.status === 'H') badgeColor = '#F59E0B'

                return (
                  <div
                    key={k.code}
                    className="bg-[#0D1017] border border-white/[0.06] rounded-sm p-2.5 flex items-center justify-between transition-all"
                    style={{
                      transform: isMarked ? `scale(${popScale})` : 'scale(1)',
                      borderColor: isMarked ? `${badgeColor}30` : 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <div>
                      <p className="text-[11px] font-bold text-white truncate max-w-[100px]">
                        {k.name}
                      </p>
                      <p className="text-[9px] text-gray-500 font-mono">
                        {k.code} · {k.type}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 font-mono text-[9px] font-bold">
                      <span
                        className="w-5 h-5 rounded-sm flex items-center justify-center transition-all"
                        style={{
                          background: isMarked && k.status === 'P' ? '#10B981' : 'rgba(255,255,255,0.05)',
                          color: isMarked && k.status === 'P' ? '#000000' : '#6B7280',
                        }}
                      >
                        P
                      </span>
                      <span
                        className="w-5 h-5 rounded-sm flex items-center justify-center transition-all"
                        style={{
                          background: isMarked && k.status === 'A' ? '#EF4444' : 'rgba(255,255,255,0.05)',
                          color: isMarked && k.status === 'A' ? '#FFFFFF' : '#6B7280',
                        }}
                      >
                        A
                      </span>
                      <span
                        className="w-5 h-5 rounded-sm flex items-center justify-center transition-all"
                        style={{
                          background: isMarked && k.status === 'H' ? '#F59E0B' : 'rgba(255,255,255,0.05)',
                          color: isMarked && k.status === 'H' ? '#000000' : '#6B7280',
                        }}
                      >
                        H
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom summary bar */}
            <div className="p-2.5 rounded bg-[#090C12] border border-white/[0.06] flex items-center justify-between text-xs font-mono text-gray-400">
              <span>Automatic biometric sync via local device bridge</span>
              <span className="text-emerald-400 font-bold">Shift Attendance Sealed [100%]</span>
            </div>
          </div>

          {/* Right: Production & Ledger Panel */}
          <div className="w-80 bg-[#090C12] border border-white/[0.08] rounded-lg p-5 flex flex-col justify-between font-mono">
            <div className="space-y-5">
              {/* Production summary */}
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                  TODAY'S PRODUCTION OUTPUT
                </span>
                <p className="text-3xl font-black text-emerald-400 mt-1">
                  1,840 Meters
                </p>
                <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-emerald-400 w-[78%]" />
                </div>
                <span className="text-[9px] text-gray-500 mt-1 block">
                  +12.4% vs daily target
                </span>
              </div>

              {/* Peshgi advance */}
              <div className="pt-4 border-t border-white/[0.06]">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                  PESHGI ADVANCE BALANCE
                </span>
                <p className="text-2xl font-black text-[#C5A059] mt-1">
                  PKR 485,000
                </p>
                <span className="text-[9px] text-gray-500 mt-0.5 block">
                  Auto-deducted at weekly Friday settlement
                </span>
              </div>

              {/* Quality grade distribution */}
              <div className="pt-4 border-t border-white/[0.06] space-y-2">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                  GRADE DISTRIBUTION
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Grade A (Export Standard)</span>
                    <span className="text-emerald-400 font-bold">88.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Grade B (Domestic Wholesale)</span>
                    <span className="text-cyan-400 font-bold">9.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Minor Defect (Wastage)</span>
                    <span className="text-amber-400 font-bold">2.3%</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              className="w-full py-2.5 rounded border font-bold text-xs uppercase tracking-wider transition-all shadow-xl"
              style={{
                background: f >= 138 && f <= 148 ? '#10B981' : 'rgba(16, 185, 129, 0.15)',
                color: f >= 138 && f <= 148 ? '#000000' : '#10B981',
                borderColor: 'rgba(16, 185, 129, 0.4)',
                transform: f >= 138 && f <= 148 ? 'scale(0.96)' : 'scale(1)',
              }}
            >
              <span>✓ Approve Floor Settlement</span>
            </button>
          </div>

        </div>
      </NoxisWindowFrame>

      {/* Windows 11 Precision Cursor (Screen Level) */}
      <Windows11Cursor waypoints={waypoints} />

      {/* Customer Pitch HUD */}
      <PitchHUD
        badge="08 · FLOOR LABOR ENGINE"
        title="AUTOMATE 100+ KARIGAR PIECE-RATES, METERS & PESHGI ADVANCES"
        explanation="Factory owners eliminate ghost workers and payroll chaos. Connects directly to biometric turnstiles, logs meters stitched per worker, and auto-deducts Friday cash advances."
        roiPoints={['Zero Wage Calculation Errors', 'Automatic Peshgi Recovery', 'Instant Quality Grade Audit']}
        accentColor="#10B981"
      />
    </AbsoluteFill>
  )
}
