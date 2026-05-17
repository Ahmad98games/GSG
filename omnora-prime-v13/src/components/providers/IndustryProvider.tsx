'use client'
import React, { createContext, useContext, useEffect, useState } from 'react';
import { IndustryType, IndustryBlueprint, CENTRAL_INDUSTRY_REGISTRY } from '@/lib/constants/industries';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { createClient } from '@/lib/supabase/client';

interface IndustryContextType {
  activeIndustry: IndustryBlueprint;
  switchIndustry: (type: IndustryType) => Promise<void>;
  isChanging: boolean;
}

const IndustryContext = createContext<IndustryContextType | undefined>(undefined);

export function IndustryProvider({ children }: { children: React.ReactNode }) {
  const { profile, setProfile } = useBusinessProfile();
  const [activeIndustry, setActiveIndustry] = useState<IndustryBlueprint>(CENTRAL_INDUSTRY_REGISTRY.kapra);
  const [isChanging, setIsChanging] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (profile?.industry_type) {
      const industry = CENTRAL_INDUSTRY_REGISTRY[profile.industry_type as IndustryType];
      if (industry) {
        setActiveIndustry(industry);
      }
    }
  }, [profile?.industry_type]);

  const switchIndustry = async (type: IndustryType) => {
    if (!profile) return;
    setIsChanging(true);
    try {
      const industry = CENTRAL_INDUSTRY_REGISTRY[type];
      if (!industry) throw new Error(`Invalid industry type: ${type}`);

      const { error } = await supabase
        .from('business_profiles')
        .update({ industry_type: type })
        .eq('id', profile.id);

      if (error) throw error;

      setActiveIndustry(industry);
      setProfile({ ...profile, industry_type: type } as any);
      
      // Optional: Force a soft reload or clear specific caches
      window.location.reload(); // Simplest way to ensure all components react to the morph
    } catch (err) {
      console.error('Failed to switch industry:', err);
      alert('Failed to morph system. Please check your connection.');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <IndustryContext.Provider value={{ activeIndustry, switchIndustry, isChanging }}>
      {children}
    </IndustryContext.Provider>
  );
}

export function useIndustry() {
  const context = useContext(IndustryContext);
  if (!context) {
    throw new Error('useIndustry must be used within an IndustryProvider');
  }
  return context;
}

export function useIndustryLabels() {
  const { activeIndustry } = useIndustry();
  
  const getIndustryLabel = (key: keyof IndustryBlueprint['terminology'] | 'unit' | 'stock' | 'persona' | 'customer') => {
    const t = activeIndustry.terminology;
    switch(key) {
      case 'unit': return t.primaryUnit;
      case 'stock': return t.stockLabel;
      case 'persona': return t.personaName;
      case 'customer': return t.customerLabel;
      default: return (t as any)[key] || key;
    }
  };

  return { 
    ...activeIndustry.terminology,
    getIndustryLabel
  };
}
