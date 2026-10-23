import jsPDF from 'jspdf'

export interface ThermalReceiptOptions {
  invoice: any
  items?: any[]
  profile?: any
  currency?: string
  cashierName?: string
  autoPrint?: boolean
}

function formatMoney(amount: number | string | undefined | null, curr = 'Rs.'): string {
  const num = Number(amount) || 0
  return `${curr} ${num.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export async function generateThermalReceipt(
  invoice: any,
  itemsArg: any[] = [],
  profile: any = {},
  options?: { currency?: string; cashierName?: string; autoPrint?: boolean }
): Promise<void> {
  const items = (itemsArg && itemsArg.length > 0) ? itemsArg : (invoice?.items || [])
  const currency = options?.currency || profile?.base_currency || 'Rs.'
  const cashierName = options?.cashierName || 'Cashier'

  // Calculate dynamic page height in mm:
  // Base header (45mm) + items (approx 9mm each) + totals & payments (40mm) + footer (35mm) + buffer (15mm)
  const calculatedHeight = Math.max(150, 135 + items.length * 9)

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, calculatedHeight],
  })

  const PAGE_W = 80
  const M = 4 // 4mm margin
  const CONTENT_W = PAGE_W - 2 * M
  let y = 8

  // 1. BUSINESS HEADER
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  const businessName = profile?.business_name || 'NOXIS RETAIL'
  doc.text(businessName.toUpperCase(), PAGE_W / 2, y, { align: 'center', maxWidth: CONTENT_W })
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  if (profile?.tagline) {
    doc.text(profile.tagline, PAGE_W / 2, y, { align: 'center', maxWidth: CONTENT_W })
    y += 4
  }

  if (profile?.address) {
    doc.text(profile.address, PAGE_W / 2, y, { align: 'center', maxWidth: CONTENT_W })
    y += 4
  }

  if (profile?.phone) {
    doc.text(`Tel: ${profile.phone}`, PAGE_W / 2, y, { align: 'center' })
    y += 4
  }

  const ntn = profile?.ntn_number || (profile as any)?.ntn || ''
  const strn = profile?.strn_number || (profile as any)?.strn || ''
  if (ntn || strn) {
    const taxInfo = [ntn ? `NTN: ${ntn}` : '', strn ? `STRN: ${strn}` : ''].filter(Boolean).join(' | ')
    doc.setFontSize(7)
    doc.text(taxInfo, PAGE_W / 2, y, { align: 'center' })
    y += 4
  }

  // Divider
  doc.setLineWidth(0.2)
  doc.setLineDashPattern([1, 1], 0)
  doc.line(M, y, PAGE_W - M, y)
  doc.setLineDashPattern([], 0)
  y += 4

  // 2. METADATA
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(`Receipt #: ${invoice?.invoice_number || 'N/A'}`, M, y)
  y += 4

  doc.setFont('helvetica', 'normal')
  const dateObj = invoice?.createdAt ? new Date(invoice.createdAt) : new Date()
  const dateStr = dateObj.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = dateObj.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
  doc.text(`Date: ${dateStr} ${timeStr}`, M, y)
  y += 4

  doc.text(`Cashier: ${cashierName}`, M, y)
  y += 4

  if (invoice?.partyName) {
    const cust = `${invoice.partyName}${invoice.partyPhone ? ` (${invoice.partyPhone})` : ''}`
    doc.text(`Customer: ${cust}`, M, y, { maxWidth: CONTENT_W })
    y += 4
  }

  // Divider
  doc.setLineDashPattern([1, 1], 0)
  doc.line(M, y, PAGE_W - M, y)
  doc.setLineDashPattern([], 0)
  y += 3.5

  // 3. TABLE HEADER
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.text('ITEM', M, y)
  doc.text('QTY', M + 42, y, { align: 'center' })
  doc.text('TOTAL', PAGE_W - M, y, { align: 'right' })
  y += 2

  doc.line(M, y, PAGE_W - M, y)
  y += 3.5

  // 4. ITEMS LIST
  let totalQtyCount = 0
  for (const item of items) {
    const qty = Number(item.quantity) || 1
    totalQtyCount += qty
    const unitPrice = Number(item.unitPrice) || 0
    const lineTotal = Number(item.lineTotal) || qty * unitPrice
    const itemDisc = Number(item.discountAmount) || 0

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    const itemName = item.name || item.sku_code || 'Product'
    doc.text(itemName.toUpperCase(), M, y, { maxWidth: CONTENT_W })
    y += 3.5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.text(`${qty} ${item.unit || 'pcs'} @ ${unitPrice.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`, M, y)
    doc.setFont('helvetica', 'bold')
    doc.text(formatMoney(lineTotal, currency), PAGE_W - M, y, { align: 'right' })
    y += 3.5

    if (itemDisc > 0) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(7)
      doc.text(`  (Discount: -${formatMoney(itemDisc, currency)})`, M, y)
      y += 3
    }
  }

  // Divider
  doc.setLineDashPattern([1, 1], 0)
  doc.line(M, y, PAGE_W - M, y)
  doc.setLineDashPattern([], 0)
  y += 3.5

  // 5. SUMMARY & TOTALS
  const subtotal = invoice?.subtotal ?? invoice?.total_amount ?? 0
  const discount = invoice?.discountAmount ?? 0
  const tax = invoice?.taxAmount ?? 0
  const grandTotal = invoice?.total_amount ?? invoice?.grandTotal ?? 0
  const amountPaid = invoice?.amount_paid ?? grandTotal
  const change = invoice?.change ?? (amountPaid > grandTotal ? amountPaid - grandTotal : 0)
  const balanceDue = invoice?.balance_due ?? (grandTotal > amountPaid ? grandTotal - amountPaid : 0)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Subtotal:', M, y)
  doc.text(formatMoney(subtotal, currency), PAGE_W - M, y, { align: 'right' })
  y += 3.5

  if (discount > 0) {
    doc.text('Discount:', M, y)
    doc.text(`-${formatMoney(discount, currency)}`, PAGE_W - M, y, { align: 'right' })
    y += 3.5
  }

  if (tax > 0) {
    doc.text('Tax / GST:', M, y)
    doc.text(`+${formatMoney(tax, currency)}`, PAGE_W - M, y, { align: 'right' })
    y += 3.5
  }

  // Net Total Box
  doc.setLineWidth(0.4)
  doc.line(M, y, PAGE_W - M, y)
  y += 4
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('NET TOTAL:', M, y)
  doc.text(formatMoney(grandTotal, currency), PAGE_W - M, y, { align: 'right' })
  y += 2
  doc.line(M, y, PAGE_W - M, y)
  doc.setLineWidth(0.2)
  y += 4

  // Payment Breakdown
  let paymentMethod = 'CASH'
  if (invoice?.payments && invoice.payments.length > 0) {
    paymentMethod = invoice.payments.map((p: any) => p.method?.toUpperCase()).join(' / ')
  } else if (invoice?.payment_method) {
    paymentMethod = String(invoice.payment_method).toUpperCase()
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Payment (${paymentMethod}):`, M, y)
  doc.text(formatMoney(amountPaid, currency), PAGE_W - M, y, { align: 'right' })
  y += 3.5

  if (change > 0) {
    doc.setFont('helvetica', 'bold')
    doc.text('Change Tendered:', M, y)
    doc.text(formatMoney(change, currency), PAGE_W - M, y, { align: 'right' })
    y += 3.5
  }

  if (balanceDue > 0) {
    doc.setFont('helvetica', 'bold')
    doc.text('Balance Due (Credit):', M, y)
    doc.text(formatMoney(balanceDue, currency), PAGE_W - M, y, { align: 'right' })
    y += 3.5
  }

  // Divider
  doc.setLineDashPattern([1, 1], 0)
  doc.line(M, y, PAGE_W - M, y)
  doc.setLineDashPattern([], 0)
  y += 3.5

  // Summary counts
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text(`Items: ${items.length}   |   Total Units: ${totalQtyCount}`, M, y)
  y += 5

  // Footer notes
  doc.setFontSize(7)
  doc.text('Exchange within 7 days with original receipt.', PAGE_W / 2, y, { align: 'center' })
  y += 3.5
  doc.text('Goods once sold are non-refundable.', PAGE_W / 2, y, { align: 'center' })
  y += 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('*** THANK YOU FOR YOUR VISIT ***', PAGE_W / 2, y, { align: 'center' })
  y += 4

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.text('NOXIS HUB INDUSTRIAL POS • OMNORA LABS', PAGE_W / 2, y, { align: 'center' })

  if (options?.autoPrint) {
    doc.autoPrint()
    const blobUrl = doc.output('bloburl')
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.src = String(blobUrl)
    document.body.appendChild(iframe)
    setTimeout(() => {
      iframe.contentWindow?.print()
    }, 500)
  } else {
    doc.save(`Thermal-${invoice?.invoice_number || 'Receipt'}.pdf`)
  }
}
