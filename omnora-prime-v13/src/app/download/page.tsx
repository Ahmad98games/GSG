'use client';

import { useState } from 'react';
import PublicNavbar from '@/components/shell/PublicNavbar';
import QRCode from 'react-qr-code';
import {
  Download, Check, MessageCircle, ChevronDown,
  ShieldCheck, Lock, X, Loader2, ArrowRight,
  User, Building, Phone, MapPin,
  Smartphone, QrCode, Laptop, Wifi,
  HardDrive, Cpu, Zap, Globe,
} from 'lucide-react';

// ── ALL BACKEND CONSTANTS PRESERVED ──
const DOWNLOAD_ZIP_URL = '/api/download-software?format=zip&trial=true&redirect=true';
const CLOUDFLARE_APK_URL = 'https://pub-8c464d0d92ff44abbf70c58c362ad258.r2.dev/noxis-preview.apk';
const APK_DOWNLOAD_URL = '/api/download-apk';
const WHATSAPP_SUPPORT_URL = 'https://wa.me/923264742678?text=Salam%20Omnora,%20I%20have%20installed%20Noxis%20Hub%20and%20want%20to%20activate%20my%20license.%20My%20Machine%20ID%20is:%20';

// ── ALL FAQ DATA PRESERVED ──
const FAQS = [
  {
    q: "Do I need the internet to run Noxis Hub?",
    a: "No. Everything works completely offline on your PC. Internet is only needed for WhatsApp invoicing, cloud backup, or downloading software updates."
  },
  {
    q: "How do phones connect to the office PC without internet?",
    a: "They connect through your local office Wi-Fi router. No external internet is needed for the phone-to-PC connection."
  },
  {
    q: "What happens to my data after the 7-day trial?",
    a: "Your data stays on your PC forever. We never lock or delete your files. After 7 days you can keep using the free version (billing counter, customer balance lookup, and full reports) or contact us on WhatsApp to activate a permanent license."
  },
  {
    q: "Is my factory information private?",
    a: "Yes, completely. All invoices, accounts, worker wages, and stock records are stored in a file directly on your hard drive. We do not upload your information anywhere. Cloud backup is an optional feature you control."
  },
  {
    q: "What if my PC breaks or I get a new computer?",
    a: "Install Noxis Hub on the new PC, restore your backup from a USB drive, and contact us on WhatsApp with your new machine ID. We will move your license to the new computer at no charge."
  }
];

// ── FEATURE TABLE DATA ──
const FEATURE_ROWS = [
  {
    feature: 'Billing Counter & Receipt Printer',
    free: 'Fully included',
    lite: 'Fully included',
    pro: 'Fully included'
  },
  {
    feature: 'Raw Material & Fabric Stock',
    free: 'Up to 200 items',
    lite: 'Unlimited items',
    pro: 'Unlimited + batch tracking'
  },
  {
    feature: 'Customer & Supplier Accounts',
    free: 'Up to 50 accounts',
    lite: 'Unlimited accounts',
    pro: 'Unlimited accounts'
  },
  {
    feature: 'Worker Wages & Advance Tracking',
    free: 'Manual records only',
    lite: 'Auto calculations',
    pro: 'Auto calculations & payslip printing'
  },
  {
    feature: 'WhatsApp Invoice Sending',
    free: '—',
    lite: 'Included',
    pro: 'Included'
  },
  {
    feature: 'PDF & Excel Financial Reports',
    free: 'Standard reports',
    lite: 'Detailed reports',
    pro: 'Detailed reports + profit & loss'
  },
  {
    feature: 'Security Camera Monitoring',
    free: '—',
    lite: '2 cameras',
    pro: 'Up to 6 cameras with motion alerts'
  },
  {
    feature: 'Stock Demand Predictions',
    free: '—',
    lite: 'Low stock alerts',
    pro: 'Auto reorder + 30-day forecasting'
  },
  {
    feature: 'Android Phones on Factory Floor',
    free: '1 phone',
    lite: 'Up to 5 phones',
    pro: 'Up to 50 phones'
  },
  {
    feature: 'Where Your Data is Stored',
    free: 'Your PC (fully private)',
    lite: 'Your PC (fully private)',
    pro: 'Your PC (cloud backup is optional)'
  },
];

export default function DownloadPage() {
  // ── ALL STATE PRESERVED ──
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showModal, setShowModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showApkQr, setShowApkQr] = useState(false);
  const [targetPlatform, setTargetPlatform] = useState<'windows' | 'android'>('windows');

  // ── HANDLER PRESERVED EXACTLY ──
  const handleStartDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;

    setSubmitting(true);
    try {
      await fetch('/api/download-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          businessName,
          city,
          platform: targetPlatform,
        })
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('noxis_lead_name', fullName.trim());
        localStorage.setItem('noxis_lead_phone', phone.trim());
        localStorage.setItem('noxis_lead_business', (businessName && businessName.trim()) ? businessName.trim() : `${fullName.trim()}'s Business`);
        localStorage.setItem('noxis_lead_platform', targetPlatform);
      }
    } catch {}

    window.location.href = targetPlatform === 'android' ? CLOUDFLARE_APK_URL : DOWNLOAD_ZIP_URL;
    setShowModal(false);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-300 selection:bg-[#08EBF6]/20 selection:text-white">
      <PublicNavbar />

      {/* ═══════════════════════════════════════
          HERO
      ═══════════════════════════════════════ */}
      <section className="relative pt-32 pb-20 px-6 max-w-5xl mx-auto">

        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#08EBF6]/8 blur-[160px] rounded-full pointer-events-none" />

        {/* Version pill */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-zinc-400 tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-[#08EBF6] animate-pulse" />
            Version 14.0.0 — Stable Release
          </div>
        </div>

        {/* Headline */}
        <div className="text-center space-y-5 mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.05]">
            Run Your Factory
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#08EBF6] via-[#5FA5FA] to-[#08EBF6]">
              Without the Internet
            </span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Noxis Hub runs on your Windows PC and connects to Android phones on
            the factory floor — no internet, no monthly fees, no server required.
          </p>
        </div>

        {/* Trust bar */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-14 text-[12px] text-zinc-500">
          {[
            { icon: HardDrive, label: 'Data stays on your PC' },
            { icon: Wifi, label: 'Works without internet' },
            { icon: Zap, label: 'Power cut recovery built in' },
            { icon: Globe, label: 'Pakistan & UAE ready' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon size={13} className="text-[#08EBF6]" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* ── DOWNLOAD CARDS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Windows PC Card */}
          <div className="group relative flex flex-col bg-[#070B12] border border-white/8 hover:border-[#08EBF6]/30 rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">

            {/* Top accent line */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#08EBF6]/40 to-transparent" />

            <div className="p-7 flex-1 space-y-6">

              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#08EBF6]/8 border border-[#08EBF6]/15 flex items-center justify-center shrink-0">
                  <Laptop size={22} className="text-[#08EBF6]" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base font-bold text-white tracking-tight">
                      Noxis Hub for Windows
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 uppercase tracking-wider">
                      Stable
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Main PC — stores all your business data
                  </p>
                </div>
              </div>

              {/* Spec grid */}
              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                {[
                  'Windows 10 & 11 (64-bit)',
                  '210 MB portable file',
                  'No installation needed',
                  '7-day free trial',
                ].map(spec => (
                  <div key={spec} className="flex items-center gap-2 text-[12px] text-zinc-400">
                    <Check size={12} className="text-[#08EBF6] shrink-0" />
                    <span>{spec}</span>
                  </div>
                ))}
              </div>

              {/* Setup steps */}
              <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Ready in 2 steps — no installer
                </p>
                <div className="space-y-2">
                  {[
                    'Right-click the downloaded file → Extract All',
                    'Open the folder → double-click NoxisHub.exe',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3 text-[12px] text-zinc-300">
                      <div className="w-5 h-5 rounded-md bg-[#08EBF6]/12 text-[#08EBF6] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="px-7 pb-7 pt-2">
              <button
                type="button"
                onClick={() => { setTargetPlatform('windows'); setShowModal(true); }}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#08EBF6] hover:bg-[#08EBF6]/90 text-black font-bold text-sm rounded-xl transition-all shadow-[0_4px_20px_rgba(8,235,246,0.2)] hover:shadow-[0_4px_28px_rgba(8,235,246,0.35)] hover:-translate-y-0.5 cursor-pointer"
              >
                <Download size={15} />
                Download for Windows
              </button>
              <p className="text-center text-[10px] text-zinc-600 mt-2.5">
                Portable file · runs without admin rights
              </p>
            </div>
          </div>

          {/* Android Card */}
          <div className="group relative flex flex-col bg-[#070B12] border border-white/8 hover:border-[#60A5FA]/30 rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">

            <div className="h-px bg-gradient-to-r from-transparent via-[#60A5FA]/40 to-transparent" />

            <div className="p-7 flex-1 space-y-6">

              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#60A5FA]/8 border border-[#60A5FA]/15 flex items-center justify-center shrink-0">
                    <Smartphone size={22} className="text-[#60A5FA]" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-base font-bold text-white tracking-tight">
                        Noxis Mobile
                      </h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/15 uppercase tracking-wider">
                        Android
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Floor companion for workers & supervisors
                    </p>
                  </div>
                </div>

                {/* QR toggle */}
                <button
                  type="button"
                  onClick={() => setShowApkQr(!showApkQr)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-white/5 hover:bg-white/8 text-zinc-400 border border-white/8 transition-colors shrink-0 cursor-pointer"
                >
                  <QrCode size={11} className="text-[#60A5FA]" />
                  {showApkQr ? 'Hide' : 'QR Code'}
                </button>
              </div>

              {/* Spec grid */}
              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                {[
                  'Android 8.0 and above',
                  '116 MB download',
                  'Connects on office Wi-Fi',
                  'Verified & signed APK',
                ].map(spec => (
                  <div key={spec} className="flex items-center gap-2 text-[12px] text-zinc-400">
                    <Check size={12} className="text-[#60A5FA] shrink-0" />
                    <span>{spec}</span>
                  </div>
                ))}
              </div>

              {/* QR or features */}
              {showApkQr ? (
                <div className="bg-white rounded-2xl p-5 flex items-center gap-5">
                  <div className="shrink-0 p-1 border border-zinc-200 rounded-lg">
                    <QRCode
                      value={CLOUDFLARE_APK_URL}
                      size={100}
                      bgColor="#FFFFFF"
                      fgColor="#030712"
                      level="M"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-zinc-900">
                      Scan on your Android
                    </p>
                    <p className="text-[11px] text-zinc-600 leading-relaxed">
                      Point your camera at this code to download straight to your phone — no cable needed.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    What the phone can do
                  </p>
                  {[
                    'Log worker production and record wage advances',
                    'Scan barcodes with the phone camera',
                    'Syncs with the PC in real time over Wi-Fi',
                  ].map(cap => (
                    <div key={cap} className="flex items-start gap-2.5 text-[12px] text-zinc-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#60A5FA] mt-1.5 shrink-0" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="px-7 pb-7 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTargetPlatform('android');
                  setShowModal(true);
                }}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-[#60A5FA] to-[#08EBF6] hover:opacity-95 text-black font-bold text-sm rounded-xl transition-all shadow-[0_4px_20px_rgba(96,165,250,0.2)] hover:shadow-[0_4px_28px_rgba(96,165,250,0.3)] hover:-translate-y-0.5 cursor-pointer"
              >
                <Download size={15} />
                Download for Android (APK)
              </button>
              <div className="flex items-center justify-between mt-2.5 px-0.5">
                <span className="text-[10px] text-zinc-600">noxis-preview.apk</span>
                <button
                  type="button"
                  onClick={() => setShowApkQr(!showApkQr)}
                  className="text-[10px] text-[#60A5FA] hover:underline cursor-pointer"
                >
                  {showApkQr ? 'Hide QR' : 'Scan from phone'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FEATURE TABLE
      ═══════════════════════════════════════ */}
      <section className="py-20 px-6 max-w-5xl mx-auto">

        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            What each plan includes
          </h2>
          <p className="text-sm text-zinc-500">
            Your first 7 days unlock everything. No payment required.
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 overflow-hidden bg-[#070B12]">
          {/* Table header */}
          <div className="grid grid-cols-4 border-b border-white/8 bg-black/40">
            <div className="p-4 col-span-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-600">
                Feature
              </span>
            </div>
            {[
              { label: 'Free', sub: 'After trial ends', color: 'text-zinc-400', border: '' },
              { label: 'Basic', sub: 'PKR 25,000/yr', color: 'text-zinc-300', border: '' },
              {
                label: 'Pro',
                sub: '7-day free trial',
                color: 'text-[#08EBF6]',
                border: 'bg-[#08EBF6]/5 border-x border-[#08EBF6]/15',
              },
            ].map(col => (
              <div key={col.label} className={`p-4 ${col.border}`}>
                <p className={`text-sm font-bold ${col.color}`}>{col.label}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{col.sub}</p>
              </div>
            ))}
          </div>

          {/* Rows */}
          {FEATURE_ROWS.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-4 border-b border-white/5 last:border-0 hover:bg-white/[0.015] transition-colors"
            >
              <div className="p-4 text-[12px] font-medium text-zinc-300 leading-snug">
                {row.feature}
              </div>
              <div className="p-4 text-[12px] text-zinc-500 leading-snug">
                {row.free}
              </div>
              <div className="p-4 text-[12px] text-zinc-300 leading-snug">
                {row.lite}
              </div>
              <div className="p-4 bg-[#08EBF6]/3 border-x border-[#08EBF6]/10 text-[12px] leading-snug">
                <div className="flex items-start gap-2 text-[#08EBF6]">
                  <Check size={13} className="shrink-0 mt-0.5" />
                  <span>{row.pro}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          HOW TRIAL + ACTIVATION WORKS
      ═══════════════════════════════════════ */}
      <section className="py-20 px-6 max-w-4xl mx-auto">

        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Trial then permanent license
          </h2>
          <p className="text-sm text-zinc-500">
            No surprises. Your data is never held hostage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Trial card */}
          <div className="relative p-7 bg-[#070B12] border border-[#08EBF6]/20 rounded-2xl space-y-3 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#08EBF6]/5 rounded-full blur-2xl pointer-events-none" />
            <div className="inline-block px-2.5 py-1 rounded-lg bg-[#08EBF6]/10 text-[#08EBF6] text-[10px] font-bold uppercase tracking-wider">
              Days 1 – 7
            </div>
            <h3 className="text-base font-bold text-white">Everything unlocked</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Download, extract, and run — no registration, no credit card. Every
              feature is available so you can test it properly on your factory floor
              with your real workers and real stock.
            </p>
          </div>

          {/* After trial card */}
          <div className="relative p-7 bg-[#070B12] border border-white/8 rounded-2xl space-y-3 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/2 rounded-full blur-2xl pointer-events-none" />
            <div className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              Day 8 onwards
            </div>
            <h3 className="text-base font-bold text-white">Free plan or permanent key</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              To keep advanced features, share your machine ID with us on WhatsApp
              and we will send a permanent license key. If you do not upgrade, the
              free plan keeps your billing counter and all your existing records
              accessible forever.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          3-STEP ACTIVATION
      ═══════════════════════════════════════ */}
      <section className="py-20 px-6 max-w-4xl mx-auto">

        <div className="text-center mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            How to activate your license
          </h2>
          <p className="text-sm text-zinc-500">
            Works without internet · Permanent · Tied to your PC
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            {
              step: '01',
              title: 'Copy your machine ID',
              body: 'Open Noxis Hub → Settings → License. Click "Copy Machine ID" — it is a unique code for your specific PC.',
              color: '#08EBF6',
            },
            {
              step: '02',
              title: 'Send it on WhatsApp',
              body: 'WhatsApp your machine ID and business name to our team. Pay via bank transfer or JazzCash.',
              color: '#25D366',
            },
            {
              step: '03',
              title: 'Paste and unlock',
              body: 'We send a license key by WhatsApp. Paste it into Settings → License. Your plan unlocks permanently in seconds.',
              color: '#60A5FA',
            },
          ].map(item => (
            <div
              key={item.step}
              className="relative p-6 bg-[#070B12] border border-white/8 rounded-2xl space-y-3 overflow-hidden group hover:border-white/15 transition-colors"
            >
              <div
                className="text-4xl font-black opacity-[0.06] absolute -top-2 -right-2 select-none pointer-events-none"
                style={{ color: item.color, fontSize: 80 }}
              >
                {item.step}
              </div>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black"
                style={{
                  background: item.color + '15',
                  border: `1px solid ${item.color}25`,
                  color: item.color,
                }}
              >
                {item.step}
              </div>
              <h4 className="text-sm font-bold text-white">{item.title}</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <a
            href={WHATSAPP_SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#25D366]/8 hover:bg-[#25D366]/15 border border-[#25D366]/25 text-[#25D366] text-sm font-semibold rounded-xl transition-all"
          >
            <MessageCircle size={16} />
            Contact us on WhatsApp
            <span className="text-[#25D366]/60 text-xs">+92 326 4742678</span>
          </a>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SYSTEM REQUIREMENTS
      ═══════════════════════════════════════ */}
      <section className="py-20 px-6 max-w-4xl mx-auto">

        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            What you need to run it
          </h2>
          <p className="text-sm text-zinc-500">
            Works on standard office PCs and budget Android phones
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* PC */}
          <div className="p-6 bg-[#070B12] border border-white/8 rounded-2xl space-y-4">
            <div className="flex items-center gap-2.5">
              <Laptop size={16} className="text-[#08EBF6]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Windows PC
              </h3>
            </div>
            <div className="space-y-3">
              {[
                ['Windows version', 'Windows 10 or 11 (64-bit)'],
                ['Processor', 'Intel Core i3 (4th generation or newer)'],
                ['Memory', '4 GB minimum — 8 GB recommended'],
                ['Storage', '500 MB free space'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between text-xs border-b border-white/4 pb-2.5">
                  <span className="text-zinc-500">{label}</span>
                  <span className="text-zinc-200 font-medium text-right max-w-[55%]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Android */}
          <div className="p-6 bg-[#070B12] border border-white/8 rounded-2xl space-y-4">
            <div className="flex items-center gap-2.5">
              <Smartphone size={16} className="text-[#60A5FA]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Android Phone
              </h3>
            </div>
            <div className="space-y-3">
              {[
                ['Android version', 'Android 8.0 (2017) or newer'],
                ['Processor type', 'ARM64, ARMv7, or x86_64'],
                ['Camera', 'Autofocus camera for barcode scanning'],
                ['Connection', 'Same Wi-Fi network as the PC'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between text-xs border-b border-white/4 pb-2.5">
                  <span className="text-zinc-500">{label}</span>
                  <span className="text-zinc-200 font-medium text-right max-w-[55%]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FAQ
      ═══════════════════════════════════════ */}
      <section className="py-20 px-6 max-w-3xl mx-auto">

        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Common questions
          </h2>
          <p className="text-sm text-zinc-500">
            About offline reliability, privacy, and license transfers
          </p>
        </div>

        <div className="space-y-2">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="border border-white/7 rounded-xl overflow-hidden bg-[#070B12] transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 text-sm font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={15}
                  className={`shrink-0 transition-transform duration-200 ${openFaq === idx ? 'rotate-180 text-[#08EBF6]' : 'text-zinc-600'}`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          BOTTOM CTA STRIP
      ═══════════════════════════════════════ */}
      <section className="py-16 px-6 max-w-3xl mx-auto text-center space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Ready to try it?
          </h2>
          <p className="text-sm text-zinc-400">
            Download now. No sign-up, no payment, no internet needed.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2.5 px-7 py-3.5 bg-[#08EBF6] hover:bg-[#08EBF6]/90 text-black font-bold text-sm rounded-xl transition-all shadow-[0_4px_20px_rgba(8,235,246,0.2)] cursor-pointer"
          >
            <Download size={15} />
            Download for Windows
          </button>
          <button
            type="button"
            onClick={() => {
              setTargetPlatform('android');
              setShowModal(true);
            }}
            className="flex items-center gap-2.5 px-7 py-3.5 bg-white/6 hover:bg-white/9 border border-white/10 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer"
          >
            <Download size={15} />
            Download for Android
          </button>
        </div>
        <p className="text-xs text-zinc-600">
          Free for 7 days · No data uploaded · Your PC stores everything
        </p>
      </section>

      {/* ═══════════════════════════════════════
          DOWNLOAD MODAL — ALL LOGIC PRESERVED
      ═══════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#070B12] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

            {/* Top gradient bar */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#08EBF6]/50 to-transparent" />

            <div className="p-7">

              {/* Close */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              {/* Modal header */}
              <div className="flex items-start gap-4 mb-7">
                <div className="w-11 h-11 rounded-xl bg-[#08EBF6]/8 border border-[#08EBF6]/15 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} className="text-[#08EBF6]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {targetPlatform === 'android' ? 'Download Noxis Mobile (Android APK)' : 'Start your free trial'}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {targetPlatform === 'android'
                      ? 'Enter your factory details to register your mobile handheld and sync with your PC Hub.'
                      : 'We use this to send you a license key if you choose to upgrade later.'}
                  </p>
                </div>
              </div>

              {/* Form — onSubmit handler preserved */}
              <form onSubmit={handleStartDownload} className="space-y-4">

                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    <User size={11} className="text-[#08EBF6]" />
                    Your name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariq Mehmood"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/8 rounded-xl text-sm text-white focus:outline-none focus:border-[#08EBF6]/50 transition-colors placeholder:text-zinc-600"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    <Phone size={11} className="text-[#08EBF6]" />
                    WhatsApp number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+92 300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/8 rounded-xl text-sm text-white focus:outline-none focus:border-[#08EBF6]/50 transition-colors placeholder:text-zinc-600"
                  />
                  <p className="text-[10px] text-zinc-600 mt-1.5">
                    Used only for license keys and support — never shared.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      <Building size={11} className="text-[#08EBF6]" />
                      Business name
                    </label>
                    <input
                      type="text"
                      placeholder="Al-Madina Garments"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-black/40 border border-white/8 rounded-xl text-sm text-white focus:outline-none focus:border-[#08EBF6]/50 transition-colors placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      <MapPin size={11} className="text-[#08EBF6]" />
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="Lahore"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2.5 bg-black/40 border border-white/8 rounded-xl text-sm text-white focus:outline-none focus:border-[#08EBF6]/50 transition-colors placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-gradient-to-r from-[#08EBF6] to-[#5FA5FA] hover:opacity-95 text-black font-bold text-sm rounded-xl transition-all shadow-[0_4px_20px_rgba(8,235,246,0.25)] disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Starting download...
                      </>
                    ) : (
                      <>
                        <Download size={15} />
                        Download Noxis Hub
                        <ArrowRight size={13} />
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500 pt-1">
                  <Lock size={11} className="text-emerald-400" />
                  No payment · Portable file · Runs offline
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════ */}
      <footer className="border-t border-white/5 bg-[#020304] py-7 text-center text-[11px] text-zinc-600">
        <p>© {new Date().getFullYear()} Omnora — Industrial software for textile mills and wholesale traders.</p>
      </footer>
    </div>
  );
}