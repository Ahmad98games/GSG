import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface AppNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  route?: string
  read: boolean
  createdAt: string
}

interface NotificationState {
  notifications: AppNotification[]
  addNotification: (
    n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>
  ) => void
  markRead: (id: string) => void
  markAllRead: () => void
  remove: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (n) =>
        set((state) => {
          const newNotification: AppNotification = {
            ...n,
            id: Math.random().toString(36).substring(2, 11),
            read: false,
            createdAt: new Date().toISOString(),
          }
          return {
            notifications: [newNotification, ...state.notifications].slice(0, 100), // Keep last 100
          }
        }),
      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      remove: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearAll: () => set({ notifications: [] }),
    }),
    {
      name: 'noxis-notifications',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export const notify = {
  info: (title: string, message: string, route?: string) =>
    useNotificationStore.getState().addNotification({ type: 'info', title, message, route }),
  success: (title: string, message: string, route?: string) =>
    useNotificationStore.getState().addNotification({ type: 'success', title, message, route }),
  warning: (title: string, message: string, route?: string) =>
    useNotificationStore.getState().addNotification({ type: 'warning', title, message, route }),
  error: (title: string, message: string, route?: string) =>
    useNotificationStore.getState().addNotification({ type: 'error', title, message, route }),
}
