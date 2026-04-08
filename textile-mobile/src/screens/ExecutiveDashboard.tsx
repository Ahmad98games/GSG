import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  StatusBar 
} from 'react-native';
import { 
  Search, 
  QrCode, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Users, 
  ChevronRight,
  MessageSquare,
  ShieldAlert
} from 'lucide-react-native';
import { useProductStore } from '../store/useProductStore';
import * as Haptics from 'expo-haptics';
import type { RootStackParamList } from '../lib/types';
import type { StackNavigationProp } from '@react-navigation/stack';

import { THEME } from '../lib/theme';

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Dashboard'>;
}

export const ExecutiveDashboard = ({ navigation }: Props) => {
  const [search, setSearch] = useState('');
  const parties = useProductStore((state) => state.parties);
  const transactions = useProductStore((state) => state.transactions);

  const filteredParties = useMemo(() => {
    return parties.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, parties]);

  const handleScanPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Scanner');
  };

  const handlePartyPress = async (partyId: string) => {
    await Haptics.selectionAsync();
    navigation.navigate('Ledger', { partyId });
  };

  const renderPartyItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.partyCard}
      onPress={() => handlePartyPress(item.id)}
    >
      <View style={styles.partyInfo}>
        <Text style={styles.partyName}>{item.name}</Text>
        <Text style={styles.partyType}>{item.type.toUpperCase()}</Text>
      </View>
      <View style={styles.partyBalance}>
        <Text style={[
          styles.balanceAmount,
          { color: item.balance >= 0 ? THEME.colors.success : THEME.colors.danger }
        ]}>
          PKR {Math.abs(item.balance).toLocaleString()}
        </Text>
        <ChevronRight size={16} color={THEME.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>OMNORA OS / THE HANDS</Text>
          <Text style={styles.headerTitle}>EXECUTIVE LEDGER</Text>
        </View>
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={handleScanPress}
        >
          <QrCode size={20} color={THEME.colors.background} />
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>OUTSTANDING</Text>
          <Text style={[styles.statValue, { color: THEME.colors.danger }]}>PKR 2.4M</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>NET FLOW</Text>
          <Text style={[styles.statValue, { color: THEME.colors.success }]}>+18%</Text>
        </View>
      </View>

      {/* Tactical Comms Trigger (Phase 7) */}
      <View style={styles.messengerContainer}>
        <TouchableOpacity 
          style={styles.messengerCard}
          onPress={() => navigation.navigate('TacticalChat')}
        >
           <View style={styles.messengerInfo}>
              <View style={styles.pulseIndicator} />
              <Text style={styles.messengerLabel}>TACTICAL_CHAT_ACTIVE</Text>
           </View>
           <MessageSquare size={16} color={THEME.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Party List */}
      <View style={styles.searchContainer}>
        <Search size={16} color={THEME.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          placeholder="SEARCH KHATA..."
          placeholderTextColor={THEME.colors.textSecondary}
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Party List */}
      <FlatList
        data={filteredParties}
        renderItem={renderPartyItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>NO ACTIVE HANDS FOUND</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.colors.secondary,
    letterSpacing: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -1,
  },
  scanButton: {
    backgroundColor: THEME.colors.primary,
    padding: 12,
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 16,
    borderRadius: 16,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: THEME.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'System', // Bold mono feel
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    marginHorizontal: 24,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  partyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 12,
  },
  partyInfo: {
    flex: 1,
  },
  partyName: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 2,
  },
  partyType: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.secondary,
    letterSpacing: 1,
  },
  partyBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceAmount: {
    fontSize: 14,
    fontWeight: '900',
  },
  messengerContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  messengerCard: {
    backgroundColor: THEME.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: THEME.colors.primary + '33',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.primary,
    opacity: 0.8,
  },
  messengerLabel: {
    color: THEME.colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: THEME.colors.textSecondary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
