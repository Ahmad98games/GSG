'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { useTierStore } from '@/stores/tierStore'
import {
  Camera, Plus, Info, Play, ChevronRight,
  Wifi, Copy, Trash2, ExternalLink,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type CameraNode = {
  id: string
  node_label: string
  location_desc: string | null
  rtsp_url: string
  ip_address: string | null
  username: string | null
  port: number | null
  notes: string | null          // stores JSON: { brand }
  ai_enabled: boolean
  status: string
  is_active: boolean
  created_at: string
}

// ─── Brand catalogue ──────────────────────────────────────────────────────────

const BRANDS = [
  {
    value: 'hikvision',
    label: 'Hikvision',
    rtsp: 'rtsp://{u}:{p}@{ip}:{port}/Streaming/Channels/101',
  },
  {
    value: 'dahua',
    label: 'Dahua',
    rtsp: 'rtsp://{u}:{p}@{ip}:{port}/cam/realmonitor?channel=1&subtype=0',
  },
  {
    value: 'tp-link',
    label: 'TP-Link Tapo',
    rtsp: 'rtsp://{u}:{p}@{ip}:{port}/stream1',
  },
  {
    value: 'reolink',
    label: 'Reolink',
    rtsp: 'rtsp://{u}:{p}@{ip}:{port}/h264Preview_01_main',
  },
  {
    value: 'cp-plus',
    label: 'CP Plus',
    rtsp: 'rtsp://{u}:{p}@{ip}:{port}/stream',
  },
  {
    value: 'uniview',
    label: 'Uniview',
    rtsp: 'rtsp://{u}:{p}@{ip}:{port}/media/video1',
  },
  {
    value: 'other',
    label: 'Other / Generic',
    rtsp: 'rtsp://{u}:{p}@{ip}:{port}/stream1',
  },
] as const

const PUBLIC_DEMO_RTSP =
  'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildRtsp(
  brand: string,
  ip: string,
  port: string,
  u: string,
  p: string,
): string {
  const b = BRANDS.find(x => x.value === brand) ?? BRANDS[BRANDS.length - 1]
  return b.rtsp
    .replace('{u}', u || 'admin')
    .replace('{p}', p || 'password')
    .replace('{ip}', ip || '0.0.0.0')
    .replace('{port}', port || '554')
}

function brandLabel(notes: string | null): string {
  if (!notes) return 'Unknown'
  try {
    const j = JSON.parse(notes)
    return BRANDS.find(b => b.value === j.brand)?.label ?? j.brand ?? 'Unknown'
  } catch {
    return 'Unknown'
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CCTVPage() {
  const supabase = createClient()
  const { profile } = useBusinessProfile()
  const { tier, limits } = useTierStore()

  const [cameras, setCameras] = useState<CameraNode[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: '',
    location: '',
    ip: '',
    port: '554',
    username: 'admin',
    password: '',
    brand: 'hikvision',
    ai_enabled: false,
  })
  const [saving, setSaving] = useState(false)
  const [ipStatus, setIpStatus] = useState<
    'idle' | 'testing' | 'ok' | 'fail'
  >('idle')

  const CAMERA_LIMIT = limits?.maxCameras ?? 2

  // ── Data loading ────────────────────────────────────────────────────────────
  const load = async () => {
    if (!profile?.id) return
    const { data } = await supabase
      .from('cctv_nodes')
      .select('id,node_label,location_desc,rtsp_url,ip_address,username,port,notes,ai_enabled,status,is_active,created_at')
      .eq('business_id', profile.id)
      .eq('is_active', true)
      .order('created_at')
    setCameras((data ?? []) as CameraNode[])
    setLoading(false)
  }

  useEffect(() => { load() }, [profile?.id]) // eslint-disable-line

  // ── Toast helper ────────────────────────────────────────────────────────────
  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2400)
  }

  // ── IP reachability ping ────────────────────────────────────────────────────
  const testIp = async () => {
    if (!form.ip.trim()) return
    setIpStatus('testing')
    try {
      await new Promise<void>((res, rej) => {
        const img = new Image()
        img.onload = () => res()
        img.onerror = () => res()   // error = reachable (CORS block = device responded)
        setTimeout(rej, 3000)
        img.src = `http://${form.ip}/favicon.ico?t=${Date.now()}`
      })
      setIpStatus('ok')
    } catch {
      setIpStatus('fail')
    }
  }

  // ── Save camera ─────────────────────────────────────────────────────────────
  const save = async () => {
    if (!form.name.trim() || !form.ip.trim()) return
    if (!profile?.id) return
    if (cameras.length >= CAMERA_LIMIT) {
      flash(`${tier?.toUpperCase()} plan allows ${CAMERA_LIMIT} cameras. Upgrade to add more.`)
      return
    }

    setSaving(true)
    const rtspUrl = buildRtsp(form.brand, form.ip, form.port, form.username, form.password)

    const { error } = await supabase.from('cctv_nodes').insert({
      business_id: profile.id,
      node_label: form.name,
      location_desc: form.location || null,
      ip_address: form.ip,
      port: parseInt(form.port) || 554,
      username: form.username,
      password: form.password,
      rtsp_url: rtspUrl,
      notes: JSON.stringify({ brand: form.brand }),
      ai_enabled: form.ai_enabled,
      status: 'unknown',
      is_active: true,
    })

    if (!error) {
      setAddOpen(false)
      setForm({ name: '', location: '', ip: '', port: '554', username: 'admin', password: '', brand: 'hikvision', ai_enabled: false })
      setIpStatus('idle')
      load()
      flash('Camera added ✓')
    } else {
      flash(`Error: ${error.message}`)
    }
    setSaving(false)
  }

  // ── Delete camera ───────────────────────────────────────────────────────────
  const remove = async (id: string, label: string) => {
    if (!confirm(`Remove "${label}"?`)) return
    await supabase.from('cctv_nodes').update({ is_active: false }).eq('id', id)
    load()
    flash('Camera removed')
  }

  // ── VLC deep link ───────────────────────────────────────────────────────────
  const openVLC = (rtspUrl: string) => {
    window.open(`vlc://${rtspUrl}`, '_blank')
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    flash('RTSP URL copied — paste in VLC: Media → Open Network Stream')
  }

  // ── Live RTSP preview (via HLS proxy if available, else VLC link) ──────────
  const previewUrl = buildRtsp(form.brand, form.ip, form.port, form.username, form.password)

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-4xl relative">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
          px-4 py-2.5 bg-[#1A1F27] border border-white/12
          text-xs text-white rounded-sm shadow-xl
          animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toast}
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-semibold tracking-tight text-white">
              CCTV Sentinel
            </h1>
            <span className="text-[9px] font-bold uppercase tracking-widest
              bg-amber-500/10 text-amber-400 border border-amber-500/20
              px-2 py-0.5 rounded-full">
              Beta
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Register IP cameras, generate RTSP URLs,
            and open live streams in VLC — no sidecar needed.
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-mono font-bold text-white">
            {loading ? '—' : cameras.length}
            <span className="text-base text-gray-600">/{CAMERA_LIMIT}</span>
          </p>
          <p className="text-[9px] text-gray-600 uppercase tracking-widest">
            Cameras ({tier})
          </p>
        </div>
      </div>

      {/* ── Beta info banner ─────────────────────────────────────────────────── */}
      <div className="p-4 bg-[#0F1114] border border-amber-500/15 rounded-sm mb-6">
        <div className="flex items-start gap-3">
          <Info size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-amber-400">
              How CCTV works in Noxis (Beta)
            </p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Add your camera's IP and credentials. Noxis auto-builds the RTSP
              URL for your brand. Open it in <strong className="text-gray-400">VLC Media Player</strong> to
              see the live stream instantly — no server required.
              AI detection alerts require the Noxis Python engine (coming soon).
            </p>
            <div className="flex gap-4 mt-2 flex-wrap">
              <a
                href="https://www.videolan.org/vlc/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-semibold text-blue-400
                  hover:text-blue-300 transition-colors
                  flex items-center gap-1"
              >
                <ExternalLink size={10} />
                Download VLC (free)
              </a>
              <button
                onClick={() => setDemoOpen(d => !d)}
                className="text-[10px] font-semibold text-gray-500
                  hover:text-gray-300 transition-colors
                  flex items-center gap-1"
              >
                <Play size={10} />
                Test with public demo stream
                <ChevronRight
                  size={10}
                  className={`transition-transform ${demoOpen ? 'rotate-90' : ''}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Demo stream panel ─────────────────────────────────────────────────── */}
      {demoOpen && (
        <div className="p-4 bg-[#0F1114] border border-blue-500/20 rounded-sm mb-6
          animate-in fade-in slide-in-from-top-1 duration-150">
          <p className="text-xs font-semibold text-blue-400 mb-1">
            Public demo RTSP stream
          </p>
          <p className="text-[11px] text-gray-500 mb-3">
            No camera? Copy this URL and open it in VLC to verify your setup.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[10px] font-mono bg-[#161A1F]
              px-3 py-2 text-gray-400 rounded-sm truncate border border-white/6">
              {PUBLIC_DEMO_RTSP}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(PUBLIC_DEMO_RTSP)
                flash('Demo URL copied! Open VLC → Media → Open Network Stream → paste → Play')
              }}
              className="px-3 py-2 text-[10px] font-semibold
                bg-blue-500/10 text-blue-400 hover:bg-blue-500/20
                transition-colors rounded-sm flex-shrink-0 flex items-center gap-1.5"
            >
              <Copy size={10} />
              Copy
            </button>
            <button
              onClick={() => openVLC(PUBLIC_DEMO_RTSP)}
              className="px-3 py-2 text-[10px] font-semibold
                bg-orange-500/10 text-orange-400 hover:bg-orange-500/20
                transition-colors rounded-sm flex-shrink-0 flex items-center gap-1.5"
            >
              <Play size={10} />
              Open VLC
            </button>
          </div>
          <p className="text-[9px] text-gray-700 mt-2">
            VLC: Media → Open Network Stream → paste → Play
          </p>
        </div>
      )}

      {/* ── Camera list ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-white/[0.02] rounded-sm animate-pulse" />
          ))}
        </div>
      ) : cameras.length === 0 ? (
        <div className="py-16 text-center bg-[#0A0C0F]
          border border-white/[0.04] rounded-sm mb-4">
          <Camera size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium mb-1">
            No cameras added yet
          </p>
          <p className="text-xs text-gray-700 max-w-xs mx-auto">
            Add an IP camera on your local network to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {cameras.map(cam => (
            <div
              key={cam.id}
              className="p-4 bg-[#0F1114] border border-white/[0.06] rounded-sm"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Camera info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded bg-white/5 border border-white/8
                    flex items-center justify-center flex-shrink-0">
                    <Camera size={16} className="text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{cam.node_label}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {cam.location_desc || 'No location'}
                      {' · '}
                      {brandLabel(cam.notes)}
                      {cam.ip_address && (
                        <span className="text-gray-700"> · {cam.ip_address}</span>
                      )}
                    </p>
                    <p className="text-[9px] font-mono text-gray-700 mt-1
                      truncate max-w-[260px]">
                      {cam.rtsp_url}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openVLC(cam.rtsp_url)}
                    title="Open in VLC"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px]
                      font-semibold bg-orange-500/10 text-orange-400
                      border border-orange-500/20 hover:bg-orange-500/20
                      transition-colors rounded-sm"
                  >
                    <Play size={10} />
                    VLC
                  </button>

                  <button
                    onClick={() => copyUrl(cam.rtsp_url)}
                    title="Copy RTSP URL"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px]
                      font-medium text-gray-500 border border-white/8
                      hover:border-white/18 hover:text-gray-300
                      transition-colors rounded-sm"
                  >
                    <Copy size={10} />
                    URL
                  </button>

                  <button
                    onClick={() => remove(cam.id, cam.node_label)}
                    title="Remove camera"
                    className="w-7 h-7 flex items-center justify-center
                      text-gray-700 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add camera button ─────────────────────────────────────────────────── */}
      {!loading && cameras.length < CAMERA_LIMIT && (
        <button
          onClick={() => setAddOpen(o => !o)}
          className="w-full py-3 text-sm font-medium border border-dashed
            border-white/10 text-gray-500 hover:border-white/20
            hover:text-gray-300 transition-colors rounded-sm
            flex items-center justify-center gap-2"
        >
          <Plus size={14} />
          Add Camera
          <span className="text-[10px] text-gray-700">
            ({cameras.length}/{CAMERA_LIMIT} used)
          </span>
        </button>
      )}

      {!loading && cameras.length >= CAMERA_LIMIT && (
        <div className="text-center py-4 text-xs text-gray-600">
          Camera limit reached for {tier} plan.
          <button className="text-[#60A5FA] ml-1 hover:text-blue-300 transition-colors">
            Upgrade to add more →
          </button>
        </div>
      )}

      {/* ── Add camera form ──────────────────────────────────────────────────── */}
      {addOpen && (
        <div className="mt-4 p-5 bg-[#0F1114] border border-white/8 rounded-sm
          animate-in fade-in slide-in-from-top-2 duration-150">
          <p className="text-sm font-semibold text-white mb-4">Add New Camera</p>

          <div className="grid grid-cols-2 gap-4 mb-4">

            {/* Name */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-semibold uppercase
                tracking-widest text-gray-500 mb-1.5">
                Camera Name *
              </label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Main Gate, Warehouse A…"
                className="w-full bg-[#161A1F] border border-white/8 text-white
                  text-sm px-3 py-2.5 outline-none focus:border-[#60A5FA]/40
                  placeholder:text-gray-700 rounded-sm"
              />
            </div>

            {/* Location */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-semibold uppercase
                tracking-widest text-gray-500 mb-1.5">
                Location
              </label>
              <input
                value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                placeholder="Factory Floor, Gate 1…"
                className="w-full bg-[#161A1F] border border-white/8 text-white
                  text-sm px-3 py-2.5 outline-none focus:border-[#60A5FA]/40
                  placeholder:text-gray-700 rounded-sm"
              />
            </div>

            {/* Brand */}
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold uppercase
                tracking-widest text-gray-500 mb-1.5">
                Camera Brand
              </label>
              <select
                value={form.brand}
                onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
                className="w-full bg-[#161A1F] border border-white/8 text-white
                  text-sm px-3 py-2.5 outline-none focus:border-[#60A5FA]/40
                  rounded-sm"
              >
                {BRANDS.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>

            {/* IP address + ping test */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-semibold uppercase
                tracking-widest text-gray-500 mb-1.5">
                Camera IP Address *
              </label>
              <div className="flex gap-2">
                <input
                  value={form.ip}
                  onChange={e => {
                    setForm(p => ({ ...p, ip: e.target.value }))
                    setIpStatus('idle')
                  }}
                  placeholder="192.168.1.64"
                  className="flex-1 bg-[#161A1F] border border-white/8 text-white
                    text-sm px-3 py-2.5 outline-none focus:border-[#60A5FA]/40
                    font-mono placeholder:text-gray-700 rounded-sm"
                />
                <button
                  onClick={testIp}
                  disabled={ipStatus === 'testing' || !form.ip.trim()}
                  className="px-3 py-2.5 text-[10px] font-semibold
                    bg-blue-500/10 text-blue-400 border border-blue-500/20
                    hover:bg-blue-500/20 disabled:opacity-50
                    transition-colors flex-shrink-0 rounded-sm"
                >
                  {ipStatus === 'testing' ? 'Testing…' : 'Ping'}
                </button>
              </div>
              {ipStatus === 'ok' && (
                <p className="text-[10px] mt-1.5 text-emerald-400">
                  ✓ {form.ip} is reachable. Add the camera and open in VLC.
                </p>
              )}
              {ipStatus === 'fail' && (
                <p className="text-[10px] mt-1.5 text-red-400">
                  ✗ Cannot reach {form.ip}. Is the camera on the same Wi-Fi?
                </p>
              )}
              <p className="text-[9px] text-gray-700 mt-1">
                Find IP in router admin or camera's own web UI
              </p>
            </div>

            {/* RTSP port */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-semibold uppercase
                tracking-widest text-gray-500 mb-1.5">
                RTSP Port
              </label>
              <input
                value={form.port}
                onChange={e => setForm(p => ({ ...p, port: e.target.value }))}
                placeholder="554"
                className="w-full bg-[#161A1F] border border-white/8 text-white
                  text-sm px-3 py-2.5 outline-none focus:border-[#60A5FA]/40
                  font-mono placeholder:text-gray-700 rounded-sm"
              />
              <p className="text-[9px] text-gray-700 mt-1">Default: 554</p>
            </div>

            {/* Username */}
            <div>
              <label className="block text-[10px] font-semibold uppercase
                tracking-widest text-gray-500 mb-1.5">
                Username
              </label>
              <input
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                className="w-full bg-[#161A1F] border border-white/8 text-white
                  text-sm px-3 py-2.5 outline-none focus:border-[#60A5FA]/40
                  rounded-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-semibold uppercase
                tracking-widest text-gray-500 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Camera password"
                className="w-full bg-[#161A1F] border border-white/8 text-white
                  text-sm px-3 py-2.5 outline-none focus:border-[#60A5FA]/40
                  placeholder:text-gray-700 rounded-sm"
              />
            </div>
          </div>

          {/* RTSP preview */}
          {form.ip && (
            <div className="p-3 bg-[#161A1F] border border-white/6
              rounded-sm mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[9px] font-semibold uppercase tracking-widest
                  text-gray-600">
                  Generated RTSP URL
                </p>
                <button
                  onClick={() => copyUrl(previewUrl)}
                  className="text-[9px] text-gray-600 hover:text-gray-400
                    transition-colors flex items-center gap-1"
                >
                  <Copy size={9} />
                  Copy
                </button>
              </div>
              <p className="text-[10px] font-mono text-gray-400 break-all">
                {previewUrl}
              </p>
              <div className="flex gap-2 mt-2.5">
                <button
                  onClick={() => openVLC(previewUrl)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5
                    text-[10px] font-semibold bg-orange-500/10 text-orange-400
                    border border-orange-500/20 hover:bg-orange-500/20
                    transition-colors rounded-sm"
                >
                  <Play size={9} />
                  Test in VLC now
                </button>
                <span className="text-[9px] text-gray-700 self-center">
                  (opens VLC if installed)
                </span>
              </div>
            </div>
          )}

          {/* AI detection toggle (Pro/Elite only) */}
          {limits?.aiCctvDetection && (
            <div className="flex items-center justify-between p-3
              bg-blue-500/5 border border-blue-500/10 rounded-sm mb-4">
              <div>
                <p className="text-[10px] font-semibold text-white uppercase
                  tracking-widest">
                  AI Detection
                </p>
                <p className="text-[9px] text-gray-500 mt-0.5">
                  People & vehicle detection (requires Python engine)
                </p>
              </div>
              <button
                onClick={() => setForm(p => ({ ...p, ai_enabled: !p.ai_enabled }))}
                className={`w-8 h-4 rounded-full relative transition-colors ${
                  form.ai_enabled ? 'bg-blue-500' : 'bg-gray-700'
                }`}
              >
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full
                  transition-all ${form.ai_enabled ? 'right-0.5' : 'left-0.5'}`}
                />
              </button>
            </div>
          )}

          {/* Form actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setAddOpen(false)
                setIpStatus('idle')
              }}
              className="flex-1 py-2.5 text-sm border border-white/10
                text-gray-400 hover:border-white/20 transition-colors rounded-sm"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || !form.name.trim() || !form.ip.trim()}
              className="flex-1 py-2.5 text-sm font-bold bg-[#60A5FA] text-black
                hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors rounded-sm"
            >
              {saving ? 'Saving…' : 'Add Camera'}
            </button>
          </div>
        </div>
      )}

      {/* ── Feedback section ──────────────────────────────────────────────────── */}
      <div className="mt-8 p-4 bg-[#0F1114] border border-white/6 rounded-sm">
        <p className="text-xs font-semibold text-white mb-2">
          Help us improve CCTV
        </p>
        <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
          What camera brands do you use? What features matter most?
          Your feedback shapes what we build next.
        </p>
        <a
          href={`https://wa.me/923334355475?text=${encodeURIComponent(
            'Noxis CCTV Feedback:\n\nCamera brand: \nWhat I need: \n'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-semibold
            text-[#25D366] border border-[#25D366]/25 px-4 py-2
            hover:bg-[#25D366]/10 transition-colors rounded-sm"
        >
          Send Feedback via WhatsApp
        </a>
      </div>
    </div>
  )
}
