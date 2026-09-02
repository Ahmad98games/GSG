import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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
  doc.setFillColor(11, 15, 25)
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
  doc.setTextColor(6, 182, 212) // Cyber Cyan
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

  // Calculate totals dynamically if not passed or 0
  const computedTotalDebit = (data.items || []).reduce((acc, it) => acc + (Number(it.debit) || 0), 0)
  const computedTotalCredit = (data.items || []).reduce((acc, it) => acc + (Number(it.credit) || 0), 0)
  const finalTotalDebit = (data.totalDebit != null && data.totalDebit > 0) ? data.totalDebit : computedTotalDebit
  const finalTotalCredit = (data.totalCredit != null && data.totalCredit > 0) ? data.totalCredit : computedTotalCredit

  // Table rows
  const tableRows = (data.items || []).map(item => {
    const d = Number(item.debit || 0)
    const c = Number(item.credit || 0)
    return [
      item.date || '—',
      item.reference || '—',
      item.description || 'Transaction',
      d > 0 ? `${currency} ${d.toLocaleString('en-PK', { minimumFractionDigits: 2 })}` : '-',
      c > 0 ? `${currency} ${c.toLocaleString('en-PK', { minimumFractionDigits: 2 })}` : '-',
      `${currency} ${(item.runningBalance || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`,
    ]
  })

  const bodyRows: any[] = [
    [data.startDate, '—', 'Opening Balance', '-', '-', `${currency} ${(data.openingBalance || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`],
    ...(tableRows.length > 0 ? tableRows : [[data.startDate, '—', 'No transactions in this period', '-', '-', `${currency} ${(data.closingBalance || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`]]),
    [data.endDate, '—', 'Closing Balance', `${currency} ${finalTotalDebit.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`, `${currency} ${finalTotalCredit.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`, `${currency} ${(data.closingBalance || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`]
  ]

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Balance']],
    body: bodyRows,
    margin: { left: M, right: M },
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 12 : y + 40

  // Amount in words
  const words = getAmountInWords(Math.abs(data.closingBalance || 0), currency, 'en')
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

  doc.save(`Statement_${(data.partyName || 'Client').replace(/\s+/g, '_')}.pdf`)
}
