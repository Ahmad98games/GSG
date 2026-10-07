import React from 'react'
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

// Screen coordinates (1920x1080 full viewport)
const DASHBOARD_WAYPOINTS: CursorWaypoint[] = [
  { frame: 0, x: 285, y: 138, type: 'arrow' },
  { frame: 35, x: 1010, y: 185, type: 'pointer', click: true, label: 'Action Required: Overdue' },
  { frame: 75, x: 360, y: 138, type: 'pointer', label: 'Inspect Net Profit' },
  { frame: 85, x: 360, y: 138, type: 'pointer', click: true, label: 'Viewing: Net Profit (24.2%)' },
  { frame: 120, x: 285, y: 138, type: 'pointer', click: true, label: 'Switch Tab: OVERVIEW' },
  {
    frame: 190,
    x: 1720,
    y: 72,
    type: 'pointer',
    click: true,
    label: 'Floor Telemetry: 4 Devices Synced [100%]',
    tooltipPlacement: 'below-button',
  },
  {
    frame: 270,
    x: 1720,
    y: 72,
    type: 'pointer',
    label: 'Floor Telemetry: 4 Devices Synced [100%]',
    tooltipPlacement: 'below-button',
  },
]



export const S02_Dashboard: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const f = frame - from

  const contentOpacity = interpolate(f, [4, 18], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // Dynamic state reacting to cursor clicks!
  const isProfitTab = f >= 85 && f < 120
  const isOverdueClicked = f >= 50
  const isRevenueInspected = f >= 165 && f < 210

  // Spring animation for KPI numbers
  const kpiScale = spring({
    frame: f - 10,
    fps,
    config: { damping: 14, stiffness: 220, mass: 0.7 },
  })

  return (
    <AbsoluteFill className="bg-[#060708]">
      <NoxisWindowFrame pageTitle="DASHBOARD" activeThemeAccent="#06B6D4">
        <NoxisSidebar activeId="dashboard" accentColor="#06B6D4" />

        <div
          className="flex-1 flex flex-col overflow-y-auto px-7 py-4 space-y-3.5 pb-20 relative font-sans"
          style={{ opacity: contentOpacity }}
        >
          {/* Status Strip */}
          <div className="flex items-center justify-between text-[10px] font-mono tracking-wider">
            <div className="flex items-center gap-2 text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>LIVE DATA - UPDATED 5:19:41 PM</span>
            </div>
            <div className="text-gray-400 flex items-center gap-1.5">
              <span className="text-[#C5A059]">✦</span>
              <span className="tracking-widest uppercase font-bold text-gray-300">
                ELITE TIER
              </span>
            </div>
          </div>

          {/* Navigation Tabs - Dynamically reacting to mouse clicks! */}
          <div className="flex items-center gap-6 border-b border-white/[0.06] pb-2 text-xs font-mono font-bold tracking-wider">
            <button
              className={`relative pb-2 -mb-2 transition-colors ${
                !isProfitTab
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span>OVERVIEW</span>
            </button>
            <button
              className={`relative pb-2 -mb-2 transition-colors ${
                isProfitTab
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span>PROFIT</span>
            </button>
            <button className="text-gray-500 hover:text-gray-300">FINANCE</button>
            <button className="text-gray-500 hover:text-gray-300">STOCK</button>
          </div>

          {/* Alert Warning Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Overdue alert */}
            <div
              className="p-3.5 rounded-sm border transition-all"
              style={{
                background: isOverdueClicked ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.05)',
                borderColor: isOverdueClicked ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.25)',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-xs font-bold font-mono transition-colors"
                  style={{ color: isOverdueClicked ? '#34D399' : '#F87171' }}
                >
                  {isOverdueClicked
                    ? '✓ 7 Automated WhatsApp Reminders Dispatched'
                    : 'PKR 12,513.82 overdue from 7 customers'}
                </span>
                <span
                  className="text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-bold transition-all"
                  style={{
                    background: isOverdueClicked ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.1)',
                    borderColor: isOverdueClicked ? '#10B981' : '#EF4444',
                    color: isOverdueClicked ? '#10B981' : '#EF4444',
                  }}
                >
                  {isOverdueClicked ? 'DELIVERED' : 'Action Required'}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 leading-snug">
                {isOverdueClicked
                  ? 'Direct ledger statements sent with 1-tap JazzCash and bank transfer payment links.'
                  : '100% of your receivables are past due date. Send reminders now to protect cash flow.'}
              </p>
            </div>

            {/* Restock alert */}
            <div
              className="p-3.5 rounded-sm border"
              style={{
                background: 'rgba(239, 68, 68, 0.05)',
                borderColor: 'rgba(239, 68, 68, 0.25)',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-red-400 font-mono">
                  5 Items need restocking
                </span>
                <span className="text-[9px] font-mono text-red-400/80 uppercase">
                  Low Level
                </span>
              </div>
              <p className="text-[10px] text-gray-400 leading-snug truncate">
                Diagnostic Test Kit, Suture and 3 more are at or below reorder level...
              </p>
            </div>
          </div>

          {/* Metric / KPI Grid */}
          <div className="grid grid-cols-3 gap-4" style={{ transform: `scale(${kpiScale})` }}>
            <div
              className="bg-[#0B0E14] border rounded-sm p-3.5 flex flex-col justify-between transition-all"
              style={{
                borderColor: isRevenueInspected ? '#06B6D4' : 'rgba(6, 182, 212, 0.2)',
                boxShadow: isRevenueInspected ? '0 0 25px rgba(6, 182, 212, 0.3)' : 'none',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-400">
                  REVENUE THIS MONTH
                </span>
                <span className="text-cyan-400 text-xs">↗</span>
              </div>
              <div className="mt-2">
                <span className="text-xl font-black text-cyan-400 font-mono tracking-tight">
                  PKR 14,600
                </span>
                <p className="text-[9px] text-gray-500 font-mono mt-0.5">
                  0 Issued Invoices
                </p>
              </div>
            </div>

            <div className="bg-[#0B0E14] border border-cyan-500/20 rounded-sm p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-400">
                  OUTSTANDING RECEIVABLES
                </span>
                <span className="text-cyan-400 text-xs font-bold">$</span>
              </div>
              <div className="mt-2">
                <span className="text-xl font-black text-cyan-400 font-mono tracking-tight">
                  PKR 14,600
                </span>
                <p className="text-[9px] text-gray-500 font-mono mt-0.5">
                  0 Overdue Items
                </p>
              </div>
            </div>

            <div className="bg-[#0B0E14] border border-cyan-500/20 rounded-sm p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-400">
                  PRESENT TODAY
                </span>
                <span className="text-cyan-400 text-xs">👥</span>
              </div>
              <div className="mt-2">
                <span className="text-xl font-black text-cyan-400 font-mono tracking-tight">
                  0 / 4
                </span>
                <p className="text-[9px] text-gray-500 font-mono mt-0.5">
                  4 absent
                </p>
              </div>
            </div>

            <div className="bg-[#0B0E14] border border-white/[0.06] rounded-sm p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-400">
                  VALUED STOCK
                </span>
                <span className="text-gray-500 text-xs">📦</span>
              </div>
              <div className="mt-2">
                <span className="text-xl font-black text-gray-200 font-mono tracking-tight">
                  PKR 0
                </span>
                <p className="text-[9px] text-gray-500 font-mono mt-0.5">
                  0 Items at low level
                </p>
              </div>
            </div>

            <div className="bg-[#0B0E14] border border-white/[0.06] rounded-sm p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-400">
                  PENDING DISPATCH
                </span>
                <span className="text-gray-500 text-xs">🚚</span>
              </div>
              <div className="mt-2">
                <span className="text-xl font-black text-gray-200 font-mono tracking-tight">
                  0
                </span>
                <p className="text-[9px] text-gray-500 font-mono mt-0.5">
                  orders awaiting delivery
                </p>
              </div>
            </div>

            <div className="bg-[#0B0E14] border border-white/[0.06] rounded-sm p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-400">
                  PESHGI OUTSTANDING
                </span>
                <span className="text-gray-500 text-xs">🔒</span>
              </div>
              <div className="mt-2">
                <span className="text-xl font-black text-gray-200 font-mono tracking-tight">
                  PKR 0
                </span>
                <p className="text-[9px] text-gray-500 font-mono mt-0.5">
                  advances to recover
                </p>
              </div>
            </div>
          </div>

          {/* DATA SAFETY Card */}
          <div
            className="p-3.5 rounded-sm border flex items-center justify-between"
            style={{
              background: 'rgba(6, 182, 212, 0.04)',
              borderColor: 'rgba(6, 182, 212, 0.2)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-cyan-400 text-base">🛡️</span>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white font-mono uppercase">
                    DATA SAFETY
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-sm bg-cyan-400/10 text-cyan-400 border border-cyan-400/30">
                    PROTECTED ✓
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">
                  ✓ Your data is securely backed up to the cloud. Safe even if this PC is lost, stolen, or replaced.
                </p>
              </div>
            </div>
            <button className="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 uppercase tracking-wider underline">
              BACKUP SETTINGS
            </button>
          </div>

        </div>
      </NoxisWindowFrame>

      {/* Native Windows 11 Pro Cursor (Screen Level) */}
      <Windows11Cursor waypoints={DASHBOARD_WAYPOINTS} />

      {/* Pitch Explainer HUD */}
      <PitchHUD
        badge="02 · FACTORY COCKPIT"
        title="INSTANT OVERDUE RECEIVABLE RADAR & STOCK TELEMETRY"
        explanation="Factory owners instantly identify overdue client payments and looming stockouts without opening 10 different ledger books or calling floor supervisors."
        roiPoints={['Recover Stalled Cashflow', 'Real-Time Floor Headcount', '1-Click Customer Reminders']}
        accentColor="#06B6D4"
      />
    </AbsoluteFill>
  )
}
