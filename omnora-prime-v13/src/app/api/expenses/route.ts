import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

function getSqliteInstance() {
  try {
    return (db as any).$client || null;
  } catch {
    return null;
  }
}

function ensureExpensesTable(sqlite: any) {
  if (!sqlite) return;
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        business_id TEXT DEFAULT 'local',
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        expense_date TEXT NOT NULL,
        payment_method TEXT DEFAULT 'cash',
        party_id TEXT,
        party_name TEXT,
        reference TEXT,
        receipt_url TEXT,
        is_recurring INTEGER DEFAULT 0,
        created_by TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  } catch (err: any) {
    console.warn('[API Expenses] Table ensure warning:', err.message);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const limit = Math.min(250, parseInt(searchParams.get('limit') || '100', 10));

    const sqlite = getSqliteInstance();
    if (!sqlite) {
      return NextResponse.json({
        data: [],
        stats: { totalMonthly: 0, todaySpend: 0, topCategory: 'None', cashTotal: 0, bankTotal: 0, count: 0 }
      });
    }

    ensureExpensesTable(sqlite);

    let query = `SELECT * FROM expenses WHERE 1=1`;
    const params: any[] = [];

    if (category && category !== 'all') {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (search) {
      query += ` AND (LOWER(description) LIKE ? OR LOWER(category) LIKE ? OR LOWER(COALESCE(reference, '')) LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY expense_date DESC, created_at DESC LIMIT ?`;
    params.push(limit);

    const rows = sqlite.prepare(query).all(...params) || [];

    // Calculate statistics
    const allExpenses = sqlite.prepare(`SELECT * FROM expenses`).all() || [];
    const todayStr = new Date().toISOString().slice(0, 10);
    const currentMonthStr = todayStr.slice(0, 7); // 'YYYY-MM'

    let totalMonthly = 0;
    let todaySpend = 0;
    let cashTotal = 0;
    let bankTotal = 0;
    const catMap: Record<string, number> = {};

    for (const exp of allExpenses) {
      const amt = Number(exp.amount) || 0;
      const date = (exp.expense_date || exp.created_at || '').slice(0, 10);
      
      if (date.startsWith(currentMonthStr)) {
        totalMonthly += amt;
      }
      if (date === todayStr) {
        todaySpend += amt;
      }
      if ((exp.payment_method || '').toLowerCase() === 'cash') {
        cashTotal += amt;
      } else {
        bankTotal += amt;
      }

      const cat = exp.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + amt;
    }

    let topCategory = 'None';
    let topCatMax = 0;
    for (const [cat, sum] of Object.entries(catMap)) {
      if (sum > topCatMax) {
        topCatMax = sum;
        topCategory = cat;
      }
    }

    return NextResponse.json({
      data: rows,
      stats: {
        totalMonthly,
        todaySpend,
        topCategory,
        cashTotal,
        bankTotal,
        count: allExpenses.length
      }
    });
  } catch (err: any) {
    console.error('[API Expenses GET] Error:', err);
    return NextResponse.json({
      error: err.message,
      data: [],
      stats: { totalMonthly: 0, todaySpend: 0, topCategory: 'None', cashTotal: 0, bankTotal: 0, count: 0 }
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      business_id = 'local',
      category,
      description,
      amount,
      expense_date,
      payment_method = 'cash',
      party_id,
      party_name,
      reference,
      notes
    } = body;

    if (!category || !description || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Category, description, and a valid amount are required' }, { status: 400 });
    }

    const sqlite = getSqliteInstance();
    if (!sqlite) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    ensureExpensesTable(sqlite);

    const id = 'exp-' + randomUUID();
    const finalDate = expense_date || new Date().toISOString().slice(0, 10);
    const finalAmount = Number(amount);

    sqlite.prepare(`
      INSERT INTO expenses (
        id, business_id, category, description, amount, expense_date,
        payment_method, party_id, party_name, reference, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      id,
      business_id,
      category,
      description,
      finalAmount,
      finalDate,
      payment_method,
      party_id || null,
      party_name || null,
      reference || notes || null
    );

    return NextResponse.json({
      success: true,
      data: {
        id,
        category,
        description,
        amount: finalAmount,
        expense_date: finalDate,
        payment_method
      }
    });
  } catch (err: any) {
    console.error('[API Expenses POST] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const sqlite = getSqliteInstance();
    if (!sqlite || !id) {
      return NextResponse.json({ error: 'Missing ID or database' }, { status: 400 });
    }

    ensureExpensesTable(sqlite);
    sqlite.prepare(`DELETE FROM expenses WHERE id = ?`).run(id);

    return NextResponse.json({ success: true, message: 'Expense deleted' });
  } catch (err: any) {
    console.error('[API Expenses DELETE] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
