'use client'

import React, { useState, useEffect } from 'react'
import { Download, RefreshCw, CheckCircle, X } from 'lucide-react'

export function UpdateNotification() {
  const [state, setState] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error'>('idle')
  const [info, setInfo] = useState<{
    version?: string
    releaseNotes?: string
    percent?: number
    error?: string
  }>({})
  const [dismissed, setDismissed] = useState(false)

  const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI?.update

  useEffect(() => {
    if (!isElectron) return

    const unsubChecking = (window as any).electronAPI.update.onChecking(() => setState('checking'))

    const unsubAvailable = (window as any).electronAPI.update.onAvailable((i: any) => {
      setState('available')
      setInfo({
        version: i.version,
        releaseNotes: i.releaseNotes,
      })
      setDismissed(false)
    })

    const unsubProgress = (window as any).electronAPI.update.onProgress((p: any) => {
      setState('downloading')
      setInfo(prev => ({
        ...prev,
        percent: p.percent,
      }))
    })

    const unsubDownloaded = (window as any).electronAPI.update.onDownloaded((i: any) => {
      setState('ready')
      setInfo(prev => ({
        ...prev,
        version: i.version,
      }))
    })

    const unsubError = (window as any).electronAPI.update.onError((err: string) => {
      setState('error')
      setInfo({ error: err })
    })

    const unsubSaveState = (window as any).electronAPI.update.onSaveState(async () => {
      await new Promise(r => setTimeout(r, 500))
    })

    return () => {
      if (typeof unsubChecking === 'function') unsubChecking()
      if (typeof unsubAvailable === 'function') unsubAvailable()
      if (typeof unsubProgress === 'function') unsubProgress()
      if (typeof unsubDownloaded === 'function') unsubDownloaded()
      if (typeof unsubError === 'function') unsubError()
      if (typeof unsubSaveState === 'function') unsubSaveState()
    }
  }, [isElectron])

  const handleInstall = async () => {
    await (window as any).electronAPI.update.install()
  }

  if (state === 'idle' || state === 'checking' || state === 'error' || dismissed) return null

  if (state === 'downloading') {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-[#0F1114] border border-white/10 rounded-sm p-4 w-72 shadow-[0_8px_32px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-2 mb-3">
          <Download size={14} className="text-[#60A5FA] animate-bounce" />
          <p className="text-xs font-semibold text-white">Downloading v{info.version}...</p>
          <span className="ml-auto text-xs text-gray-400 font-mono">{info.percent}%</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#60A5FA] rounded-full transition-all duration-300"
            style={{ width: `${info.percent || 0}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-2">This happens in the background. Keep working.</p>
      </div>
    )
  }

  if (state === 'ready') {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-[#0F1114] border border-emerald-500/30 rounded-sm p-4 w-72 shadow-[0_8px_32px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-2 duration-300">
        <button onClick={() => setDismissed(true)} className="absolute top-3 right-3 text-gray-500 hover:text-white">
          <X size={12} />
        </button>

        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 rounded-sm bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Noxis v{info.version} ready</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Update downloaded. Install when you are ready — takes 10 seconds.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors rounded-sm"
          >
            <RefreshCw size={11} /> Restart & Update
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="px-3 py-2 border border-white/10 text-gray-400 text-xs hover:border-white/20 transition-colors rounded-sm"
          >
            Later
          </button>
        </div>
      </div>
    )
  }

  return null
}
