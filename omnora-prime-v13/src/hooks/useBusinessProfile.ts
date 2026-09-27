import { useEffect, useRef } from 'react';
import { useBusinessProfileStore, BusinessProfile } from '@/store/BusinessProfileStore';
import { createClient } from '@/lib/supabase/client';
import { getCurrencySymbol } from '@/lib/constants/currencies';

const isUuid = (val: string | null | undefined): boolean => {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
};

const DEFAULT_BIZ_ID = '00000000-0000-0000-0000-000000000000';

export const useBusinessProfile = () => {
  const { profile, isLoaded, setProfile, setLoaded, setOffline } = useBusinessProfileStore();
  const supabase = createClient();
  const fetchAttempted = useRef(false);

  // Sanitize cached profile if it contains invalid non-UUID string
  // Use a ref to ensure this only fires once and does not create an infinite loop
  const sanitizedRef = useRef(false);
  useEffect(() => {
    if (sanitizedRef.current) return;
    if (profile?.id && !isUuid(profile.id)) {
      sanitizedRef.current = true;
      setProfile({
        ...profile,
        id: DEFAULT_BIZ_ID
      });
    }
  // profile is intentionally excluded from deps to prevent infinite loop:
  // setProfile updates profile, which would re-trigger this effect infinitely.
  // sanitizedRef.current guards against double-execution.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setProfile]);

  useEffect(() => {
    // 1. Try localStorage first (instant, 0ms)
    if (typeof window !== 'undefined') {
      const cachedProfile = localStorage.getItem('noxis-business-profile') || localStorage.getItem('noxis_business_profile');
      if (cachedProfile) {
        try {
          const parsed = JSON.parse(cachedProfile);
          if (parsed && parsed.id) {
            setProfile(parsed);
            setLoaded(true);
          }
        } catch (e) {}
      }

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
      // If offline, do not attempt remote network fetch
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setOffline(true);
        setLoaded(true);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          try {
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 1500);
            const localRes = await fetch('/api/settings', { signal: ctrl.signal }).catch(() => null);
            clearTimeout(tid);
            const localData = localRes && localRes.ok ? await localRes.json() : {};
            const configMap = (localData.localConfig || []).reduce((acc: any, c: any) => ({ ...acc, [c.key]: c.value }), {});
            
            const rawBizId = configMap.business_id || (typeof window !== 'undefined' ? localStorage.getItem('noxis_business_id') : null);
            const bizId = isUuid(rawBizId) ? rawBizId : DEFAULT_BIZ_ID;
            const existing = useBusinessProfileStore.getState().profile || ({} as any);
            const cachedLogo = typeof window !== 'undefined' ? (localStorage.getItem('noxis_logo') || localStorage.getItem('noxis_avatar_url')) : null;
            const resolvedLogo = configMap.logo_url || configMap.avatar_url || cachedLogo || existing.logo_url || existing.avatar_url || '';
            const resolvedAvatar = configMap.avatar_url || resolvedLogo || existing.avatar_url || '';

            setProfile({
              id: bizId,
              business_name: configMap.business_name || existing.business_name || 'Noxis Business',
              owner_name: configMap.owner_name || existing.owner_name || 'Noxis Owner',
              tier: configMap.tier || existing.tier || 'lite',
              industry_type: configMap.industry_type || existing.industry_type || 'general',
              industry_key: configMap.industry_key || existing.industry_key || 'general',
              role: configMap.role || existing.role || 'retailer',
              currency: configMap.currency || existing.currency || 'PKR',
              region: configMap.region || existing.region || 'south_asian',
              country_code: configMap.country_code || existing.country_code || 'PK',
              tax_name: configMap.tax_name || existing.tax_name || 'GST',
              tax_number: configMap.tax_number || existing.tax_number || '',
              tax_rate: Number(configMap.tax_rate ?? existing.tax_rate ?? 0),
              address: configMap.address || existing.address || '',
              phone: configMap.phone || existing.phone || '',
              logo_url: resolvedLogo,
              avatar_url: resolvedAvatar,
              avatar_type: (configMap.avatar_type || existing.avatar_type || 'custom') as any,
              avatar_last_changed: configMap.avatar_last_changed || existing.avatar_last_changed || '',
              preferred_locale: configMap.preferred_locale || existing.preferred_locale || 'en',
              visual_theme: configMap.visual_theme || existing.visual_theme,
            } as any);
          } catch {
            const existing = useBusinessProfileStore.getState().profile || ({} as any);
            setProfile({ 
              id: DEFAULT_BIZ_ID, 
              business_name: existing.business_name || 'Noxis Business', 
              role: 'retailer', 
              currency: 'PKR',
              logo_url: existing.logo_url || (typeof window !== 'undefined' ? localStorage.getItem('noxis_logo') : '') || '',
              avatar_url: existing.avatar_url || '',
            } as any);
          }
          setLoaded(true);
          return;
        }

        const { data, error } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          console.error('Profile fetch error:', error);
          setOffline(true);

          // Secondary Fallback Layer: Load from local SQLite config or default profile if none exists
          if (!profile) {
            try {
              const ctrl = new AbortController();
              const tid = setTimeout(() => ctrl.abort(), 1500);
              const localRes = await fetch('/api/settings', { signal: ctrl.signal }).catch(() => null);
              clearTimeout(tid);
              const localData = localRes && localRes.ok ? await localRes.json() : {};
              const configMap = (localData.localConfig || []).reduce((acc: any, c: any) => ({ ...acc, [c.key]: c.value }), {});
              
              const bizId = isUuid(configMap.business_id) ? configMap.business_id : DEFAULT_BIZ_ID;
              const existing = useBusinessProfileStore.getState().profile || ({} as any);
              const cachedLogo = typeof window !== 'undefined' ? (localStorage.getItem('noxis_logo') || localStorage.getItem('noxis_avatar_url')) : null;
              const resolvedLogo = configMap.logo_url || configMap.avatar_url || cachedLogo || existing.logo_url || existing.avatar_url || '';
              const resolvedAvatar = configMap.avatar_url || resolvedLogo || existing.avatar_url || '';

              const fallbackProfile: any = {
                id: bizId,
                business_name: configMap.business_name || existing.business_name || 'Noxis Business',
                owner_name: configMap.owner_name || existing.owner_name || 'Noxis Owner',
                avatar_type: (configMap.avatar_type || existing.avatar_type || 'custom') as any,
                avatar_preset_id: Number(configMap.avatar_preset_id || 1),
                logo_url: resolvedLogo,
                avatar_url: resolvedAvatar,
                avatar_last_changed: configMap.avatar_last_changed || existing.avatar_last_changed || '',
                tier: configMap.tier || existing.tier || 'lite',
                industry_type: configMap.industry_type || existing.industry_type || 'general',
                industry_key: configMap.industry_key || existing.industry_key || 'general',
                role: configMap.role || existing.role || 'retailer',
                currency: configMap.currency || existing.currency || 'PKR',
                region: configMap.region || existing.region || 'south_asian',
                country_code: configMap.country_code || existing.country_code || 'PK',
                tax_name: configMap.tax_name || existing.tax_name || 'GST',
                tax_number: configMap.tax_number || existing.tax_number || '',
                tax_rate: Number(configMap.tax_rate ?? existing.tax_rate ?? 0),
                address: configMap.address || existing.address || '',
                preferred_locale: configMap.preferred_locale || existing.preferred_locale || 'en',
              };
              setProfile(fallbackProfile);
            } catch (localErr) {
              setProfile({ id: DEFAULT_BIZ_ID, business_name: 'Noxis Business', role: 'retailer', currency: 'PKR' } as any);
            }
          }
        } else {
          const existing = useBusinessProfileStore.getState().profile || ({} as any);
          const cachedLogo = typeof window !== 'undefined' ? (localStorage.getItem('noxis_logo') || localStorage.getItem('noxis_avatar_url')) : null;
          const finalLogo = (data as any).logo_url || existing.logo_url || cachedLogo || (data as any).avatar_url || '';

          setProfile({
            ...data,
            logo_url: finalLogo,
            avatar_url: (data as any).avatar_url || finalLogo,
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
                  avatar_url: (data as any).avatar_url || finalLogo,
                  logo_url: finalLogo,
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
    isLoaded,
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
