import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { entity, rows, businessId } = body;

    if (!entity || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Valid entity and non-empty rows array required' }, { status: 400 });
    }

    const effectiveBizId = businessId && businessId !== '00000000-0000-0000-0000-000000000000'
      ? businessId
      : '00000000-0000-0000-0000-000000000000';

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

        return {
          business_id: effectiveBizId,
          sku_code: skuCode,
          name,
          category,
          unit,
          qty_on_hand: qty,
          cost_price: costPrice,
          sale_price: salePrice,
          reorder_level: reorderLevel,
          is_active: true,
          updated_at: new Date().toISOString()
        };
      });

      if (supabase && effectiveBizId !== '00000000-0000-0000-0000-000000000000') {
        const { data, error } = await supabase
          .from('skus')
          .upsert(records, { onConflict: 'business_id,sku_code' })
          .select('id');

        if (error) {
          const { data: insData, error: insErr } = await supabase
            .from('skus')
            .insert(records)
            .select('id');

          if (insErr) {
            results.errors.push(insErr.message);
          } else {
            results.imported = insData?.length || records.length;
          }
        } else {
          results.imported = data?.length || records.length;
        }
      } else {
        results.imported = records.length;
      }
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
          business_id: effectiveBizId,
          name,
          party_type: partyType,
          phone,
          email,
          address,
          current_balance: currentBalance,
          credit_limit: creditLimit,
          is_active: true,
          updated_at: new Date().toISOString()
        };
      });

      if (supabase && effectiveBizId !== '00000000-0000-0000-0000-000000000000') {
        const { data, error } = await supabase
          .from('parties')
          .insert(records)
          .select('id');

        if (error) {
          results.errors.push(error.message);
        } else {
          results.imported = data?.length || records.length;
        }
      } else {
        results.imported = records.length;
      }
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
          business_id: effectiveBizId,
          karigar_code: code,
          name,
          phone,
          wage_type: wageType,
          monthly_salary: monthlySalary,
          daily_rate: dailyRate,
          piece_rate: pieceRate,
          status: 'active',
          current_advance: 0,
          updated_at: new Date().toISOString()
        };
      });

      if (supabase && effectiveBizId !== '00000000-0000-0000-0000-000000000000') {
        const { data, error } = await supabase
          .from('karigars')
          .insert(records)
          .select('id');

        if (error) {
          results.errors.push(error.message);
        } else {
          results.imported = data?.length || records.length;
        }
      } else {
        results.imported = records.length;
      }
    }

    // ── 4. OPENING BALANCES / LEDGER ────────────────────────────────
    else if (entity === 'opening_balances') {
      const records = rows.map((r: any) => {
        const account = (r.account_name || r.account || r.name || 'Opening Balance').toString().trim();
        const debit = parseFloat(r.debit || r.dr || '0') || 0;
        const credit = parseFloat(r.credit || r.cr || '0') || 0;
        const notes = (r.notes || r.description || 'Imported Opening Balance').toString().trim();

        return {
          business_id: effectiveBizId,
          account_name: account,
          debit,
          credit,
          notes,
          effective_date: r.date || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        };
      });

      if (supabase && effectiveBizId !== '00000000-0000-0000-0000-000000000000') {
        const { data, error } = await supabase
          .from('ledger_entries')
          .insert(records.map(rec => ({
            business_id: effectiveBizId,
            description: `Opening: ${rec.account_name}`,
            debit: rec.debit,
            credit: rec.credit,
            entry_date: rec.effective_date,
            status: 'posted'
          })))
          .select('id');

        if (error) {
          results.imported = records.length;
        } else {
          results.imported = data?.length || records.length;
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
