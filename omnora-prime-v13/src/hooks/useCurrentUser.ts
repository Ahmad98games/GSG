import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CurrentUser {
  id: string
  name: string
  username?: string
  email?: string
  role: string
  businessId: string
}

interface CurrentUserState {
  currentUser: CurrentUser | null
  setCurrentUser: (user: CurrentUser | null) => void
  clearCurrentUser: () => void
}

export const useCurrentUserStore = create<CurrentUserState>()(
  persist(
    (set) => ({
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      clearCurrentUser: () => set({ currentUser: null }),
    }),
    {
      name: 'noxis-current-user',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export function useCurrentUser() {
  return useCurrentUserStore()
}
