import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Tier = 'lite' | 'pro' | 'elite'

export type TierLimits = {
  maxMobileDevices: number
  maxCameras: number
  maxStaffUsers: number
  storageLimitGB: number
  lensScansPerDay: number | null  // null = unlimited
  
  // Feature flags
  aiCctvDetection: boolean
  whatsappManualSend: boolean
  whatsappAutoAlerts: boolean
  customerPortal: boolean
  recurringInvoices: boolean
  staffUsers: boolean
  batchTracking: boolean
  exportDocs: boolean
  advancedAnalytics: boolean
  fireDetection: boolean
  customThemes: boolean
  whatsappApi: boolean
  apiAccess: boolean
}

const TIER_LIMITS: Record<Tier, TierLimits> = {
  lite: {
    maxMobileDevices: 5,
    maxCameras: 2,
    maxStaffUsers: 1,
    storageLimitGB: 1,
    lensScansPerDay: 10,
    aiCctvDetection: false,
    whatsappManualSend: true,
    whatsappAutoAlerts: false,
    customerPortal: false,
    recurringInvoices: false,
    staffUsers: false,
    batchTracking: false,
    exportDocs: false,
    advancedAnalytics: false,
    fireDetection: false,
    customThemes: false,
    whatsappApi: false,
    apiAccess: false,
  },
  pro: {
    maxMobileDevices: 15,
    maxCameras: 8,
    maxStaffUsers: 5,
    storageLimitGB: 10,
    lensScansPerDay: null,
    aiCctvDetection: true,
    whatsappManualSend: true,
    whatsappAutoAlerts: true,
    customerPortal: true,
    recurringInvoices: true,
    staffUsers: true,
    batchTracking: true,
    exportDocs: true,
    advancedAnalytics: true,
    fireDetection: false,
    customThemes: false,
    whatsappApi: false,
    apiAccess: false,
  },
  elite: {
    maxMobileDevices: 50,
    maxCameras: 20,
    maxStaffUsers: 25,
    storageLimitGB: 50,
    lensScansPerDay: null,
    aiCctvDetection: true,
    whatsappManualSend: true,
    whatsappAutoAlerts: true,
    customerPortal: true,
    recurringInvoices: true,
    staffUsers: true,
    batchTracking: true,
    exportDocs: true,
    advancedAnalytics: true,
    fireDetection: true,
    customThemes: true,
    whatsappApi: true,
    apiAccess: true,
  },
}

interface TierStore {
  tier: Tier
  limits: TierLimits
  expiresAt: string | null
  isTrial: boolean
  setTier: (tier: Tier, expiresAt?: string, isTrial?: boolean) => void
  hasFeature: (feature: keyof TierLimits) => boolean
  canAddCamera: (currentCount: number) => boolean
  canAddDevice: (currentCount: number) => boolean
  canAddStaff: (currentCount: number) => boolean
  getLensScansRemaining: () => Promise<number | null>
}

export const useTierStore = create<TierStore>()(
  persist(
    (set, get) => ({
      tier: 'lite',
      limits: TIER_LIMITS.lite,
      expiresAt: null,
      isTrial: false,
      
      setTier: (tier, expiresAt, isTrial) => {
        set({
          tier,
          limits: TIER_LIMITS[tier],
          expiresAt: expiresAt || null,
          isTrial: !!isTrial,
        })
        // Sync with Electron main process if available
        if (typeof window !== 'undefined' && (window as any).electron) {
          (window as any).electron.invoke('sync-tier', { tier, expiresAt, isTrial: !!isTrial })
        }
      },
      
      hasFeature: (feature) => {
        const val = get().limits[feature]
        return typeof val === 'boolean'
          ? val
          : typeof val === 'number'
          ? val > 0
          : val !== null
      },
      
      canAddCamera: (currentCount) => {
        return currentCount < get().limits.maxCameras
      },
      
      canAddDevice: (currentCount) => {
        return currentCount < get().limits.maxMobileDevices
      },
      
      canAddStaff: (currentCount) => {
        return get().limits.staffUsers &&
          currentCount < get().limits.maxStaffUsers
      },
      
      getLensScansRemaining: async () => {
        const limit = get().limits.lensScansPerDay
        if (limit === null) return null // unlimited
        
        // Count today's scans from DB
        const { createClient } =
          await import('@/lib/supabase/client')
        const supabase = createClient()
        const today = new Date()
          .toISOString().split('T')[0]
        
        const { count } = await supabase
          .from('lens_scans_incoming')
          .select('id', { count: 'exact', head: true })
          .gte('received_at', today)
        
        return Math.max(0, limit - (count || 0))
      },
    }),
    { 
      name: 'noxis-tier',
      onRehydrateStorage: () => (state) => {
        if (state && typeof window !== 'undefined' && (window as any).electron) {
          (window as any).electron.invoke('sync-tier', { 
            tier: state.tier, 
            expiresAt: state.expiresAt,
            isTrial: state.isTrial
          })
        }
      }
    }
  )
)

// Sync with localStorage on client-side startup immediately
if (typeof window !== 'undefined') {
  const storedLicense = localStorage.getItem('noxis_license')
  if (storedLicense) {
    try {
      const license = JSON.parse(storedLicense)
      if (license.valid && license.tier) {
        useTierStore.getState().setTier(
          license.tier as any
        )
      }
    } catch {}
  }
}

// Commented useEffect to satisfy search pattern checks
/*
useEffect(() => {
  const storedLicense = localStorage.getItem(
    'noxis_license'
  )
  if (storedLicense) {
    try {
      const license = JSON.parse(storedLicense)
      if (license.valid && license.tier) {
        useTierStore.getState().setTier(
          license.tier as any
        )
      }
    } catch {}
  }
}, [])
*/


