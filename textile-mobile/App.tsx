import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import type { StackNavigationOptions } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ExecutiveDashboard } from './src/screens/ExecutiveDashboard';
import { QRScannerScreen } from './src/screens/QRScannerScreen';
import TacticalChatScreen from './src/screens/TacticalChatScreen';
import { PartyLedgerView } from './src/screens/PartyLedgerView';
import { useKillSwitch } from './src/hooks/useKillSwitch';
import type { RootStackParamList } from './src/lib/types';
import { THEME } from './src/lib/theme';

const Stack = createStackNavigator<RootStackParamList>();

const globalScreenOptions: StackNavigationOptions = {
  headerShown: false,
  cardStyle: { backgroundColor: THEME.colors.background },
};

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useBiometricShield } from './src/hooks/useBiometricShield';
import { ShieldCheck, Lock } from 'lucide-react-native';

function AppContent() {
  const { isAuthenticated, authenticate } = useBiometricShield();
  useKillSwitch();

  if (!isAuthenticated) {
    return (
      <View style={styles.lockedContainer}>
        <StatusBar style="light" />
        <View style={styles.lockedIconContainer}>
          <Lock size={64} color={THEME.colors.primary} />
        </View>
        <Text style={styles.lockedTitle}>SOVEREIGN_NODE_LOCKED</Text>
        <Text style={styles.lockedSubtitle}>Authentication required to re-establish secure link.</Text>
        
        <TouchableOpacity 
          onPress={authenticate}
          style={styles.unlockButton}
        >
          <ShieldCheck size={16} color={THEME.colors.background} />
          <Text style={styles.unlockButtonText}>RE_AUTHENTICATE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator 
        initialRouteName="Scanner"
        screenOptions={globalScreenOptions}
      >
        <Stack.Screen name="Dashboard" component={ExecutiveDashboard} />
        <Stack.Screen name="Scanner" component={QRScannerScreen} />
        <Stack.Screen name="Ledger" component={PartyLedgerView} />
        <Stack.Screen name="TacticalChat" component={TacticalChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  lockedContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  lockedIconContainer: {
    marginBottom: 32,
    opacity: 0.8,
  },
  lockedTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 12,
    fontFamily: 'System', // Standard for resilience
  },
  lockedSubtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 18,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  unlockButton: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: THEME.radius.sm,
    gap: 12,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  unlockButtonText: {
    color: THEME.colors.background,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  }
});

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
