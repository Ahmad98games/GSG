/**
 * Universal Dynamic QR/Barcode Engine for Noxis Hub
 * Industry-agnostic payload encoder, scanner sanitizer, format validator, and SVG generator.
 */

import JsBarcode from 'jsbarcode'

export interface JobPayload {
  type: 'JOB'
  job_id: string
  karigar_id: string
  stage: string
  sku_code?: string
  business_id?: string
  created_at?: string
}

export interface RetailPayload {
  type: 'RETAIL'
  sku_code: string
  price?: number
  barcode?: string
  name?: string
}

export interface ParsedScanResult {
  rawInput: string
  cleanCode: string
  type: 'JOB' | 'RETAIL' | 'SKU' | 'UNKNOWN'
  isJsonPayload: boolean
  jobPayload?: JobPayload
  retailPayload?: RetailPayload
  skuCode?: string
  error?: string
}

export interface BarcodeRenderOptions {
  width?: number
  height?: number
  displayValue?: boolean
  fontSize?: number
  margin?: number
  background?: string
  lineColor?: string
  format?: 'CODE128' | 'EAN13' | 'UPC'
}

/**
 * Encode Karigar Job payload into standardized JSON string for 2D QR Code.
 */
export function encodeJobPayload(
  jobId: string,
  karigarId: string,
  stage: string,
  skuCode?: string
): string {
  const payload: JobPayload = {
    type: 'JOB',
    job_id: jobId.trim(),
    karigar_id: karigarId.trim(),
    stage: stage.trim().toUpperCase(),
    sku_code: skuCode?.trim() || undefined,
    created_at: new Date().toISOString(),
  }
  return JSON.stringify(payload)
}

/**
 * Encode standard SKU / Retail payload.
 */
export function encodeSKUPayload(skuCode: string): string {
  return skuCode.trim()
}

/**
 * Sanitize raw scanner input (strips carriage returns, extra spaces, tab characters)
 * and parse structured JSON or raw SKU barcode payload.
 */
export function parseScannedPayload(rawInput: string): ParsedScanResult {
  if (!rawInput) {
    return {
      rawInput: '',
      cleanCode: '',
      type: 'UNKNOWN',
      isJsonPayload: false,
    }
  }

  // Strip carriage returns (\r), newlines (\n), tabs (\t) and trim outer whitespace
  const cleanCode = rawInput.replace(/[\r\n\t]/g, '').trim()

  if (!cleanCode) {
    return {
      rawInput,
      cleanCode: '',
      type: 'UNKNOWN',
      isJsonPayload: false,
    }
  }

  // Attempt JSON payload parsing
  if (cleanCode.startsWith('{') && cleanCode.endsWith('}')) {
    try {
      const parsed = JSON.parse(cleanCode)
      if (parsed && typeof parsed === 'object') {
        if (parsed.type === 'JOB' && parsed.job_id) {
          return {
            rawInput,
            cleanCode,
            type: 'JOB',
            isJsonPayload: true,
            jobPayload: {
              type: 'JOB',
              job_id: String(parsed.job_id),
              karigar_id: String(parsed.karigar_id || ''),
              stage: String(parsed.stage || 'PROCESSING'),
              sku_code: parsed.sku_code ? String(parsed.sku_code) : undefined,
              business_id: parsed.business_id ? String(parsed.business_id) : undefined,
              created_at: parsed.created_at ? String(parsed.created_at) : undefined,
            },
            skuCode: parsed.sku_code ? String(parsed.sku_code) : undefined,
          }
        }
        if (parsed.type === 'RETAIL' && parsed.sku_code) {
          return {
            rawInput,
            cleanCode,
            type: 'RETAIL',
            isJsonPayload: true,
            retailPayload: {
              type: 'RETAIL',
              sku_code: String(parsed.sku_code),
              price: typeof parsed.price === 'number' ? parsed.price : undefined,
              barcode: parsed.barcode ? String(parsed.barcode) : undefined,
              name: parsed.name ? String(parsed.name) : undefined,
            },
            skuCode: String(parsed.sku_code),
          }
        }
      }
    } catch {
      // Not valid JSON, fallback to raw code
    }
  }

  // Fallback: standard barcode / SKU code string
  return {
    rawInput,
    cleanCode,
    type: 'SKU',
    isJsonPayload: false,
    skuCode: cleanCode,
  }
}

/**
 * Validate barcode format (EAN-13 checksum, Code-128 alphanumeric check, or raw SKU).
 */
export function validateBarcodeFormat(code: string): {
  isValid: boolean
  format: 'EAN-13' | 'CODE-128' | 'QR' | 'RAW'
  error?: string
} {
  const clean = code.replace(/[\r\n\t]/g, '').trim()
  if (!clean) {
    return { isValid: false, format: 'RAW', error: 'Empty barcode string' }
  }

  // JSON payload is 2D QR
  if (clean.startsWith('{') && clean.endsWith('}')) {
    return { isValid: true, format: 'QR' }
  }

  // EAN-13 validation (13 digits with valid checksum)
  if (/^\d{13}$/.test(clean)) {
    let sum = 0
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(clean.charAt(i), 10)
      sum += i % 2 === 0 ? digit : digit * 3
    }
    const checksum = (10 - (sum % 10)) % 10
    const checkDigit = parseInt(clean.charAt(12), 10)
    if (checksum === checkDigit) {
      return { isValid: true, format: 'EAN-13' }
    }
  }

  // Code-128 (ASCII chars 32 to 126)
  if (/^[\x20-\x7E]+$/.test(clean)) {
    return { isValid: true, format: 'CODE-128' }
  }

  return { isValid: true, format: 'RAW' }
}

/**
 * Helper to render Code-128 barcode directly onto an SVG element via JsBarcode.
 */
export function renderBarcodeToSVG(
  svgElement: SVGSVGElement,
  text: string,
  options: BarcodeRenderOptions = {}
): boolean {
  if (!svgElement || !text) return false
  try {
    const cleanText = text.replace(/[\r\n\t]/g, '').trim()
    JsBarcode(svgElement, cleanText, {
      format: options.format || 'CODE128',
      width: options.width || 1.8,
      height: options.height || 45,
      displayValue: options.displayValue ?? true,
      fontSize: options.fontSize || 10,
      margin: options.margin || 2,
      background: options.background || '#ffffff',
      lineColor: options.lineColor || '#000000',
      valid: () => true,
    })
    return true
  } catch (err) {
    console.error('Failed to render barcode SVG:', err)
    return false
  }
}
