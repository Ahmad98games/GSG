import { useEffect, useState } from 'react';
import { useBusinessProfile } from './useBusinessProfile';
import { createClient } from '@/lib/supabase/client';
import { humanizeError } from '@/lib/utils/errors';

export type LicenseTier = 'lite' | 'pro' | 'elite' | null;

export function useLicense() {
  const { profile } = useBusinessProfile();
  const [tier, setTier] = useState<LicenseTier>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!profile?.id) {
      setIsLoading(false);
      return;
    }

    const fetchLicense = async () => {
      try {
        const { data, error: lError } = await supabase
          .from('licenses')
          .select('tier')
          .eq('tenant_id', profile.id)
          .eq('status', 'active')
          .limit(1)
          .single();

        if (lError && lError.code !== 'PGRST116') throw lError;
        setTier(data?.tier || 'lite');
      } catch (err: any) {
        console.error("License fetch failure:", err.message || err);
        setError(humanizeError(err, "fetch license"));
        setTier('lite'); // Fallback to safe tier
      } finally {
        setIsLoading(false);
      }
    };

    fetchLicense();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  return { tier, isLoading, error };
}

