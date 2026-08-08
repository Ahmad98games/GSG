import { useCallback } from 'react'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'

export function useReportExport() {
  const { profile } = useBusinessProfile()

  const exportToExcel = useCallback(
    async (
      data: Record<string, any>[],
      columns: { key: string; header: string; format?: 'currency' | 'date' | 'text' }[],
      filename: string,
      sheetName: string = 'Report'
    ) => {
      const XLSX = await import('xlsx')

      const header = columns.map(c => c.header)
      const rows = data.map(row =>
        columns.map(col => {
          const val = row[col.key]
          if (col.format === 'currency') {
            return typeof val === 'number' ? val : 0
          }
          if (col.format === 'date') {
            return val ? new Date(val).toLocaleDateString('en-PK') : ''
          }
          return val ?? ''
        })
      )

      const ws = XLSX.utils.aoa_to_sheet([
        [profile?.business_name || 'Noxis Hub'],
        [sheetName],
        [`Generated: ${new Date().toLocaleDateString('en-PK')}`],
        [],
        header,
        ...rows,
      ])

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
      XLSX.writeFile(wb, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`)
    },
    [profile]
  )

  const exportToPDF = useCallback(
    async (
      title: string,
      data: Record<string, any>[],
      columns: { key: string; header: string; width?: number; align?: string }[],
      filename: string,
      summaryRows?: { label: string; value: string }[]
    ) => {
      const { jsPDF } = await import('jspdf')
      await import('jspdf-autotable')

      const doc = new jsPDF({
        orientation: data.length > 10 ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const PAGE_W = doc.internal.pageSize.width
      const M = 12

      // Header band
      doc.setFillColor(15, 31, 61)
      doc.rect(0, 0, PAGE_W, 28, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(249, 250, 251)
      doc.text(profile?.business_name || 'Noxis Hub', M, 10)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(96, 165, 250)
      doc.text(title, M, 18)
      doc.setTextColor(156, 163, 175)
      doc.setFontSize(8)
      doc.text(`Generated: ${new Date().toLocaleDateString('en-PK')}`, PAGE_W - M, 18, { align: 'right' })

      // Table
      ;(doc as any).autoTable({
        startY: 34,
        margin: { left: M, right: M },
        head: [columns.map(c => c.header)],
        body: data.map(row => columns.map(col => row[col.key] ?? '')),
        headStyles: {
          fillColor: [15, 31, 61],
          textColor: [249, 250, 251],
          fontSize: 8,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: columns.reduce(
          (acc, col, i) => ({
            ...acc,
            [i]: {
              cellWidth: col.width,
              halign: col.align || 'left',
            },
          }),
          {}
        ),
      })

      // Summary rows
      if (summaryRows?.length) {
        let y = (doc as any).lastAutoTable.finalY + 8
        summaryRows.forEach(row => {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(9)
          doc.setTextColor(15, 31, 61)
          doc.text(row.label, PAGE_W - M - 60, y)
          doc.setTextColor(96, 165, 250)
          doc.text(row.value, PAGE_W - M, y, { align: 'right' })
          y += 7
        })
      }

      // Page numbers
      const pageCount = (doc.internal as any).getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setTextColor(156, 163, 175)
        doc.text(
          `Page ${i} of ${pageCount} | ${profile?.business_name || 'Noxis Hub'} | Noxis Hub`,
          PAGE_W / 2,
          doc.internal.pageSize.height - 5,
          { align: 'center' }
        )
      }

      doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`)
    },
    [profile]
  )

  return { exportToExcel, exportToPDF }
}
