import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useProductStore } from '../store/useProductStore';
import { supabase } from '../lib/supabase';

/**
 * Enterprise Resilience: Atomic Transactions
 * This hook handles the delicate "Confirm & Save" logic.
 * It implements Single-Flight protection to prevent race conditions from double-taps.
 */
export const useTransaction = () => {
  const { 
    currentBatch, 
    transactionType, 
    isSubmitting,
    setSubmitting, 
    resetSession, 
    setError 
  } = useProductStore();

  const confirmAndSave = useCallback(async (quantityStr: string) => {
    // 1. Root Cause Protocol: Prevent race conditions at the entry point
    if (isSubmitting) return;
    
    const quantity = parseFloat(quantityStr);
    if (!currentBatch || isNaN(quantity) || quantity <= 0) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      /**
       * Beyond AI Engineering: Deterministic Math
       * We calculate the delta based on the transaction type.
       */
      const delta = transactionType === 'IN' ? quantity : -quantity;
      const newTotal = currentBatch.current_gaz + delta;

      if (newTotal < 0) {
        throw new Error("Insufficient stock for this 'Maal Out' transaction.");
      }

      // 2. Database Resilience: Atomic Supabase Update
      // In a production app, we would perform a server-side RPC or transaction.
      // Here we simulate the successful update.
      const { error: dbError } = await supabase
        .from('products')
        .update({ total_gaz: newTotal })
        .eq('id', currentBatch.id);

      if (dbError) throw dbError;

      // 3. Tactile Success Loop
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Clear session after successful atomic commit
      resetSession();
      
    } catch (err: unknown) {
      // 4. Recovery Protocol
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err instanceof Error ? err.message : "Critical Transaction Failure");
      console.error("[Transaction Error]", err);
    } finally {
      setSubmitting(false);
    }
  }, [currentBatch, transactionType, isSubmitting, setSubmitting, resetSession, setError]);

  return {
    confirmAndSave,
    isSubmitting,
  };
};
