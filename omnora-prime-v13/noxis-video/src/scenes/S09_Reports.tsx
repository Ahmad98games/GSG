import React from 'react'
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from 'remotion'
import { NoxisSidebar } from '../components/NoxisSidebar'

export const S09_Reports: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame()
  const f = Math.max(0, frame - from)

  // Tab active: Tab 1 (P&L) for f < 60, Tab 2 (Trial Balance) for f >= 60
  const activeTab = f < 60 ? 1 : 2

  // Export progress animation between frame 120 and 135
  const exportProgress = interpolate(f, [120, 135], [0, 100], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  })
  const isExporting = f >= 120
  const exportDone = f >= 135

  return (
    <AbsoluteFill className="flex flex-row" style={{ background: '#060708' }}>
      <NoxisSidebar activeIndex={9} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div
          className="px-8 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div>
            <h1 className="text-white font-black text-2xl tracking-tight">
              Financial Intelligence & Reports
            </h1>
            <p className="text-gray-400 text-xs font-mono mt-0.5">
              Audited Books · Fiscal Year 2026-2027 · Real-time General Ledger
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 rounded-sm text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer shadow-lg"
              style={{
                background: isExporting ? '#10B98125' : '#60A5FA25',
                color: isExporting ? '#10B981' : '#60A5FA',
                border: isExporting ? '1px solid #10B98140' : '1px solid #60A5FA40',
              }}
            >
              <span>📥 Export Audit PDF</span>
            </button>
          </div>
        </div>

        {/* Tab Header Selector */}
        <div className="px-8 pt-4 flex gap-4 border-b border-white/6 text-xs font-bold">
          <button
            className="pb-3 border-b-2 transition-colors cursor-pointer"
            style={{
              borderColor: activeTab === 1 ? '#60A5FA' : 'transparent',
              color: activeTab === 1 ? '#60A5FA' : '#6B7280',
            }}
          >
            1. Profit & Loss Statement (P&L)
          </button>
          <button
            className="pb-3 border-b-2 transition-colors cursor-pointer"
            style={{
              borderColor: activeTab === 2 ? '#10B981' : 'transparent',
              color: activeTab === 2 ? '#10B981' : '#6B7280',
            }}
          >
            2. Dual-Entry Trial Balance
          </button>
          <button className="pb-3 text-gray-500 border-b-2 border-transparent">
            3. Accounts Aging (Receivables/Payables)
          </button>
        </div>

        {/* Tab View Content */}
        <div className="flex-1 p-8 overflow-hidden flex flex-col justify-between">
          {activeTab === 1 ? (
            /* TAB 1: P&L Summary */
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#0F1114] border border-white/7 rounded-sm p-4">
                  <p className="text-[10px] font-bold uppercase text-gray-500">Gross Sales Revenue</p>
                  <p className="text-2xl font-black font-mono text-[#10B981] mt-1">PKR 12,450,000</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">H1 Fiscal Cycle</p>
                </div>
                <div className="bg-[#0F1114] border border-white/7 rounded-sm p-4">
                  <p className="text-[10px] font-bold uppercase text-gray-500">Cost of Goods Sold (COGS)</p>
                  <p className="text-2xl font-black font-mono text-gray-200 mt-1">PKR 8,340,000</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Yarn + Dyes + Karigar Wages</p>
                </div>
                <div className="bg-[#0F1114] border border-white/7 rounded-sm p-4">
                  <p className="text-[10px] font-bold uppercase text-gray-500">Gross Trading Profit</p>
                  <p className="text-2xl font-black font-mono text-[#60A5FA] mt-1">PKR 4,110,000</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">33.01% Gross Margin</p>
                </div>
                <div className="bg-[#0F1114] border border-white/7 rounded-sm p-4">
                  <p className="text-[10px] font-bold uppercase text-gray-500">Net Clean Operating Profit</p>
                  <p className="text-2xl font-black font-mono text-[#10B981] mt-1">PKR 2,890,000</p>
                  <p className="text-[10px] text-emerald-400 mt-0.5">After Factory Electricity & Tax</p>
                </div>
              </div>

              {/* 6 Months Revenue Bar Chart */}
              <div className="bg-[#0F1114] border border-white/7 rounded-sm p-5 shadow-lg">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-4 font-mono">
                  Monthly Revenue Trajectory (Last 6 Months)
                </p>
                <div className="h-32 flex items-end justify-between gap-6 px-4 pt-4">
                  {[
                    { month: 'MAY', height: '55%', amount: '9.2M' },
                    { month: 'JUN', height: '65%', amount: '10.5M' },
                    { month: 'JUL', height: '60%', amount: '9.8M' },
                    { month: 'AUG', height: '75%', amount: '11.4M' },
                    { month: 'SEP', height: '80%', amount: '11.9M' },
                    { month: 'OCT', height: '95%', amount: '12.45M', active: true },
                  ].map((bar) => (
                    <div key={bar.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <span className="text-[9px] font-mono text-gray-400">{bar.amount}</span>
                      <div
                        className="w-full rounded-t transition-all"
                        style={{
                          height: bar.height,
                          background: bar.active ? '#60A5FA' : 'rgba(96,165,250,0.25)',
                          boxShadow: bar.active ? '0 0 15px rgba(96,165,250,0.4)' : 'none',
                        }}
                      />
                      <span
                        className="text-[10px] font-mono font-bold"
                        style={{ color: bar.active ? '#60A5FA' : '#6B7280' }}
                      >
                        {bar.month}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: Trial Balance */
            <div className="bg-[#0F1114] border border-white/7 rounded-sm p-5 shadow-xl flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-3 border-b border-white/6 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">General Ledger Trial Balance</span>
                    <span className="text-[9px] font-black font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Balanced ✓
                    </span>
                  </div>
                  <span className="text-xs font-mono text-gray-400">As on 06-OCT-2026</span>
                </div>

                <div className="divide-y divide-white/5 font-mono text-xs">
                  <div className="grid grid-cols-12 py-2 text-gray-500 font-bold uppercase text-[10px]">
                    <span className="col-span-6">Account Head</span>
                    <span className="col-span-3 text-right">Debit (DR)</span>
                    <span className="col-span-3 text-right">Credit (CR)</span>
                  </div>
                  <div className="grid grid-cols-12 py-2">
                    <span className="col-span-6 text-gray-200">1010 Cash & Bank Accounts</span>
                    <span className="col-span-3 text-right text-emerald-400">PKR 3,420,000</span>
                    <span className="col-span-3 text-right text-gray-600">-</span>
                  </div>
                  <div className="grid grid-cols-12 py-2">
                    <span className="col-span-6 text-gray-200">1020 Accounts Receivable (Parties)</span>
                    <span className="col-span-3 text-right text-emerald-400">PKR 6,850,000</span>
                    <span className="col-span-3 text-right text-gray-600">-</span>
                  </div>
                  <div className="grid grid-cols-12 py-2">
                    <span className="col-span-6 text-gray-200">2010 Accounts Payable (Suppliers)</span>
                    <span className="col-span-3 text-right text-gray-600">-</span>
                    <span className="col-span-3 text-right text-blue-400">PKR 4,120,000</span>
                  </div>
                  <div className="grid grid-cols-12 py-2">
                    <span className="col-span-6 text-gray-200">3010 Owner Equity & Retained Capital</span>
                    <span className="col-span-3 text-right text-gray-600">-</span>
                    <span className="col-span-3 text-right text-blue-400">PKR 6,150,000</span>
                  </div>
                </div>
              </div>

              {/* Total line */}
              <div className="pt-3 border-t-2 border-white/20 grid grid-cols-12 font-mono font-black text-sm">
                <span className="col-span-6 text-white uppercase text-xs">Total Trial Balance</span>
                <span className="col-span-3 text-right text-emerald-400">PKR 10,270,000</span>
                <span className="col-span-3 text-right text-emerald-400">PKR 10,270,000</span>
              </div>
            </div>
          )}

          {/* Export Progress bar & Toast */}
          {isExporting && (
            <div className="mt-4 bg-[#0F1114] border border-white/8 p-3 rounded flex items-center justify-between">
              <div className="flex items-center gap-3 w-3/4">
                <span className="text-xs font-mono font-bold text-gray-300">
                  {exportDone ? '✓ Report saved to disk: /reports/FY26-Q3-P&L.pdf' : 'Rendering PDF Vector Bundle...'}
                </span>
                <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {Math.round(exportProgress)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  )
}
