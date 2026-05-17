
/**
 * HEIC to JPG Converter
 * Uses Electron IPC for native conversion.
 */

export interface ConversionResult {
  name: string;
  data: string; // base64
  size: number;
}

export async function convertHeicFiles(
  files: { name: string; data: string }[],
  quality: number = 90
): Promise<ConversionResult[]> {
  if (typeof window !== 'undefined' && (window as any).electron?.fileMorph) {
    return await (window as any).electron.fileMorph.convertHeic(
      files.map(f => ({ ...f, quality }))
    );
  }

  // Web fallback would require a large WASM library like libheif-js
  throw new Error("HEIC conversion is only supported in the Noxis Desktop App.");
}
