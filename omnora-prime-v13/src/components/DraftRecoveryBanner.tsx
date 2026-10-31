'use client'
import { useState, useEffect } from 'react'
import { RotateCcw, X, CheckCircle2 } from 'lucide-react'
import { isMeaningfulDraftData } from '@/hooks/useFormDraft'

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
  const [draftData, setDraftData] = useState<any>(null)

  useEffect(() => {
    const check = async () => {
      let found: any = null

      // 1. Electron Store
      if (typeof window !== 'undefined' && (window as any).electronAPI?.store) {
        const store = (window as any).electronAPI.store
        try {
          found = store.getFormDraft ? await store.getFormDraft(draftKey) : (store.getDraft ? await store.getDraft(draftKey) : null)
        } catch {}
      }

      // 2. LocalStorage
      if (!found && typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('noxis_draft_' + draftKey)
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed?.data) found = parsed.data
          }
        } catch {}
      }

      if (found && isMeaningfulDraftData(draftKey, found)) {
        setDraftData(found)
        setDraftFound(true)
      } else {
        setDraftFound(false)
      }
    }

    check()
  }, [draftKey])

  if (!draftFound) return null

  return (
    <div className="flex items-center justify-between p-3 mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg shadow-sm animate-in fade-in duration-200">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
          <RotateCcw size={14} className="animate-spin-slow" />
        </div>
        <div>
          <p className="text-xs font-bold text-amber-400">
            Unsaved Work Restored / Preserved
          </p>
          <p className="text-[10px] text-zinc-400">
            Recovered from unexpected shutdown. Continue your entry or discard to start fresh.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (draftData) onRecover(draftData)
            setDraftFound(false)
          }}
          className="text-xs font-bold text-amber-300 px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 rounded hover:bg-amber-500/30 transition-colors cursor-pointer"
        >
          Re-apply Draft
        </button>
        <button
          type="button"
          onClick={async () => {
            try {
              localStorage.removeItem('noxis_draft_' + draftKey)
              if (typeof window !== 'undefined' && (window as any).electronAPI?.store?.clearFormDraft) {
                await (window as any).electronAPI.store.clearFormDraft(draftKey)
              }
            } catch {}
            onDiscard()
            setDraftFound(false)
          }}
          className="text-xs font-medium text-zinc-400 hover:text-red-400 px-2 py-1.5 rounded hover:bg-red-500/10 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <X size={13} />
          <span>Discard</span>
        </button>
      </div>
    </div>
  )
}
