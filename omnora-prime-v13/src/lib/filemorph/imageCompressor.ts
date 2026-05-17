
/**
 * Local Image Compressor Logic
 * Uses Electron IPC for heavy lifting (sharp) with Canvas fallback for web.
 */

export interface CompressionOptions {
  quality: number;
  format: 'original' | 'jpeg' | 'png' | 'webp';
}

export interface CompressionResult {
  name: string;
  data: string; // base64
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
}

export async function compressImages(
  files: { name: string; data: string }[],
  options: CompressionOptions
): Promise<CompressionResult[]> {
  // Try Electron IPC first
  const win = window as unknown as { electron?: { fileMorph: { compressImages: (f: any[]) => Promise<any[]> } } };
  if (typeof window !== 'undefined' && win.electron?.fileMorph) {
    const results = await win.electron.fileMorph.compressImages(
      files.map(f => ({ ...f, quality: options.quality }))
    );
    return results.map((r: { originalSize: number; compressedSize: number; name: string; data: string }) => ({
      ...r,
      savedPercent: Math.round(((r.originalSize - r.compressedSize) / r.originalSize) * 100)
    }));
  }

  // Fallback to Canvas API (Web)
  const results: CompressionResult[] = [];
  for (const file of files) {
    const compressedDataUrl = await compressImageCanvas(file.data, options.quality, options.format);
    const base64Data = compressedDataUrl.split(',')[1];
    const compressedSize = Math.round((base64Data.length * 3) / 4);
    const originalSize = Math.round((file.data.length * 3) / 4);
    
    results.push({
      name: file.name.replace(/\.[^.]+$/, `.${options.format === 'original' ? 'jpg' : options.format}`),
      data: base64Data,
      originalSize,
      compressedSize,
      savedPercent: Math.round(((originalSize - compressedSize) / originalSize) * 100)
    });
  }
  return results;
}

async function compressImageCanvas(
  base64Data: string,
  quality: number,
  format: string
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      
      const outputFormat = format === 'original' ? 'image/jpeg' : `image/${format}`;
      resolve(canvas.toDataURL(outputFormat, quality / 100));
    };
    img.src = base64Data.startsWith('data:') ? base64Data : `data:image/jpeg;base64,${base64Data}`;
  });
}
