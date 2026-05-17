
/**
 * Converts images between formats using the browser's Canvas API.
 * Supports JPG, PNG, WebP.
 */
export async function convertImageFormat(
  file: File,
  targetFormat: 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<{ name: string; data: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error("Failed to get canvas context"));
      
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL(targetFormat, 0.92);
      const base64 = dataUrl.split(',')[1];
      const ext = targetFormat.split('/')[1].replace('jpeg', 'jpg');
      const newName = file.name.replace(/\.[^/.]+$/, "") + "." + ext;
      
      resolve({ name: newName, data: base64 });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export async function convertBatchFormats(
  files: File[],
  targetFormat: 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<{ name: string; data: string }[]> {
  return Promise.all(files.map(f => convertImageFormat(f, targetFormat)));
}
