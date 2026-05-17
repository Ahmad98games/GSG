import { useEffect, useMemo, useCallback } from 'react';
import { Decimal } from 'decimal.js';
import { PersonaEngine } from '@/lib/persona/PersonaEngine';
import { useBusinessProfileStore } from '@/store/BusinessProfileStore';
import { IndustryProfile, IndustryId } from '@/lib/persona/industries';

export function usePersona() {
  const profile = useBusinessProfileStore(
    s => s.profile
  )
  
  useEffect(() => {
    if (profile?.industry_key) {
      PersonaEngine.initialize(profile.industry_key)
    }
  }, [profile?.industry_key])

  const term = useCallback((key: keyof IndustryProfile['terms']) =>
    PersonaEngine.term(key), []);
    
  const hasModule = useCallback((id: string) =>
    PersonaEngine.hasModule(id), []);

  const fmt = useCallback((amount: Decimal | number | string, options?: any) => 
    PersonaEngine.fmt(amount, options), []);

  const t = useCallback((key: string, fb?: any) => 
    PersonaEngine.t(key, fb), []);
  
  return useMemo(() => ({
    engine: PersonaEngine,
    term,
    hasModule,
    getCalculators: () => PersonaEngine.getCalculators(),
    getConverters: () => PersonaEngine.getConverters(),
    getGenerators: () => PersonaEngine.getGenerators(),
    
    // UI Helpers
    fmt,
    fmtDate: (date: Date | string, options?: any) =>
      PersonaEngine.formatDate(date, options),
    fmtQty: (qty: Decimal | number, unit: string) =>
      PersonaEngine.fmtQty(qty, unit),
    vocab: (key: any) => PersonaEngine.term(key),
    t,
    
    // Common terms
    workerTerm: PersonaEngine.term('worker'),
    workerTermPlural: PersonaEngine.term('workers'),
    // Legacy compatibility
    persona: profile,
    can: (feature: string) => PersonaEngine.hasModule(feature),
    isSA: profile?.region === 'south_asian',
    taxRate: profile?.tax_rate || 0,
    taxLabel: profile?.tax_label || 'Tax',
    currency: profile?.currency || 'PKR',
    
    industry: profile?.industry_key as IndustryId | undefined,
    region: profile?.region,
    businessId: profile?.id,
    isLoading: !profile,
    profile
  }), [profile, term, hasModule, fmt, t]);
}
