'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, RefreshCw, Sparkles, X, ArrowRight, CheckCircle2 } from 'lucide-react'

export function UpdateBanner() {
  const [updateInfo, setUpdateInfo] = useState<{
    version: string
    releaseNotes?: string
  } | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [readyToInstall, setReadyToInstall] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const electron = (window as any).electronWindow || (window as any).electronAPI

    if (!electron) return

    let unsubAvailable: (() => void) | undefined
    let unsubProgress: (() => void) | undefined
    let unsubDownloaded: (() => void) | undefined

    if (electron.onUpdateAvailable) {
      unsubAvailable = electron.onUpdateAvailable((info: any) => {
        setUpdateInfo(info)
      })
    }

    if (electron.onUpdateProgress) {
      unsubProgress = electron.onUpdateProgress((p: any) => {
        setProgress(Math.round(p.percent))
      })
    }

    if (electron.onUpdateDownloaded) {
      unsubDownloaded = electron.onUpdateDownloaded((info: any) => {
        setUpdateInfo(info)
        setReadyToInstall(true)
        setProgress(null)
      })
    }

    return () => {
      unsubAvailable?.()
      unsubProgress?.()
      unsubDownloaded?.()
    }
  }, [])

  const handleInstall = () => {
    const electron = (window as any).electronWindow || (window as any).electronAPI
    if (electron?.installUpdate) {
      electron.installUpdate()
    }
  }

  if (!updateInfo || dismissed) return null

  const isV13Series = updateInfo.version?.startsWith('13.')

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="relative w-full bg-[#0E1520] border-b border-cyan-500/30 px-4 py-2.5 text-xs z-[60] shadow-lg flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 text-cyan-400">
            {readyToInstall ? (
              <CheckCircle2 size={13} className="text-emerald-400" />
            ) : progress !== null ? (
              <RefreshCw size={13} className="animate-spin text-cyan-400" />
            ) : (
              <Sparkles size={13} className="text-amber-400" />
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              {readyToInstall
                ? `Noxis Hub v${updateInfo.version} Ready to Apply`
                : progress !== null
                ? `Downloading Noxis Hub v${updateInfo.version}... (${progress}%)`
                : `New Software Update: Noxis Hub v${updateInfo.version} Available`}
            </span>

            {isV13Series && (
              <span className="text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded uppercase">
                v13 Core Engine
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          {readyToInstall ? (
            <button
              type="button"
              onClick={handleInstall}
              className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-400 text-black text-[10px] uppercase tracking-wider font-black hover:brightness-110 transition-all rounded shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center gap-1 cursor-pointer"
            >
              <span>Restart &amp; Install Now</span>
              <ArrowRight size={11} />
            </button>
          ) : progress === null ? (
            <span className="text-[10px] text-slate-400 hidden sm:inline-block">
              Downloading background patch...
            </span>
          ) : null}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            title="Dismiss update notice"
            className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
          >
            <X size={14} />
          </button>
        </div>

        {/* Download progress bar */}
        {progress !== null && (
          <motion.div
            className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-cyan-500 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
