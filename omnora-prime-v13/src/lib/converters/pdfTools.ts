/**
 * PDF utility tools — split, rotate, compress, protect, extract pages.
 * All processing happens locally in the browser — no server calls.
 */
import { PDFDocument, degrees } from 'pdf-lib';

/** Split a PDF into individual pages */
export async function splitPdf(
  file: File,
  onProgress: (p: number) => void
): Promise<{ name: string; blob: Blob }[]> {
  const arrayBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(arrayBuffer);
  const total = srcPdf.getPageCount();
  const baseName = file.name.replace(/\.pdf$/i, '');
  const results: { name: string; blob: Blob }[] = [];

  for (let i = 0; i < total; i++) {
    onProgress(Math.floor((i / total) * 90));
    const newPdf = await PDFDocument.create();
    const [page] = await newPdf.copyPages(srcPdf, [i]);
    newPdf.addPage(page);
    const bytes = await newPdf.save();
    results.push({
      name: `${baseName}_page${i + 1}.pdf`,
      blob: new Blob([bytes as any], { type: 'application/pdf' }),
    });
  }

  onProgress(100);
  return results;
}

/** Rotate all pages in a PDF by the specified angle */
export async function rotatePdf(
  file: File,
  rotationDegrees: 90 | 180 | 270,
  onProgress: (p: number) => void
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);

  pdf.getPages().forEach(page => {
    page.setRotation(degrees(rotationDegrees));
  });

  onProgress(80);
  const bytes = await pdf.save();
  onProgress(100);
  return new Blob([bytes as any], { type: 'application/pdf' });
}

/**
 * Wrap a PDF in a password-protected ZIP.
 * Note: pdf-lib's open-source version does not support PDF encryption.
 * JSZip encrypted ZIP is the best purely-browser alternative.
 */
export async function protectPdf(
  file: File,
  userPassword: string,
  onProgress: (p: number) => void
): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const arrayBuffer = await file.arrayBuffer();

  zip.file(file.name, arrayBuffer, { comment: 'Protected by Noxis Hub' });
  onProgress(70);

  const blob = (await zip.generateAsync({
    type: 'blob',
    encryptStrength: 3,
    password: userPassword,
  } as any)) as Blob;

  onProgress(100);
  return blob;
}

/** Compress a PDF by re-saving with object streams (removes redundant data) */
export async function compressPdf(
  file: File,
  onProgress: (p: number) => void
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  onProgress(20);
  const pdf = await PDFDocument.load(arrayBuffer, { updateMetadata: false });
  onProgress(60);
  const bytes = await pdf.save({ useObjectStreams: true });
  onProgress(100);
  return new Blob([bytes as any], { type: 'application/pdf' });
}

/** Extract a page range from a PDF (1-indexed, inclusive) */
export async function extractPages(
  file: File,
  startPage: number,
  endPage: number,
  onProgress: (p: number) => void
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(arrayBuffer);
  const total = srcPdf.getPageCount();

  const start = Math.max(0, startPage - 1);
  const end = Math.min(total - 1, endPage - 1);
  const pageIndexes = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  onProgress(30);
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(srcPdf, pageIndexes);
  pages.forEach(p => newPdf.addPage(p));

  onProgress(80);
  const bytes = await newPdf.save();
  onProgress(100);
  return new Blob([bytes as any], { type: 'application/pdf' });
}
