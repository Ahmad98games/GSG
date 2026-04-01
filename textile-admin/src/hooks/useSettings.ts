import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export const useSettings = () => {
  const [overhead, setOverhead] = useState<number>(5.0);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'dyeing_overhead')
        .single();

      if (error) throw error;
      if (data) {
        setOverhead(parseFloat(data.value as string));
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    // Realtime subscription for settings
    const subscription = supabase
      .channel('system_config_changes')
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: 'UPDATE', table: 'system_config', filter: `key=eq.dyeing_overhead` },
        (payload: RealtimePostgresChangesPayload<{ value: string }>) => {
          const newData = payload.new as { value: string };
          if (newData && newData.value) {
            setOverhead(parseFloat(newData.value));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchSettings]);

  return { overhead, loading, refreshSettings: fetchSettings };
};
