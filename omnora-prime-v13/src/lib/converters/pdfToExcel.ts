/**
 * PDF ↔ Excel converters
 * All processing happens locally in the browser — no server calls.
 */

/** Convert a PDF to an Excel .xlsx Blob by extracting text as tabular rows */
export async function pdfToExcel(
  file: File,
  onProgress: (p: number) => void
): Promise<Blob> {
  onProgress(10);

  const { extractTextFromPDF } = await import('./pdfToWord');
  const text = await extractTextFromPDF(file);
  onProgress(50);

  const XLSX = await import('xlsx');

  const lines = text
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('---'));

  // Try to detect columns: split by 2+ spaces
  const rows = lines.map(line => {
    const cols = line.split(/\s{2,}/).map(c => c.trim()).filter(Boolean);
    return cols.length > 1 ? cols : [line.trim()];
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Extracted Data');

  onProgress(90);
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  onProgress(100);

  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/** Convert an Excel / CSV file to a PDF Blob */
export async function excelToPdf(
  file: File,
  onProgress: (p: number) => void
): Promise<Blob> {
  onProgress(10);

  const XLSX = await import('xlsx');
  const { jsPDF } = await import('jspdf');

  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  onProgress(40);

  const doc = new jsPDF({ orientation: 'landscape' });

  wb.SheetNames.forEach((sheetName, sheetIdx) => {
    if (sheetIdx > 0) doc.addPage();

    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

    // Sheet title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(sheetName, 10, 15);

    if (data.length === 0) return;

    const maxCols = Math.max(...data.map(r => r.length));
    const pageWidth = doc.internal.pageSize.width;
    const colWidth = Math.min(40, (pageWidth - 20) / maxCols);

    doc.setFontSize(8);
    let y = 25;

    data.slice(0, 50).forEach((row, rowIdx) => {
      if (y > doc.internal.pageSize.height - 15) {
        doc.addPage();
        y = 20;
      }

      if (rowIdx === 0) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
        if (rowIdx % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(10, y - 4, pageWidth - 20, 8, 'F');
        }
      }

      row.slice(0, maxCols).forEach((cell, colIdx) => {
        const x = 10 + colIdx * colWidth;
        const cellStr = String(cell ?? '').slice(0, 15);
        doc.text(cellStr, x, y);
      });
      y += 9;
    });

    if (data.length > 50) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text(`(${data.length - 50} more rows not shown)`, 10, y + 5);
    }
  });

  onProgress(100);
  return doc.output('blob');
}
