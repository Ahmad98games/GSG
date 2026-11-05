import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db/client';
import { randomUUID } from 'crypto';
import { broadcastToHubRenderer } from '@/lib/mobile-bridge/server';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false }
  });
}

function getSqliteInstance() {
  try {
    return (db as any).$client || null;
  } catch {
    return null;
  }
}

function ensureLocalSchema(sqlite: any) {
  if (!sqlite) return;
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS business_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'system',
        business_name TEXT NOT NULL DEFAULT 'My Business',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS skus (
        id TEXT PRIMARY KEY,
        business_id TEXT DEFAULT 'local',
        name TEXT NOT NULL,
        sku_code TEXT,
        barcode TEXT,
        category TEXT,
        unit TEXT DEFAULT 'Piece',
        cost_price REAL DEFAULT 0,
        sale_price REAL DEFAULT 0,
        tax_rate REAL DEFAULT 0,
        qty_on_hand REAL DEFAULT 0,
        reorder_level REAL DEFAULT 0,
        expiry_date TEXT,
        batch_number TEXT,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS sku_cache (
        sku_id TEXT PRIMARY KEY,
        sku_code TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT,
        qty_on_hand TEXT NOT NULL DEFAULT '0',
        unit TEXT NOT NULL DEFAULT 'Piece',
        cost_price TEXT NOT NULL DEFAULT '0',
        sale_price TEXT NOT NULL DEFAULT '0',
        last_synced_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS parties (
        id TEXT PRIMARY KEY,
        business_id TEXT DEFAULT 'local',
        name TEXT NOT NULL,
        party_type TEXT DEFAULT 'customer',
        phone TEXT,
        secondary_phone TEXT,
        email TEXT,
        address TEXT,
        city TEXT,
        opening_balance REAL DEFAULT 0,
        balance_nature TEXT DEFAULT 'receivable',
        current_balance REAL DEFAULT 0,
        credit_limit REAL DEFAULT 0,
        credit_terms_days INTEGER DEFAULT 0,
        cnic_or_ntn TEXT,
        notes TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS karigars (
        id TEXT PRIMARY KEY,
        business_id TEXT DEFAULT 'local',
        name TEXT NOT NULL,
        karigar_code TEXT,
        phone TEXT,
        cnic TEXT,
        department TEXT,
        designation TEXT DEFAULT 'Karigar',
        wage_type TEXT DEFAULT 'monthly',
        monthly_salary REAL DEFAULT 0,
        daily_wage REAL DEFAULT 0,
        piece_rate REAL DEFAULT 0,
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS opening_balances (
        id TEXT PRIMARY KEY,
        business_id TEXT DEFAULT 'local',
        balance_date TEXT NOT NULL,
        party_id TEXT,
        party_amount REAL DEFAULT 0,
        cash_in_hand REAL DEFAULT 0,
        bank_balance REAL DEFAULT 0,
        posted INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS ledger_entries (
        id TEXT PRIMARY KEY,
        business_id TEXT DEFAULT 'local',
        party_id TEXT,
        entry_date TEXT NOT NULL,
        description TEXT NOT NULL,
        debit REAL DEFAULT 0,
        credit REAL DEFAULT 0,
        balance REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  } catch (err: any) {
    console.warn('[API Import] ensureLocalSchema warning:', err.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { entity, rows, businessId } = body;

    if (!entity || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Valid entity and non-empty rows array required' }, { status: 400 });
    }

    let effectiveBizId = businessId && businessId !== '00000000-0000-0000-0000-000000000000'
      ? businessId
      : 'local';

    const sqlite = getSqliteInstance();
    if (sqlite) {
      ensureLocalSchema(sqlite);
      try {
        const existingProfile = sqlite.prepare('SELECT id FROM business_profiles WHERE id = ?').get(effectiveBizId);
        if (!existingProfile) {
          const firstProfile = sqlite.prepare('SELECT id FROM business_profiles LIMIT 1').get();
          if (firstProfile && firstProfile.id) {
            effectiveBizId = firstProfile.id;
          } else {
            sqlite.prepare(`
              INSERT OR IGNORE INTO business_profiles (id, user_id, business_name, created_at, updated_at)
              VALUES (?, 'system', 'My Business', datetime('now'), datetime('now'))
            `).run(effectiveBizId);
          }
        }
      } catch (bpErr: any) {
        console.warn('[API Import] business_profiles resolution warning:', bpErr.message);
      }
    }

    const supabase = getAdminClient();
    const results = {
      imported: 0,
      failed: 0,
      errors: [] as string[]
    };

    // ── 1. SKUS / PRODUCTS ──────────────────────────────────────────
    if (entity === 'skus') {
      const records = rows.map((r: any, idx: number) => {
        const skuCode = (r.sku_code || r.code || r.item_code || `SKU-${Date.now() + idx}`).toString().trim();
        const name = (r.name || r.item_name || r.title || `Item ${skuCode}`).toString().trim();
        const category = (r.category || r.type || 'General').toString().trim();
        const unit = (r.unit || 'pcs').toString().trim();
        const qty = parseFloat(r.qty_on_hand || r.stock_qty || r.qty || '0') || 0;
        const costPrice = parseFloat(r.cost_price || r.cost || '0') || 0;
        const salePrice = parseFloat(r.sale_price || r.price || r.sale || '0') || 0;
        const reorderLevel = parseFloat(r.reorder_level || r.reorder || '10') || 10;
        const barcode = (r.barcode || '').toString().trim() || null;

        return {
          id: r.id || randomUUID(),
          business_id: effectiveBizId,
          sku_code: skuCode,
          barcode,
          name,
          category,
          unit,
          qty_on_hand: qty,
          cost_price: costPrice,
          sale_price: salePrice,
          reorder_level: reorderLevel,
          is_active: 1
        };
      });

      // Save into local SQLite database
      if (sqlite) {
        try {
          const findStmt = sqlite.prepare('SELECT id FROM skus WHERE sku_code = ? OR name = ? LIMIT 1');
          const insertStmt = sqlite.prepare(`
            INSERT INTO skus (
              id, business_id, sku_code, barcode, name, category, unit, 
              qty_on_hand, cost_price, sale_price, reorder_level, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
          `);
          const updateStmt = sqlite.prepare(`
            UPDATE skus SET
              name = ?, barcode = COALESCE(?, barcode), category = ?, unit = ?,
              qty_on_hand = ?, cost_price = ?, sale_price = ?, reorder_level = ?,
              is_active = 1, updated_at = datetime('now')
            WHERE id = ?
          `);
          const cacheStmt = sqlite.prepare(`
            INSERT OR REPLACE INTO sku_cache (
              sku_id, sku_code, name, category, qty_on_hand, unit, cost_price, sale_price, last_synced_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `);

          const transaction = sqlite.transaction((items: typeof records) => {
            for (const item of items) {
              const existing = findStmt.get(item.sku_code, item.name);
              let targetId = item.id;
              if (existing && existing.id) {
                targetId = existing.id;
                updateStmt.run(
                  item.name, item.barcode, item.category, item.unit,
                  item.qty_on_hand, item.cost_price, item.sale_price, item.reorder_level,
                  targetId
                );
              } else {
                insertStmt.run(
                  targetId, item.business_id, item.sku_code, item.barcode,
                  item.name, item.category, item.unit, item.qty_on_hand,
                  item.cost_price, item.sale_price, item.reorder_level
                );
              }

              cacheStmt.run(
                targetId, item.sku_code, item.name, item.category,
                item.qty_on_hand.toString(), item.unit,
                item.cost_price.toString(), item.sale_price.toString()
              );
            }
          });

          transaction(records);
          results.imported = records.length;
        } catch (sqliteErr: any) {
          console.error('[API Import] SQLite SKU save error:', sqliteErr.message);
          results.errors.push(`SQLite: ${sqliteErr.message}`);
        }
      } else {
        results.imported = records.length;
      }

      // Background Cloud Sync if Supabase is connected
      if (supabase && effectiveBizId !== 'local' && effectiveBizId !== '00000000-0000-0000-0000-000000000000') {
        try {
          await supabase.from('skus').upsert(records, { onConflict: 'business_id,sku_code' });
        } catch (supaErr) {
          console.warn('[API Import] Cloud backup sync skipped:', supaErr);
        }
      }

      try { broadcastToHubRenderer('inventory:sync', { count: records.length }); } catch {}
    }

    // ── 2. PARTIES (CUSTOMERS & SUPPLIERS) ──────────────────────────
    else if (entity === 'parties') {
      const records = rows.map((r: any) => {
        const name = (r.name || r.party_name || r.company_name || r.client_name || 'Unnamed Party').toString().trim();
        let partyType = (r.party_type || r.type || 'customer').toString().trim().toLowerCase();
        if (!['customer', 'supplier', 'both'].includes(partyType)) {
          if (partyType.includes('suppl') || partyType.includes('vendor')) partyType = 'supplier';
          else if (partyType.includes('both')) partyType = 'both';
          else partyType = 'customer';
        }

        const phone = (r.phone || r.phone_number || r.mobile || r.contact || '').toString().trim() || null;
        const email = (r.email || '').toString().trim() || null;
        const address = (r.address || r.city || r.location || '').toString().trim() || null;
        const currentBalance = parseFloat(r.current_balance || r.balance || r.opening_balance || '0') || 0;
        const creditLimit = parseFloat(r.credit_limit || '0') || 0;

        return {
          id: r.id || randomUUID(),
          business_id: effectiveBizId,
          name,
          party_type: partyType,
          phone,
          email,
          address,
          opening_balance: currentBalance,
          current_balance: currentBalance,
          credit_limit: creditLimit,
          is_active: 1
        };
      });

      // Save into local SQLite database
      if (sqlite) {
        try {
          const findStmt = sqlite.prepare('SELECT id FROM parties WHERE name = ? OR (phone IS NOT NULL AND phone = ?) LIMIT 1');
          const insertStmt = sqlite.prepare(`
            INSERT INTO parties (
              id, business_id, name, party_type, phone, email, address, 
              opening_balance, current_balance, credit_limit, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
          `);
          const updateStmt = sqlite.prepare(`
            UPDATE parties SET
              party_type = ?, phone = COALESCE(?, phone), email = COALESCE(?, email),
              address = COALESCE(?, address), current_balance = ?, credit_limit = ?,
              is_active = 1, updated_at = datetime('now')
            WHERE id = ?
          `);

          const transaction = sqlite.transaction((items: typeof records) => {
            for (const item of items) {
              const existing = findStmt.get(item.name, item.phone);
              if (existing && existing.id) {
                updateStmt.run(
                  item.party_type, item.phone, item.email, item.address,
                  item.current_balance, item.credit_limit, existing.id
                );
              } else {
                insertStmt.run(
                  item.id, item.business_id, item.name, item.party_type,
                  item.phone, item.email, item.address, item.opening_balance,
                  item.current_balance, item.credit_limit
                );
              }
            }
          });

          transaction(records);
          results.imported = records.length;
        } catch (sqliteErr: any) {
          console.error('[API Import] SQLite Party save error:', sqliteErr.message);
          results.errors.push(`SQLite: ${sqliteErr.message}`);
        }
      } else {
        results.imported = records.length;
      }

      // Background Cloud Sync if Supabase is connected
      if (supabase && effectiveBizId !== 'local' && effectiveBizId !== '00000000-0000-0000-0000-000000000000') {
        try {
          await supabase.from('parties').upsert(records, { onConflict: 'business_id,name' });
        } catch (supaErr) {
          console.warn('[API Import] Cloud party backup sync skipped:', supaErr);
        }
      }

      try { broadcastToHubRenderer('parties:sync', { count: records.length }); } catch {}
    }

    // ── 3. WORKERS / KARIGARS / EMPLOYEES ───────────────────────────
    else if (entity === 'karigars') {
      const records = rows.map((r: any, idx: number) => {
        const name = (r.name || r.employee_name || r.worker_name || 'Worker').toString().trim();
        const code = (r.karigar_code || r.code || r.emp_code || `KAR-${Date.now() + idx}`).toString().trim();
        const phone = (r.phone || r.mobile || '').toString().trim() || null;
        let wageType = (r.wage_type || r.pay_type || 'monthly').toString().trim().toLowerCase();
        if (!['piece_rate', 'daily', 'monthly'].includes(wageType)) {
          if (wageType.includes('piece')) wageType = 'piece_rate';
          else if (wageType.includes('day') || wageType.includes('daily')) wageType = 'daily';
          else wageType = 'monthly';
        }

        const monthlySalary = parseFloat(r.monthly_salary || r.salary || r.basic_salary || '0') || 0;
        const dailyRate = parseFloat(r.daily_rate || r.rate || '0') || 0;
        const pieceRate = parseFloat(r.piece_rate || '0') || 0;

        return {
          id: r.id || randomUUID(),
          business_id: effectiveBizId,
          karigar_code: code,
          name,
          phone,
          wage_type: wageType,
          monthly_salary: monthlySalary,
          daily_wage: dailyRate,
          piece_rate: pieceRate,
          status: 'active'
        };
      });

      // Save into local SQLite database
      if (sqlite) {
        try {
          const findStmt = sqlite.prepare('SELECT id FROM karigars WHERE karigar_code = ? OR name = ? LIMIT 1');
          const insertStmt = sqlite.prepare(`
            INSERT INTO karigars (
              id, business_id, karigar_code, name, phone, wage_type,
              monthly_salary, daily_wage, piece_rate, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
          `);
          const updateStmt = sqlite.prepare(`
            UPDATE karigars SET
              name = ?, phone = COALESCE(?, phone), wage_type = ?,
              monthly_salary = ?, daily_wage = ?, piece_rate = ?,
              status = 'active', updated_at = datetime('now')
            WHERE id = ?
          `);

          const transaction = sqlite.transaction((items: typeof records) => {
            for (const item of items) {
              const existing = findStmt.get(item.karigar_code, item.name);
              if (existing && existing.id) {
                updateStmt.run(
                  item.name, item.phone, item.wage_type,
                  item.monthly_salary, item.daily_wage, item.piece_rate,
                  existing.id
                );
              } else {
                insertStmt.run(
                  item.id, item.business_id, item.karigar_code, item.name,
                  item.phone, item.wage_type, item.monthly_salary,
                  item.daily_wage, item.piece_rate
                );
              }
            }
          });

          transaction(records);
          results.imported = records.length;
        } catch (sqliteErr: any) {
          console.error('[API Import] SQLite Karigar save error:', sqliteErr.message);
          results.errors.push(`SQLite: ${sqliteErr.message}`);
        }
      } else {
        results.imported = records.length;
      }

      // Background Cloud Sync if Supabase is connected
      if (supabase && effectiveBizId !== 'local' && effectiveBizId !== '00000000-0000-0000-0000-000000000000') {
        try {
          await supabase.from('karigars').upsert(records, { onConflict: 'business_id,karigar_code' });
        } catch (supaErr) {
          console.warn('[API Import] Cloud karigar backup sync skipped:', supaErr);
        }
      }

      try { broadcastToHubRenderer('karigars:sync', { count: records.length }); } catch {}
    }

    // ── 4. OPENING BALANCES / LEDGER ────────────────────────────────
    else if (entity === 'opening_balances') {
      const records = rows.map((r: any) => {
        const account = (r.account_name || r.account || r.name || 'Opening Balance').toString().trim();
        const debit = parseFloat(r.debit || r.dr || '0') || 0;
        const credit = parseFloat(r.credit || r.cr || '0') || 0;
        const notes = (r.notes || r.description || 'Imported Opening Balance').toString().trim();
        const effectiveDate = r.date || new Date().toISOString().split('T')[0];

        return {
          id: r.id || randomUUID(),
          business_id: effectiveBizId,
          account_name: account,
          debit,
          credit,
          notes,
          effective_date: effectiveDate
        };
      });

      if (sqlite) {
        try {
          const insertOBStmt = sqlite.prepare(`
            INSERT INTO opening_balances (
              id, business_id, balance_date, party_amount, cash_in_hand, bank_balance, posted, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))
          `);
          const insertLedgerStmt = sqlite.prepare(`
            INSERT INTO ledger_entries (
              id, business_id, entry_date, description, debit, credit, balance, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `);

          const transaction = sqlite.transaction((items: typeof records) => {
            for (const item of items) {
              const net = item.debit - item.credit;
              insertOBStmt.run(
                item.id, item.business_id, item.effective_date,
                net, item.debit > 0 ? item.debit : 0, item.credit > 0 ? item.credit : 0
              );
              insertLedgerStmt.run(
                randomUUID(), item.business_id, item.effective_date,
                `Opening Balance: ${item.account_name}`, item.debit, item.credit, net
              );
            }
          });

          transaction(records);
          results.imported = records.length;
        } catch (sqliteErr: any) {
          console.error('[API Import] SQLite Opening Balances error:', sqliteErr.message);
          results.errors.push(`SQLite: ${sqliteErr.message}`);
        }
      } else {
        results.imported = records.length;
      }
    } else {
      return NextResponse.json({ error: `Unknown entity type: ${entity}` }, { status: 400 });
    }

    results.failed = rows.length - results.imported;
    return NextResponse.json({
      success: true,
      entity,
      ...results
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Import processing error' }, { status: 500 });
  }
}
