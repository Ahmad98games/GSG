import { useMemo } from 'react'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import {
  getIndustryConfig,
  IndustryConfig,
} from '@/lib/industry/configs'
import {
  getRegionConfig,
  RegionConfig,
} from '@/lib/industry/regionConfigs'

export interface NoxisPersona {
  industry: IndustryConfig
  region: RegionConfig

  // Convenience shortcuts
  t: IndustryConfig['terms']
  nav: IndustryConfig['sidebar']
  features: IndustryConfig['features']

  // Currency formatting
  fmt: (amount: number) => string
  fmtCompact: (amount: number) => string

  // Date formatting
  fmtDate: (date: string | Date) => string
}

export function useIndustryConfig(): NoxisPersona {
  const { profile } = useBusinessProfile()

  return useMemo(() => {
    const industry = getIndustryConfig(
      profile?.industry_key || profile?.industry_type
    )
    const region = getRegionConfig(
      profile?.country_code
    )

    const fmt = (amount: number) =>
      `${region.currencySymbol} ${amount.toLocaleString(
        region.defaultLanguage,
        {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }
      )}`

    const fmtCompact = (amount: number) => {
      if (amount >= 1_000_000) {
        return `${region.currencySymbol} ${(amount / 1_000_000).toFixed(1)}M`
      }
      if (amount >= 1_000) {
        return `${region.currencySymbol} ${(amount / 1_000).toFixed(0)}K`
      }
      return fmt(amount)
    }

    const fmtDate = (date: string | Date) => {
      const d = typeof date === 'string'
        ? new Date(date) : date
      if (region.dateFormat === 'MM/DD/YYYY') {
        return d.toLocaleDateString('en-US')
      }
      return d.toLocaleDateString('en-GB')
    }

    return {
      industry,
      region,
      t: industry.terms,
      nav: industry.sidebar,
      features: industry.features,
      fmt,
      fmtCompact,
      fmtDate,
    }
  }, [
    profile?.industry_key,
    profile?.industry_type,
    profile?.country_code,
  ])
}
