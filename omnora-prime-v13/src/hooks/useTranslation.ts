'use client'
import { useLanguageStore } from '@/stores/languageStore'
import { useBusinessProfile } from './useBusinessProfile'
import { TRANSLATIONS, type Language } from '@/lib/i18n/translations'

export function useTranslation() {
  const storeLang = useLanguageStore((state) => state.language)
  const { profile } = useBusinessProfile()
  
  const lang: Language = (storeLang as Language) || (profile?.preferred_locale as Language) || (profile as any)?.language || 'en'

  const t = (key: string): string => {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS['en']
    return (dict as any)?.[key] || (TRANSLATIONS['en'] as any)?.[key] || key
  }

  const isUrdu = lang === 'ur'

  return { t, lang, isUrdu }
}
