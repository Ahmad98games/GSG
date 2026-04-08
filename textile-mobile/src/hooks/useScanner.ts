import { useCallback } from 'react';
import { useCameraPermissions } from 'expo-camera';
import type { ScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useProductStore } from '../store/useProductStore';
import { supabase } from '../lib/supabase';
import { parseProtocol } from '../lib/protocols';

/**
 * Gold She Protocol Router v6.0
 * Handles industrial routing for QR-centric ecosystem.
 */
export const useScanner = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const setScannedBatch = useProductStore((state) => state.setScannedBatch);
  const setScannedJob = useProductStore((state) => state.setScannedJob);
  const setMode = useProductStore((state) => state.setMode);
  const setError = useProductStore((state) => state.setError);

  const handleBarCodeScanned = useCallback(async (result: ScanningResult) => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const { type, payload } = parseProtocol(result.data);

      if (type === 'LINK') {
        setMode('HANDSHAKE');
        
        // Broadcast Confirmation with Telemetry to PC
        await supabase.channel('handshake_sync').send({
          type: 'broadcast',
          event: 'NODE_CONFIRM',
          payload: { 
            deviceId: 'FIELD_NODE_01', 
            deviceName: 'FIELD_NODE_ALPHA',
            battery: 88, 
            signal: 'strong' 
          }
        });

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => setMode('SCANNING'), 2000);
        return;
      }

      if (type === 'AUTH') {
        // Elite Protocol: Node Sync
        setMode('AUTH_SYNC');
        const channel = supabase.channel('node_sync');
        await channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.send({
              type: 'broadcast',
              event: 'SYNC_COMPLETE',
              payload: { node_id: 'SECURE_NODE_01', timestamp: payload },
            });
            console.log('Tactical Auth Broadcast Sent:', payload);
          }
        });
        return;
      }

      if (type === 'BATCH') {
        setMode('BATCH_INWARD');
        
        // Industrial Protocol: Fetch Real-time Batch Data
        const { data: batch, error: batchError } = await supabase
          .from('batches')
          .select('*, articles(*)')
          .eq('code', payload)
          .single();

        if (batchError || !batch) {
          throw new Error(`BATCH_NOT_FOUND: ${payload}`);
        }

        setScannedBatch({
          id: batch.id,
          item_name: batch.articles?.name || 'UNKNOWN_ARTICLE',
          item_category: batch.articles?.category || 'INDUSTRIAL',
          current_gaz: batch.suits_count || 0, // Using suits_count as the "current" metric
        });
        return;
      }

      if (type === 'AUDIT') {
        setMode('AUDIT');
        
        // Forensic Protocol: Fetch Global Job Metadata
        const { data: job, error: jobError } = await supabase
          .from('job_orders')
          .select(`
            *,
            articles(name),
            karigars(name)
          `)
          .eq('code', payload)
          .single();

        if (jobError || !job) {
          throw new Error(`JOB_NOT_FOUND: ${payload}`);
        }

        setScannedJob({
          id: job.id,
          code: job.code,
          article_name: job.articles?.name || 'UNKNOWN',
          karigar_name: job.karigars?.name || 'UNKNOWN',
          target_suits: job.target_suits,
          gaz_issued: job.gaz_issued,
          per_suit_gaz: job.per_suit_gaz,
        });
        return;
      }

      if (type === 'SUIT') {
        // Retail Protocol: Suit Sale
        setMode('SUIT_SALE');
        setScannedBatch({
          id: payload || 'S-UNKNOWN',
          item_name: 'RETAIL_UNIT',
          item_category: 'FINISH_GOODS',
          current_gaz: 1,
        });
        return;
      }

      // Legacy fallback or unknown
      throw new Error(`UNRECOGNIZED_PROTOCOL: ${result.data}`);

    } catch (err: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err instanceof Error ? err.message : "Protocol Error");
    }
  }, [setScannedBatch, setMode, setError]);

  return {
    permission,
    requestPermission,
    handleBarCodeScanned,
  };
};
