'use client'
import { useState, useEffect } from 'react'
import { RefreshCw, X } from 'lucide-react'

export function AutoStartRecoveryBanner() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const check = async () => {
      if (!(window as any).electronAPI?.app) return

      const autostarted = await (window as any).electronAPI.app.wasAutoStarted()

      if (autostarted && !dismissed) {
        // Small delay so UI renders first
        setTimeout(() => setShow(true), 1500)
      }
    }

    check()
  }, [dismissed])

  if (!show || dismissed) return null

  return (
    <div className="mx-6 mb-4 p-3
      bg-emerald-500/8 border
      border-emerald-500/20 rounded-sm
      flex items-center justify-between
      animate-in slide-in-from-top-2
      duration-300">
      <div className="flex items-center
        gap-2.5">
        <RefreshCw size={14}
          className="text-emerald-400
            flex-shrink-0" />
        <div>
          <p className="text-xs font-bold
            text-emerald-400">
            Session recovered automatically
          </p>
          <p className="text-[10px]
            text-gray-500">
            Noxis opened after Windows started. All data is intact — continue from where you left off.
          </p>
        </div>
      </div>
      <button
        onClick={() => {
          setDismissed(true)
          setShow(false)
        }}
        className="text-gray-600
          hover:text-gray-400 ml-4 flex-shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  )
}
