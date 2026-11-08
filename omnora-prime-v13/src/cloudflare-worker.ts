import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = 'b90a671a7d91009c9f0dd8e690f0c446';
const R2_ACCESS_KEY_ID = '55bc954863afa10f8b64441d1068bffc';
const R2_SECRET_ACCESS_KEY = '24dcd73108b450b53eb12e2a0152a610f135cea14c60f114c69b89a088bc680e';
const R2_BUCKET_NAME = 'noxishub';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function generateDownloadUrl(fileName = 'Noxis Setup 13.0.1.exe', expiresIn = 900) {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileName,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

function generateLicenseKey(tier: string): string {
  const t = tier.toUpperCase();
  const prefix = t.startsWith('ELIT') ? 'ELIT' : t.startsWith('LITE') ? 'LITE' : 'PROP';
  const seg = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let res = '';
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };
  return `${prefix}-${seg()}-${seg()}-${seg()}`;
}

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // 0. Electron Auto-Updater & Telemetry Endpoint (Direct Edge Proxy with Full HTTP Range Support)
    if (url.pathname.startsWith('/updates/')) {
      const publicR2Url = `https://pub-8c464d0d92ff44abbf70c58c362ad258.r2.dev${url.pathname}`;
      try {
        const r2Resp = await fetch(publicR2Url, {
          method: request.method,
          headers: request.headers,
        });

        // Clone response headers and enforce CORS & Cache-Control
        const newHeaders = new Headers(r2Resp.headers);
        newHeaders.set('Access-Control-Allow-Origin', '*');
        newHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        newHeaders.set('Access-Control-Allow-Headers', '*');
        newHeaders.set('Accept-Ranges', 'bytes');
        newHeaders.set('Cache-Control', 'no-cache');

        return new Response(r2Resp.body, {
          status: r2Resp.status,
          statusText: r2Resp.statusText,
          headers: newHeaders,
        });
      } catch (err: any) {
        return new Response('Update streaming error: ' + (err?.message || ''), { status: 502 });
      }
    }

    // 1. API: Instant Software Download (Direct CDN Delivery for v14.0.35)
    if (
      url.pathname === '/api/download-software' ||
      url.pathname.startsWith('/api/download-software') ||
      url.pathname === '/api/download' ||
      url.pathname.startsWith('/api/download') ||
      url.pathname.startsWith('/download/stable')
    ) {
      try {
        const format = url.searchParams.get('format');
        const isZip = format === 'zip' || url.searchParams.get('zip') === 'true';
        const targetFile = isZip ? 'Noxis-Setup-14.0.35.zip' : 'Noxis Hub Setup 14.0.35.exe';
        const downloadUrl = `https://pub-8c464d0d92ff44abbf70c58c362ad258.r2.dev/updates/stable/${encodeURIComponent(targetFile)}`;
        const redirect = url.searchParams.get('redirect') === 'true' || url.pathname.startsWith('/download/stable') || isZip;

        if (redirect) {
          return Response.redirect(downloadUrl, 302);
        }

        return new Response(JSON.stringify({
          success: true,
          downloadUrl,
          version: '14.0.35',
          fileName: targetFile,
          tier: 'TRIAL_ELITE',
          expiresInSeconds: 3600,
          timestamp: new Date().toISOString()
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || 'Failed to generate download' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 1.5. API: Website Free Trial Download Lead
    if (url.pathname === '/api/download-lead' && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { fullName = 'Trial User', phone = '', businessName = '', city = 'Pakistan', platform = 'windows' } = body;

        let cleanPhone = String(phone).trim().replace(/[\s-]/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = '92' + cleanPhone.slice(1);
        else if (cleanPhone.startsWith('+')) cleanPhone = cleanPhone.slice(1);

        const bizName = (businessName && businessName.trim()) ? businessName.trim() : `${fullName.trim()}'s Business`;
        const leadKey = `DL-${cleanPhone.slice(-6) || 'TRIAL'}-TRIAL`;
        const displayName = `${fullName.trim()} (${bizName})`;
        const trialExpiry = new Date();
        trialExpiry.setDate(trialExpiry.getDate() + 14);

        const supabaseUrl = 'https://zgxmvwxzjmpmesqliwxl.supabase.co';
        const supabaseKey = 'sb_publishable_cGJQMAam_R4JU3X4IEIrkQ_EPeSsQIt';

        const leadPayload = {
          license_key: leadKey,
          tier: 'elite',
          max_devices: 50,
          customer_name: displayName,
          customer_whatsapp: cleanPhone,
          customer_phone: cleanPhone,
          customer_email: null,
          brand_name: bizName,
          city: city || 'Pakistan',
          validity_type: 'trial',
          notes: `Brand: ${bizName} | City: ${city} | Platform: ${platform.toUpperCase()} | HWID: Pending First Run`,
          is_active: true,
          is_deactivated: false,
          is_trial: true,
          expires_at: trialExpiry.toISOString(),
          amount_paid: 0,
          currency: 'PKR',
          months: 1,
          updated_at: new Date().toISOString()
        };

        const res = await fetch(`${supabaseUrl}/rest/v1/licenses?on_conflict=license_key`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=minimal'
          },
          body: JSON.stringify(leadPayload)
        });

        return new Response(JSON.stringify({
          success: true,
          message: 'Lead registered live in Supabase',
          leadKey,
          status: res.status
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (leadErr: any) {
        return new Response(JSON.stringify({ error: leadErr?.message || 'Failed to record lead' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 1.8. API: Device Telemetry & Access Control Sync
    if (url.pathname === '/api/license/sync-device' && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const hwid = (body.hwid || '').trim().toUpperCase();
        if (!hwid) {
          return new Response(JSON.stringify({ error: 'HWID required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const cleanPhone = String(body.phone || '').trim().replace(/[\s-]/g, '');
        const cleanUser = (body.userName || '').trim() || 'Store Owner';
        const cleanBrand = (body.businessName || '').trim() || 'My Business';
        const phoneLast7 = cleanPhone.length >= 7 ? cleanPhone.slice(-7) : '';

        const supabaseUrl = 'https://zgxmvwxzjmpmesqliwxl.supabase.co';
        const supabaseKey = 'sb_publishable_cGJQMAam_R4JU3X4IEIrkQ_EPeSsQIt';

        // Query existing licenses
        const licRes = await fetch(`${supabaseUrl}/rest/v1/licenses?select=*&order=created_at.desc`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        const allLicenses = licRes.ok ? await licRes.json() as any[] : [];

        const existing = (allLicenses || []).find((lic: any) => {
          const licHwid = (lic.hwid || '').trim().toUpperCase();
          const licKey = (lic.license_key || '').trim().toUpperCase();
          const licPhone = String(lic.customer_whatsapp || lic.customer_phone || '').replace(/[\s-]/g, '');
          const notes = (lic.notes || '').toUpperCase();

          if (licHwid && licHwid === hwid) return true;
          if (licKey && licKey === hwid) return true;
          if (notes.includes(hwid)) return true;
          if (phoneLast7 && licPhone && (licPhone === cleanPhone || licPhone.endsWith(phoneLast7))) return true;
          if (cleanBrand && cleanBrand !== 'My Business' && lic.brand_name) {
            if (String(lic.brand_name).trim().toLowerCase() === cleanBrand.toLowerCase() && (!licHwid || licHwid === 'PENDING FIRST RUN')) {
              return true;
            }
          }
          return false;
        });

        if (existing) {
          const isBanned = Boolean(existing.is_deactivated || existing.is_active === false);
          const isTrial = Boolean(existing.is_trial);
          const months = existing.months || 1;
          const billingCycle = isTrial ? 'trial' : (months === 12 ? 'yearly' : months >= 99 ? 'lifetime' : 'monthly');

          // Update latest device HWID
          await fetch(`${supabaseUrl}/rest/v1/licenses?id=eq.${existing.id}`, {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              hwid,
              brand_name: cleanBrand || existing.brand_name || 'Standard Business',
              customer_whatsapp: cleanPhone || existing.customer_whatsapp,
              customer_phone: cleanPhone || existing.customer_phone,
              updated_at: new Date().toISOString()
            })
          });

          return new Response(JSON.stringify({
            success: true,
            isBanned,
            status: isBanned ? 'banned' : (isTrial ? 'trial' : 'active'),
            tier: existing.tier || 'elite',
            isTrial,
            months,
            billingCycle,
            licenseKey: existing.license_key,
            expiresAt: existing.expires_at,
            hwid
          }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        // Auto-register new workstation
        const trialExpires = new Date();
        trialExpires.setDate(trialExpires.getDate() + 14);
        const newKey = `HWID-${hwid.slice(-8)}`;

        await fetch(`${supabaseUrl}/rest/v1/licenses`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            license_key: newKey,
            tier: 'elite',
            max_devices: 50,
            customer_name: cleanBrand !== 'My Business' ? `${cleanUser} (${cleanBrand})` : cleanUser,
            customer_whatsapp: cleanPhone || null,
            customer_phone: cleanPhone || null,
            customer_email: null,
            brand_name: cleanBrand,
            hwid,
            validity_type: 'trial',
            is_active: true,
            is_deactivated: false,
            is_trial: true,
            expires_at: trialExpires.toISOString(),
            amount_paid: 0,
            currency: 'PKR',
            months: 1,
            created_at: new Date().toISOString()
          })
        });

        return new Response(JSON.stringify({
          success: true,
          isBanned: false,
          status: 'trial',
          tier: 'elite',
          licenseKey: newKey,
          expiresAt: trialExpires.toISOString(),
          hwid
        }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (syncErr: any) {
        return new Response(JSON.stringify({ error: syncErr?.message || 'Sync failed' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // 2. API: License Issue (Instant Checkout)
    if (url.pathname === '/api/license/issue' && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const tier = (body.tier || 'PRO').toUpperCase();
        const licenseKey = generateLicenseKey(tier);
        const hwid = (body.hwid || 'BROWSER-TRIAL-DEVICE').toUpperCase();
        const businessName = body.businessName || body.business_name || 'Valued Business';

        // Optionally record in Supabase REST
        const supabaseUrl = 'https://zgxmvwxzjmpmesqliwxl.supabase.co';
        const supabaseKey = 'sb_publishable_cGJQMAam_R4JU3X4IEIrkQ_EPeSsQIt';

        try {
          await fetch(`${supabaseUrl}/rest/v1/licenses`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              license_key: licenseKey,
              tier: tier,
              plan: tier,
              hwid: hwid,
              status: 'ACTIVE',
              is_deactivated: false,
              created_at: new Date().toISOString()
            })
          });
        } catch {}

        return new Response(JSON.stringify({
          success: true,
          licenseKey,
          tier,
          machineHWID: hwid,
          businessName,
          instructions: 'Install Noxis Hub -> Open Settings -> Paste License Key'
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 3. Fallback: Static Assets
    return env.ASSETS.fetch(request);
  }
};
