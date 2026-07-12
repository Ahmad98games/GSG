import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface CurrentUser {
  id: string
  name: string
  email: string
  role: string
  businessId: string
}

interface CurrentUserState {
  currentUser: CurrentUser | null
  setCurrentUser: (user: CurrentUser | null) => void
}

export const useCurrentUserStore = create<CurrentUserState>()(
  persist(
    (set) => ({
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
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
