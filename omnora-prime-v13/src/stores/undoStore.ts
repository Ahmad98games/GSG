import { create } from 'zustand'

export interface UndoAction {
  id: string
  description: string
  undo: () => Promise<void>
  createdAt: number
}

interface UndoState {
  actions: UndoAction[]
  pushAction: (action: Omit<UndoAction, 'id' | 'createdAt'>) => void
  popAndUndo: () => Promise<boolean>
}

export const useUndoStore = create<UndoState>((set, get) => ({
  actions: [],
  pushAction: (action) => {
    const newAction: UndoAction = {
      ...action,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: Date.now(),
    }
    set((state) => ({
      actions: [newAction, ...state.actions].slice(0, 10), // Keep last 10
    }))
  },
  popAndUndo: async () => {
    const { actions } = get()
    if (actions.length === 0) return false

    const [target, ...remaining] = actions
    set({ actions: remaining })

    try {
      await target.undo()
      return true
    } catch (err) {
      console.error('[Undo] Failed to execute undo callback:', err)
      return false
    }
  },
}))
