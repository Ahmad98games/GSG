'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Shield, Key, Users, DollarSign,
  AlertTriangle, Check, X, RefreshCw,
  TrendingUp, Package, Eye, EyeOff,
  Zap, Clock, ChevronRight
} from 'lucide-react'

// ─── SECURITY CONFIG ───
const ADMIN_PASS =
  process.env.NEXT_PUBLIC_ADMIN_PASS ||
  'noxis-omnora-2026-secure'
const SESSION_KEY = 'noxis_admin_session'
const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8h

function verifySession(): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return false
    const { token, expires } = JSON.parse(raw)
    if (Date.now() > expires) {
      sessionStorage.removeItem(SESSION_KEY)
      return false
    }
    return token === ADMIN_PASS
  } catch {
    return false
  }
}

function createSession(): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    token: ADMIN_PASS,
    expires: Date.now() + SESSION_DURATION,
  }))
}

// ─── LOGIN GATE ───
function AdminLogin({ onSuccess }: {
  onSuccess: () => void
}) {
  const router = useRouter()
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [locked, setLocked] = useState(false)

  const handleLogin = () => {
    if (locked) return

    if (pass === ADMIN_PASS) {
      createSession()
      onSuccess()
    } else {
      const next = attempts + 1
      setAttempts(next)
      setError(`Wrong password. ${3 - next} attempts remaining.`)
      setPass('')

      if (next >= 3) {
        setLocked(true)
        // Redirect to home after 3 failed attempts
        setTimeout(() => router.push('/'), 2000)
        setError('Too many failed attempts. Redirecting...')
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#060708] flex items-center justify-center">
      <div className="w-full max-w-sm px-6">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Shield size={18} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Admin Access</p>
            <p className="text-[9px] text-gray-600 uppercase tracking-widest">
              Noxis Control Panel
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <input
            type="password"
            value={pass}
            onChange={e => {
              setPass(e.target.value)
              setError('')
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') handleLogin()
            }}
            placeholder="Admin password"
            autoFocus
            disabled={locked}
            className="w-full bg-[#161A1F] border border-white/10 text-white text-sm px-4 py-3 outline-none focus:border-red-500/30 placeholder:text-gray-700 disabled:opacity-50"
          />

          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertTriangle size={11} />
              {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={locked || !pass.trim()}
            className="w-full py-3 text-sm font-bold bg-red-500/80 text-white hover:bg-red-500 disabled:opacity-40 transition-colors"
          >
            Authenticate
          </button>
        </div>

        <p className="text-center text-[9px] text-gray-805 mt-8">
          Unauthorized access is logged
        </p>
      </div>
    </div>
  )
}

// ─── STAT CARD ───
function StatCard({ label, value, sub, color, icon }: {
  label: string; value: string | number;
  sub?: string; color: string; icon: React.ReactNode
}) {
  return (
    <div className="p-5 bg-[#0F1114] border border-white/8 rounded-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-mono font-bold text-white mb-1">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
        {label}
      </p>
      {sub && (
        <p className="text-[10px] text-gray-700 mt-1">
          {sub}
        </p>
      )}
    </div>
  )
}

// ─── LICENSE ROW ───
function LicenseRow({
  lic, onDeactivate, onExtend
}: {
  lic: any
  onDeactivate: (id: string) => void
  onExtend: (id: string) => void
}) {
  const expired = lic.expires_at && new Date(lic.expires_at) < new Date()
  const expiresDate = lic.expires_at ? new Date(lic.expires_at) : null
  const now = new Date()
  const daysLeft = expiresDate
    ? Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null

  const isWarning = daysLeft !== null && daysLeft <= 2 && daysLeft > 0

  const TIER_COLOR: Record<string, string> = {
    elite: 'bg-[#C5A059]/15 text-[#C5A059]',
    pro:   'bg-blue-500/15 text-blue-400',
    lite:  'bg-white/10 text-gray-400',
  }

  return (
    <div className={`flex items-center gap-4 px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${lic.is_deactivated ? 'opacity-50' : ''}`}>
      {/* Key */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[11px] font-mono font-bold text-white tracking-wider">
            {lic.license_key}
          </p>
          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${TIER_COLOR[lic.tier] || TIER_COLOR.lite}`}>
            {lic.tier}
          </span>
          {lic.is_trial && (
            <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
              Trial
            </span>
          )}
          {lic.is_deactivated && (
            <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400">
              Deactivated
            </span>
          )}
          {expired && !lic.is_deactivated && (
            <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400">
              Expired
            </span>
          )}
          {isWarning && (
            <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 animate-pulse">
              {daysLeft}d left
            </span>
          )}
        </div>
        <p className="text-[10px] text-gray-500">
          {lic.customer_name || 'No name'}
          {lic.customer_whatsapp ? ` · ${lic.customer_whatsapp}` : ''}
          {lic.amount_paid ? ` · PKR ${lic.amount_paid.toLocaleString()}` : ''}
          {lic.payment_method ? ` via ${lic.payment_method}` : ''}
        </p>
      </div>

      {/* Expiry */}
      <div className="text-right flex-shrink-0 w-28">
        <p className={`text-[10px] font-mono ${expired ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-gray-400'}`}>
          {expiresDate ? expiresDate.toLocaleDateString('en-PK') : 'No expiry'}
        </p>
        <p className="text-[9px] text-gray-700">
          {daysLeft !== null ? (daysLeft > 0 ? `${daysLeft}d remaining` : `${Math.abs(daysLeft)}d ago`) : 'Lifetime'}
        </p>
      </div>

      {/* Devices */}
      <div className="text-center flex-shrink-0 w-16">
        <p className="text-[11px] font-mono text-white">
          {(lic.device_fingerprints || []).length}/{lic.max_devices}
        </p>
        <p className="text-[9px] text-gray-700">devices</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Resend WhatsApp */}
        {lic.customer_whatsapp && !lic.is_deactivated && (
          <a
            href={`https://wa.me/${lic.customer_whatsapp.replace(/\D/g, '').replace(/^0/, '92')}?text=${encodeURIComponent(
              `Assalam o Alaikum ${lic.customer_name || 'Customer'},\n\nYour Noxis license key:\n\n*${lic.license_key}*\n\nDownload: noxishub.app/download\n\n_Omnora Labs_`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-semibold text-[#25D366] border border-[#25D366]/25 px-2.5 py-1.5 hover:bg-[#25D366]/10 transition-colors"
          >
            WA
          </a>
        )}

        {/* Extend 30 days */}
        {!lic.is_deactivated && (
          <button
            onClick={() => onExtend(lic.id)}
            title="Extend 30 days"
            className="text-[9px] font-semibold text-blue-400 border border-blue-500/25 px-2.5 py-1.5 hover:bg-blue-500/10 transition-colors cursor-pointer"
          >
            +30d
          </button>
        )}

        {/* Deactivate / Reactivate */}
        <button
          onClick={() => onDeactivate(lic.id)}
          title={lic.is_deactivated ? 'Reactivate' : 'Deactivate'}
          className={`text-[9px] font-semibold px-2.5 py-1.5 border transition-colors cursor-pointer ${
            lic.is_deactivated
              ? 'text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/10'
              : 'text-red-400 border-red-500/25 hover:bg-red-500/10'
          }`}
        >
          {lic.is_deactivated ? 'Activate' : 'Deactivate'}
        </button>
      </div>
    </div>
  )
}

// ─── MAIN DASHBOARD ───
function AdminDashboard() {
  const supabase = createClient()
  const [licenses, setLicenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'trial' | 'warning'>('all')
  const [search, setSearch] = useState('')
  const [newKeyForm, setNewKeyForm] = useState({
    open: false,
    tier: 'lite',
    customer_name: '',
    customer_whatsapp: '',
    payment_method: 'jazzcash',
    amount_paid: '',
    months: '1',
  })
  const [generating, setGenerating] = useState(false)
  const [generatedKey, setGeneratedKey] = useState('')
  const [tab, setTab] = useState<'licenses' | 'generate'>('licenses')

  const loadLicenses = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false })
    setLicenses(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadLicenses()
  }, [loadLicenses])

  // ── STATS ──
  const now = new Date()
  const active = licenses.filter(l =>
    !l.is_deactivated &&
    !l.is_trial &&
    (!l.expires_at || new Date(l.expires_at) > now)
  )
  const trials = licenses.filter(l =>
    l.is_trial && !l.is_deactivated
  )
  const expired = licenses.filter(l =>
    l.expires_at &&
    new Date(l.expires_at) < now &&
    !l.is_deactivated
  )
  const warning = licenses.filter(l => {
    if (!l.expires_at || l.is_deactivated) return false
    const days = Math.ceil(
      (new Date(l.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    return days <= 2 && days > 0
  })
  const totalRevenue = licenses
    .filter(l => !l.is_trial)
    .reduce((sum, l) => sum + (l.amount_paid || 0), 0)

  // ── FILTER + SEARCH ──
  const filtered = licenses.filter(l => {
    if (filter === 'active')
      return !l.is_deactivated && !l.is_trial && (!l.expires_at || new Date(l.expires_at) > now)
    if (filter === 'expired')
      return l.expires_at && new Date(l.expires_at) < now && !l.is_deactivated
    if (filter === 'trial') return l.is_trial
    if (filter === 'warning') {
      if (!l.expires_at) return false
      const days = Math.ceil(
        (new Date(l.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      return days <= 2 && days > 0
    }
    return true
  }).filter(l => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      l.license_key?.toLowerCase().includes(q) ||
      l.customer_name?.toLowerCase().includes(q) ||
      l.customer_whatsapp?.includes(q)
    )
  })

  // ── DEACTIVATE ──
  const handleDeactivate = async (id: string) => {
    const lic = licenses.find(l => l.id === id)
    if (!lic) return
    const { error } = await supabase
      .from('licenses')
      .update({
        is_deactivated: !lic.is_deactivated
      })
      .eq('id', id)
    if (!error) loadLicenses()
  }

  // ── EXTEND ──
  const handleExtend = async (id: string) => {
    const lic = licenses.find(l => l.id === id)
    if (!lic) return
    const base = lic.expires_at && new Date(lic.expires_at) > new Date()
      ? new Date(lic.expires_at)
      : new Date()
    base.setDate(base.getDate() + 30)
    const { error } = await supabase
      .from('licenses')
      .update({ expires_at: base.toISOString() })
      .eq('id', id)
    if (!error) loadLicenses()
  }

  // ── GENERATE LICENSE ──
  const generateLicense = async () => {
    if (!newKeyForm.customer_name.trim()) return
    setGenerating(true)
    setGeneratedKey('')

    try {
      const prefix =
        newKeyForm.tier === 'elite' ? 'ELIT'
        : newKeyForm.tier === 'pro' ? 'PROP'
        : 'LITE'

      const rand = () => Math.random().toString(36).slice(2, 6).toUpperCase()

      const key = `${prefix}-${rand()}-${rand()}-${rand()}`
      const months = parseInt(newKeyForm.months) || 1

      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + months)

      const maxDevices =
        newKeyForm.tier === 'elite' ? 50
        : newKeyForm.tier === 'pro' ? 15
        : 5

      const { error } = await supabase
        .from('licenses')
        .insert({
          license_key: key,
          tier: newKeyForm.tier,
          is_trial: false,
          is_deactivated: false,
          max_devices: maxDevices,
          expires_at: expiresAt.toISOString(),
          customer_name: newKeyForm.customer_name.trim(),
          customer_whatsapp: newKeyForm.customer_whatsapp.trim() || null,
          payment_method: newKeyForm.payment_method,
          amount_paid: newKeyForm.amount_paid ? parseFloat(newKeyForm.amount_paid) : null,
          currency: 'PKR',
          months,
        })

      if (error) throw error

      setGeneratedKey(key)
      loadLicenses()

      // Auto-send WhatsApp if number provided
      if (newKeyForm.customer_whatsapp) {
        const phone = newKeyForm.customer_whatsapp.replace(/\D/g, '').replace(/^0/, '92')
        const msg = encodeURIComponent(
          `Assalam o Alaikum ${newKeyForm.customer_name},\n\n` +
          `Shukriya for choosing Noxis!\n\n` +
          `Your license key:\n*${key}*\n\n` +
          `Plan: ${newKeyForm.tier.toUpperCase()}\n` +
          `Duration: ${months} month${months > 1 ? 's' : ''}\n` +
          `Devices: ${maxDevices}\n\n` +
          `To activate:\n` +
          `1. noxishub.app/download\n` +
          `2. Enter this key\n` +
          `3. Install and open Noxis Hub\n\n` +
          `For help: reply to this message.\n\n` +
          `_Omnora Labs | Noxis Hub_`
        )
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
      }

    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  const FIELD_CLASS = `w-full bg-[#0F1114] border border-white/8 text-white text-sm px-3 py-2.5 outline-none focus:border-red-500/30 transition-colors`

  const LABEL_CLASS = `text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5`

  return (
    <div className="min-h-screen bg-[#060708] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between sticky top-0 z-10 bg-[#060708]/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Shield size={15} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Noxis Admin</p>
            <p className="text-[9px] text-gray-500">Control Panel · Omnora Labs</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadLicenses}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
          <button
            onClick={() => {
              sessionStorage.removeItem(SESSION_KEY)
              window.location.reload()
            }}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard
            label="Active Licenses"
            value={active.length}
            sub="Paying customers"
            color="bg-emerald-500/10"
            icon={<Check size={16} className="text-emerald-400" />}
          />
          <StatCard
            label="Trial Active"
            value={trials.length}
            sub="In evaluation"
            color="bg-amber-500/10"
            icon={<Clock size={16} className="text-amber-400" />}
          />
          <StatCard
            label="Expired"
            value={expired.length}
            sub="Renewal needed"
            color="bg-red-500/10"
            icon={<AlertTriangle size={16} className="text-red-400" />}
          />
          <StatCard
            label="Expiring Soon"
            value={warning.length}
            sub="Within 2 days"
            color="bg-orange-500/10"
            icon={<Zap size={16} className="text-orange-400" />}
          />
          <StatCard
            label="Total Revenue"
            value={`PKR ${(totalRevenue/1000).toFixed(0)}k`}
            sub={`${licenses.filter(l=>!l.is_trial).length} paid licenses`}
            color="bg-blue-500/10"
            icon={<DollarSign size={16} className="text-blue-400" />}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6">
          {[
            { key: 'licenses', label: 'All Licenses', icon: <Key size={13} /> },
            { key: 'generate', label: 'Generate Key', icon: <Zap size={13} /> },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold border transition-colors cursor-pointer ${
                tab === t.key
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-[#0F1114] border-white/8 text-gray-500 hover:border-white/18'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'licenses' && (
          <div className="bg-[#0A0C0F] border border-white/[0.06] rounded-sm">
            {/* Filters + search */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] flex-wrap">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search key, name, phone..."
                className="bg-[#161A1F] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-white/20 w-56"
              />
              {[
                { key: 'all', label: `All (${licenses.length})` },
                { key: 'active', label: `Active (${active.length})` },
                { key: 'trial', label: `Trial (${trials.length})` },
                { key: 'warning', label: `⚠ Expiring (${warning.length})` },
                { key: 'expired', label: `Expired (${expired.length})` },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key as any)}
                  className={`text-[10px] font-semibold px-3 py-1.5 border transition-colors cursor-pointer ${
                    filter === f.key
                      ? 'border-red-500/30 text-red-400 bg-red-500/8'
                      : 'border-white/8 text-gray-500 hover:border-white/18'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* License list */}
            {loading ? (
              <div className="py-16 text-center">
                <div className="w-6 h-6 border-2 border-white/15 border-t-red-400 rounded-full animate-spin mx-auto" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-gray-500">No licenses found</p>
              </div>
            ) : (
              filtered.map(lic => (
                <LicenseRow
                  key={lic.id}
                  lic={lic}
                  onDeactivate={handleDeactivate}
                  onExtend={handleExtend}
                />
              ))
            )}
          </div>
        )}

        {tab === 'generate' && (
          <div className="max-w-lg">
            <div className="p-6 bg-[#0A0C0F] border border-white/[0.06] rounded-sm space-y-4">
              <p className="text-sm font-bold text-white">Generate License Key</p>

              {/* Plan */}
              <div>
                <label className={LABEL_CLASS}>Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'lite', label: 'Lite', price: 'PKR 2,500', devices: '5 devices' },
                    { value: 'pro', label: 'Pro', price: 'PKR 6,500', devices: '15 devices' },
                    { value: 'elite', label: 'Elite', price: 'PKR 14,000', devices: '50 devices' },
                  ].map(p => (
                    <button
                      key={p.value}
                      onClick={() =>
                        setNewKeyForm(f => ({ ...f, tier: p.value }))
                      }
                      className={`p-3 text-center border rounded-sm transition-colors cursor-pointer ${
                        newKeyForm.tier === p.value
                          ? 'border-red-500/40 bg-red-500/8 text-red-400'
                          : 'border-white/8 text-gray-500 hover:border-white/18'
                      }`}
                    >
                      <p className="text-xs font-bold">{p.label}</p>
                      <p className="text-[9px] text-gray-600 mt-0.5">{p.price}</p>
                      <p className="text-[9px] text-gray-700">{p.devices}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className={LABEL_CLASS}>Duration</label>
                <select
                  value={newKeyForm.months}
                  onChange={e =>
                    setNewKeyForm(f => ({ ...f, months: e.target.value }))
                  }
                  className={FIELD_CLASS}
                >
                  {[1,2,3,6,12].map(m => (
                    <option key={m} value={m}>
                      {m} month{m>1?'s':''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer name */}
              <div>
                <label className={LABEL_CLASS}>Customer Name *</label>
                <input
                  type="text"
                  value={newKeyForm.customer_name}
                  onChange={e =>
                    setNewKeyForm(f => ({ ...f, customer_name: e.target.value }))
                  }
                  placeholder="Ahmad Mahboob"
                  className={FIELD_CLASS}
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className={LABEL_CLASS}>WhatsApp Number</label>
                <input
                  type="tel"
                  value={newKeyForm.customer_whatsapp}
                  onChange={e =>
                    setNewKeyForm(f => ({ ...f, customer_whatsapp: e.target.value }))
                  }
                  placeholder="03001234567"
                  className={FIELD_CLASS}
                />
              </div>

              {/* Payment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASS}>Payment Method</label>
                  <select
                    value={newKeyForm.payment_method}
                    onChange={e =>
                      setNewKeyForm(f => ({ ...f, payment_method: e.target.value }))
                    }
                    className={FIELD_CLASS}
                  >
                    <option value="jazzcash">JazzCash</option>
                    <option value="easypaisa">EasyPaisa</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Amount (PKR)</label>
                  <input
                    type="number"
                    value={newKeyForm.amount_paid}
                    onChange={e =>
                      setNewKeyForm(f => ({ ...f, amount_paid: e.target.value }))
                    }
                    placeholder="2500"
                    className={FIELD_CLASS}
                  />
                </div>
              </div>

              <button
                onClick={generateLicense}
                disabled={generating || !newKeyForm.customer_name.trim()}
                className="w-full py-3 text-sm font-bold bg-red-500/80 text-white hover:bg-red-500 disabled:opacity-40 transition-colors cursor-pointer"
              >
                {generating ? 'Generating...' : 'Generate & Send WhatsApp'}
              </button>

              {generatedKey && (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-sm">
                  <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-2">
                    ✓ Key Generated
                  </p>
                  <p className="text-base font-mono font-bold text-white tracking-widest">
                    {generatedKey}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedKey)
                    }}
                    className="mt-2 text-[9px] text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    Click to copy
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PAGE EXPORT ───
export default function AdminDashboardPage() {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (verifySession()) setAuthed(true)
    setChecking(false)
  }, [])

  if (checking) return (
    <div className="min-h-screen bg-[#060708] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-white/10 border-t-red-400 rounded-full animate-spin" />
    </div>
  )

  if (!authed) return (
    <AdminLogin onSuccess={() => setAuthed(true)} />
  )

  return <AdminDashboard />
}
