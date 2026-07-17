import { describe, it, expect } from 'vitest'
import {
  getIndustryConfig,
  INDUSTRY_CONFIGS,
} from '@/lib/industry/configs'
import {
  getRegionConfig,
} from '@/lib/industry/regionConfigs'

describe('Industry Configuration Engine', () => {
  it('all 7 industries are defined', () => {
    const keys = Object.keys(INDUSTRY_CONFIGS)
    expect(keys).toContain('textile')
    expect(keys).toContain('rice')
    expect(keys).toContain('medical')
    expect(keys).toContain('auto')
    expect(keys).toContain('garment')
    expect(keys).toContain('food')
    expect(keys).toContain('general')
    expect(keys.length).toBe(7)
  })

  it('every industry has required fields', () => {
    Object.values(INDUSTRY_CONFIGS).forEach(config => {
      expect(config.key).toBeTruthy()
      expect(config.displayName).toBeTruthy()
      expect(config.terms.worker).toBeTruthy()
      expect(config.terms.workers).toBeTruthy()
      expect(config.terms.advance).toBeTruthy()
      expect(config.sidebar.dashboard).toBeTruthy()
      expect(config.accentColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })
  })

  it('medical has expiry management', () => {
    const medical = getIndustryConfig('medical')
    expect(medical.features.expiryManagement)
      .toBe(true)
    expect(medical.features.batchTracking)
      .toBe(true)
    expect(medical.features.prescriptionMode)
      .toBe(true)
  })

  it('textile has piece rate wages', () => {
    const textile = getIndustryConfig('textile')
    expect(textile.features.pieceRateWages)
      .toBe(true)
    expect(textile.features.peshgiAdvances)
      .toBe(true)
  })

  it('medical does not have piece rate', () => {
    const medical = getIndustryConfig('medical')
    expect(medical.features.pieceRateWages)
      .toBe(false)
  })

  it('unknown industry falls back to general', () => {
    const config = getIndustryConfig(
      'unknown_industry'
    )
    expect(config.key).toBe('general')
  })

  it('Pakistan region config is correct', () => {
    const pk = getRegionConfig('PK')
    expect(pk.currency).toBe('PKR')
    expect(pk.taxLabel).toBe('GST')
    expect(pk.taxRate).toBe(17)
    expect(pk.callingCode).toBe('+92')
  })

  it('UAE has VAT not GST', () => {
    const ae = getRegionConfig('AE')
    expect(ae.currency).toBe('AED')
    expect(ae.taxLabel).toBe('VAT')
    expect(ae.taxRate).toBe(5)
  })
})
