import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyUserSession } from '@/lib/security/authHelpers'

export const dynamic = 'force-static';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // Execute all 15 queries in parallel on the server side
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
      supabase.from('attendance_logs')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', biz)
        .eq('log_date', today)
        .eq('status', 'present'),

      // 2. Active workers list (total count and peshgi balances)
      supabase.from('karigars')
        .select('id, name, peshgi_balance', { count: 'exact' })
        .eq('business_id', biz)
        .eq('status', 'active'),

      // 3. This month invoices posted
      supabase.from('invoices')
        .select('total_amount, subtotal, status')
        .eq('business_id', biz)
        .eq('status', 'posted')
        .gte('created_at', monthStart),

      // 4. Receivables (outstanding invoices)
      supabase.from('invoices')
        .select('total_amount, due_date, created_at')
        .eq('business_id', biz)
        .eq('status', 'posted')
        .gt('balance_due', 0),

      // 5. Active SKUs stock values
      supabase.from('skus')
        .select('qty_on_hand, cost_price')
        .eq('business_id', biz)
        .eq('is_active', true),

      // 6. Low stock alert count
      supabase.from('skus')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', biz)
        .eq('is_active', true)
        .filter('qty_on_hand', 'lte', 'reorder_level'),

      // 7. Pending dispatches
      supabase.from('dispatch_orders')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', biz)
        .in('status', ['pending', 'packed']),

      // 8. Pending purchases
      supabase.from('purchase_orders')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', biz)
        .in('status', ['draft', 'sent']),

      // 9. Payroll runs (this month total)
      supabase.from('payroll_runs')
        .select('total_net')
        .eq('business_id', biz)
        .gte('period_start', monthStart),

      // 10. Peshgi balances outstanding
      supabase.from('karigars')
        .select('peshgi_balance')
        .eq('business_id', biz)
        .eq('status', 'active')
        .gt('peshgi_balance', 0),

      // 11. Recent 5 invoices
      supabase.from('invoices')
        .select('id, invoice_number, total_amount, status, created_at, party:parties(name)')
        .eq('business_id', biz)
        .order('created_at', { ascending: false })
        .limit(5),

      // 12. Recent attendance logs
      supabase.from('attendance_logs')
        .select('karigar_id, status, log_date, karigar:karigars(name)')
        .eq('business_id', biz)
        .eq('log_date', today)
        .limit(10),

      // 13. Top karigars by earnings
      supabase.from('karigar_production_logs')
        .select('karigar_id, units_produced, earnings, karigar:karigars(name, karigar_code)')
        .eq('business_id', biz)
        .gte('log_date', monthStart)
        .order('earnings', { ascending: false })
        .limit(5),

      // 14. Active payment promises
      supabase.from('payment_promises')
        .select('id, amount, promise_date, status, party:parties(name)')
        .eq('business_id', biz)
        .eq('status', 'pending')
        .order('promise_date', { ascending: true })
        .limit(5),

      // 15. Expiring stock items (within 30 days)
      supabase.from('skus')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', biz)
        .eq('is_active', true)
        .not('expiry_date', 'is', null)
        .lte('expiry_date', thirtyDaysStr)
        .gt('qty_on_hand', 0),
    ])

    // Compile error check
    const errors = [
      attendanceToday.error, karigarsRes.error, invoicesMonth.error, receivables.error,
      stockRes.error, lowStockRes.error, dispatchRes.error, purchaseRes.error,
      payrollRes.error, peshgiRes.error, recentInvoicesRes.error, recentAttendanceRes.error,
      topKarigarsRes.error, promisesRes.error, expiringRes.error
    ].filter(Boolean)

    if (errors.length > 0) {
      console.error('[Dashboard API Errors]', errors)
      return NextResponse.json({ error: 'Failed to retrieve some metrics', details: errors }, { status: 500 })
    }

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
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 })
  }
}
