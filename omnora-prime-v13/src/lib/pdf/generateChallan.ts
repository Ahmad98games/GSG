import jsPDF from 'jspdf'
import 'jspdf-autotable'

export interface ChallanItem {
  description: string
  quantity: number
  unit?: string
  remarks?: string
}

export interface DeliveryChallanData {
  businessName: string
  businessAddress?: string
  businessPhone?: string
  taxNumber?: string
  
  challanNumber: string // e.g. DC-2026-0042
  date: string
  vehicleNumber?: string // e.g. LHR-1234
  driverName?: string
  driverPhone?: string
  
  deliveredToName: string
  deliveredToAddress?: string
  deliveredToPhone?: string
  referencePO?: string
  
  items: ChallanItem[]
  conditionNotes?: string

  businessStampBase64?: string
  businessSignatureBase64?: string
}

export function generateChallanPDF(data: DeliveryChallanData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  })

  const W = 148 // A5 width in mm
  const PAGE_H = 210 // A5 height in mm
  const M = 10

  // ── HEADER BAND ──
  doc.setFillColor(15, 31, 61)
  doc.rect(0, 0, W, 32, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(249, 250, 251)
  doc.text(data.businessName, M, 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(156, 163, 175)
  if (data.businessAddress) doc.text(data.businessAddress, M, 16, { maxWidth: 75 })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(96, 165, 250)
  doc.text('DELIVERY CHALLAN', W - M, 12, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(156, 163, 175)
  doc.text(`Challan #: ${data.challanNumber}`, W - M, 18, { align: 'right' })
  doc.text(`Date: ${data.date}`, W - M, 23, { align: 'right' })

  let y = 37

  // ── CHALLAN INFO BOX (2 Columns) ──
  doc.setDrawColor(229, 231, 235)
  doc.setFillColor(249, 250, 251)
  doc.roundedRect(M, y, W - M * 2, 28, 1, 1, 'FD')

  const leftX = M + 3
  const rightX = W / 2 + 3

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(55, 65, 81)

  // Left Column
  doc.text(`Challan No: ${data.challanNumber}`, leftX, y + 5)
  doc.text(`Date: ${data.date}`, leftX, y + 10)
  if (data.vehicleNumber) doc.text(`Vehicle No: ${data.vehicleNumber}`, leftX, y + 15)
  if (data.driverName) doc.text(`Driver: ${data.driverName} (${data.driverPhone || ''})`, leftX, y + 20)

  // Right Column
  doc.text(`Delivered To: ${data.deliveredToName}`, rightX, y + 5)
  if (data.deliveredToAddress) doc.text(`Address: ${data.deliveredToAddress}`, rightX, y + 10, { maxWidth: 60 })
  if (data.deliveredToPhone) doc.text(`Contact: ${data.deliveredToPhone}`, rightX, y + 18)
  if (data.referencePO) doc.text(`Ref PO: ${data.referencePO}`, rightX, y + 23)

  y += 33

  // ── ITEMS TABLE ──
  const rows = data.items.map((item, idx) => [
    (idx + 1).toString(),
    item.description,
    item.quantity.toString(),
    item.unit || 'pcs',
    item.remarks || 'Good Condition',
  ])

  // Fill up to at least 6-8 rows for clean layout
  while (rows.length < 6) {
    rows.push(['', '', '', '', ''])
  }

  ;(doc as any).autoTable({
    startY: y,
    head: [['S.No', 'Description', 'Quantity', 'Unit', 'Remarks']],
    body: rows,
    margin: { left: M, right: M },
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [15, 31, 61], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  y = (doc as any).lastAutoTable.finalY + 4

  // Total items summary line
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text(`Total Items Dispatched: ${data.items.length}`, M, y)

  y += 6

  // ── CONDITION NOTES BOX ──
  doc.setDrawColor(229, 231, 235)
  doc.setFillColor(254, 243, 199) // Light amber
  doc.roundedRect(M, y, W - M * 2, 10, 1, 1, 'FD')

  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(146, 64, 14)
  doc.text(`Condition Notes: ${data.conditionNotes || 'Goods dispatched in good condition unless noted above.'}`, M + 3, y + 6)

  y += 16

  // ── 3 SIGNATURE BLOCKS ──
  const blockW = (W - M * 2) / 3

  // Prepared By (Warehouse)
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(55, 65, 81)

  doc.line(M, y + 10, M + blockW - 4, y + 10)
  doc.text('PREPARED BY', M, y + 14)
  doc.setFont('helvetica', 'normal')
  doc.text('(Warehouse Manager)', M, y + 18)

  // Dispatched By (Driver)
  doc.line(M + blockW, y + 10, M + blockW * 2 - 4, y + 10)
  doc.setFont('helvetica', 'bold')
  doc.text('DISPATCHED BY', M + blockW, y + 14)
  doc.setFont('helvetica', 'normal')
  doc.text('(Driver Signature)', M + blockW, y + 18)

  // Received By (Customer)
  doc.line(M + blockW * 2, y + 10, W - M, y + 10)
  doc.setFont('helvetica', 'bold')
  doc.text('RECEIVED BY', M + blockW * 2, y + 14)
  doc.setFont('helvetica', 'normal')
  doc.text('(Customer Signature & Stamp)', M + blockW * 2, y + 18)

  // Add digital stamp & signature if provided
  if (data.businessStampBase64) {
    try {
      doc.addImage(data.businessStampBase64, 'PNG', W - M - 25, y - 5, 20, 20)
    } catch {}
  }

  // Footer
  const footerY = PAGE_H - 8
  doc.setFontSize(6)
  doc.setTextColor(156, 163, 175)
  doc.text(`This is a computer generated delivery challan · Noxis Hub | ${data.businessName}`, W / 2, footerY, { align: 'center' })

  doc.save(`Challan_${data.challanNumber}.pdf`)
}
