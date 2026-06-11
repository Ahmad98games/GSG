import { useLocale as useNextIntlLocale } from 'next-intl';
import { useBusinessProfile } from './useBusinessProfile';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';
import { formatCurrency, formatNumber, formatDate, Locale } from '@/lib/locale-utils';
import { useLanguageStore } from '@/stores/languageStore';

export function useNoxisLocale() {
  const locale = useNextIntlLocale() as Locale;
  const { profile, setProfile } = useBusinessProfile();
  const supabase = createClient();

  // Sync to Supabase if profile locale differs
  useEffect(() => {
    const syncLocale = async () => {
      if (profile?.id && profile.preferred_locale !== locale) {
        const { error } = await supabase
          .from('business_profiles')
          .update({ preferred_locale: locale })
          .eq('id', profile.id);

        if (error) {
          console.error('Failed to sync locale to Supabase:', error);
        }
        
        if (profile) {
          // Update local state to prevent loop
          setProfile({ ...profile, preferred_locale: locale });
        }
      }
    };
    syncLocale();
  }, [locale, profile?.id, profile?.preferred_locale, setProfile, supabase]);

  const changeLocale = (newLocale: string) => {
    // 1. Set cookie for middleware
    document.cookie = `NOXIS_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    // 2. Save to localStorage
    localStorage.setItem('noxis-locale', newLocale);
    // 3. Update the global language store — this also applies dir/lang/font to the DOM immediately
    const { setLanguage } = useLanguageStore.getState();
    setLanguage(newLocale as any);
    // 4. Refresh page to apply server-side locale changes (middleware will handle the rest)
    window.location.reload();
  };

  return {
    locale,
    changeLocale,
    fmt: (amount: number | string) => formatCurrency(amount, locale),
    fmtNum: (val: number | string) => formatNumber(val, locale),
    fmtDate: (date: Date | string) => formatDate(date, locale),
    isRTL: ['ur', 'ar', 'fa', 'he', 'ps'].includes(locale as any)
  };
}
