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

// Calibrated 1920x1080 screen coordinates
const FILEMORPH_WAYPOINTS: CursorWaypoint[] = [
  { frame: 0, x: 380, y: 485, type: 'arrow' },
  {
    frame: 30,
    x: 380,
    y: 485,
    type: 'arrow',
    click: true,
    label: 'Drop Excel/CSV Ledger',
    tooltipPlacement: 'above-button',
  },
  {
    frame: 110,
    x: 380,
    y: 485,
    type: 'pointer',
    label: 'Parsing 1,420 entries...',
    tooltipPlacement: 'above-button',
  },
  { frame: 180, x: 380, y: 485, type: 'arrow' },
]



export const S06_FileMorph: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const f = frame - from

  // File drop animation
  const fileDropY = interpolate(f, [10, 30], [-100, 0], {
    extrapolateRight: 'clamp',
  })
  const fileDropOpacity = interpolate(f, [10, 25], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // Conversion Progress
  const conversionProgress = interpolate(f, [35, 95], [0, 100], {
    extrapolateRight: 'clamp',
  })

  // Result card entrance
  const showResult = f >= 90
  const resultScale = spring({
    frame: f - 90,
    fps,
    config: { damping: 14, stiffness: 220, mass: 0.7 },
  })

  const isPostButtonClicked = f >= 118 && f <= 130

  return (
    <AbsoluteFill className="bg-[#060708]">
      <NoxisWindowFrame pageTitle="FILE CONVERSION & DATA MIGRATION" activeThemeAccent="#C5A059">
        <NoxisSidebar activeId="file-morph" accentColor="#C5A059" />

        <div className="flex-1 flex flex-col overflow-y-auto p-7 space-y-5 font-sans pb-20 relative">
          {/* Studio Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔄</span>
                <h2 className="text-lg font-bold text-white font-mono tracking-wide">
                  FILE MORPH & DATA MIGRATION STUDIO
                </h2>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[9px] font-mono font-bold uppercase text-emerald-400">
                    100% In-Browser Execution · 0 Cloud Leakage
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Instantly convert legacy Tally XML, QuickBooks CSV, Excel sheets, and paper invoice scans into native Noxis database records.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {['TALLY XML', 'QUICKBOOKS', 'EXCEL .XLSX', 'PDF OCR'].map((fmt) => (
                <span
                  key={fmt}
                  className="px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-[9px] font-mono text-gray-400 uppercase"
                >
                  {fmt}
                </span>
              ))}
            </div>
          </div>

          {/* Dropzone Area & Active Conversion */}
          <div className="grid grid-cols-2 gap-5 flex-1">
            {/* Left: Drag & Drop Ingestion Box */}
            <div className="border border-dashed border-[#C5A059]/40 bg-[#0E1218] rounded-lg p-6 flex flex-row items-center justify-between text-center gap-4 relative overflow-hidden">
              <div
                className="w-[240px] bg-[#151B24] border border-[#C5A059]/50 rounded-md p-3.5 shadow-xl space-y-3 shrink-0"
                style={{
                  transform: `translateY(${fileDropY}px)`,
                  opacity: fileDropOpacity,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">📊</span>
                    <div className="text-left">
                      <p className="text-xs font-bold text-white font-mono">
                        Lahore_Textile_Ledger_2026.xlsx
                      </p>
                      <p className="text-[9px] text-gray-400 font-mono">
                        1.4 MB · 1,420 Row Double-Entry Ledger
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    DETECTED
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-gray-400">Parsing Schema & Formulas...</span>
                    <span className="text-[#C5A059] font-bold">{Math.round(conversionProgress)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#C5A059] to-emerald-400 transition-all"
                      style={{ width: `${conversionProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-mono text-gray-500">
                Engine parses client-side directly into local SQLite WAL journal
              </span>
            </div>

            {/* Right: Live Conversion Stream & Telemetry */}
            <div className="bg-[#090C12] border border-white/[0.08] rounded-lg p-5 flex flex-col justify-between">
              <div className="space-y-3 font-mono">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  REAL-TIME SCHEMA EXTRACTION
                </span>

                <div className="space-y-2 text-xs">
                  <div
                    className="p-2.5 rounded bg-white/[0.02] border border-white/[0.05] flex items-center justify-between"
                    style={{ opacity: f > 35 ? 1 : 0.2 }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span className="text-gray-300">Party Accounts Mapped</span>
                    </div>
                    <span className="text-emerald-400 font-bold">48 Parties</span>
                  </div>

                  <div
                    className="p-2.5 rounded bg-white/[0.02] border border-white/[0.05] flex items-center justify-between"
                    style={{ opacity: f > 55 ? 1 : 0.2 }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span className="text-gray-300">Khata Balances Reconciled</span>
                    </div>
                    <span className="text-[#C5A059] font-bold">PKR 14,280,000</span>
                  </div>

                  <div
                    className="p-2.5 rounded bg-white/[0.02] border border-white/[0.05] flex items-center justify-between"
                    style={{ opacity: f > 75 ? 1 : 0.2 }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span className="text-gray-300">Fabric Inventory SKUs Imported</span>
                    </div>
                    <span className="text-cyan-400 font-bold">82 SKUs</span>
                  </div>
                </div>
              </div>

              {/* Success Result */}
              {showResult && (
                <div
                  className="p-3.5 rounded-sm bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between font-mono"
                  style={{ transform: `scale(${resultScale})` }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-emerald-400 text-lg">✓</span>
                    <div>
                      <p className="text-xs font-bold text-white">Migration Complete (0.38s)</p>
                      <p className="text-[9px] text-gray-400">
                        1,420 entries verified with SHA-256 seal
                      </p>
                    </div>
                  </div>
                  <button
                    className="text-[10px] font-bold px-2.5 py-1 rounded transition-all"
                    style={{
                      background: isPostButtonClicked ? '#10B981' : 'rgba(16, 185, 129, 0.25)',
                      color: isPostButtonClicked ? '#000000' : '#10B981',
                      border: '1px solid rgba(16, 185, 129, 0.5)',
                      transform: isPostButtonClicked ? 'scale(0.95)' : 'scale(1)',
                    }}
                  >
                    POST TO KHATA
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </NoxisWindowFrame>

      {/* Windows 11 Native Cursor (Screen Level) */}
      <Windows11Cursor waypoints={FILEMORPH_WAYPOINTS} />

      {/* Customer Pitch HUD */}
      <PitchHUD
        badge="06 · ZERO-LEAK MIGRATION"
        title="SWITCH FROM TALLY, QUICKBOOKS & EXCEL IN MINUTES · 0 CLOUD EXPOSURE"
        explanation="Migrate 10 years of messy ledger spreadsheets and party balances into verified double-entry books in under 1 second without uploading a single byte to external clouds."
        roiPoints={['Zero Cloud Data Exposure', 'Instant Schema Normalization', 'Automated Khata Reconciliation']}
        accentColor="#C5A059"
      />
    </AbsoluteFill>
  )
}
