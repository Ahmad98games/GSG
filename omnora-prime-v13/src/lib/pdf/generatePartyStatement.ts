import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { getAmountInWords } from '@/lib/format/amountInWords'

export interface PartyStatementItem {
  date: string
  reference: string
  description: string
  debit: number
  credit: number
  runningBalance: number
}

export interface PartyStatementPDFData {
  businessName: string
  businessPhone?: string
  businessAddress?: string
  taxNumber?: string
  partyName: string
  partyAddress?: string
  partyPhone?: string
  partyCode?: string
  startDate: string
  endDate: string
  openingBalance: number
  items: PartyStatementItem[]
  closingBalance: number
  totalDebit: number
  totalCredit: number
  currency?: string
}

export function generatePartyStatementPDF(data: PartyStatementPDFData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const PAGE_W = 210
  const M = 15
  const currency = data.currency || 'PKR'

  // Header band
  doc.setFillColor(15, 31, 61)
  doc.rect(0, 0, PAGE_W, 44, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(249, 250, 251)
  doc.text(data.businessName, M, 16)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(156, 163, 175)
  if (data.businessPhone) doc.text(data.businessPhone, M, 22)
  if (data.businessAddress) doc.text(data.businessAddress, M, 27, { maxWidth: 100 })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(96, 165, 250)
  doc.text('ACCOUNT STATEMENT', PAGE_W - M, 18, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(156, 163, 175)
  doc.text(`Period: ${data.startDate} to ${data.endDate}`, PAGE_W - M, 26, { align: 'right' })

  let y = 54

  // Party Details Box
  doc.setDrawColor(229, 231, 235)
  doc.setFillColor(249, 250, 251)
  doc.roundedRect(M, y, PAGE_W - M * 2, 24, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(17, 24, 39)
  doc.text(`Statement For: ${data.partyName}`, M + 4, y + 7)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  if (data.partyPhone) doc.text(`Phone: ${data.partyPhone}`, M + 4, y + 13)
  if (data.partyAddress) doc.text(`Address: ${data.partyAddress}`, M + 4, y + 18)

  y += 30

  // Table rows
  const tableRows = data.items.map(item => [
    item.date,
    item.reference,
    item.description,
    item.debit > 0 ? `${currency} ${item.debit.toLocaleString('en-PK', { minimumFractionDigits: 2 })}` : '-',
    item.credit > 0 ? `${currency} ${item.credit.toLocaleString('en-PK', { minimumFractionDigits: 2 })}` : '-',
    `${currency} ${item.runningBalance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`,
  ])

  ;(doc as any).autoTable({
    startY: y,
    head: [['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Balance']],
    body: [
      [data.startDate, '—', 'Opening Balance', '-', '-', `${currency} ${data.openingBalance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`],
      ...tableRows,
      [data.endDate, '—', 'Closing Balance', `${currency} ${data.totalDebit.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`, `${currency} ${data.totalCredit.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`, `${currency} ${data.closingBalance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`]
    ],
    margin: { left: M, right: M },
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  const finalY = (doc as any).lastAutoTable.finalY + 12

  // Amount in words
  const words = getAmountInWords(data.closingBalance, currency, 'en')
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8.5)
  doc.setTextColor(107, 114, 128)
  doc.text(`Balance in Words: ${words}`, M, finalY)

  // Signature line right
  doc.setDrawColor(209, 213, 219)
  doc.line(PAGE_W - M - 45, finalY + 15, PAGE_W - M, finalY + 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text('Authorized Signatory', PAGE_W - M - 45, finalY + 20)

  doc.save(`Statement_${data.partyName.replace(/\s/g, '_')}.pdf`)
}
