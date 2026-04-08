import { useState, useEffect, useCallback } from 'react';
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
    currentJob,
    mode,
    transactionType, 
    isSubmitting,
    setSubmitting, 
    resetSession, 
    setError 
  } = useProductStore();

  const [threshold, setThreshold] = useState(0.04);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'chori_guard_wastage_pct')
        .single();
      if (data) setThreshold(parseFloat(data.value) / 100);
    };
    fetchSettings();
  }, []);

  const confirmAndSave = useCallback(async (quantityStr: string) => {
    // 1. Root Cause Protocol: Prevent race conditions at the entry point
    if (isSubmitting) return;
    
    const qValue = parseFloat(quantityStr);
    if (isNaN(qValue) || qValue <= 0) {
      setError('INVALID_QUANTITY_INPUT');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (mode === 'AUDIT' && currentJob) {
        // --- CHORI GUARD: Forensic Audit Protocol ---
        const expected = (currentJob.target_suits * currentJob.per_suit_gaz);
        const buffer = expected * threshold;
        const variance = qValue - expected - buffer;
        const result = variance >= -1 ? 'PASS' : 'FAIL'; // Precision variance detection

        const { error: auditError } = await supabase
          .from('job_audit_results')
          .insert([{
            job_id: currentJob.id,
            scanned_quantity: qValue,
            expected_quantity: expected,
            variance: variance,
            result,
            auditor_id: (await supabase.auth.getSession()).data.session?.user.id || 'NODE-ANON'
          }]);

        if (auditError) throw auditError;

        // Auto-update job status if it failed audit
        if (result === 'FAIL') {
          await supabase.from('job_orders').update({ status: 'RED_ALERT' }).eq('id', currentJob.id);
        } else {
          await supabase.from('job_orders').update({ status: 'AUDITED' }).eq('id', currentJob.id);
        }

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        resetSession();
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('AUTH_SESSION_EXPIRED');
      const user = session.user;

      if (!currentBatch) throw new Error('BATCH_ID_MISSING');

      if (transactionType === 'IN') {
        // Root Cause Protocol: Atomic Inwarding via DB RPC
        const { error: rpcError } = await supabase.rpc('invoke_inward_protocol', {
          p_batch_id: currentBatch.id,
          p_quantity: qValue,
          p_performed_by: user.id,
          p_note: 'MOBILE_INWARD_AUTO'
        });

        if (rpcError) throw rpcError;
      } else {
        // Root Cause Protocol: Atomic Outwarding via DB RPC
        const { error: rpcError } = await supabase.rpc('invoke_outward_protocol', {
          p_batch_id: currentBatch.id,
          p_quantity: qValue,
          p_performed_by: user.id,
          p_note: 'MOBILE_OUTWARD_AUTO'
        });

        if (rpcError) throw rpcError;
      }

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
  }, [currentBatch, currentJob, mode, transactionType, threshold, isSubmitting, setSubmitting, resetSession, setError]);

  return {
    confirmAndSave,
    isSubmitting,
  };
};
