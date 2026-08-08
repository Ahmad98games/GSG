import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { getAmountInWords } from '@/lib/format/amountInWords'

export interface PayslipItem {
  description: string
  unitsOrDays?: string
  rate?: number
  amount: number
}

export interface BankGradePayslipData {
  businessName: string
  businessAddress?: string
  businessPhone?: string
  taxNumber?: string // NTN (PK) or TRN (AE)
  monthYear: string // e.g. "JULY 2026"
  payslipNumber: string // e.g. "PS-2026-07-001"
  
  // Employee details
  employeeName: string
  employeeCode: string
  department?: string
  designation?: string
  cnic?: string // Pakistan CNIC XXXXX-XXXXXXX-X
  bankName?: string
  bankAccountNumber?: string
  eobiNumber?: string

  // Period / Attendance
  payPeriod: string // "01 Jul - 31 Jul 2026"
  workingDays: number
  presentDays: number
  absentDays: number
  halfDays?: number

  // Breakdown tables
  earnings: PayslipItem[]
  deductions: PayslipItem[]
  
  currency?: string
}

export function generatePayslipPDF(data: BankGradePayslipData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  })

  const W = 148 // A5 width in mm
  const PAGE_H = 210 // A5 height
  const M = 10 // Margin
  const currency = data.currency || 'PKR'

  // ── HEADER BAND ──
  doc.setFillColor(15, 31, 61) // Dark navy band
  doc.rect(0, 0, W, 32, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(249, 250, 251)
  doc.text(data.businessName, M, 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(156, 163, 175)
  if (data.businessAddress) doc.text(data.businessAddress, M, 16, { maxWidth: 75 })
  if (data.taxNumber) doc.text(`NTN/TRN: ${data.taxNumber}`, M, 22)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(96, 165, 250)
  doc.text('SALARY SLIP', W - M, 12, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(156, 163, 175)
  doc.text(data.monthYear, W - M, 18, { align: 'right' })
  doc.text(data.payslipNumber, W - M, 23, { align: 'right' })

  let y = 37

  // ── EMPLOYEE INFO BOX (2 Columns) ──
  doc.setDrawColor(229, 231, 235)
  doc.setFillColor(249, 250, 251)
  doc.roundedRect(M, y, W - M * 2, 28, 1, 1, 'FD')

  const leftX = M + 3
  const rightX = W / 2 + 3

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(55, 65, 81)

  // Left Column
  doc.text(`Employee Name: ${data.employeeName}`, leftX, y + 5)
  doc.text(`Code: ${data.employeeCode}`, leftX, y + 10)
  if (data.designation) doc.text(`Designation: ${data.designation}`, leftX, y + 15)
  if (data.cnic) doc.text(`CNIC: ${data.cnic}`, leftX, y + 20)
  if (data.bankAccountNumber) doc.text(`Bank A/C: ${data.bankName ? data.bankName + ' - ' : ''}${data.bankAccountNumber}`, leftX, y + 25)

  // Right Column
  doc.text(`Pay Period: ${data.payPeriod}`, rightX, y + 5)
  doc.text(`Working Days: ${data.workingDays}`, rightX, y + 10)
  doc.text(`Present Days: ${data.presentDays}`, rightX, y + 15)
  doc.text(`Absent Days: ${data.absentDays}`, rightX, y + 20)
  if (data.eobiNumber) doc.text(`EOBI No: ${data.eobiNumber}`, rightX, y + 25)

  y += 33

  // ── EARNINGS & DEDUCTIONS TABLES ──
  const totalEarnings = data.earnings.reduce((s, e) => s + e.amount, 0)
  const totalDeductions = data.deductions.reduce((s, d) => s + d.amount, 0)
  const netPay = Math.max(0, totalEarnings - totalDeductions)

  // Earnings Table
  ;(doc as any).autoTable({
    startY: y,
    head: [['Earnings Description', 'Units/Days', 'Rate', `Amount (${currency})`]],
    body: data.earnings.map(e => [
      e.description,
      e.unitsOrDays || '—',
      e.rate ? `${currency} ${e.rate}` : '—',
      `${currency} ${e.amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`
    ]),
    margin: { left: M, right: M },
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [15, 31, 61], textColor: [255, 255, 255], fontStyle: 'bold' },
  })

  y = (doc as any).lastAutoTable.finalY + 4

  // Deductions Table
  if (data.deductions.length > 0) {
    ;(doc as any).autoTable({
      startY: y,
      head: [['Deductions Description', `Amount (${currency})`]],
      body: data.deductions.map(d => [
        d.description,
        `\u2212 ${currency} ${d.amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`
      ]),
      margin: { left: M, right: M },
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontStyle: 'bold' },
    })

    y = (doc as any).lastAutoTable.finalY + 4
  }

  // ── NET SALARY BOX ──
  doc.setFillColor(15, 31, 61)
  doc.roundedRect(M, y, W - M * 2, 16, 1, 1, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text('NET SALARY:', M + 4, y + 7)

  doc.setFontSize(11)
  doc.setTextColor(96, 165, 250)
  doc.text(`${currency} ${netPay.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`, W - M - 4, y + 7, { align: 'right' })

  // Amount in Words English & Urdu
  const wordsEn = getAmountInWords(netPay, currency, 'en')
  const wordsUr = getAmountInWords(netPay, 'روپے', 'ur')

  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(209, 213, 219)
  doc.text(wordsEn, M + 4, y + 13)
  doc.text(wordsUr, W - M - 4, y + 13, { align: 'right' })

  y += 22

  // ── SIGNATURE SECTION ──
  doc.setDrawColor(209, 213, 219)
  doc.line(M, y + 10, M + 35, y + 10)
  doc.line(W - M - 35, y + 10, W - M, y + 10)

  doc.setFontSize(6.5)
  doc.setTextColor(107, 114, 128)
  doc.text('Employee Signature', M, y + 14)
  doc.text('Employer Signature & Stamp', W - M - 35, y + 14)

  // Footer
  const footerY = PAGE_H - 8
  doc.setFontSize(6)
  doc.setTextColor(156, 163, 175)
  doc.text('This is a computer generated payslip · Verified by Noxis Hub | noxishub.app', W / 2, footerY, { align: 'center' })

  doc.save(`Payslip_${data.employeeCode}_${data.monthYear.replace(/\s/g, '_')}.pdf`)
}
