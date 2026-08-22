import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { KhataService, VoidTransactionParams } from '@/lib/khata/KhataService';
import { useToast } from '@/hooks/useToast';

/**
 * Custom Hook for Khata Ledger Operations
 * Provides offline-first transaction reversion with silent toast feedback.
 */
export function useKhata() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const addKhataEntry = useCallback(
    async (payload: {
      businessId: string;
      partyId?: string | null;
      amount: number;
      entryType: 'DEBIT' | 'CREDIT' | 'debit' | 'credit';
      description?: string;
    }) => {
      try {
        const res = await KhataService.addKhataEntry(payload);
        toast.success('Khata Entry Created');
        queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
        queryClient.invalidateQueries({ queryKey: ['parties'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
        return res;
      } catch (err: any) {
        toast.error('Failed to create Khata entry', err.message || String(err));
        throw err;
      }
    },
    [queryClient, toast]
  );

  const voidTransaction = useCallback(
    async (params: VoidTransactionParams) => {
      try {
        // 1. Optimistically update React Query cache FIRST
        queryClient.setQueryData(['ledger_entries', params.businessId], (oldData: any[]) => {
          if (!Array.isArray(oldData)) return oldData;
          return oldData.map((entry) =>
            entry.tx_ref === params.tx_ref ? { ...entry, status: 'reversed', is_void: true } : entry
          );
        });

        if (params.party_id) {
          const delta = params.creditAmount - params.debitAmount;
          queryClient.setQueryData(['parties', params.businessId], (oldData: any[]) => {
            if (!Array.isArray(oldData)) return oldData;
            return oldData.map((party) =>
              party.id === params.party_id
                ? { ...party, current_balance: Number(party.current_balance || 0) + delta }
                : party
            );
          });
        }

        // 2. Execute local DB & offline-first reversion
        await KhataService.voidTransaction(params);

        // 3. Silent Toast Feedback (replaces window.alert)
        toast.success('Transaction Reverted & Balance Updated');

        // 4. Invalidate queries for eventual consistency
        queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
        queryClient.invalidateQueries({ queryKey: ['parties'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      } catch (err: any) {
        toast.error('Error voiding transaction', err.message || String(err));
      }
    },
    [queryClient, toast]
  );

  return {
    addKhataEntry,
    voidTransaction,
  };
}
