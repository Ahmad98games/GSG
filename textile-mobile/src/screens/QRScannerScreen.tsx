import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator,
  Platform,
  Animated,
  Easing
} from 'react-native';
import { CameraView } from 'expo-camera';
import { Shield, Zap, Package, Receipt, X, Terminal } from 'lucide-react-native';
import { useScanner } from '../hooks/useScanner';
import { useProductStore } from '../store/useProductStore';
import HapticEngine from '../lib/HapticEngine';
import { THEME } from '../lib/theme';

const { width } = Dimensions.get('window');

export const QRScannerScreen = () => {
  const { permission, requestPermission, handleBarCodeScanned } = useScanner();
  const { mode, error, resetSession } = useProductStore();
  
  const scanAnim = React.useRef(new Animated.Value(0)).current;
  const shakeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (mode === 'SCANNING' || mode === 'DASHBOARD') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
    
    if (mode === 'HANDSHAKE') {
      HapticEngine.heavy();
      Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [mode]);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Shield size={48} color={THEME.colors.primary} />
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

  const renderStatusOverlay = () => {
    switch (mode) {
      case 'AUTH_SYNC':
        return (
          <View style={styles.statusOverlay}>
            <Zap size={32} color={THEME.colors.primary} />
            <Text style={styles.statusText}>NODE_SYNC_INITIALIZING</Text>
          </View>
        );
      case 'BATCH_INWARD':
        return (
          <View style={styles.statusOverlay}>
            <Package size={32} color={THEME.colors.primary} />
            <Text style={styles.statusText}>BATCH_VAULT_RESOLVED</Text>
          </View>
        );
      case 'SUIT_SALE':
        return (
          <View style={styles.statusOverlay}>
            <Receipt size={32} color={THEME.colors.primary} />
            <Text style={styles.statusText}>UNIT_IDENTITY_LOCKED</Text>
          </View>
        );
      case 'HANDSHAKE':
        return (
          <View style={styles.statusOverlay}>
            <Shield size={32} color={THEME.colors.primary} />
            <Text style={styles.statusText}>HANDSHAKE_INITIATED</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={mode !== 'SCANNING' && mode !== 'DASHBOARD' ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      >
        {/* Darkened Overlay with Cutout */}
        <View style={styles.mask}>
          <View style={styles.maskTop} />
          <View style={styles.maskMiddle}>
            <View style={styles.maskSide} />
            <View style={styles.reticleContainer}>
              {/* Military Reticle */}
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
              
              {/* Scanning Ray */}
              <Animated.View style={[
                 styles.scanLine,
                 {
                   transform: [{
                     translateY: scanAnim.interpolate({
                       inputRange: [0, 1],
                       outputRange: [0, width * 0.75]
                     })
                   }]
                 }
               ]} />
               
               {(mode !== 'SCANNING' && mode !== 'DASHBOARD') && (
                 <Animated.View style={[
                   StyleSheet.absoluteFill, 
                   styles.processingOverlay,
                   { transform: [{ translateX: shakeAnim }] }
                 ]}>
                    <ActivityIndicator color={THEME.colors.primary} size="large" />
                    {mode === 'HANDSHAKE' && (
                      <Text style={styles.securingText}>SECURING_SESSION...</Text>
                    )}
                 </Animated.View>
               )}
            </View>
            <View style={styles.maskSide} />
          </View>
          <View style={styles.maskBottom}>
            {error && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            
            <View style={styles.footerPanel}>
              <Text style={styles.footerBrand}>GOLD SHE // ELITE_SCANNER_v6</Text>
              <Text style={styles.footerInstruction}>
                POSITION PROTOCOL KEY WITHIN TACTICAL FRAME
              </Text>
            </View>
          </View>
        </View>

        {/* Top Controls */}
        <View style={styles.topControl}>
          <View style={styles.nodeBadge}>
            <Terminal size={12} color={THEME.colors.primary} />
            <Text style={styles.nodeText}>NODE: SECURE_SYNC_ACTIVE</Text>
          </View>
          
          {mode !== 'SCANNING' && mode !== 'DASHBOARD' && (
            <TouchableOpacity 
              onPress={resetSession}
              style={styles.abortBtn}
            >
              <X size={18} color={THEME.colors.danger} />
              <Text style={styles.abortText}>ABORT</Text>
            </TouchableOpacity>
          )}
        </View>

        {renderStatusOverlay()}
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  
  // Tactical Mask
  mask: { flex: 1 },
  maskTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)' },
  maskMiddle: { flexDirection: 'row', height: width * 0.75 },
  maskSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)' },
  maskBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', paddingTop: 40 },
  
  // Reticle
  reticleContainer: { width: width * 0.75, height: width * 0.75, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: THEME.colors.primary },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  
  scanLine: { 
    position: 'absolute', 
    left: '10%', 
    right: '10%', 
    height: 1, 
    backgroundColor: THEME.colors.primary, 
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    opacity: 0.3,
    top: '50%' // Animated in real build, static for now
  },

  processingOverlay: { backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', gap: 20 },
  securingText: { color: THEME.colors.primary, fontSize: 8, fontWeight: '900', letterSpacing: 2 },

  // UI Components
  topControl: { position: 'absolute', top: 60, left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nodeBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: THEME.colors.border },
  nodeText: { color: THEME.colors.primary, fontSize: 8, fontWeight: '900', letterSpacing: 2 },
  
  abortBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(248, 113, 113, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, borderLeftWidth: 2, borderColor: THEME.colors.danger },
  abortText: { color: THEME.colors.danger, fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  statusOverlay: { position: 'absolute', top: '50%', left: 0, right: 0, marginTop: width * 0.4, alignItems: 'center', gap: 12 },
  statusText: { color: THEME.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 3, fontStyle: 'italic' },

  footerPanel: { alignItems: 'center', gap: 8 },
  footerBrand: { color: THEME.colors.secondary, fontSize: 13, fontWeight: '900', letterSpacing: 6, opacity: 0.8 },
  footerInstruction: { color: THEME.colors.textSecondary, fontSize: 8, fontWeight: 'bold', letterSpacing: 2 },
  
  errorCard: { backgroundColor: 'rgba(248, 113, 113, 0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 4, marginBottom: 20, borderLeftWidth: 2, borderColor: THEME.colors.danger },
  errorText: { color: THEME.colors.danger, fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  // Permissions
  permissionContainer: { flex: 1, backgroundColor: THEME.colors.background, justifyContent: 'center', alignItems: 'center', padding: 40 },
  permissionTitle: { color: THEME.colors.primary, fontSize: 14, fontWeight: '900', letterSpacing: 4, marginTop: 24 },
  permissionDesc: { color: THEME.colors.textSecondary, fontSize: 10, textAlign: 'center', marginTop: 12, lineHeight: 18, letterSpacing: 1 },
  permissionBtn: { marginTop: 40, backgroundColor: THEME.colors.surface, paddingVertical: 18, paddingHorizontal: 40, borderRadius: 8, borderWidth: 1, borderColor: THEME.colors.border },
  permissionBtnText: { color: THEME.colors.primary, fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
});
