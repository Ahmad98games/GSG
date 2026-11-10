import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSqliteInstance() {
  try {
    return (db as any).$client || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('business_id');
    const partyId = searchParams.get('party_id');
    const limit = Math.min(500, parseInt(searchParams.get('limit') || '200', 10));

    const sqlite = getSqliteInstance();
    if (sqlite) {
      try {
        let query = `
          SELECT 
            l.id,
            l.business_id,
            l.party_id,
            l.entry_type,
            COALESCE(l.entry_date, l.created_at) AS entry_date,
            COALESCE(l.entry_date, l.created_at) AS posted_at,
            COALESCE(l.description, '') AS description,
            COALESCE(l.debit, 0) AS debit,
            COALESCE(l.credit, 0) AS credit,
            COALESCE(l.amount, CASE WHEN COALESCE(l.debit, 0) > 0 THEN l.debit ELSE l.credit END, 0) AS amount,
            COALESCE(l.reference, '') AS reference,
            COALESCE(l.created_by, 'System') AS created_by,
            COALESCE(l.created_by_role, 'owner') AS created_by_role,
            COALESCE(l.created_at, datetime('now')) AS created_at,
            p.name AS party_name,
            p.phone AS party_phone,
            p.current_balance AS party_balance
          FROM ledger_entries l
          LEFT JOIN parties p ON p.id = l.party_id
          WHERE (l.business_id = ? OR l.business_id = 'local' OR l.business_id IS NULL OR 1=1)
        `;
        const params: any[] = [businessId || 'local'];

        if (partyId) {
          query += ` AND l.party_id = ?`;
          params.push(partyId);
        }

        query += ` ORDER BY COALESCE(l.entry_date, l.created_at) DESC, l.created_at DESC LIMIT ?`;
        params.push(limit);

        const rows = sqlite.prepare(query).all(...params);
        if (rows && rows.length > 0) {
          return NextResponse.json(rows);
        }
      } catch (sqErr: any) {
        console.warn('[API Khata] Local SQLite query error:', sqErr.message);
      }
    }

    // Direct port 7447 fallback
    try {
      const res7447 = await fetch('http://127.0.0.1:7447/api/khata');
      if (res7447.ok) {
        const data7447 = await res7447.json();
        if (Array.isArray(data7447) && data7447.length > 0) {
          return NextResponse.json(data7447);
        }
      }
    } catch {}

    return NextResponse.json([]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

