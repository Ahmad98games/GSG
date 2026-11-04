/**
 * Noxis Hub — Professional A4 Tax Invoice Generator
 * Generates and triggers instant browser download of a high-resolution A4 Tax Invoice PDF.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAmountInWords } from '@/lib/format/amountInWords';

export interface A4InvoiceItem {
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  rate?: number;
  price?: number;
  total?: number;
  discount?: number;
}

export interface A4InvoiceData {
  invoiceNumber: string;
  invoiceDate?: string;
  dueDate?: string;
  customer?: string;
  customerPhone?: string;
  customerAddress?: string;
  businessName?: string;
  businessPhone?: string;
  businessAddress?: string;
  ntn?: string;
  strn?: string;
  items: A4InvoiceItem[];
  subtotal: number;
  discount?: number;
  tax: number;
  total: number;
  amountPaid?: number;
  balanceDue?: number;
  currency?: string;
  paymentMethod?: string;
}

function formatMoney(amount: number | string | undefined | null, curr = 'Rs.'): string {
  const num = Number(amount) || 0;
  return `${curr} ${num.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateA4Invoice(invoice: A4InvoiceData): { doc: jsPDF; buffer: ArrayBuffer } {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const PAGE_W = 210;
    const PAGE_H = 297;
    const M = 14;
    const curr = invoice.currency || 'Rs.';

    // ── 1. Top Header Banner ──────────────────────────────────────────
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, PAGE_W, 42, 'F');

    // Business Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    const busName = invoice.businessName || 'NOXIS INDUSTRIAL ERP';
    doc.text(busName.toUpperCase(), M, 15);

    // Business Contact & Tax Info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225); // slate-300
    if (invoice.businessAddress) {
      doc.text(invoice.businessAddress, M, 21, { maxWidth: 110 });
    }
    const contactLine = [
      invoice.businessPhone ? `Tel: ${invoice.businessPhone}` : '',
      invoice.ntn ? `NTN: ${invoice.ntn}` : '',
      invoice.strn ? `STRN: ${invoice.strn}` : '',
    ].filter(Boolean).join(' | ');
    if (contactLine) {
      doc.text(contactLine, M, 27);
    }

    // Right Side: TAX INVOICE Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(96, 165, 250); // blue-400
    doc.text('TAX INVOICE', PAGE_W - M, 16, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(226, 232, 240);
    const invNum = invoice.invoiceNumber || 'INV-000000';
    doc.text(`Invoice #: ${invNum}`, PAGE_W - M, 23, { align: 'right' });
    doc.text(`Date: ${invoice.invoiceDate || new Date().toLocaleDateString('en-PK')}`, PAGE_W - M, 29, { align: 'right' });
    if (invoice.dueDate) {
      doc.text(`Due: ${invoice.dueDate}`, PAGE_W - M, 35, { align: 'right' });
    }

    // ── 2. Bill To Box ────────────────────────────────────────────────
    let y = 48;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(M, y, PAGE_W - M * 2, 22, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('BILLED TO (CUSTOMER):', M + 4, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(invoice.customer || 'Walk-in Customer', M + 4, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const custContact = [
      invoice.customerPhone ? `Tel: ${invoice.customerPhone}` : '',
      invoice.customerAddress || '',
    ].filter(Boolean).join(' | ');
    if (custContact) {
      doc.text(custContact, M + 4, y + 17);
    }

    y += 28;

    // ── 3. Line Items Table (Mapped exactly per requirements) ──────────
    const safeItems = Array.isArray(invoice.items) && invoice.items.length > 0
      ? invoice.items
      : [{ name: 'Standard Store Item', quantity: 1, unit: 'pcs', rate: invoice.total, total: invoice.total }];

    const tableRows = safeItems.map((item, idx) => {
      const description = item.name || item.description || 'Standard Item';
      const qty = Number(item.quantity) || 1;
      const unit = item.unit || 'Suits';
      const rate = Number(item.rate ?? item.price ?? 0);
      const total = Number(item.total ?? (qty * rate));

      return [
        String(idx + 1),
        description,
        `${qty} ${unit}`.trim(),
        formatMoney(rate, curr),
        formatMoney(total, curr),
      ];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['#', 'Item / Description', 'Qty', 'Unit Rate', 'Total Amount']],
      body: tableRows,
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        cellPadding: 3.5,
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3.5,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 28, halign: 'center' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 42, halign: 'right', fontStyle: 'bold' },
      },
      theme: 'plain',
    });

    y = ((doc as any).lastAutoTable?.finalY ?? y) + 8;

    // ── 4. Totals Calculation Box ────────────────────────────────────
    const totalsW = 75;
    const totalsX = PAGE_W - M - totalsW;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(totalsX, y, totalsW, 46, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Subtotal:', totalsX + 4, y + 7);
    doc.text(formatMoney(invoice.subtotal, curr), totalsX + totalsW - 4, y + 7, { align: 'right' });

    if (invoice.discount && invoice.discount > 0) {
      doc.text('Discount:', totalsX + 4, y + 14);
      doc.setTextColor(220, 38, 38);
      doc.text(`-${formatMoney(invoice.discount, curr)}`, totalsX + totalsW - 4, y + 14, { align: 'right' });
      doc.setTextColor(71, 85, 105);
    }

    if (invoice.tax && invoice.tax > 0) {
      doc.text('Sales Tax / GST:', totalsX + 4, y + 21);
      doc.text(formatMoney(invoice.tax, curr), totalsX + totalsW - 4, y + 21, { align: 'right' });
    }

    doc.setDrawColor(203, 213, 225);
    doc.line(totalsX + 4, y + 27, totalsX + totalsW - 4, y + 27);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Grand Total:', totalsX + 4, y + 35);
    doc.text(formatMoney(invoice.total, curr), totalsX + totalsW - 4, y + 35, { align: 'right' });

    const paid = Number(invoice.amountPaid ?? invoice.total);
    const balance = Number(invoice.balanceDue ?? 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Paid: ${formatMoney(paid, curr)}`, totalsX + 4, y + 42);
    if (balance > 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(`Balance Due: ${formatMoney(balance, curr)}`, totalsX + totalsW - 4, y + 42, { align: 'right' });
    }

    y += 52;

    // ── 5. Amount in Words Box ───────────────────────────────────────
    const wordsBoxW = PAGE_W - M * 2;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(M, y, wordsBoxW, 14, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('AMOUNT IN WORDS:', M + 4, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    const words = getAmountInWords(invoice.total, curr === 'Rs.' ? 'PKR' : curr, 'en');
    doc.text(words, M + 4, y + 10.5, { maxWidth: wordsBoxW - 8 });

    // ── 6. Footer ────────────────────────────────────────────────────
    const footerY = PAGE_H - 18;
    doc.setDrawColor(203, 213, 225);
    doc.line(M, footerY, PAGE_W - M, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Authorized Computer-Generated Tax Invoice · Noxis Hub Industrial POS', M, footerY + 6);
    doc.text('Page 1 of 1', PAGE_W - M, footerY + 6, { align: 'right' });

    // ── 7. Direct File Download (No blocked popups/blobs) ─────────────
    const cleanNumber = String(invNum).replace(/[^a-zA-Z0-9_-]/g, '_');
    if (typeof window !== 'undefined' && typeof (doc as any).save === 'function') {
      doc.save(`Invoice_${cleanNumber}.pdf`);
    }
    return {
      doc,
      buffer: doc.output('arraybuffer') as ArrayBuffer,
    };
  } catch (err: any) {
    console.error('A4 Generation Error:', err);
    throw err;
  }
}

