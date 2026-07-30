/**
 * Noxis Hub — Client-Side Local-First Image Engine
 * Resizing, cropping, format conversion, background removal, EXIF metadata stripping, and Images-to-PDF binding.
 */

import { PDFDocument } from 'pdf-lib';

export interface ImageResizeOptions {
  width?: number;
  height?: number;
  percentage?: number; // e.g. 50 = 50%
  keepAspectRatio?: boolean;
  format?: 'png' | 'jpeg' | 'webp' | 'ico' | 'bmp';
  quality?: number; // 0.1 to 1.0
}

/**
 * Loads an Image File into an HTMLImageElement safely.
 */
export function loadImageElement(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * 1. Image Resizer & Aspect Ratio Scaling.
 */
export async function resizeImage(
  file: File,
  options: ImageResizeOptions,
  onProgress?: (p: number) => void
): Promise<{ name: string; blob: Blob }> {
  if (onProgress) onProgress(20);
  const img = await loadImageElement(file);
  if (onProgress) onProgress(50);

  let targetWidth = img.naturalWidth;
  let targetHeight = img.naturalHeight;

  if (options.percentage && options.percentage > 0) {
    const scale = options.percentage / 100;
    targetWidth = Math.round(img.naturalWidth * scale);
    targetHeight = Math.round(img.naturalHeight * scale);
  } else if (options.width || options.height) {
    if (options.keepAspectRatio !== false) {
      if (options.width && !options.height) {
        targetWidth = options.width;
        targetHeight = Math.round((img.naturalHeight / img.naturalWidth) * options.width);
      } else if (options.height && !options.width) {
        targetHeight = options.height;
        targetWidth = Math.round((img.naturalWidth / img.naturalHeight) * options.height);
      } else if (options.width && options.height) {
        const scale = Math.min(options.width / img.naturalWidth, options.height / img.naturalHeight);
        targetWidth = Math.round(img.naturalWidth * scale);
        targetHeight = Math.round(img.naturalHeight * scale);
      }
    } else {
      if (options.width) targetWidth = options.width;
      if (options.height) targetHeight = options.height;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create Canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  if (onProgress) onProgress(80);

  const format = options.format || 'png';
  const mimeType = (format as string) === 'jpeg' || (format as string) === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
  const quality = options.quality ?? 0.92;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error('Canvas export failed'))),
      mimeType,
      quality
    );
  });

  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const ext = format === 'jpeg' ? 'jpg' : format;

  if (onProgress) onProgress(100);
  return { name: `${baseName}_resized.${ext}`, blob };
}

/**
 * 2. Format Converter (PNG, JPG, WebP, BMP, ICO).
 */
export async function convertImageFormat(
  file: File,
  targetFormat: 'png' | 'jpeg' | 'webp' | 'bmp' | 'ico',
  quality: number = 0.92,
  onProgress?: (p: number) => void
): Promise<{ name: string; blob: Blob }> {
  return resizeImage(file, { format: targetFormat, quality }, onProgress);
}

/**
 * 3. Background Removal / Cleanup (Client-side Canvas Edge & Color Tolerance algorithm).
 * Strips white, light, or corner background colors to transparent PNG.
 */
export async function removeImageBackground(
  file: File,
  tolerance: number = 25, // 0 to 100 color distance
  targetColor: { r: number; g: number; b: number } | 'auto' = 'auto',
  onProgress?: (p: number) => void
): Promise<{ name: string; blob: Blob }> {
  if (onProgress) onProgress(20);
  const img = await loadImageElement(file);
  if (onProgress) onProgress(40);

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create Canvas context');

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Auto detect background color from top-left pixel if auto
  let bgR = 255, bgG = 255, bgB = 255;
  if (targetColor === 'auto') {
    bgR = data[0];
    bgG = data[1];
    bgB = data[2];
  } else {
    bgR = targetColor.r;
    bgG = targetColor.g;
    bgB = targetColor.b;
  }

  const maxDist = (tolerance / 100) * 441.67; // max Euclidean distance in RGB space is sqrt(255^2*3) = 441.67

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
    if (dist <= maxDist) {
      data[i + 3] = 0; // set alpha to transparent
    }
  }

  if (onProgress) onProgress(80);
  ctx.putImageData(imgData, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error('Canvas export failed'))),
      'image/png'
    );
  });

  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  if (onProgress) onProgress(100);
  return { name: `${baseName}_nobg.png`, blob };
}

/**
 * 4. Metadata Cleaner — Strips EXIF metadata (GPS, Device Info, Timestamps).
 */
export async function stripImageMetadata(
  file: File,
  onProgress?: (p: number) => void
): Promise<{ name: string; blob: Blob }> {
  if (onProgress) onProgress(30);
  const img = await loadImageElement(file);
  if (onProgress) onProgress(60);

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create Canvas context');

  ctx.drawImage(img, 0, 0);
  if (onProgress) onProgress(85);

  const format = file.type.includes('png') ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error('Canvas export failed'))),
      format,
      0.95
    );
  });

  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const ext = format === 'image/png' ? 'png' : 'jpg';
  if (onProgress) onProgress(100);
  return { name: `${baseName}_clean.${ext}`, blob };
}

/**
 * 5. Bind Images to PDF.
 */
export async function imagesToPdf(
  files: File[],
  options: { pageSize?: 'A4' | 'LETTER' | 'FIT' } = { pageSize: 'A4' },
  onProgress?: (p: number) => void
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const total = files.length;

  for (let i = 0; i < total; i++) {
    if (onProgress) onProgress(Math.floor((i / total) * 90));
    const file = files[i];
    const arrayBuffer = await file.arrayBuffer();

    let image;
    const nameLower = file.name.toLowerCase();

    if (nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg')) {
      image = await pdfDoc.embedJpg(arrayBuffer);
    } else if (nameLower.endsWith('.png')) {
      image = await pdfDoc.embedPng(arrayBuffer);
    } else {
      // Re-encode via Canvas for WebP / BMP / GIF
      const imgEl = await loadImageElement(file);
      const canvas = document.createElement('canvas');
      canvas.width = imgEl.naturalWidth;
      canvas.height = imgEl.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(imgEl, 0, 0);
      const pngBlob = await new Promise<Blob>((res) => canvas.toBlob(b => res(b!), 'image/png'));
      const pngBuffer = await pngBlob.arrayBuffer();
      image = await pdfDoc.embedPng(pngBuffer);
    }

    const imgDims = image.scale(1);
    let pageW = imgDims.width;
    let pageH = imgDims.height;

    if (options.pageSize === 'A4') {
      pageW = 595.28;
      pageH = 841.89;
    } else if (options.pageSize === 'LETTER') {
      pageW = 612;
      pageH = 792;
    }

    const page = pdfDoc.addPage([pageW, pageH]);
    const scale = Math.min(pageW / imgDims.width, pageH / imgDims.height);
    const finalW = imgDims.width * scale;
    const finalH = imgDims.height * scale;

    page.drawImage(image, {
      x: (pageW - finalW) / 2,
      y: (pageH - finalH) / 2,
      width: finalW,
      height: finalH,
    });
  }

  if (onProgress) onProgress(95);
  const bytes = await pdfDoc.save();
  if (onProgress) onProgress(100);
  return bytes;
}
