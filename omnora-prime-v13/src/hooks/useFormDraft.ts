'use client'
import { useEffect, useRef, useCallback } from 'react'

export function useFormDraft<T = any>(
  key: string,
  data?: T,
  enabled = true
) {
  const saveTimer = useRef<any>(null)
  const isElectron =
    typeof window !== 'undefined' &&
    !!(window as any).electronAPI?.store

  // Auto-save every 5 seconds
  useEffect(() => {
    if (!isElectron || !enabled) return
    if (!data || typeof data !== 'object') return
    if (Object.keys(data as any).length === 0) return

    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
    }

    saveTimer.current = setTimeout(() => {
      ;(window as any).electronAPI.store.saveFormDraft(key, data)
    }, 5000)

    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
      }
    }
  }, [data, key, enabled, isElectron])

  const saveDraft = useCallback(async (draftData: any) => {
    if (!isElectron) return
    if ((window as any).electronAPI?.store?.saveFormDraft) {
      await (window as any).electronAPI.store.saveFormDraft(key, draftData)
    }
  }, [key, isElectron])

  const getDraft = useCallback(async (): Promise<T | null> => {
    if (!isElectron) return null
    if ((window as any).electronAPI?.store?.getFormDraft) {
      return (window as any).electronAPI.store.getFormDraft(key) as Promise<T | null>
    }
    if ((window as any).electronAPI?.store?.getDraft) {
      return (window as any).electronAPI.store.getDraft(key) as Promise<T | null>
    }
    return null
  }, [key, isElectron])

  const clearDraft = useCallback(async () => {
    if (!isElectron) return
    if ((window as any).electronAPI?.store?.clearFormDraft) {
      await (window as any).electronAPI.store.clearFormDraft(key)
    }
  }, [key, isElectron])

  return { getDraft, clearDraft, saveDraft }
}

