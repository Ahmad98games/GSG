import { createClient } from '@/lib/supabase/client';

/**
 * Noxis v13.0 — PDF Generator
 * Creates searchable PDFs by layering OCR text behind the document scan image.
 */
export async function generateSearchablePdf(
  imageDataUrl: string,
  ocrText: string,
  filename: string
): Promise<Blob> {
  const jsPDF = (await import('jspdf')).default;
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // 1. Add image to PDF (visible layer)
  // Dimensions for A4 at 72dpi: 210 x 297 mm
  pdf.addImage(
    imageDataUrl,
    'JPEG',
    0, 0,
    210, 297,
    undefined,
    'FAST'
  );
  
  // 2. Add invisible text layer (searchable)
  // Setting text color to transparent or matching background (white)
  // making it effectively invisible but selectable.
  pdf.setTextColor(255, 255, 255); 
  pdf.setFontSize(8);
  
  const lines = ocrText.split('\n');
  let y = 10;
  for (const line of lines) {
    if (y > 280) break;
    // We place text roughly where it might be, 
    // or just sequentially for searchability index.
    pdf.text(line.trim(), 5, y);
    y += 5;
  }
  
  return pdf.output('blob');
}

/**
 * Uploads a generated PDF to Supabase Storage and returns the public/signed URL.
 */
export async function uploadLensPdf(
  blob: Blob,
  businessId: string,
  scanId: string
): Promise<{ path: string; url: string | null }> {
  const supabase = createClient();
  const filePath = `${businessId}/${scanId}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from('lens-scans')
    .upload(filePath, blob, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (uploadError) {
    console.error('[LENS_PDF] Upload failed:', uploadError);
    throw uploadError;
  }

  const { data: signedData, error: urlError } = await supabase.storage
    .from('lens-scans')
    .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 1 week

  return {
    path: filePath,
    url: signedData?.signedUrl || null
  };
}
