import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getAmountInWords } from '@/lib/format/amountInWords'

export interface InvoicePDFItem {
  description: string
  quantity: number
  unit?: string
  unitPrice: number
  discountPercent?: number
  totalPrice: number
}

export interface InvoicePDFData {
  businessName: string
  businessPhone?: string
  businessAddress?: string
  type?: 'invoice' | 'tax_invoice'
  invoiceNumber: string
  invoiceDate: string
  dueDate?: string
  partyName: string
  partyPhone?: string
  partyAddress?: string
  items: InvoicePDFItem[]
  currency?: string
  subtotal: number
  discountAmount: number
  taxLabel?: string
  taxRate?: number
  taxAmount: number
  grandTotal: number
  balanceDue?: number
  bankName?: string
  bankAccountNumber?: string
  bankAccountTitle?: string
  footerMessage?: string
}

function formatCurrency(amount: number, currency: string = 'PKR'): string {
  return `${currency} ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function generateInvoicePDF(data: InvoicePDFData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const PAGE_W = 210
  const PAGE_H = 297
  const M = 15 // margin

  // ── HEADER BAND ──
  // Full bleed dark rectangle
  doc.setFillColor(15, 31, 61) // #0F1F3D
  doc.rect(0, 0, PAGE_W, 44, 'F')

  // Business name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(249, 250, 251)
  doc.text(data.businessName, M, 16)

  // Business details
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(156, 163, 175)
  if (data.businessPhone) {
    doc.text(data.businessPhone, M, 22)
  }
  if (data.businessAddress) {
    doc.text(data.businessAddress, M, 27, { maxWidth: 100 })
  }

  // INVOICE label (right side)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.setTextColor(96, 165, 250) // #60A5FA
  doc.text(
    data.type === 'tax_invoice' ? 'TAX INVOICE' : 'INVOICE',
    PAGE_W - M,
    15,
    { align: 'right' }
  )

  // Invoice number + date
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(156, 163, 175)
  doc.text(`#${data.invoiceNumber}`, PAGE_W - M, 22, { align: 'right' })
  doc.text(data.invoiceDate, PAGE_W - M, 28, { align: 'right' })
  if (data.dueDate) {
    doc.setTextColor(245, 158, 11)
    doc.text(`Due: ${data.dueDate}`, PAGE_W - M, 34, { align: 'right' })
  }

  let y = 54

  // ── BILL TO / SHIP TO ──
  const colW = (PAGE_W - M * 2 - 10) / 2

  // Bill To box
  doc.setFillColor(15, 17, 20) // #0F1114
  doc.roundedRect(M, y, colW, 30, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(75, 85, 99)
  doc.text('BILL TO', M + 4, y + 6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(249, 250, 251)
  doc.text(data.partyName, M + 4, y + 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(156, 163, 175)
  if (data.partyPhone) {
    doc.text(data.partyPhone, M + 4, y + 19)
  }
  if (data.partyAddress) {
    doc.text(data.partyAddress, M + 4, y + 24, { maxWidth: colW - 8 })
  }

  y += 38

  // ── LINE ITEMS TABLE ──
  const currency = data.currency || 'PKR'
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['#', 'Item / Description', 'Qty', 'Rate', 'Discount', 'Total']],
    body: (data.items || []).map((item, i) => [
      String(i + 1),
      item.description,
      `${item.quantity} ${item.unit || ''}`.trim(),
      formatCurrency(item.unitPrice, currency),
      item.discountPercent ? `${item.discountPercent}%` : '—',
      formatCurrency(item.totalPrice, currency),
    ]),
    headStyles: {
      fillColor: [15, 31, 61],
      textColor: [249, 250, 251],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [15, 17, 20],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    theme: 'plain',
  })

  y = ((doc as any).lastAutoTable?.finalY ?? y) + 8

  // ── TOTALS BLOCK ──
  const totalsX = PAGE_W - M - 75
  const totalsW = 75

  // Background for totals
  doc.setFillColor(15, 17, 20)
  doc.roundedRect(totalsX, y, totalsW, 48, 2, 2, 'F')

  // Subtotal
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(156, 163, 175)
  doc.text('Subtotal', totalsX + 4, y + 8)
  doc.setTextColor(249, 250, 251)
  doc.text(formatCurrency(data.subtotal, currency), totalsX + totalsW - 4, y + 8, { align: 'right' })

  // Discount
  if (data.discountAmount > 0) {
    doc.setTextColor(156, 163, 175)
    doc.text('Discount', totalsX + 4, y + 16)
    doc.setTextColor(16, 185, 129)
    doc.text(`- ${formatCurrency(data.discountAmount, currency)}`, totalsX + totalsW - 4, y + 16, { align: 'right' })
  }

  // Tax
  if (data.taxAmount > 0) {
    doc.setTextColor(156, 163, 175)
    doc.text(`${data.taxLabel || 'Tax'} (${data.taxRate || 0}%)`, totalsX + 4, y + 24)
    doc.setTextColor(249, 250, 251)
    doc.text(formatCurrency(data.taxAmount, currency), totalsX + totalsW - 4, y + 24, { align: 'right' })
  }

  // Divider line
  doc.setDrawColor(75, 85, 99)
  doc.line(totalsX + 4, y + 32, totalsX + totalsW - 4, y + 32)

  // Grand total
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(96, 165, 250)
  doc.text('TOTAL', totalsX + 4, y + 42)
  doc.text(formatCurrency(data.grandTotal, currency), totalsX + totalsW - 4, y + 42, { align: 'right' })

  y += 58

  // Amount in words line
  const amountWords = getAmountInWords(
    data.grandTotal,
    data.currency || 'PKR',
    (data as any).language || 'en'
  )

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  doc.text('Amount in Words:', M, y + 5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(249, 250, 251)
  doc.text(amountWords, M, y + 12, {
    maxWidth: PAGE_W - M * 2,
  })

  y += 22

  // If Urdu is enabled, add Urdu line below:
  if ((data as any).showUrdu) {
    const amountWordsUr = getAmountInWords(
      data.grandTotal,
      data.currency || 'PKR',
      'ur'
    )
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(107, 114, 128)
    doc.text(amountWordsUr, PAGE_W - M, y, { align: 'right' })
    y += 8
  }

  // Balance due (if partial payment)
  if (data.balanceDue !== undefined && data.balanceDue > 0 && data.balanceDue < data.grandTotal) {
    doc.setFillColor(239, 68, 68)
    doc.setDrawColor(239, 68, 68)
    doc.roundedRect(totalsX, y, totalsW, 14, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.text('BALANCE DUE', totalsX + 4, y + 9)
    doc.text(formatCurrency(data.balanceDue, currency), totalsX + totalsW - 4, y + 9, { align: 'right' })
    y += 22
  }

  // ── FOOTER ──
  const footerY = PAGE_H - 28

  // Horizontal line
  doc.setDrawColor(30, 41, 59)
  doc.line(M, footerY, PAGE_W - M, footerY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(75, 85, 99)

  // Bank details left
  if (data.bankName) {
    doc.text(
      `Bank: ${data.bankName}  |  A/C: ${data.bankAccountNumber || ''}  |  Title: ${data.bankAccountTitle || ''}`,
      M,
      footerY + 6
    )
  }

  // Custom footer message
  if (data.footerMessage) {
    doc.text(data.footerMessage, M, footerY + 12, { maxWidth: 140 })
  }

  // Page number right
  doc.text(`Page 1 of 1  ·  Generated by Noxis Hub`, PAGE_W - M, footerY + 6, { align: 'right' })

  doc.save(`Invoice-${data.invoiceNumber}.pdf`)
}
