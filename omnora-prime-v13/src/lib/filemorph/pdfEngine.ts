/**
 * Noxis Hub — Client-Side Local-First PDF Engine
 * Zero external cloud dependencies. 100% offline browser execution.
 */

import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

export interface PageRange {
  start: number;
  end: number;
}

/**
 * Parses page range string (e.g., "1-3, 5, 8-10") into 0-indexed page numbers.
 */
export function parsePageRanges(rangeStr: string, totalPages: number): number[] {
  const pageIndices = new Set<number>();
  const parts = rangeStr.split(',').map(p => p.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map(s => s.trim());
      const start = Math.max(1, parseInt(startStr, 10) || 1);
      const end = Math.min(totalPages, parseInt(endStr, 10) || totalPages);
      for (let i = start; i <= end; i++) {
        pageIndices.add(i - 1);
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        pageIndices.add(pageNum - 1);
      }
    }
  }

  return Array.from(pageIndices).sort((a, b) => a - b);
}

/**
 * 1. Merge multiple PDFs into a single Uint8Array.
 */
export async function mergePdfs(
  pdfBuffers: ArrayBuffer[],
  onProgress?: (p: number) => void
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  const total = pdfBuffers.length;

  for (let i = 0; i < total; i++) {
    if (onProgress) onProgress(Math.floor((i / total) * 90));
    try {
      const srcPdf = await PDFDocument.load(pdfBuffers[i], { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
      copiedPages.forEach(page => mergedPdf.addPage(page));
    } catch (err: any) {
      console.warn(`Skipping invalid/corrupt PDF chunk ${i + 1}:`, err.message);
    }
  }

  if (onProgress) onProgress(95);
  const bytes = await mergedPdf.save();
  if (onProgress) onProgress(100);
  return bytes;
}

/**
 * 2. Split PDF by custom page range or into individual pages.
 */
export async function splitPdf(
  pdfBuffer: ArrayBuffer,
  rangeStr?: string,
  onProgress?: (p: number) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const srcPdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const totalPages = srcPdf.getPageCount();
  const results: { name: string; bytes: Uint8Array }[] = [];

  if (rangeStr && rangeStr.trim()) {
    const indices = parsePageRanges(rangeStr, totalPages);
    if (!indices.length) throw new Error('No valid pages found in specified range');

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(srcPdf, indices);
    copiedPages.forEach(page => newPdf.addPage(page));
    const bytes = await newPdf.save();
    results.push({ name: `extracted_pages_${rangeStr.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`, bytes });
  } else {
    // Split into individual page files
    for (let i = 0; i < totalPages; i++) {
      if (onProgress) onProgress(Math.floor((i / totalPages) * 90));
      const newPdf = await PDFDocument.create();
      const [copiedPage] = await newPdf.copyPages(srcPdf, [i]);
      newPdf.addPage(copiedPage);
      const bytes = await newPdf.save();
      results.push({ name: `page_${i + 1}.pdf`, bytes });
    }
  }

  if (onProgress) onProgress(100);
  return results;
}

/**
 * 3. Rotate PDF pages by 90, 180, or 270 degrees.
 */
export async function rotatePdf(
  pdfBuffer: ArrayBuffer,
  rotationDegrees: 90 | 180 | 270,
  pageIndices?: number[],
  onProgress?: (p: number) => void
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pages = pdf.getPages();
  const targetIndices = pageIndices && pageIndices.length
    ? pageIndices
    : pages.map((_, i) => i);

  targetIndices.forEach(idx => {
    if (pages[idx]) {
      const currentRot = pages[idx].getRotation().angle;
      pages[idx].setRotation(degrees((currentRot + rotationDegrees) % 360));
    }
  });

  if (onProgress) onProgress(80);
  const bytes = await pdf.save();
  if (onProgress) onProgress(100);
  return bytes;
}

/**
 * 4. Delete & Reorder Pages.
 */
export async function reorderPdfPages(
  pdfBuffer: ArrayBuffer,
  newOrderIndices: number[], // 0-indexed order of pages to keep
  onProgress?: (p: number) => void
): Promise<Uint8Array> {
  const srcPdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();

  const validIndices = newOrderIndices.filter(i => i >= 0 && i < srcPdf.getPageCount());
  if (!validIndices.length) throw new Error('Invalid page reordering selection');

  const copiedPages = await newPdf.copyPages(srcPdf, validIndices);
  copiedPages.forEach(p => newPdf.addPage(p));

  if (onProgress) onProgress(80);
  const bytes = await newPdf.save();
  if (onProgress) onProgress(100);
  return bytes;
}

/**
 * 5. Password Encrypt / Lock PDF (User & Owner Passwords + Permissions).
 */
export async function encryptPdf(
  pdfBuffer: ArrayBuffer,
  userPassword: string,
  ownerPassword?: string,
  permissions?: {
    printing?: 'highResolution' | 'lowResolution' | 'none';
    modifying?: boolean;
    copying?: boolean;
    annotating?: boolean;
  },
  onProgress?: (p: number) => void
): Promise<Uint8Array> {
  if (!userPassword) throw new Error('Password cannot be empty');
  if (onProgress) onProgress(20);

  const pdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  if (onProgress) onProgress(60);

  const saveOptions: any = {
    userPassword,
    ownerPassword: ownerPassword || userPassword,
    permissions: {
      printing: permissions?.printing || 'none',
      modifying: permissions?.modifying ?? false,
      copying: permissions?.copying ?? false,
      annotating: permissions?.annotating ?? false,
      fillingForms: permissions?.modifying ?? false,
      contentAccessibility: false,
      documentAssembly: false,
    },
    useObjectStreams: true,
  };

  const bytes = await pdf.save(saveOptions);
  if (onProgress) onProgress(100);
  return bytes;
}

/**
 * 6. Decrypt / Unlock PDF with password.
 */
export async function unlockPdf(
  pdfBuffer: ArrayBuffer,
  password?: string,
  onProgress?: (p: number) => void
): Promise<Uint8Array> {
  if (onProgress) onProgress(30);
  const pdf = await PDFDocument.load(pdfBuffer, { password, ignoreEncryption: true } as any);
  if (onProgress) onProgress(70);

  // Re-save without password options -> produces an unencrypted PDF clone
  const bytes = await pdf.save({ useObjectStreams: true });
  if (onProgress) onProgress(100);
  return bytes;
}

/**
 * 7. Text Watermark PDF.
 */
export async function watermarkPdfText(
  pdfBuffer: ArrayBuffer,
  text: string,
  options: {
    opacity?: number;
    fontSize?: number;
    rotation?: number;
    color?: { r: number; g: number; b: number };
  } = {},
  onProgress?: (p: number) => void
): Promise<Uint8Array> {
  if (!text) throw new Error('Watermark text cannot be empty');
  const pdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pages = pdf.getPages();
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);

  const opacity = options.opacity ?? 0.2;
  const fontSize = options.fontSize ?? 48;
  const rotationDeg = options.rotation ?? -45;
  const c = options.color ?? { r: 0.03, g: 0.92, b: 0.96 }; // Cyber Cyan default

  for (let i = 0; i < pages.length; i++) {
    if (onProgress) onProgress(Math.floor((i / pages.length) * 80));
    const page = pages[i];
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: (height - textHeight) / 2,
      size: fontSize,
      font,
      color: rgb(c.r, c.g, c.b),
      opacity,
      rotate: degrees(rotationDeg),
    });
  }

  if (onProgress) onProgress(90);
  const bytes = await pdf.save({ useObjectStreams: true });
  if (onProgress) onProgress(100);
  return bytes;
}

/**
 * 8. Image Watermark PDF.
 */
export async function watermarkPdfImage(
  pdfBuffer: ArrayBuffer,
  imageBuffer: ArrayBuffer,
  imageType: string,
  options: { opacity?: number; scale?: number; rotation?: number } = {},
  onProgress?: (p: number) => void
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pages = pdf.getPages();

  let embeddedImg;
  if (imageType.includes('png')) {
    embeddedImg = await pdf.embedPng(imageBuffer);
  } else {
    embeddedImg = await pdf.embedJpg(imageBuffer);
  }

  const opacity = options.opacity ?? 0.25;
  const userScale = options.scale ?? 0.5;
  const rotationDeg = options.rotation ?? 0;

  for (let i = 0; i < pages.length; i++) {
    if (onProgress) onProgress(Math.floor((i / pages.length) * 80));
    const page = pages[i];
    const { width, height } = page.getSize();
    const imgDims = embeddedImg.scale(userScale);

    page.drawImage(embeddedImg, {
      x: (width - imgDims.width) / 2,
      y: (height - imgDims.height) / 2,
      width: imgDims.width,
      height: imgDims.height,
      opacity,
      rotate: degrees(rotationDeg),
    });
  }

  if (onProgress) onProgress(90);
  const bytes = await pdf.save({ useObjectStreams: true });
  if (onProgress) onProgress(100);
  return bytes;
}

/**
 * 9. Compress PDF by object stream optimization & structure re-serialization.
 */
export async function compressPdf(
  pdfBuffer: ArrayBuffer,
  onProgress?: (p: number) => void
): Promise<Uint8Array> {
  if (onProgress) onProgress(20);
  const pdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true, updateMetadata: false });
  if (onProgress) onProgress(60);
  const bytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
  if (onProgress) onProgress(100);
  return bytes;
}

/**
 * 10. Redact / Blackout regions on PDF pages.
 */
export async function redactPdf(
  pdfBuffer: ArrayBuffer,
  redactions: { pageIndex: number; x: number; y: number; width: number; height: number }[],
  onProgress?: (p: number) => void
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pages = pdf.getPages();

  for (let i = 0; i < redactions.length; i++) {
    if (onProgress) onProgress(Math.floor((i / redactions.length) * 80));
    const r = redactions[i];
    const page = pages[r.pageIndex];
    if (page) {
      page.drawRectangle({
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        color: rgb(0, 0, 0),
        borderWidth: 0,
      });
    }
  }

  if (onProgress) onProgress(90);
  const bytes = await pdf.save({ useObjectStreams: true });
  if (onProgress) onProgress(100);
  return bytes;
}

/**
 * 11. Fill interactive PDF form fields programmatically.
 */
export async function fillPdfForm(
  pdfBuffer: ArrayBuffer,
  fieldValues: Record<string, string>,
  flatten: boolean = true,
  onProgress?: (p: number) => void
): Promise<Uint8Array> {
  if (onProgress) onProgress(20);
  const pdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const form = pdf.getForm();

  if (onProgress) onProgress(50);
  for (const [key, val] of Object.entries(fieldValues)) {
    try {
      const textField = form.getTextField(key);
      textField.setText(val);
    } catch {
      try {
        const checkBox = form.getCheckBox(key);
        if (val === 'true' || val === '1' || val === 'yes') checkBox.check();
        else checkBox.uncheck();
      } catch {}
    }
  }

  if (flatten) form.flatten();

  if (onProgress) onProgress(90);
  const bytes = await pdf.save({ useObjectStreams: true });
  if (onProgress) onProgress(100);
  return bytes;
}
