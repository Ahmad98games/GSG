import { useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

/**
 * Sovereign Security: Biometric Resume Shield (v8.3)
 * This hook enforces re-authentication every time the app returns to the foreground.
 * It prevents unauthorized access if the device is lost or left unlocked.
 */
export const useBiometricShield = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const appState = useRef(AppState.currentState);

  const authenticate = async () => {
    if (isPromptVisible) return;
    
    setIsPromptVisible(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Fallback: If no biometrics, we trust the device lock (baseline protection)
        setIsAuthenticated(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to Access Sovereign Node',
        fallbackLabel: 'Use Device Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.error('[BiometricShield] Auth Error:', e);
      setIsAuthenticated(false);
    } finally {
      setIsPromptVisible(false);
    }
  };

  useEffect(() => {
    // Initial auth on mount
    authenticate();

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // Check if transitioning from background/inactive to active
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        setIsAuthenticated(false); // Lock immediately on resume
        authenticate();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return { isAuthenticated, authenticate };
};
