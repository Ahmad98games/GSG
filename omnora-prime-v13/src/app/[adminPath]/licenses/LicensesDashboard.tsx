'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
  lite:  { maxDevices: 5,  label: 'Lite (5 devices)',   price: 2500 },
  pro:   { maxDevices: 15, label: 'Pro (15 devices)',    price: 6500 },
  elite: { maxDevices: 50, label: 'Elite (50 devices)',  price: 14000 },
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

function AdminLicensesContent() {
  const params = useSearchParams()
  const token = params.get('token')

  const supabase = createClient()
  const [licenses, setLicenses] = useState<any[]>([])
  const [form, setForm] = useState({
    tier: 'lite',
    customer_name: '',
    customer_whatsapp: '',
    customer_email: '',
    payment_method: 'jazzcash',
    amount_paid: '',
    months: '1',
    notes: '',
  })
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [copied, setCopied] = useState(false)
  const [loadingLicenses, setLoadingLicenses] = useState(true)

  useEffect(() => {
    loadLicenses()
  }, [])

  const loadLicenses = async () => {
    setLoadingLicenses(true)
    const { data } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    setLicenses(data || [])
    setLoadingLicenses(false)
  }

  const createLicense = async () => {
    if (!form.customer_name.trim()) return
    setCreating(true)
    setNewKey('')

    try {
      const key = generateLicenseKey(form.tier)
      const months = parseInt(form.months) || 1
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + months)

      const { error } = await supabase
        .from('licenses')
        .insert({
          license_key: key,
          tier: form.tier,
          is_trial: false,
          max_devices: TIER_CONFIG[form.tier as keyof typeof TIER_CONFIG].maxDevices,
          expires_at: expiresAt.toISOString(),
          customer_name: form.customer_name.trim(),
          customer_email: form.customer_email.trim() || null,
          customer_whatsapp: form.customer_whatsapp.trim() || null,
          payment_method: form.payment_method,
          amount_paid: form.amount_paid ? parseFloat(form.amount_paid) : null,
          currency: 'PKR',
          notes: form.notes.trim() || null,
        })

      if (error) throw error

      setNewKey(key)
      loadLicenses()

      setForm(p => ({
        ...p,
        customer_name: '',
        customer_whatsapp: '',
        customer_email: '',
        amount_paid: '',
        notes: '',
      }))
    } catch (err: any) {
      alert('Error creating license: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const FIELD = `w-full bg-[#0A0C0F] border border-white/8 text-white text-sm px-3 py-2.5 outline-none focus:border-[#60A5FA]/50 transition-colors`
  const LABEL = `text-[10px] font-semibold uppercase tracking-widest text-gray-500 block mb-1.5`

  const totalRevenue = licenses
    .filter(l => !l.is_trial)
    .reduce((sum, l) => sum + (l.amount_paid || 0), 0)

  return (
    <div className="min-h-screen bg-[#060708] text-white">
      {/* Top bar */}
      <div className="border-b border-white/[0.05] px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
            Admin · Private
          </span>
          <span className="text-[10px] text-gray-700">|</span>
          <span className="text-[10px] text-gray-500 font-mono">Noxis Hub License Manager</span>
        </div>
        <span className="text-[10px] text-gray-700 font-mono">
          PKR {totalRevenue.toLocaleString()} total
        </span>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">License Key Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Generate and deliver license keys to paying customers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ─── Generate Key Form ─── */}
          <div className="bg-[#0F1114] border border-white/8 p-6 rounded-sm">
            <p className="text-sm font-semibold text-white mb-5">Generate New License</p>

            <div className="space-y-4">
              {/* Plan */}
              <div>
                <label className={LABEL}>Plan</label>
                <select value={form.tier} onChange={e => setForm(p => ({ ...p, tier: e.target.value }))} className={FIELD}>
                  <option value="lite">Lite — PKR 2,500/mo (5 devices)</option>
                  <option value="pro">Pro — PKR 6,500/mo (15 devices)</option>
                  <option value="elite">Elite — PKR 14,000/mo (50 devices)</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className={LABEL}>Duration (months)</label>
                <select value={form.months} onChange={e => setForm(p => ({ ...p, months: e.target.value }))} className={FIELD}>
                  {[1, 2, 3, 6, 12].map(m => (
                    <option key={m} value={m}>{m} month{m > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Customer Name */}
              <div>
                <label className={LABEL}>Customer Name *</label>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))}
                  placeholder="Ahmad Mahboob"
                  className={FIELD}
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className={LABEL}>WhatsApp Number</label>
                <input
                  type="tel"
                  value={form.customer_whatsapp}
                  onChange={e => setForm(p => ({ ...p, customer_whatsapp: e.target.value }))}
                  placeholder="03001234567"
                  className={FIELD}
                />
              </div>

              {/* Email (optional) */}
              <div>
                <label className={LABEL}>Email (optional)</label>
                <input
                  type="email"
                  value={form.customer_email}
                  onChange={e => setForm(p => ({ ...p, customer_email: e.target.value }))}
                  placeholder="customer@example.com"
                  className={FIELD}
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className={LABEL}>Payment Method</label>
                <select value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))} className={FIELD}>
                  <option value="jazzcash">JazzCash</option>
                  <option value="easypaisa">EasyPaisa</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="trial">Free Trial</option>
                </select>
              </div>

              {/* Amount Paid */}
              <div>
                <label className={LABEL}>Amount Paid (PKR)</label>
                <input
                  type="number"
                  value={form.amount_paid}
                  onChange={e => setForm(p => ({ ...p, amount_paid: e.target.value }))}
                  placeholder={String(TIER_CONFIG[form.tier as keyof typeof TIER_CONFIG]?.price || '')}
                  className={FIELD}
                />
              </div>

              {/* Notes */}
              <div>
                <label className={LABEL}>Internal Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Faisalabad textile, referral from X"
                  className={FIELD}
                />
              </div>

              <button
                onClick={createLicense}
                disabled={creating || !form.customer_name.trim()}
                className="w-full py-3 text-sm font-bold bg-[#60A5FA] text-black hover:bg-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Generating...' : '⚡ Generate License Key'}
              </button>
            </div>

            {/* New key result */}
            {newKey && (
              <div className="mt-5 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">
                  ✓ Key Generated Successfully
                </p>
                <p className="text-base font-mono font-bold text-white tracking-[0.15em] mb-4 select-all">
                  {newKey}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newKey)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="flex-1 py-2 text-xs font-semibold bg-white/8 text-gray-300 hover:bg-white/15 transition-colors"
                  >
                    {copied ? '✓ Copied!' : 'Copy Key'}
                  </button>
                  {form.customer_whatsapp && (
                    <a
                      href={`https://wa.me/${
                        form.customer_whatsapp.replace(/\D/g, '').replace(/^0/, '92')
                      }?text=${buildWhatsAppMessage(form.customer_name, newKey, form.tier, form.months)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 text-xs font-semibold bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/25 hover:bg-[#25D366]/20 transition-colors text-center"
                    >
                      📲 Send on WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ─── Recent Licenses ─── */}
          <div className="bg-[#0F1114] border border-white/8 p-6 rounded-sm flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-semibold text-white">Recent Licenses</p>
              <button
                onClick={loadLicenses}
                className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 max-h-[680px] pr-1">
              {loadingLicenses ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-white/3 rounded-sm animate-pulse" />
                  ))}
                </div>
              ) : licenses.length === 0 ? (
                <p className="text-xs text-gray-700 text-center py-12">No licenses generated yet</p>
              ) : (
                licenses.map(lic => {
                  const expired = lic.expires_at && new Date(lic.expires_at) < new Date()
                  const daysLeft = lic.expires_at
                    ? Math.ceil((new Date(lic.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : null

                  return (
                    <div key={lic.id} className="p-3 bg-[#161A1F] border border-white/6 rounded-sm">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-[10px] font-mono font-bold text-white tracking-widest flex-1 min-w-0 truncate">
                          {lic.license_key}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                            lic.tier === 'elite' ? 'bg-[#C5A059]/20 text-[#C5A059]'
                            : lic.tier === 'pro' ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-white/10 text-gray-400'
                          }`}>{lic.tier}</span>
                          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                            expired ? 'bg-red-500/15 text-red-400'
                            : lic.is_trial ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-emerald-500/15 text-emerald-400'
                          }`}>
                            {expired ? 'Expired' : lic.is_trial ? 'Trial' : daysLeft !== null ? `${daysLeft}d` : 'Active'}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500">
                        {lic.customer_name || 'Unknown'}
                        {lic.customer_whatsapp ? ` · ${lic.customer_whatsapp}` : ''}
                      </p>
                      {lic.amount_paid && (
                        <p className="text-[10px] text-gray-600 mt-0.5">
                          PKR {Number(lic.amount_paid).toLocaleString()} via {lic.payment_method}
                        </p>
                      )}
                      {lic.customer_whatsapp && (
                        <a
                          href={`https://wa.me/${
                            lic.customer_whatsapp.replace(/\D/g, '').replace(/^0/, '92')
                          }?text=${buildWhatsAppMessage(lic.customer_name || 'Customer', lic.license_key, lic.tier, '1')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1 text-[9px] text-[#25D366] hover:text-emerald-400 transition-colors"
                        >
                          Resend on WhatsApp →
                        </a>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* ─── Revenue Summary ─── */}
        <div className="mt-6 p-5 bg-[#0F1114] border border-white/8 rounded-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-4">
            Revenue Summary
          </p>
          <div className="grid grid-cols-3 gap-4">
            {(['lite', 'pro', 'elite'] as const).map(tier => {
              const tierLicenses = licenses.filter(l => l.tier === tier && !l.is_trial)
              const revenue = tierLicenses.reduce((sum, l) => sum + (l.amount_paid || 0), 0)
              const active = tierLicenses.filter(l => !l.expires_at || new Date(l.expires_at) > new Date()).length
              return (
                <div key={tier} className="text-center p-4 bg-[#161A1F] border border-white/6 rounded-sm">
                  <p className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${
                    tier === 'elite' ? 'text-[#C5A059]' : tier === 'pro' ? 'text-blue-400' : 'text-gray-500'
                  }`}>{tier}</p>
                  <p className="text-lg font-mono font-bold text-white">
                    PKR {revenue.toLocaleString()}
                  </p>
                  <p className="text-[9px] text-gray-600 mt-1">
                    {tierLicenses.length} customers · {active} active
                  </p>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest">Total Revenue</p>
            <p className="text-base font-mono font-bold text-white">
              PKR {totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* ─── Workflow Guide ─── */}
        <div className="mt-6 p-5 bg-[#0F1114] border border-white/8 rounded-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-4">
            Quick Workflow
          </p>
          <ol className="space-y-2">
            {[
              'Customer WhatsApps: "I want to buy Noxis Pro"',
              'Reply with payment: JazzCash 0326-4742678 · PKR 6,500',
              'Customer sends payment screenshot',
              'Fill the form above and click Generate',
              'Click "Send on WhatsApp" — message is pre-filled',
              'Customer enters key at noxishub.app/download',
              'Key auto-activates the correct tier and device limit',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-xs text-gray-500">
                <span className="text-[10px] font-mono text-gray-700 flex-shrink-0 mt-0.5">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="text-[10px] text-gray-700 mt-4">
            Total time per customer: ~3 minutes · Full audit trail in Supabase
          </p>
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
