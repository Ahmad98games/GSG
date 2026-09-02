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
      const num = typeof amount === 'number' ? amount : Number(amount ?? 0);
      if (isNaN(num) || !isFinite(num)) {
        return `${region?.currency || 'PKR'} 0`
      }
      return `${region?.currency || 'PKR'} ${
        Math.abs(num).toLocaleString(
          region?.defaultLanguage || 'en-PK',
          {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }
        )
      }${num < 0 ? ' CR' : ''}`
    }

    const fmtCompact = (amount: number) => {
      const num = typeof amount === 'number' ? amount : Number(amount ?? 0);
      const abs = isNaN(num) ? 0 : Math.abs(num);
      let str: string
      if (abs >= 10_000_000) {
        str = (abs / 1_000_000).toFixed(1) + 'M'
      } else if (abs >= 100_000) {
        str = (abs / 1_000).toFixed(0) + 'K'
      } else {
        str = abs.toLocaleString(
          region?.defaultLanguage || 'en-PK'
        )
      }
      return `${region?.currency || 'PKR'} ${str}${
        num < 0 ? ' CR' : ''
      }`
    }

    const fmtDate = (date: string | Date | null) => {
      if (!date) return '—'
      try {
        const d = typeof date === 'string' ? new Date(date) : date
        if (isNaN(d.getTime())) return '—'
        if (region?.dateFormat === 'MM/DD/YYYY') {
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
          region?.defaultLanguage || 'en-PK',
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
      const num = typeof amount === 'number' ? amount : Number(amount ?? 0);
      const safeNum = isNaN(num) ? 0 : num;
      const rate = profile?.tax_rate ?? region?.taxRate ?? 0
      const label = profile?.tax_label ?? region?.taxLabel ?? 'Tax'
      return `${label} (${rate}%): ${
        `${region?.currency || 'PKR'} ${
          safeNum.toLocaleString(
            region?.defaultLanguage || 'en-PK'
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
