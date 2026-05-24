import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type BusinessRole = 'manufacturer' | 'wholesaler' | 'retailer';
export type IndustryType = 'textile' | 'medical' | 'auto' | 'general';

export interface BusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  owner_name?: string;
  role: BusinessRole;
  industry_type: string;
  industry_key: string;
  region: 'south_asian' | 'international';
  country_code: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  currency: string;
  tax_label?: string;
  tax_name?: string;
  tax_rate?: number;
  tax_number?: string;
  logo_url?: string;
  visual_theme?: string;
  onboarding_done: boolean;
  persona_locked: boolean;
  whatsapp_config?: Record<string, unknown>;
  date_format?: string;
  created_at: string;
  tier?: string;
  owner_phone?: string;
  avatar_url?: string;
  avatar_type?: 'preset' | 'custom';
  avatar_preset_id?: number;
  avatar_last_changed?: string;
  worker_term?: string;
  preferred_locale?: string;
  whatsapp_numbers?: { name: string; phone: string }[];
  summary_frequency?: number;
  summary_time?: string;
  summary_includes?: Record<string, boolean>;
}


interface BusinessProfileState {
  profile: BusinessProfile | null;
  isLoaded: boolean;
  isOffline: boolean;
  setProfile: (profile: BusinessProfile | null) => void;
  setLoaded: (loaded: boolean) => void;
  setOffline: (offline: boolean) => void;
  clearCache: () => void;
  reset: () => void;
}

export const useBusinessProfileStore = create<BusinessProfileState>()(
  persist(
    (set) => ({
      profile: null,
      isLoaded: false,
      isOffline: false,
      setProfile: (profile: BusinessProfile | null) => set({ profile, isLoaded: true }),
      setLoaded: (loaded: boolean) => set({ isLoaded: loaded }),
      setOffline: (offline: boolean) => set({ isOffline: offline }),
      clearCache: () => set({ profile: null, isLoaded: false }),
      reset: () => set({ profile: null, isLoaded: false, isOffline: false }),
    }),
    {
      name: 'NOXIS-profile-cache',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : (null as any))),
      onRehydrateStorage: () => (state: BusinessProfileState | undefined) => {
        if (state) {
          state.setLoaded(true);
          if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('noxis_avatar');
            if (cached) {
              try {
                const parsed = JSON.parse(cached);
                if (state.profile) {
                  state.profile.avatar_type = parsed.type;
                  state.profile.avatar_preset_id = parsed.preset_id;
                  state.profile.avatar_url = parsed.url;
                  state.profile.avatar_last_changed = parsed.saved_at;
                } else {
                  state.profile = {
                    avatar_type: parsed.type,
                    avatar_preset_id: parsed.preset_id,
                    avatar_url: parsed.url,
                    avatar_last_changed: parsed.saved_at,
                  } as any;
                }
              } catch (e) {
                console.error('Failed to parse cached avatar on hydration:', e);
              }
            }
          }
        }
      },
    }
  )
);

