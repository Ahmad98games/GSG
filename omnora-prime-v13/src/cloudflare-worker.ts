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

    // 0. Electron Auto-Updater Endpoint
    if (url.pathname.startsWith('/updates/')) {
      const key = url.pathname.replace(/^\//, ''); // e.g. "updates/stable/stable.yml"
      if (key.endsWith('.yml') || key.endsWith('.yaml') || key.endsWith('.json')) {
        try {
          const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
          });
          const res = await r2Client.send(command);
          const body = await res.Body?.transformToString();
          return new Response(body, {
            headers: {
              'Content-Type': 'text/yaml; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'no-cache',
            },
          });
        } catch {
          return new Response('Update manifest not found', { status: 404 });
        }
      }
      try {
        const downloadUrl = await generateDownloadUrl(key, 3600);
        return Response.redirect(downloadUrl, 302);
      } catch {
        return new Response('File not found', { status: 404 });
      }
    }

    // 1. API: Download Software
    if (
      url.pathname === '/api/download-software' ||
      url.pathname.startsWith('/api/download-software') ||
      url.pathname === '/api/download' ||
      url.pathname.startsWith('/api/download') ||
      url.pathname.startsWith('/download/stable')
    ) {
      try {
        const fileParam = url.searchParams.get('fileName') || 'Noxis Setup 13.0.1.exe';
        const downloadUrl = await generateDownloadUrl(fileParam, 900);
        const redirect = url.searchParams.get('redirect') === 'true' || url.pathname.startsWith('/download/stable');

        if (redirect) {
          return Response.redirect(downloadUrl, 302);
        }

        return new Response(JSON.stringify({
          success: true,
          downloadUrl,
          tier: 'TRIAL_ELITE',
          expiresInSeconds: 900,
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
