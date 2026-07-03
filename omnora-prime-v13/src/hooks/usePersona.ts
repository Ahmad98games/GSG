import { useEffect, useMemo, useCallback } from 'react';
import { Decimal } from 'decimal.js';
import { PersonaEngine } from '@/lib/persona/PersonaEngine';
import { useBusinessProfileStore } from '@/store/BusinessProfileStore';
import { IndustryProfile, IndustryId } from '@/lib/persona/industries';
import { useIndustryConfig } from './useIndustryConfig';

export function usePersona() {
  const industryConfig = useIndustryConfig();
  const profile = useBusinessProfileStore(
    s => s.profile
  );
  
  useEffect(() => {
    if (profile?.industry_key) {
      PersonaEngine.initialize(profile.industry_key);
    }
  }, [profile?.industry_key]);

  const term = useCallback((key: keyof IndustryProfile['terms']) => {
    const termMap: Record<string, string> = {
      worker: industryConfig.t.worker,
      workers: industryConfig.t.workers,
      advance: industryConfig.t.advance,
      invoice: industryConfig.t.invoice,
      invoices: industryConfig.t.invoices,
    };
    return termMap[key as string] || (industryConfig.t as any)[key as string] || PersonaEngine.term(key);
  }, [industryConfig.t]);
    
  const hasModule = useCallback((id: string) =>
    industryConfig.features[id as keyof typeof industryConfig.features] ?? PersonaEngine.hasModule(id), [industryConfig.features]);

  const fmt = useCallback((amount: Decimal | number | string, options?: any) => {
    let num = 0;
    if (amount instanceof Decimal) num = amount.toNumber();
    else if (typeof amount === 'string') num = parseFloat(amount) || 0;
    else num = amount || 0;
    return industryConfig.fmt(num);
  }, [industryConfig]);

  const t = useCallback((key: string, fb?: any) => {
    const termMap: Record<string, string> = {
      worker: industryConfig.t.worker,
      workers: industryConfig.t.workers,
      advance: industryConfig.t.advance,
      invoice: industryConfig.t.invoice,
      invoices: industryConfig.t.invoices,
    };
    return termMap[key] || (industryConfig.t as any)[key] || PersonaEngine.t(key, fb);
  }, [industryConfig.t]);
  
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
      industryConfig.fmtDate(date),
    fmtQty: (qty: Decimal | number, unit: string) =>
      PersonaEngine.fmtQty(qty, unit),
    vocab: (key: any) => {
      const termMap: Record<string, string> = {
        worker: industryConfig.t.worker,
        workers: industryConfig.t.workers,
        advance: industryConfig.t.advance,
        invoice: industryConfig.t.invoice,
        invoices: industryConfig.t.invoices,
      };
      return termMap[key] || (industryConfig.t as any)[key] || PersonaEngine.term(key);
    },
    t,
    
    // Common terms
    workerTerm: industryConfig.t.worker,
    workerTermPlural: industryConfig.t.workers,
    // Legacy compatibility
    persona: profile,
    can: (feature: string) => industryConfig.features[feature as keyof typeof industryConfig.features] ?? PersonaEngine.hasModule(feature),
    isSA: profile?.region === 'south_asian',
    taxRate: industryConfig.region.taxRate,
    taxLabel: industryConfig.region.taxLabel,
    currency: industryConfig.region.currency,
    
    industry: profile?.industry_key as IndustryId | undefined,
    region: profile?.region,
    businessId: profile?.id,
    isLoading: !profile,
    profile
  }), [profile, term, hasModule, fmt, t, industryConfig]);
}
