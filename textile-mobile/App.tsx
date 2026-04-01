import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import type { StackNavigationOptions } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ExecutiveDashboard } from './src/screens/ExecutiveDashboard';
import { QRScannerScreen } from './src/screens/QRScannerScreen';
import { PartyLedgerView } from './src/screens/PartyLedgerView';
import type { RootStackParamList } from './src/lib/types';

const Stack = createStackNavigator<RootStackParamList>();

const globalScreenOptions: StackNavigationOptions = {
  headerShown: false,
  cardStyle: { backgroundColor: '#09090b' },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator 
          initialRouteName="Dashboard"
          screenOptions={globalScreenOptions}
        >
          <Stack.Screen name="Dashboard" component={ExecutiveDashboard} />
          <Stack.Screen name="Scanner" component={QRScannerScreen} />
          <Stack.Screen name="Ledger" component={PartyLedgerView} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
