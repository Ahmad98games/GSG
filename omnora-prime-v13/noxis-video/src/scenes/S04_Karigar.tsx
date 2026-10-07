import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from 'remotion'
import { NoxisSidebar } from '../components/NoxisSidebar'

const KARIGARS = [
  'Muhammad Akram', 'Rasheed Ahmed', 'Ghulam Mustafa', 'Aslam Khan',
  'Allah Ditta', 'Fazal Rehman', 'Noor Hassan', 'Shaukat Ali',
  'Tariq Mehmood', 'Iqbal Hussain', 'Muhammad Nawaz', 'Abdul Razzaq',
  'Waqas Anwar', 'Shahbaz Ahmad', 'Hamid Raza', 'Bilal Shahid',
  'Usman Ghani', 'Imran Malik', 'Zafar Iqbal', 'Khalid Mahmood',
  'Riaz Hussain', 'Arshad Butt', 'Naeem Akhtar', 'Ejaz Ahmed',
]

export const S04_Karigar: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame()
  const f = Math.max(0, frame - from)

  return (
    <AbsoluteFill className="flex flex-row" style={{ background: '#060708' }}>
      <NoxisSidebar activeIndex={3} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div
          className="px-8 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div>
            <h1 className="text-white font-black text-2xl tracking-tight flex items-center gap-3">
              Karigars & Workers
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                102 Registered
              </span>
            </h1>
            <p className="text-gray-400 text-xs font-mono mt-0.5">
              Floor Shift A · Loom Hall 04 · Stitching Unit
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-xs font-mono bg-[#0F1114] px-4 py-2 rounded-sm border border-white/6">
              <span className="text-emerald-400 font-bold">● 87 Present</span>
              <span className="text-red-400 font-bold">● 12 Absent</span>
              <span className="text-amber-400 font-bold">● 3 Half Day</span>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex-1 p-6 flex gap-6 overflow-hidden">
          {/* LEFT: 4x6 Karigar Attendance Grid */}
          <div className="flex-1 grid grid-cols-4 grid-rows-6 gap-2.5">
            {KARIGARS.map((name, i) => {
              const cardDelay = i * 2
              const markDelay = 30 + i * 3
              const cardOpacity = interpolate(f - cardDelay, [0, 8], [0, 1], {
                extrapolateRight: 'clamp',
                extrapolateLeft: 'clamp',
              })

              // 0-19: Present (green), 20-22: Absent (red), 23: Half (amber)
              const status = i < 20 ? 'P' : i < 23 ? 'A' : 'H'
              const isMarked = f >= markDelay

              return (
                <div
                  key={name}
                  className="bg-[#0F1114] border border-white/6 rounded-sm p-2.5 flex items-center justify-between shadow-md"
                  style={{ opacity: cardOpacity }}
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-white truncate">
                      {name}
                    </p>
                    <p className="text-[9px] text-gray-500 font-mono mt-0.5">
                      K-{String(i + 101).padStart(3, '0')} · Piece-Rate
                    </p>
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    {['P', 'A', 'H'].map((btn) => {
                      const isSelected = isMarked && status === btn
                      const btnColor =
                        btn === 'P'
                          ? '#10B981'
                          : btn === 'A'
                          ? '#EF4444'
                          : '#F59E0B'

                      return (
                        <div
                          key={btn}
                          className="w-5 h-5 rounded-[2px] flex items-center justify-center text-[9px] font-black font-mono transition-all"
                          style={{
                            background: isSelected ? btnColor : 'rgba(255,255,255,0.03)',
                            color: isSelected ? '#000000' : 'rgba(255,255,255,0.3)',
                            border: isSelected ? `1px solid ${btnColor}` : '1px solid rgba(255,255,255,0.06)',
                            boxShadow: isSelected ? `0 0 8px ${btnColor}40` : 'none',
                          }}
                        >
                          {btn}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* RIGHT: Production & Peshgi Ledger Panel */}
          <div className="w-80 flex flex-col gap-4 flex-shrink-0">
            {/* Daily Metric Card */}
            <div className="bg-[#0F1114] border border-white/7 rounded-sm p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">
                Today's Production Output
              </p>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-2xl font-black text-[#10B981] font-mono">
                  1,840 Meters
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  +12.4% vs target
                </span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div className="bg-[#10B981] h-full w-[82%]" />
              </div>
            </div>

            {/* Peshgi / Advances Summary */}
            <div className="bg-[#0F1114] border border-white/7 rounded-sm p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                Peshgi Advance Balance
              </p>
              <p className="text-2xl font-black text-[#C5A059] font-mono">
                PKR 485,000
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Auto-deducted at weekly Friday settlement
              </p>
            </div>

            {/* Quality Grade Distribution */}
            <div className="bg-[#0F1114] border border-white/7 rounded-sm p-4 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">
                Grade Distribution
              </p>
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-gray-300 mb-1 text-[11px]">
                    <span>Grade A (Export Standard)</span>
                    <span className="text-emerald-400 font-bold">88.5%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[88.5%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-gray-300 mb-1 text-[11px]">
                    <span>Grade B (Domestic Wholesale)</span>
                    <span className="text-blue-400 font-bold">9.2%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-400 h-full w-[9.2%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-gray-300 mb-1 text-[11px]">
                    <span>Minor Defect (Wastage)</span>
                    <span className="text-amber-400 font-bold">2.3%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full w-[2.3%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
