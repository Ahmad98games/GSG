import React, { useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Shield } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';

import { useProductStore } from '../store/useProductStore';
import { useScanner } from '../hooks/useScanner';
import { useTransaction } from '../hooks/useTransaction';
import { BatchLedgerView } from '../components/BatchLedgerView';

/**
 * Senior Engineering Protocol: Pure UI Shell
 * This component is now 'Dumb' - it only handles layout and event delegation. 
 * Business logic resides in hooks/stores.
 */
export const ScannerScreen = () => {
  // Store consumption
  const { 
    currentBatch,
    mode,
    transactionType,
    error, 
    initiateTransaction, 
    resetSession,
    setMode
  } = useProductStore();

  // Logic extraction
  const { permission, requestPermission, handleBarCodeScanned } = useScanner();
  const { confirmAndSave, isSubmitting } = useTransaction();
  const { currentJob } = useProductStore();
  
  const [quantity, setQuantity] = React.useState('');
  const [threshold, setThreshold] = React.useState(0.04); // Default 4%
  const inputRef = useRef<TextInput>(null);

  // Fetch Dynamic Thresholds from Sovereign System Settings
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

  // Idiot-Proof Auto-Focus Lifecycle
  useEffect(() => {
    if (mode === 'QUANTITY_INPUT' || mode === 'AUDIT') {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  const calculateVariance = () => {
    if (!currentJob || !quantity) return 0;
    const qValue = parseFloat(quantity);
    if (isNaN(qValue)) return 0;
    
    // Industrial Math: Expected = (Suits * Gaz/Suit) + Buffer
    const expected = (currentJob.target_suits * currentJob.per_suit_gaz);
    const buffer = expected * threshold;
    return qValue - expected - buffer;
  };

  if (!permission) return <View style={styles.container} />;
  
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="lock-closed-outline" size={48} color="#D4AF37" />
        <Text style={styles.permissionTitle}>SECURITY PROTOCOL</Text>
        <Text style={styles.permissionDesc}>
          CAMERA ACCESS IS REQUIRED FOR ENTERPRISE SCANNING OPERATIONS.
        </Text>
        <TouchableOpacity 
          activeOpacity={0.7}
          style={styles.permissionBtn} 
          onPress={requestPermission}
        >
          <Text style={styles.permissionBtnText}>INITIALIZE ACCESS</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      {/* 60% Camera Viewport */}
      <View style={styles.viewport}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={currentBatch || currentJob ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["qr", "datamatrix"] }}
        />
        
        {/* Engineering Reticle */}
        <View style={styles.reticle}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
          <View style={styles.scanLine} />
        </View>

        <View style={styles.brandOverlay}>
          <Text style={styles.brandText}>GOLD SHE</Text>
          <View style={styles.statusBadge}>
            <View style={[styles.dot, !(currentBatch || currentJob) && styles.dotActive]} />
            <Text style={styles.statusText}>{currentBatch || currentJob ? 'ID RESOLVED' : 'AWAITING SCAN'}</Text>
          </View>
        </View>
      </View>

      {/* 40% Control Panel */}
      <View style={styles.panel}>
        {mode === 'SCANNING' ? (
          <View style={styles.panelInner}>
            {currentBatch ? (
              <BatchLedgerView batch={currentBatch} />
            ) : currentJob ? (
              <View style={styles.infoCard}>
                <Text style={styles.label}>FORENSIC_AUDIT_LOCKED</Text>
                <Text style={styles.batchTitle}>{currentJob.code}</Text>
                <Text style={styles.batchSub}>{currentJob.article_name} • {currentJob.karigar_name}</Text>
              </View>
            ) : (
              <View style={styles.infoCard}>
                <Text style={styles.label}>AWAITING SYSTEM RESOLUTION</Text>
                <Text style={styles.batchTitle}>SCAN MATERIAL QR</Text>
                <Text style={styles.batchSub}>READY FOR INPUT</Text>
              </View>
            )}

            <View style={styles.actionRow}>
              {currentJob ? (
                 <TouchableOpacity 
                   activeOpacity={0.8}
                   style={[styles.mainBtn, styles.btnIn]}
                   onPress={() => setMode('AUDIT')}
                 >
                   <Shield size={20} color="black" />
                   <Text style={styles.btnText}>PERFORM AUDIT</Text>
                 </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    disabled={!currentBatch}
                    style={[styles.mainBtn, styles.btnIn, !currentBatch && styles.btnDisabled]}
                    onPress={() => initiateTransaction('IN')}
                  >
                    <Ionicons name="add" size={24} color="#09090b" />
                    <Text style={styles.btnText}>MAAL IN (+)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    activeOpacity={0.8}
                    disabled={!currentBatch}
                    style={[styles.mainBtn, styles.btnOut, !currentBatch && styles.btnDisabled]}
                    onPress={() => initiateTransaction('OUT')}
                  >
                    <Ionicons name="remove" size={24} color="#09090b" />
                    <Text style={styles.btnText}>MAAL OUT (-)</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        ) : mode === 'AUDIT' ? (
          <View style={styles.panelInner}>
             <View style={styles.headerRow}>
              <View>
                <Text style={styles.label}>CHORI_GUARD_FORENSIC_AUDIT</Text>
                <Text style={styles.batchSub}>THRESHOLD: {(threshold * 100).toFixed(1)}% WASTAGE</Text>
              </View>
              <TouchableOpacity onPress={resetSession}>
                <Text style={styles.cancelText}>ABORT</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              ref={inputRef}
              style={styles.hugeInput}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              placeholder="0.0"
              placeholderTextColor="#3f3f46"
            />
            
            <View style={styles.auditMeta}>
               <Text style={[styles.varianceText, calculateVariance() < -1 ? styles.varianceAlert : styles.varianceSafe]}>
                  VARIANCE: {calculateVariance().toFixed(2)} GAZ
               </Text>
               <Text style={styles.auditHelp}>
                  ENTER FINAL MEASURED QUANTITY SUBMITTED BY KARIGAR
               </Text>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity 
              activeOpacity={0.9}
              disabled={isSubmitting || !quantity}
              style={[styles.confirmBtn, (isSubmitting || !quantity) && styles.btnDisabled]}
              onPress={() => confirmAndSave(quantity)} // Reusing for now, will branch in hook
            >
              {isSubmitting ? (
                <ActivityIndicator color="#09090b" />
              ) : (
                <Text style={styles.confirmBtnText}>FINALIZE AUDIT & SUBMIT</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.panelInner}>
            <View style={styles.headerRow}>
              <Text style={styles.label}>
                INPUT QUANTITY ({transactionType === 'IN' ? 'CREDIT' : 'DEBIT'})
              </Text>
              <TouchableOpacity onPress={resetSession}>
                <Text style={styles.cancelText}>ABORT</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              ref={inputRef}
              style={styles.hugeInput}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#3f3f46"
            />
            
            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity 
              activeOpacity={0.9}
              disabled={isSubmitting || !quantity}
              style={[styles.confirmBtn, (isSubmitting || !quantity) && styles.btnDisabled]}
              onPress={() => confirmAndSave(quantity)}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#09090b" />
              ) : (
                <Text style={styles.confirmBtnText}>CONFIRM & SAVE TRANSACTION</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  viewport: { flex: 0.6, backgroundColor: '#000', overflow: 'hidden' },
  panel: { flex: 0.4, padding: 24, borderTopWidth: 1, borderColor: '#18181b' },
  panelInner: { flex: 1, justifyContent: 'space-between' },
  
  // Brand UI
  brandOverlay: { position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center' },
  brandText: { color: '#D4AF37', fontSize: 16, fontWeight: '900', letterSpacing: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: '#fff', fontSize: 8, fontWeight: 'bold', letterSpacing: 2, marginLeft: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3f3f46' },
  dotActive: { backgroundColor: '#D4AF37' },

  // Reticle
  reticle: { position: 'absolute', top: '50%', left: '50%', width: 220, height: 220, marginLeft: -110, marginTop: -110, justifyContent: 'center', alignItems: 'center' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#D4AF37' },
  tl: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
  tr: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  br: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  scanLine: { width: '80%', height: 1, backgroundColor: '#D4AF37', opacity: 0.2 },

  // Components
  infoCard: { backgroundColor: '#18181b', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#27272a' },
  label: { color: '#52525b', fontSize: 9, fontWeight: 'bold', letterSpacing: 2, marginBottom: 8 },
  batchTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  batchSub: { color: '#D4AF37', fontSize: 10, fontWeight: '800', marginTop: 4, letterSpacing: 1 },
  
  actionRow: { flexDirection: 'row', gap: 16 },
  mainBtn: { flex: 1, height: 80, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 },
  btnIn: { backgroundColor: '#D4AF37' },
  btnOut: { backgroundColor: '#18181b', borderWidth: 1, borderColor: '#D4AF37' },
  btnText: { color: '#09090b', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  btnDisabled: { opacity: 0.2 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancelText: { color: '#dc2626', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  hugeInput: { fontSize: 64, color: '#fff', fontWeight: '900', textAlign: 'center', paddingVertical: 10 },
  errorText: { color: '#ef4444', fontSize: 10, textAlign: 'center', marginBottom: 10, fontWeight: 'bold' },
  
  confirmBtn: { backgroundColor: '#D4AF37', height: 60, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  confirmBtnText: { color: '#09090b', fontSize: 12, fontWeight: '900', letterSpacing: 2 },

  // Audit Specific Styles
  auditMeta: { padding: 12, borderLeftWidth: 2, borderColor: '#C6A756', backgroundColor: '#111', marginTop: 8 },
  varianceText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  varianceSafe: { color: '#10b981' },
  varianceAlert: { color: '#ef4444' },
  auditHelp: { color: '#52525b', fontSize: 8, marginTop: 4, fontWeight: 'bold' },

  // Permissions
  permissionContainer: { flex: 1, backgroundColor: '#09090b', justifyContent: 'center', alignItems: 'center', padding: 40 },
  permissionTitle: { color: '#D4AF37', fontSize: 14, fontWeight: '900', letterSpacing: 4, marginTop: 24 },
  permissionDesc: { color: '#52525b', fontSize: 10, textAlign: 'center', marginTop: 12, lineHeight: 18, letterSpacing: 1 },
  permissionBtn: { marginTop: 40, backgroundColor: '#18181b', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 8, borderWidth: 1, borderColor: '#27272a' },
  permissionBtnText: { color: '#D4AF37', fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
});
