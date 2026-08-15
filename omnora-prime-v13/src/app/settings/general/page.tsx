'use client'
import { useState, useEffect } from 'react'
import { Monitor, Power, RefreshCw, Info } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

export default function GeneralSettingsPage() {
  const [autoStartEnabled, setAutoStartEnabledState] =
    useState<boolean | null>(null)
  const [osRegistered, setOsRegistered] =
    useState<boolean>(false)
  const [saving, setSaving] = useState(false)
  const [wasAutoStarted, setWasAutoStarted] =
    useState(false)

  const { success, error } = useToast()

  const isElectron =
    typeof window !== 'undefined' &&
    !!(window as any).electronAPI?.autostart

  useEffect(() => {
    if (!isElectron) {
      // Running in browser/dev — show a note that this is desktop-only
      setAutoStartEnabledState(false)
      return
    }

    const load = async () => {
      const status =
        await (window as any).electronAPI.autostart.get()
      setAutoStartEnabledState(status.enabled)
      setOsRegistered(status.registeredWithOS)

      if ((window as any).electronAPI?.app) {
        const autostarted = await (window as any).electronAPI.app.wasAutoStarted()
        setWasAutoStarted(autostarted)
      }
    }

    load()
  }, [isElectron])

  const handleToggle = async (
    enabled: boolean
  ) => {
    if (!isElectron) return
    setSaving(true)

    try {
      await (window as any).electronAPI.autostart
        .set(enabled)
      setAutoStartEnabledState(enabled)
      setOsRegistered(enabled)

      success(
        enabled
          ? 'Noxis will now open automatically when Windows starts'
          : 'Auto-start disabled'
      )
    } catch (err: any) {
      error('Could not update startup setting')
    } finally {
      setSaving(false)
    }
  }

  if (autoStartEnabled === null) {
    return (
      <div className="p-6 max-w-xl">
        <div className="h-8 w-48 bg-white/5
          animate-pulse rounded-sm" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-xl">
      {/* Page header */}
      <div className="flex items-center
        gap-3 mb-8">
        <Monitor size={20}
          className="text-[#60A5FA]" />
        <div>
          <h1 className="text-xl font-bold
            text-white tracking-tight">
            General Settings
          </h1>
          <p className="text-[10px]
            text-gray-500 mt-0.5">
            System behaviour and startup preferences
          </p>
        </div>
      </div>

      {/* Power cut recovery notice */}
      {wasAutoStarted && (
        <div className="p-4 mb-6
          bg-emerald-500/8 border
          border-emerald-500/20 rounded-sm
          flex items-start gap-3">
          <RefreshCw size={16}
            className="text-emerald-400
              flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold
              text-emerald-400">
              Session recovered automatically
            </p>
            <p className="text-[10px]
              text-gray-500 mt-0.5">
              Noxis detected it was opened by Windows after a restart. All your data is intact.
            </p>
          </div>
        </div>
      )}

      {/* AUTO-START SETTING */}
      <div className="p-5 bg-[#0F1114]
        border border-white/8 rounded-sm
        mb-4">

        {/* Header */}
        <div className="flex items-start
          justify-between gap-4">
          <div className="flex items-start
            gap-3">
            <div className="w-9 h-9
              rounded-sm bg-[#60A5FA]/10
              border border-[#60A5FA]/20
              flex items-center justify-center
              flex-shrink-0 mt-0.5">
              <Power size={16}
                className="text-[#60A5FA]" />
            </div>
            <div>
              <p className="text-sm font-bold
                text-white">
                Open on Windows Startup
              </p>
              <p className="text-[10px]
                text-gray-500 mt-1
                leading-relaxed max-w-xs">
                Noxis Hub opens automatically when this PC starts. After a power cut, your session resumes exactly where you left off — no login, no re-entry.
              </p>
            </div>
          </div>

          {/* Toggle */}
          <button
            onClick={() =>
              handleToggle(!autoStartEnabled)
            }
            disabled={saving || !isElectron}
            className={`
              relative w-12 h-6
              rounded-full transition-all
              duration-200 flex-shrink-0
              disabled:opacity-50
              disabled:cursor-not-allowed
              ${autoStartEnabled
                ? 'bg-[#60A5FA]'
                : 'bg-white/10'}
            `}
          >
            <div className={`
              absolute top-0.5 w-5 h-5
              bg-white rounded-full shadow-sm
              transition-transform duration-200
              ${autoStartEnabled
                ? 'translate-x-6'
                : 'translate-x-0.5'}
            `} />
          </button>
        </div>

        {/* Status line */}
        <div className="mt-4 pt-4 border-t
          border-white/6 flex items-center
          justify-between">
          <div className="flex items-center
            gap-2">
            <div className={`
              w-2 h-2 rounded-full
              ${osRegistered
                ? 'bg-emerald-500'
                : 'bg-gray-700'}
            `} />
            <span className="text-[10px]
              text-gray-600">
              {osRegistered
                ? 'Registered with Windows'
                : 'Not registered with Windows'}
            </span>
          </div>

          {saving && (
            <span className="text-[10px]
              text-gray-600 animate-pulse">
              Updating...
            </span>
          )}
        </div>
      </div>

      {/* Info box */}
      <div className="p-4 bg-[#0A0C0F]
        border border-white/6 rounded-sm
        flex items-start gap-3">
        <Info size={14}
          className="text-gray-600
            flex-shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <p className="text-[10px]
            text-gray-600 leading-relaxed">
            When enabled, Noxis uses two registration methods for reliability: Windows Login Items and the Registry startup key. If one is cleared, the other keeps Noxis starting.
          </p>
          <p className="text-[10px]
            text-gray-600 leading-relaxed">
            Your account stays signed in. If the 4-digit PIN lock is enabled, it will show after restart before resuming your session.
          </p>
          {!isElectron && (
            <p className="text-[10px]
              text-amber-400 mt-2">
              This setting only applies to the Windows desktop app.
            </p>
          )}
        </div>
      </div>

    </div>
  )
}
