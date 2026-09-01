export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getPortalSession } from '@/lib/auth/portal';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /portal/invoices/[id]/pdf
 * Serves a signed PDF URL or a self-rendering printable high-DPI invoice.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const portal = await getPortalSession();
    if (!portal) return new NextResponse('Unauthorized', { status: 401 });

    const admin = createAdminClient();
    const { id: invoiceId } = await params;

    // 1. Verify invoice ownership
    const { data: invoice, error: iError } = await admin
      .from('invoices')
      .select('*, invoice_items(*), parties(name, phone, address), business_profiles(business_name, phone, address, currency)')
      .eq('id', invoiceId)
      .single();

    if (iError || !invoice || invoice.party_id !== portal.partyId) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // 2. Check Supabase Storage for pre-generated PDF
    const bucketName = 'invoices';
    const filePath = `${invoice.business_id}/${invoiceId}.pdf`;

    try {
      const { data: fileExists } = await admin.storage
        .from(bucketName)
        .list(invoice.business_id, {
          search: `${invoiceId}.pdf`
        });

      if (fileExists && fileExists.length > 0) {
        const { data: signedUrlData, error: sError } = await admin.storage
          .from(bucketName)
          .createSignedUrl(filePath, 3600);

        if (!sError && signedUrlData?.signedUrl) {
          return NextResponse.redirect(signedUrlData.signedUrl, 302);
        }
      }
    } catch {
      // Continue to printable invoice rendering
    }

    // 3. Fallback: Immediate high-DPI Printable Invoice View
    const biz = invoice.business_profiles || {};
    const party = invoice.parties || {};
    const items = invoice.invoice_items || [];
    const currency = biz.currency || 'PKR';
    const total = Number(invoice.total || invoice.total_amount || 0);
    const balanceDue = Number(invoice.balance_due != null ? invoice.balance_due : total);

    const itemsRows = items.length > 0
      ? items.map((it: any, idx: number) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #475569;">${idx + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 600; color: #0f172a;">
            ${it.description || it.item_name || 'Product / Service'}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right; color: #334155;">
            ${it.quantity || 1}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right; color: #334155;">
            ${currency} ${Number(it.unit_price || 0).toLocaleString('en-PK')}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right; font-weight: 700; color: #0f172a;">
            ${currency} ${Number(it.total_price || (it.quantity || 1) * (it.unit_price || 0)).toLocaleString('en-PK')}
          </td>
        </tr>
      `).join('')
      : `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #475569;">1</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 600; color: #0f172a;">Sales Invoice ${invoice.invoice_no}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right; color: #334155;">1</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right; color: #334155;">${currency} ${total.toLocaleString('en-PK')}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right; font-weight: 700; color: #0f172a;">${currency} ${total.toLocaleString('en-PK')}</td>
        </tr>
      `;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${invoice.invoice_no}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      margin: 0;
      padding: 24px;
    }
    .no-print {
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #0284c7;
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 6px;
      text-decoration: none;
      font-size: 13px;
      font-weight: 700;
      border: none;
      cursor: pointer;
    }
    .btn-secondary {
      background: #e2e8f0;
      color: #334155;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    table { width: 100%; border-collapse: collapse; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .no-print { display: none; }
      .invoice-card { border: none; box-shadow: none; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <a href="javascript:history.back()" class="btn btn-secondary">← Back</a>
    <button onclick="window.print()" class="btn">🖨️ Print / Save as PDF</button>
  </div>

  <div class="invoice-card">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px;">
      <div>
        <h1 style="margin: 0; font-size: 22px; font-weight: 900; text-transform: uppercase; color: #0f172a;">
          ${biz.business_name || 'Noxis Business'}
        </h1>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">
          ${biz.address ? biz.address + ' • ' : ''}${biz.phone || ''}
        </p>
      </div>
      <div style="text-align: right;">
        <span style="display: inline-block; background: #0284c7; color: #fff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 4px;">
          Sales Invoice
        </span>
        <h2 style="margin: 6px 0 0 0; font-size: 18px; font-family: monospace; font-weight: 700; color: #0f172a;">
          #${invoice.invoice_no}
        </h2>
      </div>
    </div>

    <!-- Details Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px;">
      <div>
        <p style="margin: 0; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 1px;">Billed To</p>
        <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 700; color: #0f172a;">${party.name || 'Client'}</p>
        ${party.phone ? `<p style="margin: 2px 0 0 0; font-size: 12px; color: #475569;">Phone: ${party.phone}</p>` : ''}
        ${party.address ? `<p style="margin: 2px 0 0 0; font-size: 12px; color: #475569;">${party.address}</p>` : ''}
      </div>
      <div style="text-align: right;">
        <p style="margin: 0; font-size: 11px; color: #475569;"><strong>Issue Date:</strong> ${invoice.issue_date || '—'}</p>
        ${invoice.due_date ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #475569;"><strong>Due Date:</strong> ${invoice.due_date}</p>` : ''}
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #475569;"><strong>Status:</strong> <span style="text-transform: uppercase; font-weight: 700; color: ${invoice.status === 'paid' ? '#16a34a' : '#ea580c'}">${invoice.status || 'Issued'}</span></p>
      </div>
    </div>

    <!-- Items Table -->
    <table style="margin-bottom: 28px;">
      <thead>
        <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
          <th style="padding: 10px; text-align: left; font-size: 10px; text-transform: uppercase; font-weight: 800; color: #475569;">#</th>
          <th style="padding: 10px; text-align: left; font-size: 10px; text-transform: uppercase; font-weight: 800; color: #475569;">Description</th>
          <th style="padding: 10px; text-align: right; font-size: 10px; text-transform: uppercase; font-weight: 800; color: #475569;">Qty</th>
          <th style="padding: 10px; text-align: right; font-size: 10px; text-transform: uppercase; font-weight: 800; color: #475569;">Unit Price</th>
          <th style="padding: 10px; text-align: right; font-size: 10px; text-transform: uppercase; font-weight: 800; color: #475569;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- Totals -->
    <div style="display: flex; justify-content: flex-end;">
      <div style="width: 280px; border-top: 1px solid #cbd5e1; padding-top: 12px; font-size: 13px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #475569;">
          <span>Subtotal:</span>
          <span>${currency} ${Number(invoice.subtotal || total).toLocaleString('en-PK')}</span>
        </div>
        ${Number(invoice.discount_amount || 0) > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #16a34a;">
            <span>Discount:</span>
            <span>-${currency} ${Number(invoice.discount_amount).toLocaleString('en-PK')}</span>
          </div>
        ` : ''}
        ${Number(invoice.tax_amount || 0) > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #475569;">
            <span>Tax:</span>
            <span>${currency} ${Number(invoice.tax_amount).toLocaleString('en-PK')}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 2px solid #0f172a; font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
          <span>Grand Total:</span>
          <span>${currency} ${total.toLocaleString('en-PK')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; color: ${balanceDue > 0 ? '#b91c1c' : '#16a34a'};">
          <span>Balance Due:</span>
          <span>${currency} ${balanceDue.toLocaleString('en-PK')}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; text-align: center; font-size: 11px; color: #94a3b8;">
      Thank you for your business • Generated via Noxis Hub Client Portal
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    console.error('[PortalInvoicePDF] Error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
