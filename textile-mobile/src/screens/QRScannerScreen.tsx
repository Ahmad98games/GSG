import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { X, Zap, Loader2 } from 'lucide-react-native';
import { useProductStore } from '../store/useProductStore';
import { supabase } from '../lib/supabase';
import type { RootStackParamList } from '../lib/types';
import type { StackNavigationProp } from '@react-navigation/stack';

const { width } = Dimensions.get('window');
const GOLD = '#D4AF37';

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Scanner'>;
}

export const QRScannerScreen = ({ navigation }: Props) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const addTransaction = useProductStore((state) => state.addTransaction);
  const setError = useProductStore((state) => state.setError);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  const handleBarCodeScanned = async ({ data: scannedData }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      // Tactile Success
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      /**
       * Beyond AI Engineering: Financial Ledger Transaction Protocol
       * 1. Resolve Batch -> Job Order -> Karigar
       * 2. Calculate Current Bill
       * 3. Update Khata (Ledger)
       */
      
      interface BatchQueryResult {
        id: string;
        batch_name: string;
        sku_code: string;
        job_orders: {
          id: string;
          total_quantity: number;
          karigar_chalans: {
            karigar_id: string;
            parties: {
              id: string;
              name: string;
              balance: number;
            };
          }[];
        } | null;
      }

      const { data, error: batchErr } = await supabase
        .from('production_batches')
        .select(`
          id,
          batch_name,
          sku_code,
          job_orders (
            id,
            total_quantity,
            karigar_chalans (
              karigar_id,
              parties (
                id,
                name,
                balance
              )
            )
          )
        `)
        .eq('sku_code', scannedData)
        .single();

      if (batchErr || !data) throw new Error("BATCH NOT RECOGNIZED");

      const batch = data as unknown as BatchQueryResult;
      const jobOrder = batch.job_orders;
      const karigar = jobOrder?.karigar_chalans?.[0]?.parties;

      if (!karigar) throw new Error("NO KARIGAR ASSIGNED TO THIS BATCH");

      // Step 2: Simulate Financial Logic (Phase 3 Spec)
      const mockAmount = 5000; // In reality, this would be computed from quantity * rate
      
      // Trigger Transaction Safely
      const { data: tx, error: txErr } = await supabase
        .from('ledger')
        .insert({
          party_id: karigar.id,
          amount: mockAmount,
          transaction_type: 'credit',
          category: 'invoice',
          description: `Automatic Scan: ${batch.batch_name} (${scannedData})`
        })
        .select()
        .single();

      if (txErr) throw txErr;

      // Update Local Store (Offline-First Sync)
      addTransaction({
        id: tx.id,
        party_id: karigar.id,
        amount: mockAmount,
        type: 'credit',
        category: 'invoice',
        created_at: new Date().toISOString()
      });

      // Navigate to Ledger
      navigation.replace('Ledger', { partyId: karigar.id });

    } catch (err: unknown) {
      console.error(err);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err instanceof Error ? err.message : "SCAN FAILED");
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) return (
    <View style={styles.permissionContainer}><ActivityIndicator color={GOLD} /></View>
  );

  if (!permission.granted) return (
    <View style={styles.permissionContainer}>
      <Text style={styles.permissionText}>CAMERA ACCESS REQUIRED</Text>
      <TouchableOpacity 
        style={styles.permissionButton}
        onPress={requestPermission}
      >
        <Text style={styles.buttonText}>GRANT ACCESS</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      >
        {/* Scanner Overlay */}
        <View style={styles.overlay}>
          <View style={styles.unfilled} />
          <View style={styles.middleRow}>
            <View style={styles.unfilled} />
            <View style={styles.scannerBox}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              {loading && <ActivityIndicator color={GOLD} size="large" />}
            </View>
            <View style={styles.unfilled} />
          </View>
          <View style={styles.unfilled}>
             <Text style={styles.instructionText}>SCAN BATCH QR CODE</Text>
          </View>
        </View>

        {/* Controls */}
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <X size={24} color="white" />
        </TouchableOpacity>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: GOLD,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'black',
    fontWeight: '900',
    fontSize: 11,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  unfilled: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleRow: {
    flexDirection: 'row',
    height: width * 0.7,
  },
  scannerBox: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: GOLD,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderLeftWidth: 4,
    borderTopWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderRightWidth: 4,
    borderTopWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
  },
  instructionText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 4,
    marginTop: -20,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 30,
  },
});
