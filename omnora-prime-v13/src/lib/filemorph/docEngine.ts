/**
 * Noxis Hub — Client-Side Local-First Document Engine (.docx, HTML, Text, PDF)
 * Zero external cloud dependencies. 100% offline browser execution.
 */

import mammoth from 'mammoth';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * 1. Convert Word .docx file to HTML and Clean Text.
 */
export async function docxToHtml(
  file: File,
  onProgress?: (p: number) => void
): Promise<{ html: string; text: string }> {
  if (onProgress) onProgress(20);
  const arrayBuffer = await file.arrayBuffer();
  if (onProgress) onProgress(50);

  const result = await mammoth.convertToHtml({ arrayBuffer });
  const rawTextResult = await mammoth.extractRawText({ arrayBuffer });

  if (onProgress) onProgress(100);
  return {
    html: result.value,
    text: rawTextResult.value,
  };
}

/**
 * 2. Convert Word .docx file directly to PDF.
 */
export async function docxToPdf(
  file: File,
  onProgress?: (p: number) => void
): Promise<Uint8Array> {
  if (onProgress) onProgress(10);
  const { text } = await docxToHtml(file, p => onProgress?.(Math.floor(p * 0.5)));

  if (onProgress) onProgress(60);

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 11;
  const margin = 50;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 14;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      y -= lineHeight;
      if (y < margin) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      continue;
    }

    // Word wrap
    const words = line.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > maxWidth && currentLine) {
        page.drawText(currentLine, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
        y -= lineHeight;
        if (y < margin) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      page.drawText(currentLine, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
      y -= lineHeight;
      if (y < margin) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
    }
  }

  if (onProgress) onProgress(90);
  const bytes = await pdfDoc.save();
  if (onProgress) onProgress(100);
  return bytes;
}

/**
 * 3. Convert HTML or Text content into an editable Word document (.docx).
 */
export async function textToDocx(
  textOrHtml: string,
  title: string = 'Document',
  onProgress?: (p: number) => void
): Promise<Blob> {
  if (onProgress) onProgress(20);
  const zip = new JSZip();

  const escapeXml = (s: string) =>
    s.replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&apos;');

  // Strip HTML tags for clean paragraph text
  const cleanText = textOrHtml.replace(/<[^>]*>/g, '');
  const lines = cleanText.split('\n').filter(Boolean);

  const paragraphsXml = lines
    .map(line => `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`)
    .join('\n');

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>${escapeXml(title)}</w:t></w:r>
    </w:p>
    ${paragraphsXml}
  </w:body>
</w:document>`;

  zip.file('[Content_Types].xml', contentTypes);
  zip.file('_rels/.rels', rels);
  zip.file('word/document.xml', documentXml);

  if (onProgress) onProgress(70);
  const blob = await zip.generateAsync({ type: 'blob' });
  if (onProgress) onProgress(100);
  return blob;
}

/**
 * 4. Convert Text/HTML to PDF.
 */
export async function textToPdf(
  text: string,
  onProgress?: (p: number) => void
): Promise<Uint8Array> {
  const file = new File([text], 'temp.txt', { type: 'text/plain' });
  return docxToPdf(file, onProgress);
}
