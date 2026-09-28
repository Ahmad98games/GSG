import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * Business Mode Store
 * 
 * Persists the user's first-run business mode selection to localStorage.
 * This drives dynamic UI adaptation: hiding/showing sidebar nav items,
 * dashboard widgets, and feature modules based on the chosen mode.
 */

export type BusinessMode = 'textile' | 'wholesale' | 'retail'

export interface BusinessModeFlags {
  // Textile & Garment Manufacturing
  enableKarigarLedger: boolean
  enablePieceRate: boolean
  enableFactoryFloor: boolean

  // Wholesale & Fabric Trading
  enableThanTracking: boolean
  enableWholesaleBilling: boolean
  enableBOM: boolean

  // Retail & General POS Counter
  enableFastBarcode: boolean
  enableThermalChit: boolean

  // Default landing view
  defaultView: 'production' | 'wholesale_pos' | 'retail_pos' | 'dashboard'
}

export const BUSINESS_MODE_CONFIGS: Record<BusinessMode, { label: string; tagline: string; emoji: string; flags: BusinessModeFlags }> = {
  textile: {
    label: 'Textile & Garment Manufacturing',
    tagline: 'Karigar piece-rates, peshgi advances, production grid, factory floor tracking',
    emoji: '🧵',
    flags: {
      enableKarigarLedger: true,
      enablePieceRate: true,
      enableFactoryFloor: true,
      enableThanTracking: false,
      enableWholesaleBilling: false,
      enableBOM: false,
      enableFastBarcode: false,
      enableThermalChit: false,
      defaultView: 'production',
    },
  },
  wholesale: {
    label: 'Wholesale & Fabric Trading',
    tagline: 'Than/bale tracking, wholesale billing, party khata ledgers, dispatch',
    emoji: '📦',
    flags: {
      enableKarigarLedger: false,
      enablePieceRate: false,
      enableFactoryFloor: false,
      enableThanTracking: true,
      enableWholesaleBilling: true,
      enableBOM: false,
      enableFastBarcode: false,
      enableThermalChit: false,
      defaultView: 'wholesale_pos',
    },
  },
  retail: {
    label: 'Retail & General POS Counter',
    tagline: 'Fast barcode scanning, thermal receipt printing, walk-in customer billing',
    emoji: '🏪',
    flags: {
      enableKarigarLedger: false,
      enablePieceRate: false,
      enableFactoryFloor: false,
      enableThanTracking: false,
      enableWholesaleBilling: false,
      enableBOM: false,
      enableFastBarcode: true,
      enableThermalChit: true,
      defaultView: 'retail_pos',
    },
  },
}

interface BusinessModeState {
  // Has the user completed first-run mode selection?
  isConfigured: boolean

  // Selected business mode
  mode: BusinessMode | null

  // Computed feature flags
  flags: BusinessModeFlags | null

  // Basic info collected during first-run
  shopName: string
  contactWhatsApp: string

  // Actions
  setMode: (mode: BusinessMode, shopName: string, contactWhatsApp: string) => void
  updateMode: (mode: BusinessMode) => void
  hasFlag: (flag: keyof BusinessModeFlags) => boolean
  reset: () => void
}

export const useBusinessModeStore = create<BusinessModeState>()(
  persist(
    (set, get) => ({
      isConfigured: false,
      mode: null,
      flags: null,
      shopName: '',
      contactWhatsApp: '',

      setMode: (mode, shopName, contactWhatsApp) => {
        const config = BUSINESS_MODE_CONFIGS[mode]
        set({
          isConfigured: true,
          mode,
          flags: config.flags,
          shopName,
          contactWhatsApp,
        })
      },

      updateMode: (mode) => {
        const config = BUSINESS_MODE_CONFIGS[mode]
        set({
          mode,
          flags: config.flags,
        })
      },

      hasFlag: (flag) => {
        const flags = get().flags
        if (!flags) return true // Default: show everything if no mode selected
        return !!flags[flag]
      },

      reset: () => set({
        isConfigured: false,
        mode: null,
        flags: null,
        shopName: '',
        contactWhatsApp: '',
      }),
    }),
    {
      name: 'noxis-business-mode',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : (null as any)
      ),
    }
  )
)
