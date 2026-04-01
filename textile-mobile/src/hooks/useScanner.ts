import { useCallback } from 'react';
import { useCameraPermissions } from 'expo-camera';
import type { ScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useProductStore } from '../store/useProductStore';
import { supabase } from '../lib/supabase';

/**
 * Beyond AI Engineering: Modular Scanning Logic
 * This hook encapsulates the permission lifecycle and scan processing.
 * It prevents the UI from having to manage camera-specific side effects.
 */
export const useScanner = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const setScannedBatch = useProductStore((state) => state.setScannedBatch);
  const setError = useProductStore((state) => state.setError);

  const handleBarCodeScanned = useCallback(async (result: ScanningResult) => {
    try {
      // Trigger Success Haptic immediately for tactile response
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      /**
       * Root Cause Protocol: 
       * Fetch batch metadata from Supabase using the scanned QR code.
       */
      const { data: batch, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('qr_code', result.data)
        .single();

      if (fetchError || !batch) {
        throw new Error("Invalid or unregistered batch identifier.");
      }

      setScannedBatch({
        id: batch.id,
        item_name: batch.item_name,
        item_category: batch.item_category,
        current_gaz: batch.total_gaz,
      });
    } catch (err: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err instanceof Error ? err.message : "Failed to process scan");
    }
  }, [setScannedBatch, setError]);

  return {
    permission,
    requestPermission,
    handleBarCodeScanned,
  };
};
