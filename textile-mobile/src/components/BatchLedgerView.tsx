import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Transaction {
  id: string;
  type: 'IN' | 'OUT';
  quantity: number;
  created_at: string;
}

interface BatchLedgerViewProps {
  batch: {
    id: string;
    item_name: string;
    item_category: string;
    current_gaz: number;
  };
}

export const BatchLedgerView: React.FC<BatchLedgerViewProps> = ({ batch }) => {
  // In a full implementation, we would fetch transaction history here
  const mockHistory: Transaction[] = [
    { id: '1', type: 'IN', quantity: 500, created_at: new Date().toISOString() },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>BATCH LEDGER HISTORY</Text>
        <Text style={styles.title}>{batch.item_name}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>HOLDING</Text>
            <Text style={styles.statValue}>{batch.current_gaz.toFixed(2)} GAZ</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>CATEGORY</Text>
            <Text style={styles.statValue}>{batch.item_category.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.historyScroll}>
        {mockHistory.map((item) => (
          <View key={item.id} style={styles.historyItem}>
            <View style={[styles.typeBadge, item.type === 'IN' ? styles.badgeIn : styles.badgeOut]}>
              <Ionicons 
                name={item.type === 'IN' ? 'add-circle' : 'remove-circle'} 
                size={14} 
                color={item.type === 'IN' ? '#10b981' : '#ef4444'} 
              />
              <Text style={[styles.typeText, item.type === 'IN' ? styles.textIn : styles.textOut]}>
                {item.type}
              </Text>
            </View>
            <Text style={styles.historyQty}>{item.quantity.toFixed(2)} GAZ</Text>
            <Text style={styles.historyDate}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: { paddingBottom: 20, borderBottomWidth: 1, borderColor: '#18181b' },
  label: { color: '#52525b', fontSize: 9, fontWeight: 'bold', letterSpacing: 2, marginBottom: 8 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', gap: 24, marginTop: 16 },
  stat: {},
  statLabel: { color: '#3f3f46', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  statValue: { color: '#D4AF37', fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  
  historyScroll: { flex: 1, marginTop: 20 },
  historyItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#18181b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#27272a'
  },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: '#09090b' },
  badgeIn: { borderColor: '#10b98120', borderWidth: 1 },
  badgeOut: { borderColor: '#ef444420', borderWidth: 1 },
  typeText: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  textIn: { color: '#10b981' },
  textOut: { color: '#ef4444' },
  historyQty: { color: '#fff', fontSize: 12, fontWeight: '900', fontVariant: ['tabular-nums'] },
  historyDate: { color: '#3f3f46', fontSize: 9, fontWeight: 'bold' },
});
