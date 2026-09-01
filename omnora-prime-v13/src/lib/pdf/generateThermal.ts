import jsPDF from 'jspdf'

export async function generateThermalReceipt(
  invoice: any,
  items: any[],
  profile: any
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200],
  })

  const PAGE_W = 80
  let y = 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(profile?.business_name || 'RECEIPT', PAGE_W / 2, y, { align: 'center' })
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  if (profile?.phone) {
    doc.text(`Tel: ${profile.phone}`, PAGE_W / 2, y, { align: 'center' })
    y += 5
  }

  doc.text(`Receipt #: ${invoice?.invoice_number || ''}`, 5, y)
  y += 5
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 5, y)
  y += 6

  doc.line(5, y, PAGE_W - 5, y)
  y += 4

  for (const item of items || []) {
    doc.setFont('helvetica', 'bold')
    doc.text(`${item.name}`, 5, y)
    y += 4
    doc.setFont('helvetica', 'normal')
    doc.text(`${item.quantity} x ${item.unitPrice} = ${item.lineTotal}`, 5, y)
    y += 5
  }

  doc.line(5, y, PAGE_W - 5, y)
  y += 5

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(`TOTAL: ${invoice?.total_amount || 0}`, PAGE_W - 5, y, { align: 'right' })
  y += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Thank you for your business!', PAGE_W / 2, y, { align: 'center' })

  doc.save(`Thermal-${invoice?.invoice_number || 'Receipt'}.pdf`)
}
