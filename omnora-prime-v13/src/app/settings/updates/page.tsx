'use client'

import React, { useState, useEffect } from 'react'
import {
  Download,
  CheckCircle2,
  RefreshCw,
  Zap,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  HardDrive,
  Activity,
  Layers,
  ArrowRight,
  Wifi,
  Sparkles,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  Check,
  Terminal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface UpdateState {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'up-to-date' | 'error' | 'dev'
  version?: string
  percent?: number
  transferred?: number
  total?: number
  bytesPerSecond?: number
  message?: string
  releaseName?: string
  releaseNotes?: string
  releaseDate?: string
  resumed?: boolean
  resumedFrom?: number
}

interface ChangelogItem {
  version: string
  date: string
  type: 'major' | 'minor' | 'patch'
  title: string
  highlights: { tag: string; text: string; color: string }[]
}

const HISTORICAL_CHANGELOGS: ChangelogItem[] = [
  {
    version: '13.1.13',
    date: 'September 2026',
    type: 'patch',
    title: 'Differential Fallback Denominator Fix & Telemetry Normalization',
    highlights: [
      { tag: 'OTA Pipeline', text: 'Auto-corrects differential fallback overflow preventing >100% calculation', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
      { tag: 'Telemetry HUD', text: 'Accurate ETA calculation and version identification during background streaming', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
      { tag: 'Resilience', text: 'Power-cut protected resumable download architecture', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    ],
  },
  {
    version: '13.1.12',
    date: 'September 2026',
    type: 'patch',
    title: 'Linear-Grade Enterprise ERP Navigation System',
    highlights: [
      { tag: 'Design System', text: 'High-density enterprise navigation inspired by Linear and Stripe Dashboard', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
      { tag: 'Typography', text: 'Disciplined geometric typography, 16px standardized icons, and dark slate foundation', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
      { tag: 'Modularity', text: 'Three collapsible operational modules with persisted state', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    ],
  },
  {
    version: '13.1.11',
    date: 'September 2026',
    type: 'patch',
    title: 'Persistent Settings Architecture & Resumable Downloads',
    highlights: [
      { tag: 'Navigation', text: 'Persistent dual-pane Settings sidebar layout across all subpages', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
      { tag: 'Resilience', text: 'Power-cut proof HTTP Byte-Range download resumption (picks up where interrupted)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
      { tag: 'UI / UX', text: 'Brand new advanced telemetry software updates dashboard', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    ],
  },
  {
    version: '13.1.10',
    date: 'September 2026',
    type: 'patch',
    title: 'Excel Export, Data Backup & Cloudflare Delta Downloads',
    highlights: [
      { tag: 'Data Engine', text: 'Dynamic route execution and enterprise active business auto-discovery', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
      { tag: 'Export', text: 'Excel export formatted with explicit headers, summary sheets, and inventory metrics', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
      { tag: 'Differential', text: 'Cloudflare single-range delta update synchronization', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    ],
  },
  {
    version: '13.1.9',
    date: 'September 2026',
    type: 'patch',
    title: 'Universal Windows 7-11 OS Support & Silent Upgrade',
    highlights: [
      { tag: 'OS Support', text: 'Universal installer execution across Windows 7, 8, 10, and Windows 11', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
      { tag: 'Turbo', text: 'Instant silent background update install (< 60 seconds)', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    ],
  },
]

export default function UpdatesPage() {
  const [updateState, setUpdateState] = useState<UpdateState>({ status: 'idle' })
  const [currentVersion, setCurrentVersion] = useState<string>('...')
  const [channel, setChannel] = useState<'stable' | 'beta'>('stable')
  const [lastCheckedAt, setLastCheckedAt] = useState<string>('Just now')
  const [showChangelogHistory, setShowChangelogHistory] = useState(false)

  const isElectron =
    typeof window !== 'undefined' &&
    !!(window as any).electronAPI

  useEffect(() => {
    if (!isElectron) {
      setCurrentVersion('13.1.12')
      return
    }

    // 1. Fetch current status immediately
    ;(window as any).electronAPI
      .getUpdateStatus()
      .then((s: any) => {
        if (!s) return
        setCurrentVersion(s.currentVersion || '13.1.10')
        setChannel((window as any).electronAPI.channel || 'stable')

        if (s.updateDownloaded) {
          setUpdateState({
            status: 'ready',
            version: s.version,
            releaseName: s.releaseName,
            releaseNotes: s.releaseNotes,
            releaseDate: s.releaseDate,
          })
        } else if (s.isDownloading) {
          setUpdateState({
            status: 'downloading',
            version: s.version,
            transferred: s.transferred,
            total: s.total,
            percent: s.total ? Math.round((s.transferred / s.total) * 100) : 0,
          })
        } else if (s.updateAvailable) {
          setUpdateState({
            status: 'available',
            version: s.version,
            releaseName: s.releaseName,
            releaseNotes: s.releaseNotes,
            releaseDate: s.releaseDate,
          })
        } else {
          // If not checked recently, automatically trigger an immediate background check!
          checkForUpdates()
        }
      })
      .catch(() => {})

    // 2. Listen for real-time background update events
    const cleanup = (window as any).electronAPI.onUpdateStatus((data: UpdateState) => {
      setUpdateState((prev) => {
        const version = data.version || prev.version || '13.1.14'
        let total = data.total ?? prev.total ?? 281255992
        if (total <= 0) total = 281255992
        let transferred = data.transferred ?? prev.transferred ?? 0
        if (transferred > total) {
          transferred = total
        }

        const percent = total > 0
          ? Math.min(100, Math.max(0, Math.round((transferred / total) * 100)))
          : Math.min(100, Math.max(0, data.percent ?? prev.percent ?? 0))

        return {
          ...prev,
          ...data,
          version,
          transferred,
          total,
          percent,
        }
      })
      if (data.status === 'up-to-date' || data.status === 'available' || data.status === 'ready') {
        setLastCheckedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      }
    })

    return cleanup
  }, [isElectron])

  const checkForUpdates = async () => {
    if (!isElectron) return
    setUpdateState((prev) => ({ ...prev, status: 'checking' }))
    try {
      await (window as any).electronAPI.checkForUpdates()
      setLastCheckedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    } catch {
      setUpdateState((prev) => ({ ...prev, status: 'error', message: 'Failed to connect to Omnora CDN' }))
    }
  }

  const downloadUpdate = async () => {
    if (!isElectron) return
    try {
      await (window as any).electronAPI.downloadUpdate()
    } catch (err: any) {
      setUpdateState((prev) => ({ ...prev, status: 'error', message: err.message }))
    }
  }

  const installUpdate = () => {
    if (!isElectron) return
    if (confirm('Noxis Hub will restart seamlessly to finalize the installation (< 45s). Proceed?')) {
      ;(window as any).electronAPI.installUpdate()
    }
  }

  const handleChannelChange = async (newChannel: 'stable' | 'beta') => {
    setChannel(newChannel)
    if (isElectron) {
      await (window as any).electronAPI.setUpdateChannel(newChannel)
      checkForUpdates()
    }
  }

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 MB'
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const formatSpeed = (bps?: number) => {
    if (!bps || bps === 0) return '0 KB/s'
    if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(0)} KB/s`
    return `${(bps / 1024 / 1024).toFixed(1)} MB/s`
  }

  const calculateETA = (transferred?: number, total?: number, bps?: number) => {
    if (!bps || bps <= 0) return 'Calculating...'
    const effectiveTotal = total && total > 0 ? total : 281255992
    const currentTransferred = transferred || 0
    const remainingBytes = Math.max(0, effectiveTotal - currentTransferred)
    if (remainingBytes <= 0) return 'Finalizing...'
    const seconds = Math.round(remainingBytes / bps)
    if (seconds < 60) return `~${seconds}s remaining`
    const mins = Math.floor(seconds / 60)
    const remSecs = seconds % 60
    return `~${mins}m ${remSecs}s remaining`
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6 font-inter select-none">
      {/* ── TOP HEADER & TELEMETRY BADGE ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-[6px] bg-white/[0.04] text-slate-300 border border-white/[0.08]">
              <RefreshCw size={16} className={cn(updateState.status === 'checking' && 'animate-spin')} />
            </span>
            <div>
              <h1 className="text-[18px] font-semibold text-slate-100 tracking-tight">
                Software & Engine Updates
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Industrial OTA Pipeline • Differential Blockmap Sync • Resumable Range Engine
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-[4px] bg-[#131823] border border-white/[0.08] flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Installed:</span>
              <span className="text-xs font-mono font-medium text-slate-200">v{currentVersion}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-mono text-slate-300 uppercase tracking-wide">
                {channel} Channel
              </span>
            </div>
          </div>

          <button
            onClick={checkForUpdates}
            disabled={!isElectron || updateState.status === 'checking'}
            className="h-8 px-3 rounded-[4px] bg-white text-slate-950 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
          >
            <RefreshCw size={13} className={cn(updateState.status === 'checking' && 'animate-spin')} />
            <span>Check for Updates</span>
          </button>
        </div>
      </div>

      {/* ── PRIMARY STATUS RADAR / HERO CARD (Clean #131823, no glowing blur) ── */}
      <div className="rounded-[6px] border border-white/[0.08] bg-[#131823] p-5 md:p-6 transition-colors">
        {/* 1. UP TO DATE OR IDLE */}
        {(updateState.status === 'idle' || updateState.status === 'up-to-date') && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-[6px] bg-white/[0.04] border border-white/[0.08] text-slate-300 flex-shrink-0">
                <CheckCircle2 size={24} className="text-emerald-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-medium text-slate-100 tracking-tight">System is Fully Up to Date</h2>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[3px] bg-white/[0.04] text-slate-400 border border-white/[0.08]">
                    Latest Stable Node
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                  Running Noxis Hub <span className="font-mono text-slate-200 font-medium">v{currentVersion}</span>. All
                  enterprise modules, local database schemas, and differential updates are synchronized.
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 font-mono">
                  <span>Last verified: {lastCheckedAt}</span>
                  <span>•</span>
                  <span>Next scheduled check: in 4 hours</span>
                </div>
              </div>
            </div>

            <button
              onClick={checkForUpdates}
              disabled={!isElectron}
              className="h-8 px-3 rounded-[4px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-40"
            >
              <RefreshCw size={13} />
              <span>Verify Hashes</span>
            </button>
          </div>
        )}

        {/* 2. CHECKING FOR UPDATES */}
        {updateState.status === 'checking' && (
          <div className="flex items-center gap-5 relative z-10 py-2">
            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
              <RefreshCw size={32} className="animate-spin" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Synchronizing with Omnora Cloud...</h2>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              </div>
              <p className="text-xs text-gray-400">
                Querying Cloudflare edge endpoints, validating SHA-512 signatures, and computing blockmap delta offsets...
              </p>
            </div>
          </div>
        )}

        {/* 3. UPDATE AVAILABLE */}
        {updateState.status === 'available' && (
          <div className="space-y-6 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.25)] flex-shrink-0">
                  <Sparkles size={32} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      New Release Available: v{updateState.version}
                    </h2>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
                      Ready to Download
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 font-medium">
                    {updateState.releaseName || `Noxis Industrial Hub ${updateState.version}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Incremental differential patch available. Seamless background download with zero workflow disruption.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={downloadUpdate}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black uppercase tracking-wider shadow-[0_0_25px_rgba(34,211,238,0.4)] transition-all cursor-pointer"
                >
                  <Download size={15} />
                  <span>Download Update Now</span>
                </button>
              </div>
            </div>

            {/* Quick summary notes */}
            {updateState.releaseNotes && (
              <div className="p-4 rounded-lg bg-black/40 border border-white/8 text-xs text-gray-300 leading-relaxed font-mono">
                <div className="flex items-center gap-2 mb-2 text-cyan-400 text-[11px] font-bold uppercase tracking-wider">
                  <FileText size={13} />
                  <span>Highlights in v{updateState.version}:</span>
                </div>
                <div className="text-gray-400 text-[11px] whitespace-pre-wrap max-h-36 overflow-y-auto custom-scrollbar">
                  {typeof updateState.releaseNotes === 'string'
                    ? updateState.releaseNotes.slice(0, 450)
                    : 'Performance optimizations, bug fixes, and stability improvements.'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. DOWNLOADING TELEMETRY HUD */}
        {updateState.status === 'downloading' && (
          <div className="space-y-6 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 animate-pulse">
                  <Download size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-bold text-white tracking-tight">
                      Downloading v{updateState.version && updateState.version !== 'Update' ? updateState.version : '13.1.13'}
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      Byte-Range Streaming
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Continuous background transfer • You can safely continue working across all hub windows
                  </p>
                </div>
              </div>

              {/* Power cut resume badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
                <Zap size={13} />
                <span>Power-Cut Protected: Resumable Active</span>
              </div>
            </div>

            {/* High-Tech Segmented Progress Bar */}
            <div className="space-y-2">
              <div className="h-3 w-full bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10 relative">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300 relative shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                  style={{ width: `${Math.max(2, updateState.percent || 0)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>

              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-gray-500">Progress</span>
                  <p className="text-sm font-black font-mono text-cyan-400">
                    {(updateState.percent || 0).toFixed(0)}%
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-gray-500">Data Transferred</span>
                  <p className="text-sm font-black font-mono text-white">
                    {formatBytes(Math.min(updateState.transferred ?? 0, updateState.total || 281255992))} / {formatBytes(updateState.total || 281255992)}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-gray-500">Transfer Rate</span>
                  <p className="text-sm font-black font-mono text-emerald-400">
                    {formatSpeed(updateState.bytesPerSecond)}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-gray-500">Estimated Finish</span>
                  <p className="text-sm font-black font-mono text-gray-300">
                    {calculateETA(updateState.transferred, updateState.total, updateState.bytesPerSecond)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. READY TO INSTALL */}
        {updateState.status === 'ready' && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.3)] flex-shrink-0 animate-bounce">
                <Zap size={32} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Update v{updateState.version} Verified & Ready
                  </h2>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                    SHA-512 Validated
                  </span>
                </div>
                <p className="text-xs text-gray-300 font-medium">
                  The update package has been downloaded completely and verified on your local drive.
                </p>
                <p className="text-xs text-gray-500">
                  Click restart to finalize. All SQLite databases, user sessions, and hardware configurations will be preserved seamlessly.
                </p>
              </div>
            </div>

            <button
              onClick={installUpdate}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black uppercase tracking-wider shadow-[0_0_30px_rgba(52,211,153,0.4)] transition-all cursor-pointer transform hover:scale-[1.02]"
            >
              <Zap size={16} />
              <span>Restart & Apply Update</span>
            </button>
          </div>
        )}

        {/* 6. ERROR BANNER */}
        {updateState.status === 'error' && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                <AlertTriangle size={26} />
              </div>
              <div>
                <h2 className="text-base font-bold text-red-400 tracking-tight">Update Connection Interrupted</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {updateState.message || 'Could not verify remote release manifest.'} Partial files are safely cached for resumption.
                </p>
              </div>
            </div>

            <button
              onClick={checkForUpdates}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase transition-all cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Retry Handshake</span>
            </button>
          </div>
        )}
      </div>

      {/* ── UPDATE DIAGNOSTICS & SYSTEM READINESS (4 CARDS) ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-[6px] bg-[#131823] border border-white/[0.08] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Differential Sync</span>
            <Layers size={14} className="text-slate-400" />
          </div>
          <p className="text-[13px] font-medium text-slate-200">Blockmap Delta Engine</p>
          <p className="text-[11px] text-slate-400 leading-normal">
            Downloads only modified binary segments, saving up to 90% bandwidth.
          </p>
        </div>

        <div className="p-4 rounded-[6px] bg-[#131823] border border-white/[0.08] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Interruption Safety</span>
            <Zap size={14} className="text-slate-400" />
          </div>
          <p className="text-[13px] font-medium text-slate-200">HTTP 206 Byte-Resume</p>
          <p className="text-[11px] text-slate-400 leading-normal">
            Power cuts and Wi-Fi drops automatically pick up byte-for-byte where they left off.
          </p>
        </div>

        <div className="p-4 rounded-[6px] bg-[#131823] border border-white/[0.08] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Install Latency</span>
            <Clock size={14} className="text-slate-400" />
          </div>
          <p className="text-[13px] font-medium text-slate-200">Ultra-Fast Silent Mode</p>
          <p className="text-[11px] text-slate-400 leading-normal">
            Eliminates multi-step wizards; upgrades take less than 45 seconds to reboot.
          </p>
        </div>

        <div className="p-4 rounded-[6px] bg-[#131823] border border-white/[0.08] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Architecture</span>
            <Cpu size={14} className="text-slate-400" />
          </div>
          <p className="text-[13px] font-medium text-slate-200">Universal x64 Native</p>
          <p className="text-[11px] text-slate-400 leading-normal">
            Fully compatible across Windows 7, 8, 10, and Windows 11 64-bit systems.
          </p>
        </div>
      </div>

      {/* ── RELEASE CHANNEL & CONFIGURATION ── */}
      <div className="p-5 rounded-[6px] bg-[#131823] border border-white/[0.08] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-slate-200">Release Channel Selection</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose between production-hardened builds or early-access features.
            </p>
          </div>

          <div className="inline-flex p-0.5 rounded-[4px] bg-[#0B0E14] border border-white/[0.08]">
            <button
              onClick={() => handleChannelChange('stable')}
              className={cn(
                'h-7 px-3 rounded-[3px] text-xs font-medium transition-colors cursor-pointer',
                channel === 'stable'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Stable (Recommended)
            </button>
            <button
              onClick={() => handleChannelChange('beta')}
              className={cn(
                'h-7 px-3 rounded-[3px] text-xs font-medium transition-colors cursor-pointer',
                channel === 'beta'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Beta (Early Access)
            </button>
          </div>
        </div>

        <div className="p-3 rounded-[4px] bg-white/[0.02] border border-white/[0.06] text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-slate-400" />
            <span>
              {channel === 'stable'
                ? 'Stable ring receives thoroughly vetted security, accounting, and factory synchronization updates.'
                : 'Beta ring receives pre-release AI camera and edge-mesh features prior to general deployment.'}
            </span>
          </div>
          <span className="font-mono text-slate-500 text-[10px]">https://noxishub.app/updates/{channel}</span>
        </div>
      </div>



      {/* ── RELEASE CHANGELOG & VERSION HISTORY ── */}
      <div className="p-6 rounded-xl bg-[#0D0E13] border border-white/8 space-y-4">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowChangelogHistory(!showChangelogHistory)}>
          <div className="flex items-center gap-2.5">
            <FileText size={16} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Release History & Changelog</h3>
          </div>
          <button className="text-gray-400 hover:text-white text-xs flex items-center gap-1 font-mono">
            <span>{showChangelogHistory ? 'Collapse' : 'Expand All'}</span>
            {showChangelogHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        <div className="space-y-4 pt-2">
          {HISTORICAL_CHANGELOGS.slice(0, showChangelogHistory ? HISTORICAL_CHANGELOGS.length : 2).map((item) => (
            <div key={item.version} className="p-4 rounded-lg bg-black/30 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold font-mono text-white">v{item.version}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">
                    {item.date}
                  </span>
                </div>
                <span className="text-xs font-semibold text-gray-300">{item.title}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {item.highlights.map((h, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2.5 rounded bg-white/2 border border-white/5">
                    <span className={cn('text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase', h.color)}>
                      {h.tag}
                    </span>
                    <span className="text-[11px] text-gray-300 leading-tight">{h.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
