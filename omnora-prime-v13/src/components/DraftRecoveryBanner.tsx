'use client'
import { useState, useEffect } from 'react'
import { RotateCcw, X } from 'lucide-react'

export function DraftRecoveryBanner({
  draftKey,
  onRecover,
  onDiscard,
}: {
  draftKey: string
  onRecover: (data: any) => void
  onDiscard: () => void
}) {
  const [draftFound, setDraftFound] = useState(false)
  const isElectron =
    typeof window !== 'undefined' &&
    !!(window as any).electronAPI?.store

  useEffect(() => {
    if (!isElectron) return

    const check = async () => {
      const draft = await (window as any).electronAPI.store.getFormDraft(draftKey)
      if (draft) {
        setDraftFound(true)
      }
    }

    check()
  }, [draftKey, isElectron])

  if (!draftFound) return null

  return (
    <div className="flex items-center justify-between p-3 mb-4 bg-amber-500/8 border border-amber-500/25 rounded-sm">
      <div className="flex items-center gap-2">
        <RotateCcw size={14} className="text-amber-400 flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-amber-400">
            Unsaved draft found
          </p>
          <p className="text-[10px] text-gray-400">
            Power went out? Recover your last entry.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={async () => {
            const data = await (window as any).electronAPI?.store.getFormDraft(draftKey)
            if (data) onRecover(data)
            setDraftFound(false)
          }}
          className="text-xs font-bold text-amber-400 px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
        >
          Recover
        </button>
        <button
          onClick={async () => {
            await (window as any).electronAPI?.store.clearFormDraft(draftKey)
            onDiscard()
            setDraftFound(false)
          }}
          className="text-gray-400 hover:text-gray-200"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
