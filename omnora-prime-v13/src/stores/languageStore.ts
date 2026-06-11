import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LanguageCode = 
  | 'en' | 'ur' | 'ar' | 'hi' | 'bn' 
  | 'pa' | 'zh' | 'tr' | 'es' | 'ru' 
  | 'ta' | 'fr' | 'fa' | 'de' | 'he' | 'ps';

interface LanguageStore {
  language: LanguageCode;
  isRTL: boolean;
  setLanguage: (lang: LanguageCode) => void;
}

const RTL_LANGS: LanguageCode[] = ['ur', 'ar', 'fa', 'he', 'ps'];

/** Apply locale-specific DOM attributes to the html element. */
function applyDOMLocale(lang: LanguageCode): void {
  if (typeof document === 'undefined') return;
  const isRTL = RTL_LANGS.includes(lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.body.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.style.fontFamily = (lang === 'ur' || lang === 'ar')
    ? '"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", serif'
    : '"Inter", system-ui, sans-serif';
  // Remove any previous lang-* class then add new one
  const cls = document.documentElement.classList;
  const existing = [...cls].find(c => c.startsWith('lang-'));
  if (existing) cls.remove(existing);
  cls.add(`lang-${lang}`);
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'en',
      isRTL: false,
      setLanguage: (lang) => {
        const isRTL = RTL_LANGS.includes(lang);
        set({ language: lang, isRTL });
        applyDOMLocale(lang);
      },
    }),
    {
      name: 'noxis-globalization-state',
      onRehydrateStorage: () => (state) => {
        // Apply stored locale to DOM immediately after hydration
        if (state?.language) {
          applyDOMLocale(state.language);
        }
      },
    }
  )
);
