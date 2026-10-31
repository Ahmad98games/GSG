import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface GatePassReceiptData {
  businessName: string;
  gatePassNo: string;
  invoiceNumber: string;
  date: string;
  partyName: string;
  nagCount: number;
  vehicleNumber?: string;
  driverName?: string;
  items: Array<{ description: string; quantity: number; unit: string }>;
}

export function generateGatePassReceiptPDF(data: GatePassReceiptData): void {
  // 80mm Thermal Receipt format
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200], // 80mm width, dynamic height
  });

  const W = 80;
  let y = 10;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('*** GATE PASS / PARCHA ***', W / 2, y, { align: 'center' });
  y += 5;

  doc.setFontSize(10);
  doc.text(data.businessName || 'NOXIS TEXTILE HUB', W / 2, y, { align: 'center' });
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('SECURITY VERIFICATION SLIP (PRICES HIDDEN)', W / 2, y, { align: 'center' });
  y += 4;

  doc.setLineWidth(0.3);
  doc.line(5, y, W - 5, y);
  y += 5;

  // Meta Info
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`Gate Pass #: ${data.gatePassNo}`, 6, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`Bill Ref #: ${data.invoiceNumber}`, 6, y);
  y += 4;
  doc.text(`Date & Time: ${data.date}`, 6, y);
  y += 4;
  doc.text(`Customer: ${data.partyName}`, 6, y);
  y += 4;
  if (data.vehicleNumber) {
    doc.text(`Loader/Van #: ${data.vehicleNumber}`, 6, y);
    y += 4;
  }
  if (data.driverName) {
    doc.text(`Driver: ${data.driverName}`, 6, y);
    y += 4;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`TOTAL NAG (BUNDLES): ${data.nagCount}`, 6, y);
  y += 5;

  doc.line(5, y, W - 5, y);
  y += 4;

  // Items Table (NO PRICES!)
  const tableRows = data.items.map(it => [
    it.description,
    `${it.quantity} ${it.unit || 'Piece'}`
  ]);

  (doc as any).autoTable({
    startY: y,
    head: [['Item Description', 'Qty']],
    body: tableRows,
    margin: { left: 5, right: 5 },
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255] },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Verification & Sign box
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('GUARD VERIFICATION CHECKLIST:', 6, finalY);
  doc.setFont('helvetica', 'normal');
  doc.text('[  ] Physical Nag Count Verified', 6, finalY + 4);
  doc.text('[  ] Exit Allowed', 6, finalY + 8);

  doc.text('Gate Guard Signature: __________________', 6, finalY + 16);

  doc.setFontSize(6);
  doc.text('Scanned verification active · Anti-theft protection', W / 2, finalY + 22, { align: 'center' });

  doc.save(`GatePass_${data.gatePassNo}.pdf`);
}
