/**
 * Noxis Hub — Client-Side Offline PDF to Images & Multi-Page ZIP Exporter
 * Zero external CDN script requests. 100% local browser execution.
 */

import JSZip from 'jszip';

/**
 * Renders each page of a PDF file to high-resolution PNG or JPG blobs.
 * If multiple pages exist, bundles them into a ZIP file for instant downloading.
 */
export async function convertPdfToImages(
  file: File,
  format: 'png' | 'jpeg' = 'png',
  scale: number = 2.0, // 300 DPI high resolution
  onProgress?: (p: number, status?: string) => void
): Promise<{ name: string; blob: Blob }[]> {
  const arrayBuffer = await file.arrayBuffer();
  const baseName = file.name.replace(/\.pdf$/i, '');
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const ext = format === 'jpeg' ? 'jpg' : 'png';

  if (onProgress) onProgress(10, 'Initializing PDF renderer...');

  let pdfjsLib: any = (typeof window !== 'undefined' ? (window as any).pdfjsLib : null);
  if (!pdfjsLib && typeof window !== 'undefined') {
    try {
      // Dynamic import safely
      pdfjsLib = await import(/* webpackIgnore: true */ 'pdfjs-dist' as any);
    } catch {
      pdfjsLib = (window as any).pdfjsLib;
    }
  }

  if (!pdfjsLib) {
    throw new Error('PDF rendering engine unavailable. Ensure pdfjs-dist is loaded.');
  }

  // Disable external worker fetch if offline
  if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    isEvalSupported: false,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const imageResults: { name: string; blob: Blob }[] = [];

  for (let i = 1; i <= numPages; i++) {
    if (onProgress) onProgress(Math.floor(10 + (i / numPages) * 75), `Rendering page ${i} of ${numPages}...`);

    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to obtain Canvas context');

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        b => (b ? resolve(b) : reject(new Error(`Failed to export page ${i} image`))),
        mimeType,
        0.95
      );
    });

    imageResults.push({ name: `${baseName}_page_${i}.${ext}`, blob });
  }

  if (onProgress) onProgress(90, 'Packaging output images...');

  // If single page, return image blob directly
  if (imageResults.length === 1) {
    if (onProgress) onProgress(100, 'Complete!');
    return imageResults;
  }

  // If multi-page, create a ZIP file for 1-click batch download!
  const zip = new JSZip();
  const folder = zip.folder(`${baseName}_images`);

  for (const img of imageResults) {
    folder?.file(img.name, img.blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  if (onProgress) onProgress(100, 'Complete!');
  return [{ name: `${baseName}_all_pages_images.zip`, blob: zipBlob }];
}
