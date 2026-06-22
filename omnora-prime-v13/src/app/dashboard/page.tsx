'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Truck, 
  ShoppingBag, 
  RefreshCw, 
  LogOut, 
  AlertTriangle, 
  Calendar, 
  ChevronRight,
  ShieldAlert,
  MapPin,
  Sparkles,
  Lock
} from 'lucide-react'

interface DashboardData {
  businessName: string
  industry: string
  city: string
  tier: string
  currency: string

  // Today
  presentToday: number
  totalKarigars: number
  absentToday: number

  // This month
  revenueThisMonth: number
  invoiceCount: number
  pendingReceivables: number
  overdueCount: number

  // Stock
  stockValue: number
  lowStockCount: number

  // Pending
  pendingDispatch: number
  pendingPurchases: number

  // Payroll
  totalPayrollThisMonth: number
  totalPeshgiOutstanding: number

  // Recent activity
  recentInvoices: any[]
  recentAttendance: any[]
  topKarigars: any[]
  promises: any[]
}

export default function OwnerDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState<'overview' | 'people' | 'finance' | 'stock'>('overview')

  const loadDashboard = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/dashboard/login')
        return
      }

      const { data: profile } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!profile) {
        router.push('/dashboard/login')
        return
      }

      const biz = profile.id
      const today = new Date().toISOString().split('T')[0]
      const monthStart = new Date(today.slice(0, 7) + '-01').toISOString()

      // Parallel fetch
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
      ] = await Promise.allSettled([
        // Today attendance present
        supabase.from('attendance_logs')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', biz)
          .eq('attendance_date', today)
          .eq('status', 'present'),

        // Total active karigars
        supabase.from('karigars')
          .select('id, name, peshgi_balance', { count: 'exact' })
          .eq('business_id', biz)
          .eq('status', 'active'),

        // This month invoices
        supabase.from('invoices')
          .select('total_amount, subtotal, status')
          .eq('business_id', biz)
          .eq('status', 'posted')
          .gte('created_at', monthStart),

        // Outstanding receivables
        supabase.from('invoices')
          .select('total_amount, due_date, created_at')
          .eq('business_id', biz)
          .eq('status', 'posted')
          .gt('balance_due', 0),

        // Stock value
        supabase.from('skus')
          .select('qty_on_hand, cost_price')
          .eq('business_id', biz)
          .eq('is_active', true),

        // Low stock count
        supabase.from('skus')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', biz)
          .eq('is_active', true)
          .filter('qty_on_hand', 'lte', 'reorder_level'),

        // Pending dispatch
        supabase.from('dispatch_orders')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', biz)
          .in('status', ['pending', 'packed']),

        // Pending purchases
        supabase.from('purchase_orders')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', biz)
          .in('status', ['draft', 'sent']),

        // This month payroll total
        supabase.from('payroll_runs')
          .select('total_net')
          .eq('business_id', biz)
          .gte('period_start', monthStart),

        // Total peshgi outstanding
        supabase.from('karigars')
          .select('peshgi_balance')
          .eq('business_id', biz)
          .eq('status', 'active')
          .gt('peshgi_balance', 0),

        // Recent 5 invoices
        supabase.from('invoices')
          .select(`
            id, invoice_number, total_amount,
            status, created_at,
            party:parties(name)
          `)
          .eq('business_id', biz)
          .order('created_at', { ascending: false })
          .limit(5),

        // Recent attendance summary
        supabase.from('attendance_logs')
          .select(`
            karigar_id, status, attendance_date,
            karigar:karigars(name)
          `)
          .eq('business_id', biz)
          .eq('attendance_date', today)
          .limit(10),

        // Top karigars by production this month
        supabase.from('karigar_production_logs')
          .select(`
            karigar_id, units_produced, earnings,
            karigar:karigars(name, karigar_code)
          `)
          .eq('business_id', biz)
          .gte('log_date', monthStart)
          .order('earnings', { ascending: false })
          .limit(5),

        // Active payment promises
        supabase.from('payment_promises')
          .select(`
            id, amount, promise_date, status,
            party:parties(name)
          `)
          .eq('business_id', biz)
          .eq('status', 'pending')
          .order('promise_date', { ascending: true })
          .limit(5),
      ])

      const invoices = invoicesMonth.status === 'fulfilled' ? invoicesMonth.value.data || [] : []
      const receivablesData = receivables.status === 'fulfilled' ? receivables.value.data || [] : []
      const stock = stockRes.status === 'fulfilled' ? stockRes.value.data || [] : []
      const payrolls = payrollRes.status === 'fulfilled' ? payrollRes.value.data || [] : []
      const peshgi = peshgiRes.status === 'fulfilled' ? peshgiRes.value.data || [] : []

      const now = new Date()
      const overdueInvoices = receivablesData.filter(
        (inv: any) => inv.due_date && new Date(inv.due_date) < now
      )

      setData({
        businessName: profile.business_name || 'My Factory',
        industry: profile.industry || 'textile',
        city: profile.city || '',
        tier: profile.tier || 'lite',
        currency: profile.currency || 'PKR',

        presentToday: attendanceToday.status === 'fulfilled' ? attendanceToday.value.count || 0 : 0,
        totalKarigars: karigarsRes.status === 'fulfilled' ? karigarsRes.value.count || 0 : 0,
        absentToday: Math.max(0,
          (karigarsRes.status === 'fulfilled' ? karigarsRes.value.count || 0 : 0) -
          (attendanceToday.status === 'fulfilled' ? attendanceToday.value.count || 0 : 0)
        ),

        revenueThisMonth: invoices.reduce((s: number, i: any) => s + (i.subtotal || 0), 0),
        invoiceCount: invoices.length,
        pendingReceivables: receivablesData.reduce((s: number, i: any) => s + (i.total_amount || 0), 0),
        overdueCount: overdueInvoices.length,

        stockValue: stock.reduce((s: number, i: any) => s + ((i.qty_on_hand || 0) * (i.cost_price || 0)), 0),
        lowStockCount: lowStockRes.status === 'fulfilled' ? lowStockRes.value.count || 0 : 0,

        pendingDispatch: dispatchRes.status === 'fulfilled' ? dispatchRes.value.count || 0 : 0,
        pendingPurchases: purchaseRes.status === 'fulfilled' ? purchaseRes.value.count || 0 : 0,

        totalPayrollThisMonth: payrolls.reduce((s: number, p: any) => s + (p.total_net || 0), 0),
        totalPeshgiOutstanding: peshgi.reduce((s: number, k: any) => s + (k.peshgi_balance || 0), 0),

        recentInvoices: recentInvoicesRes.status === 'fulfilled' ? recentInvoicesRes.value.data || [] : [],
        recentAttendance: recentAttendanceRes.status === 'fulfilled' ? recentAttendanceRes.value.data || [] : [],
        topKarigars: topKarigarsRes.status === 'fulfilled' ? topKarigarsRes.value.data || [] : [],
        promises: promisesRes.status === 'fulfilled' ? promisesRes.value.data || [] : [],
      })

      setLastUpdated(new Date())
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
    const interval = setInterval(loadDashboard, 300000)
    return () => clearInterval(interval)
  }, [loadDashboard])

  const formatCurrency = (n: number) =>
    `${data?.currency || 'PKR'} ${
      n >= 1000000
        ? (n / 1000000).toFixed(1) + 'M'
        : n >= 1000
        ? (n / 1000).toFixed(0) + 'K'
        : n.toLocaleString()
    }`

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/dashboard/login')
  }

  if (loading) return <LoadingScreen />

  if (!data) return (
    <div className="min-h-screen bg-[#040608] flex items-center justify-center text-slate-500 font-mono tracking-widest text-[10px] uppercase">
      Could not load dashboard. Check connection.
    </div>
  )

  return (
    <div className="bg-[#040608] min-h-screen text-[#94A3B8] font-sans pb-32 selection:bg-[#C5A059]/30 selection:text-white relative overflow-hidden">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#C5A059]/[0.015] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#00E5FF]/[0.01] rounded-full blur-[120px]" />
      </div>

      {/* Fixed top accent line */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#C5A059] via-[#00E5FF] to-[#C5A059] z-[100]" />

      {/* ═══ HEADER NAVIGATION ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#040608]/85 backdrop-blur-xl border-b border-white/[0.04] py-4">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-sm">
              <img src="/logos/noxis.png" alt="Noxis Logo" width={20} height={20} className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-extrabold tracking-wider leading-none text-xs">NOXIS REMOTE</span>
              <span className="text-[10px] text-[#C5A059] font-black uppercase mt-0.5 tracking-wider">{data.businessName}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={loadDashboard}
              className="p-2 border border-white/5 hover:border-white/10 rounded-sm transition-all text-slate-500 hover:text-white"
              title="Refresh Data"
            >
              <RefreshCw size={14} className="animate-hover" />
            </button>
            <button
              onClick={handleLogout}
              className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#EF4444] flex items-center space-x-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ MAIN LAYOUT ═══ */}
      <div className="max-w-4xl mx-auto px-6 pt-24">
        
        {/* Status Line */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-650 border-b border-white/[0.03] pb-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>LIVE DATA · UPDATED {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center space-x-3">
            {data.city && (
              <span className="flex items-center gap-1"><MapPin size={10} />{data.city}</span>
            )}
            <span>•</span>
            <span className="text-[#C5A059]">{data.tier.toUpperCase()} TIER</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.04] mb-8 overflow-x-auto scrollbar-none">
          {([
            ['overview', 'Overview'],
            ['people', 'People'],
            ['finance', 'Finance'],
            ['stock', 'Stock'],
          ] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-6 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                activeTab === tab
                  ? 'border-[#C5A059] text-white bg-white/[0.01]'
                  : 'border-transparent text-slate-500 hover:text-slate-350'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        <div className="space-y-8">
          
          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <>
              {/* Warnings Banner */}
              {(data.overdueCount > 0 || data.lowStockCount > 0) && (
                <div className="space-y-3">
                  {data.overdueCount > 0 && (
                    <AlertBanner
                      color="red"
                      message={`${data.overdueCount} invoice${data.overdueCount > 1 ? 's' : ''} overdue`}
                      sub="Outstanding balances require customer follow-up."
                    />
                  )}
                  {data.lowStockCount > 0 && (
                    <AlertBanner
                      color="amber"
                      message={`${data.lowStockCount} SKU${data.lowStockCount > 1 ? 's' : ''} low on stock`}
                      sub="Replenish stock units to avoid floor bottlenecks."
                    />
                  )}
                </div>
              )}

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <KpiCard
                  label="Revenue This Month"
                  value={formatCurrency(data.revenueThisMonth)}
                  sub={`${data.invoiceCount} issued invoices`}
                  accent="text-emerald-400"
                  icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
                />
                <KpiCard
                  label="Outstanding Receivables"
                  value={formatCurrency(data.pendingReceivables)}
                  sub={`${data.overdueCount} overdue items`}
                  accent={data.overdueCount > 0 ? "text-red-400" : "text-slate-500"}
                  icon={<DollarSign className="w-4 h-4 text-[#C5A059]" />}
                />
                <KpiCard
                  label="Attendance Today"
                  value={`${data.presentToday} / ${data.totalKarigars}`}
                  sub={`${data.absentToday} staff absent`}
                  accent="text-[#00E5FF]"
                  icon={<Users className="w-4 h-4 text-[#00E5FF]" />}
                />
                <KpiCard
                  label="Valued Stock"
                  value={formatCurrency(data.stockValue)}
                  sub={`${data.lowStockCount} items at low level`}
                  accent="text-white"
                  icon={<Package className="w-4 h-4 text-slate-500" />}
                />
                <KpiCard
                  label="Pending Dispatch"
                  value={String(data.pendingDispatch)}
                  sub="orders waiting delivery"
                  accent="text-white"
                  icon={<Truck className="w-4 h-4 text-slate-500" />}
                />
                <KpiCard
                  label="Peshgi Outstanding"
                  value={formatCurrency(data.totalPeshgiOutstanding)}
                  sub="advances to recover"
                  accent="text-[#C5A059]"
                  icon={<Lock className="w-4 h-4 text-[#C5A059]" />}
                />
              </div>

              {/* Promises Section */}
              {data.promises.length > 0 && (
                <Section title="Payment Promises Due">
                  {data.promises.map((p: any) => (
                    <RowItem
                      key={p.id}
                      left={p.party?.name || 'Unknown Partner'}
                      right={formatCurrency(p.amount)}
                      sub={`Promise date: ${new Date(p.promise_date).toLocaleDateString('en-PK')}`}
                      accent={new Date(p.promise_date) < new Date() ? 'text-red-400' : 'text-[#C5A059]'}
                      badge={new Date(p.promise_date) < new Date() ? 'overdue' : 'pending'}
                    />
                  ))}
                </Section>
              )}

              {/* Recent Invoices */}
              <Section title="Recent Posted Invoices">
                {data.recentInvoices.length === 0 ? (
                  <EmptyState message="No billing entries posted this month." />
                ) : data.recentInvoices.map((inv: any) => (
                  <RowItem
                    key={inv.id}
                    left={inv.party?.name || 'Walk-in Client'}
                    right={formatCurrency(inv.total_amount)}
                    sub={`${inv.invoice_number} · ${new Date(inv.created_at).toLocaleDateString('en-PK')}`}
                    accent="text-emerald-400"
                    badge={inv.status}
                  />
                ))}
              </Section>
            </>
          )}

          {/* ── PEOPLE TAB ── */}
          {activeTab === 'people' && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <KpiCard
                  label="Active Workers"
                  value={String(data.totalKarigars)}
                  sub="registered floor staff"
                  accent="text-[#00E5FF]"
                />
                <KpiCard
                  label="Present"
                  value={String(data.presentToday)}
                  sub="today"
                  accent="text-emerald-400"
                />
                <KpiCard
                  label="Absent"
                  value={String(data.absentToday)}
                  sub="today"
                  accent={data.absentToday > 0 ? "text-red-400" : "text-slate-500"}
                />
              </div>

              {/* Attendance list */}
              <Section title="Attendance Logs (Today)">
                {data.recentAttendance.length === 0 ? (
                  <EmptyState message="No attendance entries recorded today." />
                ) : data.recentAttendance.map((a: any, i: number) => (
                  <RowItem
                    key={i}
                    left={a.karigar?.name || 'Unknown Staff'}
                    right=""
                    sub=""
                    accent={
                      a.status === 'present'
                        ? 'text-emerald-400'
                        : a.status === 'half'
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }
                    badge={a.status}
                  />
                ))}
              </Section>

              {/* Top Workers Production */}
              <Section title="Top Production (MTD)">
                {data.topKarigars.length === 0 ? (
                  <EmptyState message="No production entries logged this month." />
                ) : data.topKarigars.map((k: any, i: number) => (
                  <RowItem
                    key={i}
                    left={k.karigar?.name || 'Unknown Staff'}
                    right={formatCurrency(k.earnings)}
                    sub={`${k.units_produced?.toLocaleString() || 0} pieces produced · Code: ${k.karigar?.karigar_code || 'N/A'}`}
                    accent="text-[#C5A059]"
                  />
                ))}
              </Section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <KpiCard
                  label="MTD Net Wages"
                  value={formatCurrency(data.totalPayrollThisMonth)}
                  sub="cumulative wages run"
                  accent="text-[#00E5FF]"
                />
                <KpiCard
                  label="Active Peshgi Balances"
                  value={formatCurrency(data.totalPeshgiOutstanding)}
                  sub="total advances given"
                  accent="text-[#C5A059]"
                />
              </div>
            </>
          )}

          {/* ── FINANCE TAB ── */}
          {activeTab === 'finance' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <KpiCard
                  label="Revenue MTD"
                  value={formatCurrency(data.revenueThisMonth)}
                  sub="posted invoices"
                  accent="text-emerald-400"
                />
                <KpiCard
                  label="Total Ledger Balances"
                  value={formatCurrency(data.pendingReceivables)}
                  sub="due customer accounts"
                  accent={data.overdueCount > 0 ? "text-red-400" : "text-slate-500"}
                />
                <KpiCard
                  label="Wages Paid (MTD)"
                  value={formatCurrency(data.totalPayrollThisMonth)}
                  sub="wages run payments"
                  accent="text-[#00E5FF]"
                />
                <KpiCard
                  label="Pending Purchases"
                  value={String(data.pendingPurchases)}
                  sub="POs awaiting receipt"
                  accent="text-amber-400"
                />
              </div>

              {/* Overdue Accounts */}
              <Section title="Overdue Invoices Alert">
                {data.overdueCount === 0 ? (
                  <EmptyState message="All customer accounts have active payment status." />
                ) : (
                  <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-sm flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <p className="text-red-400 font-bold uppercase tracking-wider">
                        {data.overdueCount} customer accounts overdue
                      </p>
                      <p className="text-slate-500 leading-normal font-medium">
                        Open Noxis Hub on your workstation to dispatch automated WhatsApp billing reminders.
                      </p>
                    </div>
                    <ShieldAlert size={18} className="text-red-400 shrink-0" />
                  </div>
                )}
              </Section>

              {/* Promises */}
              <Section title="Payment Promises">
                {data.promises.length === 0 ? (
                  <EmptyState message="No pending payment commitments logged." />
                ) : data.promises.map((p: any) => (
                  <RowItem
                    key={p.id}
                    left={p.party?.name || 'Unknown'}
                    right={formatCurrency(p.amount)}
                    sub={`Promise date: ${new Date(p.promise_date).toLocaleDateString('en-PK')}`}
                    accent={new Date(p.promise_date) < new Date() ? 'text-red-400' : 'text-emerald-400'}
                    badge={new Date(p.promise_date) < new Date() ? 'overdue' : 'pending'}
                  />
                ))}
              </Section>
            </>
          )}

          {/* ── STOCK TAB ── */}
          {activeTab === 'stock' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <KpiCard
                  label="Stock Inventory Value"
                  value={formatCurrency(data.stockValue)}
                  sub="on hand costing basis"
                  accent="text-[#00E5FF]"
                />
                <KpiCard
                  label="Low Stock Warnings"
                  value={String(data.lowStockCount)}
                  sub="items below reorder"
                  accent={data.lowStockCount > 0 ? "text-amber-400" : "text-emerald-400"}
                />
                <KpiCard
                  label="Outbound Orders"
                  value={String(data.pendingDispatch)}
                  sub="units awaiting dispatch"
                  accent="text-white"
                />
                <KpiCard
                  label="Purchases Placed"
                  value={String(data.pendingPurchases)}
                  sub="POs in queue"
                  accent="text-[#C5A059]"
                />
              </div>

              {/* Low stock alerts */}
              {data.lowStockCount > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-sm flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <p className="text-amber-400 font-bold uppercase tracking-wider">
                      {data.lowStockCount} product units require restocking
                    </p>
                    <p className="text-slate-500 leading-normal font-medium">
                      Open Noxis Hub on your workstation to create and issue purchase order slips.
                    </p>
                  </div>
                  <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                </div>
              )}
            </>
          )}

        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@700&display=swap');
        .font-sans { font-family: 'Outfit', sans-serif; }
        .font-mono { font-family: 'JetBrains+Mono', monospace; }
        body { background-color: #040608; }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────
// COMPONENT SHARDS
// ─────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#040608] flex flex-col items-center justify-center gap-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-[#C5A059]/[0.015] rounded-full blur-[80px]" />
      <div className="absolute bottom-1/3 right-1/3 w-[300px] h-[300px] bg-[#00E5FF]/[0.01] rounded-full blur-[80px]" />
      
      <div className="w-8 h-8 border-2 border-slate-700/50 border-t-[#C5A059] rounded-full animate-spin" />
      <div className="flex flex-col items-center space-y-1 z-10">
        <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-[0.2em]">Noxis Control</span>
        <span className="text-slate-500 font-mono tracking-widest text-[9px] uppercase">Retrieving factory ledger logs...</span>
      </div>
    </div>
  )
}

function KpiCard({
  label, value, sub, accent, icon
}: {
  label: string
  value: string
  sub: string
  accent: string
  icon?: React.ReactNode
}) {
  return (
    <div className="bg-[#0A0D10] border border-white/[0.04] p-5 rounded-sm space-y-4">
      <div className="flex items-start justify-between">
        <p className="text-slate-500 text-[9px] font-bold tracking-widest uppercase">
          {label}
        </p>
        {icon}
      </div>
      <div className="space-y-1">
        <p className={`text-2xl font-mono font-black ${accent} tracking-tight`}>
          {value}
        </p>
        <p className="text-slate-650 text-[10px] font-medium leading-none">
          {sub}
        </p>
      </div>
    </div>
  )
}

function AlertBanner({
  color, message, sub
}: {
  color: 'red' | 'amber'
  message: string
  sub: string
}) {
  const colorClass = color === 'red' ? 'text-red-400 bg-red-500/5 border-red-500/10' : 'text-amber-400 bg-amber-500/5 border-amber-500/10'
  const dotColor = color === 'red' ? 'bg-red-400' : 'bg-amber-400'

  return (
    <div className={`border p-4 rounded-sm flex items-center gap-3.5 text-xs ${colorClass}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse shrink-0`} />
      <div className="space-y-0.5">
        <p className="font-bold uppercase tracking-wider">{message}</p>
        <p className="text-slate-500 font-medium">{sub}</p>
      </div>
    </div>
  )
}

function Section({
  title, children
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <p className="text-slate-500 text-[9px] font-bold tracking-[0.2em] uppercase">
        {title}
      </p>
      <div className="bg-[#0A0D10] border border-white/[0.04] rounded-sm divide-y divide-white/[0.03] overflow-hidden">
        {children}
      </div>
    </div>
  )
}

function RowItem({
  left, right, sub, accent, badge
}: {
  left: string
  right: string
  sub: string
  accent: string
  badge?: string
}) {
  return (
    <div className="flex items-center justify-between p-4 gap-4">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-white text-xs sm:text-sm font-semibold truncate uppercase">
          {left}
        </p>
        {sub && (
          <p className="text-slate-500 text-[10px] font-medium leading-none">
            {sub}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {badge && (
          <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm ${accent} bg-white/[0.02] border border-white/[0.04]`}>
            {badge}
          </span>
        )}
        {right && (
          <p className={`text-xs font-mono font-bold ${accent}`}>
            {right}
          </p>
        )}
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-8 text-center">
      <p className="text-slate-650 text-xs font-medium">
        {message}
      </p>
    </div>
  )
}
