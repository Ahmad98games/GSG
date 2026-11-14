'use client'
import React, { useState, useEffect } from 'react'
import { isMeaningfulDraftData, DRAFT_REGISTRY } from '@/hooks/useFormDraft'
import { AutoStartRecoveryBanner } from '@/components/ui/AutoStartRecoveryBanner'

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

  const items = Array.isArray(draftData?.items) ? draftData.items : (Array.isArray(draftData?.cart) ? draftData.cart : [])
  const itemCount = items.length || 0
  const totalAmount = items.reduce((acc: number, it: any) => {
    const q = Number(it.quantity || it.qty || 1)
    const p = Number(it.unit_price || it.price || it.unitPrice || 0)
    return acc + (it.lineTotal || it.line_total || (q * p))
  }, 0) || Number(draftData?.total_amount || draftData?.total || draftData?.amount || 0)

  return (
    <AutoStartRecoveryBanner
      itemCount={itemCount > 0 ? itemCount : undefined}
      totalAmount={totalAmount > 0 ? totalAmount : undefined}
      entityLabel={draftKey.replace('-new', '').replace('_', ' ')}
      onResume={() => {
        if (draftData) onRecover(draftData)
        setDraftFound(false)
      }}
      onDiscard={async () => {
        try {
          localStorage.removeItem('noxis_draft_' + draftKey)
          if (typeof window !== 'undefined' && (window as any).electronAPI?.store?.clearFormDraft) {
            await (window as any).electronAPI.store.clearFormDraft(draftKey)
          }
        } catch {}
        onDiscard()
        setDraftFound(false)
      }}
    />
  )
}

export default DraftRecoveryBanner
