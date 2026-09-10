import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyBusinessOwnership } from '@/lib/security/authHelpers';
import { db } from '@/lib/db/client';

export const dynamic = 'force-static';

/**
 * Server-side backup API route
 * Fully offline-capable and hybrid cloud aware.
 * Reads from local SQLite first, then complements with Supabase if available.
 * 
 * GET  — Generate backup JSON for a business
 * POST — Restore from backup JSON
 */

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    return createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  } catch {
    return null;
  }
}

function isLocalOrDesktopRequest(req: NextRequest): boolean {
  const host = req.headers.get('host') || '';
  const xForwardedFor = req.headers.get('x-forwarded-for') || '';
  const isLocalhost = 
    host.includes('localhost') || 
    host.includes('127.0.0.1') || 
    xForwardedFor.includes('127.0.0.1') ||
    xForwardedFor.includes('::1');
  const isElectronOrDesktop = 
    Boolean(process.env.ELECTRON_RUN_AS_NODE) ||
    Boolean(process.env.APPDATA && (process.versions as any)?.electron) ||
    Boolean(process.env.ELECTRON_USER_DATA) ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY;

  return isLocalhost || isElectronOrDesktop;
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
    let businessId = searchParams.get('business_id');

    // If business_id is missing or 'undefined', auto-discover from local SQLite
    if (!businessId || businessId === 'undefined' || businessId === 'null') {
      try {
        if (db && (db as any).$client) {
          const profile = (db as any).$client.prepare('SELECT id FROM business_profiles LIMIT 1').get();
          if (profile?.id) {
            businessId = profile.id;
          }
        }
      } catch {}
      if (!businessId) {
        businessId = '00000000-0000-0000-0000-000000000000';
      }
    }

    // Check authorization: allow local/desktop requests, otherwise verify via Supabase
    const isLocal = isLocalOrDesktopRequest(req);
    if (!isLocal) {
      const access = await verifyBusinessOwnership(businessId);
      if (!access) {
        return NextResponse.json({ error: 'Unauthorized or access denied to this business' }, { status: 403 });
      }
    }

    const backup: Record<string, any[]> = {};
    let totalRecords = 0;
    let earliestDate: string | null = null;
    const supabase = getAdminClient();

    for (const table of BACKUP_TABLES) {
      let records: any[] = [];

      // 1. Try fetching from local SQLite first (instant, offline-first)
      try {
        if (db && (db as any).$client) {
          const tableExists = (db as any).$client.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
          if (tableExists) {
            const columns = (db as any).$client.prepare(`PRAGMA table_info("${table}")`).all() as Array<{ name: string }>;
            const hasBusinessId = columns.some(c => c.name === 'business_id');

            if (hasBusinessId && businessId !== '00000000-0000-0000-0000-000000000000') {
              records = (db as any).$client.prepare(`SELECT * FROM "${table}" WHERE business_id = ?`).all(businessId) || [];
            }
            if (records.length === 0) {
              records = (db as any).$client.prepare(`SELECT * FROM "${table}"`).all() || [];
            }
          }
        }
      } catch (sqliteErr: any) {
        console.warn(`[Backup API] SQLite read error for ${table}:`, sqliteErr?.message);
      }

      // 2. If SQLite yielded no records and Supabase is configured, fetch from cloud Supabase
      if (records.length === 0 && supabase) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('business_id', businessId);
          if (!error && data && data.length > 0) {
            records = data;
          }
        } catch (sbErr: any) {
          console.warn(`[Backup API] Supabase fetch error for ${table}:`, sbErr?.message);
        }
      }

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

    const payload = {
      backup,
      metadata: {
        generated_at: new Date().toISOString(),
        business_id: businessId,
        total_records: totalRecords,
        earliest_date: earliestDate,
        tables_included: BACKUP_TABLES.length,
        version: '13.1.1',
      }
    };

    const isBrowserNavigation = req.headers.get('accept')?.includes('text/html') || searchParams.get('download') === 'true';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    };

    if (isBrowserNavigation) {
      headers['Content-Disposition'] = `attachment; filename="noxis_backup_${businessId.slice(0, 8)}_${new Date().toISOString().split('T')[0]}.json"`;
    }

    return NextResponse.json(payload, { headers });
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

    const isLocal = isLocalOrDesktopRequest(req);
    if (!isLocal) {
      const access = await verifyBusinessOwnership(business_id);
      if (!access) {
        return NextResponse.json({ error: 'Unauthorized or access denied to this business' }, { status: 403 });
      }
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

      // 1. Restore into local SQLite if available
      try {
        if (db && (db as any).$client) {
          const tableExists = (db as any).$client.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
          if (tableExists) {
            for (const record of records) {
              try {
                const cleanRecord = { ...record, business_id };
                const keys = Object.keys(cleanRecord);
                const placeholders = keys.map(() => '?').join(', ');
                const columns = keys.map(k => `"${k}"`).join(', ');
                const sql = `INSERT OR REPLACE INTO "${table}" (${columns}) VALUES (${placeholders})`;
                (db as any).$client.prepare(sql).run(...Object.values(cleanRecord));
                inserted++;
              } catch (recErr: any) {
                skipped++;
                errors.push(recErr?.message || 'Insert error');
              }
            }
          }
        }
      } catch (localErr: any) {
        console.warn(`[Restore API] Local SQLite restore error for ${table}:`, localErr?.message);
      }

      // 2. Also restore to Supabase if connected
      if (supabase) {
        try {
          const CHUNK_SIZE = 50;
          for (let i = 0; i < records.length; i += CHUNK_SIZE) {
            const chunk = records.slice(i, i + CHUNK_SIZE).map((r: any) => ({
              ...r,
              business_id,
            }));

            const { data, error } = await supabase
              .from(table)
              .upsert(chunk, { onConflict: 'id', ignoreDuplicates: true })
              .select('id');

            if (error) {
              errors.push(`Cloud chunk ${Math.floor(i / CHUNK_SIZE)}: ${error.message}`);
            }
          }
        } catch (sbErr: any) {
          console.warn(`[Restore API] Cloud restore error for ${table}:`, sbErr?.message);
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
