import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Zap, Wifi, Cloud, AlertCircle } from 'lucide-react-native';
import { THEME } from '../lib/theme';

interface SyncStatusBadgeProps {
  isRelayActive?: boolean;
  isCloudActive?: boolean;
  queueLength?: number;
}

export default function SyncStatusBadge({ 
  isRelayActive = true, 
  isCloudActive = true, 
  queueLength = 0 
}: SyncStatusBadgeProps) {
  const [pulse] = useState(new Animated.Value(0.4));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.group}>
        <View style={styles.indicator}>
          <Animated.View style={[
            styles.dot, 
            { backgroundColor: isRelayActive ? THEME.colors.primary : THEME.colors.danger, opacity: pulse }
          ]} />
          <Wifi size={10} color={isRelayActive ? THEME.colors.primary : THEME.colors.textSecondary} />
          <Text style={styles.label}>RELAY</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.indicator}>
          <Cloud size={10} color={isCloudActive ? THEME.colors.primary : THEME.colors.textSecondary} />
          <Text style={styles.label}>CLOUD</Text>
        </View>
      </View>

      {queueLength > 0 && (
        <View style={styles.queueBadge}>
          <AlertCircle size={8} color={THEME.colors.background} />
          <Text style={styles.queueText}>{queueLength} PENDING</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  label: {
    color: THEME.colors.textPrimary,
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 1,
  },
  divider: {
    width: 1,
    height: 8,
    backgroundColor: THEME.colors.border,
  },
  queueBadge: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  queueText: {
    color: THEME.colors.background,
    fontSize: 6,
    fontWeight: '900',
  }
});
