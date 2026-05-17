'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function UpdateBanner() {
  const [updateInfo, setUpdateInfo] = useState<{
    version: string
  } | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [readyToInstall, setReadyToInstall] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Only in Electron
    const electron = (window as any).electronWindow
    if (!electron || !electron.onUpdateAvailable) return

    const unsubAvailable = electron.onUpdateAvailable((info: any) => {
      setUpdateInfo(info)
    })

    const unsubProgress = electron.onUpdateProgress((p: any) => {
      setProgress(Math.round(p.percent))
    })

    const unsubDownloaded = electron.onUpdateDownloaded((info: any) => {
      setUpdateInfo(info)
      setReadyToInstall(true)
      setProgress(null)
    })

    return () => {
      unsubAvailable?.()
      unsubProgress?.()
      unsubDownloaded?.()
    }
  }, [])

  if (!updateInfo || dismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 40, opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="relative w-full flex items-center justify-between px-4 text-xs bg-[#1a2010] border-b border-green-900/50 z-50"
      >
        <span className="text-green-400 font-medium">
          {readyToInstall
            ? `Noxis v${updateInfo.version} ready to install`
            : progress !== null
            ? `Downloading update... ${progress}%`
            : `Noxis v${updateInfo.version} available`
          }
        </span>
        
        <div className="flex items-center gap-3">
          {readyToInstall && (
            <button
              onClick={() => {
                ;(window as any).electronWindow.installUpdate()
              }}
              className="px-3 py-1 bg-green-600 text-white text-[10px] uppercase tracking-wider font-bold hover:bg-green-500 transition-colors rounded-sm"
            >
              Restart & Install
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
        
        {/* Download progress bar */}
        {progress !== null && (
          <motion.div
            className="absolute bottom-0 left-0 h-[2px] bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
