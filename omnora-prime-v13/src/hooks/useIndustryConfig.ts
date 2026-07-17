import { useMemo } from 'react'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { getIndustryConfig, IndustryConfig } from '@/lib/industry/configs'
import { getRegionConfig, RegionConfig } from '@/lib/industry/regionConfigs'

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
  fmtDate: (date: string | Date | null) => string
  fmtDateTime: (date: string | Date | null) => string

  // Tax display
  fmtTax: (amount: number) => string
  taxLabel: string
  taxRate: number

  // Phone formatting
  fmtPhone: (phone: string | null) => string
  formatForWhatsApp: (phone: string) => string
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

    const fmt = (amount: number) => {
      if (isNaN(amount) || !isFinite(amount)) {
        return `${region.currency} 0`
      }
      return `${region.currency} ${
        Math.abs(amount).toLocaleString(
          region.defaultLanguage,
          {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }
        )
      }${amount < 0 ? ' CR' : ''}`
    }

    const fmtCompact = (amount: number) => {
      const abs = Math.abs(amount)
      let str: string
      if (abs >= 10_000_000) {
        str = (abs / 1_000_000).toFixed(1) + 'M'
      } else if (abs >= 100_000) {
        str = (abs / 1_000).toFixed(0) + 'K'
      } else {
        str = abs.toLocaleString(
          region.defaultLanguage
        )
      }
      return `${region.currency} ${str}${
        amount < 0 ? ' CR' : ''
      }`
    }

    const fmtDate = (date: string | Date | null) => {
      if (!date) return '—'
      try {
        const d = typeof date === 'string' ? new Date(date) : date
        if (isNaN(d.getTime())) return '—'
        if (region.dateFormat === 'MM/DD/YYYY') {
          return d.toLocaleDateString('en-US')
        }
        return d.toLocaleDateString('en-GB')
      } catch {
        return '—'
      }
    }

    const fmtDateTime = (date: string | Date | null) => {
      if (!date) return '—'
      try {
        const d = typeof date === 'string' ? new Date(date) : date
        if (isNaN(d.getTime())) return '—'
        return d.toLocaleString(
          region.defaultLanguage,
          {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }
        )
      } catch {
        return '—'
      }
    }

    const fmtTax = (amount: number) => {
      const rate = profile?.tax_rate ?? region.taxRate
      const label = profile?.tax_label ?? region.taxLabel
      return `${label} (${rate}%): ${
        `${region.currency} ${
          amount.toLocaleString(
            region.defaultLanguage
          )
        }`
      }`
    }

    const taxLabel = profile?.tax_label ?? region.taxLabel
    const taxRate = profile?.tax_rate ?? region.taxRate

    const fmtPhone = (phone: string | null) => {
      if (!phone) return '—'
      const digits = phone.replace(/\D/g, '')
      if (region.countryCode === 'PK') {
        if (digits.startsWith('92') && digits.length === 12) {
          return `+92 ${digits.slice(2, 5)}-${digits.slice(5, 8)}-${digits.slice(8)}`
        }
        if (digits.startsWith('0') && digits.length === 11) {
          return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`
        }
      }
      return phone
    }

    const formatForWhatsApp = (phone: string) => {
      let digits = phone.replace(/\D/g, '')
      if (region.countryCode === 'PK') {
        if (digits.startsWith('0')) {
          digits = '92' + digits.slice(1)
        } else if (!digits.startsWith('92')) {
          digits = '92' + digits
        }
      } else if (region.countryCode === 'AE') {
        if (digits.startsWith('0')) {
          digits = '971' + digits.slice(1)
        } else if (!digits.startsWith('971')) {
          digits = '971' + digits
        }
      }
      return digits
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
      fmtDateTime,
      fmtTax,
      taxLabel,
      taxRate,
      fmtPhone,
      formatForWhatsApp,
    }
  }, [
    profile?.industry_key,
    profile?.industry_type,
    profile?.country_code,
    profile?.tax_label,
    profile?.tax_rate,
  ])
}
