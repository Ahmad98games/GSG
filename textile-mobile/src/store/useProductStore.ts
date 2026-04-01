import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Enterprise Resilience: State Machine Definitions
 * We use a strictly typed state machine to prevent illegal transitions
 */
export type AppMode = 'SCANNING' | 'QUANTITY_INPUT' | 'DASHBOARD' | 'LEDGER';
export type TransactionType = 'IN' | 'OUT' | 'DEBIT' | 'CREDIT' | null;

interface Party {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface Transaction {
  id: string;
  party_id: string;
  amount: number;
  type: 'debit' | 'credit';
  category: string;
  created_at: string;
}

interface ScannedBatch {
  id: string;
  item_name: string;
  item_category: string;
  current_gaz: number;
}

interface ProductState {
  // --- Persistent Session State ---
  currentBatch: ScannedBatch | null;
  mode: AppMode;
  transactionType: TransactionType;
  parties: Party[];
  transactions: Transaction[];
  
  // --- Transient UI State ---
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // --- Actions ---
  setScannedBatch: (batch: ScannedBatch | null) => void;
  initiateTransaction: (type: TransactionType) => void;
  resetSession: () => void;
  setSubmitting: (flag: boolean) => void;
  setError: (msg: string | null) => void;
  setParties: (parties: Party[]) => void;
  addTransaction: (tx: Transaction) => void;
  setMode: (mode: AppMode) => void;
}

/**
 * Root Cause Protocol: 
 * Centralizing all state transitions ensures we never have 
 * dangling UI states or race conditions between scanning and saving.
 */
export const useProductStore = create<ProductState>()(
  persist(
    (set) => ({
      // Initial States
      currentBatch: null,
      mode: 'DASHBOARD',
      transactionType: null,
      parties: [],
      transactions: [],
      isLoading: false,
      isSubmitting: false,
      error: null,

      // State Transitions
      setScannedBatch: (batch) => set({ 
        currentBatch: batch, 
        error: null,
        mode: 'SCANNING' 
      }),

      initiateTransaction: (type) => set({ 
        transactionType: type,
        mode: type ? 'QUANTITY_INPUT' : 'SCANNING'
      }),

      setSubmitting: (flag) => set({ isSubmitting: flag }),

      setError: (msg) => set({ error: msg }),

      setParties: (parties) => set({ parties }),

      addTransaction: (tx) => set((state) => ({
        transactions: [tx, ...state.transactions],
        parties: state.parties.map(p => 
          p.id === tx.party_id 
            ? { ...p, balance: tx.type === 'credit' ? p.balance + tx.amount : p.balance - tx.amount }
            : p
        )
      })),

      setMode: (mode) => set({ mode }),

      resetSession: () => set({
        currentBatch: null,
        mode: 'DASHBOARD',
        transactionType: null,
        error: null,
        isSubmitting: false
      }),
    }),
    {
      name: 'gold-she-v2-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist clinical data for offline resilience
      partialize: (state) => ({
        parties: state.parties,
        transactions: state.transactions,
        mode: state.mode,
      }),
    }
  )
);
