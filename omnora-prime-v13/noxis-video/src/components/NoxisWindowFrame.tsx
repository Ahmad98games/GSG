import React from 'react'
import { NoxisLogo } from './NoxisLogo'

export function NoxisWindowFrame({
  children,
  pageTitle = 'DASHBOARD',
  activeThemeAccent = '#06B6D4',
}: {
  children: React.ReactNode
  pageTitle?: string
  activeThemeAccent?: string
}) {
  return (
    <div className="w-full h-full flex flex-col bg-[#060708] text-white overflow-hidden select-none font-sans">
      {/* ── 1. NATIVE INDUSTRIAL WINDOW TITLEBAR ── */}
      <div className="h-7 w-full bg-[#050608] border-b border-white/[0.06] flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <NoxisLogo size={14} showWordmark={false} />
          <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-white">
            NOXIS
          </span>
          <span className="text-gray-600 text-[10px]">|</span>
          <span
            className="text-[10px] font-mono font-semibold tracking-wider uppercase"
            style={{ color: activeThemeAccent }}
          >
            {pageTitle}
          </span>
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-3 text-gray-500 text-xs">
          <span className="hover:text-white cursor-pointer">─</span>
          <span className="hover:text-white cursor-pointer text-[10px]">□</span>
          <span className="hover:text-red-400 cursor-pointer text-xs">✕</span>
        </div>
      </div>

      {/* ── 2. GLOBAL SYSTEM TELEMETRY HEADER ── */}
      <div className="h-12 w-full bg-[#0A0D12] border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          {/* Noxis Core Pill */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-white/[0.04] border border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-gray-300">
              NOXIS CORE
            </span>
            <span className="text-[8px] font-mono text-cyan-400/80">v13.0.0</span>
          </div>

          {/* Active Tenant / Factory Chip */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-sm bg-white/[0.02] border border-white/[0.05]">
            <span className="text-xs">🏭</span>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-white leading-tight">
                gold sha Garments
              </span>
              <span className="text-[8px] text-gray-500 uppercase tracking-wider -mt-0.5 font-mono">
                Garment Factory
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden lg:flex items-center gap-2 bg-[#0F131A] border border-white/[0.08] px-3 py-1 rounded-sm w-72 text-gray-400 text-xs">
            <span className="text-gray-500 text-xs">🔍</span>
            <span className="text-gray-500 text-[11px] flex-1">Search anything...</span>
            <span className="text-[9px] font-mono bg-white/[0.06] text-gray-400 px-1 py-0.2 rounded border border-white/[0.08]">
              Ctrl+K
            </span>
          </div>
        </div>

        {/* Status indicator pills & User profile */}
        <div className="flex items-center gap-3">
          {/* Local Hub Sync Status */}
          <div
            className="flex items-center gap-2 px-2.5 py-1 rounded-sm border"
            style={{
              background: 'rgba(6, 182, 212, 0.08)',
              borderColor: 'rgba(6, 182, 212, 0.25)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-bold text-cyan-300 font-mono">
              Local Hub Active
            </span>
            <span className="text-gray-600 text-[10px]">|</span>
            <span className="text-[10px] text-cyan-400/80 font-mono">
              4 Devices
            </span>
            <span className="text-gray-600 text-[10px]">|</span>
            <span className="text-[10px] font-bold text-emerald-400 font-mono">
              Sync: 100%
            </span>
          </div>

          {/* Telemetry Icons */}
          <div className="flex items-center gap-2 text-gray-400 text-xs pl-2 border-l border-white/[0.08]">
            <span className="p-1 hover:text-white cursor-pointer relative">
              🔔
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
            </span>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.04] text-[10px] font-mono text-gray-300">
              <span>🌐</span>
              <span>EN</span>
            </div>
          </div>

          {/* Profile chip */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-6 h-6 rounded-sm bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-black">
              GG
            </div>
            <span className="text-xs font-semibold text-gray-300">
              gold sha Garments
            </span>
            <span className="text-gray-500 text-[10px]">▾</span>
          </div>
        </div>
      </div>

      {/* ── 3. MAIN WORKSPACE VIEWPORT ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {children}
      </div>
    </div>
  )
}
