'use client'
import { useEffect, useRef, useCallback } from 'react'

const DRAFT_PREFIX = 'noxis_draft_'

export interface SavedDraftInfo {
  key: string
  label: string
  route: string
  savedAt: number
  itemCount?: number
  preview?: string
  data: any
}

// Map known draft keys to user-friendly titles and target navigation routes
export const DRAFT_REGISTRY: Record<string, { label: string; route: string; getSummary?: (data: any) => { itemCount?: number; preview?: string } }> = {
  pos_cart: {
    label: 'POS Register (Active Cart)',
    route: '/pos',
    getSummary: (d) => {
      const items = Array.isArray(d) ? d : (d?.items || [])
      const count = items.reduce((acc: number, item: any) => acc + (item.quantity || item.qty || 1), 0)
      const total = items.reduce((acc: number, item: any) => acc + (Number(item.price || item.unit_price || 0) * (item.quantity || item.qty || 1)), 0)
      return {
        itemCount: count,
        preview: `${items.length} product(s) · PKR ${total.toLocaleString()}`
      }
    }
  },
  'khata-entry': {
    label: 'Khata Ledger Entry',
    route: '/khata',
    getSummary: (d) => ({
      preview: `${d?.type === 'money_in' ? 'Receipt' : 'Payment'} · PKR ${Number(d?.amount || 0).toLocaleString()} ${d?.description ? `(${d.description})` : ''}`
    })
  },
  'inventory-new': {
    label: 'New Inventory Item / SKU',
    route: '/inventory/new',
    getSummary: (d) => ({
      preview: `${d?.name || 'Unnamed Product'} ${d?.sku ? `· SKU: ${d.sku}` : ''}`
    })
  },
  'parties-new': {
    label: 'New Customer / Supplier Profile',
    route: '/parties/new',
    getSummary: (d) => ({
      preview: `${d?.name || 'Unnamed Party'} ${d?.party_type ? `(${d.party_type})` : ''}`
    })
  },
  'party-new': {
    label: 'New Customer / Supplier Profile',
    route: '/parties/new',
    getSummary: (d) => ({
      preview: `${d?.name || 'Unnamed Party'} ${d?.party_type ? `(${d.party_type})` : ''}`
    })
  },
  'karigar-new': {
    label: 'New Karigar / Craftsman Profile',
    route: '/karigars/new',
    getSummary: (d) => ({
      preview: `${d?.name || 'Karigar'} · ${d?.specialty || d?.phone || 'Textile unit'}`
    })
  },
  'invoice-new': {
    label: 'Sales Invoice / Bill',
    route: '/invoices/new',
    getSummary: (d) => ({
      preview: `Bill to: ${d?.party_search || d?.customer_name || (d?.party_id ? 'Customer' : 'Pending')} · ${d?.items?.length || 0} line items`
    })
  },
  'recurring-invoice-new': {
    label: 'Recurring Order Template',
    route: '/invoices/recurring/new',
    getSummary: (d) => ({
      preview: `Template: ${d?.template_name || 'Scheduled Order'}`
    })
  },
  'purchase-new': {
    label: 'Purchase Order / Supplier Bill',
    route: '/purchase/new',
    getSummary: (d) => ({
      preview: `Supplier bill · ${d?.items?.length || 0} items`
    })
  },
  'purchase-new-po': {
    label: 'Purchase Order / Supplier Bill',
    route: '/purchase/new',
    getSummary: (d) => ({
      preview: `Supplier bill · ${d?.items?.length || 0} items`
    })
  }
}

/**
 * Checks whether form data contains real user input.
 * Prevents initial/empty form state from overwriting a preserved recovery draft.
 */
export function isMeaningfulDraftData(key: string, data: any): boolean {
  if (!data || typeof data !== 'object') return false

  if (key === 'invoice-new' || key === 'recurring-invoice-new') {
    const hasParty = !!(data.party_id && String(data.party_id).trim() !== '') || 
                     !!(data.party_search && String(data.party_search).trim() !== '')
    const items = Array.isArray(data.items) ? data.items : []
    const hasItems = items.some((i: any) => 
      (i.description && String(i.description).trim() !== '') ||
      (i.sku_id && String(i.sku_id).trim() !== '') ||
      (Number(i.unit_price) > 0) ||
      (Number(i.price) > 0)
    ) || items.length > 1
    const hasDiscount = Number(data.discount_pct || 0) > 0
    return hasParty || hasItems || hasDiscount
  }

  if (key === 'pos_cart') {
    const items = Array.isArray(data) ? data : (data?.items || [])
    return items.length > 0
  }

  if (key === 'khata-entry') {
    return Number(data.amount) > 0 || 
           !!(data.description && String(data.description).trim() !== '') || 
           !!(data.party_id && String(data.party_id).trim() !== '')
  }

  if (key === 'inventory-new') {
    return !!(data.name && String(data.name).trim() !== '') || 
           !!(data.sku && String(data.sku).trim() !== '') || 
           Number(data.sale_price || 0) > 0 || 
           Number(data.cost_price || 0) > 0
  }

  if (key === 'parties-new' || key === 'party-new') {
    return !!(data.name && String(data.name).trim() !== '') || 
           !!(data.phone && String(data.phone).trim() !== '') ||
           !!(data.address && String(data.address).trim() !== '')
  }

  if (key === 'karigar-new') {
    return !!(data.name && String(data.name).trim() !== '') || 
           !!(data.phone && String(data.phone).trim() !== '')
  }

  if (key === 'purchase-new' || key === 'purchase-new-po') {
    const items = Array.isArray(data.items) ? data.items : []
    return !!(data.selectedSupplierId && String(data.selectedSupplierId).trim() !== '') || 
           items.length > 0 || 
           !!(data.notes && String(data.notes).trim() !== '')
  }

  // Fallback: check if any non-boilerplate field is populated
  const boilerplate = [
    'currency', 'payment_terms', 'exchange_rate', 'issue_date', 
    'due_date', 'tax_pct', 'discount_pct', 'is_blocked', 'current_balance'
  ]
  for (const [k, v] of Object.entries(data)) {
    if (boilerplate.includes(k)) continue
    if (typeof v === 'string' && v.trim() !== '') return true
    if (typeof v === 'number' && v > 0) return true
    if (Array.isArray(v) && v.length > 0) return true
    if (typeof v === 'object' && v !== null && Object.keys(v).length > 0) return true
  }

  return false
}

export function useFormDraft<T = any>(
  key: string,
  data?: T,
  enabled = true
) {
  const saveTimer = useRef<any>(null)
  const latestDataRef = useRef<T | undefined>(data)
  latestDataRef.current = data

  const isElectron =
    typeof window !== 'undefined' &&
    !!(window as any).electronAPI?.store

  // Immediate flush helper
  const flushImmediately = useCallback((d: any) => {
    if (!d || typeof d !== 'object') return
    if (Object.keys(d as any).length === 0) return
    if (!isMeaningfulDraftData(key, d)) {
      // Guard against initial default blank forms overwriting saved drafts!
      return
    }

    // 1. LocalStorage mirror for zero-loss recovery
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(DRAFT_PREFIX + key, JSON.stringify({ data: d, savedAt: Date.now() }))
      } catch {}
    }

    // 2. Electron Store
    if (isElectron && (window as any).electronAPI?.store?.saveFormDraft) {
      (window as any).electronAPI.store.saveFormDraft(key, d).catch(() => {})
    }
  }, [key, isElectron])

  // Fast 1200ms debounce auto-save
  useEffect(() => {
    if (!enabled || !data || typeof data !== 'object') return
    if (Object.keys(data as any).length === 0) return
    if (!isMeaningfulDraftData(key, data)) return

    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
    }

    saveTimer.current = setTimeout(() => {
      flushImmediately(data)
    }, 1200)

    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
      }
    }
  }, [data, key, enabled, flushImmediately])

  // Emergency flush on beforeunload / window crash / power cut
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleUnload = () => {
      if (latestDataRef.current) {
        flushImmediately(latestDataRef.current)
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [flushImmediately])

  const saveDraft = useCallback(async (draftData: any) => {
    flushImmediately(draftData)
  }, [flushImmediately])

  const getDraft = useCallback(async (): Promise<T | null> => {
    // 1. Check Electron Store first
    if (isElectron) {
      const store = (window as any).electronAPI?.store
      try {
        const d = store?.getFormDraft ? await store.getFormDraft(key) : (store?.getDraft ? await store.getDraft(key) : null)
        if (d && isMeaningfulDraftData(key, d)) return d as T
      } catch {}
    }

    // 2. Fallback to LocalStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(DRAFT_PREFIX + key)
        if (raw) {
          const parsed = JSON.parse(raw)
          // Valid up to 7 days
          if (parsed?.data && Date.now() - (parsed.savedAt || 0) < 86400000 * 7) {
            if (isMeaningfulDraftData(key, parsed.data)) {
              return parsed.data as T
            }
          }
        }
      } catch {}
    }

    // 3. Fallback to raw Electron store data if it existed
    if (isElectron) {
      const store = (window as any).electronAPI?.store
      try {
        const d = store?.getFormDraft ? await store.getFormDraft(key) : (store?.getDraft ? await store.getDraft(key) : null)
        if (d && typeof d === 'object') return d as T
      } catch {}
    }

    return null
  }, [key, isElectron])

  const clearDraft = useCallback(async () => {
    // Clear from LocalStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(DRAFT_PREFIX + key)
      } catch {}
    }

    // Clear from Electron Store
    if (isElectron && (window as any).electronAPI?.store?.clearFormDraft) {
      try {
        await (window as any).electronAPI.store.clearFormDraft(key)
      } catch {}
    }
  }, [key, isElectron])

  return { getDraft, clearDraft, saveDraft }
}

/**
 * Scan all pending drafts from Electron store and LocalStorage
 */
export async function getAllActiveDrafts(): Promise<SavedDraftInfo[]> {
  const result: Record<string, SavedDraftInfo> = {}
  const now = Date.now()
  const maxAge = 86400000 * 7 // 7 days

  // 1. Scan from LocalStorage
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith(DRAFT_PREFIX)) {
          const draftKey = k.slice(DRAFT_PREFIX.length)
          const raw = localStorage.getItem(k)
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed?.data && now - (parsed.savedAt || 0) < maxAge && isMeaningfulDraftData(draftKey, parsed.data)) {
              const reg = DRAFT_REGISTRY[draftKey] || {
                label: `Draft: ${draftKey}`,
                route: `/${draftKey.replace('-', '/')}`
              }
              const summary = reg.getSummary ? reg.getSummary(parsed.data) : {}
              result[draftKey] = {
                key: draftKey,
                label: reg.label,
                route: reg.route,
                savedAt: parsed.savedAt || now,
                preview: summary.preview,
                itemCount: summary.itemCount,
                data: parsed.data
              }
            }
          }
        }
      }
    } catch {}
  }

  // 2. Scan from Electron Store
  if (typeof window !== 'undefined' && (window as any).electronAPI?.store?.getAllFormDrafts) {
    try {
      const electronDrafts = await (window as any).electronAPI.store.getAllFormDrafts()
      if (electronDrafts && typeof electronDrafts === 'object') {
        for (const [draftKey, obj] of Object.entries(electronDrafts)) {
          const val = obj as any
          if (val?.data && now - (val.savedAt || 0) < maxAge && isMeaningfulDraftData(draftKey, val.data)) {
            const reg = DRAFT_REGISTRY[draftKey] || {
              label: `Draft: ${draftKey}`,
              route: `/${draftKey.replace('-', '/')}`
            }
            const summary = reg.getSummary ? reg.getSummary(val.data) : {}
            result[draftKey] = {
              key: draftKey,
              label: reg.label,
              route: reg.route,
              savedAt: val.savedAt || now,
              preview: summary.preview,
              itemCount: summary.itemCount,
              data: val.data
            }
          }
        }
      }
    } catch {}
  }

  return Object.values(result).sort((a, b) => b.savedAt - a.savedAt)
}
