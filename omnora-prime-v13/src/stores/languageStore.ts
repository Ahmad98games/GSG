import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LanguageCode = 
  | 'en' | 'ur' | 'ar' | 'hi' | 'bn' 
  | 'pa' | 'zh' | 'tr' | 'es' | 'ru' 
  | 'ta' | 'fr';

interface LanguageStore {
  language: LanguageCode;
  isRTL: boolean;
  setLanguage: (lang: LanguageCode) => void;
}

const RTL_LANGS: LanguageCode[] = ['ur', 'ar', 'pa'];

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'en',
      isRTL: false,
      setLanguage: (lang) => {
        set({ language: lang, isRTL: RTL_LANGS.includes(lang) });
      }
    }),
    { 
      name: 'noxis-globalization-state'
    }
  )
);
