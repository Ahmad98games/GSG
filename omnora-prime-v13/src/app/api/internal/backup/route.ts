import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyBusinessOwnership } from '@/lib/security/authHelpers';

export const dynamic = 'force-dynamic';

/**
 * Server-side backup API route
 * Uses service role to fetch all business data for backup/restore
 * 
 * GET  — Generate backup JSON for a business
 * POST — Restore from backup JSON
 */

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

const BACKUP_TABLES = [
  'business_profiles',
  'skus',
  'parties',
  'karigars',
  'invoices',
  'ledger_entries',
  'karigar_production_logs',
  'attendance_logs',
  'purchase_orders',
  'karigar_advances',
  'recurring_invoices',
  'supplier_payments',
  'sku_batches',
  'staff_users',
] as const;

// Fields to strip from business_profiles for security
const SENSITIVE_FIELDS = ['role_pin_hash', 'user_id'];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('business_id');

    if (!businessId) {
      return NextResponse.json({ error: 'business_id required' }, { status: 400 });
    }

    const access = await verifyBusinessOwnership(businessId);
    if (!access) {
      return NextResponse.json({ error: 'Unauthorized or access denied to this business' }, { status: 403 });
    }

    const supabase = getAdminClient();
    const backup: Record<string, any[]> = {};
    let totalRecords = 0;
    let earliestDate: string | null = null;

    for (const table of BACKUP_TABLES) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('business_id', businessId);

      if (error) {
        console.warn(`[Backup] Skipping ${table}: ${error.message}`);
        backup[table] = [];
        continue;
      }

      let records = data || [];

      // Strip sensitive fields from business_profiles
      if (table === 'business_profiles') {
        records = records.map((r: any) => {
          const clean = { ...r };
          SENSITIVE_FIELDS.forEach(f => delete clean[f]);
          return clean;
        });
      }

      backup[table] = records;
      totalRecords += records.length;

      // Track earliest record date
      for (const record of records) {
        const dateField = record.created_at || record.log_date || record.date;
        if (dateField && (!earliestDate || dateField < earliestDate)) {
          earliestDate = dateField;
        }
      }
    }

    return NextResponse.json({
      backup,
      metadata: {
        generated_at: new Date().toISOString(),
        business_id: businessId,
        total_records: totalRecords,
        earliest_date: earliestDate,
        tables_included: BACKUP_TABLES.length,
        version: '13.0.0',
      }
    });
  } catch (err: any) {
    console.error('[Backup API] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { backup, business_id } = await req.json();

    if (!backup || !business_id) {
      return NextResponse.json({ error: 'backup and business_id required' }, { status: 400 });
    }

    const access = await verifyBusinessOwnership(business_id);
    if (!access) {
      return NextResponse.json({ error: 'Unauthorized or access denied to this business' }, { status: 403 });
    }

    const supabase = getAdminClient();
    const results: Record<string, { inserted: number; skipped: number; errors: string[] }> = {};

    for (const table of BACKUP_TABLES) {
      const records = backup[table];
      if (!records || records.length === 0) {
        results[table] = { inserted: 0, skipped: 0, errors: [] };
        continue;
      }

      let inserted = 0;
      let skipped = 0;
      const errors: string[] = [];

      // Process in chunks to avoid timeout
      const CHUNK_SIZE = 50;
      for (let i = 0; i < records.length; i += CHUNK_SIZE) {
        const chunk = records.slice(i, i + CHUNK_SIZE).map((r: any) => ({
          ...r,
          business_id, // Ensure correct business_id
        }));

        const { data, error } = await supabase
          .from(table)
          .upsert(chunk, { 
            onConflict: 'id',
            ignoreDuplicates: true 
          })
          .select('id');

        if (error) {
          errors.push(`Chunk ${Math.floor(i / CHUNK_SIZE)}: ${error.message}`);
          skipped += chunk.length;
        } else {
          inserted += data?.length || 0;
          skipped += chunk.length - (data?.length || 0);
        }
      }

      results[table] = { inserted, skipped, errors };
    }

    return NextResponse.json({
      success: true,
      results,
      restored_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Restore API] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
