'use client'
import { useState } from 'react'
import { Download, Check, AlertCircle, Loader } from 'lucide-react'

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// REAL R2 URLs — update these after upload
const EXE_URL =
  process.env.NEXT_PUBLIC_EXE_URL ||
  'https://pub-REPLACE.r2.dev/NoxisSetup.exe'
const APK_URL =
  process.env.NEXT_PUBLIC_APK_URL ||
  'https://pub-REPLACE.r2.dev/noxis.apk'

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
  const [result, setResult] =
    useState<LicenseResult | null>(null)
  const [error, setError] = useState('')

  const verify = async () => {
    const trimmed = key.trim().toUpperCase()
    if (!trimmed) {
      setError('Enter your license key')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/verify-license`,
        {
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
        }
      )

      const data = await res.json()

      if (!data.valid) {
        setError(
          data.error ||
          'Invalid license key. Check the key and try again.'
        )
      } else {
        setResult(data)
      }
    } catch {
      setError(
        'Cannot connect to verify. Check your internet connection.'
      )
    } finally {
      setLoading(false)
    }
  }

  const TIER_COLORS: Record<string, string> = {
    elite: 'text-[#C5A059] border-[#C5A059]/30 bg-[#C5A059]/5',
    pro: 'text-[#00E5FF] border-[#00E5FF]/30 bg-[#00E5FF]/5',
    lite: 'text-gray-400 border-white/15 bg-white/3',
  }

  return (
    <div className="min-h-screen bg-[#070809]
      text-white">

      {/* Nav */}
      <nav className="border-b border-white/[0.06]
        px-6 h-14 flex items-center justify-between
        bg-[#070809]">
        <a href="/"
          className="font-black text-sm
            tracking-widest uppercase">
          NOXIS
        </a>
        <a href="/pricing"
          className="text-xs text-gray-500
            hover:text-white transition-colors">
          Pricing →
        </a>
      </nav>

      <div className="max-w-lg mx-auto px-6
        py-16">

        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold
            tracking-tight mb-3">
            Download Noxis
          </h1>
          <p className="text-sm text-gray-500">
            Enter your license key to access
            the download links.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            No key?{' '}
            <a
              href="https://wa.me/923334355475"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sandstone-gold
                hover:text-[#E8D5B5]">
              Get a free trial on WhatsApp
            </a>
          </p>
        </div>

        {/* Key input */}
        {!result && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px]
                font-semibold uppercase
                tracking-widest text-gray-500
                block mb-2">
                License key
              </label>
              <input
                type="text"
                value={key}
                onChange={e => {
                  setError('')
                  setKey(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9-]/g, '')
                      .slice(0, 19)
                  )
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') verify()
                }}
                placeholder="TRIA-XXXX-XXXX-XXXX"
                className="w-full bg-[#161A1F]
                  border border-white/10 text-white
                  text-sm font-mono px-4 py-3.5
                  outline-none tracking-widest
                  focus:border-sandstone-gold/40
                  placeholder:text-gray-700
                  placeholder:tracking-normal"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-start
                gap-2 p-3 bg-red-500/5
                border border-red-500/20">
                <AlertCircle size={14}
                  className="text-red-400
                    flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">
                  {error}
                </p>
              </div>
            )}

            <button
              onClick={verify}
              disabled={loading || !key.trim()}
              className="w-full py-3.5 text-sm
                font-bold bg-sandstone-gold text-black
                hover:bg-[#D4B77A] transition-colors
                disabled:opacity-50
                disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader size={14}
                    className="animate-spin" />
                    Verifying...</>
                : 'Verify Key & Download'}
            </button>
          </div>
        )}

        {/* Success — show downloads */}
        {result && (
          <div className="space-y-4">

            {/* License info */}
            <div className={`p-4 border rounded-sm
              ${TIER_COLORS[result.tier] ||
                TIER_COLORS.lite}`}>
              <div className="flex items-center
                gap-2 mb-2">
                <Check size={14} />
                <span className="text-xs
                  font-bold uppercase tracking-widest">
                  {result.tier} license verified
                </span>
              </div>
              <div className="text-xs space-y-1
                opacity-80">
                {result.is_trial && (
                  <p>Trial — {result.days_remaining
                    ?? 3} days remaining</p>
                )}
                <p>{result.max_devices} devices
                  included</p>
                {result.expires_at && (
                  <p>Expires:{' '}
                    {new Date(result.expires_at)
                      .toLocaleDateString('en-PK')}
                  </p>
                )}
              </div>
            </div>

            {/* Hub download */}
            <div className="p-5 bg-[#0F1114]
              border border-white/8 rounded-sm">
              <div className="flex items-start
                justify-between mb-4">
                <div>
                  <p className="text-sm font-bold
                    text-white">
                    Noxis Hub
                  </p>
                  <p className="text-xs text-gray-500
                    mt-0.5">
                    Windows PC — Electron desktop app
                  </p>
                  <p className="text-[10px]
                    text-gray-700 mt-1">
                    Windows 10 / 11 · 64-bit
                  </p>
                </div>
                <span className="text-[10px]
                  text-gray-600 font-mono">
                  .exe
                </span>
              </div>
              <a
                href={EXE_URL}
                download="NoxisSetup.exe"
                className="flex items-center
                  justify-center gap-2 w-full
                  py-3 text-sm font-bold
                  bg-sandstone-gold text-black
                  hover:bg-[#D4B77A]
                  transition-colors"
              >
                <Download size={15} />
                Download NoxisSetup.exe
              </a>
            </div>

            {/* Mobile APK */}
            <div className="p-5 bg-[#0F1114]
              border border-white/8 rounded-sm">
              <div className="flex items-start
                justify-between mb-4">
                <div>
                  <p className="text-sm font-bold
                    text-white">
                    Noxis Mobile
                  </p>
                  <p className="text-xs text-gray-500
                    mt-0.5">
                    Android phone or tablet
                  </p>
                  <p className="text-[10px]
                    text-gray-700 mt-1">
                    Android 10+ · No root required
                  </p>
                </div>
                <span className="text-[10px]
                  text-gray-600 font-mono">
                  .apk
                </span>
              </div>

              {/* APK install warning */}
              <div className="p-3 bg-amber-500/5
                border border-amber-500/20
                text-[10px] text-amber-400
                mb-3 leading-relaxed">
                Allow "Install from unknown sources"
                in Android Settings → Security
                before installing.
              </div>
              <a
                href={APK_URL}
                download="noxis.apk"
                className="flex items-center
                  justify-center gap-2 w-full
                  py-3 text-sm font-bold
                  bg-[#25D366] text-black
                  hover:bg-emerald-400
                  transition-colors"
              >
                <Download size={15} />
                Download noxis.apk
              </a>
            </div>

            {/* Installation steps */}
            <div className="p-4 bg-[#0F1114]
              border border-white/6 rounded-sm">
              <p className="text-[10px] font-semibold
                uppercase tracking-widest
                text-gray-500 mb-3">
                Quick start
              </p>
              <div className="space-y-2">
                {[
                  '1. Install NoxisSetup.exe on your Windows PC',
                  '2. Open Noxis Hub and enter this license key',
                  '3. Complete the 2-minute business setup',
                  '4. Install noxis.apk on Android phones',
                  '5. Open mobile app → Scan QR on Hub to pair',
                ].map((step, i) => (
                  <p key={i}
                    className="text-xs text-gray-500
                      leading-relaxed">
                    {step}
                  </p>
                ))}
              </div>
              <div className="mt-4 pt-3
                border-t border-white/6">
                <p className="text-[10px]
                  text-gray-600">
                  Need help installing?{' '}
                  <a
                    href="https://wa.me/923334355475?text=Help installing Noxis"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#25D366]
                      hover:text-emerald-400">
                    WhatsApp us →
                  </a>
                </p>
              </div>
            </div>

            {/* Try another key */}
            <button
              onClick={() => {
                setResult(null)
                setKey('')
                setError('')
              }}
              className="w-full text-xs
                text-gray-600 hover:text-gray-400
                transition-colors py-2"
            >
              Use a different key
            </button>
          </div>
        )}

        {/* Bottom info */}
        <div className="mt-12 text-center
          space-y-2">
          <p className="text-[10px] text-gray-700">
            v13.1 · Omnora Labs · Lahore, Pakistan
          </p>
          <p className="text-[10px] text-gray-700">
            <a href="/docs"
              className="hover:text-gray-500">
              Docs
            </a>
            {' · '}
            <a href="/privacy"
              className="hover:text-gray-500">
              Privacy
            </a>
            {' · '}
            <a
              href="https://wa.me/923334355475"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-500">
              Support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
