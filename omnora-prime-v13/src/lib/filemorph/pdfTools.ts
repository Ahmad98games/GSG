
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

/**
 * Merges multiple PDFs into a single document.
 */
export async function mergePdfs(pdfBuffers: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  
  for (const pdfBytes of pdfBuffers) {
    try {
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    } catch (e) {
      console.error("Error merging PDF chunk:", e);
    }
  }
  
  return await mergedPdf.save();
}

/**
 * Converts a list of image buffers into a single PDF document.
 */
export async function imagesToPdf(
  images: { data: ArrayBuffer; type: string }[],
  options: { pageSize: 'A4' | 'LETTER' } = { pageSize: 'A4' }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const PAGE_SIZES = {
    A4: [595.28, 841.89],
    LETTER: [612, 792]
  };
  const [width, height] = PAGE_SIZES[options.pageSize];

  for (const img of images) {
    const page = pdfDoc.addPage([width, height]);
    let embeddedImg;
    
    if (img.type.includes('png')) {
      embeddedImg = await pdfDoc.embedPng(img.data);
    } else {
      // Handles JPG, JPEG
      embeddedImg = await pdfDoc.embedJpg(img.data);
    }

    const imgDims = embeddedImg.scale(1);
    const scale = Math.min(width / imgDims.width, height / imgDims.height);
    const finalWidth = imgDims.width * scale;
    const finalHeight = imgDims.height * scale;

    page.drawImage(embeddedImg, {
      x: (width - finalWidth) / 2,
      y: (height - finalHeight) / 2,
      width: finalWidth,
      height: finalHeight,
    });
  }

  return await pdfDoc.save();
}

/**
 * PDF password protection is NOT available in the browser.
 * Real encryption requires native libraries (not available in pdf-lib browser build).
 * The Desktop app uses a native binding for this.
 */
export async function protectPdf(
  _pdfBytes: ArrayBuffer | File,
  _password?: string,
  _onProgress?: (p: number) => void
): Promise<Uint8Array> {
  throw new Error(
    'PDF password protection requires the Noxis Desktop app. ' +
    'In browser, use your system PDF printer to "Print to PDF" ' +
    'and set a password there, or use Adobe Acrobat.'
  );
}

/**
 * Applies a text watermark to all pages of a PDF.
 */
export async function watermarkPdf(
  pdfBytes: ArrayBuffer, 
  text: string, 
  opacity: number = 0.15
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBytes);
  const pages = pdf.getPages();
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);

  for (const page of pages) {
    const { width, height } = page.getSize();
    
    // Draw centered diagonal watermark
    page.drawText(text, {
      x: width / 2 - (text.length * 10),
      y: height / 2,
      size: 50,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity,
      rotate: degrees(45),
    });
  }

  return await pdf.save();
}
