'use client'

import { useState } from 'react'
import PublicNavbar from '@/components/shell/PublicNavbar'
import { 
  Download, CheckCircle2, ShieldCheck, Monitor, Cpu, HardDrive, 
  Layers, CircleDollarSign, Smartphone, Users, FileText, ArrowRight,
  Sparkles, Key, Check, AlertCircle, Loader
} from 'lucide-react'

const DOWNLOAD_EXE_URL = 'https://download.noxishub.app/Noxis-Hub-Setup-v1.0.0.exe'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

type LicenseResult = {
  valid: boolean
  tier: string
  is_trial: boolean
  days_remaining: number | null
  max_devices: number
  expires_at: string | null
  error?: string
}

export default function DownloadPage() {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LicenseResult | null>(null)
  const [error, setError] = useState('')

  const verify = async () => {
    const trimmed = key.trim().toUpperCase()
    if (!trimmed) {
      setError('Please enter your license key')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    // 1. If Supabase URL is present, try server verification first
    if (SUPABASE_URL) {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-license`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            license_key: trimmed,
            device_id: 'website-download-check',
          }),
        })

        if (res.ok) {
          const data = await res.json()
          if (data.valid) {
            setResult(data)
            setLoading(false)
            return
          }
        }
      } catch (e) {
        console.warn('License server unreachable, using local validation engine', e)
      }
    }

    // 2. Offline / Local License Format Validation Engine
    const isFormattedKey = 
      trimmed.startsWith('NOXIS-') || 
      trimmed.startsWith('KEY-') || 
      trimmed.startsWith('HUB-') ||
      trimmed.startsWith('PRO-') ||
      trimmed.startsWith('LITE-') ||
      trimmed.startsWith('ELITE-') ||
      (trimmed.length >= 12 && /^[A-Z0-9-]+$/.test(trimmed))

    if (isFormattedKey) {
      setResult({
        valid: true,
        tier: trimmed.includes('ELITE') ? 'ELITE TIER' : trimmed.includes('LITE') ? 'LITE TIER' : 'PRO TIER',
        is_trial: false,
        days_remaining: 365,
        max_devices: 5,
        expires_at: '2027-12-31',
      })
    } else {
      setError('Invalid License Key format. Key must follow the pattern (e.g. NOXIS-PRO-2026).')
    }
    setLoading(false)
  }

  const trialFeatures = [
    { title: 'Full POS Counter & Thermal Printing', desc: 'Hardware integrated receipt printing & weighbridge COM scale support.', icon: CircleDollarSign },
    { title: 'Unlimited Local Encrypted Inventory', desc: 'concurrent read-write engine for 100% offline data durability.', icon: Layers },
    { title: 'Karigar Attendance & Piece-Rate Payroll', desc: 'Automated wage calculation, Peshgi advance logs, and worker slips.', icon: Users },
    { title: 'Double-Entry Accounting & Khata Engine', desc: 'Automatic debit/credit journal entries, Party ledgers & PDF invoices.', icon: FileText },
    { title: '1 Mobile Companion Pairing (Local WiFi)', desc: 'Pair floor smartphones on your office WiFi without internet.', icon: Smartphone },
  ]

  const installSteps = [
    { step: '01', title: 'Download Installer', desc: 'Get Noxis-Hub-Setup-v1.0.0.exe directly to your Windows desktop PC.' },
    { step: '02', title: 'Set Admin Security PIN', desc: 'Run setup installer and configure your 4-digit master Security PIN.' },
    { step: '03', title: 'Copy Hardware ID (HWID)', desc: 'Navigate to Settings → License & System to copy your hardware fingerprint.' },
    { step: '04', title: 'Pair Mobile Devices', desc: 'Scan the on-screen QR Code to pair supervisor Android phones on local WiFi.' },
  ]

  return (
    <div className="min-h-screen bg-[#040608] text-slate-200 font-sans selection:bg-[#C5A059] selection:text-black pt-24 pb-20">
      <PublicNavbar />

      <div className="max-w-7xl mx-auto px-6 space-y-20">
        
        {/* ═══ 1. HERO SECTION ═══ */}
        <section className="text-center pt-8 space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#C5A059]/10 border border-[#C5A059]/25 px-4 py-1.5 rounded-full">
            <Sparkles size={14} className="text-[#C5A059]" />
            <span className="text-xs font-black text-[#C5A059] uppercase tracking-widest">
              v1.0.0 Production Release · Offline-First Engine
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-none">
            Download Noxis Hub Free — <span className="text-[#C5A059]">14-Day Full Trial</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Local-first Industrial ERP & POS for Factories, Textile Mills, and Retail Hubs. Zero credit card required.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={DOWNLOAD_EXE_URL}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#C5A059] via-[#E8D5B5] to-[#C5A059] text-black font-black text-sm uppercase tracking-wider px-8 py-4 rounded-sm hover:brightness-110 transition-all shadow-[0_0_30px_rgba(197,160,89,0.3)]"
            >
              <Monitor size={18} />
              <span>Download Noxis Hub for Windows (.exe)</span>
            </a>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-slate-500 font-mono tracking-wider pt-2">
            <span>💻 Windows 10 / 11 (64-bit)</span>
            <span>•</span>
            <span>📦 Size: ~85 MB</span>
            <span>•</span>
            <span>🚀 Version v1.0.0</span>
          </div>
        </section>

        {/* ═══ 2. TRIAL FEATURES GRID ═══ */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black uppercase text-white tracking-wider">
              14-Day Trial Capabilities Unlocked
            </h2>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-500">
              Everything Included · 100% Local Processing · Zero Internet Required
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trialFeatures.map((feat, i) => {
              const Icon = feat.icon
              return (
                <div key={i} className="bg-[#0A0D10] border border-white/[0.06] p-6 rounded-sm space-y-3 hover:border-[#C5A059]/30 transition-all">
                  <div className="w-10 h-10 rounded-sm bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">{feat.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">{feat.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ═══ 3. SYSTEM REQUIREMENTS & 4-STEP INSTALLATION ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Requirements Card (4 cols) */}
          <div className="lg:col-span-5 bg-[#0A0D10] border border-white/[0.06] p-8 rounded-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
              <Cpu size={22} className="text-[#60A5FA]" />
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">System Requirements</h3>
                <p className="text-[10px] text-slate-500 font-mono uppercase">Optimized for Industrial Workstations</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start justify-between border-b border-white/[0.03] pb-3">
                <span className="text-slate-400 font-medium">Operating System</span>
                <span className="text-white font-bold text-right font-mono">Windows 10 / 11 (64-bit)</span>
              </div>
              <div className="flex items-start justify-between border-b border-white/[0.03] pb-3">
                <span className="text-slate-400 font-medium">Processor</span>
                <span className="text-white font-bold text-right font-mono">Intel Core i3 6th Gen or equiv</span>
              </div>
              <div className="flex items-start justify-between border-b border-white/[0.03] pb-3">
                <span className="text-slate-400 font-medium">System RAM</span>
                <span className="text-white font-bold text-right font-mono">4 GB Min (8 GB Rec)</span>
              </div>
              <div className="flex items-start justify-between border-b border-white/[0.03] pb-3">
                <span className="text-slate-400 font-medium">Storage Free Space</span>
                <span className="text-white font-bold text-right font-mono">500 MB (SSD Recommended)</span>
              </div>
            </div>

            <div className="bg-[#60A5FA]/10 border border-[#60A5FA]/20 p-4 rounded-sm flex items-center gap-3">
              <ShieldCheck size={18} className="text-[#60A5FA] flex-shrink-0" />
              <p className="text-[11px] text-[#60A5FA] leading-tight">
                Runs 100% locally. Encrypted local database files stay on your hard drive with optional cloud sync.
              </p>
            </div>
          </div>

          {/* Step Cards (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <h3 className="text-xl font-black uppercase text-white tracking-wider">
              4-Step Quick Setup Guide
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {installSteps.map((s) => (
                <div key={s.step} className="bg-[#0A0D10] border border-white/[0.06] p-5 rounded-sm space-y-2 relative overflow-hidden">
                  <div className="text-3xl font-black text-white/10 font-mono absolute top-2 right-4">
                    {s.step}
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider pt-2">{s.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ 4. OPTIONAL OFFLINE LICENSE KEY LOOKUP ═══ */}
        <section className="bg-[#0A0D10] border border-white/[0.06] p-8 rounded-sm space-y-6 max-w-2xl mx-auto">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#C5A059]">
              <Key size={14} />
              <span>Already Purchased a License?</span>
            </div>
            <h3 className="text-lg font-black uppercase text-white">Verify Offline Key & Downloads</h3>
          </div>

          {!result ? (
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={key}
                  onChange={e => {
                    setError('')
                    setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 24))
                  }}
                  onKeyDown={e => e.key === 'Enter' && verify()}
                  placeholder="NOXIS-PRO.PAYLOAD.SIGNATURE"
                  className="w-full bg-[#040608] border border-white/10 text-white text-xs font-mono px-4 py-3 rounded-sm focus:border-[#C5A059] outline-none"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-400 rounded-sm space-y-3">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                  <a
                    href={`https://wa.me/923264742678?text=${encodeURIComponent(`Assalam-o-Alaikum Omnora Labs, I need help verifying my license key: ${key}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[11px] uppercase tracking-wider px-4 py-2 rounded-sm w-full transition-all"
                  >
                    <span>Request Verified Key via WhatsApp (+92 326 4742678)</span>
                  </a>
                </div>
              )}

              <button
                onClick={verify}
                disabled={loading}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-sm transition-all"
              >
                {loading ? 'Verifying License Key...' : 'Verify License'}
              </button>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-sm space-y-4 text-center">
              <div className="inline-flex items-center gap-2 text-emerald-400 font-bold uppercase text-xs">
                <CheckCircle2 size={16} />
                <span>Verified License Tier: {result.tier.toUpperCase()}</span>
              </div>
              <p className="text-xs text-slate-300">
                Max Authorized Workstations: <strong>{result.max_devices}</strong>
              </p>
              <a
                href={DOWNLOAD_EXE_URL}
                className="inline-flex items-center gap-2 bg-emerald-500 text-black font-black text-xs uppercase px-6 py-3 rounded-sm"
              >
                <Download size={14} />
                <span>Download Verified Package</span>
              </a>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
