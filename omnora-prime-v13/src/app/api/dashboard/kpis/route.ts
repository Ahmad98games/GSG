import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyUserSession } from '@/lib/security/authHelpers'

export const dynamic = 'force-static';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function safeRun(fn: () => PromiseLike<any>, fallback: { data: any[]; count: number } = { data: [], count: 0 }) {
  try {
    const res = await fn()
    if (!res || res.error) {
      return fallback
    }
    return {
      data: res.data ?? fallback.data,
      count: res.count ?? fallback.count,
    }
  } catch {
    return fallback
  }
}

export async function GET(req: Request) {
  const auth = await verifyUserSession()
  const { searchParams } = new URL(req.url)
  const biz = searchParams.get('biz') || '00000000-0000-0000-0000-000000000000'

  if (!auth && process.env.NODE_ENV !== 'development' && biz !== '00000000-0000-0000-0000-000000000000') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date().toISOString().split('T')[0]
    const monthStart = new Date(today.slice(0, 7) + '-01').toISOString()
    const thirtyDays = new Date()
    thirtyDays.setDate(thirtyDays.getDate() + 30)
    const thirtyDaysStr = thirtyDays.toISOString().split('T')[0]

    // Execute all queries safely in parallel
    const [
      attendanceToday,
      karigarsRes,
      invoicesMonth,
      receivables,
      stockRes,
      lowStockRes,
      dispatchRes,
      purchaseRes,
      payrollRes,
      peshgiRes,
      recentInvoicesRes,
      recentAttendanceRes,
      topKarigarsRes,
      promisesRes,
      expiringRes,
    ] = await Promise.all([
      // 1. Today attendance present count
      safeRun(async () => await supabase.from('attendance_logs').select('id', { count: 'exact', head: true }).eq('business_id', biz).eq('log_date', today).eq('status', 'present')),

      // 2. Active workers list
      safeRun(async () => await supabase.from('karigars').select('id, name', { count: 'exact' }).eq('business_id', biz).eq('status', 'active')),

      // 3. This month invoices posted
      safeRun(async () => await supabase.from('invoices').select('subtotal, status').eq('business_id', biz).in('status', ['posted', 'issued', 'paid', 'partially_paid']).gte('created_at', monthStart)),

      // 4. Receivables
      safeRun(async () => await supabase.from('invoices').select('due_date, created_at, balance_due').eq('business_id', biz).in('status', ['posted', 'issued', 'paid', 'partially_paid']).gt('balance_due', 0)),

      // 5. Active SKUs stock values
      safeRun(async () => await supabase.from('skus').select('qty_on_hand, cost_price').eq('business_id', biz).eq('is_active', true)),

      // 6. Low stock alert count
      safeRun(async () => await supabase.from('skus').select('id', { count: 'exact', head: true }).eq('business_id', biz).eq('is_active', true).filter('qty_on_hand', 'lte', 'reorder_level')),

      // 7. Pending dispatches
      safeRun(async () => await supabase.from('dispatch_orders').select('id', { count: 'exact', head: true }).eq('business_id', biz).in('status', ['pending', 'packed'])),

      // 8. Pending purchases
      safeRun(async () => await supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).eq('business_id', biz).in('status', ['draft', 'sent'])),

      // 9. Payroll runs
      safeRun(async () => await supabase.from('payroll_slips').select('net_pay').eq('business_id', biz).gte('created_at', monthStart)),

      // 10. Peshgi balances
      safeRun(async () => await supabase.from('karigars').select('id').eq('business_id', biz).eq('status', 'active')),

      // 11. Recent 5 invoices
      safeRun(async () => await supabase.from('invoices').select('id, status, created_at').eq('business_id', biz).order('created_at', { ascending: false }).limit(5)),

      // 12. Recent attendance logs
      safeRun(async () => await supabase.from('attendance_logs').select('karigar_id, status, log_date').eq('business_id', biz).eq('log_date', today).limit(10)),

      // 13. Top karigars
      safeRun(async () => await supabase.from('karigar_production_logs').select('karigar_id, units_produced, earnings').eq('business_id', biz).gte('log_date', monthStart).order('earnings', { ascending: false }).limit(5)),

      // 14. Active payment promises
      safeRun(async () => await supabase.from('payment_promises').select('id, promise_date, status').eq('business_id', biz).eq('status', 'pending').order('promise_date', { ascending: true }).limit(5)),

      // 15. Expiring stock items
      safeRun(async () => await supabase.from('skus').select('id', { count: 'exact', head: true }).eq('business_id', biz).eq('is_active', true).not('expiry_date', 'is', null).lte('expiry_date', thirtyDaysStr).gt('qty_on_hand', 0)),
    ])

    return NextResponse.json({
      attendanceToday: attendanceToday.count || 0,
      totalKarigars: karigarsRes.count || 0,
      invoicesMonth: invoicesMonth.data || [],
      receivables: receivables.data || [],
      stock: stockRes.data || [],
      lowStockCount: lowStockRes.count || 0,
      dispatchCount: dispatchRes.count || 0,
      purchaseCount: purchaseRes.count || 0,
      payroll: payrollRes.data || [],
      peshgi: peshgiRes.data || [],
      recentInvoices: recentInvoicesRes.data || [],
      recentAttendance: recentAttendanceRes.data || [],
      topKarigars: topKarigarsRes.data || [],
      promises: promisesRes.data || [],
      expiringCount: expiringRes.count || 0,
    })
  } catch (err: any) {
    console.error('[Dashboard KPI server crash]', err)
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 200 })
  }
}
