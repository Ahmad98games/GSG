/**
 * PDF ↔ Image converters
 * All processing happens locally in the browser — no server calls.
 */

async function loadPdfJs(): Promise<any> {
  if (typeof window === 'undefined') throw new Error('Browser only');

  const PDFJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  if ((window as any).pdfjsLib) {
    (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
    return (window as any).pdfjsLib;
  }

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

/** Render each page of a PDF as a PNG or JPG image Blob */
export async function pdfToImages(
  file: File,
  format: 'png' | 'jpg',
  onProgress: (p: number) => void
): Promise<{ name: string; blob: Blob }[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await loadPdfJs();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const baseName = file.name.replace(/\.pdf$/i, '');
  const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
  const images: { name: string; blob: Blob }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress(Math.floor((i / pdf.numPages) * 90));

    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // ~144 dpi

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        b => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
        mimeType,
        0.92
      );
    });

    images.push({ name: `${baseName}_page${i}.${format}`, blob });
  }

  onProgress(100);
  return images;
}

/** Combine multiple image files into a single PDF using pdf-lib */
export async function imagesToPdf(
  files: File[],
  onProgress: (p: number) => void
): Promise<Blob> {
  const { PDFDocument } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    onProgress(Math.floor((i / files.length) * 90));
    const file = files[i];
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const name = file.name.toLowerCase();

    let image;
    if (name.endsWith('.jpg') || name.endsWith('.jpeg')) {
      image = await pdfDoc.embedJpg(bytes);
    } else if (name.endsWith('.png')) {
      image = await pdfDoc.embedPng(bytes);
    } else {
      // Convert via canvas first
      const blob = new Blob([bytes], { type: file.type });
      const url = URL.createObjectURL(blob);
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      const pngBytes = await new Promise<Uint8Array>(resolve => {
        canvas.toBlob(b => {
          b!.arrayBuffer().then(ab => resolve(new Uint8Array(ab)));
        }, 'image/png');
      });
      URL.revokeObjectURL(url);
      image = await pdfDoc.embedPng(pngBytes);
    }

    const { width, height } = image.scale(1);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });
  }

  onProgress(100);
  const bytes = await pdfDoc.save();
  return new Blob([bytes as any], { type: 'application/pdf' });
}

