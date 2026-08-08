import { useLicenseContext, type LicenseState } from '@/providers/LicenseProvider';

export type LicenseTier = 'free' | 'lite' | 'pro' | 'elite' | null;
export type NonNullTier = 'free' | 'lite' | 'pro' | 'elite';

export function useLicense(): LicenseState {
  return useLicenseContext();
}

