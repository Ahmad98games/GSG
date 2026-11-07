'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Copy,
  Laptop,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Zap,
  Ban,
  UserCheck,
  UserX,
} from 'lucide-react'

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
  lite:  { maxDevices: 5,  label: 'Lite (5 devices)',   monthlyPrice: 1999, yearlyPrice: 18000, lifetimePrice: 45000 },
  pro:   { maxDevices: 15, label: 'Pro (15 devices)',    monthlyPrice: 4999, yearlyPrice: 45000, lifetimePrice: 95000 },
  elite: { maxDevices: 50, label: 'Elite (50 devices)',  monthlyPrice: 9999, yearlyPrice: 90000, lifetimePrice: 149999 },
}

function extractHwid(notes: string = '', licenseKey: string = ''): string {
  const match = notes.match(/HWID:\s*([^\s|]+)/i)
  if (match && match[1]) return match[1].trim()
  if (licenseKey.startsWith('NOX-') || licenseKey.startsWith('HW-')) return licenseKey
  return 'Auto-Bound On First Boot'
}

function extractBrand(notes: string = '', customerName: string = ''): string {
  const match = notes.match(/Brand:\s*([^|]+)/i)
  if (match && match[1]) return match[1].trim()
  return `${customerName}'s Business`
}

function buildWhatsAppMessage(
  customerName: string,
  brandName: string,
  key: string,
  tier: string,
  months: string
) {
  const tierLabel = TIER_CONFIG[tier as keyof typeof TIER_CONFIG]?.label || tier
  return encodeURIComponent(
    `Assalam o Alaikum ${customerName} (${brandName}),\n\n` +
    `Your Noxis Hub workstation license is active! 🚀\n\n` +
    `*License Key: ${key}*\n` +
    `Plan: ${tierLabel}\n` +
    `Duration: ${months} month${parseInt(months) > 1 ? 's' : ''}\n\n` +
    `Installation Instructions:\n` +
    `1. Download software: noxishub.app/download\n` +
    `2. Launch Noxis Hub on your Windows PC\n` +
    `3. Your Hardware ID will automatically bind to this license.\n\n` +
    `Need setup assistance? Reply to this message.\n\n` +
    `_Noxis Hub Security Desk | Omnora Labs_`
  )
}

function AdminLicensesContent() {
  const supabase = createClient()
  const [licenses, setLicenses] = useState<any[]>([])
  const [filterTab, setFilterTab] = useState<'all' | 'banned' | 'active' | 'expiring' | 'trials'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Clean Zero-Email Form: Pure User Name, Brand Name, WhatsApp & Hardware ID
  const [form, setForm] = useState({
    customer_name: '',
    brand_name: '',
    customer_whatsapp: '',
    hwid: '',
    tier: 'elite',
    billing_cycle: 'monthly',
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
  }, [])

  const loadLicenses = async () => {
    setLoadingLicenses(true)
    const { data } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(150)
    setLicenses(data || [])
    setLoadingLicenses(false)
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
          is_active: true,
          notes: `${lic.notes || ''} | Extended +${addedMonths}mo on ${new Date().toLocaleDateString('en-PK')}`.trim(),
        })
        .eq('id', lic.id)

      if (error) throw error
      await loadLicenses()
    } catch (err: any) {
      alert('Extension failed: ' + err.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Master Access Control: BAN or UNBAN Machine / User
  const toggleBanStatus = async (lic: any) => {
    setActionLoadingId(lic.id)
    try {
      const currentlyBanned = Boolean(lic.is_deactivated || lic.is_active === false)
      const nextBanned = !currentlyBanned

      const res = await fetch('/api/license/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseId: lic.id,
          action: nextBanned ? 'ban' : 'unban',
          reason: nextBanned ? 'Suspended by Administrator' : 'Access Restored',
        })
      })

      if (!res.ok) {
        throw new Error('Failed to update ban status')
      }

      await loadLicenses()
    } catch (err: any) {
      alert('Action failed: ' + err.message)
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
      let cleanPhone = form.customer_whatsapp.trim().replace(/[\s-]/g, '')
      if (cleanPhone.startsWith('0')) cleanPhone = '92' + cleanPhone.slice(1)

      const brandFormatted = form.brand_name.trim() || `${form.customer_name.trim()}'s Business`
      const hwidFormatted = form.hwid.trim() ? `HWID: ${form.hwid.trim().toUpperCase()}` : ''
      const notesFormatted = `Brand: ${brandFormatted} ${hwidFormatted ? '| ' + hwidFormatted : ''} | Billing: ${form.billing_cycle.toUpperCase()} ${form.notes ? '| ' + form.notes : ''}`.trim()

      const { error } = await supabase
        .from('licenses')
        .insert({
          license_key: key,
          tier: form.tier,
          is_trial: false,
          max_devices: TIER_CONFIG[form.tier as keyof typeof TIER_CONFIG].maxDevices,
          expires_at: isLifetime ? null : expiresAt.toISOString(),
          customer_name: form.customer_name.trim(),
          customer_whatsapp: cleanPhone || null,
          customer_phone: cleanPhone || null,
          customer_email: null, // ZERO EMAIL
          payment_method: form.payment_method,
          amount_paid: form.amount_paid ? parseFloat(form.amount_paid) : null,
          currency: 'PKR',
          notes: notesFormatted,
          is_active: true,
          is_deactivated: false,
        })

      if (error) throw error

      setNewKey(key)
      await loadLicenses()

      setForm(p => ({
        ...p,
        customer_name: '',
        brand_name: '',
        customer_whatsapp: '',
        hwid: '',
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
    const isBanned = Boolean(lic.is_deactivated || lic.is_active === false)

    let cycle = 'monthly'
    if (!expiresMs) cycle = 'lifetime'
    else if (durationDays > 100) cycle = 'yearly'
    else if (lic.is_trial) cycle = 'trial'

    const hwid = extractHwid(lic.notes, lic.license_key)
    const brand = extractBrand(lic.notes, lic.customer_name)

    return {
      ...lic,
      cycle,
      hwid,
      brand,
      durationDays,
      daysLeft,
      isExpired,
      isBanned,
    }
  })

  // Filtering
  const filteredLicenses = analyzedLicenses.filter(lic => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchName = lic.customer_name?.toLowerCase().includes(q)
      const matchBrand = lic.brand?.toLowerCase().includes(q)
      const matchKey = lic.license_key?.toLowerCase().includes(q)
      const matchHwid = lic.hwid?.toLowerCase().includes(q)
      const matchPhone = lic.customer_whatsapp?.includes(q)
      if (!matchName && !matchBrand && !matchKey && !matchHwid && !matchPhone) return false
    }

    if (filterTab === 'banned') return lic.isBanned
    if (filterTab === 'active') return !lic.isBanned && !lic.isExpired
    if (filterTab === 'expiring') return !lic.isExpired && lic.daysLeft <= 7 && lic.daysLeft >= 0
    if (filterTab === 'trials') return lic.is_trial
    return true
  })

  const bannedCount = analyzedLicenses.filter(l => l.isBanned).length
  const activeCount = analyzedLicenses.filter(l => !l.isBanned && !l.isExpired).length
  const trialCount = analyzedLicenses.filter(l => l.is_trial).length

  const FIELD = `w-full bg-[#0A0C0F] border border-white/10 text-white text-xs px-3 py-2 outline-none focus:border-red-500/60 transition-colors rounded`
  const LABEL = `text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1`

  return (
    <div className="min-h-screen bg-[#07090D] text-white p-6 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header & Sovereign Master Security Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-500" />
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                Sovereign Machine Access & License Control
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Real-time Hardware ID (HWID) telemetry, customer brand tracking, and 1-click machine banning across all installed workstations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadLicenses}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className={loadingLicenses ? 'animate-spin' : ''} />
              Sync Telemetry
            </button>
          </div>
        </div>

        {/* Global Access Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#0D1017] border border-white/10 p-4 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Workstations</span>
            <p className="text-2xl font-black text-white mt-1">{analyzedLicenses.length}</p>
          </div>
          <div className="bg-[#0D1017] border border-emerald-500/20 p-4 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Active Systems</span>
            <p className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</p>
          </div>
          <div className="bg-[#0D1017] border border-red-500/30 bg-red-950/10 p-4 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Banned / Locked</span>
            <p className="text-2xl font-black text-red-400 mt-1">{bannedCount}</p>
          </div>
          <div className="bg-[#0D1017] border border-cyan-500/20 p-4 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Trial Installs</span>
            <p className="text-2xl font-black text-cyan-400 mt-1">{trialCount}</p>
          </div>
        </div>

        {/* Two-Column Grid: Left Create / Issue — Right Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Direct License Generator (Zero Email) */}
          <div className="lg:col-span-4 bg-[#0D1017] border border-white/10 p-5 rounded-xl space-y-4 h-fit">
            <div className="border-b border-white/10 pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Zap size={14} className="text-amber-400" />
                Issue Workstation License
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Generate and bind a license key without requiring email.
              </p>
            </div>

            {/* Customer User Name */}
            <div>
              <label className={LABEL}>Customer / User Name *</label>
              <input
                type="text"
                value={form.customer_name}
                onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))}
                placeholder="e.g. Ahmad Mahboob"
                className={FIELD}
              />
            </div>

            {/* Brand / Company Name */}
            <div>
              <label className={LABEL}>Brand / Company / Store Name</label>
              <input
                type="text"
                value={form.brand_name}
                onChange={e => setForm(p => ({ ...p, brand_name: e.target.value }))}
                placeholder="e.g. Gold She Garments"
                className={FIELD}
              />
            </div>

            {/* WhatsApp / Phone Number */}
            <div>
              <label className={LABEL}>WhatsApp / Phone Number</label>
              <input
                type="text"
                value={form.customer_whatsapp}
                onChange={e => setForm(p => ({ ...p, customer_whatsapp: e.target.value }))}
                placeholder="e.g. 03264742678"
                className={FIELD}
              />
            </div>

            {/* Machine HWID (Optional or Pre-bound) */}
            <div>
              <label className={LABEL}>Machine Hardware ID (Optional)</label>
              <input
                type="text"
                value={form.hwid}
                onChange={e => setForm(p => ({ ...p, hwid: e.target.value }))}
                placeholder="e.g. BFEBFBFF000906E9 (or leave blank to auto-bind)"
                className={FIELD}
              />
            </div>

            {/* Plan Tier & Billing Cycle */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Plan Tier</label>
                <select 
                  value={form.tier} 
                  onChange={e => setForm(p => ({ ...p, tier: e.target.value }))} 
                  className={FIELD}
                >
                  <option value="elite">Elite (Gold Master)</option>
                  <option value="pro">Pro Edition</option>
                  <option value="lite">Lite Edition</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Billing Cycle</label>
                <select 
                  value={form.billing_cycle} 
                  onChange={e => setForm(p => ({ ...p, billing_cycle: e.target.value }))} 
                  className={FIELD}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Annual (1 Year)</option>
                  <option value="lifetime">Permanent (Lifetime)</option>
                </select>
              </div>
            </div>

            {/* Payment & Internal Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Payment Method</label>
                <select 
                  value={form.payment_method} 
                  onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))} 
                  className={FIELD}
                >
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

            <button
              onClick={createLicense}
              disabled={creating || !form.customer_name.trim()}
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-red-950/40"
            >
              {creating ? 'Binding & Registering...' : '⚡ Generate & Activate Key'}
            </button>

            {/* Key Generated Result */}
            {newKey && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Workstation Key Generated
                </p>
                <p className="text-xs font-mono font-bold text-white tracking-widest select-all bg-black/60 p-2 rounded">
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
                      href={`https://wa.me/${form.customer_whatsapp.replace(/\D/g, '').replace(/^0/, '92')}?text=${buildWhatsAppMessage(form.customer_name, form.brand_name || 'Business', newKey, form.tier, form.billing_cycle === 'yearly' ? '12' : '1')}`}
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

          {/* Right Column: Workstations Explorer & Access Control (8 cols) */}
          <div className="lg:col-span-8 bg-[#0D1017] border border-white/10 p-5 rounded-xl flex flex-col space-y-4">

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono">
                {[
                  { key: 'all', label: `All Systems (${analyzedLicenses.length})` },
                  { key: 'active', label: `Active (${activeCount})` },
                  { key: 'banned', label: `Banned (${bannedCount})`, badge: bannedCount > 0 ? 'text-red-400 font-bold' : '' },
                  { key: 'trials', label: `Trials (${trialCount})` },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilterTab(tab.key as any)}
                    className={`px-3 py-1.5 rounded uppercase tracking-wider transition-colors cursor-pointer ${
                      filterTab === tab.key
                        ? 'bg-red-600 text-white font-bold'
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search user, brand, HWID, phone..."
                  className="pl-7 pr-3 py-1.5 text-xs bg-[#060708] border border-white/10 text-white rounded outline-none focus:border-red-500/50 w-full sm:w-56"
                />
              </div>
            </div>

            {/* Workstations List */}
            <div className="space-y-3 overflow-y-auto flex-1 max-h-[640px] pr-1">
              {loadingLicenses ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 bg-white/5 rounded animate-pulse" />
                  ))}
                </div>
              ) : filteredLicenses.length === 0 ? (
                <div className="text-center py-20 text-zinc-500 text-xs">
                  No workstations matching this filter.
                </div>
              ) : (
                filteredLicenses.map(lic => {
                  return (
                    <div
                      key={lic.id}
                      className={`p-4 rounded-xl border transition-all ${
                        lic.isBanned
                          ? 'border-red-500/40 bg-red-950/20'
                          : 'border-white/10 bg-[#12151C] hover:border-white/20'
                      }`}
                    >
                      {/* Top Row: User & Brand Details + Status Badge */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">
                              {lic.customer_name || 'Workstation User'}
                            </span>
                            <span className="text-[11px] font-semibold text-zinc-300 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                              🏢 {lic.brand}
                            </span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                              lic.tier === 'elite' ? 'bg-amber-500/20 text-amber-400'
                              : lic.tier === 'pro' ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-white/10 text-zinc-300'
                            }`}>
                              {lic.tier}
                            </span>
                          </div>

                          {/* Machine HWID & Phone */}
                          <div className="flex items-center gap-3 mt-1.5 text-xs font-mono text-zinc-400 flex-wrap">
                            <span className="flex items-center gap-1 text-[11px] bg-black/40 px-2 py-0.5 rounded border border-white/5">
                              <Laptop size={12} className="text-cyan-400" />
                              <strong className="text-zinc-300 font-normal">HWID:</strong>
                              <span className="text-cyan-300 select-all">{lic.hwid}</span>
                            </span>

                            {lic.customer_whatsapp && (
                              <span className="flex items-center gap-1 text-[11px] bg-black/40 px-2 py-0.5 rounded border border-white/5">
                                <PhoneCall size={11} className="text-emerald-400" />
                                <span className="text-zinc-300">{lic.customer_whatsapp}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full flex items-center gap-1 ${
                            lic.isBanned
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {lic.isBanned ? (
                              <>
                                <Ban size={11} />
                                BANNED / RESTRICTED
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={11} />
                                ACTIVE WORKSTATION
                              </>
                            )}
                          </span>

                          <span className="text-[10px] font-mono text-zinc-500">
                            Key: {lic.license_key}
                          </span>
                        </div>
                      </div>

                      {/* Action Bar: BAN / UNBAN, WhatsApp, Extend */}
                      <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] font-mono text-zinc-400">
                          Expires: {lic.expires_at ? new Date(lic.expires_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Permanent'}
                        </span>

                        <div className="flex items-center gap-2">
                          {lic.customer_whatsapp && (
                            <a
                              href={`https://wa.me/${lic.customer_whatsapp.replace(/\D/g, '').replace(/^0/, '92')}?text=${encodeURIComponent(`Salam ${lic.customer_name} (${lic.brand}), this is Noxis Hub administration regarding your software access.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] text-xs font-bold rounded flex items-center gap-1 transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle size={12} />
                              WhatsApp
                            </a>
                          )}

                          <button
                            onClick={() => extendLicense(lic, 1)}
                            disabled={actionLoadingId === lic.id}
                            className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold rounded transition-colors cursor-pointer"
                            title="Extend plan by 1 month"
                          >
                            +1 Mo
                          </button>

                          {/* MASTER ACCESS CONTROL BUTTON: BAN or UNBAN */}
                          <button
                            onClick={() => toggleBanStatus(lic)}
                            disabled={actionLoadingId === lic.id}
                            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                              lic.isBanned
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                                : 'bg-red-600/90 hover:bg-red-500 text-white shadow-lg shadow-red-950/40'
                            }`}
                            title={lic.isBanned ? 'Restore workstation access' : 'Lockdown and block this machine immediately'}
                          >
                            {lic.isBanned ? (
                              <>
                                <UserCheck size={13} />
                                Unban Machine
                              </>
                            ) : (
                              <>
                                <UserX size={13} />
                                Ban Machine
                              </>
                            )}
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
      <div className="min-h-screen bg-[#07090D] flex items-center justify-center">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
      </div>
    }>
      <AdminLicensesContent />
    </Suspense>
  )
}
