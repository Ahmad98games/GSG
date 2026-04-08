import { useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useProductStore } from '../store/useProductStore';
import * as Haptics from 'expo-haptics';

/**
 * Tactical Kill Switch Protocol
 * Listens for remote session revocation from PC Admin Node.
 */
export const useKillSwitch = () => {
  const resetSession = useProductStore((state) => state.resetSession);
  const mode = useProductStore((state) => state.mode);

  useEffect(() => {
    const channel = supabase.channel('handshake_sync')
      .on('broadcast', { event: 'NODE_REVOKE' }, async ({ payload }) => {
        // payload: { targetId: 'FIELD_NODE_01' }
        console.log('REMOTE_KILL RECEIVED:', payload);
        
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        Alert.alert(
          "PROTOCOL_TERMINATED",
          "Session has been revoked by PC_ROOT_ADMIN. Immediate lockdown enforced.",
          [{ text: "OK", onPress: () => resetSession() }]
        );

        resetSession();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [resetSession]);

  return null;
};
