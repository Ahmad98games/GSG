import { describe, it, expect } from 'vitest'
import {
  isValidEmail,
  isValidPhone,
  isValidLicenseKeyFormat,
} from '@/lib/security/validators'

describe('Input Validation', () => {
  describe('Email validation', () => {
    it('accepts valid email', () => {
      expect(isValidEmail('ahmad@factory.com'))
        .toBe(true)
    })
    it('rejects email without @', () => {
      expect(isValidEmail('invalidmail'))
        .toBe(false)
    })
    it('rejects email over 254 chars', () => {
      expect(isValidEmail('a'.repeat(255) +
        '@b.com')).toBe(false)
    })
    it('rejects empty string', () => {
      expect(isValidEmail('')).toBe(false)
    })
    it('rejects XSS attempt', () => {
      expect(isValidEmail(
        '<script>alert(1)</script>@evil.com'
      )).toBe(false)
    })
  })

  describe('Phone validation', () => {
    it('accepts Pakistani mobile', () => {
      expect(isValidPhone('03001234567'))
        .toBe(true)
    })
    it('accepts with country code', () => {
      expect(isValidPhone('+923001234567'))
        .toBe(true)
    })
    it('rejects too short', () => {
      expect(isValidPhone('123')).toBe(false)
    })
    it('rejects empty', () => {
      expect(isValidPhone('')).toBe(false)
    })
  })

  describe('License key validation', () => {
    it('accepts valid format', () => {
      expect(isValidLicenseKeyFormat(
        'K7M2-9XP4-R3N8'
      )).toBe(true)
    })
    it('rejects wrong length', () => {
      expect(isValidLicenseKeyFormat(
        'SHORT'
      )).toBe(false)
    })
    it('rejects SQL injection attempt', () => {
      expect(isValidLicenseKeyFormat(
        "' OR '1'='1"
      )).toBe(false)
    })
  })
})

describe('Nonce security', () => {
  it('same nonce cannot be used twice', async () => {
    const { generateNonce, consumeNonce } =
      await import('@/lib/security/nonce')

    const nonce = generateNonce()
    expect(consumeNonce(nonce)).toBe(true)
    expect(consumeNonce(nonce)).toBe(false)
  })

  it('empty nonce is rejected', async () => {
    const { consumeNonce } =
      await import('@/lib/security/nonce')
    expect(consumeNonce('')).toBe(false)
  })

  it('short nonce is rejected', async () => {
    const { consumeNonce } =
      await import('@/lib/security/nonce')
    expect(consumeNonce('abc')).toBe(false)
  })
})
