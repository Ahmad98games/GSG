'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Flame,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react'

const ADMIN_TOKEN = 'noxis-admin-2026'

function generateLicenseKey(tier: string): string {
  const prefix =
    tier === 'elite' ? 'ELIT'
    : tier === 'pro' ? 'PROP'
    : 'LITE'
  const rand = () =>
    Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}-${rand()}-${rand()}-${rand()}`
}

const TIER_CONFIG = {
  lite:  { maxDevices: 5,  label: 'Lite (5 devices)',   monthlyPrice: 1999, yearlyPrice: 18000, lifetimePrice: 72000 },
  pro:   { maxDevices: 15, label: 'Pro (15 devices)',    monthlyPrice: 4999, yearlyPrice: 45000, lifetimePrice: 135000 },
  elite: { maxDevices: 50, label: 'Elite (50 devices)',  monthlyPrice: 9999, yearlyPrice: 90000, lifetimePrice: 225000 },
}

function buildWhatsAppMessage(
  customerName: string,
  key: string,
  tier: string,
  months: string
) {
  const tierLabel = TIER_CONFIG[tier as keyof typeof TIER_CONFIG]?.label || tier
  return encodeURIComponent(
    `Assalam o Alaikum ${customerName},\n\n` +
    `Shukriya for choosing Noxis Hub! 🙏\n\n` +
    `Your license key is ready:\n\n` +
    `*${key}*\n\n` +
    `Plan: ${tierLabel}\n` +
    `Duration: ${months} month${parseInt(months) > 1 ? 's' : ''}\n\n` +
    `To activate:\n` +
    `1. Download: noxishub.app/download\n` +
    `2. Enter this key on the download page\n` +
    `3. Install Noxis Hub on your Windows PC\n` +
    `4. Enter the same key when the app opens\n\n` +
    `Need help? Reply to this message.\n\n` +
    `_Noxis Hub | Omnora Labs_`
  )
}

function buildRenewalWhatsAppOffer(
  customerName: string,
  tier: string,
  cycle: string,
  expiresAt: string | null
) {
  const tierName = tier.charAt(0).toUpperCase() + tier.slice(1)
  const expiredDate = expiresAt ? new Date(expiresAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : 'recently'
  const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.pro

  return encodeURIComponent(
    `Assalam o Alaikum ${customerName},\n\n` +
    `This is Ahmad from Noxis Hub / Omnora Labs. 👋\n\n` +
    `We noticed your *${tierName} (${cycle})* software plan completed on ${expiredDate}, and your workstation has automatically switched to Free mode.\n\n` +
    `Your store data and POS billing remain 100% safe. Here is a special renewal offer to restore Cloud Sync, Multi-Device, and CCTV AI:\n\n` +
    `• *Monthly Renewal:* PKR ${config.monthlyPrice.toLocaleString()}/mo\n` +
    `• *Annual Plan (Save 25%):* PKR ${config.yearlyPrice.toLocaleString()}/year\n\n` +
    `Would you like me to extend your license today? Reply here and I'll send your activation confirmation immediately.\n\n` +
    `_Noxis Hub Support Desk | +92 326 4742678_`
  )
}

function AdminLicensesContent() {
  const params = useSearchParams()
  const supabase = createClient()
  const [licenses, setLicenses] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [filterTab, setFilterTab] = useState<'all' | 'ended' | 'expiring' | 'monthly' | 'yearly'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [form, setForm] = useState({
    tier: 'pro',
    billing_cycle: 'monthly',
    customer_name: '',
    customer_whatsapp: '',
    customer_email: '',
    payment_method: 'jazzcash',
    amount_paid: '4999',
    months: '1',
    notes: '',
  })
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [copied, setCopied] = useState(false)
  const [loadingLicenses, setLoadingLicenses] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  useEffect(() => {
    loadLicenses()
    loadExpiryAlerts()
  }, [])

  const loadLicenses = async () => {
    setLoadingLicenses(true)
    const { data } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    setLicenses(data || [])
    setLoadingLicenses(false)
  }

  const loadExpiryAlerts = async () => {
    try {
      const res = await fetch('/api/license/notify-expiry')
      if (res.ok) {
        const json = await res.json()
        setAlerts(json.alerts || [])
      }
    } catch (e) {
      console.warn('Failed to fetch plan alerts:', e)
    }
  }

  // Quick Action: Extend license duration (+1 Month or +1 Year)
  const extendLicense = async (lic: any, addedMonths: number) => {
    setActionLoadingId(lic.id)
    try {
      const currentExpiry = lic.expires_at ? new Date(lic.expires_at) : new Date()
      const baseDate = currentExpiry > new Date() ? currentExpiry : new Date()
      baseDate.setMonth(baseDate.getMonth() + addedMonths)

      const { error } = await supabase
        .from('licenses')
        .update({
          expires_at: baseDate.toISOString(),
          is_deactivated: false,
          notes: `${lic.notes || ''} | Extended +${addedMonths}mo on ${new Date().toISOString()}`.trim(),
        })
        .eq('id', lic.id)

      if (error) throw error
      await loadLicenses()
      await loadExpiryAlerts()
    } catch (err: any) {
      alert('Extension failed: ' + err.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Quick Action: Toggle Deactivation
  const toggleDeactivate = async (lic: any) => {
    setActionLoadingId(lic.id)
    try {
      const nextState = !lic.is_deactivated
      const { error } = await supabase
        .from('licenses')
        .update({
          is_deactivated: nextState,
          notes: `${lic.notes || ''} | ${nextState ? 'Manually Deactivated' : 'Manually Reactivated'} on ${new Date().toISOString()}`.trim(),
        })
        .eq('id', lic.id)

      if (error) throw error
      await loadLicenses()
    } catch (err: any) {
      alert('Status change failed: ' + err.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const createLicense = async () => {
    if (!form.customer_name.trim()) return
    setCreating(true)
    setNewKey('')

    try {
      const key = generateLicenseKey(form.tier)
      const expiresAt = new Date()
      const months = form.billing_cycle === 'yearly' ? 12 : form.billing_cycle === 'lifetime' ? 1200 : parseInt(form.months) || 1
      expiresAt.setMonth(expiresAt.getMonth() + months)

      const isLifetime = form.billing_cycle === 'lifetime'

      const { error } = await supabase
        .from('licenses')
        .insert({
          license_key: key,
          tier: form.tier,
          is_trial: false,
          max_devices: TIER_CONFIG[form.tier as keyof typeof TIER_CONFIG].maxDevices,
          expires_at: isLifetime ? null : expiresAt.toISOString(),
          customer_name: form.customer_name.trim(),
          customer_email: form.customer_email.trim() || null,
          customer_whatsapp: form.customer_whatsapp.trim() || null,
          payment_method: form.payment_method,
          amount_paid: form.amount_paid ? parseFloat(form.amount_paid) : null,
          currency: 'PKR',
          notes: `Billing: ${form.billing_cycle.toUpperCase()} | ${form.notes.trim()}`.trim(),
        })

      if (error) throw error

      setNewKey(key)
      loadLicenses()

      setForm(p => ({
        ...p,
        customer_name: '',
        customer_whatsapp: '',
        customer_email: '',
        amount_paid: '4999',
        notes: '',
      }))
    } catch (err: any) {
      alert('Error creating license: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  // Calculate self-detected metrics
  const now = Date.now()
  const analyzedLicenses = licenses.map(lic => {
    const expiresMs = lic.expires_at ? new Date(lic.expires_at).getTime() : null
    const createdMs = lic.created_at ? new Date(lic.created_at).getTime() : now
    const durationDays = expiresMs ? Math.max(1, Math.round((expiresMs - createdMs) / 86400000)) : 9999
    const isExpired = expiresMs ? now >= expiresMs : false
    const daysLeft = expiresMs ? Math.ceil((expiresMs - now) / 86400000) : 9999
    const isDeactivated = Boolean(lic.is_deactivated || isExpired)

    let cycle = 'monthly'
    if (!expiresMs) cycle = 'lifetime'
    else if (durationDays > 100) cycle = 'yearly'
    else if (lic.is_trial) cycle = 'trial'

    let percentElapsed = 0
    if (expiresMs && expiresMs > createdMs) {
      percentElapsed = Math.min(100, Math.max(0, Math.round(((now - createdMs) / (expiresMs - createdMs)) * 100)))
      if (isExpired) percentElapsed = 100
    }

    return {
      ...lic,
      cycle,
      durationDays,
      daysLeft,
      isExpired,
      isDeactivated,
      percentElapsed,
    }
  })

  // Filtering
  const filteredLicenses = analyzedLicenses.filter(lic => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchName = lic.customer_name?.toLowerCase().includes(q)
      const matchKey = lic.license_key?.toLowerCase().includes(q)
      const matchPhone = lic.customer_whatsapp?.includes(q)
      if (!matchName && !matchKey && !matchPhone) return false
    }

    if (filterTab === 'ended') return lic.isExpired || lic.is_deactivated
    if (filterTab === 'expiring') return !lic.isExpired && lic.daysLeft <= 7 && lic.daysLeft >= 0
    if (filterTab === 'monthly') return lic.cycle === 'monthly'
    if (filterTab === 'yearly') return lic.cycle === 'yearly'
    return true
  })

  // High urgency plan ended alerts
  const expiredPlans = analyzedLicenses.filter(l => l.isExpired || l.is_deactivated)
  const expiringSoonPlans = analyzedLicenses.filter(l => !l.isExpired && l.daysLeft <= 7 && l.daysLeft >= 0)

  const monthlyCount = analyzedLicenses.filter(l => l.cycle === 'monthly' && !l.isExpired).length
  const yearlyCount = analyzedLicenses.filter(l => l.cycle === 'yearly' && !l.isExpired).length
  const totalRevenue = licenses.filter(l => !l.is_trial).reduce((sum, l) => sum + (l.amount_paid || 0), 0)

  const FIELD = `w-full bg-[#0A0C0F] border border-white/8 text-white text-sm px-3 py-2.5 outline-none focus:border-[#60A5FA]/50 transition-colors rounded-sm`
  const LABEL = `text-[10px] font-semibold uppercase tracking-widest text-gray-500 block mb-1.5`

  return (
    <div className="min-h-screen bg-[#060708] text-white">
      {/* Top bar */}
      <div className="border-b border-white/[0.05] px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
            Intelligence Center · Admin
          </span>
          <span className="text-[10px] text-gray-700">|</span>
          <span className="text-[10px] text-gray-400 font-mono">Noxis Licensing & Plan Watchdog</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-gray-400">
            Active MRR: <strong className="text-white">PKR {(monthlyCount * 4999).toLocaleString()}</strong>
          </span>
          <span className="text-gray-700">|</span>
          <span className="text-gray-400">
            Total Revenue: <strong className="text-emerald-400">PKR {totalRevenue.toLocaleString()}</strong>
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* ─── LIVE NOTIFICATION BAR: PLAN ENDED ALERTS ─── */}
        {expiredPlans.length > 0 && (
          <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-sm shadow-xl animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <ShieldAlert size={18} className="text-red-400 animate-bounce" />
                <h3 className="text-sm font-black text-red-300 tracking-wide">
                  🚨 {expiredPlans.length} User Plan{expiredPlans.length > 1 ? 's' : ''} Ended & Software Deactivated
                </h3>
              </div>
              <span className="text-[10px] font-mono text-red-400/80 uppercase tracking-widest">
                Action Required · 1-Click Renewal Desk
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {expiredPlans.slice(0, 3).map((lic) => (
                <div key={lic.id} className="p-3 bg-[#0F1114] border border-red-500/20 rounded-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                      <span className="truncate">{lic.customer_name || 'Customer'}</span>
                      <span className="text-[9px] font-mono uppercase bg-red-500/20 text-red-400 px-1.5 py-0.2 rounded">
                        {lic.tier} · {lic.cycle}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-mono">
                      Completed: {lic.expires_at ? new Date(lic.expires_at).toLocaleDateString('en-PK') : 'Expired'}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Timespan: {lic.durationDays} Days · Deactivated to Free
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                    {lic.customer_whatsapp ? (
                      <a
                        href={`https://wa.me/${lic.customer_whatsapp.replace(/\D/g, '').replace(/^0/, '92')}?text=${buildRenewalWhatsAppOffer(lic.customer_name || 'Customer', lic.tier, lic.cycle, lic.expires_at)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1 px-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-[10px] font-bold rounded-sm text-center flex items-center justify-center gap-1 transition-colors"
                      >
                        <MessageCircle size={12} />
                        <span>Send WhatsApp Offer</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-gray-600">No WhatsApp</span>
                    )}

                    <button
                      onClick={() => extendLicense(lic, 1)}
                      disabled={actionLoadingId === lic.id}
                      className="py-1 px-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-[10px] font-bold rounded-sm transition-colors"
                      title="Add 1 Month duration"
                    >
                      +1 Mo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── INTELLIGENCE RADAR SUMMARY ─── */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-[#0F1114] border border-white/8 rounded-sm">
            <div className="flex items-center justify-between text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-2">
              <span>Monthly Subscribers</span>
              <Calendar size={13} className="text-blue-400" />
            </div>
            <p className="text-2xl font-mono font-bold text-white">{monthlyCount}</p>
            <p className="text-[10px] text-gray-600 mt-1">30-day recurring active plans</p>
          </div>

          <div className="p-4 bg-[#0F1114] border border-white/8 rounded-sm">
            <div className="flex items-center justify-between text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-2">
              <span>Annual Subscribers</span>
              <Sparkles size={13} className="text-purple-400" />
            </div>
            <p className="text-2xl font-mono font-bold text-white">{yearlyCount}</p>
            <p className="text-[10px] text-gray-600 mt-1">365-day annual commitments</p>
          </div>

          <div className="p-4 bg-[#0F1114] border border-white/8 rounded-sm">
            <div className="flex items-center justify-between text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-2">
              <span>Expiring in 7 Days</span>
              <Clock size={13} className="text-amber-400" />
            </div>
            <p className="text-2xl font-mono font-bold text-amber-400">{expiringSoonPlans.length}</p>
            <p className="text-[10px] text-gray-600 mt-1">Renewal reach-out window</p>
          </div>

          <div className="p-4 bg-[#0F1114] border border-white/8 rounded-sm">
            <div className="flex items-center justify-between text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-2">
              <span>Ended / Deactivated</span>
              <AlertTriangle size={13} className="text-red-400" />
            </div>
            <p className="text-2xl font-mono font-bold text-red-400">{expiredPlans.length}</p>
            <p className="text-[10px] text-gray-600 mt-1">Requires immediate renewal reach-out</p>
          </div>
        </div>

        {/* ─── MAIN TWO-COLUMN CONTENT ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Generate License (5 cols) */}
          <div className="lg:col-span-5 bg-[#0F1114] border border-white/8 p-6 rounded-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h2 className="text-sm font-bold text-white">Generate Intelligent License</h2>
              <span className="text-[10px] text-gray-500 font-mono">HWID-Bound</span>
            </div>

            {/* Plan Tier */}
            <div>
              <label className={LABEL}>Plan Tier</label>
              <select
                value={form.tier}
                onChange={e => {
                  const t = e.target.value
                  const cycle = form.billing_cycle
                  const price = cycle === 'yearly' ? TIER_CONFIG[t as keyof typeof TIER_CONFIG].yearlyPrice : TIER_CONFIG[t as keyof typeof TIER_CONFIG].monthlyPrice
                  setForm(p => ({ ...p, tier: t, amount_paid: String(price) }))
                }}
                className={FIELD}
              >
                <option value="lite">Lite — 5 Devices (PKR 1,999/mo · 18k/yr)</option>
                <option value="pro">Pro — 15 Devices + CCTV (PKR 4,999/mo · 45k/yr)</option>
                <option value="elite">Elite — 50 Devices + Multi-Branch (PKR 9,999/mo · 90k/yr)</option>
              </select>
            </div>

            {/* Billing Cycle / Timespan */}
            <div>
              <label className={LABEL}>Billing Cycle / Timespan</label>
              <select
                value={form.billing_cycle}
                onChange={e => {
                  const cycle = e.target.value
                  const t = form.tier as keyof typeof TIER_CONFIG
                  const price = cycle === 'yearly' ? TIER_CONFIG[t].yearlyPrice : cycle === 'lifetime' ? TIER_CONFIG[t].lifetimePrice : TIER_CONFIG[t].monthlyPrice
                  setForm(p => ({ ...p, billing_cycle: cycle, amount_paid: String(price) }))
                }}
                className={FIELD}
              >
                <option value="monthly">Monthly Subscription (30 Days Active Timespan)</option>
                <option value="yearly">Annual Subscription (365 Days · Save 25%)</option>
                <option value="lifetime">Permanent Lifetime License (Motherboard-Locked)</option>
              </select>
            </div>

            {/* Customer Name */}
            <div>
              <label className={LABEL}>Customer / Business Name *</label>
              <input
                type="text"
                value={form.customer_name}
                onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))}
                placeholder="e.g. Tariq Textiles Faisalabad"
                className={FIELD}
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className={LABEL}>WhatsApp Number (for automated delivery)</label>
              <input
                type="tel"
                value={form.customer_whatsapp}
                onChange={e => setForm(p => ({ ...p, customer_whatsapp: e.target.value }))}
                placeholder="03001234567"
                className={FIELD}
              />
            </div>

            {/* Amount Paid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Payment Method</label>
                <select value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))} className={FIELD}>
                  <option value="jazzcash">JazzCash</option>
                  <option value="easypaisa">EasyPaisa</option>
                  <option value="nayapay">NayaPay</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cash">Cash Counter</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Amount Paid (PKR)</label>
                <input
                  type="number"
                  value={form.amount_paid}
                  onChange={e => setForm(p => ({ ...p, amount_paid: e.target.value }))}
                  className={FIELD}
                />
              </div>
            </div>

            {/* Internal Notes */}
            <div>
              <label className={LABEL}>Internal Notes (Optional)</label>
              <input
                type="text"
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="e.g. Referred by Imran; 2 thermal printers"
                className={FIELD}
              />
            </div>

            <button
              onClick={createLicense}
              disabled={creating || !form.customer_name.trim()}
              className="w-full py-3 bg-[#60A5FA] hover:bg-blue-400 text-black font-bold text-xs uppercase tracking-wider rounded-sm transition-all disabled:opacity-50"
            >
              {creating ? 'Issuing & Binding...' : '⚡ Generate & Activate License'}
            </button>

            {/* Key Generated Result */}
            {newKey && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-sm space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Key Generated Successfully
                </p>
                <p className="text-sm font-mono font-bold text-white tracking-widest select-all bg-black/40 p-2 rounded">
                  {newKey}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newKey)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="flex-1 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
                  >
                    {copied ? '✓ Copied' : 'Copy Key'}
                  </button>
                  {form.customer_whatsapp && (
                    <a
                      href={`https://wa.me/${form.customer_whatsapp.replace(/\D/g, '').replace(/^0/, '92')}?text=${buildWhatsAppMessage(form.customer_name, newKey, form.tier, form.billing_cycle === 'yearly' ? '12' : '1')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 text-xs font-bold bg-[#25D366] text-black rounded text-center flex items-center justify-center gap-1"
                    >
                      <MessageCircle size={13} /> WhatsApp Key
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Licenses List with Intelligence Indicators (7 cols) */}
          <div className="lg:col-span-7 bg-[#0F1114] border border-white/8 p-6 rounded-sm flex flex-col">
            {/* Header & Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">License Lifecycle Explorer</h2>
                <span className="text-xs text-gray-500 font-mono">({filteredLicenses.length})</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-2.5 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search customer, key..."
                    className="pl-7 pr-3 py-1.5 text-xs bg-[#060708] border border-white/10 text-white rounded-sm outline-none focus:border-blue-400 w-36"
                  />
                </div>
                <button
                  onClick={() => { loadLicenses(); loadExpiryAlerts(); }}
                  className="p-1.5 text-gray-400 hover:text-white bg-white/5 rounded-sm"
                  title="Refresh"
                >
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 text-[10px] font-mono">
              {[
                { key: 'all', label: 'All Licenses' },
                { key: 'ended', label: `Plan Ended (${expiredPlans.length})`, badge: expiredPlans.length > 0 ? 'bg-red-500/20 text-red-300' : '' },
                { key: 'expiring', label: `Expiring Soon (${expiringSoonPlans.length})` },
                { key: 'monthly', label: `Monthly (${monthlyCount})` },
                { key: 'yearly', label: `Annual (${yearlyCount})` },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilterTab(tab.key as any)}
                  className={`px-2.5 py-1 rounded-sm uppercase tracking-wider transition-colors ${
                    filterTab === tab.key
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="space-y-3 overflow-y-auto flex-1 max-h-[620px] pr-1">
              {loadingLicenses ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-20 bg-white/5 rounded-sm animate-pulse" />
                  ))}
                </div>
              ) : filteredLicenses.length === 0 ? (
                <div className="text-center py-16 text-gray-600 text-xs">
                  No licenses matching filter.
                </div>
              ) : (
                filteredLicenses.map(lic => {
                  return (
                    <div
                      key={lic.id}
                      className={`p-3.5 bg-[#14171C] border rounded-sm transition-all ${
                        lic.isExpired || lic.is_deactivated
                          ? 'border-red-500/30 bg-red-950/10'
                          : lic.daysLeft <= 7
                          ? 'border-amber-500/30'
                          : 'border-white/6 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">
                              {lic.customer_name || 'Anonymous User'}
                            </span>
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded ${
                              lic.tier === 'elite' ? 'bg-[#C5A059]/20 text-[#C5A059]'
                              : lic.tier === 'pro' ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-white/10 text-gray-300'
                            }`}>
                              {lic.tier}
                            </span>
                            <span className="text-[8px] font-mono uppercase bg-white/5 text-gray-400 px-1.5 py-0.2 rounded">
                              {lic.cycle}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                            Key: <strong className="text-gray-200">{lic.license_key}</strong>
                            {lic.customer_whatsapp && ` · 📲 ${lic.customer_whatsapp}`}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="text-right">
                          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full inline-block ${
                            lic.isExpired || lic.is_deactivated
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : lic.daysLeft <= 7
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {lic.isExpired ? 'Plan Ended (Deactivated)' : lic.cycle === 'lifetime' ? 'Permanent' : `${lic.daysLeft}d Remaining`}
                          </span>
                        </div>
                      </div>

                      {/* Visual Timespan Progress Bar */}
                      {lic.cycle !== 'lifetime' && (
                        <div className="my-2 space-y-1">
                          <div className="flex justify-between text-[9px] font-mono text-gray-500">
                            <span>Timespan: {lic.durationDays}d</span>
                            <span>{lic.percentElapsed}% Elapsed</span>
                          </div>
                          <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                lic.isExpired ? 'bg-red-500' : lic.daysLeft <= 7 ? 'bg-amber-400' : 'bg-emerald-400'
                              }`}
                              style={{ width: `${lic.percentElapsed}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                        <span className="text-[10px] text-gray-500">
                          {lic.amount_paid ? `PKR ${Number(lic.amount_paid).toLocaleString()} via ${lic.payment_method}` : 'Comp / Trial'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {lic.customer_whatsapp && (
                            <a
                              href={`https://wa.me/${lic.customer_whatsapp.replace(/\D/g, '').replace(/^0/, '92')}?text=${buildRenewalWhatsAppOffer(lic.customer_name || 'Customer', lic.tier, lic.cycle, lic.expires_at)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] text-[10px] rounded transition-colors"
                              title="Send WhatsApp renewal offer"
                            >
                              📲 Offer
                            </a>
                          )}

                          <button
                            onClick={() => extendLicense(lic, 1)}
                            disabled={actionLoadingId === lic.id}
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] rounded transition-colors"
                            title="Extend plan by 1 month"
                          >
                            +1 Mo
                          </button>

                          <button
                            onClick={() => extendLicense(lic, 12)}
                            disabled={actionLoadingId === lic.id}
                            className="px-2 py-1 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 text-[10px] rounded transition-colors"
                            title="Extend plan by 1 year"
                          >
                            +1 Yr
                          </button>

                          <button
                            onClick={() => toggleDeactivate(lic)}
                            disabled={actionLoadingId === lic.id}
                            className={`px-2 py-1 text-[10px] rounded transition-colors ${
                              lic.is_deactivated
                                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            }`}
                            title="Toggle active / deactivated status"
                          >
                            {lic.is_deactivated ? 'Activate' : 'Deactivate'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function AdminLicensesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#060708] flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-[#60A5FA] animate-ping" />
      </div>
    }>
      <AdminLicensesContent />
    </Suspense>
  )
}
