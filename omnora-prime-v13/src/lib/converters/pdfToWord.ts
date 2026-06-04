/**
 * PDF ↔ Word converters
 * All processing happens locally in the browser — no server calls.
 */

/** Load pdf.js from CDN and set the worker source */
async function loadPdfJs(): Promise<any> {
  // Use a script tag approach to avoid ESM issues with CDN imports
  if (typeof window === 'undefined') throw new Error('Browser only');

  const PDFJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  // If already loaded, return the global
  if ((window as any).pdfjsLib) {
    (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
    return (window as any).pdfjsLib;
  }

  // Inject script tag
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PDFJS_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load pdf.js from CDN'));
    document.head.appendChild(script);
  });

  const lib = (window as any).pdfjsLib;
  if (!lib) throw new Error('pdf.js did not initialise');
  lib.GlobalWorkerOptions.workerSrc = WORKER_URL;
  return lib;
}

/** Extract all text from a PDF file, page by page */
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await loadPdfJs();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += `--- Page ${i} ---\n${pageText}\n\n`;
  }
  return fullText;
}

/** Convert a PDF file to a .docx Blob */
export async function pdfToDocx(
  file: File,
  onProgress: (p: number) => void
): Promise<Blob> {
  onProgress(10);
  const text = await extractTextFromPDF(file);
  onProgress(60);

  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

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

  const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

  const escapeXml = (s: string) =>
    s.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const paragraphs = text
    .split('\n')
    .map(line =>
      `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`
    )
    .join('\n');

  const titleText = escapeXml(file.name.replace(/\.pdf$/i, ''));

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>${titleText}</w:t></w:r>
    </w:p>
    ${paragraphs}
    <w:sectPr/>
  </w:body>
</w:document>`;

  zip.file('[Content_Types].xml', contentTypes);
  zip.file('_rels/.rels', rels);
  zip.file('word/document.xml', document);
  zip.file('word/_rels/document.xml.rels', wordRels);

  onProgress(90);
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  onProgress(100);
  return blob;
}

/** Convert a Word / text file to a PDF Blob */
export async function wordToPdf(
  file: File,
  onProgress: (p: number) => void
): Promise<Blob> {
  onProgress(10);

  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  onProgress(30);

  let text: string;
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    text = result.value;
  } catch {
    // Fallback for plain .txt files
    text = await file.text();
  }

  onProgress(60);

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(file.name.replace(/\.(docx?|txt)$/i, ''), 20, 20);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const lines = doc.splitTextToSize(text, 170);
  let y = 35;
  const pageHeight = doc.internal.pageSize.height;

  for (const line of lines) {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, 20, y);
    y += 6;
  }

  onProgress(100);
  return doc.output('blob');
}
