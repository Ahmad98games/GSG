
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

  // Browser cannot natively decode HEIC/HEIF — show a helpful explanation
  throw new Error(
    'HEIC conversion requires the Noxis Desktop app. ' +
    'In browser: save the photo as JPG from your ' +
    'iPhone (Settings → Camera → Formats → Most ' +
    'Compatible) then upload the JPG instead.'
  );
}
