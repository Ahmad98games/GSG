'use client'
import { useState, useEffect } from 'react'
import { Monitor, Power, RefreshCw, Info, Cpu, HardDrive, Shield, Activity, Zap, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface HardwareInfo {
  platform: string
  osType?: string
  osRelease?: string
  arch?: string
  hostname?: string
  cpuModel?: string
  cpuCores?: number
  cpuSpeedMHz?: number
  totalMemoryGB?: string
  freeMemoryGB?: string
  usedMemoryGB?: string
  processMemoryMB?: string
  uptimeHours?: string
  hwid?: string
  isPackaged?: boolean
  electronVersion?: string
  nodeVersion?: string
}

export default function GeneralSettingsPage() {
  const [autoStartEnabled, setAutoStartEnabledState] = useState<boolean | null>(null)
  const [osRegistered, setOsRegistered] = useState<boolean>(false)
  const [savingAutoStart, setSavingAutoStart] = useState(false)
  const [wasAutoStarted, setWasAutoStarted] = useState(false)

  // Hardware-level Keep-Awake state
  const [keepAwakeEnabled, setKeepAwakeEnabledState] = useState<boolean>(false)
  const [keepAwakeActive, setKeepAwakeActive] = useState<boolean>(false)
  const [savingKeepAwake, setSavingKeepAwake] = useState(false)

  // Real-time Windows Hardware telemetry
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo | null>(null)

  const { success, error } = useToast()

  const isElectron =
    typeof window !== 'undefined' &&
    !!(window as any).electronAPI?.autostart

  useEffect(() => {
    if (!isElectron) {
      setAutoStartEnabledState(false)
      return
    }

    const load = async () => {
      try {
        const api = (window as any).electronAPI

        // 1. Auto-start status
        if (api?.autostart?.get) {
          const status = await api.autostart.get()
          if (typeof status === 'object' && status !== null) {
            setAutoStartEnabledState(!!status.enabled)
            setOsRegistered(!!status.registeredWithOS)
          } else {
            setAutoStartEnabledState(!!status)
            setOsRegistered(!!status)
          }
        }

        // 2. Was auto-started flag
        if (api?.app?.wasAutoStarted) {
          const autostarted = await api.app.wasAutoStarted()
          setWasAutoStarted(!!autostarted)
        }

        // 3. Keep-awake status
        if (api?.system?.getKeepAwake) {
          const ka = await api.system.getKeepAwake()
          if (ka) {
            setKeepAwakeEnabledState(!!ka.enabled)
            setKeepAwakeActive(!!ka.active)
          }
        }

        // 4. Host hardware information
        if (api?.system?.getHardwareInfo) {
          const hw = await api.system.getHardwareInfo()
          if (hw && !hw.error) {
            setHardwareInfo(hw)
          }
        }
      } catch (e) {
        console.error('Failed to load system settings:', e)
      }
    }

    load()
  }, [isElectron])

  const handleAutoStartToggle = async (enabled: boolean) => {
    if (!isElectron) return
    setSavingAutoStart(true)

    try {
      const res = await (window as any).electronAPI.autostart.set(enabled)
      if (res && res.ok !== false) {
        setAutoStartEnabledState(enabled)
        setOsRegistered(res.registeredWithOS !== undefined ? !!res.registeredWithOS : enabled)
        success(
          enabled
            ? 'Noxis registered with Windows — will start automatically on boot'
            : 'Auto-start disabled'
        )
      } else {
        error(res?.error || 'Could not update startup setting')
      }
    } catch (err: any) {
      error('Could not communicate with Windows startup manager')
    } finally {
      setSavingAutoStart(false)
    }
  }

  const handleKeepAwakeToggle = async (enabled: boolean) => {
    if (!isElectron) return
    setSavingKeepAwake(true)

    try {
      const res = await (window as any).electronAPI.system.setKeepAwake(enabled)
      if (res && res.ok !== false) {
        setKeepAwakeEnabledState(enabled)
        setKeepAwakeActive(!!res.active)
        success(
          enabled
            ? 'Windows Sleep Blocker activated — 24/7 Industrial mode enabled'
            : 'Windows power management restored to normal'
        )
      } else {
        error('Failed to configure Windows power management')
      }
    } catch (err: any) {
      error('Could not apply power blocker to Windows kernel')
    } finally {
      setSavingKeepAwake(false)
    }
  }

  if (autoStartEnabled === null) {
    return (
      <div className="p-8 max-w-3xl space-y-4">
        <div className="h-8 w-48 bg-white/5 animate-pulse rounded-sm" />
        <div className="h-32 w-full bg-white/5 animate-pulse rounded-sm" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#60A5FA]/10 border border-[#60A5FA]/20 flex items-center justify-center">
          <Monitor size={20} className="text-[#60A5FA]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            General System Settings
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Windows startup behavior, hardware power execution, and host diagnostics
          </p>
        </div>
      </div>

      {/* Power cut recovery notice */}
      {wasAutoStarted && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-start gap-3">
          <RefreshCw size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-emerald-400">
              Session Resumed Automatically via Windows Boot
            </p>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              Noxis Hub detected it was launched by Windows after a machine restart or power event. Local SQLite database and UI states are preserved.
            </p>
          </div>
        </div>
      )}

      {/* 1. WINDOWS AUTO-START SETTING */}
      <div className="p-5 bg-[#0F1114] border border-white/10 rounded-lg shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-md bg-[#60A5FA]/10 border border-[#60A5FA]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Power size={18} className="text-[#60A5FA]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white">
                  Open on Windows Startup
                </p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">
                  Native Windows OS
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-md">
                Noxis Hub registers directly with Windows registry and startup items. After a PC reboot or power event, the software boots up automatically without manual intervention.
              </p>
            </div>
          </div>

          {/* Toggle */}
          <button
            type="button"
            onClick={() => handleAutoStartToggle(!autoStartEnabled)}
            disabled={savingAutoStart || !isElectron}
            aria-label="Toggle Windows Startup"
            className={`
              relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0
              disabled:opacity-50 disabled:cursor-not-allowed
              ${autoStartEnabled ? 'bg-[#60A5FA]' : 'bg-white/10'}
            `}
          >
            <div
              className={`
                absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200
                ${autoStartEnabled ? 'translate-x-6' : 'translate-x-0.5'}
              `}
            />
          </button>
        </div>

        {/* Status Line */}
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                osRegistered ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-gray-600'
              }`}
            />
            <span className="text-xs font-medium text-gray-400">
              {osRegistered ? 'Registered with Windows Startup Registry' : 'Not registered with Windows'}
            </span>
          </div>

          {savingAutoStart && (
            <span className="text-xs text-[#60A5FA] animate-pulse">
              Syncing with Windows...
            </span>
          )}
        </div>
      </div>

      {/* 2. INDUSTRIAL HARDWARE 24/7 KEEP-AWAKE */}
      <div className="p-5 bg-[#0F1114] border border-white/10 rounded-lg shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap size={18} className="text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white">
                  Industrial 24/7 Factory Keep-Awake
                </p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  Kernel Power Blocker
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-md">
                Blocks Windows from suspending operations, putting network interfaces to sleep, or throttling background mesh replication during factory and retail shifts.
              </p>
            </div>
          </div>

          {/* Toggle */}
          <button
            type="button"
            onClick={() => handleKeepAwakeToggle(!keepAwakeEnabled)}
            disabled={savingKeepAwake || !isElectron}
            aria-label="Toggle Industrial Keep-Awake"
            className={`
              relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0
              disabled:opacity-50 disabled:cursor-not-allowed
              ${keepAwakeEnabled ? 'bg-amber-500' : 'bg-white/10'}
            `}
          >
            <div
              className={`
                absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200
                ${keepAwakeEnabled ? 'translate-x-6' : 'translate-x-0.5'}
              `}
            />
          </button>
        </div>

        {/* Status Line */}
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                keepAwakeActive ? 'bg-amber-400 shadow-sm shadow-amber-400/50' : 'bg-gray-600'
              }`}
            />
            <span className="text-xs font-medium text-gray-400">
              {keepAwakeActive
                ? 'Windows Sleep Suspended (Active 24/7 Execution)'
                : 'Default Windows Power Policy'}
            </span>
          </div>

          {savingKeepAwake && (
            <span className="text-xs text-amber-400 animate-pulse">
              Requesting Windows kernel...
            </span>
          )}
        </div>
      </div>

      {/* 3. DIRECT WINDOWS HARDWARE TELEMETRY */}
      {hardwareInfo && (
        <div className="p-5 bg-[#0F1114] border border-white/10 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <Activity size={18} className="text-[#60A5FA]" />
              <h2 className="text-sm font-bold text-white">
                Windows Hardware & Host Telemetry
              </h2>
            </div>
            <span className="text-[10px] text-gray-500 font-mono">
              Direct OS Interface
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Host PC & OS */}
            <div className="p-3 bg-black/30 border border-white/5 rounded-md flex items-start gap-3">
              <Cpu size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Processor & Host</span>
                <p className="font-semibold text-white truncate" title={hardwareInfo.cpuModel}>
                  {hardwareInfo.cpuModel || 'x64 Multi-Core Processor'}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {hardwareInfo.cpuCores} Cores · {hardwareInfo.arch} · {hardwareInfo.hostname}
                </p>
              </div>
            </div>

            {/* OS Version & Build */}
            <div className="p-3 bg-black/30 border border-white/5 rounded-md flex items-start gap-3">
              <Monitor size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Operating System</span>
                <p className="font-semibold text-white">
                  Windows NT (Build {hardwareInfo.osRelease})
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Platform: {hardwareInfo.platform} · Packaged: {hardwareInfo.isPackaged ? 'Production' : 'Dev'}
                </p>
              </div>
            </div>

            {/* RAM Meter */}
            <div className="p-3 bg-black/30 border border-white/5 rounded-md flex items-start gap-3">
              <HardDrive size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 w-full">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Host Physical Memory</span>
                <div className="flex justify-between items-center mt-0.5">
                  <p className="font-semibold text-white">
                    {hardwareInfo.usedMemoryGB} GB / {hardwareInfo.totalMemoryGB} GB
                  </p>
                  <span className="text-[10px] text-gray-400">
                    {hardwareInfo.freeMemoryGB} GB free
                  </span>
                </div>
                {/* Visual Bar */}
                <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-[#60A5FA] rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (parseFloat(hardwareInfo.usedMemoryGB || '0') /
                            parseFloat(hardwareInfo.totalMemoryGB || '1')) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* HWID & ERP Runtime */}
            <div className="p-3 bg-black/30 border border-white/5 rounded-md flex items-start gap-3">
              <Shield size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Hardware Bonded ID (HWID)</span>
                <p className="font-mono text-emerald-400 font-semibold truncate text-[11px] mt-0.5" title={hardwareInfo.hwid}>
                  {hardwareInfo.hwid || 'Verified Hardware Fingerprint'}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Uptime: {hardwareInfo.uptimeHours} hrs · Process Heap: {hardwareInfo.processMemoryMB} MB
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Notice */}
      <div className="p-4 bg-[#0A0C0F] border border-white/5 rounded-lg flex items-start gap-3">
        <Info size={16} className="text-gray-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1.5 text-xs text-gray-400 leading-relaxed">
          <p>
            Noxis Hub integrates directly with Windows subsystem architecture. Startup preferences and hardware power policies are written directly to local host configuration and preserved across software updates.
          </p>
          {!isElectron && (
            <p className="text-amber-400 font-medium">
              Note: Windows hardware integration is active when running the desktop application.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
