import { useEffect, useRef } from 'react';
import { useBusinessProfileStore, BusinessProfile } from '@/store/BusinessProfileStore';
import { createClient } from '@/lib/supabase/client';
import { getCurrencySymbol } from '@/lib/constants/currencies';

export const useBusinessProfile = () => {
  const { profile, isLoaded, setProfile, setLoaded, setOffline } = useBusinessProfileStore();
  const supabase = createClient();
  const fetchAttempted = useRef(false);

  useEffect(() => {
    // Skip if we already attempted fetching in this session to prevent infinite loops
    if (fetchAttempted.current) return;
    fetchAttempted.current = true;

    const fetchProfile = async () => {
      try {
        // Use getSession() instead of getUser() to avoid Navigator Lock contention.
        // getUser() acquires the auth lock which conflicts when multiple hooks 
        // (sidebar, persona, profile) all call it simultaneously on page load.
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setLoaded(true);
          return;
        }

        const { data, error } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116' || error.code === '406') {
            setProfile(null);
          }
          console.error('Profile fetch error:', error);
          setOffline(true);
        } else {
          setProfile(data);
          setOffline(false);

          // Persist business_id to local SQLite for background processes (TCP Server)
          if (data?.id) {
            fetch('/api/settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'local_config',
                data: { business_id: data.id }
              })
            }).catch(e => console.error('Failed to sync business_id to local DB', e));
          }
        }
      } catch (err) {
        console.error('Connection error:', err);
        setOffline(true);
      } finally {
        setLoaded(true);
      }
    };

    fetchProfile();
  }, [setProfile, setLoaded, setOffline, supabase]); // Removed 'profile' to prevent loop

  return {
    profile,
    setProfile,
    role: profile?.role,
    industryType: profile?.industry_type,
    businessName: profile?.business_name,
    currency: profile?.currency || 'PKR',
    currencySymbol: getCurrencySymbol(profile?.currency || 'PKR'),
    taxName: profile?.tax_name || 'GST',
    taxRate: profile?.tax_rate || 0,
    countryCode: profile?.country_code || 'PK',
    isManufacturer: profile?.role === 'manufacturer',
    isWholesaler: profile?.role === 'wholesaler',
    isRetailer: profile?.role === 'retailer',
  };
};
