import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zgxmvwxzjmpmesqliwxl.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy';
  return createClient(url, key);
}

// Global in-memory cache of recent plan ended alerts for fast dashboard polling/streaming
export interface PlanEndedAlert {
  id: string;
  licenseKey?: string | null;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  businessId?: string | null;
  hwid?: string | null;
  tier: string;
  billingCycle: string;
  totalTimespanDays: number;
  activatedAt?: number | null;
  expiresAt?: number | null;
  deactivatedAt: number;
  message: string;
}

const recentAlerts: PlanEndedAlert[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      licenseKey,
      customerName = 'Unknown User',
      customerEmail,
      customerPhone,
      businessId,
      hwid,
      tier = 'lite',
      billingCycle = 'monthly',
      totalTimespanDays = 30,
      activatedAt,
      expiresAt,
      deactivatedAt = Date.now(),
      message,
    } = body;

    const alertId = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const fullMessage = message || `Software plan ended for ${customerName} (${tier.toUpperCase()} · ${billingCycle}). Timespan: ${totalTimespanDays} days. Deactivated automatically.`;

    const alertRecord: PlanEndedAlert = {
      id: alertId,
      licenseKey,
      customerName,
      customerEmail,
      customerPhone,
      businessId,
      hwid,
      tier,
      billingCycle,
      totalTimespanDays,
      activatedAt,
      expiresAt,
      deactivatedAt,
      message: fullMessage,
    };

    // Keep top 100 in memory
    recentAlerts.unshift(alertRecord);
    if (recentAlerts.length > 100) {
      recentAlerts.pop();
    }

    console.log(`[License Intelligence] 🚨 PLAN ENDED ALERT: ${fullMessage}`);

    // Persist to Supabase if configured
    try {
      const supabase = getSupabase();
      
      // 1. Log to license_activation_log
      await supabase.from('license_activation_log').insert({
        key_attempted: licenseKey || 'PLAN_ENDED_EVENT',
        event: 'plan_ended',
        machine_info: {
          hwid,
          customerName,
          customerEmail,
          customerPhone,
          tier,
          billingCycle,
          totalTimespanDays,
          deactivatedAt,
        },
        created_at: new Date(deactivatedAt).toISOString(),
      });

      // 2. If licenseKey exists, update license status
      if (licenseKey) {
        await supabase
          .from('licenses')
          .update({
            is_deactivated: true,
            notes: `Auto-deactivated on plan completion: ${billingCycle} ${tier} (${totalTimespanDays}d) on ${new Date().toISOString()}`,
          })
          .eq('license_key', licenseKey);
      }
    } catch (dbErr: any) {
      console.warn('[License Intelligence] Supabase log warning:', dbErr.message);
    }

    return NextResponse.json({
      success: true,
      alertId,
      notifiedAt: deactivatedAt,
      message: 'Plan completion received and admin notified successfully.',
    });
  } catch (err: any) {
    console.error('[License API] Failed to record plan expiry notification:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET endpoint for admin dashboard to retrieve recent plan-ended alerts
export async function GET() {
  try {
    const supabase = getSupabase();
    const { data: dbLogs } = await supabase
      .from('license_activation_log')
      .select('*')
      .eq('event', 'plan_ended')
      .order('created_at', { ascending: false })
      .limit(30);

    const merged = [...recentAlerts];
    if (dbLogs) {
      for (const log of dbLogs) {
        const info = log.machine_info || {};
        if (!merged.some(a => a.id === String(log.id) || (a.licenseKey && a.licenseKey === log.key_attempted))) {
          merged.push({
            id: String(log.id),
            licenseKey: log.key_attempted,
            customerName: info.customerName || 'Customer',
            customerEmail: info.customerEmail,
            customerPhone: info.customerPhone,
            businessId: info.businessId,
            hwid: info.hwid,
            tier: info.tier || 'pro',
            billingCycle: info.billingCycle || 'monthly',
            totalTimespanDays: info.totalTimespanDays || 30,
            deactivatedAt: new Date(log.created_at).getTime(),
            message: `User plan ended: ${info.customerName || 'Customer'} (${info.tier || 'pro'})`,
          });
        }
      }
    }

    return NextResponse.json({
      alerts: merged.slice(0, 30),
      totalCount: merged.length,
    });
  } catch {
    return NextResponse.json({ alerts: recentAlerts.slice(0, 30), totalCount: recentAlerts.length });
  }
}
