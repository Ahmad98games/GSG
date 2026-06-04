/**
 * PDF OCR — extract text from scanned / image-based PDFs using Tesseract.js
 * All processing happens locally in the browser — no server calls.
 */

export async function ocrPdf(
  file: File,
  language: 'eng' | 'urd' | 'ara',
  onProgress: (p: number, status: string) => void
): Promise<string> {
  onProgress(5, 'Loading OCR engine...');

  const { createWorker } = await import('tesseract.js');

  const worker = await createWorker(language, 1, {
    logger: (m: any) => {
      if (m.status === 'recognizing text') {
        onProgress(
          Math.floor(10 + m.progress * 80),
          'Reading text from image...'
        );
      }
    },
  });

  onProgress(10, 'Converting PDF pages to images...');

  const { pdfToImages } = await import('./pdfToImage');
  const images = await pdfToImages(file, 'png', () => {});

  let fullText = '';

  for (let i = 0; i < images.length; i++) {
    onProgress(
      10 + Math.floor((i / images.length) * 80),
      `Reading page ${i + 1} of ${images.length}...`
    );
    const url = URL.createObjectURL(images[i].blob);
    const { data } = await worker.recognize(url);
    fullText += `--- Page ${i + 1} ---\n${data.text}\n\n`;
    URL.revokeObjectURL(url);
  }

  await worker.terminate();
  onProgress(100, 'Done');
  return fullText;
}
