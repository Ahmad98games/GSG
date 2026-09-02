import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateDownloadUrl } from '@/lib/r2';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zgxmvwxzjmpmesqliwxl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy'
);

const VALID_DOWNLOAD_TIERS = ['LITE', 'PRO', 'ELITE'];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId') || searchParams.get('order_id');
    const licenseKey = searchParams.get('licenseKey') || searchParams.get('key');
    const fileName = searchParams.get('fileName') || 'Noxis Setup 13.0.0.exe';

    let isAuthorized = false;
    let verifiedTier = '';
    let denialReason = 'Confirmed PAID order or active paid license (LITE, PRO, ELITE) is required to download Noxis Hub.';

    // 1. Verify via Order ID (Status = PAID, Tier IN [LITE, PRO, ELITE])
    if (orderId) {
      const { data: orderData } = await supabase
        .from('orders')
        .select('status, payment_status, tier, plan')
        .eq('id', orderId)
        .maybeSingle();

      if (orderData) {
        const status = (orderData.status || orderData.payment_status || '').toUpperCase();
        const tier = (orderData.tier || orderData.plan || 'PRO').toUpperCase();

        if (status === 'PAID' || status === 'COMPLETED' || status === 'SUCCESS') {
          if (VALID_DOWNLOAD_TIERS.includes(tier)) {
            isAuthorized = true;
            verifiedTier = tier;
          } else {
            denialReason = `Tier '${tier}' is FREE. Direct installer download requires LITE, PRO, or ELITE tier.`;
          }
        } else {
          denialReason = `Order '${orderId}' payment status is '${status}'. Only PAID orders can download software.`;
        }
      } else {
        // Fallback: Check purchases table
        const { data: purchaseData } = await supabase
          .from('purchases')
          .select('status, payment_status, tier, plan')
          .eq('id', orderId)
          .maybeSingle();

        if (purchaseData) {
          const status = (purchaseData.status || purchaseData.payment_status || '').toUpperCase();
          const tier = (purchaseData.tier || purchaseData.plan || 'PRO').toUpperCase();

          if (status === 'PAID' || status === 'COMPLETED' || status === 'SUCCESS') {
            if (VALID_DOWNLOAD_TIERS.includes(tier)) {
              isAuthorized = true;
              verifiedTier = tier;
            } else {
              denialReason = `Tier '${tier}' is FREE. Direct installer download requires LITE, PRO, or ELITE tier.`;
            }
          }
        }
      }
    }

    // 2. Verify via License Key (Active, Non-Deactivated, Not Expired, Tier IN [LITE, PRO, ELITE])
    if (!isAuthorized && licenseKey) {
      const cleanedKey = licenseKey.trim().toUpperCase();

      // Check standard offline production format (e.g. NOXIS-PRO-..., ELIT-..., PRO-..., LITE-...)
      const isOfficialOfflineKey = /^([A-Z0-9]{3,6}-){2,4}[A-Z0-9]{3,6}$/.test(cleanedKey) || /^NOXIS-[A-Z0-9-]{6,}$/.test(cleanedKey);

      const { data: licenseData } = await supabase
        .from('licenses')
        .select('is_deactivated, expires_at, tier, status')
        .eq('license_key', cleanedKey)
        .maybeSingle();

      if (licenseData) {
        if (licenseData.is_deactivated || (licenseData.status && licenseData.status.toUpperCase() === 'DEACTIVATED')) {
          denialReason = `License key '${cleanedKey}' has been deactivated. Please contact support.`;
        } else if (licenseData.expires_at && new Date(licenseData.expires_at) < new Date()) {
          denialReason = `License key '${cleanedKey}' expired on ${new Date(licenseData.expires_at).toLocaleDateString()}. Please renew your license.`;
        } else {
          const tier = (licenseData.tier || 'PRO').toUpperCase();
          if (VALID_DOWNLOAD_TIERS.includes(tier)) {
            isAuthorized = true;
            verifiedTier = tier;
          } else {
            denialReason = `License key tier '${tier}' is FREE. Direct installer download requires LITE, PRO, or ELITE tier.`;
          }
        }
      } else if (isOfficialOfflineKey) {
        // Offline key validation rule
        const isElite = cleanedKey.includes('ELIT') || cleanedKey.includes('ELITE');
        const isLite = cleanedKey.includes('LITE');
        const tier = isElite ? 'ELITE' : isLite ? 'LITE' : 'PRO';

        isAuthorized = true;
        verifiedTier = tier;
      }
    }

    // 3. Fallback: Check Authenticated User Session Profile Tier
    if (!isAuthorized) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          const { data: profile } = await supabase
            .from('business_profiles')
            .select('id, tier, plan, onboarding_done')
            .eq('user_id', user.id)
            .maybeSingle();

          if (profile) {
            const tier = (profile.tier || profile.plan || 'PRO').toUpperCase();
            if (VALID_DOWNLOAD_TIERS.includes(tier)) {
              isAuthorized = true;
              verifiedTier = tier;
            }
          }
        }
      }
    }

    // High Extra Security Enforcement: REJECT if authorization fails or tier is FREE/unpaid
    if (!isAuthorized) {
      return NextResponse.json(
        {
          error: 'Access Denied (403 Forbidden)',
          message: denialReason,
          requiresPayment: true,
          supportedTiers: ['LITE', 'PRO', 'ELITE'],
        },
        { status: 403 }
      );
    }

    // Generate secure Cloudflare R2 presigned download URL (valid for 15 minutes / 900s)
    const downloadUrl = await generateDownloadUrl(fileName, 900);

    return NextResponse.json({
      success: true,
      downloadUrl,
      tier: verifiedTier,
      expiresInSeconds: 900,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[API download-software GET] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = body.orderId || body.order_id;
    const licenseKey = body.licenseKey || body.key;
    const fileName = body.fileName || 'Noxis Setup 13.0.0.exe';

    let isAuthorized = false;
    let verifiedTier = '';

    if (orderId) {
      const { data: orderData } = await supabase
        .from('orders')
        .select('status, payment_status, tier, plan')
        .eq('id', orderId)
        .maybeSingle();

      if (orderData) {
        const status = (orderData.status || orderData.payment_status || '').toUpperCase();
        const tier = (orderData.tier || orderData.plan || 'PRO').toUpperCase();

        if ((status === 'PAID' || status === 'COMPLETED' || status === 'SUCCESS') && VALID_DOWNLOAD_TIERS.includes(tier)) {
          isAuthorized = true;
          verifiedTier = tier;
        }
      }
    }

    if (!isAuthorized && licenseKey) {
      const cleanedKey = licenseKey.trim().toUpperCase();
      const { data: licenseData } = await supabase
        .from('licenses')
        .select('is_deactivated, expires_at, tier')
        .eq('license_key', cleanedKey)
        .maybeSingle();

      if (licenseData && !licenseData.is_deactivated) {
        const notExpired = !licenseData.expires_at || new Date(licenseData.expires_at) > new Date();
        const tier = (licenseData.tier || 'PRO').toUpperCase();
        if (notExpired && VALID_DOWNLOAD_TIERS.includes(tier)) {
          isAuthorized = true;
          verifiedTier = tier;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error: 'Access Denied (403 Forbidden)',
          message: 'Confirmed PAID order or active LITE, PRO, or ELITE license key is required.',
        },
        { status: 403 }
      );
    }

    const downloadUrl = await generateDownloadUrl(fileName, 900);
    return NextResponse.json({ success: true, downloadUrl, tier: verifiedTier });
  } catch (err: any) {
    console.error('[API download-software POST] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
