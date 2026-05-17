import { INDUSTRIES, IndustryProfile, IndustryId } from './industries'
import { useBusinessProfileStore, BusinessProfile } from '@/store/BusinessProfileStore'
import { useThemeStore } from '@/stores/themeStore'
import { useLanguageStore } from '@/stores/languageStore'
import { getDictionary } from '@/lib/i18n'
import { Decimal } from 'decimal.js'
import { formatAmount, formatDate, formatQuantity } from '@/lib/persona/formatters'
import { formatCurrency, CurrencyCode } from '@/lib/currency/currencyEngine'

class PersonaEngineClass {
  private profile: IndustryProfile | null = null
  
  initialize(industryId: string): void {
    this.profile = INDUSTRIES.find(
      i => i.id === (industryId as IndustryId)
    ) || INDUSTRIES[0]
    
    // Auto-apply suggested theme if available
    // NOTE: This uses store which might be client-only in practice but technically safe to import
    if (this.profile?.suggestedTheme) {
      try {
        const { setThemeByIndustry } = useThemeStore.getState()
        if (typeof setThemeByIndustry === 'function') {
          setThemeByIndustry(industryId)
        }
      } catch (e) {
        // Silently fail if store is not available (e.g. server side)
      }
    }
  }
  
  // Get the industry profile
  getProfile(): IndustryProfile | null {
    return this.profile
  }

  // Legacy compatibility getter
  get currentPersona(): BusinessProfile | null {
    try {
      return useBusinessProfileStore.getState().profile
    } catch (e) {
      return null
    }
  }
  
  // Get terminology
  term(key: keyof IndustryProfile['terms']): string {
    return this.profile?.terms[key] || key
  }
  
  // Check if module is enabled
  hasModule(moduleId: string): boolean {
    if (!this.profile) return true
    return this.profile.modules.includes(moduleId)
  }
  
  // Get enabled calculators
  getCalculators(): string[] {
    return this.profile?.calculators || []
  }
  
  // Get enabled converters
  getConverters(): string[] {
    return this.profile?.converters || []
  }
  
  // Get enabled generators
  getGenerators(): string[] {
    return this.profile?.generators || []
  }
  
  // Get empty state for a page
  getEmptyState(page: string) {
    return this.profile?.emptyStates[page] || null
  }
  
  // Format amount using profile currency
  fmt(amount: Decimal | number | string,
      optionsOrCurrency?: { compact?: boolean } | string): string {
    try {
      const businessProfile = useBusinessProfileStore.getState().profile
      let currency = (businessProfile?.currency as CurrencyCode) || 'PKR'
      let options: { compact?: boolean } = {}

      if (typeof optionsOrCurrency === 'string') {
        currency = optionsOrCurrency as CurrencyCode
      } else if (optionsOrCurrency) {
        options = optionsOrCurrency
      }

      return formatCurrency(amount, currency, options)
    } catch (e) {
      return String(amount)
    }
  }

  // Alias for legacy components
  formatCurrency(amount: Decimal | number | string, options?: any): string {
    return this.fmt(amount, options)
  }

  // Format date
  formatDate(date: Date | string, options?: any): string {
    try {
      const region = useBusinessProfileStore.getState().profile?.region || 'south_asian'
      return formatDate(date, { region, ...options })
    } catch (e) {
      return String(date)
    }
  }
  
  // Format quantity
  fmtQty(qty: Decimal | number, unit: string): string {
    try {
      const region = useBusinessProfileStore.getState().profile?.region || 'south_asian'
      return formatQuantity(qty, unit, region)
    } catch (e) {
      return `${qty} ${unit}`
    }
  }

  // Translate using current language
  t(key: string, paramsOrFallback?: Record<string, string | number> | string): string {
    try {
      const lang = useLanguageStore.getState().language
      const dict = getDictionary(lang)
      
      const parts = key.split('.')
      let result: any = dict
      for (const part of parts) {
        if (result && result[part]) {
          result = result[part]
        } else {
          if (typeof paramsOrFallback === 'string') return paramsOrFallback
          return key 
        }
      }
      return typeof result === 'string' ? result : key
    } catch (e) {
      return typeof paramsOrFallback === 'string' ? paramsOrFallback : key
    }
  }
}

export const PersonaEngine = new PersonaEngineClass()


