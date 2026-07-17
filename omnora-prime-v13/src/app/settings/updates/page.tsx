'use client'
import { useState, useEffect } from 'react'
import { Download, CheckCircle, RefreshCw, Zap, AlertTriangle } from 'lucide-react'

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
}

export default function UpdatesPage() {
  const [updateState, setUpdateState] = useState<UpdateState>({ status: 'idle' })
  const [currentVersion, setCurrentVersion] = useState<string>('...')
  const [channel, setChannel] = useState<'stable' | 'beta'>('stable')

  const isElectron =
    typeof window !== 'undefined' &&
    !!(window as any).electronAPI

  useEffect(() => {
    if (!isElectron) return

    // Get current status
    ;(window as any).electronAPI
      .getUpdateStatus()
      .then((s: any) => {
        setCurrentVersion(s.currentVersion || '?')
        setChannel(
          (window as any).electronAPI
            .channel || 'stable'
        )
        if (s.updateDownloaded) {
          setUpdateState({
            status: 'ready',
            version: s.version,
          })
        } else if (s.updateAvailable) {
          setUpdateState({
            status: 'available',
            version: s.version,
          })
        }
      })

    // Listen for real-time update events
    const cleanup =
      (window as any).electronAPI
        .onUpdateStatus((data: UpdateState) => {
          setUpdateState(data)
        })

    return cleanup
  }, [isElectron])

  const checkForUpdates = async () => {
    if (!isElectron) return
    setUpdateState({ status: 'checking' })
    await (window as any).electronAPI
      .checkForUpdates()
  }

  const downloadUpdate = async () => {
    if (!isElectron) return
    await (window as any).electronAPI
      .downloadUpdate()
  }

  const installUpdate = () => {
    if (!isElectron) return
    if (confirm(
      'Noxis Hub will restart to install the update. Make sure your work is saved.'
    )) {
      ;(window as any).electronAPI
        .installUpdate()
    }
  }

  const handleChannelChange = async (
    newChannel: 'stable' | 'beta'
  ) => {
    setChannel(newChannel)
    if (isElectron) {
      await (window as any).electronAPI
        .setUpdateChannel(newChannel)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`
    }
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const formatSpeed = (bps: number) => {
    if (bps < 1024 * 1024) {
      return `${(bps / 1024).toFixed(0)} KB/s`
    }
    return `${(bps / 1024 / 1024).toFixed(1)} MB/s`
  }

  const LABEL = 'text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5'

  return (
    <div className="p-6 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Zap size={20} className="text-[#60A5FA]" />
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Software Updates
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Current version:{' '}
            <span className="font-mono text-white">
              v{currentVersion}
            </span>
          </p>
        </div>
      </div>

      {/* Update status card */}
      <div className={`p-5 rounded-sm border mb-5 transition-all
        ${updateState.status === 'ready'
          ? 'border-emerald-500/30 bg-emerald-500/8'
          : updateState.status === 'available'
          ? 'border-[#60A5FA]/30 bg-[#60A5FA]/8'
          : updateState.status === 'error'
          ? 'border-red-500/30 bg-red-500/8'
          : 'border-white/8 bg-[#0F1114]'}`}
      >
        {/* IDLE / UP TO DATE */}
        {(updateState.status === 'idle' ||
          updateState.status === 'up-to-date') && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-emerald-500" />
              <div>
                <p className="text-sm font-bold text-white">
                  {updateState.status === 'up-to-date'
                    ? 'You are up to date'
                    : 'Check for updates'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {updateState.status === 'up-to-date'
                    ? `v${currentVersion} is the latest version`
                    : 'Last checked: just now'}
                </p>
              </div>
            </div>
            <button
              onClick={checkForUpdates}
              disabled={!isElectron}
              className="flex items-center gap-2 px-4 py-2 border border-white/10 text-gray-400 text-xs font-semibold hover:border-white/20 disabled:opacity-40 transition-colors"
            >
              <RefreshCw size={12} />
              Check Now
            </button>
          </div>
        )}

        {/* CHECKING */}
        {updateState.status === 'checking' && (
          <div className="flex items-center gap-3">
            <RefreshCw size={20} className="text-[#60A5FA] animate-spin" />
            <div>
              <p className="text-sm font-bold text-white">
                Checking for updates...
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Connecting to Omnora update server
              </p>
            </div>
          </div>
        )}

        {/* UPDATE AVAILABLE */}
        {updateState.status === 'available' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Download size={20} className="text-[#60A5FA]" />
                <div>
                  <p className="text-sm font-bold text-[#60A5FA]">
                    v{updateState.version} available
                  </p>
                  {updateState.releaseName && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {updateState.releaseName}
                    </p>
                  )}
                  {updateState.releaseDate && (
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      Released:{' '}
                      {new Date(
                        updateState.releaseDate
                      ).toLocaleDateString('en-PK')}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={downloadUpdate}
                className="flex items-center gap-2 px-4 py-2 bg-[#60A5FA] text-black text-xs font-bold hover:bg-blue-400 transition-colors"
              >
                <Download size={12} />
                Download
              </button>
            </div>
            {updateState.releaseNotes && (
              <div className="p-3 bg-black/20 rounded-sm text-xs text-gray-400 leading-relaxed">
                {typeof updateState.releaseNotes === 'string'
                  ? updateState.releaseNotes.slice(0, 300)
                  : 'Release notes available'}
              </div>
            )}
          </div>
        )}

        {/* DOWNLOADING */}
        {updateState.status === 'downloading' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Download size={20} className="text-[#60A5FA] animate-bounce" />
              <div className="flex-1">
                <p className="text-sm font-bold text-white">
                  Downloading update...
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Your work is not interrupted — keep using Noxis normally
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-white/8 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-[#60A5FA] rounded-full transition-all duration-300"
                style={{
                  width: `${updateState.percent || 0}%`
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-600">
              <span>
                {(updateState.percent || 0).toFixed(0)}%
              </span>
              <span>
                {updateState.transferred
                  ? formatBytes(updateState.transferred)
                  : '0 MB'}{' '}
                /{' '}
                {updateState.total
                  ? formatBytes(updateState.total)
                  : '?'}
              </span>
              {updateState.bytesPerSecond && (
                <span>
                  {formatSpeed(
                    updateState.bytesPerSecond
                  )}
                </span>
              )}
            </div>
          </div>
        )}

        {/* READY TO INSTALL */}
        {updateState.status === 'ready' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-emerald-500" />
              <div>
                <p className="text-sm font-bold text-emerald-400">
                  v{updateState.version} ready to install
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Downloaded and verified. Restart to apply.
                </p>
              </div>
            </div>
            <button
              onClick={installUpdate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-colors"
            >
              <Zap size={12} />
              Restart & Update
            </button>
          </div>
        )}

        {/* ERROR */}
        {updateState.status === 'error' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="text-red-400" />
              <div>
                <p className="text-sm font-bold text-red-400">
                  Update check failed
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {updateState.message || 'Could not reach update server'}
                </p>
              </div>
            </div>
            <button
              onClick={checkForUpdates}
              className="text-xs text-gray-500 border border-white/10 px-3 py-1.5 hover:border-white/20"
            >
              Retry
            </button>
          </div>
        )}

        {/* DEV MODE */}
        {updateState.status === 'dev' && (
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-amber-500" />
            <p className="text-sm text-amber-400">
              Auto-update disabled in development mode. Build a packaged .exe to test.
            </p>
          </div>
        )}
      </div>

      {/* Update channel */}
      <div className="p-5 bg-[#0F1114] border border-white/8 rounded-sm mb-5">
        <p className={LABEL}>Update Channel</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            {
              value: 'stable',
              label: 'Stable',
              desc: 'Tested releases. Recommended for all users.',
              badge: 'Recommended',
            },
            {
              value: 'beta',
              label: 'Beta',
              desc: 'Early access to new features. May have minor issues.',
              badge: 'Early access',
            },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() =>
                handleChannelChange(opt.value)
              }
              className={`p-3 text-left border rounded-sm transition-all text-xs
                ${channel === opt.value
                  ? 'border-[#60A5FA]/40 bg-[#60A5FA]/8'
                  : 'border-white/8 hover:border-white/18'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className={`font-bold
                  ${channel === opt.value
                    ? 'text-[#60A5FA]'
                    : 'text-white'}`}>
                  {opt.label}
                </p>
                <span className="text-[9px] bg-white/8 text-gray-500 px-1.5 py-0.5 rounded">
                  {opt.badge}
                </span>
              </div>
              <p className="text-[10px] text-gray-600 leading-relaxed">
                {opt.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Version info */}
      <div className="p-5 bg-[#0F1114] border border-white/8 rounded-sm">
        <p className={LABEL}>Version Info</p>
        <div className="space-y-2 text-xs">
          {[
            ['Current version', `v${currentVersion}`],
            ['Update channel', channel],
            ['Auto-check', 'Every 4 hours'],
            ['Update server', 'Omnora R2 CDN'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-gray-600">
                {label}
              </span>
              <span className="text-white font-mono">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
