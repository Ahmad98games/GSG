import { describe, it, expect } from 'vitest'
import {
  encodeJobPayload,
  encodeSKUPayload,
  parseScannedPayload,
  validateBarcodeFormat,
} from '@/lib/barcode/barcodeEngine'

describe('barcodeEngine', () => {
  describe('encodeJobPayload', () => {
    it('encodes a valid Karigar Job payload object to JSON', () => {
      const json = encodeJobPayload('job-123', 'karigar-456', 'EMBROIDERY', 'SKU-999')
      const parsed = JSON.parse(json)
      expect(parsed.type).toBe('JOB')
      expect(parsed.job_id).toBe('job-123')
      expect(parsed.karigar_id).toBe('karigar-456')
      expect(parsed.stage).toBe('EMBROIDERY')
      expect(parsed.sku_code).toBe('SKU-999')
      expect(parsed.created_at).toBeDefined()
    })
  })

  describe('encodeSKUPayload', () => {
    it('trims raw SKU code strings', () => {
      expect(encodeSKUPayload('  SKU-001  \n')).toBe('SKU-001')
    })
  })

  describe('parseScannedPayload', () => {
    it('sanitizes scanner carriage returns and newlines from raw string', () => {
      const res = parseScannedPayload('8901234567890\r\n')
      expect(res.cleanCode).toBe('8901234567890')
      expect(res.type).toBe('SKU')
      expect(res.isJsonPayload).toBe(false)
      expect(res.skuCode).toBe('8901234567890')
    })

    it('parses structured JOB QR payloads correctly', () => {
      const payloadStr = JSON.stringify({
        type: 'JOB',
        job_id: 'J-101',
        karigar_id: 'K-202',
        stage: 'CUTTING',
        sku_code: 'FABRIC-40S',
      })
      const res = parseScannedPayload(`${payloadStr}\r\n`)
      expect(res.type).toBe('JOB')
      expect(res.isJsonPayload).toBe(true)
      expect(res.jobPayload?.job_id).toBe('J-101')
      expect(res.jobPayload?.karigar_id).toBe('K-202')
      expect(res.jobPayload?.stage).toBe('CUTTING')
      expect(res.jobPayload?.sku_code).toBe('FABRIC-40S')
    })

    it('handles non-JSON raw strings gracefully', () => {
      const res = parseScannedPayload('   GARMENT-SUIT-001   ')
      expect(res.cleanCode).toBe('GARMENT-SUIT-001')
      expect(res.type).toBe('SKU')
      expect(res.isJsonPayload).toBe(false)
      expect(res.skuCode).toBe('GARMENT-SUIT-001')
    })

    it('handles empty input gracefully', () => {
      const res = parseScannedPayload('')
      expect(res.cleanCode).toBe('')
      expect(res.type).toBe('UNKNOWN')
    })
  })

  describe('validateBarcodeFormat', () => {
    it('identifies EAN-13 barcodes with valid checksum', () => {
      // Standard valid EAN-13: 4006381333931
      const res = validateBarcodeFormat('4006381333931')
      expect(res.isValid).toBe(true)
      expect(res.format).toBe('EAN-13')
    })

    it('identifies Code-128 barcodes', () => {
      const res = validateBarcodeFormat('SKU-CODE-128-TEST')
      expect(res.isValid).toBe(true)
      expect(res.format).toBe('CODE-128')
    })

    it('identifies QR JSON formats', () => {
      const res = validateBarcodeFormat('{"type":"JOB","job_id":"1"}')
      expect(res.isValid).toBe(true)
      expect(res.format).toBe('QR')
    })
  })
})
