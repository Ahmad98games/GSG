import { createClient } from '@/lib/supabase/client'
import Decimal from 'decimal.js'

export type DocumentType = 
  'invoice' | 'purchase_bill' | 'payslip' |
  'delivery_challan' | 'unknown'

export type ExtractedDocument = {
  type: DocumentType
  confidence: number  // 0-1
  
  // Financial fields
  totalAmount?: string   // Decimal string
  taxAmount?: string
  subtotal?: string
  
  // Reference fields
  invoiceNumber?: string
  billNumber?: string
  date?: string
  dueDate?: string
  
  // Party fields
  partyName?: string
  partyPhone?: string
  partyAddress?: string
  
  // Line items (if detected)
  lineItems?: Array<{
    description: string
    qty?: string
    rate?: string
    amount: string
  }>
  
  // Metadata
  matchedPartyId?: string
  isDuplicate?: boolean
  duplicateInvoiceId?: string
  rawText?: string
}

// Urdu number words → digits
const URDU_NUMBERS: Record<string, string> = {
  'ایک': '1', 'دو': '2', 'تین': '3',
  'چار': '4', 'پانچ': '5', 'چھ': '6',
  'سات': '7', 'آٹھ': '8', 'نو': '9',
  'دس': '10', 'سو': '100',
  'ہزار': '1000', 'لاکھ': '100000',
}

// Convert Urdu numerals to Western
function urduToWesternDigits(text: string): string {
  const map: Record<string, string> = {
    '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4',
    '۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'
  }
  return text.replace(/[۰-۹]/g, d => map[d] || d)
}

export async function analyzeDocument(
  rawText: string,
  businessId: string
): Promise<ExtractedDocument> {
  const result: ExtractedDocument = {
    type: 'unknown',
    confidence: 0,
    rawText
  }
  
  // Normalize Urdu numerals and characters
  const normalizedText = urduToWesternDigits(rawText).toUpperCase()
  const text = normalizedText;
  
  const lines = rawText.split('\n')
    .map(l => l.trim())
    .filter(Boolean)
  
  // DETECT DOCUMENT TYPE
  if (text.includes('INVOICE') ||
      text.includes('BILL') ||
      text.includes('RECEIPT') ||
      text.includes('انوائس') ||
      text.includes('رسید')) {
    result.type = 'invoice'
    result.confidence = 0.8
  } else if (text.includes('PURCHASE') ||
             text.includes('RECEIPT') ||
             text.includes('BILL NO')) {
    result.type = 'purchase_bill'
    result.confidence = 0.7
  } else if (text.includes('SALARY') ||
             text.includes('PAYSLIP') ||
             text.includes('تنخواہ')) {
    result.type = 'payslip'
    result.confidence = 0.9
  } else if (text.includes('CHALLAN') ||
             text.includes('DELIVERY')) {
    result.type = 'delivery_challan'
    result.confidence = 0.8
  }
  
  // EXTRACT AMOUNTS
  const amountPatterns = [
    /(?:RS\.?|PKR|₨)\s*([\d,]+(?:\.\d{1,2})?)/gi,
    /TOTAL\s*:?\s*(?:RS\.?|PKR)?\s*([\d,]+(?:\.\d{1,2})?)/gi,
    /GRAND\s+TOTAL\s*:?\s*([\d,]+(?:\.\d{1,2})?)/gi,
    /NET\s+(?:PAYABLE|AMOUNT)\s*:?\s*([\d,]+(?:\.\d{1,2})?)/gi,
  ]
  
  const amounts: string[] = []
  for (const pattern of amountPatterns) {
    const matches = rawText.matchAll(pattern)
    for (const match of matches) {
      const cleaned = match[1].replace(/,/g, '')
      if (!isNaN(parseFloat(cleaned)) &&
          parseFloat(cleaned) > 0) {
        amounts.push(cleaned)
      }
    }
  }
  
  if (amounts.length > 0) {
    const sorted = amounts
      .map(a => new Decimal(a))
      .sort((a, b) => b.minus(a).toNumber())
    result.totalAmount = sorted[0].toString()
  }
  
  // EXTRACT INVOICE/BILL NUMBER
  const invoicePatterns = [
    /(?:INV|INVOICE|BILL)\s*(?:NO\.?|#|NUMBER)?\s*:?\s*([A-Z0-9-]+)/gi,
    /NO\.\s*:?\s*([A-Z0-9-]+)/gi,
  ]
  for (const pattern of invoicePatterns) {
    const match = rawText.match(pattern)
    if (match) {
      result.invoiceNumber = match[1]?.trim()
      break
    }
  }
  
  // EXTRACT DATE
  const datePatterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g,
    /(\d{1,2}\s+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{4})/gi,
  ]
  for (const pattern of datePatterns) {
    const match = rawText.match(pattern)
    if (match) {
      result.date = match[0]
      break
    }
  }
  
  // EXTRACT PARTY NAME
  const partyIndicators = [
    'TO:', 'FROM:', 'BILL TO:', 'CUSTOMER:',
    'SUPPLIER:', 'VENDOR:', 'M/S', 'MR.', 'MRS.'
  ]
  for (const line of lines.slice(0, 10)) {
    for (const indicator of partyIndicators) {
      if (line.toUpperCase().includes(indicator)) {
        result.partyName = line
          .replace(new RegExp(indicator, 'i'), '')
          .trim()
        break
      }
    }
    if (result.partyName) break
  }
  
  const supabase = createClient()

  // MATCH PARTY IN DATABASE
  if (result.partyName) {
    const { data: parties } = await supabase
      .from('parties')
      .select('id, name')
      .eq('business_id', businessId)
      .ilike('name', `%${result.partyName.split(' ')[0]}%`)
      .limit(3)
    
    if (parties && parties.length > 0) {
      const best = (parties as any[]).find(p =>
        result.partyName &&
        p.name.toLowerCase().includes(
          result.partyName.toLowerCase().slice(0, 5)
        )
      ) || parties[0]
      
      result.matchedPartyId = best.id
      result.partyName = best.name
    }
  }
  
  // DUPLICATE DETECTION
  if (result.invoiceNumber) {
    const { data: existing } = await supabase
      .from('invoices')
      .select('id, invoice_number')
      .eq('business_id', businessId)
      .ilike('invoice_number', `%${result.invoiceNumber}%`)
      .limit(1)
    
    if (existing && existing.length > 0) {
      result.isDuplicate = true
      result.duplicateInvoiceId = existing[0].id
    }
  }
  
  return result
}
