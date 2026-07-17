import { useEffect, useRef } from 'react';
import { useBusinessProfileStore, BusinessProfile } from '@/store/BusinessProfileStore';
import { createClient } from '@/lib/supabase/client';
import { getCurrencySymbol } from '@/lib/constants/currencies';

export const useBusinessProfile = () => {
  const { profile, isLoaded, setProfile, setLoaded, setOffline } = useBusinessProfileStore();
  const supabase = createClient();
  const fetchAttempted = useRef(false);

  useEffect(() => {
    // 1. Try localStorage first (instant, 0ms)
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('noxis_avatar');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (profile) {
            if (profile.avatar_type !== parsed.type || 
                profile.avatar_preset_id !== parsed.preset_id || 
                profile.avatar_url !== parsed.url) {
              setProfile({
                ...profile,
                avatar_type: parsed.type,
                avatar_preset_id: parsed.preset_id,
                avatar_url: parsed.url,
                avatar_last_changed: parsed.saved_at,
              });
            }
          } else {
            setProfile({
              avatar_type: parsed.type,
              avatar_preset_id: parsed.preset_id,
              avatar_url: parsed.url,
              avatar_last_changed: parsed.saved_at,
            } as any);
          }
        } catch (e) {
          console.error('Failed to parse cached avatar on hook mount:', e);
        }
      }
    }

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

          // Secondary Fallback Layer: Load from local SQLite config
          try {
            const localRes = await fetch('/api/settings');
            const localData = await localRes.json();
            const configMap = (localData.localConfig || []).reduce((acc: any, c: any) => ({ ...acc, [c.key]: c.value }), {});
            
            if (configMap.business_id) {
              const fallbackProfile: any = {
                id: configMap.business_id,
                business_name: configMap.business_name || 'Noxis Business',
                owner_name: configMap.owner_name || 'Noxis Owner',
                avatar_type: (configMap.avatar_type || 'preset') as any,
                avatar_preset_id: Number(configMap.avatar_preset_id || 1),
                avatar_url: configMap.avatar_url || '',
                avatar_last_changed: configMap.avatar_last_changed || '',
                tier: configMap.tier || 'lite',
                industry_type: configMap.industry_type || 'general',
                industry_key: configMap.industry_key || 'general',
                role: configMap.role || 'retailer',
                currency: configMap.currency || 'PKR',
                region: configMap.region || 'south_asian',
                country_code: configMap.country_code || 'PK',
                tax_name: configMap.tax_name || 'GST',
                tax_rate: Number(configMap.tax_rate || 0),
                preferred_locale: configMap.preferred_locale || 'en',
              };
              setProfile(fallbackProfile);
            }
          } catch (localErr) {
            console.error('Failed to load local config fallback:', localErr);
          }
        } else {
          setProfile({
            ...data,
            owner_phone: (data as any).owner_phone || (data as any).phone || ""
          });
          setOffline(false);

          // Persist business_id and details to local SQLite for background processes and fallbacks
          if (data?.id) {
            fetch('/api/settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'local_config',
                data: { 
                  business_id: data.id,
                  business_name: data.business_name || '',
                  owner_name: (data as any).owner_name || '',
                  avatar_type: data.avatar_type || 'preset',
                  avatar_preset_id: data.avatar_preset_id || 1,
                  avatar_url: data.avatar_url || '',
                  avatar_last_changed: data.avatar_last_changed || '',
                  tier: data.tier || 'lite',
                  industry_type: data.industry_type || 'general',
                  industry_key: data.industry_key || data.industry || 'general',
                  role: data.role || 'retailer',
                  currency: data.currency || 'PKR',
                  region: data.region || 'south_asian',
                  country_code: data.country_code || 'PK',
                  tax_name: data.tax_name || 'GST',
                  tax_rate: String(data.tax_rate || 0),
                  preferred_locale: data.preferred_locale || 'en',
                }
              })
            }).catch(e => console.error('Failed to sync business details to local DB', e));
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
