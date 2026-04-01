import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { AuthorizedDevice, DeviceStats } from '../types/database';

export const useDevices = () => {
  const [devices, setDevices] = useState<AuthorizedDevice[]>([]);
  const [stats, setStats] = useState<DeviceStats>({ active_count: 0, remaining_slots: 4 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('authorized_devices')
        .select('*')
        .order('authorized_at', { ascending: false });

      if (error) throw error;
      setDevices((data as AuthorizedDevice[]) || []);
      
      const activeCount = (data || []).filter(d => d.status === 'active').length;
      setStats({
        active_count: activeCount,
        remaining_slots: 4 - activeCount
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();

    // Realtime subscription
    const subscription = supabase
      .channel('authorized_devices_changes')
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any, 
        { event: '*', table: 'authorized_devices' }, 
        () => {
          fetchDevices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const addDevice = async (uuid: string, name: string, type: 'pc' | 'mobile') => {
    try {
      // Client-side UX guard (DB will also enforce this)
      if (stats.active_count >= 4) {
        throw new Error('Maximum device limit (4) reached.');
      }

      const { error } = await supabase
        .from('authorized_devices')
        .insert([{
          device_uuid: uuid,
          device_name: name,
          device_type: type,
          status: 'active',
          last_active: new Date().toISOString()
        }]);

      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add device';
      setError(message);
      return { success: false, error: message };
    }
  };

  const revokeDevice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('authorized_devices')
        .update({ status: 'revoked' })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to revoke device';
      setError(message);
      return { success: false, error: message };
    }
  };

  const updateLastActive = async (uuid: string) => {
    try {
      const { error } = await supabase
        .from('authorized_devices')
        .update({ last_active: new Date().toISOString() })
        .eq('device_uuid', uuid)
        .eq('status', 'active');

      if (error) throw error;
    } catch (err) {
      console.error('Failed to update last active:', err);
    }
  };

  return {
    devices,
    stats,
    loading,
    error,
    addDevice,
    revokeDevice,
    updateLastActive,
    refresh: fetchDevices
  };
};
