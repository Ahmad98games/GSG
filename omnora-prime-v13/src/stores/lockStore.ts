import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface LockState {
  isLocked: boolean
  lastActivityAt: number
  autoLockMinutes: number // 0 = disabled
  lockOnMinimize: boolean
  hasPinConfigured: boolean

  lock: () => void
  unlock: () => void
  recordActivity: () => void
  setAutoLockMinutes: (mins: number) => void
  setLockOnMinimize: (val: boolean) => void
  setHasPinConfigured: (val: boolean) => void
}

export const useLockStore = create<LockState>()(
  persist(
    (set) => ({
      isLocked: false,
      lastActivityAt: Date.now(),
      autoLockMinutes: 5,
      lockOnMinimize: true,
      hasPinConfigured: false,

      lock: () => {
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('noxis_locked', 'true')
            localStorage.setItem('noxis_locked', 'true')
          } catch {}
        }
        set({ isLocked: true })
      },

      unlock: () => {
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.removeItem('noxis_locked')
            localStorage.removeItem('noxis_locked')
          } catch {}
        }
        set({
          isLocked: false,
          lastActivityAt: Date.now(),
        })
      },

      recordActivity: () =>
        set({
          lastActivityAt: Date.now(),
        }),

      setAutoLockMinutes: (mins) =>
        set({
          autoLockMinutes: mins,
          lastActivityAt: Date.now(),
        }),

      setLockOnMinimize: (val) =>
        set({
          lockOnMinimize: val,
        }),

      setHasPinConfigured: (val) =>
        set({
          hasPinConfigured: val,
        }),
    }),
    {
      name: 'noxis-lock-store',
      partialize: (state) => ({
        isLocked: state.isLocked,
        lastActivityAt: state.lastActivityAt,
        autoLockMinutes: state.autoLockMinutes,
        lockOnMinimize: state.lockOnMinimize,
        hasPinConfigured: state.hasPinConfigured,
      }),
    }
  )
)
