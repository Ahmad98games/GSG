import { create } from 'zustand';

export interface SessionAction {
  id: string;
  type: 'production' | 'attendance' | 'payment' | 'stock' | 'advance' | 'invoice' | 'other';
  description: string;
  timestamp: Date;
  synced: boolean;
  undoable: boolean;
  onUndo?: () => Promise<void>;
}

interface SessionActionsState {
  actions: SessionAction[];
  addAction: (action: Omit<SessionAction, 'id' | 'timestamp'>) => void;
  updateSyncStatus: (id: string, synced: boolean) => void;
  undoAction: (id: string) => Promise<void>;
}

export const useSessionActions = create<SessionActionsState>((set, get) => ({
  actions: [],
  addAction: (action) => set((state) => ({
    actions: [
      {
        ...action,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
      },
      ...state.actions.slice(0, 19),
    ],
  })),
  updateSyncStatus: (id, synced) => set((state) => ({
    actions: state.actions.map((a) => a.id === id ? { ...a, synced } : a),
  })),
  undoAction: async (id) => {
    const action = get().actions.find((a) => a.id === id);
    if (action && action.undoable && action.onUndo) {
      const now = new Date();
      const diff = (now.getTime() - action.timestamp.getTime()) / 1000 / 60;
      if (diff <= 5) {
        await action.onUndo();
        set((state) => ({
          actions: state.actions.filter((a) => a.id !== id),
        }));
      } else {
        throw new Error('Undo expired (max 5 minutes)');
      }
    }
  },
}));
