import { NextRequest, NextResponse } from 'next/server';
import { getPortalSession } from '@/lib/auth/portal';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /portal/invoices/[id]/pdf
 * Serves a signed PDF URL for a specific invoice after verifying ownership.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const portal = await getPortalSession();
  if (!portal) return new NextResponse('Unauthorized', { status: 401 });

  const admin = createAdminClient();
  const { id: invoiceId } = await params;

  // 1. Verify invoice ownership
  const { data: invoice, error: iError } = await admin
    .from('invoices')
    .select('party_id, business_id, invoice_no')
    .eq('id', invoiceId)
    .single();

  if (iError || !invoice || invoice.party_id !== portal.partyId) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 2. Check Supabase Storage for pre-generated PDF
  const bucketName = 'invoices';
  const filePath = `${invoice.business_id}/${invoiceId}.pdf`;

  const { data: fileExists } = await admin.storage
    .from(bucketName)
    .list(invoice.business_id, {
      search: `${invoiceId}.pdf`
    });

  if (fileExists && fileExists.length > 0) {
    // 3. Return Signed URL (1 hour expiry)
    const { data: signedUrlData, error: sError } = await admin.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600);

    if (sError) return new NextResponse('Storage Error', { status: 500 });

    return NextResponse.redirect(signedUrlData.signedUrl, 302);
  }

  // 4. Trigger PDF Generation via Puppeteer pipeline (Simulation)
  // In a real implementation, this would invoke a Supabase Edge Function or 
  // a specialized microservice that uses Puppeteer to render the invoice HTML to PDF.
  // We'll simulate a 202 Accepted response if the generation is triggered.
  
  // Simulation: Triggering background job...
  console.log(`[PDF] Triggering generation for ${invoiceId} (Business: ${invoice.business_id})`);

  return new NextResponse('PDF generation in progress. Please retry in 10 seconds.', {
    status: 202,
    headers: {
      'Retry-After': '10'
    }
  });
}
